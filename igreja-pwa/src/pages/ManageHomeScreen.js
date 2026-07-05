// src/pages/ManageHomeScreen.js
import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeft, ChevronUp, ChevronDown, Eye, EyeOff,
  Plus, Trash2, Save, Settings, Check, X
} from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { CARD_META, DEFAULT_CARDS } from "./HomeCards";

const C = {
  navy: "#6B0F0F", navyMid: "#8B1A1A", gold: "#C8A45A",
  ivory: "#FAF6F0", ivoryDeep: "#F0E8DC", green: "#2D5A1B",
  ink: "#1A1008", gray: "#6B6560",
};

const CONFIG_FIELDS = {
  aviso_fixo: [
    { key: "label",      label: "Rótulo",   placeholder: "Ex: AVISO URGENTE" },
    { key: "title",      label: "Título",   placeholder: "Título do aviso" },
    { key: "body",       label: "Texto",    placeholder: "Conteúdo do aviso...", multiline: true },
    { key: "buttonText", label: "Botão",    placeholder: "Ex: Saiba mais" },
  ],
  proximo_culto: [
    { key: "label",           label: "Rótulo",              placeholder: "Ex: PRÓXIMO CULTO" },
    { key: "fallbackTitle",   label: "Título (sem evento)", placeholder: "Ex: Culto de Celebração" },
    { key: "fallbackSubtitle",label: "Subtítulo",           placeholder: "Ex: Todo domingo às 18h" },
  ],
  ultima_mensagem: [
    { key: "label", label: "Rótulo", placeholder: "Ex: DEVOCIONAL DO DIA" },
  ],
  boletim: [
    { key: "label",   label: "Rótulo",  placeholder: "Ex: BOLETIM DA SEMANA" },
    { key: "title",   label: "Título",  placeholder: "Título do boletim" },
    { key: "content", label: "Conteúdo",placeholder: "Conteúdo do boletim...", multiline: true },
  ],
  versiculo: [
    { key: "text",      label: "Versículo",  placeholder: "Texto do versículo..." },
    { key: "reference", label: "Referência", placeholder: "Ex: João 3:16" },
  ],
  oracao: [
    { key: "label", label: "Rótulo", placeholder: "Ex: PEDIDO DE ORAÇÃO" },
    { key: "title", label: "Título", placeholder: "Ex: Ore pela nossa missão" },
    { key: "text",  label: "Texto",  placeholder: "Pedido de oração...", multiline: true },
  ],
  custom: [
    { key: "label",      label: "Rótulo",    placeholder: "Ex: INFORMATIVO" },
    { key: "title",      label: "Título",    placeholder: "Título do card" },
    { key: "subtitle",   label: "Subtítulo", placeholder: "Texto secundário..." },
    { key: "buttonText", label: "Botão",     placeholder: "Ex: Saiba mais" },
    { key: "bgColor",    label: "Cor de fundo (hex)", placeholder: "#F0E8DC" },
    { key: "accentColor",label: "Cor de destaque (hex)", placeholder: "#6B0F0F" },
  ],
};

function Toast({ msg }) {
  return (
    <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", background: C.navy, color: "#fff", padding: "12px 22px", borderRadius: 10, fontSize: 14, fontWeight: 500, zIndex: 1000, border: `1px solid ${C.gold}55`, maxWidth: "88%", textAlign: "center" }}>
      {msg}
    </div>
  );
}

