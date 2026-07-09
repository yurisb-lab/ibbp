// src/pages/DevotionalScreen.js
import React, { useState, useEffect } from "react";
import {
  Star, Edit2, Save, X, Sparkles, BookOpen,
  RefreshCw, Check, Plus, Trash2, ChevronLeft,
  FileText, Calendar, ChevronDown, ChevronUp
} from "lucide-react";
import {
  doc, getDoc, setDoc, collection, getDocs,
  addDoc, updateDoc, deleteDoc, query,
  where, orderBy, limit, serverTimestamp
} from "firebase/firestore";
import { db } from "../services/firebase";
import { canManageContent } from "../services/permissions";

const C = {
  navy:      "#8B1A1A",
  navyMid:   "#6B1111",
  gold:      "#C9A030",
  ivory:     "#FAFAF8",
  ivoryDeep: "#F2EFE9",
  green:     "#2D5A1B",
  ink:       "#1A1008",
  gray:      "#6B6560",
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

function Toast({ msg }) {
  return (
    <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", background: C.navy, color: "#fff", padding: "12px 22px", borderRadius: 10, fontSize: 14, fontWeight: 500, zIndex: 1000, border: `1px solid ${C.gold}55`, maxWidth: "88%", textAlign: "center" }}>
      {msg}
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return "";
  try { return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }); }
  catch { return iso; }
}

