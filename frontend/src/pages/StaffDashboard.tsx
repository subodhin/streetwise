import { useCallback, useEffect, useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://streetwise.streetwise-city.workers.dev";

type Report = {
  id: string;
  text: string;
  lat: number;
  lng: number;
  photo: string | null;
  type: string;
  size: string;
  priority: number;
  zone: string;
  confidence: number;
  reason: string;
  route: string;
  triaged_by: "model" | "rules";
  status: string;
  created_at: string;
  updated_at: string;
};

export default function StaffDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");

  const token = sessionStorage.getItem("streetwise_token");

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/staff/reports`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(
          response.status === 401 || response.status === 403
            ? "Your session is invalid or expired. Please sign in again."
            : "Unable to load the review queue.",
        );
      }

      const data = await response.json();
      setReports(Array.isArray(data.reports) ? data.reports : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load reports.",
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      window.location.href = "/staff/login";
      return;
    }

    void loadReports();
  }, [token, loadReports]);

  async function reviewReport(id: string, action: "approve" | "reject") {
    setBusyId(id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/staff/reports/${encodeURIComponent(id)}/review`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "The review action failed.");
      }

      setReports((current) => current.filter((report) => report.id !== id));
      setMessage(`Report ${id} ${action === "approve" ? "approved" : "rejected"}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The review action failed.");
    } finally {
      setBusyId("");
    }
  }

function signOut() {
  sessionStorage.removeItem("streetwise_token");
  sessionStorage.removeItem("streetwise_user");
  window.location.href = "/staff/login";
}

  return (
    <main className="staff-page">
      <header className="staff-header">
        <div>
          <p className="staff-eyebrow">STREETWISE · CITY OPERATIONS</p>
          <h1>Review queue</h1>
          <p>Review reports flagged for human approval.</p>
        </div>

        <div className="staff-header-actions">
          <button type="button" onClick={() => void loadReports()}>
            Refresh
          </button>
          <button type="button" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>

      <section className="staff-summary">
        <div>
          <span>Awaiting review</span>
          <strong>{loading ? "—" : reports.length}</strong>
        </div>
        <p>Reports are ordered by priority, with the most urgent first.</p>
      </section>

      {message && <p className="staff-message">{message}</p>}
      {error && <p className="staff-error" role="alert">{error}</p>}
      {loading && <p>Loading review queue…</p>}

      {!loading && !error && reports.length === 0 && (
        <section className="staff-empty">
          <h2>Queue is clear</h2>
          <p>There are no reports awaiting review.</p>
        </section>
      )}

      <section className="staff-report-list">
        {reports.map((report) => (
          <article className="staff-report-card" key={report.id}>
            <div className="staff-report-heading">
              <span className={`priority priority-${report.priority}`}>
                P{report.priority}
              </span>
              <h2>{report.type.replaceAll("_", " ")}</h2>
              <span className="staff-zone">{report.zone}</span>
            </div>

            <p className="staff-report-text">{report.text}</p>

            <dl className="staff-report-details">
              <div>
                <dt>Size</dt>
                <dd>{report.size}</dd>
              </div>
              <div>
                <dt>Confidence</dt>
                <dd>{Math.round(report.confidence * 100)}%</dd>
              </div>
              <div>
                <dt>Classified by</dt>
                <dd>{report.triaged_by}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{report.status.replaceAll("_", " ")}</dd>
              </div>
            </dl>

            <p className="staff-reason">
              <strong>Classification reason:</strong>{" "}
              {report.reason || "No reason supplied."}
            </p>

            {report.photo && (
              <a href={report.photo} target="_blank" rel="noreferrer">
                View report photo
              </a>
            )}

            <a
              href={`https://www.openstreetmap.org/?mlat=${report.lat}&mlon=${report.lng}#map=17/${report.lat}/${report.lng}`}
              target="_blank"
              rel="noreferrer"
            >
              View location on map
            </a>

            <div className="staff-review-actions">
              <button
                type="button"
                disabled={busyId === report.id}
                onClick={() => void reviewReport(report.id, "approve")}
              >
                {busyId === report.id ? "Saving…" : "Approve"}
              </button>

              <button
                type="button"
                className="staff-reject-button"
                disabled={busyId === report.id}
                onClick={() => {
                  if (window.confirm("Reject this report?")) {
                    void reviewReport(report.id, "reject");
                  }
                }}
              >
                Reject
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}