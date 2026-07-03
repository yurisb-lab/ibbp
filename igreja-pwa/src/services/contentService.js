// src/services/contentService.js
// Gerencia conteúdos editáveis da igreja no Firestore

import {
  doc, getDoc, setDoc, collection, getDocs,
  addDoc, updateDoc, deleteDoc, serverTimestamp
} from "firebase/firestore";
import { db } from "./firebase";

// ── Configurações / Informações da Igreja ────────────────────
export async function getChurchInfo() {
  const snap = await getDoc(doc(db, "settings", "church_info"));
  if (!snap.exists()) return getDefaultChurchInfo();
  return snap.data();
}

export async function saveChurchInfo(data) {
  await setDoc(doc(db, "settings", "church_info"), {
    ...data, updatedAt: serverTimestamp()
  });
}

export function getDefaultChurchInfo() {
  return {
    name: "Igreja Bíblica Batista de Pacatuba",
    founded: "2008",
    address: "Pacatuba — Ceará",
    phone: "",
    email: "contato@ibbpacatuba.org",
    instagram: "@ibbpacatuba",
    youtube: "IBB Pacatuba",
    about: "A Igreja Bíblica Batista de Pacatuba é uma comunidade de fé comprometida com a Palavra de Deus e o serviço à comunidade.",
    pixKey: "12.345.678/0001-90",
    pixType: "CNPJ",
    bankName: "Banco do Brasil",
    bankAgency: "1234-5",
    bankAccount: "12345-6",
    bankHolder: "Igreja Bíblica Batista de Pacatuba",
    donationMessage: "Sua contribuição sustenta o trabalho da igreja, os ministérios e as ações sociais na comunidade de Pacatuba.",
  };
}

// ── Nossa História ────────────────────────────────────────────
export async function getHistory() {
  const snap = await getDocs(collection(db, "history"));
  if (snap.empty) return getDefaultHistory();
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => String(a.year).localeCompare(String(b.year)));
}

export async function addHistoryEntry(data) {
  return addDoc(collection(db, "history"), {
    ...data, createdAt: serverTimestamp()
  });
}

export async function updateHistoryEntry(id, data) {
  return updateDoc(doc(db, "history", id), {
    ...data, updatedAt: serverTimestamp()
  });
}

export async function deleteHistoryEntry(id) {
  return deleteDoc(doc(db, "history", id));
}

export function getDefaultHistory() {
  return [
    { id: "h1", year: "2008", text: "Fundação da Igreja Bíblica Batista de Pacatuba por um pequeno grupo de famílias reunidas em uma casa, com a visão de pregar o evangelho na região." },
    { id: "h2", year: "2012", text: "Construção do primeiro templo, erguido em mutirão pelos próprios membros." },
    { id: "h3", year: "2018", text: "Ampliação do templo sede e construção das salas de Escola Bíblica Dominical." },
    { id: "h4", year: "2020", text: "Adaptação para cultos com transmissão online durante a pandemia." },
    { id: "h5", year: "2026", text: "A igreja celebra sua história, mantendo viva sua missão de anunciar a Palavra e servir a comunidade de Pacatuba." },
  ];
}

// ── Ministérios ───────────────────────────────────────────────
export async function getMinistries() {
  const snap = await getDocs(collection(db, "ministries"));
  if (snap.empty) return getDefaultMinistries();
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function addMinistry(data) {
  return addDoc(collection(db, "ministries"), {
    ...data, createdAt: serverTimestamp()
  });
}

export async function updateMinistry(id, data) {
  return updateDoc(doc(db, "ministries", id), {
    ...data, updatedAt: serverTimestamp()
  });
}

export async function deleteMinistry(id) {
  return deleteDoc(doc(db, "ministries", id));
}

export function getDefaultMinistries() {
  return [
    { id: "m1", name: "Louvor e Adoração",   leader: "A definir", description: "Responsável pela música e adoração nos cultos.", contact: "louvor@ibbpacatuba.org",   order: 1 },
    { id: "m2", name: "Ministério Jovem",    leader: "A definir", description: "Discipulado e comunhão para jovens de 15 a 29 anos.", contact: "jovens@ibbpacatuba.org",  order: 2 },
    { id: "m3", name: "Ação Social",         leader: "A definir", description: "Campanhas de doação e apoio à comunidade.", contact: "social@ibbpacatuba.org",  order: 3 },
    { id: "m4", name: "Ministério Infantil", leader: "A definir", description: "Cuidado e ensino bíblico para crianças.", contact: "kids@ibbpacatuba.org",    order: 4 },
    { id: "m5", name: "Mulheres em Oração",  leader: "A definir", description: "Encontros de oração e estudo voltados às mulheres.", contact: "mulheres@ibbpacatuba.org", order: 5 },
    { id: "m6", name: "Diaconato",           leader: "A definir", description: "Apoio prático à igreja e cuidado pastoral.", contact: "diaconato@ibbpacatuba.org",order: 6 },
  ];
}
