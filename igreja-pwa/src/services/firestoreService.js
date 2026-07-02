// src/services/firestoreService.js
import {
  collection, doc,
  addDoc, setDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, where, orderBy, limit,
  serverTimestamp, increment,
} from "firebase/firestore";
import { db } from "./firebase";

// ═══════════════════════════════════════════════════════════
//  EVENTOS
// ═══════════════════════════════════════════════════════════

export async function getEvents() {
  const q = query(collection(db, "events"), orderBy("date", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addEvent(data) {
  return addDoc(collection(db, "events"), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function deleteEvent(id) {
  return deleteDoc(doc(db, "events", id));
}

// ═══════════════════════════════════════════════════════════
//  AVISOS / NOTÍCIAS
// ═══════════════════════════════════════════════════════════

export async function getNews() {
  const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addNews(data) {
  return addDoc(collection(db, "news"), {
    ...data,
    pinned: false,
    createdAt: serverTimestamp(),
  });
}

export async function togglePinNews(id, pinned) {
  return updateDoc(doc(db, "news", id), { pinned });
}

export async function deleteNews(id) {
  return deleteDoc(doc(db, "news", id));
}

// ═══════════════════════════════════════════════════════════
//  PEDIDOS DE ORAÇÃO
// ═══════════════════════════════════════════════════════════

export async function getPrayers() {
  const q = query(
    collection(db, "prayers"),
    where("isPublic", "==", true),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addPrayer(data) {
  return addDoc(collection(db, "prayers"), {
    ...data,
    prayedBy: 0,
    createdAt: serverTimestamp(),
  });
}

export async function incrementPrayed(id) {
  return updateDoc(doc(db, "prayers", id), {
    prayedBy: increment(1),
  });
}

// ═══════════════════════════════════════════════════════════
//  MEMBROS (acesso restrito a liderança)
// ═══════════════════════════════════════════════════════════

export async function getMembers() {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
}

export async function updateMemberRole(uid, role) {
  return updateDoc(doc(db, "users", uid), { role });
}

// ═══════════════════════════════════════════════════════════
//  DEVOCIONAL
// ═══════════════════════════════════════════════════════════

export async function getTodayDevotional() {
  const today = new Date().toISOString().slice(0, 10);
  const q = query(
    collection(db, "devotionals"),
    where("date", "==", today),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

export async function addDevotional(data) {
  return addDoc(collection(db, "devotionals"), {
    ...data,
    createdAt: serverTimestamp(),
  });
}
