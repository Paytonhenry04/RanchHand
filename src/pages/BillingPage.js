// src/pages/BillingPage.js
// Billing tracking summary — for display/tracking purposes ONLY.
// No money is transferred through this app.
import { format, getDaysInMonth } from "date-fns";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  calculateBilling,
  getCompletionsForMonth,
  getRanchAnimals,
  getRanchAnimalServices,
  getRanchMembers,
  getRanchServices,
} from "../firebase/firestore";

export const BillingPage = () => {
  const { ranchId, isAdmin, currentUser } = useAuth();
  const [animals, setAnimals] = useState([]);
  const [services, setServices] = useState([]);
  const [animalServices, setAnimalServices] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedOwner, setSelectedOwner] = useState("all");
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const currentMonth = format(today, "yyyy-MM");
  const monthLabel = format(today, "MMMM yyyy");
  const daysInMonth = getDaysInMonth(today);
  const daysPassed = today.getDate();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!ranchId) return;
    const load = async () => {
      const [a, s, as_, c, m] = await Promise.all([
        getRanchAnimals(ranchId),
        getRanchServices(ranchId),
        getRanchAnimalServices(ranchId),
        getCompletionsForMonth(ranchId, currentMonth),
        isAdmin ? getRanchMembers(ranchId) : Promise.resolve([]),
      ]);
      setAnimals(a);
      setServices(s);
      setAnimalServices(as_);
      setCompletions(c);
      setMembers(m);
      setLoading(false);
    };
    load();
  }, [ranchId]);

  if (loading) return <LoadingState />;

  const activeServices = animalServices.filter((as) => as.status === "active");

  // Filter animals by selected owner
  const filterAnimals = (ownerId) =>
    ownerId === "all" ? animals : animals.filter((a) => a.ownerId === ownerId);

  const displayAnimals = isAdmin ? filterAnimals(selectedOwner) : animals.filter((a) => a.ownerId === currentUser.uid);

  // Build per-animal billing
  const animalBillingRows = displayAnimals.map((animal) => {
    const animalSvcAssignments = activeServices.filter((as) => as.animalId === animal.id);
    const animalCompletions = completions.filter((c) => c.animalId === animal.id);
    const billing = calculateBilling(animalSvcAssignments, services, animalCompletions, daysInMonth, daysPassed);
    return { animal, billing };
  });

  const totalActual = animalBillingRows.reduce((sum, r) => sum + r.billing.actual, 0);
  const totalProjected = animalBillingRows.reduce((sum, r) => sum + r.billing.projected, 0);

  // Unique owners for filter dropdown
  const owners = members.filter((m) => m.role !== "admin" || true);

  return (
    <div className="fade-up">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28 }}>Billing</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>
          {monthLabel} · Tracking purposes only — no payments processed in app
        </p>
      </div>

      {/* Disclaimer banner */}
      <div style={{
        background: "rgba(74,127,165,0.1)", border: "1px solid rgba(74,127,165,0.25)",
        borderRadius: "var(--radius-sm)", padding: "10px 14px", marginBottom: 20,
        fontSize: 13, color: "var(--color-sky)", display: "flex", alignItems: "center", gap: 8,
      }}>
        ℹ️ Billing figures are for tracking and reference only. All payments are arranged directly between owners and the ranch.
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14, marginBottom: 28 }}>
        <SumCard label="Month-to-Date" value={`$${totalActual.toFixed(2)}`} sub="based on completions" color="var(--color-leather)" />
        <SumCard label="Projected (at current rate)" value={`$${totalProjected.toFixed(2)}`} sub="if pace continues" color="var(--color-sky)" />
        <SumCard label="Days elapsed" value={`${daysPassed} / ${daysInMonth}`} sub={monthLabel} color="var(--text-secondary)" />
      </div>

      {/* Owner filter (admin only) */}
      {isAdmin && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <label style={{ fontSize: 13, color: "var(--text-muted)" }}>Filter by owner:</label>
          <select
            value={selectedOwner}
            onChange={(e) => setSelectedOwner(e.target.value)}
            style={{ padding: "6px 12px", border: "1.5px solid var(--border-strong)", borderRadius: "var(--radius-sm)", fontSize: 14, background: "var(--bg)" }}
          >
            <option value="all">All Animals</option>
            {owners.filter((m) => m.ranchId === ranchId).map((m) => (
              <option key={m.id} value={m.id}>{m.displayName}</option>
            ))}
            <option value="null">No owner (admin-created)</option>
          </select>
        </div>
      )}

      {/* Per-animal breakdown */}
      {animalBillingRows.length === 0 ? (
        <div className="card empty-state"><span style={{ fontSize: 48 }}>💰</span><p>No animals to display.</p></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {animalBillingRows.map(({ animal, billing }) => (
            <AnimalBillingCard key={animal.id} animal={animal} billing={billing} services={services} />
          ))}
        </div>
      )}
    </div>
  );
};

