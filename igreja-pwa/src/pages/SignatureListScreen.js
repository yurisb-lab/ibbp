// src/pages/SignatureListScreen.js
import React, { useState, useEffect } from "react";
import { ChevronLeft, Printer, Filter, Users, Check } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";

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

const MINISTERIOS_LIST = [
  "Louvor e Adoração", "Ministério Jovem", "Ação Social",
  "Ministério Infantil", "Mulheres em Oração", "Diaconato",
  "Escola Bíblica Dominical", "Evangelismo", "Intercessão",
  "Mídia e Comunicação",
];

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

export default function SignatureListScreen({ onBack }) {
  const [members, setMembers]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filterStatus, setFilterStatus] = useState("ativos");
  const [filterMinistry, setFilterMinistry] = useState("todos");
  const [listTitle, setListTitle]     = useState("Lista de Presença");
  const [listDate, setListDate]       = useState(new Date().toLocaleDateString("pt-BR"));
  const [listOccasion, setListOccasion] = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      setMembers(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
    } catch {}
    setLoading(false);
  };

  const filtered = members
    .filter(m => {
      const matchStatus =
        filterStatus === "todos" ? true :
        filterStatus === "ativos" ? m.active !== false : m.active === false;
      const matchMinistry =
        filterMinistry === "todos" ? true :
        (m.ministries || []).includes(filterMinistry);
      return matchStatus && matchMinistry;
    })
    .sort((a, b) => (a.name || "").localeCompare(b.name || "", "pt-BR"));

  const printList = () => {
    const rows = filtered.map((m, i) => `
      <tr>
        <td style="padding:8px;border:1px solid #ddd;text-align:center;width:40px">${i + 1}</td>
        <td style="padding:8px;border:1px solid #ddd;font-size:13px">${m.name || ""}</td>
        <td style="padding:8px;border:1px solid #ddd;width:220px">&nbsp;</td>
      </tr>
    `).join("");

    const ministryLabel = filterMinistry === "todos" ? "" : ` — ${filterMinistry}`;
    const statusLabel = filterStatus === "ativos" ? "Membros Ativos" : filterStatus === "inativos" ? "Membros Inativos" : "Todos os Membros";

    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <title>${listTitle} — IBBP</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: Arial, sans-serif; margin: 20px; color: #1A1008; }
          .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #6B0F0F; padding-bottom: 16px; }
          .church-name { font-size: 16px; font-weight: bold; color: #6B0F0F; margin: 0 0 4px; }
          .list-title { font-size: 20px; font-weight: bold; margin: 8px 0 4px; }
          .list-info { font-size: 13px; color: #6B6560; margin: 4px 0; }
          .stats { display: flex; gap: 20px; margin-bottom: 16px; font-size: 12px; color: #6B6560; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th { background: #6B0F0F; color: white; padding: 10px 8px; text-align: left; font-size: 13px; border: 1px solid #6B0F0F; }
          th:first-child { text-align: center; }
          tr:nth-child(even) td { background: #FAF6F0; }
          .footer { margin-top: 32px; font-size: 11px; color: #6B6560; text-align: center; border-top: 1px solid #ddd; padding-top: 12px; }
          .signature-label { font-size: 9px; color: #999; display: block; margin-top: 2px; }
          @media print {
            body { margin: 10px; }
            @page { margin: 15mm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="church-name">Igreja Bíblica Batista de Pacatuba</div>
          <div class="list-title">${listTitle}${ministryLabel}</div>
          <div class="list-info">${listOccasion ? listOccasion + " — " : ""}${listDate}</div>
          <div class="list-info">${statusLabel} · Total: ${filtered.length} ${filtered.length === 1 ? "pessoa" : "pessoas"}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width:40px">Nº</th>
              <th>Nome</th>
              <th style="width:220px">Assinatura</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
            ${Array.from({length: Math.max(0, 3 - filtered.length)}, (_, i) => `
              <tr>
                <td style="padding:8px;border:1px solid #ddd;text-align:center">${filtered.length + i + 1}</td>
                <td style="padding:8px;border:1px solid #ddd;">&nbsp;</td>
                <td style="padding:8px;border:1px solid #ddd;">&nbsp;</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <div style="margin-top:40px; display:flex; gap:60px; justify-content:center;">
          <div style="text-align:center">
            <div style="border-top:1px solid #333; padding-top:6px; font-size:12px; width:200px;">Responsável</div>
          </div>
          <div style="text-align:center">
            <div style="border-top:1px solid #333; padding-top:6px; font-size:12px; width:200px;">Pastor / Secretário</div>
          </div>
        </div>

        <div class="footer">
          Igreja Bíblica Batista de Pacatuba · Lista gerada em ${new Date().toLocaleDateString("pt-BR", {day:"2-digit",month:"long",year:"numeric"})}
        </div>
      </body>
      </html>
    `;

    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 600);
  };

  return (
    <div style={{ padding: "18px 18px 0" }}>
      {/* Header */}
      <button onClick={onBack} style={{ background: "none", border: "none", color: C.navyMid, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, marginBottom: 14, padding: 0 }}>
        <ChevronLeft size={16} /> Voltar
      </button>

      <div style={{ background: `linear-gradient(160deg,${C.navy},${C.navyMid})`, borderRadius: 16, padding: 18, position: "relative", overflow: "hidden", marginBottom: 18 }}>
        <Vitral opacity={0.06} id="vt-sl" />
        <div style={{ position: "relative" }}>
          <div style={{ color: C.gold, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, marginBottom: 4 }}>SECRETARIA</div>
          <h1 className="serif" style={{ color: "#fff", fontSize: 19, margin: "0 0 4px" }}>Lista de Assinaturas</h1>
          <div style={{ color: `${C.ivory}99`, fontSize: 12 }}>Impressão de listas de presença e assinatura</div>
        </div>
      </div>

      {/* Configurações da lista */}
      <div style={{ background: "#fff", border: `1px solid ${C.ivoryDeep}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.gray, marginBottom: 12, letterSpacing: 0.5 }}>CONFIGURAÇÕES DA LISTA</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: `${C.ink}aa` }}>
            Título da lista
            <input value={listTitle} onChange={e => setListTitle(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: `1.5px solid ${C.ivoryDeep}`, fontSize: 14, marginTop: 5, display: "block" }} />
          </label>

          <label style={{ fontSize: 12.5, fontWeight: 600, color: `${C.ink}aa` }}>
            Ocasião / Evento (opcional)
            <input value={listOccasion} onChange={e => setListOccasion(e.target.value)}
              placeholder="Ex: Culto de Celebração, Reunião de Oração..."
              style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: `1.5px solid ${C.ivoryDeep}`, fontSize: 14, marginTop: 5, display: "block" }} />
          </label>

          <label style={{ fontSize: 12.5, fontWeight: 600, color: `${C.ink}aa` }}>
            Data
            <input value={listDate} onChange={e => setListDate(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: `1.5px solid ${C.ivoryDeep}`, fontSize: 14, marginTop: 5, display: "block" }} />
          </label>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ background: "#fff", border: `1px solid ${C.ivoryDeep}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.gray, marginBottom: 12, letterSpacing: 0.5 }}>FILTROS</div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: `${C.ink}aa`, marginBottom: 8 }}>Status</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[{k:"ativos",l:"Ativos"},{k:"inativos",l:"Inativos"},{k:"todos",l:"Todos"}].map(f => (
              <button key={f.k} onClick={() => setFilterStatus(f.k)} style={{
                background: filterStatus === f.k ? C.navy : C.ivoryDeep,
                color: filterStatus === f.k ? "#fff" : C.ink,
                border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12.5, fontWeight: 600
              }}>
                {f.l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: `${C.ink}aa`, marginBottom: 8 }}>Ministério</div>
          <select value={filterMinistry} onChange={e => setFilterMinistry(e.target.value)} style={{
            width: "100%", padding: "10px 12px", borderRadius: 9, border: `1.5px solid ${C.ivoryDeep}`, fontSize: 14
          }}>
            <option value="todos">Todos os ministérios</option>
            {MINISTERIOS_LIST.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Preview da lista */}
      <div style={{ background: "#fff", border: `1px solid ${C.ivoryDeep}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.gray, letterSpacing: 0.5 }}>PRÉ-VISUALIZAÇÃO</div>
          <div style={{ fontSize: 12, color: C.green, fontWeight: 700 }}>
            <Users size={13} style={{ display: "inline", marginRight: 4 }} />
            {loading ? "..." : `${filtered.length} ${filtered.length === 1 ? "pessoa" : "pessoas"}`}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: C.gray, fontSize: 13 }}>Carregando membros...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: C.gray, fontSize: 13 }}>Nenhum membro encontrado com este filtro.</div>
        ) : (
          <div>
            {/* Cabeçalho simulado */}
            <div style={{ display: "grid", gridTemplateColumns: "32px 1fr 100px", gap: 0, marginBottom: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.gray, textAlign: "center" }}>Nº</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.gray }}>NOME</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.gray }}>ASSINATURA</div>
            </div>
            {/* Primeiros 5 como preview */}
            {filtered.slice(0, 5).map((m, i) => (
              <div key={m.uid} style={{
                display: "grid", gridTemplateColumns: "32px 1fr 100px",
                padding: "7px 0", borderBottom: `1px solid ${C.ivoryDeep}`,
                background: i % 2 === 1 ? `${C.ivory}` : "#fff"
              }}>
                <div style={{ fontSize: 12, color: C.gray, textAlign: "center" }}>{i + 1}</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div>
                <div style={{ borderBottom: `1px solid ${C.ink}44`, margin: "4px 8px 0" }} />
              </div>
            ))}
            {filtered.length > 5 && (
              <div style={{ textAlign: "center", padding: "8px 0", fontSize: 12, color: C.gray, fontStyle: "italic" }}>
                + {filtered.length - 5} pessoas na lista completa
              </div>
            )}
          </div>
        )}
      </div>

      {/* Botão imprimir */}
      <button onClick={printList} disabled={loading || filtered.length === 0} style={{
        width: "100%", background: filtered.length === 0 ? C.ivoryDeep : C.navy,
        color: filtered.length === 0 ? C.gray : "#fff",
        border: "none", borderRadius: 12, padding: 16, fontSize: 15, fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        marginBottom: 24, opacity: filtered.length === 0 ? 0.6 : 1
      }}>
        <Printer size={20} />
        Imprimir lista ({filtered.length} {filtered.length === 1 ? "pessoa" : "pessoas"})
      </button>
    </div>
  );
}
