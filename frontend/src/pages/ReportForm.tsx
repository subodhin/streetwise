
import { useState } from "react";
import CityMap from "../components/CityMap";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://streetwise.streetwise-city.workers.dev";



function ReportForm() {
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState({
    lat: 6.935,
    lng: 79.852,
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    id: string;
    status: string;
    follow_url: string;
  } | null>(null);

  const handlePhotoChange = (file: File | undefined) => {
    setError("");

    if (!file) {
      setPhoto(null);
      return;
    }

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setError("Please select a JPG or PNG image.");
      setPhoto(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("The photo must be 5 MB or smaller.");
      setPhoto(null);
      return;
    }

    setPhoto(file);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const text = description.trim();

    if (text.length < 10 || text.length > 500) {
      setError("Description must be between 10 and 500 characters.");
      return;
    }

    setSubmitting(true);

    try {
      /*
       * The backend currently accepts photo_url, not binary uploads.
       * Do not pretend the selected photo was uploaded.
       */
      const response = await fetch(`${API_URL}/api/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          lat: location.lat,
          lng: location.lng,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to submit your report.");
      }

      setResult({
        id: data.id,
        status: data.status,
        follow_url: data.follow_url,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    const followUrl = new URL(result.follow_url, window.location.origin);

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
        </header>

        <section className="follow-content">
          <span className="eyebrow">REPORT SUBMITTED</span>
          <h1>Thank you for helping Colombo.</h1>
          <p className="follow-subtitle">
            Your report has been recorded. Save your private tracking link.
          </p>

          <article className="follow-card">
            <div className="follow-card-top">
              <span className="eyebrow">REPORT ID</span>
              <strong>{result.id}</strong>
            </div>

            <div className="follow-status-row">
              <span className="follow-status">
                {result.status.replaceAll("_", " ")}
              </span>
            </div>

            <p className="follow-description">
              Keep your tracking link private so only someone with the link can
              view this report's details.
            </p>

            <a className="submit-button" href={followUrl.href}>
              Track your report
            </a>
            <p className="follow-message">
              Save or bookmark the tracking page before leaving.
            </p>
          </article>
        </section>
      </main>
    );
  }

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

      <section className="follow-content report-form-content">
        <span className="eyebrow">CITIZEN REPORTING</span>
        <h1>Report a city issue</h1>
        <p className="follow-subtitle">
          Describe the problem and select its location on the map.
        </p>

        <form className="follow-card citizen-form" onSubmit={handleSubmit}>
          <label htmlFor="report-description">Description</label>
          <textarea
            id="report-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            minLength={10}
            maxLength={500}
            rows={5}
            placeholder="Describe the issue and where it is happening…"
            required
          />
          <div className="character-count">{description.length}/500</div>

          <label htmlFor="report-photo">Photo (optional)</label>
          <input
            id="report-photo"
            type="file"
            accept="image/jpeg,image/png"
            onChange={(event) =>
              handlePhotoChange(event.target.files?.[0])
            }
          />
          <p className="form-hint">
            JPG or PNG, maximum 5 MB. Photo upload is not yet connected, so
            your selected photo will not be submitted.
          </p>

          {photo && (
            <p className="form-hint">Selected: {photo.name}</p>
          )}

          <label>Choose the location</label>
          <p className="form-hint">
            Click the map to set the report location.
          </p>

          <div className="location-map">
            <CityMap
              reports={[]}
              selectedReport={null}
              onLocationSelect={(lat, lng) => setLocation({ lat, lng })}
            />
          </div>

          <div className="coordinate-grid">
            <div>
              <label htmlFor="report-lat">Latitude</label>
              <input
                id="report-lat"
                type="number"
                step="any"
                value={location.lat}
                onChange={(event) =>
                  setLocation((current) => ({
                    ...current,
                    lat: Number(event.target.value),
                  }))
                }
                required
              />
            </div>
            <div>
              <label htmlFor="report-lng">Longitude</label>
              <input
                id="report-lng"
                type="number"
                step="any"
                value={location.lng}
                onChange={(event) =>
                  setLocation((current) => ({
                    ...current,
                    lng: Number(event.target.value),
                  }))
                }
                required
              />
            </div>
          </div>

          {error && (
            <p className="follow-error form-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="submit-button"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Submitting…" : "Submit report"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default ReportForm;
