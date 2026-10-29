
import { useEffect, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import "./App.css";
import CityMap from "./components/CityMap";
import FollowPage from "./pages/FollowPage";
import ReportForm from "./pages/ReportForm";
import StaffLogin from "./pages/StaffLogin";
import StaffDashboard from "./pages/StaffDashboard";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://streetwise.streetwise-city.workers.dev";

type Report = {
  id: string;
  text: string;
  lat: number;
  lng: number;
  type: string;
  size: string;
  priority: number;
  zone: string;
  confidence: number;
  route: string;
  status: string;
  created_at: string;
};

function App() {
   const path = window.location.pathname;
   if (path === "/staff/login") {
  return <StaffLogin />;
}
if (path === "/staff") {
  return <StaffDashboard />;
}

  if (path.startsWith("/follow/")) {
    return <FollowPage />;
  }

  if (path === "/report") {
    return <ReportForm />;
  }

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/reports`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Unable to load reports.");
        }
        return response.json();
      })
      .then((data) => {
        setReports(Array.isArray(data) ? data : data.reports ?? []);
      })
      .catch(() => setError("Could not load reports. Check the API connection."))
      .finally(() => setLoading(false));
  }, []);

  const openCount = reports.filter(
    (report) => !["fixed", "rejected", "merged"].includes(report.status),
  ).length;

  const reviewCount = reports.filter(
    (report) =>
      report.status === "needs_review" || report.route === "needs_approval",
  ).length;

  const fixedCount = reports.filter(
    (report) => report.status === "fixed",
  ).length;

  return (
    <main className="app">
      <aside className="sidebar">
        <header className="brand">
          <div className="brand-icon">S</div>
          <div>
            <h1>Streetwise</h1>
            <p>COLOMBO · CITY OPERATIONS</p>
          </div>
        </header>

        <section className="intro">
          <span className="eyebrow">PUBLIC WORKS DASHBOARD</span>
          <h2>Fixing the city, report by report.</h2>
          <p>Track neighbourhood issues and help keep Colombo moving.</p>
        </section>

        <section className="stats">
          <div className="stat">
            <span>Open reports</span>
            <strong>{loading ? "—" : openCount}</strong>
          </div>
          <div className="stat">
            <span>Need review</span>
            <strong>{loading ? "—" : reviewCount}</strong>
          </div>
          <div className="stat">
            <span>Fixed</span>
            <strong>{loading ? "—" : fixedCount}</strong>
          </div>
        </section>

        <section className="report-section">
          <div className="section-heading">
            <h3>Recent reports</h3>
            <span>{reports.length}</span>
          </div>

          {loading && <p className="message">Loading reports…</p>}
          {error && <p className="message error">{error}</p>}

          {!loading && !error && reports.length === 0 && (
            <p className="message">No reports found.</p>
          )}

          <div className="report-list">
            {reports.map((report) => (
              <article
                className={`report-card ${
                  selectedReport?.id === report.id ? "selected" : ""
                }`}
                key={report.id}
                onClick={() => setSelectedReport(report)}
                role="button"
                tabIndex={0}
                aria-pressed={selectedReport?.id === report.id}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedReport(report);
                  }
                }}
              >
                <div className="report-top">
                  <span className={`priority priority-${report.priority}`}>
                    P{report.priority}
                  </span>
                  <span className="report-type">
                    {report.type.replaceAll("_", " ")}
                  </span>
                </div>

                <p>{report.text}</p>

                <div className="report-meta">
                  <span>{report.zone}</span>
                  <span>{report.status.replaceAll("_", " ")}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </aside>

      <section className="map-panel">
        <div className="map-toolbar">
          <div>
            <span className="eyebrow">LIVE OVERVIEW</span>
            <h2>Colombo service map</h2>
          </div>

          <div className="toolbar-actions">
  <a className="report-button" href="/report">
    + Report an issue
  </a>

  <span className="connection-status">
    <span className="status-dot" />
    API connected
  </span>
</div>
        </div>

        <div className="map-container">
          <CityMap
            reports={reports}
            selectedReport={selectedReport}
          />
        </div>
      </section>
    </main>
  );
}

export default App;
