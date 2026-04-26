// src/pages/MyAnimalsPage.js
// Animal owner: view/manage their own animals and request services
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  assignService,
  createAnimal,
  getAnimalServices,
  getRanchAnimals,
  getRanchServices,
  updateAnimal,
} from "../firebase/firestore";
import { Modal } from "./AnimalsPage";

const EMPTY_ANIMAL = {
  name: "", breed: "", age: "", color: "", photoURL: "",
  feedDetails: "", vetName: "", vetPhone: "", vetEmail: "",
  farrierName: "", farrierPhone: "", farrierEmail: "", notes: "",
  isPublic: true,
};

export const MyAnimalsPage = () => {
  const { ranchId, currentUser } = useAuth();
  const [myAnimals, setMyAnimals] = useState([]);
  const [ranchServices, setRanchServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editAnimal, setEditAnimal] = useState(null);
  const [form, setForm] = useState(EMPTY_ANIMAL);
  const [saving, setSaving] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState(null); // for service request
  const [requestModal, setRequestModal] = useState(false);
  const [requestServiceId, setRequestServiceId] = useState("");
  const [requestNotes, setRequestNotes] = useState("");
  const [animalServiceMap, setAnimalServiceMap] = useState({});

  const load = async () => {
    const [allAnimals, svcs] = await Promise.all([
      getRanchAnimals(ranchId),
      getRanchServices(ranchId),
    ]);
    const mine = allAnimals.filter((a) => a.ownerId === currentUser.uid);
    setMyAnimals(mine);
    setRanchServices(svcs);

    // Load services per animal
    const map = {};
    for (const animal of mine) {
      map[animal.id] = await getAnimalServices(animal.id);
    }
    setAnimalServiceMap(map);
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (ranchId) load(); }, [ranchId]);

  const openCreate = () => { setForm(EMPTY_ANIMAL); setEditAnimal(null); setShowForm(true); };
  const openEdit = (animal) => { setForm({ ...animal }); setEditAnimal(animal.id); setShowForm(true); };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editAnimal) {
        await updateAnimal(editAnimal, form);
      } else {
        await createAnimal(ranchId, { ...form, ownerId: currentUser.uid, age: Number(form.age) || 0 });
      }
      await load();
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleRequestService = async () => {
    if (!requestServiceId || !selectedAnimal) return;
    setSaving(true);
    try {
      await assignService(selectedAnimal.id, requestServiceId, ranchId, requestNotes, currentUser.uid);
      await load();
      setRequestModal(false);
      setRequestServiceId("");
      setRequestNotes("");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="fade-up">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28 }}>My Animals</h1>
        <button className="btn btn-primary btn-sm" onClick={openCreate}>+ Add Animal</button>
      </div>

      {myAnimals.length === 0 ? (
        <div className="card empty-state">
          <span style={{ fontSize: 48 }}>🐴</span>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>No animals yet</p>
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
            Add your horse or look for them in the ranch board if an admin already created their record.
          </p>
          <button className="btn btn-primary" onClick={openCreate}>Add My Animal</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {myAnimals.map((animal) => {
            const services = animalServiceMap[animal.id] || [];
            const activeServices = services.filter((s) => s.status === "active");
            const pendingServices = services.filter((s) => s.status === "pending");

            return (
              <div key={animal.id} className="card">
                {/* Animal header */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                  <div style={{
                    width: 60, height: 60, borderRadius: "50%", flexShrink: 0,
                    background: "var(--border)",
                    backgroundImage: animal.photoURL ? `url(${animal.photoURL})` : undefined,
                    backgroundSize: "cover", backgroundPosition: "center",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28,
                  }}>
                    {!animal.photoURL && "🐴"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20 }}>{animal.name}</h2>
                      <span className={`badge ${animal.isPublic ? "badge-green" : "badge-tan"}`}>
                        {animal.isPublic ? "Public" : "Private"}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                      {[animal.breed, animal.color, animal.age ? `${animal.age} yrs` : ""].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(animal)}>Edit</button>
                </div>

                {/* Services */}
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>
                      SERVICES ({activeServices.length} active)
                    </p>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => { setSelectedAnimal(animal); setRequestModal(true); }}
                    >
                      Request Service
                    </button>
                  </div>

                  {activeServices.length === 0 && pendingServices.length === 0 ? (
                    <p style={{ fontSize: 13, color: "var(--text-muted)" }}>No services assigned yet.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {activeServices.map((as) => {
                        const svc = ranchServices.find((s) => s.id === as.serviceId);
                        return (
                          <div key={as.id} style={{
                            display: "flex", alignItems: "center", gap: 10,
                            padding: "8px 10px", borderRadius: "var(--radius-sm)",
                            background: "var(--bg)", border: "1px solid var(--border)",
                          }}>
                            <span className="badge badge-green">Active</span>
                            <span style={{ flex: 1, fontSize: 14 }}>{svc?.name || "Unknown"}</span>
                            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                              {svc?.paymentType === "recurring"
                                ? `$${svc?.price}/mo`
                                : `$${svc?.price}/use`}
                            </span>
                            {as.notes && (
                              <span title={as.notes} style={{ fontSize: 18, cursor: "help" }}>📝</span>
                            )}
                          </div>
                        );
                      })}
                      {pendingServices.map((as) => {
                        const svc = ranchServices.find((s) => s.id === as.serviceId);
                        return (
                          <div key={as.id} style={{
                            display: "flex", alignItems: "center", gap: 10,
                            padding: "8px 10px", borderRadius: "var(--radius-sm)",
                            background: "rgba(181,69,27,0.05)", border: "1px solid rgba(181,69,27,0.2)",
                          }}>
                            <span className="badge badge-rust">Pending</span>
                            <span style={{ flex: 1, fontSize: 14 }}>{svc?.name || "Unknown"}</span>
                            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Awaiting admin approval</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Contact info quick view */}
                {(animal.vetName || animal.farrierName) && (
                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14, marginTop: 14, display: "flex", gap: 20 }}>
                    {animal.vetName && (
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Vet</p>
                        <p style={{ fontSize: 13 }}>{animal.vetName}</p>
                        {animal.vetPhone && <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{animal.vetPhone}</p>}
                      </div>
                    )}
                    {animal.farrierName && (
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Farrier</p>
                        <p style={{ fontSize: 13 }}>{animal.farrierName}</p>
                        {animal.farrierPhone && <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{animal.farrierPhone}</p>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit animal modal */}
      {showForm && (
        <Modal title={editAnimal ? "Edit Animal" : "Add My Animal"} onClose={() => setShowForm(false)}>
          <AnimalForm form={form} setForm={setForm} />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <span className="spinner" /> : editAnimal ? "Save Changes" : "Add Animal"}
            </button>
          </div>
        </Modal>
      )}

      {/* Request service modal */}
      {requestModal && (
        <Modal title={`Request Service for ${selectedAnimal?.name}`} onClose={() => setRequestModal(false)}>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
            Select a service to request. The ranch admin will review and approve it before billing begins.
          </p>
          <div className="field-group">
            <label>Service</label>
            <select value={requestServiceId} onChange={(e) => setRequestServiceId(e.target.value)}>
              <option value="">— Choose a service —</option>
              {ranchServices.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.paymentType === "recurring" ? `$${s.price}/mo` : `$${s.price}/use`}
                </option>
              ))}
            </select>
          </div>
          <div className="field-group">
            <label>Notes (optional)</label>
            <textarea
              value={requestNotes}
              onChange={(e) => setRequestNotes(e.target.value)}
              rows={2}
              placeholder="Any special instructions..."
            />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button className="btn btn-ghost" onClick={() => setRequestModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleRequestService} disabled={saving || !requestServiceId}>
              {saving ? <span className="spinner" /> : "Send Request"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// Reusable animal form (same fields as admin version)
const AnimalForm = ({ form, setForm }) => {
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="field-group"><label>Name *</label><input value={form.name} onChange={set("name")} placeholder="Trigger" /></div>
        <div className="field-group"><label>Breed</label><input value={form.breed} onChange={set("breed")} placeholder="Quarter Horse" /></div>
        <div className="field-group"><label>Age</label><input type="number" value={form.age} onChange={set("age")} placeholder="8" /></div>
        <div className="field-group"><label>Color</label><input value={form.color} onChange={set("color")} placeholder="Bay" /></div>
      </div>
      <div className="field-group"><label>Photo URL</label><input value={form.photoURL} onChange={set("photoURL")} placeholder="https://..." /></div>
      <div className="field-group"><label>Feed Details</label><textarea value={form.feedDetails} onChange={set("feedDetails")} rows={2} placeholder="2 flakes hay AM/PM..." /></div>
      <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Vet</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div className="field-group"><label>Name</label><input value={form.vetName} onChange={set("vetName")} /></div>
        <div className="field-group"><label>Phone</label><input value={form.vetPhone} onChange={set("vetPhone")} /></div>
        <div className="field-group"><label>Email</label><input value={form.vetEmail} onChange={set("vetEmail")} /></div>
      </div>
      <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Farrier</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div className="field-group"><label>Name</label><input value={form.farrierName} onChange={set("farrierName")} /></div>
        <div className="field-group"><label>Phone</label><input value={form.farrierPhone} onChange={set("farrierPhone")} /></div>
        <div className="field-group"><label>Email</label><input value={form.farrierEmail} onChange={set("farrierEmail")} /></div>
      </div>
      <div className="field-group"><label>Notes</label><textarea value={form.notes} onChange={set("notes")} rows={2} placeholder="Special needs..." /></div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input type="checkbox" id="isPublic" checked={form.isPublic} onChange={(e) => setForm((f) => ({ ...f, isPublic: e.target.checked }))} />
        <label htmlFor="isPublic" style={{ fontSize: 14, cursor: "pointer" }}>Public record (visible to other ranch members)</label>
      </div>
    </div>
  );
};

const LoadingState = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
    <span className="spinner" style={{ width: 32, height: 32 }} />
  </div>
);