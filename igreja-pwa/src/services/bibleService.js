// src/services/bibleService.js
// API principal: api.biblia.com.br (gratuita, sem token)
// Fallback: bible-api.com (inglês, mas estável)
// Offline: Salmos 23, João 3, Filipenses 4

const CACHE = {};

export const BIBLE_BOOKS = [
  // Antigo Testamento
  { name: "Gênesis",           abbrev: "gn",   abbrevApi: "genesis",          chapters: 50,  testament: "AT" },
  { name: "Êxodo",             abbrev: "ex",   abbrevApi: "exodus",           chapters: 40,  testament: "AT" },
  { name: "Levítico",          abbrev: "lv",   abbrevApi: "leviticus",        chapters: 27,  testament: "AT" },
  { name: "Números",           abbrev: "nm",   abbrevApi: "numbers",          chapters: 36,  testament: "AT" },
  { name: "Deuteronômio",      abbrev: "dt",   abbrevApi: "deuteronomy",      chapters: 34,  testament: "AT" },
  { name: "Josué",             abbrev: "js",   abbrevApi: "joshua",           chapters: 24,  testament: "AT" },
  { name: "Juízes",            abbrev: "jz",   abbrevApi: "judges",           chapters: 21,  testament: "AT" },
  { name: "Rute",              abbrev: "rt",   abbrevApi: "ruth",             chapters: 4,   testament: "AT" },
  { name: "1 Samuel",          abbrev: "1sm",  abbrevApi: "1samuel",          chapters: 31,  testament: "AT" },
  { name: "2 Samuel",          abbrev: "2sm",  abbrevApi: "2samuel",          chapters: 24,  testament: "AT" },
  { name: "1 Reis",            abbrev: "1rs",  abbrevApi: "1kings",           chapters: 22,  testament: "AT" },
  { name: "2 Reis",            abbrev: "2rs",  abbrevApi: "2kings",           chapters: 25,  testament: "AT" },
  { name: "1 Crônicas",        abbrev: "1cr",  abbrevApi: "1chronicles",      chapters: 29,  testament: "AT" },
  { name: "2 Crônicas",        abbrev: "2cr",  abbrevApi: "2chronicles",      chapters: 36,  testament: "AT" },
  { name: "Esdras",            abbrev: "ed",   abbrevApi: "ezra",             chapters: 10,  testament: "AT" },
  { name: "Neemias",           abbrev: "ne",   abbrevApi: "nehemiah",         chapters: 13,  testament: "AT" },
  { name: "Ester",             abbrev: "et",   abbrevApi: "esther",           chapters: 10,  testament: "AT" },
  { name: "Jó",                abbrev: "jo2",  abbrevApi: "job",              chapters: 42,  testament: "AT" },
  { name: "Salmos",            abbrev: "sl",   abbrevApi: "psalms",           chapters: 150, testament: "AT" },
  { name: "Provérbios",        abbrev: "pv",   abbrevApi: "proverbs",         chapters: 31,  testament: "AT" },
  { name: "Eclesiastes",       abbrev: "ec",   abbrevApi: "ecclesiastes",     chapters: 12,  testament: "AT" },
  { name: "Cânticos",          abbrev: "ct",   abbrevApi: "songofsolomon",    chapters: 8,   testament: "AT" },
  { name: "Isaías",            abbrev: "is",   abbrevApi: "isaiah",           chapters: 66,  testament: "AT" },
  { name: "Jeremias",          abbrev: "jr",   abbrevApi: "jeremiah",         chapters: 52,  testament: "AT" },
  { name: "Lamentações",       abbrev: "lm",   abbrevApi: "lamentations",     chapters: 5,   testament: "AT" },
  { name: "Ezequiel",          abbrev: "ez",   abbrevApi: "ezekiel",          chapters: 48,  testament: "AT" },
  { name: "Daniel",            abbrev: "dn",   abbrevApi: "daniel",           chapters: 12,  testament: "AT" },
  { name: "Oséias",            abbrev: "os",   abbrevApi: "hosea",            chapters: 14,  testament: "AT" },
  { name: "Joel",              abbrev: "jl",   abbrevApi: "joel",             chapters: 3,   testament: "AT" },
  { name: "Amós",              abbrev: "am",   abbrevApi: "amos",             chapters: 9,   testament: "AT" },
  { name: "Obadias",           abbrev: "ob",   abbrevApi: "obadiah",          chapters: 1,   testament: "AT" },
  { name: "Jonas",             abbrev: "jn2",  abbrevApi: "jonah",            chapters: 4,   testament: "AT" },
  { name: "Miquéias",          abbrev: "mq",   abbrevApi: "micah",            chapters: 7,   testament: "AT" },
  { name: "Naum",              abbrev: "na",   abbrevApi: "nahum",            chapters: 3,   testament: "AT" },
  { name: "Habacuque",         abbrev: "hc",   abbrevApi: "habakkuk",         chapters: 3,   testament: "AT" },
  { name: "Sofonias",          abbrev: "sf",   abbrevApi: "zephaniah",        chapters: 3,   testament: "AT" },
  { name: "Ageu",              abbrev: "ag",   abbrevApi: "haggai",           chapters: 2,   testament: "AT" },
  { name: "Zacarias",          abbrev: "zc",   abbrevApi: "zechariah",        chapters: 14,  testament: "AT" },
  { name: "Malaquias",         abbrev: "ml",   abbrevApi: "malachi",          chapters: 4,   testament: "AT" },
  // Novo Testamento
  { name: "Mateus",            abbrev: "mt",   abbrevApi: "matthew",          chapters: 28,  testament: "NT" },
  { name: "Marcos",            abbrev: "mc",   abbrevApi: "mark",             chapters: 16,  testament: "NT" },
  { name: "Lucas",             abbrev: "lc",   abbrevApi: "luke",             chapters: 24,  testament: "NT" },
  { name: "João",              abbrev: "jo",   abbrevApi: "john",             chapters: 21,  testament: "NT" },
  { name: "Atos",              abbrev: "at",   abbrevApi: "acts",             chapters: 28,  testament: "NT" },
  { name: "Romanos",           abbrev: "rm",   abbrevApi: "romans",           chapters: 16,  testament: "NT" },
  { name: "1 Coríntios",       abbrev: "1co",  abbrevApi: "1corinthians",     chapters: 16,  testament: "NT" },
  { name: "2 Coríntios",       abbrev: "2co",  abbrevApi: "2corinthians",     chapters: 13,  testament: "NT" },
  { name: "Gálatas",           abbrev: "gl",   abbrevApi: "galatians",        chapters: 6,   testament: "NT" },
  { name: "Efésios",           abbrev: "ef",   abbrevApi: "ephesians",        chapters: 6,   testament: "NT" },
  { name: "Filipenses",        abbrev: "fp",   abbrevApi: "philippians",      chapters: 4,   testament: "NT" },
  { name: "Colossenses",       abbrev: "cl",   abbrevApi: "colossians",       chapters: 4,   testament: "NT" },
  { name: "1 Tessalonicenses", abbrev: "1ts",  abbrevApi: "1thessalonians",   chapters: 5,   testament: "NT" },
  { name: "2 Tessalonicenses", abbrev: "2ts",  abbrevApi: "2thessalonians",   chapters: 3,   testament: "NT" },
  { name: "1 Timóteo",         abbrev: "1tm",  abbrevApi: "1timothy",         chapters: 6,   testament: "NT" },
  { name: "2 Timóteo",         abbrev: "2tm",  abbrevApi: "2timothy",         chapters: 4,   testament: "NT" },
  { name: "Tito",              abbrev: "tt",   abbrevApi: "titus",            chapters: 3,   testament: "NT" },
  { name: "Filemom",           abbrev: "fm",   abbrevApi: "philemon",         chapters: 1,   testament: "NT" },
  { name: "Hebreus",           abbrev: "hb",   abbrevApi: "hebrews",          chapters: 13,  testament: "NT" },
  { name: "Tiago",             abbrev: "tg",   abbrevApi: "james",            chapters: 5,   testament: "NT" },
  { name: "1 Pedro",           abbrev: "1pe",  abbrevApi: "1peter",           chapters: 5,   testament: "NT" },
  { name: "2 Pedro",           abbrev: "2pe",  abbrevApi: "2peter",           chapters: 3,   testament: "NT" },
  { name: "1 João",            abbrev: "1jo",  abbrevApi: "1john",            chapters: 5,   testament: "NT" },
  { name: "2 João",            abbrev: "2jo",  abbrevApi: "2john",            chapters: 1,   testament: "NT" },
  { name: "3 João",            abbrev: "3jo",  abbrevApi: "3john",            chapters: 1,   testament: "NT" },
  { name: "Judas",             abbrev: "jd",   abbrevApi: "jude",             chapters: 1,   testament: "NT" },
  { name: "Apocalipse",        abbrev: "ap",   abbrevApi: "revelation",       chapters: 22,  testament: "NT" },
];