const AnimalBillingCard = ({ animal, billing, services }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => setExpanded(!expanded)}>
        <div style={{
          width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
          background: "var(--border)", fontSize: 20,
          backgroundImage: animal.photoURL ? `url(${animal.photoURL})` : undefined,
          backgroundSize: "cover", backgroundPosition: "center",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {!animal.photoURL && "🐴"}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 500 }}>{animal.name}</p>
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{billing.breakdown.length} active service{billing.breakdown.length !== 1 ? "s" : ""}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--color-leather)" }}>
            ${billing.actual.toFixed(2)}
          </p>
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>month-to-date</p>
        </div>
        <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 8 }}>{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div style={{ marginTop: 14, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
          {billing.breakdown.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>No active services.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", color: "var(--text-muted)", padding: "4px 0", fontWeight: 500 }}>Service</th>
                  <th style={{ textAlign: "left", color: "var(--text-muted)", padding: "4px 0", fontWeight: 500 }}>Type</th>
                  <th style={{ textAlign: "right", color: "var(--text-muted)", padding: "4px 0", fontWeight: 500 }}>Completion</th>
                  <th style={{ textAlign: "right", color: "var(--text-muted)", padding: "4px 0", fontWeight: 500 }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {billing.breakdown.map((row) => (
                  <tr key={row.serviceId} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ padding: "8px 0" }}>{row.name}</td>
                    <td style={{ padding: "8px 0" }}>
                      <span className={`badge ${row.type === "recurring" ? "badge-sky" : "badge-tan"}`}>
                        {row.type}
                      </span>
                    </td>
                    <td style={{ padding: "8px 0", textAlign: "right" }}>
                      {row.type === "recurring"
                        ? `${row.completedCount}/${row.expectedCompletions} (${row.pct}%)`
                        : `${row.completions}×`}
                    </td>
                    <td style={{ padding: "8px 0", textAlign: "right", fontWeight: 500 }}>
                      ${row.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
                <tr style={{ borderTop: "2px solid var(--border-strong)" }}>
                  <td colSpan={3} style={{ padding: "8px 0", fontWeight: 600 }}>Total (this month)</td>
                  <td style={{ padding: "8px 0", textAlign: "right", fontWeight: 700, fontFamily: "var(--font-display)", fontSize: 16, color: "var(--color-leather)" }}>
                    ${billing.actual.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

const SumCard = ({ label, value, sub, color }) => (
  <div className="card" style={{ textAlign: "center" }}>
    <p style={{ fontFamily: "var(--font-display)", fontSize: 22, color }}>{value}</p>
    <p style={{ fontSize: 13, fontWeight: 500, marginTop: 4 }}>{label}</p>
    <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{sub}</p>
  </div>
);

const LoadingState = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
    <span className="spinner" style={{ width: 32, height: 32 }} />
  </div>
);