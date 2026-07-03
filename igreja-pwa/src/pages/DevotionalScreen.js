// src/pages/DevotionalScreen.js
import React, { useState, useEffect } from "react";
import { Star, Edit2, Save, X, Sparkles, BookOpen, RefreshCw, Check, Plus, Trash2 } from "lucide-react";
import {
  doc, getDoc, setDoc, collection, getDocs,
  addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, serverTimestamp
} from "firebase/firestore";
import { db } from "../services/firebase";
import { canManageContent } from "../services/permissions";

const C = {
  navy: "#6B0F0F", navyMid: "#8B1A1A", gold: "#C8A45A",
  ivory: "#FAF6F0", ivoryDeep: "#F0E8DC", green: "#2D5A1B",
  ink: "#1A1008", gray: "#6B6560",
};

function Vitral({ opacity = 0.07, id = "vt" }) {
  return (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity }}
      preserveAspectRatio="xMidYMid slice" aria-hidden="true">
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

const EMPTY_FORM = { title: "", verse: "", theme: "", text: "", date: new Date().toISOString().slice(0, 10) };

export default function DevotionalScreen({ userProfile }) {
  const [devotional, setDevotional] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [view, setView]             = useState("read"); // read | edit | generate | history
  const [form, setForm]             = useState(EMPTY_FORM);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [history, setHistory]       = useState([]);
  const [toast, setToast]           = useState("");
  const [apiKey, setApiKey]         = useState("");

  const canEdit = canManageContent(userProfile?.role);
  const isAdmin = userProfile?.role === "admin";

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(""), 3000); };

  useEffect(() => { loadToday(); if (canEdit) loadApiKey(); }, []);

  const loadApiKey = async () => {
    try {
      const snap = await getDoc(doc(db, "settings", "ai_config"));
      if (snap.exists()) setApiKey(snap.data().anthropicKey || "");
    } catch {}
  };

  const saveApiKey = async (key) => {
    await setDoc(doc(db, "settings", "ai_config"), { anthropicKey: key }, { merge: true });
    setApiKey(key);
    showToast("Chave salva!");
  };

  const loadToday = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const q = query(collection(db, "devotionals"), where("date", "==", today), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setDevotional({ id: snap.docs[0].id, ...snap.docs[0].data() });
      } else {
        // Tenta buscar o mais recente
        const q2 = query(collection(db, "devotionals"), orderBy("date", "desc"), limit(1));
        const snap2 = await getDocs(q2);
        if (!snap2.empty) setDevotional({ id: snap2.docs[0].id, ...snap2.docs[0].data() });
        else setDevotional(null);
      }
    } catch {}
    setLoading(false);
  };

  const loadHistory = async () => {
    try {
      const q = query(collection(db, "devotionals"), orderBy("date", "desc"), limit(10));
      const snap = await getDocs(q);
      setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch {}
  };

  const generateWithAI = async () => {
    if (!form.verse.trim()) { showToast("Informe o versículo base."); return; }
    if (!apiKey) { showToast("Configure a chave da API da Anthropic primeiro."); return; }

    setGenerating(true);
    try {
      const prompt = `Você é um pastor batista reformado com profundo conhecimento das Escrituras e da teologia reformada. 
Escreva um devocional cristão em português brasileiro com as seguintes características:

- Versículo base: ${form.verse}
- Tema (se fornecido): ${form.theme || "livre, baseado no versículo"}
- Título sugerido: ${form.title || "crie um título adequado"}

O devocional deve:
1. Ser fundamentado nas Escrituras, com perspectiva reformada/batista
2. Ter entre 150 e 250 palavras
3. Incluir aplicação prática para a vida cristã
4. Ser acessível para toda a congregação
5. Terminar com um pensamento ou oração curta

Responda APENAS com o texto do devocional, sem títulos extras, sem introdução, direto ao ponto.`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await response.json();
      const text = data.content?.[0]?.text || "";

      if (text) {
        setForm(prev => ({
          ...prev,
          text,
          title: prev.title || gerarTitulo(form.verse),
        }));
        showToast("Devocional gerado! Revise e publique.");
      } else {
        showToast("Erro ao gerar. Tente novamente.");
      }
    } catch (e) {
      showToast("Erro de conexão com a IA.");
    }
    setGenerating(false);
  };

  const gerarTitulo = (verse) => {
    return `Meditando em ${verse}`;
  };

  const saveDevotional = async () => {
    if (!form.title.trim() || !form.verse.trim() || !form.text.trim()) {
      showToast("Preencha título, versículo e texto."); return;
    }
    setSaving(true);
    try {
      if (devotional && form.date === devotional.date) {
        await updateDoc(doc(db, "devotionals", devotional.id), { ...form, updatedAt: serverTimestamp() });
        setDevotional({ ...devotional, ...form });
      } else {
        const ref = await addDoc(collection(db, "devotionals"), { ...form, createdAt: serverTimestamp() });
        setDevotional({ id: ref.id, ...form });
      }
      setView("read");
      showToast("Devocional publicado!");
    } catch { showToast("Erro ao salvar."); }
    setSaving(false);
  };

  const deleteDevotional = async (id) => {
    if (!window.confirm("Excluir este devocional?")) return;
    await deleteDoc(doc(db, "devotionals", id));
    if (devotional?.id === id) { setDevotional(null); setView("read"); }
    setHistory(prev => prev.filter(d => d.id !== id));
    showToast("Devocional removido.");
  };

  const formatDate = (iso) => {
    if (!iso) return "";
    return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  };

  // ── LEITURA ────────────────────────────────────────────────
  if (view === "read") return (
    <div style={{ padding: "18px 18px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h1 className="serif" style={{ fontSize: 21, color: C.navy, margin: "0 0 2px", fontWeight: 700 }}>Devocional Diário</h1>
          <div style={{ fontSize: 12, color: C.gray }}>{formatDate(new Date().toISOString().slice(0,10))}</div>
        </div>
        {canEdit && (
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => { loadHistory(); setView("history"); }} style={{ background: C.ivoryDeep, border: "none", borderRadius: 8, padding: "7px 10px", fontSize: 12, fontWeight: 600, color: C.ink }}>
              Histórico
            </button>
            <button onClick={() => { setForm(devotional ? { title: devotional.title, verse: devotional.verse, theme: devotional.theme || "", text: devotional.text, date: devotional.date } : { ...EMPTY_FORM }); setView("edit"); }} style={{
              background: `${C.gold}18`, border: `1px solid ${C.gold}66`, borderRadius: 8, padding: "7px 12px", color: C.navy, display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700
            }}>
              <Edit2 size={14} /> {devotional ? "Editar" : "Criar"}
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: C.gray }}>
          <RefreshCw size={24} style={{ marginBottom: 10, opacity: 0.5 }} />
          <div style={{ fontSize: 13 }}>Carregando devocional...</div>
        </div>
      ) : devotional ? (
        <>
          <div style={{ background: `linear-gradient(160deg,${C.navy},${C.navyMid})`, borderRadius: 16, padding: 22, position: "relative", overflow: "hidden", marginBottom: 18 }}>
            <Vitral opacity={0.07} id="vt-dv" />
            <div style={{ position: "relative" }}>
              <Star size={20} color={C.gold} fill={C.gold} />
              <h2 className="serif" style={{ color: "#fff", fontSize: 20, margin: "10px 0 6px" }}>{devotional.title}</h2>
              <div style={{ color: C.gold, fontSize: 13, fontWeight: 700, marginBottom: 16 }}>{devotional.verse}</div>
              <p style={{ color: `#ffffffdd`, fontSize: 14.5, lineHeight: 1.8, margin: 0, whiteSpace: "pre-wrap" }}>{devotional.text}</p>
            </div>
          </div>
          <div style={{ fontSize: 11.5, color: C.gray, textAlign: "center", paddingBottom: 24 }}>
            Publicado em {formatDate(devotional.date)}
          </div>
        </>
      ) : (
        <div style={{ textAlign: "center", padding: "60px 20px", color: C.gray }}>
          <BookOpen size={36} style={{ marginBottom: 12, opacity: 0.3 }} />
          <div style={{ fontSize: 14, marginBottom: 16 }}>Nenhum devocional publicado hoje.</div>
          {canEdit && (
            <button onClick={() => { setForm(EMPTY_FORM); setView("edit"); }} style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 10, padding: "12px 20px", fontWeight: 700, fontSize: 13 }}>
              Criar devocional de hoje
            </button>
          )}
        </div>
      )}
      {toast && <Toast msg={toast} />}
    </div>
  );

  // ── EDITOR ─────────────────────────────────────────────────
  if (view === "edit") return (
    <div style={{ padding: "18px 18px 0" }}>
      <button onClick={() => setView("read")} style={{ background: "none", border: "none", color: C.navyMid, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, marginBottom: 14, padding: 0 }}>
        ← Voltar
      </button>
      <h2 className="serif" style={{ fontSize: 19, color: C.navy, margin: "0 0 16px", fontWeight: 700 }}>
        {devotional ? "Editar Devocional" : "Novo Devocional"}
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingBottom: 24 }}>
        {/* Data */}
        <FInput label="Data de publicação" value={form.date} onChange={v => setForm({...form, date: v})} type="date" />

        {/* Versículo */}
        <FInput label="Versículo base *" value={form.verse} onChange={v => setForm({...form, verse: v})} placeholder="Ex: João 3:16 ou Salmos 23:1-6" />

        {/* Tema */}
        <FInput label="Tema (opcional)" value={form.theme} onChange={v => setForm({...form, theme: v})} placeholder="Ex: A graça de Deus, Fé e confiança..." />

        {/* Título */}
        <FInput label="Título *" value={form.title} onChange={v => setForm({...form, title: v})} placeholder="Ex: Firmados na Graça" />

        {/* Botão gerar com IA */}
        <button onClick={generateWithAI} disabled={generating || !form.verse.trim()} style={{
          background: generating ? C.ivoryDeep : `linear-gradient(135deg, ${C.navy}, ${C.navyMid})`,
          color: generating ? C.gray : "#fff", border: "none", borderRadius: 10, padding: 13,
          fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          opacity: !form.verse.trim() ? 0.5 : 1
        }}>
          {generating
            ? <><RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} /> Gerando com IA...</>
            : <><Sparkles size={16} /> Gerar reflexão com IA</>}
        </button>

        {generating && (
          <div style={{ textAlign: "center", fontSize: 12, color: C.gray, fontStyle: "italic" }}>
            A IA está meditando nas Escrituras... aguarde alguns segundos.
          </div>
        )}

        {/* Texto */}
        <label style={{ fontSize: 12.5, fontWeight: 600, color: `${C.ink}aa` }}>
          Texto do devocional *
          <textarea
            value={form.text}
            onChange={e => setForm({...form, text: e.target.value})}
            rows={10}
            placeholder="O texto da reflexão aparecerá aqui após a geração pela IA, ou você pode escrever manualmente..."
            style={{ width: "100%", padding: 12, borderRadius: 9, border: `1.5px solid ${C.ivoryDeep}`, fontSize: 14, marginTop: 5, resize: "vertical", lineHeight: 1.6, display: "block" }}
          />
        </label>

        {/* Prévia */}
        {form.text && (
          <div style={{ background: `${C.navy}08`, border: `1px solid ${C.navy}22`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.gray, marginBottom: 8, letterSpacing: 0.5 }}>PRÉVIA</div>
            <div className="serif" style={{ fontSize: 15, color: C.navy, fontWeight: 700, marginBottom: 4 }}>{form.title || "Sem título"}</div>
            <div style={{ fontSize: 12, color: C.gold, fontWeight: 600, marginBottom: 10 }}>{form.verse}</div>
            <p style={{ fontSize: 13, color: C.ink, lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>{form.text.slice(0, 200)}{form.text.length > 200 ? "..." : ""}</p>
          </div>
        )}

        <button onClick={saveDevotional} disabled={saving} style={{
          background: C.green, color: "#fff", border: "none", borderRadius: 10, padding: 14,
          fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 8
        }}>
          <Check size={17} /> {saving ? "Publicando..." : "Publicar devocional"}
        </button>

        {/* Config chave API (só admin) */}
        {isAdmin && (
          <details style={{ marginTop: 8 }}>
            <summary style={{ fontSize: 12, color: C.gray, cursor: "pointer", fontWeight: 600 }}>
              ⚙️ Configuração da IA
            </summary>
            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
              <input
                type="password"
                defaultValue={apiKey}
                placeholder="sk-ant-..."
                id="api-key-input"
                style={{ flex: 1, padding: "10px 12px", borderRadius: 9, border: `1.5px solid ${C.ivoryDeep}`, fontSize: 13 }}
              />
              <button
                onClick={() => {
                  const key = document.getElementById("api-key-input").value;
                  if (key) saveApiKey(key);
                }}
                style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 9, padding: "0 14px", fontWeight: 700, fontSize: 13 }}
              >
                Salvar
              </button>
            </div>
          </details>
        )}
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
      {toast && <Toast msg={toast} />}
    </div>
  );

  // ── HISTÓRICO ──────────────────────────────────────────────
  if (view === "history") return (
    <div style={{ padding: "18px 18px 0" }}>
      <button onClick={() => setView("read")} style={{ background: "none", border: "none", color: C.navyMid, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, marginBottom: 14, padding: 0 }}>
        ← Voltar
      </button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 className="serif" style={{ fontSize: 19, color: C.navy, margin: 0, fontWeight: 700 }}>Histórico</h2>
        <button onClick={() => { setForm(EMPTY_FORM); setView("edit"); }} style={{
          background: C.navy, color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6
        }}>
          <Plus size={14} /> Novo
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 24 }}>
        {history.length === 0 && <div style={{ textAlign: "center", padding: "30px 0", color: C.gray, fontSize: 13 }}>Nenhum devocional cadastrado ainda.</div>}
        {history.map(d => (
          <div key={d.id} style={{ background: "#fff", border: `1px solid ${C.ivoryDeep}`, borderRadius: 12, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.ink, marginBottom: 2 }}>{d.title}</div>
                <div style={{ fontSize: 12, color: C.gold, fontWeight: 600, marginBottom: 4 }}>{d.verse}</div>
                <div style={{ fontSize: 11, color: C.gray }}>{formatDate(d.date)}</div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button onClick={() => {
                  setForm({ title: d.title, verse: d.verse, theme: d.theme||"", text: d.text, date: d.date });
                  setView("edit");
                }} style={{ background: `${C.gold}18`, border: "none", borderRadius: 6, padding: "5px 8px", color: C.gold }}>
                  <Edit2 size={13} />
                </button>
                <button onClick={() => deleteDevotional(d.id)} style={{ background: `${C.navy}12`, border: "none", borderRadius: 6, padding: "5px 8px", color: C.navy }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {toast && <Toast msg={toast} />}
    </div>
  );

  return null;
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

function Toast({ msg }) {
  return (
    <div style={{
      position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)",
      background: C.navy, color: "#fff", padding: "12px 22px", borderRadius: 10,
      fontSize: 14, fontWeight: 500, zIndex: 1000, border: `1px solid ${C.gold}55`,
      maxWidth: "88%", textAlign: "center"
    }}>{msg}</div>
  );
}
