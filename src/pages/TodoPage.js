// src/pages/TodoPage.js
// Admin daily service checklist — check off services per animal
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getRanchAnimals,
  getRanchAnimalServices,
  getRanchServices,
  getTodayCompletions,
  markServiceComplete,
} from "../firebase/firestore";

export const TodoPage = () => {
  const { ranchId, currentUser } = useAuth();
  const [animals, setAnimals] = useState([]);
  const [services, setServices] = useState([]);
  const [animalServices, setAnimalServices] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(null); // animalServiceId being toggled

  const load = async () => {
    const [a, s, as_, c] = await Promise.all([
      getRanchAnimals(ranchId),
      getRanchServices(ranchId),
      getRanchAnimalServices(ranchId),
      getTodayCompletions(ranchId),
    ]);
    setAnimals(a);
    setServices(s);
    setAnimalServices(as_);
    setCompletions(c);
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (ranchId) load(); }, [ranchId]);

  const isCompleted = (animalServiceId) =>
    completions.some((c) => c.animalServiceId === animalServiceId);

  const handleCheck = async (as_) => {
    if (isCompleted(as_.id)) return; // no unchecking for now (can be added)
    setMarking(as_.id);
    try {
      await markServiceComplete(as_.id, as_.animalId, as_.serviceId, ranchId, currentUser.uid);
      await load();
    } finally {
      setMarking(null);
    }
  };

  // Build task list grouped by animal (in sortOrder)
  const activeAssignments = animalServices.filter((as) => as.status === "active");

  const totalTasks = activeAssignments.length;
  const completedTasks = activeAssignments.filter((as) => isCompleted(as.id)).length;
  const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

  if (loading) return <LoadingState />;

  return (
    <div className="fade-up">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28 }}>Daily Tasks</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {/* Progress bar */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <p style={{ fontWeight: 500 }}>
            {completedTasks === totalTasks && totalTasks > 0
              ? "🎉 All done for today!"
              : `${completedTasks} of ${totalTasks} tasks completed`}
          </p>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 20, color: pct === 100 ? "var(--color-sage)" : "var(--color-leather)" }}>
            {pct}%
          </span>
        </div>
        <div style={{ height: 8, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${pct}%`,
            background: pct === 100 ? "var(--color-sage)" : "var(--color-leather)",
            borderRadius: 4,
            transition: "width 0.4s ease",
          }} />
        </div>
      </div>

      {/* Per-animal task groups */}
      {animals.length === 0 ? (
        <div className="card empty-state"><span style={{ fontSize: 48 }}>✅</span><p>No animals added yet.</p></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {animals.map((animal) => {
            const tasks = activeAssignments.filter((as) => as.animalId === animal.id);
            if (tasks.length === 0) return null;
            const done = tasks.filter((as) => isCompleted(as.id)).length;

            return (
              <div key={animal.id} className="card">
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: "50%",
                    background: "var(--border)",
                    backgroundImage: animal.photoURL ? `url(${animal.photoURL})` : undefined,
                    backgroundSize: "cover", backgroundPosition: "center",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0,
                  }}>
                    {!animal.photoURL && "🐴"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 500, fontSize: 15 }}>{animal.name}</p>
                    <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {done}/{tasks.length} done
                    </p>
                  </div>
                  <span className={`badge ${done === tasks.length ? "badge-green" : "badge-tan"}`}>
                    {done === tasks.length ? "✓ Done" : "In progress"}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {tasks.map((as) => {
                    const svc = services.find((s) => s.id === as.serviceId);
                    const done = isCompleted(as.id);
                    const isMarking = marking === as.id;
                    return (
                      <TaskRow
                        key={as.id}
                        service={svc}
                        notes={as.notes}
                        done={done}
                        loading={isMarking}
                        onCheck={() => handleCheck(as)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const TaskRow = ({ service, notes, done, loading, onCheck }) => (
  <div style={{
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 12px",
    borderRadius: "var(--radius-sm)",
    background: done ? "rgba(107,143,113,0.08)" : "var(--bg)",
    border: `1px solid ${done ? "rgba(107,143,113,0.3)" : "var(--border)"}`,
    transition: "all 0.2s",
    opacity: done ? 0.75 : 1,
  }}>
    <button
      onClick={onCheck}
      disabled={done || loading}
      style={{
        width: 26, height: 26, borderRadius: "50%",
        border: `2px solid ${done ? "var(--color-sage)" : "var(--border-strong)"}`,
        background: done ? "var(--color-sage)" : "transparent",
        cursor: done ? "default" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontSize: 13, flexShrink: 0,
        transition: "all 0.2s",
      }}
    >
      {loading ? <span className="spinner" style={{ width: 12, height: 12 }} /> : done ? "✓" : ""}
    </button>
    <div style={{ flex: 1 }}>
      <p style={{
        fontSize: 14, fontWeight: 500,
        textDecoration: done ? "line-through" : "none",
        color: done ? "var(--text-muted)" : "var(--text-primary)",
      }}>
        {service?.name || "Unknown service"}
      </p>
      {notes && <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{notes}</p>}
    </div>
    <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "right" }}>
      {service?.paymentType === "recurring"
        ? `$${service.price}/mo`
        : `$${service?.price}/use`}
    </div>
  </div>
);

const LoadingState = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
    <span className="spinner" style={{ width: 32, height: 32 }} />
  </div>
);