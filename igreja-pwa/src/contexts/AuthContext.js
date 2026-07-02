// src/contexts/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase";
import { fetchUserProfile } from "../services/authService";
import {
  isAdmin, canManageMembers, canManageEvents, canManageContent,
  canViewDashboard, canViewMemberList, canManageFinance,
  isLeaderOrAbove, canChangeRoles
} from "../services/permissions";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading]         = useState(true);

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

  const role = userProfile?.role || "membro";

  return (
    <AuthContext.Provider value={{
      currentUser,
      userProfile,
      loading,
      role,
      // Permissões derivadas
      isAdmin:          isAdmin(role),
      isLeader:         isLeaderOrAbove(role),
      canManageMembers: canManageMembers(role),
      canManageEvents:  canManageEvents(role),
      canManageContent: canManageContent(role),
      canViewDashboard: canViewDashboard(role),
      canViewMembers:   canViewMemberList(role),
      canManageFinance: canManageFinance(role),
      canChangeRoles:   canChangeRoles(role),
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
