import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "data" / "past-reports.json"


def sql_quote(value):
    if value is None:
        return "NULL"
    if isinstance(value, (int, float)):
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"


with SOURCE.open("r", encoding="utf-8") as f:
    reports = json.load(f)["reports"]

total = len(reports)

for index, report in enumerate(reports, start=1):
    size = "medium"
    confidence = 0.5
    reason = "Historical sample; AI triage metadata unavailable"
    route = "publish"
    triaged_by = "rules"

    status = "fixed" if report["status"] == "fixed" else "published"
    created_at = report["reported_at"]
    updated_at = report.get("fixed_at") or created_at

    fields = [
        report["id"],
        report["text"],
        report["lat"],
        report["lng"],
        report["type"],
        size,
        report["priority"],
        report["zone"],
        confidence,
        reason,
        route,
        triaged_by,
        status,
        created_at,
        updated_at,
    ]

    values = ", ".join(sql_quote(value) for value in fields)

    sql = f"""
    INSERT INTO reports (
        id, text, lat, lng, type, size, priority, zone,
        confidence, reason, route, triaged_by, status,
        created_at, updated_at
    )
    VALUES ({values})
    ON CONFLICT(id) DO UPDATE SET
        text = excluded.text,
        lat = excluded.lat,
        lng = excluded.lng,
        type = excluded.type,
        size = excluded.size,
        priority = excluded.priority,
        zone = excluded.zone,
        confidence = excluded.confidence,
        reason = excluded.reason,
        route = excluded.route,
        triaged_by = excluded.triaged_by,
        status = excluded.status,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at;
    """

    print(f"[{index}/{total}] Importing {report['id']}...", flush=True)

    result = subprocess.run(
        [
            "npx",
            "wrangler",
            "d1",
            "execute",
            "streetwise-db",
            "--remote",
            f"--command={sql}",
        ],
        cwd=ROOT,
        text=True,
        capture_output=True,
    )

    if result.returncode != 0:
        print(f"\nFAILED on report {report['id']}", file=sys.stderr)
        print(result.stdout, file=sys.stderr)
        print(result.stderr, file=sys.stderr)
        sys.exit(result.returncode)

print(f"\nSuccessfully processed all {total} historical reports.")