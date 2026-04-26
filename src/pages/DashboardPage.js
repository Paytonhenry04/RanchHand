// src/pages/DashboardPage.js
import { format, getDaysInMonth } from "date-fns";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  calculateBilling,
  getRanch,
  getRanchAnimals,
  getRanchAnimalServices,
  getRanchServices,
  getTodayCompletions,
} from "../firebase/firestore";

export const DashboardPage = () => {
  const { userProfile, isAdmin, ranchId, currentUser } = useAuth();
  const [ranch, setRanch] = useState(null);
  const [animals, setAnimals] = useState([]);
  const [services, setServices] = useState([]);
  const [animalServices, setAnimalServices] = useState([]);
  const [todayCompletions, setTodayCompletions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ranchId) { setLoading(false); return; }
    const load = async () => {
      const [r, a, s, as_, tc] = await Promise.all([
        getRanch(ranchId),
        getRanchAnimals(ranchId),
        getRanchServices(ranchId),
        getRanchAnimalServices(ranchId),
        getTodayCompletions(ranchId),
      ]);
      setRanch(r);
      setAnimals(a);
      setServices(s);
      setAnimalServices(as_);
      setTodayCompletions(tc);
      setLoading(false);
    };
    load();
  }, [ranchId]);

  if (!ranchId) return <NoRanchPrompt />;
  if (loading) return <LoadingState />;

  const activeServices = animalServices.filter((as) => as.status === "active");
  const pendingRequests = animalServices.filter((as) => as.status === "pending");
  const today = new Date();
  const daysInMonth = getDaysInMonth(today);
  const daysPassed = today.getDate();
  const currentMonth = format(today, "yyyy-MM");

  // Admin: all animals; User: just their animals
  const myAnimals = isAdmin
    ? animals
    : animals.filter((a) => a.ownerId === currentUser.uid);

  // Today's tasks still pending
  const pendingToday = activeServices.filter((as) => {
    const done = todayCompletions.some((c) => c.animalServiceId === as.id);
    return !done;
  });

  // Simple billing summary for dashboard (user sees their own)
  const myAnimalIds = myAnimals.map((a) => a.id);
  const myActiveServices = activeServices.filter((as) => myAnimalIds.includes(as.animalId));
  const { actual } = calculateBilling(
    myActiveServices,
    services,
    todayCompletions.filter((c) => myAnimalIds.includes(c.animalId)),
    daysInMonth,
    daysPassed
  );

  return (
    <div className="fade-up">
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28 }}>
          Good {getTimeGreeting()}, {userProfile?.displayName?.split(" ")[0]}
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: 4, fontSize: 14 }}>
          {ranch?.name} · {format(today, "EEEE, MMMM d")}
        </p>
      </div>

      {/* Stat cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
        gap: 14,
        marginBottom: 28,
      }}>
        <StatCard label="Animals" value={myAnimals.length} icon="🐴" />
        <StatCard label="Active Services" value={myActiveServices.length} icon="📋" />
        {isAdmin && <StatCard label="Pending Tasks Today" value={pendingToday.length} icon="✅" accent={pendingToday.length > 0 ? "rust" : "sage"} />}
        {isAdmin && pendingRequests.length > 0 && (
          <StatCard label="Service Requests" value={pendingRequests.length} icon="🔔" accent="rust" />
        )}
        <StatCard label="Month-to-Date" value={`$${actual.toFixed(2)}`} icon="💰" />
      </div>

      {/* Admin: today's task snapshot */}
      {isAdmin && (
        <div style={{ marginBottom: 28 }}>
          <SectionHeader title="Today's Progress" link="/todo" linkLabel="Go to task list" />
          {pendingToday.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
              🎉 All tasks completed for today!
            </div>
          ) : (
            <div className="card">
              <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 12 }}>
                <strong>{pendingToday.length}</strong> service{pendingToday.length !== 1 ? "s" : ""} still pending today
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {pendingToday.slice(0, 6).map((as) => {
                  const svc = services.find((s) => s.id === as.serviceId);
                  const animal = animals.find((a) => a.id === as.animalId);
                  return (
                    <span key={as.id} className="badge badge-rust">
                      {animal?.name} – {svc?.name}
                    </span>
                  );
                })}
                {pendingToday.length > 6 && (
                  <span className="badge badge-tan">+{pendingToday.length - 6} more</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* My animals quick view */}
      <div>
        <SectionHeader title="My Animals" link={isAdmin ? "/animals" : "/my-animals"} linkLabel="View all" />
        {myAnimals.length === 0 ? (
          <div className="card empty-state">
            <span style={{ fontSize: 40 }}>🐴</span>
            <p>No animals yet.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
            {myAnimals.slice(0, 6).map((animal) => (
              <AnimalCard key={animal.id} animal={animal} services={animalServices.filter((as) => as.animalId === animal.id && as.status === "active").length} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

const StatCard = ({ label, value, icon, accent }) => (
  <div className="card" style={{ textAlign: "center" }}>
    <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
    <div style={{
      fontSize: 22,
      fontWeight: 600,
      color: accent === "rust" ? "var(--color-rust)" : accent === "sage" ? "var(--color-sage)" : "var(--text-primary)",
      fontFamily: "var(--font-display)",
    }}>{value}</div>
    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{label}</div>
  </div>
);

const AnimalCard = ({ animal, services }) => (
  <div className="card" style={{ cursor: "pointer", transition: "box-shadow 0.15s" }}
    onMouseEnter={(e) => e.currentTarget.style.boxShadow = "var(--shadow-md)"}
    onMouseLeave={(e) => e.currentTarget.style.boxShadow = "var(--shadow-sm)"}
  >
    <div style={{
      width: "100%", height: 80, borderRadius: "var(--radius-sm)",
      background: "var(--border)",
      backgroundImage: animal.photoURL ? `url(${animal.photoURL})` : undefined,
      backgroundSize: "cover", backgroundPosition: "center",
      display: "flex", alignItems: "center", justifyContent: "center",
      marginBottom: 10, fontSize: 32,
    }}>
      {!animal.photoURL && "🐴"}
    </div>
    <p style={{ fontWeight: 500, fontSize: 14 }}>{animal.name}</p>
    <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{services} service{services !== 1 ? "s" : ""}</p>
  </div>
);

const SectionHeader = ({ title, link, linkLabel }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
    <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20 }}>{title}</h2>
    {link && <a href={link} style={{ fontSize: 13, color: "var(--color-leather)" }}>{linkLabel} →</a>}
  </div>
);

const NoRanchPrompt = () => (
  <div className="fade-up" style={{ maxWidth: 400, margin: "80px auto", textAlign: "center" }}>
    <div style={{ fontSize: 60, marginBottom: 16 }}>🌾</div>
    <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, marginBottom: 8 }}>
      You're not in a ranch yet
    </h2>
    <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>
      Join a ranch using a 6-digit code from your ranch admin, or create a new ranch.
    </p>
    <a href="/onboarding" className="btn btn-primary">Get Started</a>
  </div>
);

const LoadingState = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
    <span className="spinner" style={{ width: 32, height: 32 }} />
  </div>
);

const getTimeGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
};