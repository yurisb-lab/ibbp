// src/services/bibleService.js
// ─────────────────────────────────────────────────────────────
// API: abibliadigital.com.br  (gratuita, português, sem token = 20 req/hora)
// Com token cadastrado = ilimitado e gratuito
// Fallback offline: Salmos + versículos mais conhecidos embutidos
// ─────────────────────────────────────────────────────────────

const BASE_URL = "https://www.abibliadigital.com.br/api";

// Token opcional — cadastre em abibliadigital.com.br para requisições ilimitadas
// Deixe vazio para usar sem token (20 req/hora)
const TOKEN = "";

function headers() {
  const h = { "Content-Type": "application/json" };
  if (TOKEN) h["Authorization"] = `Bearer ${TOKEN}`;
  return h;
}

// ── Lista de livros com abreviações ──────────────────────────
export const BIBLE_BOOKS = [
  // Antigo Testamento
  { name: "Gênesis",          abbrev: "gn",   chapters: 50, testament: "AT" },
  { name: "Êxodo",            abbrev: "ex",   chapters: 40, testament: "AT" },
  { name: "Levítico",         abbrev: "lv",   chapters: 27, testament: "AT" },
  { name: "Números",          abbrev: "nm",   chapters: 36, testament: "AT" },
  { name: "Deuteronômio",     abbrev: "dt",   chapters: 34, testament: "AT" },
  { name: "Josué",            abbrev: "js",   chapters: 24, testament: "AT" },
  { name: "Juízes",           abbrev: "jz",   chapters: 21, testament: "AT" },
  { name: "Rute",             abbrev: "rt",   chapters: 4,  testament: "AT" },
  { name: "1 Samuel",         abbrev: "1sm",  chapters: 31, testament: "AT" },
  { name: "2 Samuel",         abbrev: "2sm",  chapters: 24, testament: "AT" },
  { name: "1 Reis",           abbrev: "1rs",  chapters: 22, testament: "AT" },
  { name: "2 Reis",           abbrev: "2rs",  chapters: 25, testament: "AT" },
  { name: "1 Crônicas",       abbrev: "1cr",  chapters: 29, testament: "AT" },
  { name: "2 Crônicas",       abbrev: "2cr",  chapters: 36, testament: "AT" },
  { name: "Esdras",           abbrev: "ed",   chapters: 10, testament: "AT" },
  { name: "Neemias",          abbrev: "ne",   chapters: 13, testament: "AT" },
  { name: "Ester",            abbrev: "et",   chapters: 10, testament: "AT" },
  { name: "Jó",               abbrev: "jó",   chapters: 42, testament: "AT" },
  { name: "Salmos",           abbrev: "sl",   chapters: 150,testament: "AT" },
  { name: "Provérbios",       abbrev: "pv",   chapters: 31, testament: "AT" },
  { name: "Eclesiastes",      abbrev: "ec",   chapters: 12, testament: "AT" },
  { name: "Cânticos",         abbrev: "ct",   chapters: 8,  testament: "AT" },
  { name: "Isaías",           abbrev: "is",   chapters: 66, testament: "AT" },
  { name: "Jeremias",         abbrev: "jr",   chapters: 52, testament: "AT" },
  { name: "Lamentações",      abbrev: "lm",   chapters: 5,  testament: "AT" },
  { name: "Ezequiel",         abbrev: "ez",   chapters: 48, testament: "AT" },
  { name: "Daniel",           abbrev: "dn",   chapters: 12, testament: "AT" },
  { name: "Oséias",           abbrev: "os",   chapters: 14, testament: "AT" },
  { name: "Joel",             abbrev: "jl",   chapters: 3,  testament: "AT" },
  { name: "Amós",             abbrev: "am",   chapters: 9,  testament: "AT" },
  { name: "Obadias",          abbrev: "ob",   chapters: 1,  testament: "AT" },
  { name: "Jonas",            abbrev: "jn",   chapters: 4,  testament: "AT" },
  { name: "Miquéias",         abbrev: "mq",   chapters: 7,  testament: "AT" },
  { name: "Naum",             abbrev: "na",   chapters: 3,  testament: "AT" },
  { name: "Habacuque",        abbrev: "hc",   chapters: 3,  testament: "AT" },
  { name: "Sofonias",         abbrev: "sf",   chapters: 3,  testament: "AT" },
  { name: "Ageu",             abbrev: "ag",   chapters: 2,  testament: "AT" },
  { name: "Zacarias",         abbrev: "zc",   chapters: 14, testament: "AT" },
  { name: "Malaquias",        abbrev: "ml",   chapters: 4,  testament: "AT" },
  // Novo Testamento
  { name: "Mateus",           abbrev: "mt",   chapters: 28, testament: "NT" },
  { name: "Marcos",           abbrev: "mc",   chapters: 16, testament: "NT" },
  { name: "Lucas",            abbrev: "lc",   chapters: 24, testament: "NT" },
  { name: "João",             abbrev: "jo",   chapters: 21, testament: "NT" },
  { name: "Atos",             abbrev: "at",   chapters: 28, testament: "NT" },
  { name: "Romanos",          abbrev: "rm",   chapters: 16, testament: "NT" },
  { name: "1 Coríntios",      abbrev: "1co",  chapters: 16, testament: "NT" },
  { name: "2 Coríntios",      abbrev: "2co",  chapters: 13, testament: "NT" },
  { name: "Gálatas",          abbrev: "gl",   chapters: 6,  testament: "NT" },
  { name: "Efésios",          abbrev: "ef",   chapters: 6,  testament: "NT" },
  { name: "Filipenses",       abbrev: "fp",   chapters: 4,  testament: "NT" },
  { name: "Colossenses",      abbrev: "cl",   chapters: 4,  testament: "NT" },
  { name: "1 Tessalonicenses",abbrev: "1ts",  chapters: 5,  testament: "NT" },
  { name: "2 Tessalonicenses",abbrev: "2ts",  chapters: 3,  testament: "NT" },
  { name: "1 Timóteo",        abbrev: "1tm",  chapters: 6,  testament: "NT" },
  { name: "2 Timóteo",        abbrev: "2tm",  chapters: 4,  testament: "NT" },
  { name: "Tito",             abbrev: "tt",   chapters: 3,  testament: "NT" },
  { name: "Filemom",          abbrev: "fm",   chapters: 1,  testament: "NT" },
  { name: "Hebreus",          abbrev: "hb",   chapters: 13, testament: "NT" },
  { name: "Tiago",            abbrev: "tg",   chapters: 5,  testament: "NT" },
  { name: "1 Pedro",          abbrev: "1pe",  chapters: 5,  testament: "NT" },
  { name: "2 Pedro",          abbrev: "2pe",  chapters: 3,  testament: "NT" },
  { name: "1 João",           abbrev: "1jo",  chapters: 5,  testament: "NT" },
  { name: "2 João",           abbrev: "2jo",  chapters: 1,  testament: "NT" },
  { name: "3 João",           abbrev: "3jo",  chapters: 1,  testament: "NT" },
  { name: "Judas",            abbrev: "jd",   chapters: 1,  testament: "NT" },
  { name: "Apocalipse",       abbrev: "ap",   chapters: 22, testament: "NT" },
];

