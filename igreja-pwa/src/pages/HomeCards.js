// src/pages/HomeCards.js
// Componentes individuais de cada card da Home

import React from "react";
import {
  Bell, Calendar, BookOpen, Radio, FileText,
  Heart, Star, ChevronRight, Clock, MapPin, Book
} from "lucide-react";

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

// ── Aviso Fixo ────────────────────────────────────────────────
export function CardAvisoFixo({ config, onNavigate }) {
  if (!config?.title && !config?.body) return null;
  return (
    <div onClick={() => onNavigate("avisos")} style={{
      background: `${C.navyMid}10`, border: `1px solid ${C.navyMid}33`,
      borderRadius: 14, padding: 16, cursor: "pointer",
      borderLeft: `4px solid ${C.navyMid}`
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
        <Bell size={14} color={C.navyMid} />
        <span style={{ fontSize: 10.5, fontWeight: 700, color: C.navyMid, letterSpacing: 0.8 }}>
          {config?.label || "AVISO"}
        </span>
      </div>
      <div style={{ fontWeight: 700, fontSize: 15, color: C.ink, marginBottom: 4 }}>{config?.title}</div>
      {config?.body && <div style={{ fontSize: 13, color: `${C.ink}99`, lineHeight: 1.5 }}>{config.body}</div>}
      {config?.buttonText && (
        <div style={{ marginTop: 10, fontSize: 12.5, fontWeight: 700, color: C.navyMid, display: "flex", alignItems: "center", gap: 4 }}>
          {config.buttonText} <ChevronRight size={13} />
        </div>
      )}
    </div>
  );
}

// ── Próximo Culto ─────────────────────────────────────────────
export function CardProximoCulto({ data, config, onNavigate }) {
  const event = data?.nextEvent;
  if (!event && !config?.fallbackTitle) return null;

  const formatDate = (iso) => {
    if (!iso) return "";
    return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", {
      weekday: "long", day: "numeric", month: "long"
    });
  };

  return (
    <div style={{
      background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyMid} 100%)`,
      borderRadius: 14, padding: 18, position: "relative", overflow: "hidden", cursor: "pointer"
    }} onClick={() => onNavigate("calendario")}>
      <Vitral opacity={0.06} id="vt-culto" />
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <Calendar size={14} color={C.gold} />
          <span style={{ fontSize: 10.5, fontWeight: 700, color: C.gold, letterSpacing: 0.8 }}>
            {config?.label || "PRÓXIMO CULTO"}
          </span>
        </div>
        {event ? (
          <>
            <div className="serif" style={{ color: "#fff", fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{event.title}</div>
            <div style={{ display: "flex", gap: 14, fontSize: 12.5, color: `${C.ivory}cc` }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} />{formatDate(event.date)}</span>
            </div>
            <div style={{ display: "flex", gap: 14, fontSize: 12.5, color: `${C.ivory}cc`, marginTop: 3 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} />{event.time}</span>
              {event.location && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12} />{event.location}</span>}
            </div>
          </>
        ) : (
          <>
            <div className="serif" style={{ color: "#fff", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{config?.fallbackTitle || "Culto de Celebração"}</div>
            <div style={{ fontSize: 12.5, color: `${C.ivory}cc` }}>{config?.fallbackSubtitle || "Todo domingo às 18h"}</div>
          </>
        )}
        <div style={{ marginTop: 12, fontSize: 12, fontWeight: 700, color: C.gold, display: "flex", alignItems: "center", gap: 4 }}>
          Ver agenda completa <ChevronRight size={13} />
        </div>
      </div>
    </div>
  );
}

// ── Última Mensagem ───────────────────────────────────────────
export function CardUltimaMensagem({ data, config, onNavigate }) {
  const devocional = data?.lastDevotional;
  if (!devocional && !config?.fallbackTitle) return null;

  return (
    <div style={{
      background: "#fff", border: `1px solid ${C.ivoryDeep}`,
      borderRadius: 14, padding: 16, cursor: "pointer"
    }} onClick={() => onNavigate("devocional")}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <BookOpen size={14} color={C.navy} />
        <span style={{ fontSize: 10.5, fontWeight: 700, color: C.navy, letterSpacing: 0.8 }}>
          {config?.label || "DEVOCIONAL DO DIA"}
        </span>
      </div>
      {devocional ? (
        <>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.ink, marginBottom: 4 }}>{devocional.title}</div>
          <div style={{ fontSize: 12.5, color: C.gold, fontWeight: 600, marginBottom: 8 }}>{devocional.verse}</div>
          <div style={{ fontSize: 13, color: `${C.ink}88`, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {devocional.text}
          </div>
        </>
      ) : (
        <>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.ink, marginBottom: 4 }}>{config?.fallbackTitle || "Devocional do dia"}</div>
          <div style={{ fontSize: 13, color: `${C.ink}88` }}>{config?.fallbackSubtitle || "Clique para ler a reflexão de hoje"}</div>
        </>
      )}
      <div style={{ marginTop: 10, fontSize: 12.5, fontWeight: 700, color: C.navy, display: "flex", alignItems: "center", gap: 4 }}>
        Ler devocional <ChevronRight size={13} />
      </div>
    </div>
  );
}

// ── Boletim da Igreja ─────────────────────────────────────────
export function CardBoletim({ config, onNavigate }) {
  if (!config?.content && !config?.title) return null;
  return (
    <div style={{
      background: `${C.gold}12`, border: `1px solid ${C.gold}44`,
      borderRadius: 14, padding: 16
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <FileText size={14} color={C.gold} />
        <span style={{ fontSize: 10.5, fontWeight: 700, color: "#8B6914", letterSpacing: 0.8 }}>
          {config?.label || "BOLETIM DA SEMANA"}
        </span>
      </div>
      {config?.title && <div style={{ fontWeight: 700, fontSize: 15, color: C.ink, marginBottom: 6 }}>{config.title}</div>}
      {config?.content && (
        <div style={{ fontSize: 13, color: `${C.ink}99`, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{config.content}</div>
      )}
    </div>
  );
}

// ── Versículo em Destaque ─────────────────────────────────────
export function CardVersiculo({ config }) {
  if (!config?.text) return null;
  return (
    <div style={{
      background: `linear-gradient(160deg, ${C.navy}, ${C.navyMid})`,
      borderRadius: 14, padding: 20, position: "relative", overflow: "hidden"
    }}>
      <Vitral opacity={0.06} id="vt-vers" />
      <div style={{ position: "relative" }}>
        <Star size={18} color={C.gold} fill={C.gold} style={{ marginBottom: 10 }} />
        <div className="serif" style={{ color: "#fff", fontSize: 16, lineHeight: 1.75, marginBottom: 10 }}>
          "{config.text}"
        </div>
        <div style={{ color: C.gold, fontWeight: 700, fontSize: 13 }}>{config.reference}</div>
      </div>
    </div>
  );
}

// ── Pedido de Oração da Semana ────────────────────────────────
export function CardOracao({ config, onNavigate }) {
  if (!config?.text && !config?.title) return null;
  return (
    <div style={{
      background: `${C.green}10`, border: `1px solid ${C.green}33`,
      borderRadius: 14, padding: 16, cursor: "pointer"
    }} onClick={() => onNavigate("oracao")}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <Heart size={14} color={C.green} />
        <span style={{ fontSize: 10.5, fontWeight: 700, color: C.green, letterSpacing: 0.8 }}>
          {config?.label || "PEDIDO DE ORAÇÃO"}
        </span>
      </div>
      {config?.title && <div style={{ fontWeight: 700, fontSize: 15, color: C.ink, marginBottom: 4 }}>{config.title}</div>}
      {config?.text && <div style={{ fontSize: 13, color: `${C.ink}88`, lineHeight: 1.5 }}>{config.text}</div>}
      <div style={{ marginTop: 10, fontSize: 12.5, fontWeight: 700, color: C.green, display: "flex", alignItems: "center", gap: 4 }}>
        Ver mural de oração <ChevronRight size={13} />
      </div>
    </div>
  );
}

// ── Card Personalizado ────────────────────────────────────────
export function CardCustom({ config, onNavigate }) {
  if (!config?.title) return null;
  const bgColor = config?.bgColor || C.ivoryDeep;
  const textColor = config?.textColor || C.ink;
  const accentColor = config?.accentColor || C.navy;

  return (
    <div style={{
      background: bgColor, borderRadius: 14, padding: 16,
      border: `1px solid ${accentColor}22`,
      cursor: config?.linkTo ? "pointer" : "default"
    }} onClick={() => config?.linkTo && onNavigate(config.linkTo)}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: accentColor, letterSpacing: 0.8 }}>
          {config?.label || "INFORMATIVO"}
        </span>
      </div>
      <div style={{ fontWeight: 700, fontSize: 15, color: textColor, marginBottom: 4 }}>{config.title}</div>
      {config?.subtitle && <div style={{ fontSize: 13, color: `${textColor}99`, lineHeight: 1.5 }}>{config.subtitle}</div>}
      {config?.buttonText && (
        <div style={{ marginTop: 10, fontSize: 12.5, fontWeight: 700, color: accentColor, display: "flex", alignItems: "center", gap: 4 }}>
          {config.buttonText} <ChevronRight size={13} />
        </div>
      )}
    </div>
  );
}

// ── Mapa de tipos de card ─────────────────────────────────────
export const CARD_COMPONENTS = {
  aviso_fixo:       CardAvisoFixo,
  proximo_culto:    CardProximoCulto,
  ultima_mensagem:  CardUltimaMensagem,
  boletim:          CardBoletim,
  versiculo:        CardVersiculo,
  oracao:           CardOracao,
  custom:           CardCustom,
};

export const CARD_META = {
  aviso_fixo:      { label: "Aviso Fixo",            icon: "🔔", desc: "Comunicado em destaque" },
  proximo_culto:   { label: "Próximo Culto",          icon: "⛪", desc: "Próximo evento do calendário" },
  ultima_mensagem: { label: "Devocional do Dia",      icon: "📖", desc: "Reflexão diária" },
  boletim:         { label: "Boletim da Igreja",      icon: "📋", desc: "Informações da semana" },
  versiculo:       { label: "Versículo em Destaque",  icon: "✨", desc: "Passagem bíblica" },
  oracao:          { label: "Pedido de Oração",       icon: "🙏", desc: "Oração da semana" },
  custom:          { label: "Card Personalizado",     icon: "🎨", desc: "Conteúdo livre" },
};

export const DEFAULT_CARDS = [
  { id: "aviso_fixo",      type: "aviso_fixo",      active: true,  order: 0, config: { label: "AVISO", title: "", body: "", buttonText: "" } },
  { id: "proximo_culto",   type: "proximo_culto",   active: true,  order: 1, config: { label: "PRÓXIMO CULTO", fallbackTitle: "Culto de Celebração", fallbackSubtitle: "Todo domingo às 18h" } },
  { id: "ultima_mensagem", type: "ultima_mensagem", active: true,  order: 2, config: { label: "DEVOCIONAL DO DIA" } },
  { id: "boletim",         type: "boletim",         active: false, order: 3, config: { label: "BOLETIM DA SEMANA", title: "", content: "" } },
  { id: "versiculo",       type: "versiculo",       active: false, order: 4, config: { text: "", reference: "" } },
  { id: "oracao",          type: "oracao",          active: false, order: 5, config: { label: "PEDIDO DE ORAÇÃO", title: "", text: "" } },
];
