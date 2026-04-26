// src/pages/SettingsPage.js
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { updateUserProfile } from "../firebase/firestore";
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth } from "../firebase/config";

export const SettingsPage = () => {
  const { currentUser, userProfile, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(userProfile?.displayName || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);

  const handleSaveProfile = async () => {
    if (!displayName.trim()) return;
    setSaving(true);
    try {
      await updateProfile(auth.currentUser, { displayName });
      await updateUserProfile(currentUser.uid, { displayName });
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPwError("");
    if (newPassword !== confirmPassword) { setPwError("New passwords do not match."); return; }
    if (newPassword.length < 6) { setPwError("Password must be at least 6 characters."); return; }
    setPwSaving(true);
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setPwSaved(true);
      setTimeout(() => setPwSaved(false), 2000);
    } catch (err) {
      setPwError(err.message.replace("Firebase: ", ""));
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="fade-up" style={{ maxWidth: 520 }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, marginBottom: 28 }}>Settings</h1>

      {/* Profile section */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, marginBottom: 16 }}>Profile</h2>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "var(--color-leather)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--color-cream)", fontSize: 22, fontWeight: 600,
          }}>
            {(displayName || currentUser?.email || "?")[0].toUpperCase()}
          </div>
          <div>
            <p style={{ fontWeight: 500 }}>{currentUser?.email}</p>
            <span className={`badge ${userProfile?.role === "admin" ? "badge-sky" : "badge-tan"}`}>
              {userProfile?.role === "admin" ? "Admin" : "Animal Owner"}
            </span>
          </div>
        </div>

        <div className="field-group">
          <label>Display Name</label>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
        </div>

        <button className="btn btn-primary btn-sm" onClick={handleSaveProfile} disabled={saving}>
          {saving ? <span className="spinner" /> : saved ? "✓ Saved!" : "Save Profile"}
        </button>
      </div>

      {/* Password section */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, marginBottom: 16 }}>Change Password</h2>
        <div className="field-group">
          <label>Current Password</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <div className="field-group">
          <label>New Password</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <div className="field-group">
          <label>Confirm New Password</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
        </div>
        {pwError && <p style={{ color: "var(--color-rust)", fontSize: 13, marginBottom: 8 }}>{pwError}</p>}
        <button className="btn btn-secondary btn-sm" onClick={handleChangePassword} disabled={pwSaving}>
          {pwSaving ? <span className="spinner" /> : pwSaved ? "✓ Password updated!" : "Update Password"}
        </button>
      </div>

      {/* Ranch info */}
      <div className="card">
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, marginBottom: 12 }}>Ranch Info</h2>
        {userProfile?.ranchId ? (
          <div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>Ranch ID</p>
            <p style={{ fontFamily: "monospace", fontSize: 13, background: "var(--bg)", padding: "6px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
              {userProfile.ranchId}
            </p>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
              To switch ranches, contact your admin or create a new account.
            </p>
          </div>
        ) : (
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
            You haven't joined a ranch yet. <a href="/onboarding">Join or create one →</a>
          </p>
        )}
      </div>
    </div>
  );
};
