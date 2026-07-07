// src/pages/MembersScreen.js
import React, { useState, useEffect } from "react";
import { ROLES, roleLabel as _roleLabel, roleColor as _roleColor,
  canManageMembers, canChangeRoles } from "../services/permissions";
import {
  Search, Plus, X, ChevronLeft, ChevronRight, User, Mail, Phone,
  MapPin, Calendar, Heart, BookOpen, FileText, Download, Filter,
  Edit2, Check, Shield, Users, AlertCircle, Camera
} from "lucide-react";
import {
  collection, getDocs, addDoc, updateDoc, doc, serverTimestamp
} from "firebase/firestore";
import { db } from "../services/firebase";

const C = {
  navy:      "#8B1A1A",
  navyMid:   "#6B1111",
  gold:      "#C9A030",
  ivory:     "#FAFAF8",
  ivoryDeep: "#F2EFE9",
  green:     "#2D5A1B",
  greenLight:"#3D7A25",
  ink:       "#1A1008",
  gray:      "#6B6560",
};

function Vitral({ opacity = 0.07, id = "vt" }) {
  return (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity }} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <pattern id={id} width="84" height="84" patternUnits="userSpaceOnUse">
          <path d="M42 0 L84 42 L42 84 L0 42 Z" fill="none" stroke={C.gold} strokeWidth="1" />
          <path d="M42 0 L42 84 M0 42 L84 42" stroke={C.gold} strokeWidth="0.5" />
          <circle cx="42" cy="42" r="6" fill="none" stroke={C.gold} strokeWidth="0.75" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

const ESTADO_CIVIL = ["Solteiro(a)", "Casado(a)", "Divorciado(a)", "Viúvo(a)", "União estável"];
const MINISTERIOS_LIST = [
  "Louvor e Adoração", "Ministério Jovem", "Ação Social", "Ministério Infantil",
  "Mulheres em Oração", "Diaconato", "Escola Bíblica Dominical", "Evangelismo",
  "Intercessão", "Mídia e Comunicação"
];

function statusColor(active) { return active ? C.green : C.gray; }

