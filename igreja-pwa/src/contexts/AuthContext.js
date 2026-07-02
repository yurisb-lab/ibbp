// src/contexts/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase";
import { fetchUserProfile } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser]   = useState(null);  // Firebase user
  const [userProfile, setUserProfile]   = useState(null);  // Firestore profile (com role)
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await fetchUserProfile(firebaseUser.uid);
        setCurrentUser(firebaseUser);
        setUserProfile(profile);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const isLeader = userProfile?.role === "lider" || userProfile?.role === "admin";
  const isAdmin  = userProfile?.role === "admin";

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading, isLeader, isAdmin }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
