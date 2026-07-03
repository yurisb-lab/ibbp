// src/pages/MinistriesScreen.js
import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Check, X, Mail, Users } from "lucide-react";
import { getMinistries, addMinistry, updateMinistry, deleteMinistry } from "../services/contentService";
import { canManageContent } from "../services/permissions";

const C = {
  navy: "#6B0F0F", navyMid: "#8B1A1A", gold: "#C8A45A",
  ivory: "#FAF6F0", ivoryDeep: "#F0E8DC", green: "#2D5A1B",
  ink: "#1A1008", gray: "#6B6560",
};

const EMPTY = { name: "", leader: "", description: "", contact: "", order: 99 };

export default function MinistriesScreen({ userProfile }) {
  const [ministries, setMinistries] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(EMPTY);
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState("");

  const canEdit = canManageContent(userProfile?.role);
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(""), 2800); };

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const data = await getMinistries();
    setMinistries(data);
    setLoading(false);
  };

  const save = async () => {
    if (!form.name.trim()) { showToast("Nome do ministério é obrigatório."); return; }
    setSaving(true);
    try {
      if (editing) {
        await updateMinistry(editing.id, form);
        setMinistries(prev => prev.map(m => m.id === editing.id ? { ...m, ...form } : m));
        showToast("Ministério atualizado!");
      } else {
        const ref = await addMinistry(form);
        setMinistries(prev => [...prev, { id: ref.id, ...form }]);
        showToast("Ministério adicionado!");
      }
      setForm(EMPTY); setEditing(null); setShowForm(false);
    } catch { showToast("Erro ao salvar."); }
    setSaving(false);
  };

  const del = async (m) => {
    if (!window.confirm(`Excluir ministério "${m.name}"?`)) return;
    await deleteMinistry(m.id);
    setMinistries(prev => prev.filter(x => x.id !== m.id));
    showToast("Ministério removido.");
  };

  const startEdit = (m) => {
    setEditing(m); setForm({ name: m.name, leader: m.leader, description: m.description, contact: m.contact, order: m.order || 99 });
    setShowForm(true); window.scrollTo(0, 0);
  };

  return (
    <div style={{ padding: "18px 18px 0" }}>
      <div style={{ marginBottom: 18 }}>
        <h1 className="serif" style={{ fontSize: 21, color: C.navy, margin: "0 0 3px", fontWeight: 700 }}>Ministérios</h1>
        <p style={{ fontSize: 12.5, color: `${C.ink}88`, margin: 0 }}>Sirva conosco em uma destas áreas</p>
      </div>

      {canEdit && (
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm(EMPTY); }} style={{
          width: "100%", background: showForm && !editing ? C.ivoryDeep : `${C.gold}18`,
          border: `1.5px dashed ${C.gold}`, borderRadius: 10, padding: 12, fontSize: 13,
          fontWeight: 700, color: C.navy, marginBottom: 16,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8
        }}>
          {showForm && !editing ? <><X size={15} /> Cancelar</> : <><Plus size={15} /> Adicionar ministério</>}
        </button>
      )}

      {showForm && (
        <div style={{ background: "#fff", border: `1px solid ${C.ivoryDeep}`, borderRadius: 12, padding: 16, marginBottom: 18, display: "flex", flexDirection: "column", gap: 10 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.navy }}>{editing ? "Editar ministério" : "Novo ministério"}</h3>
          {[
            { label: "Nome *", key: "name", placeholder: "Ex: Louvor e Adoração" },
            { label: "Líder responsável", key: "leader", placeholder: "Nome do líder" },
            { label: "Contato / Email", key: "contact", placeholder: "email@ibbpacatuba.org" },
          ].map(f => (
            <label key={f.key} style={{ fontSize: 12.5, fontWeight: 600, color: `${C.ink}aa` }}>
              {f.label}
              <input value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: `1.5px solid ${C.ivoryDeep}`, fontSize: 14, marginTop: 5, display: "block" }} />
            </label>
          ))}
          <label style={{ fontSize: 12.5, fontWeight: 600, color: `${C.ink}aa` }}>
            Descrição
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
              placeholder="Descreva o propósito do ministério..."
              style={{ width: "100%", padding: 11, borderRadius: 9, border: `1.5px solid ${C.ivoryDeep}`, fontSize: 14, marginTop: 5, resize: "vertical", display: "block" }} />
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={save} disabled={saving} style={{ flex: 1, background: C.navy, color: "#fff", border: "none", borderRadius: 9, padding: 12, fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Check size={15} /> {saving ? "Salvando..." : "Salvar"}
            </button>
            <button onClick={() => { setShowForm(false); setEditing(null); setForm(EMPTY); }} style={{ background: C.ivoryDeep, border: "none", borderRadius: 9, padding: "12px 16px", fontWeight: 700, fontSize: 14 }}>
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: "center", color: C.gray, padding: "30px 0" }}>Carregando...</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 24 }}>
          {ministries.map(m => (
            <div key={m.id} style={{ background: "#fff", border: `1px solid ${C.ivoryDeep}`, borderRadius: 12, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: C.navy }}>{m.name}</div>
                {canEdit && (
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => startEdit(m)} style={{ background: `${C.gold}18`, border: "none", borderRadius: 6, padding: "4px 8px", color: C.gold }}><Edit2 size={13} /></button>
                    <button onClick={() => del(m)} style={{ background: `${C.navy}12`, border: "none", borderRadius: 6, padding: "4px 8px", color: C.navy }}><Trash2 size={13} /></button>
                  </div>
                )}
              </div>
              {m.description && <p style={{ fontSize: 13, color: `${C.ink}99`, lineHeight: 1.5, margin: "0 0 10px" }}>{m.description}</p>}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: `${C.ink}88`, alignItems: "center" }}>
                {m.leader && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Users size={12} /> {m.leader}</span>}
                {m.contact && <span style={{ display: "flex", alignItems: "center", gap: 4, color: C.navyMid, fontWeight: 600 }}><Mail size={12} /> {m.contact}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", background: C.navy, color: "#fff", padding: "12px 22px", borderRadius: 10, fontSize: 14, fontWeight: 500, zIndex: 1000, border: `1px solid ${C.gold}55` }}>{toast}</div>}
    </div>
  );
}
