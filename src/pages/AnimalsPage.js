// src/pages/AnimalsPage.js
// Admin view of all ranch animals with custom sort order
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  createAnimal,
  getRanchAnimals,
  updateAnimal,
  updateAnimalOrder,
} from "../firebase/firestore";

const EMPTY_ANIMAL = {
  name: "", breed: "", age: "", color: "", photoURL: "",
  feedDetails: "", vetName: "", vetPhone: "", vetEmail: "",
  farrierName: "", farrierPhone: "", farrierEmail: "", notes: "",
  ownerId: null, isPublic: true,
};

export const AnimalsPage = () => {
  const { ranchId, isAdmin } = useAuth();
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editAnimal, setEditAnimal] = useState(null);
  const [form, setForm] = useState(EMPTY_ANIMAL);
  const [saving, setSaving] = useState(false);
  const [sortBy, setSortBy] = useState("custom"); // "custom" | "name" | "owner"

  const load = async () => {
    const data = await getRanchAnimals(ranchId);
    setAnimals(data);
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (ranchId) load(); }, [ranchId]);

  const openCreate = () => {
    setForm(EMPTY_ANIMAL);
    setEditAnimal(null);
    setShowForm(true);
  };

  const openEdit = (animal) => {
    setForm({ ...animal });
    setEditAnimal(animal.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editAnimal) {
        await updateAnimal(editAnimal, form);
      } else {
        await createAnimal(ranchId, {
          ...form,
          ownerId: form.ownerId || null,
          age: Number(form.age) || 0,
        });
      }
      await load();
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const sortedAnimals = [...animals].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "owner") return (a.ownerId || "").localeCompare(b.ownerId || "");
    return a.sortOrder - b.sortOrder;
  });

  // Simple drag-to-reorder (custom order only)
  const moveAnimal = async (fromIdx, toIdx) => {
    const reordered = [...sortedAnimals];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    setAnimals(reordered);
    await updateAnimalOrder(reordered);
  };

  if (loading) return <LoadingState />;

  return (
    <div className="fade-up">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28 }}>Animals</h1>
        <div style={{ display: "flex", gap: 8 }}>
          {/* Sort controls */}
          <div style={{ display: "flex", borderRadius: "var(--radius-sm)", overflow: "hidden", border: "1.5px solid var(--border-strong)" }}>
            {["custom", "name", "owner"].map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                style={{
                  padding: "6px 12px", border: "none", fontSize: 12,
                  background: sortBy === s ? "var(--color-leather)" : "var(--bg)",
                  color: sortBy === s ? "var(--color-cream)" : "var(--text-secondary)",
                  cursor: "pointer", textTransform: "capitalize",
                }}
              >
                {s}
              </button>
            ))}
          </div>
          {isAdmin && (
            <button className="btn btn-primary btn-sm" onClick={openCreate}>+ Add Animal</button>
          )}
        </div>
      </div>

      {sortBy === "custom" && isAdmin && (
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
          ↕ Drag animals to set your service route order
        </p>
      )}

      {animals.length === 0 ? (
        <div className="card empty-state">
          <span style={{ fontSize: 48 }}>🐴</span>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>No animals yet</p>
          <p style={{ fontSize: 14 }}>Add animals to get started.</p>
          {isAdmin && <button className="btn btn-primary" onClick={openCreate}>Add First Animal</button>}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {sortedAnimals.map((animal, idx) => (
            <AnimalRow
              key={animal.id}
              animal={animal}
              idx={idx}
              total={sortedAnimals.length}
              canMove={sortBy === "custom" && isAdmin}
              onMoveUp={() => idx > 0 && moveAnimal(idx, idx - 1)}
              onMoveDown={() => idx < sortedAnimals.length - 1 && moveAnimal(idx, idx + 1)}
              onEdit={() => openEdit(animal)}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

      {/* Modal form */}
      {showForm && (
        <Modal title={editAnimal ? "Edit Animal" : "Add Animal"} onClose={() => setShowForm(false)}>
          <AnimalForm form={form} setForm={setForm} />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <span className="spinner" /> : editAnimal ? "Save Changes" : "Add Animal"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

const AnimalRow = ({ animal, idx, total, canMove, onMoveUp, onMoveDown, onEdit, isAdmin }) => (
  <div className="card" style={{ display: "flex", alignItems: "center", gap: 14 }}>
    {canMove && (
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <button onClick={onMoveUp} disabled={idx === 0} style={{ background: "none", border: "none", cursor: "pointer", opacity: idx === 0 ? 0.3 : 1, fontSize: 14 }}>▲</button>
        <button onClick={onMoveDown} disabled={idx === total - 1} style={{ background: "none", border: "none", cursor: "pointer", opacity: idx === total - 1 ? 0.3 : 1, fontSize: 14 }}>▼</button>
      </div>
    )}
    <div style={{
      width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
      background: "var(--border)",
      backgroundImage: animal.photoURL ? `url(${animal.photoURL})` : undefined,
      backgroundSize: "cover", backgroundPosition: "center",
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
    }}>
      {!animal.photoURL && "🐴"}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <p style={{ fontWeight: 500, fontSize: 15 }}>{animal.name}</p>
        {!animal.isPublic && <span className="badge badge-tan">Private</span>}
      </div>
      <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
        {[animal.breed, animal.color, animal.age ? `${animal.age} yrs` : ""].filter(Boolean).join(" · ")}
      </p>
    </div>
    {isAdmin && (
      <button className="btn btn-ghost btn-sm" onClick={onEdit}>Edit</button>
    )}
    <a href={`/animals/${animal.id}`} className="btn btn-secondary btn-sm">View</a>
  </div>
);

const AnimalForm = ({ form, setForm }) => {
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="field-group"><label>Name *</label><input value={form.name} onChange={set("name")} placeholder="Trigger" /></div>
        <div className="field-group"><label>Breed</label><input value={form.breed} onChange={set("breed")} placeholder="Quarter Horse" /></div>
        <div className="field-group"><label>Age</label><input type="number" value={form.age} onChange={set("age")} placeholder="8" /></div>
        <div className="field-group"><label>Color</label><input value={form.color} onChange={set("color")} placeholder="Bay" /></div>
      </div>
      <div className="field-group"><label>Photo URL</label><input value={form.photoURL} onChange={set("photoURL")} placeholder="https://..." /></div>
      <div className="field-group"><label>Feed Details</label><textarea value={form.feedDetails} onChange={set("feedDetails")} rows={2} placeholder="2 flakes hay AM/PM, 1 scoop grain..." /></div>

      <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8, marginTop: 4 }}>Vet Contact</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div className="field-group"><label>Name</label><input value={form.vetName} onChange={set("vetName")} placeholder="Dr. Smith" /></div>
        <div className="field-group"><label>Phone</label><input value={form.vetPhone} onChange={set("vetPhone")} placeholder="555-0100" /></div>
        <div className="field-group"><label>Email</label><input value={form.vetEmail} onChange={set("vetEmail")} placeholder="vet@clinic.com" /></div>
      </div>

      <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8, marginTop: 4 }}>Farrier Contact</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div className="field-group"><label>Name</label><input value={form.farrierName} onChange={set("farrierName")} placeholder="Joe Farrier" /></div>
        <div className="field-group"><label>Phone</label><input value={form.farrierPhone} onChange={set("farrierPhone")} placeholder="555-0200" /></div>
        <div className="field-group"><label>Email</label><input value={form.farrierEmail} onChange={set("farrierEmail")} placeholder="farrier@shoe.com" /></div>
      </div>

      <div className="field-group">
        <label>Additional Notes</label>
        <textarea value={form.notes} onChange={set("notes")} rows={3} placeholder="Special needs, medical history..." />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input type="checkbox" id="isPublic" checked={form.isPublic} onChange={(e) => setForm((f) => ({ ...f, isPublic: e.target.checked }))} />
        <label htmlFor="isPublic" style={{ fontSize: 14, cursor: "pointer" }}>
          Public record (other ranch members can see full details)
        </label>
      </div>
    </div>
  );
};

// ── Shared Modal ──────────────────────────────────────────────────────────────
export const Modal = ({ title, onClose, children }) => (
  <div style={{
    position: "fixed", inset: 0, zIndex: 100,
    display: "flex", alignItems: "flex-start", justifyContent: "center",
    padding: "40px 16px", overflowY: "auto",
  }}>
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)" }} />
    <div className="card fade-up" style={{
      position: "relative", zIndex: 1, width: "100%", maxWidth: 600,
      maxHeight: "85vh", overflowY: "auto",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20 }}>{title}</h2>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "var(--text-muted)" }}>×</button>
      </div>
      {children}
    </div>
  </div>
);

const LoadingState = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
    <span className="spinner" style={{ width: 32, height: 32 }} />
  </div>
);