// ── Buscar capítulo ───────────────────────────────────────────
export async function fetchChapter(abbrevApi, chapter) {
  const key = `${abbrevApi}/${chapter}`;
  if (CACHE[key]) return CACHE[key];

  // bible-api.com — retorna texto em português (almeida)
  const url = `https://bible-api.com/${abbrevApi}+${chapter}?translation=almeida`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro ${res.status}`);
  const data = await res.json();

  // Normaliza para formato {verses: [{number, text}]}
  const verses = (data.verses || []).map(v => ({
    number: v.verse,
    text: v.text?.trim() || ""
  }));

  const result = { verses };
  CACHE[key] = result;
  return result;
}

// ── Versículo aleatório ───────────────────────────────────────
export async function fetchRandomVerse() {
  const options = [
    "john+3:16", "psalms+23", "philippians+4:13",
    "romans+8:28", "proverbs+3:5-6", "isaiah+40:31",
    "jeremiah+29:11", "psalms+91:1-2", "matthew+6:33",
  ];
  const pick = options[Math.floor(Math.random() * options.length)];
  const res = await fetch(`https://bible-api.com/${pick}?translation=almeida`);
  if (!res.ok) throw new Error("Erro");
  const data = await res.json();
  const firstVerse = (data.verses || [])[0];
  return {
    text: data.text?.trim() || firstVerse?.text || "",
    book: { name: data.reference?.split(" ").slice(0,-1).join(" ") || "Bíblia" },
    chapter: firstVerse?.chapter || 1,
    number: firstVerse?.verse || 1,
    reference: data.reference || pick,
  };
}

