
import { useState, type FormEvent } from "react";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://streetwise.streetwise-city.workers.dev";

export default function StaffLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to sign in.");
      }

      if (!data.token || !data.user) {
        throw new Error("The server returned an invalid login response.");
      }

      if (data.user.role !== "staff" && data.user.role !== "admin") {
        throw new Error("This account does not have staff access.");
      }

      sessionStorage.setItem("streetwise_token", data.token);
      sessionStorage.setItem("streetwise_user", JSON.stringify(data.user));

window.location.href = data.user.role === "admin" ? "/admin" : "/staff";
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="staff-login-page">
      <section className="staff-login-card">
        <a className="staff-login-brand" href="/">
          <span className="staff-login-icon">S</span>
          <span>
            <strong>Streetwise</strong>
            <small>CITY OPERATIONS</small>
          </span>
        </a>

        <div className="staff-login-heading">
          <span className="staff-login-eyebrow">STAFF PORTAL</span>
          <h1>Welcome back</h1>
          <p>Sign in to manage and review city reports.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="staff-email">Work email</label>
          <input
            id="staff-email"
            type="email"
            autoComplete="username"
            placeholder="you@organization.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            maxLength={254}
          />

          <label htmlFor="staff-password">Password</label>
          <input
            id="staff-password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            maxLength={256}
          />

          {error && (
            <p className="staff-login-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <a className="staff-login-back" href="/">
          ← Back to public dashboard
        </a>

        <p className="staff-login-footer">
          Authorized personnel only.
        </p>
      </section>
    </main>
  );
}