// ── Exportar CSV ─────────────────────────────────────────────
function exportCSV(members) {
  const headers = [
    "Nome","Email","Telefone","Role","Status","Data Entrada",
    "Nascimento","Estado Civil","Endereço","Batismo","Ministérios","Observações"
  ];
  const rows = members.map(m => [
    m.name || "", m.email || "", m.phone || "",
    _roleLabel(m.role), m.active !== false ? "Ativo" : "Inativo",
    m.joinedAt ? formatDate(m.joinedAt) : "",
    m.birthDate || "", m.maritalStatus || "", m.address || "",
    m.baptismDate || "", (m.ministries || []).join("; "), m.notes || ""
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url;
  a.download = `membros-ibbp-${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

// ── Exportar PDF (HTML→print) ────────────────────────────────
function exportPDF(members) {
  const active = members.filter(m => m.active !== false);
  const inactive = members.filter(m => m.active === false);
  const html = `
    <html><head><meta charset="utf-8">
    <title>Lista de Membros — IBBP</title>
    <style>
      body { font-family: Arial, sans-serif; font-size: 12px; color: #1A1008; margin: 20px; }
      h1 { color: #6B0F0F; font-size: 18px; margin-bottom: 4px; }
      h2 { color: #6B0F0F; font-size: 14px; margin: 20px 0 8px; border-bottom: 1px solid #C8A45A; padding-bottom: 4px; }
      .subtitle { color: #6B6560; font-size: 11px; margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
      th { background: #6B0F0F; color: white; padding: 6px 8px; text-align: left; font-size: 11px; }
      td { padding: 5px 8px; border-bottom: 1px solid #F0E8DC; font-size: 11px; }
      tr:nth-child(even) { background: #FAF6F0; }
      .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; }
      .stats { display: flex; gap: 20px; margin-bottom: 16px; }
      .stat { background: #FAF6F0; border: 1px solid #F0E8DC; padding: 8px 14px; border-radius: 6px; }
      .stat-num { font-size: 20px; font-weight: bold; color: #6B0F0F; }
      .stat-label { font-size: 10px; color: #6B6560; }
      @media print { body { margin: 10px; } }
    </style></head><body>
    <h1>Igreja Bíblica Batista de Pacatuba</h1>
    <div class="subtitle">Lista de Membros — Gerada em ${new Date().toLocaleDateString("pt-BR", {day:"2-digit",month:"long",year:"numeric"})}</div>
    <div class="stats">
      <div class="stat"><div class="stat-num">${members.length}</div><div class="stat-label">Total</div></div>
      <div class="stat"><div class="stat-num">${active.length}</div><div class="stat-label">Ativos</div></div>
      <div class="stat"><div class="stat-num">${inactive.length}</div><div class="stat-label">Inativos</div></div>
    </div>
    <h2>Membros Ativos (${active.length})</h2>
    <table><thead><tr>
      <th>Nome</th><th>Telefone</th><th>Email</th><th>Perfil</th><th>Ministérios</th><th>Membro desde</th>
    </tr></thead><tbody>
    ${active.map(m=>`<tr>
      <td><strong>${m.name||""}</strong></td>
      <td>${m.phone||""}</td>
      <td>${m.email||""}</td>
      <td>${_roleLabel(m.role)}</td>
      <td>${(m.ministries||[]).join(", ")||"—"}</td>
      <td>${m.joinedAt?formatDate(m.joinedAt):"—"}</td>
    </tr>`).join("")}
    </tbody></table>
    ${inactive.length > 0 ? `
    <h2>Membros Inativos (${inactive.length})</h2>
    <table><thead><tr>
      <th>Nome</th><th>Telefone</th><th>Email</th><th>Perfil</th>
    </tr></thead><tbody>
    ${inactive.map(m=>`<tr>
      <td>${m.name||""}</td><td>${m.phone||""}</td>
      <td>${m.email||""}</td><td>${_roleLabel(m.role)}</td>
    </tr>`).join("")}
    </tbody></table>` : ""}
    </body></html>`;
  const w = window.open("","_blank");
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 500);
}

function formatDate(val) {
  if (!val) return "";
  try {
    const iso = val?.toDate ? val.toDate().toISOString().slice(0,10) : String(val).slice(0,10);
    return new Date(iso+"T00:00:00").toLocaleDateString("pt-BR");
  } catch { return ""; }
}

const EMPTY_MEMBER = {
  name: "", email: "", phone: "", role: "membro", active: true,
  birthDate: "", maritalStatus: "", address: "", baptismDate: "",
  joinedAt: new Date().toISOString().slice(0,10),
  ministries: [], notes: "", photoURL: ""
};

// ═══════════════════════════════════════════════════════════
export default function MembersScreen({ userProfile }) {
  const [members, setMembers]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [view, setView]           = useState("list"); // list | detail | form
  const [selected, setSelected]   = useState(null);
  const [form, setForm]           = useState(EMPTY_MEMBER);
  const [isEditing, setIsEditing] = useState(false);
  const [search, setSearch]       = useState("");
  const [filterRole, setFilterRole]   = useState("todos");
  const [filterActive, setFilterActive] = useState("ativos");
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState("");

  const isAdmin = userProfile?.role === "admin";
  const canEdit = canManageMembers(userProfile?.role);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2800); };

  useEffect(() => { loadMembers(); }, []);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      setMembers(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
    } catch { showToast("Erro ao carregar membros."); }
    setLoading(false);
  };

  const filtered = members
    .filter(m => {
      const matchSearch = !search || m.name?.toLowerCase().includes(search.toLowerCase()) ||
        m.email?.toLowerCase().includes(search.toLowerCase()) ||
        m.phone?.includes(search);
      const matchRole = filterRole === "todos" || m.role === filterRole;
      const matchActive = filterActive === "todos" ? true :
        filterActive === "ativos" ? m.active !== false : m.active === false;
      return matchSearch && matchRole && matchActive;
    })
    .sort((a, b) => (a.name || "").localeCompare(b.name || "", "pt-BR", { sensitivity: "base" }));

  const stats = {
    total: members.length,
    ativos: members.filter(m => m.active !== false).length,
    inativos: members.filter(m => m.active === false).length,
    lideres: members.filter(m => m.role === "lider" || m.role === "admin").length,
  };

  const saveForm = async () => {
    if (!form.name.trim()) { showToast("Nome é obrigatório."); return; }
    setSaving(true);
    try {
      if (isEditing && selected?.uid) {
        await updateDoc(doc(db, "users", selected.uid), { ...form, updatedAt: serverTimestamp() });
        setMembers(prev => prev.map(m => m.uid === selected.uid ? { ...m, ...form } : m));
        setSelected({ ...selected, ...form });
        showToast("Membro atualizado!");
      } else {
        const ref = await addDoc(collection(db, "users"), { ...form, createdAt: serverTimestamp() });
        const newMember = { uid: ref.id, ...form };
        setMembers(prev => [...prev, newMember]);
        showToast("Membro cadastrado!");
      }
      setView(isEditing ? "detail" : "list");
      setIsEditing(false);
    } catch { showToast("Erro ao salvar."); }
    setSaving(false);
  };

  const toggleActive = async (member) => {
    const newActive = member.active === false ? true : false;
    try {
      await updateDoc(doc(db, "users", member.uid), { active: newActive });
      setMembers(prev => prev.map(m => m.uid === member.uid ? { ...m, active: newActive } : m));
      if (selected?.uid === member.uid) setSelected({ ...selected, active: newActive });
      showToast(newActive ? "Membro reativado!" : "Membro marcado como inativo.");
    } catch { showToast("Erro ao atualizar status."); }
  };

  const updateRole = async (member, role) => {
    try {
      await updateDoc(doc(db, "users", member.uid), { role });
      setMembers(prev => prev.map(m => m.uid === member.uid ? { ...m, role } : m));
      if (selected?.uid === member.uid) setSelected({ ...selected, role });
      showToast("Perfil atualizado!");
    } catch { showToast("Erro ao atualizar perfil."); }
  };

  // ── LISTA ─────────────────────────────────────────────────
  if (view === "list") return (
    <div style={{ padding: "18px 18px 0" }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(160deg,${C.navy},${C.navyMid})`, borderRadius: 16, padding: 18, position: "relative", overflow: "hidden", marginBottom: 18 }}>
        <Vitral opacity={0.06} id="vt-ml" />
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 className="serif" style={{ color: "#fff", fontSize: 18, margin: "0 0 4px" }}>Lista de Membros</h1>
              <div style={{ color: `${C.gold}`, fontSize: 11.5, fontWeight: 600 }}>Igreja Bíblica Batista de Pacatuba</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => exportCSV(filtered)} title="Exportar CSV" style={{ background: `${C.gold}22`, border: `1px solid ${C.gold}66`, borderRadius: 8, padding: "7px 10px", color: C.gold }}>
                <Download size={15} />
              </button>
              <button onClick={() => exportPDF(filtered)} title="Exportar PDF" style={{ background: `${C.gold}22`, border: `1px solid ${C.gold}66`, borderRadius: 8, padding: "7px 10px", color: C.gold }}>
                <FileText size={15} />
              </button>
            </div>
          </div>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginTop: 14 }}>
            {[
              { label: "Total", value: stats.total },
              { label: "Ativos", value: stats.ativos },
              { label: "Inativos", value: stats.inativos },
              { label: "Líderes", value: stats.lideres },
            ].map(s => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 4px", textAlign: "center" }}>
                <div className="serif" style={{ color: C.gold, fontSize: 18, fontWeight: 700, lineHeight: 1 }}>{s.value}</div>
                <div style={{ color: "#fff", fontSize: 9.5, marginTop: 2, opacity: 0.85 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Busca */}
      <div style={{ position: "relative", marginBottom: 10 }}>
        <Search size={15} color={`${C.ink}66`} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, email ou telefone..."
          style={{ width: "100%", padding: "11px 12px 11px 36px", borderRadius: 10, border: `1.5px solid ${C.ivoryDeep}`, fontSize: 13.5 }} />
        {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none" }}><X size={15} color={C.gray} /></button>}
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 14 }}>
        {[{k:"ativos",l:"Ativos"},{k:"inativos",l:"Inativos"},{k:"todos",l:"Todos"}].map(f => (
          <button key={f.k} onClick={() => setFilterActive(f.k)} style={{
            background: filterActive === f.k ? C.navy : "#fff", color: filterActive === f.k ? "#fff" : C.ink,
            border: `1px solid ${filterActive === f.k ? C.navy : C.ivoryDeep}`, borderRadius: 20,
            padding: "6px 14px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0
          }}>{f.l}</button>
        ))}
        <div style={{ width: 1, background: C.ivoryDeep, flexShrink: 0 }} />
        {[{k:"todos",l:"Todos perfis"}, ...ROLES].map(r => (
          <button key={r.key||r.k} onClick={() => setFilterRole(r.key||r.k)} style={{
            background: filterRole === (r.key||r.k) ? C.navyMid : "#fff",
            color: filterRole === (r.key||r.k) ? "#fff" : C.ink,
            border: `1px solid ${filterRole === (r.key||r.k) ? C.navyMid : C.ivoryDeep}`,
            borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0
          }}>{r.label||r.l}</button>
        ))}
      </div>

      {/* Adicionar membro */}
      {canEdit && (
        <button onClick={() => { setForm(EMPTY_MEMBER); setIsEditing(false); setView("form"); }} style={{
          width: "100%", background: `${C.gold}18`, border: `1.5px dashed ${C.gold}`,
          borderRadius: 10, padding: 11, fontSize: 13, fontWeight: 700, color: C.navy,
          marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8
        }}>
          <Plus size={15} /> Cadastrar novo membro
        </button>
      )}

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: C.gray }}>Carregando...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingBottom: 24 }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "30px 0", color: C.gray, fontSize: 13 }}>Nenhum membro encontrado.</div>
          )}
          {filtered.map(m => (
            <button key={m.uid} onClick={() => { setSelected(m); setView("detail"); }} style={{
              background: m.active === false ? `${C.gray}08` : "#fff",
              border: `1px solid ${m.active === false ? C.gray+"33" : C.ivoryDeep}`,
              borderRadius: 12, padding: 13, display: "flex", alignItems: "center", gap: 12, textAlign: "left",
              opacity: m.active === false ? 0.7 : 1
            }}>
              {/* Avatar */}
              <div style={{
                width: 44, height: 44, borderRadius: 22, flexShrink: 0,
                background: m.photoURL ? "transparent" : `${_roleColor(m.role)}18`,
                border: `2px solid ${_roleColor(m.role)}44`,
                display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden"
              }}>
                {m.photoURL
                  ? <img src={m.photoURL} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span className="serif" style={{ color: _roleColor(m.role), fontWeight: 700, fontSize: 15 }}>
                      {m.name?.split(" ")[0]?.[0]}{m.name?.split(" ")[1]?.[0]||""}
                    </span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span>
                  {m.active === false && <AlertCircle size={13} color={C.gray} />}
                </div>
                <div style={{ fontSize: 12, color: C.gray }}>{m.phone || m.email}</div>
              </div>
              <div style={{ flexShrink: 0, textAlign: "right" }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, color: _roleColor(m.role),
                  background: `${_roleColor(m.role)}15`, padding: "3px 8px", borderRadius: 10, display: "block", marginBottom: 3
                }}>{_roleLabel(m.role)}</span>
                <span style={{ fontSize: 10, color: statusColor(m.active !== false), fontWeight: 600 }}>
                  {m.active !== false ? "● Ativo" : "○ Inativo"}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {toast && <ToastMsg msg={toast} />}
    </div>
  );

  // ── DETALHE ────────────────────────────────────────────────
  if (view === "detail" && selected) return (
    <div style={{ padding: "18px 18px 0" }}>
      <button onClick={() => setView("list")} style={{ background: "none", border: "none", color: C.navyMid, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, marginBottom: 14, padding: 0 }}>
        <ChevronLeft size={16} /> Lista de membros
      </button>

      {/* Card do membro */}
      <div style={{ background: `linear-gradient(160deg,${C.navy},${C.navyMid})`, borderRadius: 16, padding: 20, position: "relative", overflow: "hidden", marginBottom: 18 }}>
        <Vitral opacity={0.06} id="vt-md" />
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 62, height: 62, borderRadius: 31, background: `${C.gold}22`, border: `2px solid ${C.gold}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {selected.photoURL
              ? <img src={selected.photoURL} alt={selected.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span className="serif" style={{ color: C.gold, fontSize: 22, fontWeight: 700 }}>
                  {selected.name?.split(" ")[0]?.[0]}{selected.name?.split(" ")[1]?.[0]||""}
                </span>}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 17 }}>{selected.name}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.navy, background: C.gold, padding: "2px 8px", borderRadius: 10 }}>
                {_roleLabel(selected.role)}
              </span>
              <span style={{ fontSize: 10, fontWeight: 600, color: selected.active !== false ? C.green : C.gray, background: selected.active !== false ? `${C.green}22` : `${C.gray}22`, padding: "2px 8px", borderRadius: 10 }}>
                {selected.active !== false ? "● Ativo" : "○ Inativo"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dados */}
      <div style={{ background: "#fff", border: `1px solid ${C.ivoryDeep}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
        <SectionLabel>Contato</SectionLabel>
        {selected.email && <InfoRow icon={Mail} label={selected.email} />}
        {selected.phone && <InfoRow icon={Phone} label={selected.phone} />}
        {selected.address && <InfoRow icon={MapPin} label={selected.address} />}
      </div>

      <div style={{ background: "#fff", border: `1px solid ${C.ivoryDeep}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
        <SectionLabel>Dados Pessoais</SectionLabel>
        {selected.birthDate && <InfoRow icon={Calendar} label={`Nascimento: ${selected.birthDate}`} />}
        {selected.maritalStatus && <InfoRow icon={Heart} label={`Estado civil: ${selected.maritalStatus}`} />}
        {selected.baptismDate && <InfoRow icon={BookOpen} label={`Batismo: ${selected.baptismDate}`} />}
        {selected.joinedAt && <InfoRow icon={Users} label={`Membro desde: ${formatDate(selected.joinedAt)}`} />}
      </div>

      {(selected.ministries?.length > 0) && (
        <div style={{ background: "#fff", border: `1px solid ${C.ivoryDeep}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
          <SectionLabel>Ministérios</SectionLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
            {selected.ministries.map(m => (
              <span key={m} style={{ fontSize: 11.5, fontWeight: 600, color: C.green, background: `${C.green}12`, border: `1px solid ${C.green}33`, padding: "3px 10px", borderRadius: 12 }}>{m}</span>
            ))}
          </div>
        </div>
      )}

      {selected.notes && (
        <div style={{ background: "#fff", border: `1px solid ${C.ivoryDeep}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
          <SectionLabel>Observações</SectionLabel>
          <p style={{ fontSize: 13.5, color: C.ink, lineHeight: 1.6, margin: "6px 0 0" }}>{selected.notes}</p>
        </div>
      )}

      {/* Ações */}
      {canEdit && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
          <button onClick={() => { setForm({ ...EMPTY_MEMBER, ...selected }); setIsEditing(true); setView("form"); }} style={{
            background: C.navy, color: "#fff", border: "none", borderRadius: 10, padding: 13,
            fontWeight: 700, fontSize: 13.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 8
          }}>
            <Edit2 size={15} /> Editar dados
          </button>

          {isAdmin && (
            <div style={{ background: "#fff", border: `1px solid ${C.ivoryDeep}`, borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.gray, marginBottom: 10 }}>ALTERAR PERFIL</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {ROLES.map(r => (
                  <button key={r.key} onClick={() => updateRole(selected, r.key)} style={{
                    background: selected.role === r.key ? _roleColor(r.key) : `${_roleColor(r.key)}12`,
                    color: selected.role === r.key ? "#fff" : _roleColor(r.key),
                    border: `1px solid ${_roleColor(r.key)}44`, borderRadius: 8,
                    padding: "6px 12px", fontSize: 12, fontWeight: 700
                  }}>{r.label}</button>
                ))}
              </div>
            </div>
          )}

          <button onClick={() => toggleActive(selected)} style={{
            background: "none", border: `1.5px solid ${selected.active !== false ? C.gray : C.green}`,
            color: selected.active !== false ? C.gray : C.green, borderRadius: 10, padding: 12,
            fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8
          }}>
            {selected.active !== false ? <><AlertCircle size={15} /> Marcar como inativo</> : <><Check size={15} /> Reativar membro</>}
          </button>
        </div>
      )}
      {toast && <ToastMsg msg={toast} />}
    </div>
  );

  // ── FORMULÁRIO ─────────────────────────────────────────────
  if (view === "form") return (
    <div style={{ padding: "18px 18px 0" }}>
      <button onClick={() => { setView(isEditing ? "detail" : "list"); setIsEditing(false); }} style={{ background: "none", border: "none", color: C.navyMid, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, marginBottom: 14, padding: 0 }}>
        <ChevronLeft size={16} /> {isEditing ? "Voltar" : "Lista de membros"}
      </button>

      <h2 className="serif" style={{ fontSize: 19, color: C.navy, margin: "0 0 18px", fontWeight: 700 }}>
        {isEditing ? "Editar Membro" : "Novo Membro"}
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingBottom: 24 }}>
        <SectionLabel>Dados Pessoais</SectionLabel>
        <FInput label="Nome completo *" value={form.name} onChange={v => setForm({...form, name: v})} placeholder="Nome e sobrenome" />
        <FInput label="Data de nascimento" value={form.birthDate} onChange={v => setForm({...form, birthDate: v})} type="date" />
        <FSelect label="Estado civil" value={form.maritalStatus} onChange={v => setForm({...form, maritalStatus: v})} options={["", ...ESTADO_CIVIL]} />

        <SectionLabel>Contato</SectionLabel>
        <FInput label="Email" value={form.email} onChange={v => setForm({...form, email: v})} placeholder="email@exemplo.com" type="email" />
        <FInput label="Telefone / WhatsApp" value={form.phone} onChange={v => setForm({...form, phone: v})} placeholder="(85) 99999-0000" />
        <FInput label="Endereço" value={form.address} onChange={v => setForm({...form, address: v})} placeholder="Rua, número, bairro" />

        <SectionLabel>Dados Eclesiásticos</SectionLabel>
        <FInput label="Data de batismo" value={form.baptismDate} onChange={v => setForm({...form, baptismDate: v})} type="date" />
        <FInput label="Membro desde" value={form.joinedAt} onChange={v => setForm({...form, joinedAt: v})} type="date" />
        <FSelect label="Perfil" value={form.role} onChange={v => setForm({...form, role: v})} options={ROLES.map(r => r.key)} labels={ROLES.map(r => r.label)} />

        <SectionLabel>Ministérios</SectionLabel>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {MINISTERIOS_LIST.map(m => {
            const active = form.ministries?.includes(m);
            return (
              <button key={m} onClick={() => setForm({...form, ministries: active ? form.ministries.filter(x=>x!==m) : [...(form.ministries||[]),m]})} style={{
                background: active ? C.green : "#fff", color: active ? "#fff" : C.ink,
                border: `1px solid ${active ? C.green : C.ivoryDeep}`, borderRadius: 20,
                padding: "6px 12px", fontSize: 12, fontWeight: 600
              }}>{m}</button>
            );
          })}
        </div>

        <SectionLabel>Foto (URL)</SectionLabel>
        <FInput label="Link da foto" value={form.photoURL} onChange={v => setForm({...form, photoURL: v})} placeholder="https://..." />
        {form.photoURL && <img src={form.photoURL} alt="Preview" style={{ width: 60, height: 60, borderRadius: 30, objectFit: "cover", border: `2px solid ${C.gold}` }} onError={e => e.target.style.display="none"} />}

        <SectionLabel>Observações</SectionLabel>
        <label style={{ fontSize: 12.5, fontWeight: 600, color: `${C.ink}aa` }}>
          Observações internas
          <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3} placeholder="Visitas pastorais, situação especial, etc."
            style={{ width: "100%", padding: 11, borderRadius: 9, border: `1.5px solid ${C.ivoryDeep}`, marginTop: 6, fontSize: 14, resize: "vertical" }} />
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600 }}>
          <input type="checkbox" checked={form.active !== false} onChange={e => setForm({...form, active: e.target.checked})} />
          Membro ativo
        </label>

        <button onClick={saveForm} disabled={saving} style={{
          background: C.navy, color: "#fff", border: "none", borderRadius: 10, padding: 14,
          fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          opacity: saving ? 0.7 : 1, marginTop: 4
        }}>
          <Check size={17} /> {saving ? "Salvando..." : (isEditing ? "Salvar alterações" : "Cadastrar membro")}
        </button>
      </div>
      {toast && <ToastMsg msg={toast} />}
    </div>
  );

  return null;
}

// ── Componentes auxiliares ────────────────────────────────────
function SectionLabel({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: C.gray, letterSpacing: 0.8, marginTop: 4 }}>{children}</div>;
}

function InfoRow({ icon: Icon, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: `1px solid ${C.ivoryDeep}` }}>
      <Icon size={14} color={C.navyMid} style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 13.5, color: C.ink }}>{label}</span>
    </div>
  );
}

function FInput({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: `${C.ink}aa` }}>
      {label}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", padding: "11px 12px", borderRadius: 9, border: `1.5px solid ${C.ivoryDeep}`, fontSize: 14, marginTop: 5, display: "block" }}
        onFocus={e => e.target.style.borderColor = C.gold}
        onBlur={e => e.target.style.borderColor = C.ivoryDeep} />
    </label>
  );
}

function FSelect({ label, value, onChange, options, labels }) {
  return (
    <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: `${C.ink}aa` }}>
      {label}
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: "100%", padding: 11, borderRadius: 9, border: `1.5px solid ${C.ivoryDeep}`, fontSize: 14, marginTop: 5, display: "block" }}>
        {options.map((o, i) => <option key={o} value={o}>{labels ? labels[i] : o}</option>)}
      </select>
    </label>
  );
}

function ToastMsg({ msg }) {
  return (
    <div style={{
      position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)",
      background: C.navy, color: "#fff", padding: "12px 22px", borderRadius: 10,
      fontSize: 14, fontWeight: 500, boxShadow: "0 8px 24px rgba(0,0,0,.35)", zIndex: 1000,
      border: `1px solid ${C.gold}55`, display: "flex", alignItems: "center", gap: 8,
      maxWidth: "88%", textAlign: "center"
    }}>
      <Check size={16} color={C.gold} /> {msg}
    </div>
  );
}
