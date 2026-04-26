// src/components/auth/AuthPages.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const inputStyle = {
  width: "100%",
  padding: "11px 14px",
  border: "1.5px solid var(--border-strong)",
  borderRadius: "var(--radius-sm)",
  background: "var(--bg)",
  color: "var(--text-primary)",
  fontSize: "14px",
  fontFamily: "var(--font-body)",
  transition: "border-color 0.15s",
};

const labelStyle = {
  fontSize: "12px",
  fontWeight: 500,
  color: "var(--text-secondary)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: 6,
  display: "block",
};

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your Ranch Hand account">
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={labelStyle}>Email</label>
          <input
            style={inputStyle}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@ranch.com"
            required
          />
        </div>
        <div>
          <label style={labelStyle}>Password</label>
          <input
            style={inputStyle}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>
        {error && <p style={{ color: "var(--color-rust)", fontSize: 13 }}>{error}</p>}
        <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ marginTop: 4 }}>
          {loading ? <span className="spinner" /> : "Sign In"}
        </button>
      </form>
      <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 14, marginTop: 20 }}>
        Don't have an account?{" "}
        <a href="/register" style={{ color: "var(--color-leather)", fontWeight: 500 }}>Create one</a>
      </p>
    </AuthLayout>
  );
};

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ displayName: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await register(form.email, form.password, form.displayName);
      navigate("/onboarding");
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create account" subtitle="Join Ranch Hand to manage your animals">
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={labelStyle}>Full Name</label>
          <input style={inputStyle} type="text" value={form.displayName} onChange={set("displayName")} placeholder="Jane Doe" required />
        </div>
        <div>
          <label style={labelStyle}>Email</label>
          <input style={inputStyle} type="email" value={form.email} onChange={set("email")} placeholder="you@ranch.com" required />
        </div>
        <div>
          <label style={labelStyle}>Password</label>
          <input style={inputStyle} type="password" value={form.password} onChange={set("password")} placeholder="••••••••" required />
        </div>
        <div>
          <label style={labelStyle}>Confirm Password</label>
          <input style={inputStyle} type="password" value={form.confirm} onChange={set("confirm")} placeholder="••••••••" required />
        </div>
        {error && <p style={{ color: "var(--color-rust)", fontSize: 13 }}>{error}</p>}
        <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ marginTop: 4 }}>
          {loading ? <span className="spinner" /> : "Create Account"}
        </button>
      </form>
      <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 14, marginTop: 20 }}>
        Already have an account?{" "}
        <a href="/login" style={{ color: "var(--color-leather)", fontWeight: 500 }}>Sign in</a>
      </p>
    </AuthLayout>
  );
};

// ── Shared Layout ─────────────────────────────────────────────────────────────
const AuthLayout = ({ children, title, subtitle }) => (
  <div style={{
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--bg)",
    padding: 20,
  }}>
    {/* Background texture suggestion */}
    <div style={{
      position: "fixed", inset: 0, opacity: 0.03,
      backgroundImage: "repeating-linear-gradient(45deg, var(--color-soil) 0, var(--color-soil) 1px, transparent 0, transparent 50%)",
      backgroundSize: "20px 20px",
      pointerEvents: "none",
    }} />
    <div className="card fade-up" style={{ width: "100%", maxWidth: 420, padding: "40px 36px" }}>
      {/* Logo mark */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 52,
          height: 52,
          background: "var(--color-leather)",
          borderRadius: "50%",
          marginBottom: 16,
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--color-cream)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, color: "var(--text-primary)" }}>
          Ranch Hand
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>{subtitle}</p>
      </div>
      {children}
    </div>
  </div>
);
