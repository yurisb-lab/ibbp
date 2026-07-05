// src/pages/HomeScreen.js
import React, { useState, useEffect } from "react";
import { LogIn } from "lucide-react";
import { doc, getDoc, setDoc, collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "../services/firebase";
import { CARD_COMPONENTS, DEFAULT_CARDS } from "./HomeCards";

const C = {
  navy: "#6B0F0F", navyMid: "#8B1A1A", navyLight: "#A52020",
  gold: "#C8A45A", ivory: "#FAF6F0", ivoryDeep: "#F0E8DC",
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
    loadCards();
    loadDynamicData();
  }, []);

  const loadCards = async () => {
    try {
      const snap = await getDoc(doc(db, "settings", "home_cards"));
      if (snap.exists() && snap.data().cards?.length) {
        setCards(snap.data().cards.filter(c => c.active).sort((a,b) => a.order - b.order));
      } else {
        // Usa defaults e salva no Firestore
        const defaults = DEFAULT_CARDS;
        await setDoc(doc(db, "settings", "home_cards"), { cards: defaults });
        setCards(defaults.filter(c => c.active).sort((a,b) => a.order - b.order));
      }
    } catch {
      setCards(DEFAULT_CARDS.filter(c => c.active));
    }
    setLoading(false);
  };

  const loadDynamicData = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);

      // Próximo culto
      const evSnap = await getDocs(
        query(collection(db, "events"),
          where("date", ">=", today),
          where("category", "==", "culto"),
          orderBy("date", "asc"), limit(1))
      );
      const nextEvent = evSnap.empty ? null : { id: evSnap.docs[0].id, ...evSnap.docs[0].data() };

      // Devocional do dia
      const dvSnap = await getDocs(
        query(collection(db, "devotionals"), where("date", "==", today), limit(1))
      );
      const lastDevotional = dvSnap.empty ? null : { id: dvSnap.docs[0].id, ...dvSnap.docs[0].data() };

      setDynamic({ nextEvent, lastDevotional });
    } catch {}
  };

  const activeCards = cards.filter(c => {
    // Verifica data de início/fim se configurado
    if (c.startDate && new Date(c.startDate) > new Date()) return false;
    if (c.endDate && new Date(c.endDate) < new Date()) return false;
    return true;
  });

  return (
    <div>
      {/* Hero */}
      <div style={{
        background: `linear-gradient(160deg,${C.navy},${C.navyMid} 60%,${C.navyLight})`,
        padding: "26px 22px 30px", position: "relative", overflow: "hidden"
      }}>
        <Vitral opacity={0.07} id="vt-hero" />
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 12.5, color: C.gold, fontWeight: 600, letterSpacing: 1 }}>
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
          </div>
          <h1 className="serif" style={{ color: C.ivory, fontSize: 24, lineHeight: 1.3, margin: "8px 0 6px" }}>
            {currentUser ? `Paz, ${currentUser.name?.split(" ")[0]}.` : "Bem-vindo à nossa família de fé."}
          </h1>
          <p style={{ color: `${C.ivory}cc`, fontSize: 13.5, margin: "0 0 18px", lineHeight: 1.5 }}>
            "Porque onde estiverem dois ou três reunidos em meu nome, aí estou eu no meio deles." — Mt 18:20
          </p>
          {!currentUser && (
            <button onClick={() => onNavigate("auth")} style={{
              background: C.gold, color: C.navy, border: "none", borderRadius: 9,
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
        ) : (
          activeCards.map(card => {
            const Component = CARD_COMPONENTS[card.type];
            if (!Component) return null;
            return (
              <Component
                key={card.id}
                config={card.config}
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
