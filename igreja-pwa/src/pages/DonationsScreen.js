// src/pages/DonationsScreen.js
import React, { useState, useEffect } from "react";
import { Copy, Check, Edit2, Save, X } from "lucide-react";
import { getChurchInfo, saveChurchInfo } from "../services/contentService";
import { canManageContent } from "../services/permissions";

const C = {
  navy: "#8B1A1A", navyMid: "#6B1111", gold: "#C9A030",
  ivory: "#FAFAF8", ivoryDeep: "#F2EFE9", ink: "#1A1008", gray: "#6B6560",
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

export default function DonationsScreen({ userProfile, show }) {
  const [info, setInfo]         = useState(null);
  const [editing, setEditing]   = useState(false);
  const [form, setForm]         = useState({});
  const [saving, setSaving]     = useState(false);
  const [copied, setCopied]     = useState(false);

  const canEdit = canManageContent(userProfile?.role);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const data = await getChurchInfo();
    setInfo(data); setForm(data);
  };

  const copy = () => {
    navigator.clipboard?.writeText(info.pixKey).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
    show && show("Chave PIX copiada!");
  };

  const save = async () => {
    setSaving(true);
    try {
      await saveChurchInfo(form);
      setInfo(form); setEditing(false);
      show && show("Informações salvas!");
    } catch { show && show("Erro ao salvar."); }
    setSaving(false);
  };

  if (!info) return <div style={{ padding: "40px 18px", textAlign: "center", color: C.gray }}>Carregando...</div>;

  return (
    <div style={{ padding: "18px 18px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
        <div>
          <h1 className="serif" style={{ fontSize: 21, color: C.navy, margin: "0 0 3px", fontWeight: 700 }}>Dízimos e Ofertas</h1>
          <p style={{ fontSize: 12.5, color: `${C.ink}88`, margin: 0 }}>"Trazei todos os dízimos" — Malaquias 3:10</p>
        </div>
        {canEdit && !editing && (
          <button onClick={() => setEditing(true)} style={{ background: `${C.gold}18`, border: `1px solid ${C.gold}66`, borderRadius: 8, padding: "7px 12px", color: C.navy, display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700 }}>
            <Edit2 size={14} /> Editar
          </button>
        )}
      </div>

      {editing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingBottom: 24 }}>
          <div style={{ background: "#fff", border: `1px solid ${C.ivoryDeep}`, borderRadius: 12, padding: 16 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: C.navy }}>Dados PIX</h3>
            {[
              { label: "Tipo da chave", key: "pixType", placeholder: "CNPJ, CPF, Email, Telefone" },
              { label: "Chave PIX", key: "pixKey", placeholder: "Ex: 12.345.678/0001-90" },
            ].map(f => (
              <label key={f.key} style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: `${C.ink}aa`, marginBottom: 10 }}>
                {f.label}
                <input value={form[f.key] || ""} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: `1.5px solid ${C.ivoryDeep}`, fontSize: 14, marginTop: 5, display: "block" }} />
              </label>
            ))}
          </div>

          <div style={{ background: "#fff", border: `1px solid ${C.ivoryDeep}`, borderRadius: 12, padding: 16 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: C.navy }}>Dados Bancários</h3>
            {[
              { label: "Banco", key: "bankName", placeholder: "Ex: Banco do Brasil" },
              { label: "Agência", key: "bankAgency", placeholder: "Ex: 1234-5" },
              { label: "Conta Corrente", key: "bankAccount", placeholder: "Ex: 12345-6" },
              { label: "Favorecido", key: "bankHolder", placeholder: "Nome do favorecido" },
            ].map(f => (
              <label key={f.key} style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: `${C.ink}aa`, marginBottom: 10 }}>
                {f.label}
                <input value={form[f.key] || ""} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: `1.5px solid ${C.ivoryDeep}`, fontSize: 14, marginTop: 5, display: "block" }} />
              </label>
            ))}
          </div>

          <div style={{ background: "#fff", border: `1px solid ${C.ivoryDeep}`, borderRadius: 12, padding: 16 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: C.navy }}>Mensagem para Doadores</h3>
            <textarea value={form.donationMessage || ""} onChange={e => setForm({ ...form, donationMessage: e.target.value })} rows={3}
              style={{ width: "100%", padding: 11, borderRadius: 9, border: `1.5px solid ${C.ivoryDeep}`, fontSize: 14, resize: "vertical" }} />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={save} disabled={saving} style={{ flex: 1, background: C.navy, color: "#fff", border: "none", borderRadius: 10, padding: 13, fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Save size={15} /> {saving ? "Salvando..." : "Salvar"}
            </button>
            <button onClick={() => { setEditing(false); setForm(info); }} style={{ background: C.ivoryDeep, border: "none", borderRadius: 10, padding: "13px 16px", fontWeight: 700, fontSize: 14 }}>
              <X size={15} />
            </button>
          </div>
        </div>
      ) : (
        <div style={{ paddingBottom: 24 }}>
          <div style={{ background: `linear-gradient(160deg,${C.navy},${C.navyMid})`, borderRadius: 16, padding: 22, position: "relative", overflow: "hidden", marginBottom: 18 }}>
            <Vitral opacity={0.07} id="vt-don" />
            <div style={{ position: "relative" }}>
              <div style={{ color: C.gold, fontSize: 11.5, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>CHAVE PIX — {info.pixType || "CNPJ"}</div>
              <div style={{ color: "#fff", fontSize: 19, fontWeight: 700, marginBottom: 14, letterSpacing: 0.5 }}>{info.pixKey}</div>
              <button onClick={copy} style={{ background: C.gold, color: C.navy, border: "none", borderRadius: 9, padding: "11px 18px", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                {copied ? <><Check size={15} /> Copiado!</> : <><Copy size={15} /> Copiar chave PIX</>}
              </button>
            </div>
          </div>

          <div style={{ background: "#fff", border: `1px solid ${C.ivoryDeep}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Dados bancários</div>
            {[
              ["Banco", info.bankName],
              ["Agência", info.bankAgency],
              ["Conta corrente", info.bankAccount],
              ["Favorecido", info.bankHolder],
            ].filter(([,v]) => v).map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.ivoryDeep}`, fontSize: 13 }}>
                <span style={{ color: `${C.ink}88` }}>{k}</span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>

          {info.donationMessage && (
            <div style={{ fontSize: 12, color: `${C.ink}77`, lineHeight: 1.6 }}>{info.donationMessage}</div>
          )}
        </div>
      )}
    </div>
  );
}
