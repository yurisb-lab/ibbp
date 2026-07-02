import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAEjZ3YTgLjGay84v3rjak1gH0a8i6qn-s",
  authDomain: "siteibbp.firebaseapp.com",
  projectId: "siteibbp",
  storageBucket: "siteibbp.firebasestorage.app",
  messagingSenderId: "1098929410467",
  appId: "1:1098929410467:web:02c83d15b4818712be8a16",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;