function addDays(iso, days) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function DevotionalScreen({ userProfile }) {
  const [devotional, setDevotional] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [view, setView]             = useState("read"); // read | sermon | generated | history | edit
  const [history, setHistory]       = useState([]);
  const [toast, setToast]           = useState("");
  const [saving, setSaving]         = useState(false);

  // Sermão
  const [sermonText, setSermonText]   = useState("");
  const [sermonTitle, setSermonTitle] = useState("");
  const [sermonVerse, setSermonVerse] = useState("");
  const [numDevocionais, setNum]      = useState(5);
  const [generating, setGenerating]   = useState(false);
  const [apiKey, setApiKey]           = useState("");

  // Devocionais gerados
  const [generated, setGenerated]   = useState([]);
  const [startDate, setStartDate]   = useState(new Date().toISOString().slice(0, 10));
  const [editingIdx, setEditingIdx] = useState(null);

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
    showToast("Chave salva com sucesso!");
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
      const q = query(collection(db, "devotionals"), orderBy("date", "desc"), limit(20));
      const snap = await getDocs(q);
      setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch {}
  };

  // ── Gerar devocionais a partir do sermão ──────────────────
  const generateFromSermon = async () => {
    if (!sermonText.trim()) { showToast("Cole o texto do sermão primeiro."); return; }
    if (!apiKey) { showToast("Configure a chave da API nas configurações."); return; }

    setGenerating(true);

    const prompt = `Você é um pastor batista reformado experiente. A seguir está o texto de um sermão pregado na Igreja Bíblica Batista de Pacatuba.

Sua tarefa é dividir o conteúdo deste sermão em exatamente ${numDevocionais} devocionais diários curtos, em português brasileiro.

Cada devocional deve:
- Ter um título inspirador (máximo 6 palavras)
- Ter um versículo bíblico de referência (pode ser do próprio sermão ou complementar)
- Ter uma reflexão de 80 a 120 palavras, baseada no conteúdo do sermão
- Ser fiel à teologia reformada/batista
- Ser acessível para toda a congregação

SERMÃO:
Título: ${sermonTitle || "Sermão"}
Versículo base: ${sermonVerse || "não informado"}
---
${sermonText}
---

Responda APENAS com um JSON válido, sem markdown, sem explicações, neste formato exato:
[
  {
    "title": "Título do devocional 1",
    "verse": "Livro 0:0",
    "text": "Texto da reflexão..."
  },
  ...
]`;

    try {
      // Proxy via Cloudflare Worker (evita CORS)
      const response = await fetch("https://iaibbp.yurisb.workers.dev", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, apiKey }),
      });

      const responseText = await response.text();
      console.log("Worker resposta raw:", responseText);
      console.log("Status:", response.status);

      if (!responseText || responseText.trim() === "") {
        showToast("Worker retornou resposta vazia. Verifique o Cloudflare.");
        setGenerating(false);
        return;
      }

      const data = JSON.parse(responseText);
      console.log("Data:", JSON.stringify(data).slice(0, 200));

      if (data.error) {
        showToast("Erro da IA: " + data.error);
        setGenerating(false);
        return;
      }

      const raw = data.content?.[0]?.text || "";
      if (!raw) {
        showToast("IA não retornou texto. Verifique a chave da API.");
        setGenerating(false);
        return;
      }

      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      if (Array.isArray(parsed) && parsed.length > 0) {
        setGenerated(parsed.slice(0, numDevocionais));
        setView("generated");
        showToast(`${parsed.length} devocionais gerados! Revise e publique.`);
      } else {
        showToast("Erro no formato retornado pela IA. Tente novamente.");
      }
    } catch (e) {
      console.error("Erro completo:", e);
      showToast("Erro: " + e.message);
    }
    setGenerating(false);
  };

  // ── Publicar todos os devocionais gerados ─────────────────
  const publishAll = async () => {
    setSaving(true);
    let ok = 0;
    try {
      for (let i = 0; i < generated.length; i++) {
        const dv = generated[i];
        const date = addDays(startDate, i);
        await addDoc(collection(db, "devotionals"), {
          title: dv.title, verse: dv.verse, text: dv.text,
          date, sermonTitle: sermonTitle || "",
          createdAt: serverTimestamp(),
        });
        ok++;
      }
      showToast(`${ok} devocionais publicados!`);
      setView("read");
      setGenerated([]);
      setSermonText(""); setSermonTitle(""); setSermonVerse("");
      await loadToday();
    } catch { showToast("Erro ao publicar. Tente novamente."); }
    setSaving(false);
  };

  // ── Publicar devocional único ─────────────────────────────
  const publishOne = async (dv, date) => {
    try {
      await addDoc(collection(db, "devotionals"), {
        title: dv.title, verse: dv.verse, text: dv.text,
        date, createdAt: serverTimestamp(),
      });
      showToast("Devocional publicado!");
      await loadToday();
    } catch { showToast("Erro ao publicar."); }
  };

  const deleteDevotional = async (id) => {
    if (!window.confirm("Excluir este devocional?")) return;
    await deleteDoc(doc(db, "devotionals", id));
    setHistory(prev => prev.filter(d => d.id !== id));
    if (devotional?.id === id) { setDevotional(null); }
    showToast("Devocional removido.");
  };

  // ══════════════════════════════════════════════════════════
  // VIEW: LEITURA
  if (view === "read") return (
    <div style={{ padding: "18px 18px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h1 className="serif" style={{ fontSize: 21, color: C.navy, margin: "0 0 2px", fontWeight: 700 }}>Devocional Diário</h1>
          <div style={{ fontSize: 12, color: C.gray }}>{formatDate(new Date().toISOString().slice(0, 10))}</div>
        </div>
        {canEdit && (
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => { loadHistory(); setView("history"); }} style={{ background: C.ivoryDeep, border: "none", borderRadius: 8, padding: "7px 10px", fontSize: 12, fontWeight: 600, color: C.ink }}>
              Histórico
            </button>
            <button onClick={() => setView("sermon")} style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 8, padding: "7px 12px", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
              <Sparkles size={14} /> Novo sermão
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: C.gray }}>Carregando...</div>
      ) : devotional ? (
        <>
          <div style={{ background: `linear-gradient(160deg,${C.navy},${C.navyMid})`, borderRadius: 16, padding: 22, position: "relative", overflow: "hidden", marginBottom: 18 }}>
            <Vitral opacity={0.07} id="vt-dv" />
            <div style={{ position: "relative" }}>
              <Star size={20} color={C.gold} fill={C.gold} />
              <h2 className="serif" style={{ color: "#fff", fontSize: 20, margin: "10px 0 6px" }}>{devotional.title}</h2>
              <div style={{ color: C.gold, fontSize: 13, fontWeight: 700, marginBottom: 16 }}>{devotional.verse}</div>
              <p style={{ color: "#ffffffdd", fontSize: 14.5, lineHeight: 1.8, margin: 0, whiteSpace: "pre-wrap" }}>{devotional.text}</p>
            </div>
          </div>
          {devotional.sermonTitle && (
            <div style={{ fontSize: 11.5, color: C.gray, textAlign: "center", marginBottom: 8 }}>
              Baseado no sermão: <strong>{devotional.sermonTitle}</strong>
            </div>
          )}
          <div style={{ fontSize: 11.5, color: C.gray, textAlign: "center", paddingBottom: 24 }}>
            Publicado em {formatDate(devotional.date)}
          </div>
        </>
      ) : (
        <div style={{ textAlign: "center", padding: "60px 20px", color: C.gray }}>
          <BookOpen size={36} style={{ marginBottom: 12, opacity: 0.3 }} />
          <div style={{ fontSize: 14, marginBottom: 16 }}>Nenhum devocional publicado hoje.</div>
          {canEdit && (
            <button onClick={() => setView("sermon")} style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 10, padding: "12px 20px", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 8, margin: "0 auto" }}>
              <Sparkles size={15} /> Gerar devocionais do sermão
            </button>
          )}
        </div>
      )}
      {toast && <Toast msg={toast} />}
    </div>
  );

  // ══════════════════════════════════════════════════════════
  // VIEW: INSERIR SERMÃO
  if (view === "sermon") return (
    <div style={{ padding: "18px 18px 0" }}>
      <button onClick={() => setView("read")} style={{ background: "none", border: "none", color: C.navy, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, marginBottom: 14, padding: 0 }}>
        <ChevronLeft size={16} /> Voltar
      </button>

      <div style={{ marginBottom: 18 }}>
        <h2 className="serif" style={{ fontSize: 19, color: C.navy, margin: "0 0 4px", fontWeight: 700 }}>Gerar Devocionais do Sermão</h2>
        <p style={{ fontSize: 12.5, color: C.gray, margin: 0 }}>Cole o texto do sermão e a IA divide em devocionais diários para a semana</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingBottom: 24 }}>

        <label style={{ fontSize: 12.5, fontWeight: 600, color: `${C.ink}aa` }}>
          Título do sermão (opcional)
          <input value={sermonTitle} onChange={e => setSermonTitle(e.target.value)} placeholder="Ex: A Graça Suficiente"
            style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: `1.5px solid ${C.ivoryDeep}`, fontSize: 14, marginTop: 5, display: "block" }} />
        </label>

        <label style={{ fontSize: 12.5, fontWeight: 600, color: `${C.ink}aa` }}>
          Versículo base (opcional)
          <input value={sermonVerse} onChange={e => setSermonVerse(e.target.value)} placeholder="Ex: 2 Coríntios 12:9"
            style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: `1.5px solid ${C.ivoryDeep}`, fontSize: 14, marginTop: 5, display: "block" }} />
        </label>

        <label style={{ fontSize: 12.5, fontWeight: 600, color: `${C.ink}aa` }}>
          Quantos devocionais gerar?
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            {[2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setNum(n)} style={{
                background: numDevocionais === n ? C.navy : C.ivoryDeep,
                color: numDevocionais === n ? "#fff" : C.ink,
                border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 700, fontSize: 14
              }}>{n}</button>
            ))}
          </div>
        </label>

        <label style={{ fontSize: 12.5, fontWeight: 600, color: `${C.ink}aa` }}>
          Texto do sermão *
          <textarea value={sermonText} onChange={e => setSermonText(e.target.value)} rows={12}
            placeholder="Cole aqui o texto completo do sermão, notas de pregação ou esboço..."
            style={{ width: "100%", padding: 12, borderRadius: 9, border: `1.5px solid ${C.ivoryDeep}`, fontSize: 13.5, marginTop: 5, resize: "vertical", lineHeight: 1.6, display: "block" }} />
          <div style={{ fontSize: 11, color: C.gray, marginTop: 4 }}>
            {sermonText.length > 0 ? `${sermonText.length} caracteres · aprox. ${Math.round(sermonText.split(" ").length)} palavras` : "Quanto mais detalhado, melhor o resultado"}
          </div>
        </label>

        <button onClick={generateFromSermon} disabled={generating || !sermonText.trim()} style={{
          background: generating ? C.ivoryDeep : `linear-gradient(135deg, ${C.navy}, ${C.navyMid})`,
          color: generating ? C.gray : "#fff", border: "none", borderRadius: 10, padding: 14,
          fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          opacity: !sermonText.trim() ? 0.5 : 1
        }}>
          {generating
            ? <><RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} /> Analisando o sermão...</>
            : <><Sparkles size={16} /> Gerar {numDevocionais} devocionais com IA</>}
        </button>

        {generating && (
          <div style={{ textAlign: "center", fontSize: 12.5, color: C.gray, fontStyle: "italic", background: C.ivoryDeep, borderRadius: 8, padding: "10px 14px" }}>
            A IA está lendo e dividindo o sermão em reflexões diárias... isso pode levar até 30 segundos.
          </div>
        )}

        {/* Config chave API */}
        {isAdmin && (
          <details style={{ marginTop: 4 }}>
            <summary style={{ fontSize: 12, color: C.gray, cursor: "pointer", fontWeight: 600 }}>
              ⚙️ Configuração da API da Anthropic
            </summary>
            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
              <input type="password" defaultValue={apiKey} placeholder="sk-ant-..."
                id="api-key-input"
                style={{ flex: 1, padding: "10px 12px", borderRadius: 9, border: `1.5px solid ${C.ivoryDeep}`, fontSize: 13 }} />
              <button onClick={() => { const k = document.getElementById("api-key-input").value; if (k) saveApiKey(k); }}
                style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 9, padding: "0 14px", fontWeight: 700, fontSize: 13 }}>
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

  // ══════════════════════════════════════════════════════════
  // VIEW: DEVOCIONAIS GERADOS
  if (view === "generated") return (
    <div style={{ padding: "18px 18px 0" }}>
      <button onClick={() => setView("sermon")} style={{ background: "none", border: "none", color: C.navy, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, marginBottom: 14, padding: 0 }}>
        <ChevronLeft size={16} /> Voltar ao sermão
      </button>

      <div style={{ marginBottom: 16 }}>
        <h2 className="serif" style={{ fontSize: 19, color: C.navy, margin: "0 0 4px", fontWeight: 700 }}>
          {generated.length} Devocionais Gerados
        </h2>
        <p style={{ fontSize: 12.5, color: C.gray, margin: 0 }}>Revise, edite e defina a data de início para publicar</p>
      </div>

      {/* Data de início */}
      <div style={{ background: "#fff", border: `1px solid ${C.ivoryDeep}`, borderRadius: 12, padding: 14, marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <Calendar size={18} color={C.navy} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.ink, marginBottom: 4 }}>Data de início da publicação</div>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
            style={{ border: `1.5px solid ${C.ivoryDeep}`, borderRadius: 8, padding: "8px 10px", fontSize: 14, width: "100%" }} />
        </div>
      </div>

      {/* Lista dos devocionais */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
        {generated.map((dv, i) => {
          const date = addDays(startDate, i);
          const isEditing = editingIdx === i;
          return (
            <div key={i} style={{ background: "#fff", border: `1.5px solid ${isEditing ? C.gold : C.ivoryDeep}`, borderRadius: 12, overflow: "hidden" }}>
              {/* Cabeçalho */}
              <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${C.navy}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span className="serif" style={{ fontSize: 14, fontWeight: 800, color: C.navy }}>{i + 1}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{dv.title}</div>
                  <div style={{ fontSize: 11.5, color: C.gold, fontWeight: 600 }}>{dv.verse} · {formatDate(date)}</div>
                </div>
                <button onClick={() => setEditingIdx(isEditing ? null : i)} style={{ background: isEditing ? C.navy : C.ivoryDeep, border: "none", borderRadius: 6, padding: "5px 8px", color: isEditing ? "#fff" : C.ink }}>
                  {isEditing ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>

              {/* Corpo editável */}
              {isEditing && (
                <div style={{ padding: "0 14px 14px", borderTop: `1px solid ${C.ivoryDeep}`, display: "flex", flexDirection: "column", gap: 10 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: `${C.ink}aa`, marginTop: 10 }}>
                    Título
                    <input value={dv.title} onChange={e => { const g = [...generated]; g[i] = {...g[i], title: e.target.value}; setGenerated(g); }}
                      style={{ width: "100%", padding: "9px 11px", borderRadius: 8, border: `1.5px solid ${C.ivoryDeep}`, fontSize: 14, marginTop: 5, display: "block" }} />
                  </label>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: `${C.ink}aa` }}>
                    Versículo
                    <input value={dv.verse} onChange={e => { const g = [...generated]; g[i] = {...g[i], verse: e.target.value}; setGenerated(g); }}
                      style={{ width: "100%", padding: "9px 11px", borderRadius: 8, border: `1.5px solid ${C.ivoryDeep}`, fontSize: 14, marginTop: 5, display: "block" }} />
                  </label>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: `${C.ink}aa` }}>
                    Reflexão
                    <textarea value={dv.text} onChange={e => { const g = [...generated]; g[i] = {...g[i], text: e.target.value}; setGenerated(g); }} rows={5}
                      style={{ width: "100%", padding: 11, borderRadius: 8, border: `1.5px solid ${C.ivoryDeep}`, fontSize: 13.5, marginTop: 5, resize: "vertical", lineHeight: 1.6, display: "block" }} />
                  </label>
                  <button onClick={() => publishOne(dv, date)} style={{ background: C.green, color: "#fff", border: "none", borderRadius: 8, padding: "9px", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <Check size={14} /> Publicar só este
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Botão publicar todos */}
      <button onClick={publishAll} disabled={saving} style={{
        width: "100%", background: C.navy, color: "#fff", border: "none",
        borderRadius: 12, padding: 15, fontSize: 15, fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 24
      }}>
        <Check size={18} /> {saving ? "Publicando..." : `Publicar todos os ${generated.length} devocionais`}
      </button>

      {toast && <Toast msg={toast} />}
    </div>
  );

  // ══════════════════════════════════════════════════════════
  // VIEW: HISTÓRICO
  if (view === "history") return (
    <div style={{ padding: "18px 18px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <button onClick={() => setView("read")} style={{ background: "none", border: "none", color: C.navy, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, padding: 0 }}>
          <ChevronLeft size={16} /> Voltar
        </button>
        <h2 className="serif" style={{ fontSize: 18, color: C.navy, margin: 0, fontWeight: 700 }}>Histórico</h2>
        <button onClick={() => setView("sermon")} style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 8, padding: "7px 12px", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
          <Plus size={13} /> Novo
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingBottom: 24 }}>
        {history.length === 0 && <div style={{ textAlign: "center", padding: "30px 0", color: C.gray, fontSize: 13 }}>Nenhum devocional cadastrado ainda.</div>}
        {history.map(d => (
          <div key={d.id} style={{ background: "#fff", border: `1px solid ${C.ivoryDeep}`, borderRadius: 12, padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.ink, marginBottom: 2 }}>{d.title}</div>
              <div style={{ fontSize: 12, color: C.gold, fontWeight: 600, marginBottom: 2 }}>{d.verse}</div>
              <div style={{ fontSize: 11, color: C.gray }}>{formatDate(d.date)}</div>
            </div>
            {canEdit && (
              <button onClick={() => deleteDevotional(d.id)} style={{ background: `${C.navy}12`, border: "none", borderRadius: 6, padding: "6px 8px", color: C.navy }}>
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
      {toast && <Toast msg={toast} />}
    </div>
  );

  return null;
}
