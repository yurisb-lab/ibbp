// src/pages/CalendarScreen.js
import React, { useState, useEffect } from "react";
import {
  Plus, X, Check, Edit2, Trash2, ChevronLeft, ChevronRight,
  Clock, MapPin, Shield, RefreshCw, Calendar
} from "lucide-react";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, query, orderBy
} from "firebase/firestore";
import { db } from "../services/firebase";
import { canManageEvents } from "../services/permissions";

const C = {
  navy:      "#8B1A1A",   // bordô — apenas acentos, botões, ícones ativos
  navyMid:   "#6B1111",   // bordô escuro — gradientes sutis
  gold:      "#C9A030",   // dourado
  goldSoft:  "#F0D98A",   // dourado claro
  ivory:     "#FAFAF8",   // fundo principal (branco quente)
  ivoryDeep: "#F2EFE9",   // fundo cards / separadores
  green:     "#2D5A1B",   // verde (ramo da logo)
  ink:       "#1A1008",   // texto principal
  gray:      "#6B6560",   // texto secundário
  white:     "#FFFFFF",   // cards e superfícies
};

const CATEGORIES = {
  culto:     { label: "Culto",     color: C.navy },
  oracao:    { label: "Oração",    color: C.green },
  ensino:    { label: "Ensino",    color: "#8B6914" },
  jovens:    { label: "Jovens",    color: C.navyMid },
  lideranca: { label: "Liderança", color: C.navyMid },
  especial:  { label: "Especial",  color: "#5C3A7A" },
};

const WEEKDAYS = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
const MONTHS_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

const EMPTY_FORM = {
  title: "", date: "", time: "", location: "", category: "culto",
  description: "", restricted: false,
  isRecurring: false, recurrenceType: "weekly",
  recurrenceDay: "0", recurrenceWeekOfMonth: "1",
};

// ── Gerar datas de eventos recorrentes (próximos 90 dias) ─────
function generateRecurringDates(event, fromDate, days = 90) {
  const dates = [];
  const from = new Date(fromDate + "T00:00:00");
  const to = new Date(fromDate + "T00:00:00");
  to.setDate(to.getDate() + days);

  if (event.recurrenceType === "weekly") {
    const targetDay = parseInt(event.recurrenceDay); // 0=Dom, 6=Sab
    let current = new Date(from);
    // Avança para o próximo dia da semana correto
    while (current.getDay() !== targetDay) current.setDate(current.getDate() + 1);
    while (current <= to) {
      // Usa data local para evitar problema de fuso horário
      const y = current.getFullYear();
      const m = String(current.getMonth()+1).padStart(2,'0');
      const d = String(current.getDate()).padStart(2,'0');
      dates.push(`${y}-${m}-${d}`);
      current.setDate(current.getDate() + 7);
    }
  } else if (event.recurrenceType === "monthly") {
    const targetDay = parseInt(event.recurrenceDay); // 0=Dom
    const week = parseInt(event.recurrenceWeekOfMonth); // 1=primeira, etc
    let current = new Date(from.getFullYear(), from.getMonth(), 1);
    while (current <= to) {
      // Encontra o Nth dia da semana do mês
      const firstDay = new Date(current.getFullYear(), current.getMonth(), 1);
      let count = 0;
      let d = new Date(firstDay);
      while (d.getDay() !== targetDay) d.setDate(d.getDate() + 1);
      count = 1;
      while (count < week) { d.setDate(d.getDate() + 7); count++; }
      if (d >= from && d <= to) {
        const y = d.getFullYear();
        const mo = String(d.getMonth()+1).padStart(2,'0');
        const dy = String(d.getDate()).padStart(2,'0');
        dates.push(`${y}-${mo}-${dy}`);
      }
      current.setMonth(current.getMonth() + 1);
    }
  }
  return dates;
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}
function formatDateFull(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
}

function Toast({ msg }) {
  return (
    <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", background: C.navy, color: "#fff", padding: "12px 22px", borderRadius: 10, fontSize: 14, fontWeight: 500, zIndex: 1000, border: `1px solid ${C.gold}55`, maxWidth: "88%", textAlign: "center" }}>
      {msg}
    </div>
  );
}

