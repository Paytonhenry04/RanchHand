// src/pages/RanchBoardPage.js
// User-facing ranch board — shows all animals with public records
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getRanchAnimals, getRanch } from "../firebase/firestore";

export const RanchBoardPage = () => {
  const { ranchId } = useAuth();
  const [animals, setAnimals] = useState([]);
  const [ranch, setRanch] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ranchId) return;
    const load = async () => {
      const [a, r] = await Promise.all([getRanchAnimals(ranchId), getRanch(ranchId)]);
      setAnimals(a);
      setRanch(r);
      setLoading(false);
    };
    load();
  }, [ranchId]);

  const filtered = animals.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingState />;

  return (
    <div className="fade-up">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28 }}>Ranch Board</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>{ranch?.name} · All animals</p>
      </div>

      <input
        type="text"
        placeholder="Search animals..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%", padding: "10px 14px",
          border: "1.5px solid var(--border-strong)",
          borderRadius: "var(--radius-sm)", fontSize: 14,
          background: "var(--bg)", marginBottom: 20,
          fontFamily: "var(--font-body)",
        }}
      />

      {filtered.length === 0 ? (
        <div className="card empty-state"><span style={{ fontSize: 48 }}>🐴</span><p>No animals found.</p></div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
          {filtered.map((animal) => (
            <PublicAnimalCard key={animal.id} animal={animal} />
          ))}
        </div>
      )}
    </div>
  );
};

const PublicAnimalCard = ({ animal }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card" style={{ cursor: "pointer" }} onClick={() => setExpanded(!expanded)}>
      <div style={{
        width: "100%", height: 120, borderRadius: "var(--radius-sm)",
        background: "var(--border)",
        backgroundImage: animal.photoURL ? `url(${animal.photoURL})` : undefined,
        backgroundSize: "cover", backgroundPosition: "center",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 40, marginBottom: 12,
      }}>
        {!animal.photoURL && "🐴"}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <p style={{ fontWeight: 500, fontSize: 15 }}>{animal.name}</p>
        <span className={`badge ${animal.isPublic ? "badge-green" : "badge-tan"}`}>
          {animal.isPublic ? "Public" : "Private"}
        </span>
      </div>

      {/* Always shown */}
      <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
        {[animal.breed, animal.color].filter(Boolean).join(" · ") || "No details"}
      </p>

      {/* Only shown if public and expanded */}
      {animal.isPublic && expanded && (
        <div style={{ marginTop: 14, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
          {animal.feedDetails && (
            <InfoRow label="Feed" value={animal.feedDetails} />
          )}
          {animal.vetName && (
            <InfoRow label="Vet" value={`${animal.vetName}${animal.vetPhone ? ` · ${animal.vetPhone}` : ""}`} />
          )}
          {animal.farrierName && (
            <InfoRow label="Farrier" value={`${animal.farrierName}${animal.farrierPhone ? ` · ${animal.farrierPhone}` : ""}`} />
          )}
          {animal.notes && (
            <InfoRow label="Notes" value={animal.notes} />
          )}
        </div>
      )}

      {animal.isPublic && (
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 10 }}>
          {expanded ? "▲ Less" : "▼ See details"}
        </p>
      )}
    </div>
  );
};

const InfoRow = ({ label, value }) => (
  <div style={{ marginBottom: 8 }}>
    <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
    <p style={{ fontSize: 13, marginTop: 2 }}>{value}</p>
  </div>
);

const LoadingState = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
    <span className="spinner" style={{ width: 32, height: 32 }} />
  </div>
);
