// src/firebase/firestore.js
// Firestore collection helpers + data shapes
//
// ─── COLLECTION STRUCTURE ──────────────────────────────────────────────────
//
//  ranches/{ranchId}
//    name: string
//    code: string          ← 6-digit join code
//    createdAt: timestamp
//    ownerId: string       ← uid of creating admin
//
//  users/{uid}
//    displayName: string
//    email: string
//    ranchId: string | null
//    role: "admin" | "user"
//    createdAt: timestamp
//
//  animals/{animalId}
//    ranchId: string
//    ownerId: string | null   ← uid of horse owner (user), null if admin-created
//    name: string
//    breed: string
//    age: number
//    color: string
//    photoURL: string | null
//    feedDetails: string
//    vetName: string
//    vetPhone: string
//    vetEmail: string
//    farrierName: string
//    farrierPhone: string
//    farrierEmail: string
//    notes: string
//    isPublic: boolean        ← user can toggle visibility
//    sortOrder: number        ← custom drag-and-drop order
//    createdAt: timestamp
//
//  services/{serviceId}
//    ranchId: string
//    name: string
//    description: string
//    price: number
//    paymentType: "one-time" | "recurring"   ← one-time billed per completion, recurring billed monthly by %
//    frequency: "daily" | "weekly" | "monthly" | null
//    createdAt: timestamp
//
//  animalServices/{animalServiceId}
//    animalId: string
//    serviceId: string
//    ranchId: string
//    notes: string            ← per-animal service notes (e.g. "blanket at 60°")
//    status: "active" | "pending" | "inactive"   ← pending = user requested, needs admin approval
//    requestedBy: string | null  ← uid if user-requested
//    assignedAt: timestamp | null
//
//  serviceCompletions/{completionId}
//    animalServiceId: string
//    animalId: string
//    serviceId: string
//    ranchId: string
//    completedAt: timestamp
//    completedBy: string      ← admin uid who checked it off
//    month: string            ← "YYYY-MM" for easy monthly rollup
//
// ─────────────────────────────────────────────────────────────────────────────

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./config";

// ── Ranch ────────────────────────────────────────────────────────────────────

export const generateRanchCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

export const createRanch = async (name, adminUid) => {
  const code = generateRanchCode();
  const ref = await addDoc(collection(db, "ranches"), {
    name,
    code,
    ownerId: adminUid,
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, code };
};

export const getRanchByCode = async (code) => {
  const q = query(collection(db, "ranches"), where("code", "==", code));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...docSnap.data() };
};

