// src/services/authService.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

// ── Cadastro de novo membro ───────────────────────────────
export async function registerUser({ name, email, password, phone = "" }) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: name });

  // Cria o documento do usuário no Firestore
  await setDoc(doc(db, "users", credential.user.uid), {
    name,
    email,
    phone,
    role: "membro",          // padrão ao se cadastrar
    ministries: [],
    joinedAt: serverTimestamp(),
    active: true,
  });

  return credential.user;
}

// ── Login ─────────────────────────────────────────────────
export async function loginUser(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

// ── Logout ────────────────────────────────────────────────
export async function logoutUser() {
  await signOut(auth);
}

// ── Busca perfil completo (com role) do Firestore ─────────
export async function fetchUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { uid, ...snap.data() };
}