// ── Cache em memória (evita repetir chamadas na sessão) ──────
const cache = {};

// ── Buscar capítulo pela API ──────────────────────────────────
export async function fetchChapter(abbrev, chapter, version = "nvi") {
  const key = `${version}/${abbrev}/${chapter}`;
  if (cache[key]) return cache[key];

  const res = await fetch(
    `${BASE_URL}/verses/${version}/${abbrev}/${chapter}`,
    { headers: headers() }
  );
  if (!res.ok) throw new Error(`Erro ${res.status}`);
  const data = await res.json();
  cache[key] = data;
  return data;
}

// ── Versículo aleatório ───────────────────────────────────────
export async function fetchRandomVerse(version = "nvi") {
  const res = await fetch(
    `${BASE_URL}/verses/${version}/random`,
    { headers: headers() }
  );
  if (!res.ok) throw new Error(`Erro ${res.status}`);
  return res.json();
}

// ── Busca por palavra ─────────────────────────────────────────
export async function searchVerses(word, version = "nvi") {
  const res = await fetch(`${BASE_URL}/verses/search`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ version, search: word }),
  });
  if (!res.ok) throw new Error(`Erro ${res.status}`);
  return res.json();
}

// ── FALLBACK OFFLINE ──────────────────────────────────────────
// Salmo 23 completo + versículos conhecidos embutidos
export const OFFLINE_FALLBACK = {
  "sl/23": {
    book: { name: "Salmos" },
    chapter: { number: 23, verses: 6 },
    verses: [
      { number: 1, text: "O Senhor é o meu pastor; nada me faltará." },
      { number: 2, text: "Ele me faz repousar em pastos verdejantes. Leva-me para junto das águas de descanso;" },
      { number: 3, text: "refrigera a minha alma. Guia-me pelas veredas da justiça, por amor do seu nome." },
      { number: 4, text: "Ainda que eu ande pelo vale da sombra da morte, não temerei mal algum, porque tu estás comigo; o teu bordão e o teu cajado me consolam." },
      { number: 5, text: "Preparas uma mesa perante mim na presença dos meus adversários, unges a minha cabeça com óleo; o meu cálice transborda." },
      { number: 6, text: "Bondade e misericórdia certamente me seguirão todos os dias da minha vida; e habitarei na casa do Senhor por longos dias." },
    ],
  },
  "jo/3": {
    book: { name: "João" },
    chapter: { number: 3, verses: 21 },
    verses: [
      { number: 16, text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna." },
      { number: 17, text: "Porque Deus enviou o seu Filho ao mundo, não para que julgasse o mundo, mas para que o mundo fosse salvo por ele." },
    ],
  },
};

export function getOfflineFallback(abbrev, chapter) {
  return OFFLINE_FALLBACK[`${abbrev}/${chapter}`] || null;
}
