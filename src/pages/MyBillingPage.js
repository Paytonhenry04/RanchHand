// src/pages/MyBillingPage.js
// Animal owner billing view — their animals only, tracking only
import { format, getDaysInMonth } from "date-fns";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  calculateBilling,
  getCompletionsForMonth,
  getRanchAnimals,
  getRanchAnimalServices,
  getRanchServices,
} from "../firebase/firestore";

export const MyBillingPage = () => {
  const { ranchId, currentUser } = useAuth();
  const [animals, setAnimals] = useState([]);
  const [services, setServices] = useState([]);
  const [animalServices, setAnimalServices] = useState([]);
  const [completions, setCompletions] = useState([]);
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
      const [allAnimals, s, as_, c] = await Promise.all([
        getRanchAnimals(ranchId),
        getRanchServices(ranchId),
        getRanchAnimalServices(ranchId),
        getCompletionsForMonth(ranchId, currentMonth),
      ]);
      setAnimals(allAnimals.filter((a) => a.ownerId === currentUser.uid));
      setServices(s);
      setAnimalServices(as_);
      setCompletions(c);
      setLoading(false);
    };
    load();
  }, [ranchId]);

  if (loading) return <LoadingState />;

  const activeServices = animalServices.filter((as) => as.status === "active");
  const myAnimalIds = animals.map((a) => a.id);
  const myActiveServices = activeServices.filter((as) => myAnimalIds.includes(as.animalId));
  const myCompletions = completions.filter((c) => myAnimalIds.includes(c.animalId));

  const { projected, actual } = calculateBilling(
    myActiveServices, services, myCompletions, daysInMonth, daysPassed
  );

  // Per-animal breakdown
  const animalRows = animals.map((animal) => {
    const animalSvcs = myActiveServices.filter((as) => as.animalId === animal.id);
    const animalComps = myCompletions.filter((c) => c.animalId === animal.id);
    const billing = calculateBilling(animalSvcs, services, animalComps, daysInMonth, daysPassed);
    return { animal, billing };
  });

  return (
    <div className="fade-up">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28 }}>My Billing</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>
          {monthLabel} · Tracking only — no payments processed in app
        </p>
      </div>

      {/* Disclaimer */}
      <div style={{
        background: "rgba(74,127,165,0.1)", border: "1px solid rgba(74,127,165,0.25)",
        borderRadius: "var(--radius-sm)", padding: "10px 14px", marginBottom: 20,
        fontSize: 13, color: "var(--color-sky)",
      }}>
        ℹ️ These figures are estimates for tracking purposes. Actual billing is handled directly with your ranch admin.
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 14, marginBottom: 28 }}>
        <SumCard label="Month-to-Date" value={`$${actual.toFixed(2)}`} sub="based on completions" />
        <SumCard label="Projected" value={`$${projected.toFixed(2)}`} sub="at current completion rate" color="var(--color-sky)" />
        <SumCard label="Full Month (100%)" value={`$${myActiveServices.reduce((sum, as) => {
          const svc = services.find((s) => s.id === as.serviceId);
          return sum + (svc?.price || 0);
        }, 0).toFixed(2)}`} sub="if all services completed" color="var(--text-muted)" />
      </div>

      {/* Per-animal cards */}
      {animalRows.length === 0 ? (
        <div className="card empty-state">
          <span style={{ fontSize: 48 }}>💰</span>
          <p>No animals or services yet.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {animalRows.map(({ animal, billing }) => (
            <div key={animal.id} className="card">
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                  background: "var(--border)", fontSize: 22,
                  backgroundImage: animal.photoURL ? `url(${animal.photoURL})` : undefined,
                  backgroundSize: "cover", backgroundPosition: "center",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {!animal.photoURL && "🐴"}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 500 }}>{animal.name}</p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{billing.breakdown.length} service{billing.breakdown.length !== 1 ? "s" : ""}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--color-leather)" }}>
                    ${billing.actual.toFixed(2)}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)" }}>this month</p>
                </div>
              </div>

              {billing.breakdown.length > 0 && (
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                  {billing.breakdown.map((row) => (
                    <div key={row.serviceId} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: 13,
                    }}>
                      <div>
                        <span>{row.name}</span>
                        <span className={`badge ${row.type === "recurring" ? "badge-sky" : "badge-tan"}`} style={{ marginLeft: 8 }}>
                          {row.type}
                        </span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontWeight: 500 }}>${row.amount.toFixed(2)}</p>
                        {row.type === "recurring" && (
                          <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            {row.completedCount}/{row.expectedCompletions} ({row.pct}%)
                          </p>
                        )}
                        {row.type === "one-time" && (
                          <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            {row.completions} completion{row.completions !== 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SumCard = ({ label, value, sub, color = "var(--color-leather)" }) => (
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