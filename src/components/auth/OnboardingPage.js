// src/components/auth/OnboardingPage.js
// After registering, user either creates a ranch (admin) or joins one with a code
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  createRanch,
  getRanchByCode,
  joinRanch,
  updateUserProfile,
} from "../../firebase/firestore";

export const OnboardingPage = () => {
  const { currentUser, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState("choose"); // "choose" | "create" | "join"
  const [ranchName, setRanchName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateRanch = async () => {
    if (!ranchName.trim()) { setError("Please enter a ranch name."); return; }
    setError(""); setLoading(true);
    try {
      const { id, code } = await createRanch(ranchName.trim(), currentUser.uid);
      await updateUserProfile(currentUser.uid, { ranchId: id, role: "admin" });
      await refreshProfile();
      // Show the generated code before navigating
      alert(`Ranch created!\n\nYour 6-digit ranch code is:\n\n${code}\n\nShare this with animal owners to join.`);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRanch = async () => {
    if (joinCode.length !== 6) { setError("Please enter a valid 6-digit code."); return; }
    setError(""); setLoading(true);
    try {
      const ranch = await getRanchByCode(joinCode);
      if (!ranch) { setError("Ranch not found. Check the code and try again."); return; }
      await joinRanch(currentUser.uid, ranch.id);
      await refreshProfile();
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg)", padding: 20,
    }}>
      <div className="card fade-up" style={{ width: "100%", maxWidth: 460, padding: "40px 36px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26 }}>Welcome aboard!</h1>
          <p style={{ color: "var(--text-muted)", marginTop: 6 }}>Let's get your ranch set up.</p>
        </div>

        {step === "choose" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <button
              className="btn btn-primary btn-lg"
              style={{ justifyContent: "center", width: "100%" }}
              onClick={() => setStep("create")}
            >
              🏡 I'm a Ranch Owner — Create a Ranch
            </button>
            <button
              className="btn btn-secondary btn-lg"
              style={{ justifyContent: "center", width: "100%" }}
              onClick={() => setStep("join")}
            >
              🐴 I'm an Animal Owner — Join a Ranch
            </button>
          </div>
        )}

        {step === "create" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <button onClick={() => setStep("choose")} style={{
              background: "none", border: "none", color: "var(--text-muted)", fontSize: 13,
              cursor: "pointer", textAlign: "left", padding: 0, marginBottom: 4,
            }}>← Back</button>
            <div className="field-group">
              <label>Ranch Name</label>
              <input
                type="text"
                value={ranchName}
                onChange={(e) => setRanchName(e.target.value)}
                placeholder="Sunridge Stables"
              />
            </div>
            {error && <p style={{ color: "var(--color-rust)", fontSize: 13 }}>{error}</p>}
            <button className="btn btn-primary btn-lg" onClick={handleCreateRanch} disabled={loading} style={{ justifyContent: "center" }}>
              {loading ? <span className="spinner" /> : "Create Ranch & Get Code"}
            </button>
          </div>
        )}

        {step === "join" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <button onClick={() => setStep("choose")} style={{
              background: "none", border: "none", color: "var(--text-muted)", fontSize: 13,
              cursor: "pointer", textAlign: "left", padding: 0, marginBottom: 4,
            }}>← Back</button>
            <div className="field-group">
              <label>Ranch Code</label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                style={{ letterSpacing: "0.3em", fontSize: 22, textAlign: "center", fontWeight: 600 }}
              />
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Ask your ranch admin for this code.
              </span>
            </div>
            {error && <p style={{ color: "var(--color-rust)", fontSize: 13 }}>{error}</p>}
            <button className="btn btn-primary btn-lg" onClick={handleJoinRanch} disabled={loading || joinCode.length !== 6} style={{ justifyContent: "center" }}>
              {loading ? <span className="spinner" /> : "Join Ranch"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