export default function CalendarScreen({ userProfile }) {
  const [events, setEvents]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [view, setView]           = useState("list"); // list | form | detail
  const [filter, setFilter]       = useState("todos");
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear]   = useState(new Date().getFullYear());
  const [selected, setSelected]   = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState("");

  const canEdit = canManageEvents(userProfile?.role);
  const isLeader = canEdit;
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(""), 2800); };

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "events"), orderBy("date", "asc"));
      const snap = await getDocs(q);
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch { showToast("Erro ao carregar eventos."); }
    setLoading(false);
  };

  // Expande eventos recorrentes em ocorrências virtuais
  const expandedEvents = () => {
    const today = new Date().toISOString().slice(0, 10);
    const all = [];

    events.forEach(ev => {
      if (ev.isRecurring) {
        const dates = generateRecurringDates(ev, today, 120);
        dates.forEach(date => {
          // Verifica se não foi excluído (override)
          if (ev.excludedDates && ev.excludedDates.includes(date)) return;
          // Verifica se existe override para esta data
          const override = (ev.overrides || {})[date];
          all.push({ ...ev, date, id: ev.id, isVirtual: true, virtualDate: date, ...(override || {}) });
        });
      } else {
        all.push(ev);
      }
    });

    return all.sort((a, b) => a.date.localeCompare(b.date));
  };

  const visibleEvents = () => {
    const today = new Date().toISOString().slice(0, 10);
    return expandedEvents().filter(ev => {
      if (!isLeader && ev.restricted) return false;
      if (filter !== "todos" && ev.category !== filter) return false;
      // Filtro de mês
      const evDate = new Date(ev.date + "T00:00:00");
      if (evDate.getMonth() !== filterMonth || evDate.getFullYear() !== filterYear) return false;
      return true;
    });
  };

  const saveEvent = async () => {
    if (!form.title.trim()) { showToast("Título é obrigatório."); return; }
    if (!form.isRecurring && !form.date) { showToast("Data é obrigatória."); return; }
    if (!form.time) { showToast("Horário é obrigatório."); return; }

    setSaving(true);
    try {
      const data = { ...form, updatedAt: serverTimestamp() };
      if (!data.isRecurring) { delete data.recurrenceType; delete data.recurrenceDay; delete data.recurrenceWeekOfMonth; }

      if (isEditing && selected?.id && !selected?.isVirtual) {
        await updateDoc(doc(db, "events", selected.id), data);
        setEvents(prev => prev.map(e => e.id === selected.id ? { ...e, ...data } : e));
        showToast("Evento atualizado!");
      } else if (isEditing && selected?.isVirtual) {
        // Editar só esta ocorrência — salva override no evento pai
        const parent = events.find(e => e.id === selected.id);
        if (parent) {
          const overrides = { ...(parent.overrides || {}), [selected.virtualDate]: { title: form.title, time: form.time, location: form.location, description: form.description } };
          await updateDoc(doc(db, "events", parent.id), { overrides });
          setEvents(prev => prev.map(e => e.id === parent.id ? { ...e, overrides } : e));
          showToast("Ocorrência atualizada!");
        }
      } else {
        const ref = await addDoc(collection(db, "events"), { ...data, createdAt: serverTimestamp() });
        setEvents(prev => [...prev, { id: ref.id, ...data }]);
        showToast(form.isRecurring ? "Evento recorrente criado!" : "Evento adicionado!");
      }
      setForm(EMPTY_FORM); setIsEditing(false); setSelected(null); setView("list");
    } catch (e) { showToast("Erro ao salvar."); console.error(e); }
    setSaving(false);
  };

  const deleteEvent = async (ev) => {
    if (ev.isVirtual) {
      // Cancela só esta ocorrência
      if (!window.confirm(`Cancelar apenas a ocorrência de ${formatDateFull(ev.virtualDate)}?`)) return;
      const parent = events.find(e => e.id === ev.id);
      if (parent) {
        const excluded = [...(parent.excludedDates || []), ev.virtualDate];
        await updateDoc(doc(db, "events", parent.id), { excludedDates: excluded });
        setEvents(prev => prev.map(e => e.id === parent.id ? { ...e, excludedDates: excluded } : e));
        showToast("Ocorrência cancelada.");
      }
    } else {
      if (!window.confirm(`Excluir "${ev.title}"${ev.isRecurring ? " e TODAS as suas ocorrências" : ""}?`)) return;
      await deleteDoc(doc(db, "events", ev.id));
      setEvents(prev => prev.filter(e => e.id !== ev.id));
      showToast("Evento excluído.");
    }
    setView("list");
  };

  const prevMonth = () => {
    if (filterMonth === 0) { setFilterMonth(11); setFilterYear(y => y - 1); }
    else setFilterMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (filterMonth === 11) { setFilterMonth(0); setFilterYear(y => y + 1); }
    else setFilterMonth(m => m + 1);
  };

  // ── LISTA ──────────────────────────────────────────────────
  if (view === "list") return (
    <div style={{ padding: "18px 18px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h1 className="serif" style={{ fontSize: 21, color: C.navy, margin: "0 0 2px", fontWeight: 700 }}>Calendário</h1>
          <div style={{ fontSize: 12, color: C.gray }}>Cultos, reuniões e eventos especiais</div>
        </div>
        {canEdit && (
          <button onClick={() => { setForm(EMPTY_FORM); setIsEditing(false); setView("form"); }} style={{
            background: C.navy, color: "#fff", border: "none", borderRadius: 10,
            padding: "9px 14px", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6
          }}>
            <Plus size={15} /> Novo
          </button>
        )}
      </div>

      {/* Navegação de mês */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", border: `1px solid ${C.ivoryDeep}`, borderRadius: 12, padding: "10px 14px", marginBottom: 14 }}>
        <button onClick={prevMonth} style={{ background: "none", border: "none", padding: 4, color: C.navy }}><ChevronLeft size={20} /></button>
        <span className="serif" style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>{MONTHS_PT[filterMonth]} {filterYear}</span>
        <button onClick={nextMonth} style={{ background: "none", border: "none", padding: 4, color: C.navy }}><ChevronRight size={20} /></button>
      </div>

      {/* Filtros por categoria */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 14 }}>
        {["todos", ...Object.keys(CATEGORIES), ...(isLeader ? [] : [])].map(c => (
          <button key={c} onClick={() => setFilter(c)} style={{
            background: filter === c ? C.navy : "#fff", color: filter === c ? "#fff" : C.ink,
            border: `1px solid ${filter === c ? C.navy : C.ivoryDeep}`, borderRadius: 20,
            padding: "6px 14px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0
          }}>
            {c === "todos" ? "Todos" : CATEGORIES[c]?.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: C.gray }}><RefreshCw size={20} style={{ opacity: 0.4 }} /></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 24 }}>
          {visibleEvents().length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 0", color: C.gray, fontSize: 13 }}>
              Nenhum evento em {MONTHS_PT[filterMonth]}.
            </div>
          )}
          {visibleEvents().map((ev, i) => {
            const meta = CATEGORIES[ev.category] || { label: ev.category, color: C.navy };
            return (
              <button key={`${ev.id}-${ev.date}-${i}`} onClick={() => { setSelected(ev); setView("detail"); }} style={{
                background: "#fff", border: `1px solid ${C.ivoryDeep}`, borderRadius: 12,
                padding: 14, display: "flex", gap: 14, alignItems: "center", textAlign: "left"
              }}>
                <div style={{ width: 50, height: 50, borderRadius: 10, background: `${meta.color}12`, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: meta.color }}>
                  <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1 }}>{formatDate(ev.date).split(" ")[0]}</div>
                  <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase" }}>{formatDate(ev.date).split(" ")[1]}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: meta.color, background: `${meta.color}15`, padding: "2px 7px", borderRadius: 5 }}>{meta.label.toUpperCase()}</span>
                    {ev.restricted && <Shield size={11} color={C.gray} />}
                    {ev.isRecurring && <RefreshCw size={11} color={C.gray} />}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.title}</div>
                  <div style={{ display: "flex", gap: 10, marginTop: 3, fontSize: 11.5, color: C.gray }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Clock size={11} /> {ev.time}</span>
                    {ev.location && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><MapPin size={11} /> {ev.location}</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
      {toast && <Toast msg={toast} />}
    </div>
  );

  // ── DETALHE ────────────────────────────────────────────────
  if (view === "detail" && selected) {
    const meta = CATEGORIES[selected.category] || { label: selected.category, color: C.navy };
    return (
      <div style={{ padding: "18px 18px 0" }}>
        <button onClick={() => setView("list")} style={{ background: "none", border: "none", color: C.navyMid, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, marginBottom: 14, padding: 0 }}>
          <ChevronLeft size={16} /> Calendário
        </button>

        <div style={{ background: `linear-gradient(160deg,${C.navy},${C.navyMid})`, borderRadius: 16, padding: 20, position: "relative", overflow: "hidden", marginBottom: 18 }}>
          <div style={{ position: "relative" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.gold, background: `${C.gold}22`, padding: "3px 10px", borderRadius: 10 }}>{meta.label.toUpperCase()}</span>
            <h2 className="serif" style={{ color: "#fff", fontSize: 20, margin: "10px 0 6px" }}>{selected.title}</h2>
            <div style={{ color: C.gold, fontSize: 13, fontWeight: 600 }}>{formatDateFull(selected.date)}</div>
          </div>
        </div>

        <div style={{ background: "#fff", border: `1px solid ${C.ivoryDeep}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
          {[
            { icon: Clock,    label: selected.time },
            { icon: MapPin,   label: selected.location || "Local não informado" },
            { icon: Calendar, label: selected.isRecurring ? `Recorrente — ${selected.recurrenceType === "weekly" ? `toda ${WEEKDAYS[parseInt(selected.recurrenceDay)]}` : `mensalmente`}` : "Evento único" },
          ].map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < 2 ? `1px solid ${C.ivoryDeep}` : "none" }}>
              <r.icon size={15} color={C.navyMid} />
              <span style={{ fontSize: 13.5 }}>{r.label}</span>
            </div>
          ))}
        </div>

        {selected.description && (
          <div style={{ background: "#fff", border: `1px solid ${C.ivoryDeep}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
            <p style={{ fontSize: 13.5, color: C.ink, lineHeight: 1.6, margin: 0 }}>{selected.description}</p>
          </div>
        )}

        {canEdit && (
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            <button onClick={() => {
              setForm({
                title: selected.title, date: selected.date || "", time: selected.time,
                location: selected.location || "", category: selected.category,
                description: selected.description || "", restricted: selected.restricted || false,
                isRecurring: selected.isVirtual ? false : (selected.isRecurring || false),
                recurrenceType: selected.recurrenceType || "weekly",
                recurrenceDay: selected.recurrenceDay || "0",
                recurrenceWeekOfMonth: selected.recurrenceWeekOfMonth || "1",
              });
              setIsEditing(true); setView("form");
            }} style={{ flex: 1, background: C.navy, color: "#fff", border: "none", borderRadius: 10, padding: 13, fontWeight: 700, fontSize: 13.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Edit2 size={15} /> Editar
            </button>
            <button onClick={() => deleteEvent(selected)} style={{ background: `${C.navyMid}15`, border: `1px solid ${C.navyMid}44`, color: C.navyMid, borderRadius: 10, padding: "13px 16px", fontWeight: 700, fontSize: 13.5 }}>
              <Trash2 size={15} />
            </button>
          </div>
        )}
        {toast && <Toast msg={toast} />}
      </div>
    );
  }

  // ── FORMULÁRIO ─────────────────────────────────────────────
  if (view === "form") return (
    <div style={{ padding: "18px 18px 0" }}>
      <button onClick={() => { setView(isEditing ? "detail" : "list"); setIsEditing(false); }} style={{ background: "none", border: "none", color: C.navyMid, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, marginBottom: 14, padding: 0 }}>
        <ChevronLeft size={16} /> {isEditing ? "Voltar" : "Calendário"}
      </button>
      <h2 className="serif" style={{ fontSize: 19, color: C.navy, margin: "0 0 18px", fontWeight: 700 }}>
        {isEditing ? (selected?.isVirtual ? "Editar esta ocorrência" : "Editar evento") : "Novo evento"}
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingBottom: 24 }}>
        <FInput label="Título *" value={form.title} onChange={v => setForm({...form, title: v})} placeholder="Ex: Culto de Celebração" />

        {/* Evento recorrente? */}
        {!isEditing && (
          <label style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", border: `1px solid ${C.ivoryDeep}`, borderRadius: 10, padding: "12px 14px", cursor: "pointer" }}>
            <input type="checkbox" checked={form.isRecurring} onChange={e => setForm({...form, isRecurring: e.target.checked})} style={{ width: 18, height: 18 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>Evento recorrente</div>
              <div style={{ fontSize: 11.5, color: C.gray }}>Repete semanal ou mensalmente</div>
            </div>
          </label>
        )}

        {/* Campos de recorrência */}
        {form.isRecurring && !isEditing ? (
          <div style={{ background: `${C.gold}08`, border: `1px solid ${C.gold}44`, borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: C.navy }}>Configuração da recorrência</div>

            <FSelect label="Frequência" value={form.recurrenceType} onChange={v => setForm({...form, recurrenceType: v})}
              options={["weekly","monthly"]} labels={["Semanal","Mensal"]} />

            <FSelect label="Dia da semana" value={form.recurrenceDay} onChange={v => setForm({...form, recurrenceDay: v})}
              options={["0","1","2","3","4","5","6"]} labels={WEEKDAYS} />

            {form.recurrenceType === "monthly" && (
              <FSelect label="Semana do mês" value={form.recurrenceWeekOfMonth} onChange={v => setForm({...form, recurrenceWeekOfMonth: v})}
                options={["1","2","3","4"]} labels={["Primeira","Segunda","Terceira","Quarta"]} />
            )}

            <div style={{ fontSize: 11.5, color: C.gray, fontStyle: "italic" }}>
              {form.recurrenceType === "weekly"
                ? `Todo(a) ${WEEKDAYS[parseInt(form.recurrenceDay)]} às ${form.time || "??:??"}`
                : `${["Primeira","Segunda","Terceira","Quarta"][parseInt(form.recurrenceWeekOfMonth)-1]} ${WEEKDAYS[parseInt(form.recurrenceDay)]} do mês às ${form.time || "??:??"}`}
            </div>
          </div>
        ) : (
          <FInput label="Data *" value={form.date} onChange={v => setForm({...form, date: v})} type="date" />
        )}

        <FInput label="Horário *" value={form.time} onChange={v => setForm({...form, time: v})} type="time" />
        <FInput label="Local" value={form.location} onChange={v => setForm({...form, location: v})} placeholder="Ex: Templo Sede" />

        <FSelect label="Categoria" value={form.category} onChange={v => setForm({...form, category: v})}
          options={Object.keys(CATEGORIES)} labels={Object.values(CATEGORIES).map(c => c.label)} />

        <label style={{ fontSize: 12.5, fontWeight: 600, color: `${C.ink}aa` }}>
          Descrição
          <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3}
            placeholder="Detalhes sobre o evento..."
            style={{ width: "100%", padding: 11, borderRadius: 9, border: `1.5px solid ${C.ivoryDeep}`, fontSize: 14, marginTop: 5, resize: "vertical", display: "block" }} />
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600 }}>
          <input type="checkbox" checked={form.restricted} onChange={e => setForm({...form, restricted: e.target.checked})} />
          Visível apenas para liderança
        </label>

        <button onClick={saveEvent} disabled={saving} style={{
          background: C.navy, color: "#fff", border: "none", borderRadius: 10, padding: 14,
          fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4
        }}>
          <Check size={17} /> {saving ? "Salvando..." : (isEditing ? "Salvar alterações" : "Criar evento")}
        </button>
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
