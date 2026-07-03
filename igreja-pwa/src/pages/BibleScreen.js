// src/pages/BibleScreen.js
import React, { useState, useCallback } from "react";
import {
  Search, ChevronLeft, ChevronRight, BookOpen,
  WifiOff, RefreshCw, Star, Quote, Book
} from "lucide-react";
import {
  BIBLE_BOOKS, fetchChapter, fetchRandomVerse, getOfflineFallback
} from "../services/bibleService";

const C = {
  navy:      "#6B0F0F",
  navyMid:   "#8B1A1A",
  gold:      "#C8A45A",
  ivory:     "#FAF6F0",
  ivoryDeep: "#F0E8DC",
  green:     "#2D5A1B",
  ink:       "#1A1008",
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

const VERSIONS = [
  { key: "nvi", label: "NVI — Nova Versão Internacional" },
  { key: "ra",  label: "RA — Almeida Revista e Atualizada" },
  { key: "acf", label: "ACF — Almeida Corrigida e Fiel" },
];

const HIGHLIGHTS = [
  { ref: "João 3:16",       abbrevApi: "john",        ch: 3,  v: 16 },
  { ref: "Salmos 23",       abbrevApi: "psalms",      ch: 23, v: null },
  { ref: "Filipenses 4:13", abbrevApi: "philippians", ch: 4,  v: 13 },
  { ref: "Romanos 8:28",    abbrevApi: "romans",      ch: 8,  v: 28 },
  { ref: "Provérbios 3:5",  abbrevApi: "proverbs",    ch: 3,  v: 5  },
  { ref: "Salmos 91",       abbrevApi: "psalms",      ch: 91, v: null },
  { ref: "Isaías 40:31",    abbrevApi: "isaiah",      ch: 40, v: 31 },
  { ref: "Jeremias 29:11",  abbrevApi: "jeremiah",    ch: 29, v: 11 },
];

function BackButton({ onClick, label, light }) {
  return (
    <button onClick={onClick} style={{
      background: "none", border: "none",
      color: light ? C.gold : C.navyMid,
      fontSize: 13, fontWeight: 600,
      display: "flex", alignItems: "center", gap: 4,
      marginBottom: 12, padding: 0, cursor: "pointer"
    }}>
      <ChevronLeft size={16} /> {label}
    </button>
  );
}

export default function BibleScreen() {
  const [view, setView]            = useState("home");
  const [version, setVersion]      = useState("almeida");
  const [selectedBook, setBook]    = useState(null);
  const [selectedChapter, setChap] = useState(1);
  const [verses, setVerses]        = useState([]);
  const [loading, setLoading]      = useState(false);
  const [error, setError]          = useState("");
  const [isOffline, setIsOffline]  = useState(false);
  const [searchQuery, setSearch]   = useState("");
  const [searchResults, setSR]     = useState(null);
  const [searching, setSearching]  = useState(false);
  // Nota: busca por palavra removida temporariamente
  const [randomVerse, setRandom]   = useState(null);
  const [testament, setTestament]  = useState("AT");
  const [highlight, setHighlight]  = useState(null);

  const loadChapter = useCallback(async (book, chapter, ver) => {
    setLoading(true); setError(""); setVerses([]);
    try {
      const data = await fetchChapter(book.abbrev, chapter, ver || version);
      setVerses(data.verses || []);
      setIsOffline(false);
    } catch {
      const fallback = getOfflineFallback(book.abbrev, chapter);
      if (fallback) {
        setVerses(fallback.verses || []);
        setIsOffline(true);
      } else {
        setError("Sem conexão. Este capítulo não está disponível offline.");
        setIsOffline(true);
      }
    }
    setLoading(false);
  }, [version]);

  const openChapter = (book, chapter, highlightVerse = null) => {
    setBook(book); setChap(chapter); setHighlight(highlightVerse);
    setView("chapter");
    loadChapter(book, chapter);
  };

  const openHighlight = (h) => {
    const book = BIBLE_BOOKS.find(b => b.abbrevApi === h.abbrevApi);
    if (book) openChapter(book, h.ch, h.v);
  };

  const loadRandom = async () => {
    setView("random"); setLoading(true); setError(""); setRandom(null);
    try {
      const data = await fetchRandomVerse(version);
      setRandom(data);
    } catch {
      setError("Sem conexão para carregar versículo aleatório.");
    }
    setLoading(false);
  };

  const doSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true); setSR(null); setError("");
    try {
      const data = await searchVerses(searchQuery.trim(), version);
      setSR(data);
    } catch {
      setError("Erro ao buscar. Verifique sua conexão.");
    }
    setSearching(false);
  };

  const prevChapter = () => {
    if (selectedChapter > 1) { const c = selectedChapter - 1; setChap(c); setHighlight(null); loadChapter(selectedBook, c); }
  };
  const nextChapter = () => {
    if (selectedChapter < selectedBook.chapters) { const c = selectedChapter + 1; setChap(c); setHighlight(null); loadChapter(selectedBook, c); }
  };

  // HOME
  if (view === "home") return (
    <div style={{ padding: "18px 18px 0" }}>
      <div style={{ background: `linear-gradient(160deg,${C.navy},${C.navyMid})`, borderRadius: 16, padding: 20, position: "relative", overflow: "hidden", marginBottom: 20 }}>
        <Vitral opacity={0.07} id="vt-bh" />
        <div style={{ position: "relative" }}>
          <Quote size={20} color={C.gold} />
          <h1 className="serif" style={{ color: "#fff", fontSize: 20, margin: "8px 0 4px" }}>Bíblia Sagrada</h1>
          <div style={{ color: C.gold, fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
            {VERSIONS.find(v => v.key === version)?.label}
          </div>
          <div style={{ background: `${C.gold}22`, border: `1px solid ${C.gold}66`, borderRadius: 8, padding: "7px 12px", fontSize: 12, fontWeight: 600, color: "#fff" }}>
            Almeida Revista e Corrigida
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 22 }}>
        {[
          { icon: BookOpen, label: "Ler Bíblia", action: () => setView("books"), color: C.navy },
          { icon: Search,   label: "Buscar",     action: () => setView("search"), color: C.green },
          { icon: Star,     label: "Aleatório",  action: loadRandom, color: "#8B6914" },
        ].map(a => (
          <button key={a.label} onClick={a.action} style={{
            background: "#fff", border: `1px solid ${C.ivoryDeep}`, borderRadius: 12,
            padding: "14px 6px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6
          }}>
            <a.icon size={20} color={a.color} />
            <span style={{ fontSize: 11, fontWeight: 700, color: C.ink }}>{a.label}</span>
          </button>
        ))}
      </div>

      <h2 className="serif" style={{ fontSize: 16, color: C.navy, margin: "0 0 12px", fontWeight: 700 }}>Passagens em Destaque</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, paddingBottom: 24 }}>
        {HIGHLIGHTS.map(h => (
          <button key={h.ref} onClick={() => openHighlight(h)} style={{
            background: "#fff", border: `1px solid ${C.ivoryDeep}`, borderRadius: 10,
            padding: 12, textAlign: "left", display: "flex", alignItems: "center", gap: 8
          }}>
            <Book size={15} color={C.navy} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: C.ink }}>{h.ref}</span>
          </button>
        ))}
      </div>
    </div>
  );

  // LIVROS
  if (view === "books") return (
    <div style={{ padding: "18px 18px 0" }}>
      <BackButton onClick={() => setView("home")} label="Bíblia" />
      <h2 className="serif" style={{ fontSize: 19, color: C.navy, margin: "0 0 14px", fontWeight: 700 }}>Escolha um Livro</h2>
      <div style={{ display: "flex", background: C.ivoryDeep, borderRadius: 10, padding: 3, marginBottom: 16 }}>
        {["AT", "NT"].map(t => (
          <button key={t} onClick={() => setTestament(t)} style={{
            flex: 1, background: testament === t ? C.navy : "transparent",
            color: testament === t ? "#fff" : C.ink, border: "none", borderRadius: 8,
            padding: "9px", fontSize: 13, fontWeight: 700
          }}>
            {t === "AT" ? "Antigo Testamento" : "Novo Testamento"}
          </button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, paddingBottom: 24 }}>
        {BIBLE_BOOKS.filter(b => b.testament === testament).map(book => (
          <button key={book.abbrev} onClick={() => { setBook(book); setView("chapters"); }} style={{
            background: "#fff", border: `1px solid ${C.ivoryDeep}`, borderRadius: 10, padding: "11px 12px", textAlign: "left"
          }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: C.ink }}>{book.name}</div>
            <div style={{ fontSize: 10.5, color: `${C.ink}88`, marginTop: 2 }}>{book.chapters} capítulos</div>
          </button>
        ))}
      </div>
    </div>
  );

  // CAPÍTULOS
  if (view === "chapters" && selectedBook) return (
    <div style={{ padding: "18px 18px 0" }}>
      <BackButton onClick={() => setView("books")} label="Livros" />
      <h2 className="serif" style={{ fontSize: 19, color: C.navy, margin: "0 0 14px", fontWeight: 700 }}>{selectedBook.name}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, paddingBottom: 24 }}>
        {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(ch => (
          <button key={ch} onClick={() => openChapter(selectedBook, ch)} style={{
            background: "#fff", border: `1px solid ${C.ivoryDeep}`, borderRadius: 9,
            padding: "12px 4px", fontSize: 14, fontWeight: 700, color: C.navy, textAlign: "center"
          }}>{ch}</button>
        ))}
      </div>
    </div>
  );

  // LEITURA
  if (view === "chapter") return (
    <div style={{ paddingBottom: 24 }}>
      <div style={{ background: `linear-gradient(135deg,${C.navy},${C.navyMid})`, padding: "14px 18px", position: "relative", overflow: "hidden" }}>
        <Vitral opacity={0.06} id="vt-ch" />
        <div style={{ position: "relative" }}>
          <BackButton onClick={() => setView("chapters")} label={selectedBook?.name} light />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
            <button onClick={prevChapter} disabled={selectedChapter <= 1} style={{ background: `${C.gold}22`, border: "none", borderRadius: 8, padding: "8px 12px", color: C.gold, opacity: selectedChapter <= 1 ? 0.3 : 1 }}>
              <ChevronLeft size={18} />
            </button>
            <div style={{ textAlign: "center" }}>
              <div className="serif" style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>{selectedBook?.name} {selectedChapter}</div>
              <div style={{ color: C.gold, fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                {VERSIONS.find(v => v.key === version)?.label.split(" — ")[0]}
                {isOffline && <><WifiOff size={10} /> offline</>}
              </div>
            </div>
            <button onClick={nextChapter} disabled={selectedChapter >= (selectedBook?.chapters || 1)} style={{ background: `${C.gold}22`, border: "none", borderRadius: 8, padding: "8px 12px", color: C.gold, opacity: selectedChapter >= (selectedBook?.chapters || 1) ? 0.3 : 1 }}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: "18px 18px 0" }}>
        {loading && (
          <div style={{ textAlign: "center", padding: "40px 0", color: `${C.ink}88` }}>
            <div style={{ fontSize: 13 }}>Carregando...</div>
          </div>
        )}
        {error && (
          <div style={{ background: `${C.navy}10`, border: `1px solid ${C.navy}33`, borderRadius: 12, padding: 16, textAlign: "center", color: C.navy }}>
            <WifiOff size={24} style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 13 }}>{error}</div>
          </div>
        )}
        {!loading && verses.map(v => (
          <div key={v.number} style={{
            padding: "10px 0", borderBottom: `1px solid ${C.ivoryDeep}`,
            background: highlight === v.number ? `${C.gold}18` : "transparent",
            borderRadius: highlight === v.number ? 8 : 0,
            paddingLeft: highlight === v.number ? 10 : 0,
            borderLeft: highlight === v.number ? `3px solid ${C.gold}` : "none",
          }}>
            <span style={{ color: C.gold, fontWeight: 800, fontSize: 12, marginRight: 8 }}>{v.number}</span>
            <span className="serif" style={{ fontSize: 16, lineHeight: 1.75, color: C.ink }}>{v.text}</span>
          </div>
        ))}
        {!loading && verses.length > 0 && (
          <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
            <button onClick={prevChapter} disabled={selectedChapter <= 1} style={{ flex: 1, background: selectedChapter <= 1 ? C.ivoryDeep : C.navy, color: selectedChapter <= 1 ? `${C.ink}55` : "#fff", border: "none", borderRadius: 10, padding: 13, fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <ChevronLeft size={16} /> Anterior
            </button>
            <button onClick={nextChapter} disabled={selectedChapter >= (selectedBook?.chapters || 1)} style={{ flex: 1, background: selectedChapter >= (selectedBook?.chapters || 1) ? C.ivoryDeep : C.navy, color: selectedChapter >= (selectedBook?.chapters || 1) ? `${C.ink}55` : "#fff", border: "none", borderRadius: 10, padding: 13, fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              Seguinte <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // BUSCA
  if (view === "search") return (
    <div style={{ padding: "18px 18px 0" }}>
      <BackButton onClick={() => setView("home")} label="Bíblia" />
      <h2 className="serif" style={{ fontSize: 19, color: C.navy, margin: "0 0 14px", fontWeight: 700 }}>Buscar na Bíblia</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={15} color={`${C.ink}66`} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input value={searchQuery} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && doSearch()}
            placeholder="Ex: fé, amor, esperança..." style={{ width: "100%", padding: "12px 12px 12px 36px", borderRadius: 10, border: `1.5px solid ${C.ivoryDeep}`, fontSize: 14 }} />
        </div>
        <button onClick={doSearch} style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 10, padding: "0 16px", fontWeight: 700, fontSize: 13 }}>
          {searching ? "..." : "Buscar"}
        </button>
      </div>
      {error && <div style={{ color: C.navy, fontSize: 13, marginBottom: 12 }}>{error}</div>}
      {searchResults && (
        <div>
          <div style={{ fontSize: 12.5, color: `${C.ink}88`, marginBottom: 12 }}>{searchResults.occurrence} resultado(s) para "{searchQuery}"</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingBottom: 24 }}>
            {(searchResults.verses || []).slice(0, 30).map((v, i) => (
              <button key={i} onClick={() => { const book = BIBLE_BOOKS.find(b => b.abbrev === v.book?.abbrev?.pt); if (book) openChapter(book, v.chapter, v.number); }} style={{ background: "#fff", border: `1px solid ${C.ivoryDeep}`, borderRadius: 10, padding: 13, textAlign: "left" }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: C.navy, marginBottom: 4 }}>{v.book?.name} {v.chapter}:{v.number}</div>
                <div className="serif" style={{ fontSize: 13.5, color: C.ink, lineHeight: 1.5 }}>{v.text}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ALEATÓRIO
  if (view === "random") return (
    <div style={{ padding: "18px 18px 0" }}>
      <BackButton onClick={() => setView("home")} label="Bíblia" />
      <h2 className="serif" style={{ fontSize: 19, color: C.navy, margin: "0 0 16px", fontWeight: 700 }}>Versículo do Momento</h2>
      {loading && <div style={{ textAlign: "center", padding: "60px 0", color: `${C.ink}88` }}><div>Buscando um versículo...</div></div>}
      {randomVerse && !loading && (
        <div>
          <div style={{ background: `linear-gradient(160deg,${C.navy},${C.navyMid})`, borderRadius: 16, padding: 24, position: "relative", overflow: "hidden", marginBottom: 18 }}>
            <Vitral opacity={0.07} id="vt-rv" />
            <div style={{ position: "relative" }}>
              <Quote size={24} color={C.gold} />
              <p className="serif" style={{ color: "#fff", fontSize: 17, lineHeight: 1.75, margin: "12px 0" }}>{randomVerse.text}</p>
              <div style={{ color: C.gold, fontWeight: 700, fontSize: 13.5 }}>{randomVerse.book?.name} {randomVerse.chapter}:{randomVerse.number}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={loadRandom} style={{ flex: 1, background: C.navy, color: "#fff", border: "none", borderRadius: 10, padding: 13, fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <RefreshCw size={15} /> Outro versículo
            </button>
            <button onClick={() => { const book = BIBLE_BOOKS.find(b => b.abbrev === randomVerse.book?.abbrev?.pt); if (book) openChapter(book, randomVerse.chapter, randomVerse.number); }} style={{ flex: 1, background: C.ivoryDeep, color: C.ink, border: "none", borderRadius: 10, padding: 13, fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <BookOpen size={15} /> Ver capítulo
            </button>
          </div>
        </div>
      )}
      {error && (
        <div style={{ textAlign: "center", padding: "40px 0", color: `${C.ink}88` }}>
          <WifiOff size={28} style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 13, marginBottom: 16 }}>{error}</div>
          <button onClick={loadRandom} style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 10, padding: "11px 20px", fontWeight: 700, fontSize: 13 }}>Tentar novamente</button>
        </div>
      )}
    </div>
  );

  return null;
}
