// src/pages/DashboardScreen.js
import React, { useState, useEffect } from "react";
import {
  Users, Calendar, Bell, Heart, BookOpen, DollarSign,
  TrendingUp, Shield, ChevronRight, RefreshCw, Star
} from "lucide-react";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "../services/firebase";
import { roleLabel, roleColor } from "../services/permissions";

const C = {
  navy:      "#6B0F0F",
  navyMid:   "#8B1A1A",
  gold:      "#C8A45A",
  ivory:     "#FAF6F0",
  ivoryDeep: "#F0E8DC",
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

export default function DashboardScreen({ userProfile, onNavigate }) {
  const [stats, setStats]       = useState(null);
  const [recentMembers, setRM]  = useState([]);
  const [recentEvents, setRE]   = useState([]);
  const [recentPrayers, setRP]  = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Membros
      const membersSnap = await getDocs(collection(db, "users"));
      const members = membersSnap.docs.map(d => ({ uid: d.id, ...d.data() }));

      // Eventos
      const eventsSnap = await getDocs(collection(db, "events"));
      const events = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Avisos
      const newsSnap = await getDocs(collection(db, "news"));

      // Orações
      const prayersSnap = await getDocs(collection(db, "prayers"));
      const prayers = prayersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      setStats({
        totalMembers:   members.length,
        activeMembers:  members.filter(m => m.active !== false).length,
        inactiveMembers:members.filter(m => m.active === false).length,
        leaders:        members.filter(m => ["lider","admin","secretario","vice_secretario","lider_ministerio"].includes(m.role)).length,
        totalEvents:    events.length,
        upcomingEvents: events.filter(e => e.date >= new Date().toISOString().slice(0,10)).length,
        totalNews:      newsSnap.size,
        totalPrayers:   prayers.length,
        roleDistribution: Object.entries(
          members.reduce((acc, m) => { acc[m.role] = (acc[m.role]||0)+1; return acc; }, {})
        ).sort((a,b) => b[1]-a[1]),
      });

      // Últimos 3 membros cadastrados
      setRM(members.slice(-3).reverse());

      // Próximos 3 eventos
      const upcoming = events
        .filter(e => e.date >= new Date().toISOString().slice(0,10))
        .sort((a,b) => a.date.localeCompare(b.date))
        .slice(0,3);
      setRE(upcoming);

      // Últimas 3 orações
      setRP(prayers.slice(-3).reverse());

    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  if (loading) return (
    <div style={{ padding: "40px 18px", textAlign: "center", color: C.gray }}>
      <RefreshCw size={28} style={{ marginBottom: 12, opacity: 0.5 }} />
      <div style={{ fontSize: 13 }}>Carregando dashboard...</div>
    </div>
  );

  return (
    <div style={{ padding: "18px 18px 0" }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(160deg,${C.navy},${C.navyMid})`, borderRadius: 16, padding: 20, position: "relative", overflow: "hidden", marginBottom: 20 }}>
        <Vitral opacity={0.06} id="vt-db" />
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ color: C.gold, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, marginBottom: 4 }}>DASHBOARD ADMINISTRATIVO</div>
              <h1 className="serif" style={{ color: "#fff", fontSize: 19, margin: "0 0 2px" }}>IBB Pacatuba</h1>
              <div style={{ color: `${C.ivory}99`, fontSize: 12 }}>
                {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </div>
            </div>
            <button onClick={loadData} style={{ background: `${C.gold}22`, border: `1px solid ${C.gold}44`, borderRadius: 8, padding: "7px 10px", color: C.gold }}>
              <RefreshCw size={15} />
            </button>
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: C.gold, fontWeight: 600 }}>
            {userProfile?.name} — {roleLabel(userProfile?.role)}
          </div>
        </div>
      </div>

      {/* Cards de estatísticas */}
      {stats && (
        <>
          <h2 className="serif" style={{ fontSize: 15, color: C.navy, margin: "0 0 10px", fontWeight: 700 }}>Visão Geral</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
            {[
              { icon: Users,    label: "Membros Ativos",   value: stats.activeMembers,  color: C.green,   sub: `${stats.inactiveMembers} inativos`, tab: "membros" },
              { icon: Calendar, label: "Próximos Eventos",  value: stats.upcomingEvents, color: C.navy,    sub: `${stats.totalEvents} total`, tab: "calendario" },
              { icon: Bell,     label: "Avisos Publicados", value: stats.totalNews,      color: "#8B6914", sub: "no mural", tab: "avisos" },
              { icon: Heart,    label: "Pedidos de Oração", value: stats.totalPrayers,   color: C.navyMid, sub: "enviados", tab: "oracao" },
            ].map(c => (
              <button key={c.label} onClick={() => onNavigate(c.tab)} style={{
                background: "#fff", border: `1px solid ${C.ivoryDeep}`, borderRadius: 12,
                padding: 14, textAlign: "left"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <c.icon size={18} color={c.color} />
                  <ChevronRight size={14} color={`${C.ink}44`} />
                </div>
                <div className="serif" style={{ fontSize: 26, fontWeight: 700, color: c.color, margin: "8px 0 2px" }}>{c.value}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.ink }}>{c.label}</div>
                <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>{c.sub}</div>
              </button>
            ))}
          </div>

          {/* Distribuição por perfil */}
          <div style={{ background: "#fff", border: `1px solid ${C.ivoryDeep}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <h3 style={{ fontSize: 13.5, fontWeight: 700, color: C.ink, margin: "0 0 12px" }}>Distribuição por Perfil</h3>
            {stats.roleDistribution.map(([role, count]) => (
              <div key={role} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: roleColor(role) }}>{roleLabel(role)}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: C.ink }}>{count}</span>
                </div>
                <div style={{ background: C.ivoryDeep, borderRadius: 4, height: 6 }}>
                  <div style={{
                    background: roleColor(role), height: 6, borderRadius: 4,
                    width: `${Math.round((count / stats.totalMembers) * 100)}%`,
                    transition: "width 0.5s"
                  }} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Próximos eventos */}
      {recentEvents.length > 0 && (
        <div style={{ background: "#fff", border: `1px solid ${C.ivoryDeep}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ fontSize: 13.5, fontWeight: 700, color: C.ink, margin: 0 }}>Próximos Eventos</h3>
            <button onClick={() => onNavigate("calendario")} style={{ background: "none", border: "none", color: C.navy, fontSize: 12, fontWeight: 600 }}>Ver todos</button>
          </div>
          {recentEvents.map(e => (
            <div key={e.id} style={{ padding: "8px 0", borderBottom: `1px solid ${C.ivoryDeep}`, display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: `${C.navy}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Calendar size={16} color={C.navy} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{e.title}</div>
                <div style={{ fontSize: 11.5, color: C.gray }}>{e.date} às {e.time} — {e.location}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Últimos membros */}
      {recentMembers.length > 0 && (
        <div style={{ background: "#fff", border: `1px solid ${C.ivoryDeep}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ fontSize: 13.5, fontWeight: 700, color: C.ink, margin: 0 }}>Últimos Membros</h3>
            <button onClick={() => onNavigate("membros")} style={{ background: "none", border: "none", color: C.navy, fontSize: 12, fontWeight: 600 }}>Ver todos</button>
          </div>
          {recentMembers.map(m => (
            <div key={m.uid} style={{ padding: "8px 0", borderBottom: `1px solid ${C.ivoryDeep}`, display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 36, height: 36, borderRadius: 18, background: `${roleColor(m.role)}18`, border: `1.5px solid ${roleColor(m.role)}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span className="serif" style={{ fontSize: 13, fontWeight: 700, color: roleColor(m.role) }}>
                  {m.name?.split(" ")[0]?.[0]}{m.name?.split(" ")[1]?.[0]||""}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{m.name}</div>
                <div style={{ fontSize: 11.5, color: roleColor(m.role), fontWeight: 600 }}>{roleLabel(m.role)}</div>
              </div>
              <span style={{ fontSize: 10, color: m.active !== false ? C.green : C.gray, fontWeight: 600 }}>
                {m.active !== false ? "● Ativo" : "○ Inativo"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Últimas orações */}
      {recentPrayers.length > 0 && (
        <div style={{ background: "#fff", border: `1px solid ${C.ivoryDeep}`, borderRadius: 12, padding: 16, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ fontSize: 13.5, fontWeight: 700, color: C.ink, margin: 0 }}>Pedidos de Oração Recentes</h3>
            <button onClick={() => onNavigate("oracao")} style={{ background: "none", border: "none", color: C.navy, fontSize: 12, fontWeight: 600 }}>Ver todos</button>
          </div>
          {recentPrayers.map(p => (
            <div key={p.id} style={{ padding: "8px 0", borderBottom: `1px solid ${C.ivoryDeep}` }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 2 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: C.gray, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{p.request}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