// ── Fallback offline ──────────────────────────────────────────
export const OFFLINE_CHAPTERS = {
  "psalms/23": {
    verses: [
      { number: 1,  text: "O Senhor é o meu pastor; nada me faltará." },
      { number: 2,  text: "Ele me faz repousar em pastos verdejantes. Leva-me para junto das águas de descanso;" },
      { number: 3,  text: "refrigera a minha alma. Guia-me pelas veredas da justiça, por amor do seu nome." },
      { number: 4,  text: "Ainda que eu ande pelo vale da sombra da morte, não temerei mal algum, porque tu estás comigo; o teu bordão e o teu cajado me consolam." },
      { number: 5,  text: "Preparas uma mesa perante mim na presença dos meus adversários, unges a minha cabeça com óleo; o meu cálice transborda." },
      { number: 6,  text: "Bondade e misericórdia certamente me seguirão todos os dias da minha vida; e habitarei na casa do Senhor por longos dias." },
    ]
  },
  "john/3": {
    verses: [
      { number: 16, text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna." },
      { number: 17, text: "Porque Deus enviou o seu Filho ao mundo, não para que julgasse o mundo, mas para que o mundo fosse salvo por ele." },
    ]
  },
  "philippians/4": {
    verses: [
      { number: 13, text: "Posso todas as coisas naquele que me fortalece." },
      { number: 4,  text: "Regozijai-vos sempre no Senhor; outra vez digo: Regozijai-vos." },
      { number: 6,  text: "Não andeis ansiosos por coisa alguma; antes em tudo apresentai as vossas petições a Deus em oração e súplica, com ação de graças;" },
      { number: 7,  text: "e a paz de Deus, que excede todo o entendimento, guardará os vossos corações e os vossos pensamentos em Cristo Jesus." },
    ]
  },
};

export function getOfflineFallback(abbrevApi, chapter) {
  return OFFLINE_CHAPTERS[`${abbrevApi}/${chapter}`] || null;
}