export const getRanch = async (ranchId) => {
  const snap = await getDoc(doc(db, "ranches", ranchId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

// ── User Profile ─────────────────────────────────────────────────────────────

export const createUserProfile = async (uid, data) => {
  await setDoc(doc(db, "users", uid), {
    ...data,
    ranchId: null,
    role: "user",
    createdAt: serverTimestamp(),
  });
};

export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const updateUserProfile = async (uid, data) => {
  await updateDoc(doc(db, "users", uid), data);
};

export const joinRanch = async (uid, ranchId) => {
  await updateDoc(doc(db, "users", uid), { ranchId });
};

export const promoteToAdmin = async (uid) => {
  await updateDoc(doc(db, "users", uid), { role: "admin" });
};

export const getRanchMembers = async (ranchId) => {
  const q = query(collection(db, "users"), where("ranchId", "==", ranchId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// ── Animals ──────────────────────────────────────────────────────────────────

export const createAnimal = async (ranchId, data) => {
  const ref = await addDoc(collection(db, "animals"), {
    ...data,
    ranchId,
    isPublic: true,
    sortOrder: Date.now(),
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const getAnimal = async (animalId) => {
  const snap = await getDoc(doc(db, "animals", animalId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const getRanchAnimals = async (ranchId) => {
  const q = query(
    collection(db, "animals"),
    where("ranchId", "==", ranchId)
  );
  const snap = await getDocs(q);
  // Sort client-side to avoid requiring a composite Firestore index
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
};

export const updateAnimal = async (animalId, data) => {
  await updateDoc(doc(db, "animals", animalId), data);
};

export const updateAnimalOrder = async (animals) => {
  const updates = animals.map((animal, idx) =>
    updateDoc(doc(db, "animals", animal.id), { sortOrder: idx })
  );
  await Promise.all(updates);
};

// ── Services ─────────────────────────────────────────────────────────────────

export const createService = async (ranchId, data) => {
  const ref = await addDoc(collection(db, "services"), {
    ...data,
    ranchId,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const getRanchServices = async (ranchId) => {
  const q = query(collection(db, "services"), where("ranchId", "==", ranchId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const updateService = async (serviceId, data) => {
  await updateDoc(doc(db, "services", serviceId), data);
};

export const deleteService = async (serviceId) => {
  await deleteDoc(doc(db, "services", serviceId));
};

// ── Animal Services (assignments) ────────────────────────────────────────────

export const assignService = async (animalId, serviceId, ranchId, notes = "", requestedBy = null) => {
  const ref = await addDoc(collection(db, "animalServices"), {
    animalId,
    serviceId,
    ranchId,
    notes,
    status: requestedBy ? "pending" : "active",
    requestedBy,
    assignedAt: requestedBy ? null : serverTimestamp(),
  });
  return ref.id;
};

export const getAnimalServices = async (animalId) => {
  const q = query(collection(db, "animalServices"), where("animalId", "==", animalId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getRanchAnimalServices = async (ranchId) => {
  const q = query(collection(db, "animalServices"), where("ranchId", "==", ranchId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const approveServiceRequest = async (animalServiceId) => {
  await updateDoc(doc(db, "animalServices", animalServiceId), {
    status: "active",
    assignedAt: serverTimestamp(),
  });
};

export const updateAnimalServiceNotes = async (animalServiceId, notes) => {
  await updateDoc(doc(db, "animalServices", animalServiceId), { notes });
};

export const removeAnimalService = async (animalServiceId) => {
  await updateDoc(doc(db, "animalServices", animalServiceId), { status: "inactive" });
};

// ── Service Completions ──────────────────────────────────────────────────────

export const markServiceComplete = async (animalServiceId, animalId, serviceId, ranchId, completedBy) => {
  const month = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const ref = await addDoc(collection(db, "serviceCompletions"), {
    animalServiceId,
    animalId,
    serviceId,
    ranchId,
    completedAt: serverTimestamp(),
    completedBy,
    month,
  });
  return ref.id;
};

export const getCompletionsForMonth = async (ranchId, month) => {
  const q = query(
    collection(db, "serviceCompletions"),
    where("ranchId", "==", ranchId),
    where("month", "==", month)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getTodayCompletions = async (ranchId) => {
  const today = new Date().toISOString().slice(0, 10);
  const q = query(
    collection(db, "serviceCompletions"),
    where("ranchId", "==", ranchId)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((c) => {
      const d = c.completedAt?.toDate?.();
      return d && d.toISOString().slice(0, 10) === today;
    });
};

// ── Billing Calculations (client-side, tracking only) ────────────────────────

/**
 * Calculate the billing summary for a user or animal for the current month.
 * No money is transferred — this is purely for display/tracking.
 *
 * @param {Array} animalServices   - active animalService records
 * @param {Array} services         - all service definitions for the ranch
 * @param {Array} completions      - completions for the current month
 * @param {number} daysInMonth     - total days in current month
 * @param {number} daysPassed      - days elapsed so far this month
 * @returns {{ projected: number, actual: number, breakdown: Array }}
 */
export const calculateBilling = (animalServices, services, completions, daysInMonth, daysPassed) => {
  const serviceMap = Object.fromEntries(services.map((s) => [s.id, s]));
  let projected = 0;
  let actual = 0;
  const breakdown = [];

  for (const as of animalServices) {
    if (as.status !== "active") continue;
    const svc = serviceMap[as.serviceId];
    if (!svc) continue;

    const asCompletions = completions.filter((c) => c.animalServiceId === as.id);

    if (svc.paymentType === "one-time") {
      // Billed per completion
      const amount = asCompletions.length * svc.price;
      actual += amount;
      projected += amount; // one-time: projected = completed
      breakdown.push({
        serviceId: svc.id,
        name: svc.name,
        type: "one-time",
        completions: asCompletions.length,
        amount,
      });
    } else if (svc.paymentType === "recurring") {
      // Monthly fee prorated by completion %
      const expectedCompletions = svc.frequency === "daily" ? daysInMonth : 1;
      const completedCount = asCompletions.length;
      const pct = Math.min(completedCount / expectedCompletions, 1);
      const projectedPct = Math.min(completedCount / Math.max(daysPassed, 1), 1);
      actual += pct * svc.price;
      projected += projectedPct * svc.price;
      breakdown.push({
        serviceId: svc.id,
        name: svc.name,
        type: "recurring",
        completedCount,
        expectedCompletions,
        pct: Math.round(pct * 100),
        amount: pct * svc.price,
        projectedAmount: projectedPct * svc.price,
      });
    }
  }

  return { projected: +projected.toFixed(2), actual: +actual.toFixed(2), breakdown };
};