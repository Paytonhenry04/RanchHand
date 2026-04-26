// src/pages/ServicesPage.js
// Admin: create and manage service definitions
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  approveServiceRequest,
  assignService,
  createService,
  deleteService,
  getRanchAnimals,
  getRanchAnimalServices,
  getRanchServices,
  removeAnimalService,
  updateService,
} from "../firebase/firestore";
import { Modal } from "./AnimalsPage";

const EMPTY_SERVICE = {
  name: "", description: "", price: "", paymentType: "one-time",
  frequency: "daily",
};

export const ServicesPage = () => {
  const { ranchId, isAdmin } = useAuth();
  const [services, setServices] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [animalServices, setAnimalServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editSvc, setEditSvc] = useState(null);
  const [form, setForm] = useState(EMPTY_SERVICE);
  const [saving, setSaving] = useState(false);
  // Assign modal state
  const [assignModal, setAssignModal] = useState(null); // { serviceId }
  const [assignAnimalId, setAssignAnimalId] = useState("");
  const [assignNotes, setAssignNotes] = useState("");

  const load = async () => {
    const [s, a, as_] = await Promise.all([
      getRanchServices(ranchId),
      getRanchAnimals(ranchId),
      getRanchAnimalServices(ranchId),
    ]);
    setServices(s);
    setAnimals(a);
    setAnimalServices(as_);
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (ranchId) load(); }, [ranchId]);

  const openCreate = () => { setForm(EMPTY_SERVICE); setEditSvc(null); setShowForm(true); };
  const openEdit = (svc) => { setForm({ ...svc }); setEditSvc(svc.id); setShowForm(true); };

  const handleSave = async () => {
    if (!form.name.trim() || !form.price) return;
    setSaving(true);
    try {
      const payload = { ...form, price: parseFloat(form.price) };
      if (editSvc) {
        await updateService(editSvc, payload);
      } else {
        await createService(ranchId, payload);
      }
      await load();
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (svcId) => {
    if (!window.confirm("Delete this service? It will be removed from all animals.")) return;
    await deleteService(svcId);
    await load();
  };

  const handleAssign = async () => {
    if (!assignAnimalId) return;
    setSaving(true);
    try {
      await assignService(assignAnimalId, assignModal.serviceId, ranchId, assignNotes);
      await load();
      setAssignModal(null);
      setAssignAnimalId("");
      setAssignNotes("");
    } finally {
      setSaving(false);
    }
  };

  const pendingRequests = animalServices.filter((as) => as.status === "pending");

  if (loading) return <LoadingState />;

  return (
    <div className="fade-up">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28 }}>Services</h1>
        {isAdmin && <button className="btn btn-primary btn-sm" onClick={openCreate}>+ New Service</button>}
      </div>

      {/* Pending approval requests */}
      {isAdmin && pendingRequests.length > 0 && (
        <div className="card" style={{ marginBottom: 24, borderLeft: "4px solid var(--color-rust)" }}>
          <p style={{ fontWeight: 500, marginBottom: 12, color: "var(--color-rust)" }}>
            🔔 {pendingRequests.length} service request{pendingRequests.length !== 1 ? "s" : ""} pending approval
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pendingRequests.map((req) => {
              const svc = services.find((s) => s.id === req.serviceId);
              const animal = animals.find((a) => a.id === req.animalId);
              return (
                <div key={req.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14 }}><strong>{animal?.name}</strong> — {svc?.name}</p>
                    {req.notes && <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{req.notes}</p>}
                  </div>
                  <button className="btn btn-sm" style={{ background: "var(--color-sage)", color: "#fff" }}
                    onClick={async () => { await approveServiceRequest(req.id); load(); }}>
                    Approve
                  </button>
                  <button className="btn btn-ghost btn-sm"
                    onClick={async () => { await removeAnimalService(req.id); load(); }}>
                    Deny
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Service list */}
      {services.length === 0 ? (
        <div className="card empty-state">
          <span style={{ fontSize: 48 }}>📋</span>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>No services yet</p>
          {isAdmin && <button className="btn btn-primary" onClick={openCreate}>Create First Service</button>}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {services.map((svc) => {
            const assigned = animalServices.filter((as) => as.serviceId === svc.id && as.status === "active");
            return (
              <div key={svc.id} className="card">
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <p style={{ fontWeight: 500, fontSize: 15 }}>{svc.name}</p>
                      <span className={`badge ${svc.paymentType === "recurring" ? "badge-sky" : "badge-tan"}`}>
                        {svc.paymentType === "recurring" ? `${svc.frequency} / $${svc.price}/mo` : `$${svc.price} / use`}
                      </span>
                    </div>
                    {svc.description && <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 6 }}>{svc.description}</p>}
                    <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      Assigned to {assigned.length} animal{assigned.length !== 1 ? "s" : ""}:&nbsp;
                      {assigned.slice(0, 4).map((as) => animals.find((a) => a.id === as.animalId)?.name).filter(Boolean).join(", ")}
                      {assigned.length > 4 && ` +${assigned.length - 4} more`}
                    </p>
                  </div>
                  {isAdmin && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => { setAssignModal({ serviceId: svc.id }); setAssignAnimalId(""); setAssignNotes(""); }}>
                        Assign
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(svc)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(svc.id)}>Delete</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit service modal */}
      {showForm && (
        <Modal title={editSvc ? "Edit Service" : "Create Service"} onClose={() => setShowForm(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <div className="field-group"><label>Service Name *</label><input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Blanketing" /></div>
            <div className="field-group"><label>Description</label><textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} placeholder="Apply/remove blanket based on temp" /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="field-group">
                <label>Payment Type</label>
                <select value={form.paymentType} onChange={(e) => setForm((f) => ({ ...f, paymentType: e.target.value }))}>
                  <option value="one-time">One-time (per completion)</option>
                  <option value="recurring">Recurring (monthly, % completion)</option>
                </select>
              </div>
              <div className="field-group">
                <label>Price ($)</label>
                <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="20.00" />
              </div>
            </div>
            {form.paymentType === "recurring" && (
              <div className="field-group">
                <label>Frequency</label>
                <select value={form.frequency} onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            )}
            {form.paymentType === "recurring" && (
              <div className="card" style={{ background: "rgba(74,127,165,0.08)", border: "1px solid rgba(74,127,165,0.2)", padding: 12, marginBottom: 12, fontSize: 13, color: "var(--color-sky)" }}>
                💡 Recurring services are billed monthly based on % of tasks completed. If a daily task is done 20/30 days, the owner is charged 66% of ${form.price || "X"}/month = ${form.price ? ((20 / 30) * parseFloat(form.price)).toFixed(2) : "X"}.
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <span className="spinner" /> : editSvc ? "Save" : "Create Service"}
            </button>
          </div>
        </Modal>
      )}

      {/* Assign service modal */}
      {assignModal && (
        <Modal title="Assign Service to Animal" onClose={() => setAssignModal(null)}>
          <div className="field-group">
            <label>Select Animal</label>
            <select value={assignAnimalId} onChange={(e) => setAssignAnimalId(e.target.value)}>
              <option value="">— Choose animal —</option>
              {animals.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="field-group">
            <label>Notes (optional)</label>
            <textarea value={assignNotes} onChange={(e) => setAssignNotes(e.target.value)} rows={2} placeholder="e.g. Blanket at 60°F and below" />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button className="btn btn-ghost" onClick={() => setAssignModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAssign} disabled={saving || !assignAnimalId}>
              {saving ? <span className="spinner" /> : "Assign Service"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

const LoadingState = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
    <span className="spinner" style={{ width: 32, height: 32 }} />
  </div>
);