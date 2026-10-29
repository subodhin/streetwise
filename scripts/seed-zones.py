import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
zones_file = ROOT / "data" / "zones.json"

with zones_file.open("r", encoding="utf-8") as f:
    data = json.load(f)

zones = data["zones"]

for zone in zones:
    polygon = json.dumps(zone["polygon"], separators=(",", ":"))

    sql_values = [
        zone["id"],
        zone["name"],
        polygon,
        zone["status"],
        zone.get("pause_reason"),
        zone.get("status_date"),
        zone["crew"],
    ]

    def sql_quote(value):
        if value is None:
            return "NULL"
        return "'" + str(value).replace("'", "''") + "'"

    values = ", ".join(sql_quote(value) for value in sql_values)

    sql = f"""
    INSERT INTO zones
        (id, name, polygon, status, pause_reason, status_date, crew)
    VALUES ({values})
    ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        polygon = excluded.polygon,
        status = excluded.status,
        pause_reason = excluded.pause_reason,
        status_date = excluded.status_date,
        crew = excluded.crew;
    """

    subprocess.run(
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
        check=True,
    )

print(f"Successfully seeded {len(zones)} zones.")