export default function ManageHomeScreen({ onBack }) {
  const [cards, setCards]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast]         = useState("");
  const [showAddMenu, setShowAddMenu] = useState(false);
  const dragItem = useRef(null);
  const dragOver = useRef(null);

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(""), 2800); };

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const snap = await getDoc(doc(db, "settings", "home_cards"));
      if (snap.exists() && snap.data().cards?.length) {
        setCards(snap.data().cards.sort((a, b) => a.order - b.order));
      } else {
        setCards(DEFAULT_CARDS);
      }
    } catch {
      setCards(DEFAULT_CARDS);
    }
    setLoading(false);
  };

  const save = async (updatedCards) => {
    setSaving(true);
    try {
      const normalized = (updatedCards || cards).map((c, i) => ({ ...c, order: i }));
      await setDoc(doc(db, "settings", "home_cards"), { cards: normalized });
      setCards(normalized);
      showToast("Configurações salvas!");
    } catch { showToast("Erro ao salvar."); }
    setSaving(false);
  };

  const toggleActive = (id) => {
    const updated = cards.map(c => c.id === id ? { ...c, active: !c.active } : c);
    setCards(updated);
  };

  const moveUp = (index) => {
    if (index === 0) return;
    const updated = [...cards];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setCards(updated.map((c, i) => ({ ...c, order: i })));
  };

  const moveDown = (index) => {
    if (index === cards.length - 1) return;
    const updated = [...cards];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setCards(updated.map((c, i) => ({ ...c, order: i })));
  };

  const updateConfig = (id, key, value) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, config: { ...c.config, [key]: value } } : c));
  };

  const removeCard = (id) => {
    if (!window.confirm("Remover este card da Home?")) return;
    setCards(prev => prev.filter(c => c.id !== id));
  };

  const addCard = (type) => {
    const meta = CARD_META[type];
    const newCard = {
      id: `${type}_${Date.now()}`,
      type,
      active: true,
      order: cards.length,
      config: {},
    };
    setCards(prev => [...prev, newCard]);
    setEditingId(newCard.id);
    setShowAddMenu(false);
  };

  // Drag and drop
  const handleDragStart = (index) => { dragItem.current = index; };
  const handleDragEnter = (index) => { dragOver.current = index; };
  const handleDragEnd = () => {
    const updated = [...cards];
    const dragged = updated.splice(dragItem.current, 1)[0];
    updated.splice(dragOver.current, 0, dragged);
    dragItem.current = null;
    dragOver.current = null;
    setCards(updated.map((c, i) => ({ ...c, order: i })));
  };

  if (loading) return (
    <div style={{ padding: "40px 18px", textAlign: "center", color: C.gray }}>Carregando...</div>
  );

  return (
    <div style={{ padding: "18px 18px 0" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: C.navyMid, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, marginBottom: 14, padding: 0 }}>
        <ChevronLeft size={16} /> Voltar
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div>
          <h1 className="serif" style={{ fontSize: 20, color: C.navy, margin: "0 0 2px", fontWeight: 700 }}>Gerenciar Home</h1>
          <p style={{ fontSize: 12, color: C.gray, margin: 0 }}>Arraste para reordenar. Clique no olho para ativar/desativar.</p>
        </div>
        <button onClick={() => save()} disabled={saving} style={{ background: C.green, color: "#fff", border: "none", borderRadius: 9, padding: "9px 14px", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
          <Save size={14} /> {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>

      <div style={{ fontSize: 11.5, color: C.gray, background: `${C.gold}12`, border: `1px solid ${C.gold}33`, borderRadius: 8, padding: "8px 12px", marginBottom: 16 }}>
        💡 Cards automáticos (Próximo Culto, Devocional) buscam dados do sistema. Os demais precisam de conteúdo manual.
      </div>

      {/* Lista de cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {cards.map((card, index) => {
          const meta = CARD_META[card.type] || { label: card.type, icon: "📌" };
          const isEditing = editingId === card.id;
          const fields = CONFIG_FIELDS[card.type] || [];

          return (
            <div key={card.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragEnter={() => handleDragEnter(index)}
              onDragEnd={handleDragEnd}
              onDragOver={e => e.preventDefault()}
              style={{
                background: "#fff", border: `1.5px solid ${card.active ? C.gold+"44" : C.ivoryDeep}`,
                borderRadius: 12, overflow: "hidden",
                opacity: card.active ? 1 : 0.6
              }}>

              {/* Cabeçalho do card */}
              <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ fontSize: 20, cursor: "grab" }} title="Arraste para reordenar">☰</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>
                    {meta.icon} {meta.label}
                  </div>
                  <div style={{ fontSize: 11.5, color: C.gray }}>{meta.desc}</div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => moveUp(index)} style={{ background: C.ivoryDeep, border: "none", borderRadius: 6, padding: "5px 7px", color: C.ink }}>
                    <ChevronUp size={14} />
                  </button>
                  <button onClick={() => moveDown(index)} style={{ background: C.ivoryDeep, border: "none", borderRadius: 6, padding: "5px 7px", color: C.ink }}>
                    <ChevronDown size={14} />
                  </button>
                  <button onClick={() => toggleActive(card.id)} style={{ background: card.active ? `${C.green}15` : C.ivoryDeep, border: "none", borderRadius: 6, padding: "5px 7px", color: card.active ? C.green : C.gray }}>
                    {card.active ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  {fields.length > 0 && (
                    <button onClick={() => setEditingId(isEditing ? null : card.id)} style={{ background: isEditing ? C.navy : C.ivoryDeep, border: "none", borderRadius: 6, padding: "5px 7px", color: isEditing ? "#fff" : C.ink }}>
                      <Settings size={14} />
                    </button>
                  )}
                  <button onClick={() => removeCard(card.id)} style={{ background: `${C.navyMid}12`, border: "none", borderRadius: 6, padding: "5px 7px", color: C.navyMid }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Campos de configuração */}
              {isEditing && fields.length > 0 && (
                <div style={{ padding: "12px 14px 14px", borderTop: `1px solid ${C.ivoryDeep}`, background: C.ivory, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.gray, letterSpacing: 0.5 }}>CONFIGURAÇÃO DO CARD</div>
                  {fields.map(f => (
                    <label key={f.key} style={{ fontSize: 12.5, fontWeight: 600, color: `${C.ink}aa` }}>
                      {f.label}
                      {f.multiline ? (
                        <textarea
                          value={card.config?.[f.key] || ""}
                          onChange={e => updateConfig(card.id, f.key, e.target.value)}
                          placeholder={f.placeholder} rows={3}
                          style={{ width: "100%", padding: "9px 11px", borderRadius: 8, border: `1.5px solid ${C.ivoryDeep}`, fontSize: 13.5, marginTop: 5, resize: "vertical", display: "block" }}
                        />
                      ) : (
                        <input
                          value={card.config?.[f.key] || ""}
                          onChange={e => updateConfig(card.id, f.key, e.target.value)}
                          placeholder={f.placeholder}
                          style={{ width: "100%", padding: "9px 11px", borderRadius: 8, border: `1.5px solid ${C.ivoryDeep}`, fontSize: 13.5, marginTop: 5, display: "block" }}
                        />
                      )}
                    </label>
                  ))}

                  {/* Datas de exibição */}
                  <div style={{ display: "flex", gap: 8 }}>
                    <label style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: `${C.ink}aa` }}>
                      Exibir a partir de
                      <input type="date" value={card.startDate || ""} onChange={e => setCards(prev => prev.map(c => c.id === card.id ? { ...c, startDate: e.target.value } : c))}
                        style={{ width: "100%", padding: "9px 11px", borderRadius: 8, border: `1.5px solid ${C.ivoryDeep}`, fontSize: 13, marginTop: 5, display: "block" }} />
                    </label>
                    <label style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: `${C.ink}aa` }}>
                      Exibir até
                      <input type="date" value={card.endDate || ""} onChange={e => setCards(prev => prev.map(c => c.id === card.id ? { ...c, endDate: e.target.value } : c))}
                        style={{ width: "100%", padding: "9px 11px", borderRadius: 8, border: `1.5px solid ${C.ivoryDeep}`, fontSize: 13, marginTop: 5, display: "block" }} />
                    </label>
                  </div>

                  <button onClick={() => setEditingId(null)} style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 8, padding: "10px", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <Check size={14} /> Fechar configuração
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Adicionar novo card */}
      <div style={{ marginBottom: 24 }}>
        <button onClick={() => setShowAddMenu(!showAddMenu)} style={{
          width: "100%", background: showAddMenu ? C.ivoryDeep : `${C.gold}18`,
          border: `1.5px dashed ${C.gold}`, borderRadius: 10, padding: 12,
          fontSize: 13, fontWeight: 700, color: C.navy,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8
        }}>
          {showAddMenu ? <><X size={15} /> Cancelar</> : <><Plus size={15} /> Adicionar card</>}
        </button>

        {showAddMenu && (
          <div style={{ background: "#fff", border: `1px solid ${C.ivoryDeep}`, borderRadius: 12, padding: 14, marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.gray, marginBottom: 4 }}>ESCOLHA O TIPO DE CARD</div>
            {Object.entries(CARD_META).map(([type, meta]) => (
              <button key={type} onClick={() => addCard(type)} style={{
                background: C.ivoryDeep, border: "none", borderRadius: 9, padding: "10px 14px",
                textAlign: "left", display: "flex", alignItems: "center", gap: 10
              }}>
                <span style={{ fontSize: 18 }}>{meta.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: C.ink }}>{meta.label}</div>
                  <div style={{ fontSize: 11.5, color: C.gray }}>{meta.desc}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {toast && <Toast msg={toast} />}
    </div>
  );
}
