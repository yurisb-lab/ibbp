// src/services/permissions.js
// Perfis e permissões do app IBB Pacatuba

export const ROLES = [
  { key: "membro",           label: "Membro",              order: 1 },
  { key: "lider_ministerio", label: "Líder de Ministério", order: 2 },
  { key: "lider",            label: "Líder",               order: 3 },
  { key: "secretario",       label: "Secretário",          order: 4 },
  { key: "vice_secretario",  label: "Vice-Secretário",     order: 4 },
  { key: "tesoureiro",       label: "Tesoureiro",          order: 4 },
  { key: "vice_tesoureiro",  label: "Vice-Tesoureiro",     order: 4 },
  { key: "admin",            label: "Pastor/Admin",        order: 5 },
];

export function roleLabel(role) {
  return ROLES.find(r => r.key === role)?.label || role;
}

export function roleColor(role) {
  const map = {
    admin:            "#6B0F0F",
    secretario:       "#2D5A1B",
    vice_secretario:  "#2D5A1B",
    tesoureiro:       "#8B6914",
    vice_tesoureiro:  "#8B6914",
    lider:            "#1A3A5C",
    lider_ministerio: "#5C3A1A",
    membro:           "#6B6560",
  };
  return map[role] || "#6B6560";
}

// ── Helpers de permissão ──────────────────────────────────────

export const isAdmin = (r) => r === "admin";

export const canManageMembers = (r) =>
  ["admin", "secretario", "vice_secretario"].includes(r);

export const canManageEvents = (r) =>
  ["admin", "secretario", "vice_secretario", "lider"].includes(r);

export const canManageContent = (r) =>
  ["admin", "secretario", "vice_secretario", "lider"].includes(r);

export const canViewDashboard = (r) =>
  ["admin", "secretario", "vice_secretario", "tesoureiro", "vice_tesoureiro"].includes(r);

export const canManageFinance = (r) =>
  ["admin", "tesoureiro", "vice_tesoureiro"].includes(r);

export const canViewMemberList = (r) =>
  ["admin", "secretario", "vice_secretario", "lider", "lider_ministerio"].includes(r);

export const canChangeRoles = (r) => r === "admin";

export const isLeaderOrAbove = (r) =>
  ["admin", "secretario", "vice_secretario", "lider", "lider_ministerio",
   "tesoureiro", "vice_tesoureiro"].includes(r);
