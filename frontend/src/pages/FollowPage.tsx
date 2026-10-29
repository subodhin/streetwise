
import { useEffect, useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://streetwise.streetwise-city.workers.dev";

type Report = {
  id: string;
  text: string;
  type: string;
  size: string;
  priority: number;
  zone: string;
  status: string;
  reason: string;
  created_at: string;
  updated_at: string;
};

type TimelineEvent = {
  action: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
};

type FollowResponse = {
  report: Report;
  timeline: TimelineEvent[];
};

function FollowPage() {
  const [data, setData] = useState<FollowResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const pathParts = window.location.pathname.split("/");
    const reportId = pathParts[pathParts.length - 1];
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!reportId || !token) {
      setError("This follow-up link is incomplete or invalid.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    fetch(
      `${API_URL}/api/reports/${encodeURIComponent(reportId)}/follow?token=${encodeURIComponent(token)}`,
      { signal: controller.signal },
    )
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "Report not found. Check your follow-up link."
              : "Unable to retrieve this report. Please try again later.",
          );
        }

        return (await response.json()) as FollowResponse;
      })
      .then(setData)
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;

        setError(
          err instanceof Error
            ? err.message
            : "An unexpected error occurred.",
        );
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  return (
    <main className="follow-page">
      <header className="follow-header">
        <a className="follow-brand" href="/">
          <span className="brand-icon">S</span>
          <span>
            <strong>Streetwise</strong>
            <small>COLOMBO · CITY OPERATIONS</small>
          </span>
        </a>

        <a className="follow-back" href="/">
          Back to map
        </a>
      </header>

      <section className="follow-content">
        <span className="eyebrow">CITIZEN REPORT TRACKING</span>
        <h1>Track your report</h1>
        <p className="follow-subtitle">
          View your report status and its progress over time.
        </p>

        {loading && <p className="follow-message">Loading report details…</p>}

        {error && !loading && (
          <div className="follow-error" role="alert">
            <h2>Unable to load report</h2>
            <p>{error}</p>
            <a href="/">Return to the public map</a>
          </div>
        )}

        {data && !loading && (
          <>
            <article className="follow-card">
              <div className="follow-card-top">
                <span className="eyebrow">REPORT ID</span>
                <strong>{data.report.id}</strong>
              </div>

              <div className="follow-status-row">
                <span className={`follow-status status-${data.report.status}`}>
                  {data.report.status.replaceAll("_", " ")}
                </span>
                <span className={`priority priority-${data.report.priority}`}>
                  P{data.report.priority}
                </span>
              </div>

              <h2>{data.report.type.replaceAll("_", " ")}</h2>
              <p className="follow-description">{data.report.text}</p>

              <div className="follow-details">
                <div>
                  <span>Zone</span>
                  <strong>{data.report.zone}</strong>
                </div>
                <div>
                  <span>Size</span>
                  <strong>{data.report.size}</strong>
                </div>
                <div>
                  <span>Submitted</span>
                  <strong>
                    {new Date(data.report.created_at).toLocaleString()}
                  </strong>
                </div>
              </div>

              {data.report.reason && (
                <div className="follow-reason">
                  <span>Assessment</span>
                  <p>{data.report.reason}</p>
                </div>
              )}
            </article>

            <section className="follow-timeline">
              <h2>Report timeline</h2>

              {data.timeline.length === 0 ? (
                <p className="follow-message">No updates are available yet.</p>
              ) : (
                <ol>
                  {data.timeline.map((event, index) => (
                    <li key={`${event.created_at}-${index}`}>
                      <span className="timeline-dot" />
                      <div>
                        <strong>{event.action.replaceAll("_", " ")}</strong>
                        <time>
                          {new Date(event.created_at).toLocaleString()}
                        </time>
                        {event.new_value && (
                          <p>{formatTimelineValue(event.new_value)}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}

function formatTimelineValue(value: string): string {
  try {
    const parsed: unknown = JSON.parse(value);

    if (typeof parsed === "object" && parsed !== null) {
      const details = parsed as Record<string, unknown>;

      return Object.entries(details)
        .map(([key, item]) => `${key.replaceAll("_", " ")}: ${String(item)}`)
        .join(" · ");
    }
  } catch {
    // Display ordinary text when the timeline value isn't JSON.
  }

  return value;
}

export default FollowPage;
