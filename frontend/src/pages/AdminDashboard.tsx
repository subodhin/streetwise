import { useCallback, useEffect, useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://streetwise.streetwise-city.workers.dev";

type Zone = {
  id: string;
  name: string;
  status: "active" | "paused";
  pause_reason: string | null;
  paused_until: string | null;
  crew: string;
  status_date: string | null;
  updated_at: string | null;
};

type Setting = {
  key: string;
  value: string;
  updated_at: string | null;
};

type AuditEvent = {
  id: string;
  resource_id: string | null;
  resource_type: string;
  actor: string;
  action: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
};

type Tab = "zones" | "settings" | "audit";

export default function AdminDashboard() {
  const token = sessionStorage.getItem("streetwise_token");
  const [tab, setTab] = useState<Tab>("zones");
  const [zones, setZones] = useState<Zone[]>([]);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pauseZone, setPauseZone] = useState<Zone | null>(null);
  const [pauseReason, setPauseReason] = useState("");

  const request = useCallback(
    async (path: string, options: RequestInit = {}) => {
      const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(options.body ? { "Content-Type": "application/json" } : {}),
          ...options.headers,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || `Request failed (${response.status}).`);
      }

      return data;
    },
    [token],
  );

  const loadTab = useCallback(async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (tab === "zones") {
        const data = await request("/api/admin/zones");
        setZones(Array.isArray(data.zones) ? data.zones : []);
      } else if (tab === "settings") {
        const data = await request("/api/admin/settings");
        setSettings(Array.isArray(data.settings) ? data.settings : []);
      } else {
        const data = await request("/api/admin/audit-log?limit=100");
        setEvents(Array.isArray(data.events) ? data.events : []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load admin data.");
    } finally {
      setLoading(false);
    }
  }, [request, tab]);

  useEffect(() => {
    if (!token) {
      window.location.href = "/staff/login";
      return;
    }

    const rawUser = sessionStorage.getItem("streetwise_user");

    try {
      const user = rawUser ? JSON.parse(rawUser) : null;

      if (user?.role !== "admin") {
        window.location.href = "/staff";
        return;
      }
    } catch {
      window.location.href = "/staff/login";
      return;
    }

    void loadTab();
  }, [token, loadTab]);

  async function changeZoneStatus(zone: Zone, status: "active" | "paused") {
    setBusyId(zone.id);
    setError("");
    setMessage("");

    try {
      let reason = "";

      if (status === "paused") {
        reason = pauseReason.trim();

        if (!reason) {
          setPauseZone(zone);
          setError("Enter a reason before pausing this zone.");
          return;
        }
      }

      await request(`/api/admin/zones/${encodeURIComponent(zone.id)}`, {
        method: "PUT",
        body: JSON.stringify({
          status,
          pause_reason: status === "paused" ? reason : "",
        }),
      });

      setPauseZone(null);
      setPauseReason("");
      setMessage(
        `${zone.name} ${status === "paused" ? "paused" : "activated"} successfully.`,
      );

      await loadTab();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update zone.");
    } finally {
      setBusyId("");
    }
  }

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const settingsObject = Object.fromEntries(
        settings.map((setting) => [setting.key, setting.value]),
      );

      await request("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ settings: settingsObject }),
      });

      setMessage("Settings saved successfully.");
      await loadTab();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save settings.");
    }
  }

  function updateSetting(key: string, value: string) {
    setSettings((current) =>
      current.map((setting) =>
        setting.key === key ? { ...setting, value } : setting,
      ),
    );
  }

  function logout() {
    sessionStorage.removeItem("streetwise_token");
    sessionStorage.removeItem("streetwise_user");
    window.location.href = "/staff/login";
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <a className="admin-brand" href="/">
          <span className="admin-brand-icon">S</span>
          <span>
            <strong>Streetwise</strong>
            <small>ADMINISTRATION</small>
          </span>
        </a>

        <div className="admin-header-actions">
          <span className="admin-role">Administrator</span>
          <button type="button" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>

      <section className="admin-content">
        <div className="admin-title">
          <div>
            <span className="admin-eyebrow">CITY OPERATIONS</span>
            <h1>Administration</h1>
            <p>Manage service zones, system thresholds, and activity.</p>
          </div>
          <a href="/staff">Staff dashboard →</a>
        </div>

        <nav className="admin-tabs" aria-label="Admin sections">
          <button
            className={tab === "zones" ? "active" : ""}
            onClick={() => setTab("zones")}
          >
            Zones
          </button>
          <button
            className={tab === "settings" ? "active" : ""}
            onClick={() => setTab("settings")}
          >
            Settings
          </button>
          <button
            className={tab === "audit" ? "active" : ""}
            onClick={() => setTab("audit")}
          >
            Audit log
          </button>
        </nav>

        {error && <p className="admin-message error">{error}</p>}
        {message && <p className="admin-message success">{message}</p>}
        {loading && <p className="admin-message">Loading…</p>}

        {!loading && tab === "zones" && (
          <section className="admin-card">
            <div className="admin-card-heading">
              <h2>Service zones</h2>
              <span>{zones.length} zones</span>
            </div>

            {zones.map((zone) => (
              <article className="admin-zone" key={zone.id}>
                <div>
                  <div className="admin-zone-title">
                    <strong>{zone.name}</strong>
                    <span
                      className={`admin-status ${zone.status}`}
                    >
                      {zone.status}
                    </span>
                  </div>
                  <p>
                    {zone.id} · Crew: {zone.crew || "Unassigned"}
                  </p>
                  {zone.pause_reason && (
                    <p>Pause reason: {zone.pause_reason}</p>
                  )}
                  {zone.paused_until && (
                    <p>Paused until: {zone.paused_until}</p>
                  )}
                </div>

                <div className="admin-zone-actions">
                  {zone.status === "active" ? (
                    <button
                      disabled={busyId === zone.id}
                      onClick={() => {
                        setPauseZone(zone);
                        setPauseReason("");
                        setError("");
                      }}
                    >
                      Pause zone
                    </button>
                  ) : (
                    <button
                      disabled={busyId === zone.id}
                      onClick={() => void changeZoneStatus(zone, "active")}
                    >
                      Activate zone
                    </button>
                  )}
                </div>

                {pauseZone?.id === zone.id && (
                  <div className="admin-pause-form">
                    <label htmlFor={`reason-${zone.id}`}>
                      Reason for pausing
                    </label>
                    <input
                      id={`reason-${zone.id}`}
                      value={pauseReason}
                      maxLength={500}
                      onChange={(event) => setPauseReason(event.target.value)}
                      placeholder="Enter the reason"
                    />
                    <button
                      disabled={busyId === zone.id || !pauseReason.trim()}
                      onClick={() =>
                        void changeZoneStatus(zone, "paused")
                      }
                    >
                      Confirm pause
                    </button>
                    <button
                      className="secondary"
                      onClick={() => {
                        setPauseZone(null);
                        setPauseReason("");
                        setError("");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </article>
            ))}

            {!zones.length && <p>No zones found.</p>}
          </section>
        )}

        {!loading && tab === "settings" && (
          <section className="admin-card">
            <div className="admin-card-heading">
              <h2>System settings</h2>
              <span>{settings.length} settings</span>
            </div>

            <form onSubmit={saveSettings}>
              {settings.map((setting) => (
                <div className="admin-setting" key={setting.key}>
                  <label htmlFor={`setting-${setting.key}`}>
                    {setting.key.replaceAll("_", " ")}
                    <small>{setting.key}</small>
                  </label>
                  <input
                    id={`setting-${setting.key}`}
                    value={setting.value}
                    maxLength={1000}
                    onChange={(event) =>
                      updateSetting(setting.key, event.target.value)
                    }
                  />
                </div>
              ))}

              <button type="submit">Save settings</button>
            </form>

            {!settings.length && <p>No settings found.</p>}
          </section>
        )}

        {!loading && tab === "audit" && (
          <section className="admin-card">
            <div className="admin-card-heading">
              <h2>Audit log</h2>
              <span>Latest {events.length} events</span>
            </div>

            {!events.length && <p>No audit events found.</p>}

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Actor</th>
                    <th>Action</th>
                    <th>Resource</th>
                    <th>Changes</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id}>
                      <td>{event.created_at}</td>
                      <td>{event.actor}</td>
                      <td>{event.action}</td>
                      <td>
                        {event.resource_type}
                        {event.resource_id ? ` · ${event.resource_id}` : ""}
                      </td>
                      <td>
                        <details>
                          <summary>View</summary>
                          <pre>
                            {JSON.stringify(
                              {
                                old: event.old_value,
                                new: event.new_value,
                              },
                              null,
                              2,
                            )}
                          </pre>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}