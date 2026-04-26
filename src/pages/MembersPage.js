// src/pages/MembersPage.js
// Admin: view all ranch members, promote to admin
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getRanch, getRanchMembers, promoteToAdmin } from "../firebase/firestore";

export const MembersPage = () => {
  const { ranchId, currentUser } = useAuth();
  const [members, setMembers] = useState([]);
  const [ranch, setRanch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState(null);

  const load = async () => {
    const [m, r] = await Promise.all([getRanchMembers(ranchId), getRanch(ranchId)]);
    setMembers(m);
    setRanch(r);
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (ranchId) load(); }, [ranchId]);

  const handlePromote = async (uid) => {
    if (!window.confirm("Grant this user admin access? They will be able to manage all animals, services, and members.")) return;
    setPromoting(uid);
    try {
      await promoteToAdmin(uid);
      await load();
    } finally {
      setPromoting(null);
    }
  };

  if (loading) return <LoadingState />;

  const admins = members.filter((m) => m.role === "admin");
  const users = members.filter((m) => m.role !== "admin");

  return (
    <div className="fade-up">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28 }}>Members</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>{ranch?.name}</p>
      </div>

      {/* Ranch code display */}
      <div className="card" style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 500, marginBottom: 4 }}>Ranch Join Code</p>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Share this code with animal owners so they can join your ranch.
          </p>
        </div>
        <div style={{
          fontFamily: "var(--font-display)",
          fontSize: 28,
          letterSpacing: "0.25em",
          color: "var(--color-leather)",
          background: "var(--bg)",
          padding: "8px 20px",
          borderRadius: "var(--radius-sm)",
          border: "2px dashed var(--border-strong)",
          userSelect: "all",
        }}>
          {ranch?.code}
        </div>
      </div>

      {/* Admins section */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, marginBottom: 12 }}>
          Admins ({admins.length})
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {admins.map((member) => (
            <MemberRow key={member.id} member={member} isSelf={member.id === currentUser.uid} badge="admin" badgeColor="badge-sky" />
          ))}
        </div>
      </div>

      {/* Animal owners */}
      <div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, marginBottom: 12 }}>
          Animal Owners ({users.length})
        </h2>
        {users.length === 0 ? (
          <div className="card" style={{ color: "var(--text-muted)", textAlign: "center", padding: 24 }}>
            No animal owners have joined yet. Share the code above!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {users.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                isSelf={false}
                badge="user"
                badgeColor="badge-tan"
                action={
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handlePromote(member.id)}
                    disabled={promoting === member.id}
                  >
                    {promoting === member.id ? <span className="spinner" /> : "Make Admin"}
                  </button>
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const MemberRow = ({ member, isSelf, badge, badgeColor, action }) => (
  <div className="card" style={{ display: "flex", alignItems: "center", gap: 12 }}>
    <div style={{
      width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
      background: "var(--color-leather)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "var(--color-cream)", fontWeight: 600, fontSize: 16,
    }}>
      {(member.displayName || member.email || "?")[0].toUpperCase()}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <p style={{ fontWeight: 500 }}>{member.displayName || "—"}</p>
        {isSelf && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>(you)</span>}
        <span className={`badge ${badgeColor}`}>{badge}</span>
      </div>
      <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{member.email}</p>
    </div>
    {action}
  </div>
);

const LoadingState = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
    <span className="spinner" style={{ width: 32, height: 32 }} />
  </div>
);