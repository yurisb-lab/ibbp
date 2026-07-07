// src/pages/HomeScreen.js
import React, { useState, useEffect } from "react";
import { LogIn } from "lucide-react";
import { doc, getDoc, setDoc, collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "../services/firebase";
import { CARD_COMPONENTS, DEFAULT_CARDS } from "./HomeCards";

const C = {
  navy: "#8B1A1A", navyMid: "#6B1111", navyLight: "#4A0C0C",
  gold: "#C9A030", ivory: "#FAFAF8", ivoryDeep: "#F2EFE9",
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

export default function HomeScreen({ currentUser, onNavigate }) {
  const [cards, setCards]         = useState([]);
  const [dynamicData, setDynamic] = useState({});
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadCards(), loadDynamicData()]);
    setLoading(false);
  };

  const loadCards = async () => {
    try {
      const snap = await getDoc(doc(db, "settings", "home_cards"));
      if (snap.exists() && snap.data().cards?.length) {
        const saved = snap.data().cards
          .filter(c => c.active)
          .sort((a, b) => a.order - b.order);
        setCards(saved);
      } else {
        // Primeira vez — salva defaults e usa
        await setDoc(doc(db, "settings", "home_cards"), { cards: DEFAULT_CARDS });
        setCards(DEFAULT_CARDS.filter(c => c.active).sort((a, b) => a.order - b.order));
      }
    } catch (e) {
      console.error("Erro ao carregar cards:", e);
      setCards(DEFAULT_CARDS.filter(c => c.active));
    }
  };

  const loadDynamicData = async () => {
    const today = new Date().toISOString().slice(0, 10);
    let nextEvent = null;
    let lastDevotional = null;

    // Próximo culto — tenta com filtro de categoria, cai para qualquer evento
    try {
      const q1 = query(
        collection(db, "events"),
        where("date", ">=", today),
        orderBy("date", "asc"),
        limit(5)
      );
      const snap = await getDocs(q1);
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Prefere culto, mas pega qualquer evento se não houver
      nextEvent = all.find(e => e.category === "culto") || all[0] || null;
    } catch (e) {
      console.warn("Erro ao buscar próximo evento:", e);
    }

    // Devocional do dia
    try {
      const q2 = query(
        collection(db, "devotionals"),
        where("date", "==", today),
        limit(1)
      );
      const snap2 = await getDocs(q2);
      if (!snap2.empty) {
        lastDevotional = { id: snap2.docs[0].id, ...snap2.docs[0].data() };
      } else {
        // Pega o mais recente
        const q3 = query(collection(db, "devotionals"), orderBy("date", "desc"), limit(1));
        const snap3 = await getDocs(q3);
        if (!snap3.empty) lastDevotional = { id: snap3.docs[0].id, ...snap3.docs[0].data() };
      }
    } catch (e) {
      console.warn("Erro ao buscar devocional:", e);
    }

    setDynamic({ nextEvent, lastDevotional });
  };

  const today = new Date().toISOString().slice(0, 10);
  const activeCards = cards.filter(c => {
    if (c.startDate && c.startDate > today) return false;
    if (c.endDate   && c.endDate   < today) return false;
    return true;
  });

  return (
    <div>
      {/* Hero */}
      <div style={{
        background: `linear-gradient(160deg, #FAFAF8 0%, #F2EFE9 100%)`,
        padding: "24px 22px 28px", position: "relative", overflow: "hidden",
        borderBottom: `3px solid ${C.gold}`
      }}>
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 12, color: C.gold, fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
          </div>
          <h1 className="serif" style={{ color: C.ink, fontSize: 23, lineHeight: 1.3, margin: "0 0 6px" }}>
            {currentUser ? `Paz, ${currentUser.name?.split(" ")[0]}.` : "Bem-vindo à nossa família de fé."}
          </h1>
          <p style={{ color: `${C.ink}88`, fontSize: 13, margin: "0 0 16px", lineHeight: 1.6, fontStyle: "italic" }}>
            "Porque onde estiverem dois ou três reunidos em meu nome, aí estou eu no meio deles." — Mt 18:20
          </p>
          {!currentUser && (
            <button onClick={() => onNavigate("auth")} style={{
              background: C.navy, color: "#fff", border: "none", borderRadius: 9,
              padding: "11px 20px", fontSize: 13.5, fontWeight: 700,
              display: "flex", alignItems: "center", gap: 8
            }}>
              <LogIn size={16} /> Entrar na área de membros
            </button>
          )}
        </div>
      </div>

      {/* Cards dinâmicos */}
      <div style={{ padding: "18px 18px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "30px 0", color: C.gray, fontSize: 13 }}>
            Carregando...
          </div>
        ) : activeCards.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 0", color: C.gray, fontSize: 13 }}>
            Nenhum card ativo. Configure em Menu → Gerenciar Home.
          </div>
        ) : (
          activeCards.map(card => {
            const Component = CARD_COMPONENTS[card.type];
            if (!Component) return null;
            return (
              <Component
                key={card.id}
                config={card.config || {}}
                data={dynamicData}
                onNavigate={onNavigate}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
