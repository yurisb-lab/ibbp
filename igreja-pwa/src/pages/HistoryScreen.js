// src/pages/HistoryScreen.js
import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { getHistory, addHistoryEntry, updateHistoryEntry, deleteHistoryEntry } from "../services/contentService";
import { canManageContent } from "../services/permissions";

const C = {
  navy: "#6B0F0F", navyMid: "#8B1A1A", gold: "#C8A45A",
  ivory: "#FAF6F0", ivoryDeep: "#F0E8DC", green: "#2D5A1B",
  terracotta: "#8B1A1A", ink: "#1A1008", gray: "#6B6560",
};

export default function HistoryScreen({ userProfile }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ year: "", text: "" });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const canEdit = canManageContent(userProfile?.role);
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(""), 2800); };

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const data = await getHistory();
    setEntries(data);
    setLoading(false);
  };

  const save = async () => {
    if (!form.year.trim() || !form.text.trim()) { showToast("Preencha ano e texto."); return; }
    setSaving(true);
    try {
      if (editing) {
        await updateHistoryEntry(editing.id, form);
        setEntries(prev => prev.map(e => e.id === editing.id ? { ...e, ...form } : e).sort((a,b) => String(a.year).localeCompare(String(b.year))));
        showToast("Entrada atualizada!");
      } else {
        const ref = await addHistoryEntry(form);
        setEntries(prev => [...prev, { id: ref.id, ...form }].sort((a,b) => String(a.year).localeCompare(String(b.year))));
        showToast("Entrada adicionada!");
      }
      setForm({ year: "", text: "" }); setEditing(null); setShowForm(false);
    } catch { showToast("Erro ao salvar."); }
    setSaving(false);
  };

  const del = async (entry) => {
    if (!window.confirm(`Excluir entrada de ${entry.year}?`)) return;
    await deleteHistoryEntry(entry.id);
    setEntries(prev => prev.filter(e => e.id !== entry.id));
    showToast("Entrada removida.");
  };

  const startEdit = (entry) => {
    setEditing(entry); setForm({ year: entry.year, text: entry.text });
    setShowForm(true); window.scrollTo(0, 0);
  };

  return (
    <div style={{ padding: "18px 18px 0" }}>
      <div style={{ marginBottom: 18 }}>
        <h1 className="serif" style={{ fontSize: 21, color: C.navy, margin: "0 0 3px", fontWeight: 700 }}>Nossa História</h1>
        <p style={{ fontSize: 12.5, color: `${C.ink}88`, margin: 0 }}>A trajetória da Igreja Bíblica Batista de Pacatuba</p>
      </div>

      {canEdit && (
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ year: "", text: "" }); }} style={{
          width: "100%", background: showForm && !editing ? C.ivoryDeep : `${C.gold}18`,
          border: `1.5px dashed ${C.gold}`, borderRadius: 10, padding: 12, fontSize: 13,
          fontWeight: 700, color: C.navy, marginBottom: 16,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8
        }}>
          {showForm && !editing ? <><X size={15} /> Cancelar</> : <><Plus size={15} /> Adicionar entrada</>}
        </button>
      )}

      {showForm && (
        <div style={{ background: "#fff", border: `1px solid ${C.ivoryDeep}`, borderRadius: 12, padding: 16, marginBottom: 18, display: "flex", flexDirection: "column", gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.navy }}>{editing ? "Editar entrada" : "Nova entrada"}</h3>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: `${C.ink}aa` }}>
            Ano *
            <input value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} placeholder="Ex: 2008"
              style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: `1.5px solid ${C.ivoryDeep}`, fontSize: 14, marginTop: 5, display: "block" }} />
          </label>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: `${C.ink}aa` }}>
            Texto *
            <textarea value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} rows={3}
              placeholder="Descreva o acontecimento histórico..."
              style={{ width: "100%", padding: 11, borderRadius: 9, border: `1.5px solid ${C.ivoryDeep}`, fontSize: 14, marginTop: 5, resize: "vertical", display: "block" }} />
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={save} disabled={saving} style={{ flex: 1, background: C.navy, color: "#fff", border: "none", borderRadius: 9, padding: 12, fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Check size={15} /> {saving ? "Salvando..." : "Salvar"}
            </button>
            <button onClick={() => { setShowForm(false); setEditing(null); setForm({ year: "", text: "" }); }} style={{ background: C.ivoryDeep, border: "none", borderRadius: 9, padding: "12px 16px", fontWeight: 700, fontSize: 14 }}>
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: "center", color: C.gray, padding: "30px 0" }}>Carregando...</p>
      ) : (
        <div style={{ position: "relative", paddingLeft: 22, paddingBottom: 24 }}>
          <div style={{ position: "absolute", left: 6, top: 6, bottom: 6, width: 2, background: C.ivoryDeep }} />
          {entries.map((h) => (
            <div key={h.id} style={{ position: "relative", marginBottom: 24 }}>
              <div style={{ position: "absolute", left: -22, top: 2, width: 14, height: 14, borderRadius: 7, background: C.navy, border: `3px solid ${C.gold}` }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div className="serif" style={{ color: C.terracotta, fontWeight: 700, fontSize: 17, marginBottom: 4 }}>{h.year}</div>
                {canEdit && (
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => startEdit(h)} style={{ background: `${C.gold}18`, border: "none", borderRadius: 6, padding: "4px 8px", color: C.gold }}><Edit2 size={13} /></button>
                    <button onClick={() => del(h)} style={{ background: `${C.navy}12`, border: "none", borderRadius: 6, padding: "4px 8px", color: C.navy }}><Trash2 size={13} /></button>
                  </div>
                )}
              </div>
              <p style={{ fontSize: 13.5, color: C.ink, lineHeight: 1.6, margin: 0 }}>{h.text}</p>
            </div>
          ))}
        </div>
      )}

      {toast && <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", background: C.navy, color: "#fff", padding: "12px 22px", borderRadius: 10, fontSize: 14, fontWeight: 500, zIndex: 1000, border: `1px solid ${C.gold}55` }}>{toast}</div>}
    </div>
  );
}
