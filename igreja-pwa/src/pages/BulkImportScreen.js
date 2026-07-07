// src/pages/BulkImportScreen.js
// Tela TEMPORÁRIA para importação em lote de membros
// Remover após uso!

import React, { useState } from "react";
import { ChevronLeft, Upload, Check, X, AlertCircle } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../services/firebase";

const C = {
  navy: "#6B0F0F", navyMid: "#8B1A1A", gold: "#C8A45A",
  ivory: "#FAF6F0", ivoryDeep: "#F0E8DC", green: "#2D5A1B",
  ink: "#1A1008", gray: "#6B6560",
};

const MEMBROS_PRECARREGADOS = `Ádrya de Oliveira Sabino
Afonso Augusto de Freitas Junior (Juninho)
Aires Maria Rocha de Paula
Airton Câmara Monteiro
Albertina Batista da Silva
Aldarizé Praciano Rodrigues
Algelma de Moura Peron
Alice Assunção Chaves
Aline Assunção Ribeiro
Aluísio Fernandes Lima
Ana Lúcia Pontes dos Santos
Ana Maria da Silva
Angela Maria Ribeiro Eduardo
Antonia Flaviana Campos da Silva
Antonio Carlos Souza Bernardo
Antônio de Oliveira Lemos (Iran)
Antônio Ferreira de Sousa (Toin)
Antonio Jeckson da Silva
Antônio Moézio Chaves
Atila Cosmo de Oliveira
Auricélia Inácio da Silva
Beatriz do Nascimento Oliveira
Bianca do Nascimento Oliveira
Biatriz de Souza Monteiro
Calebe Tavares de Sousa Lima
Carlos Antonio Martins de Paula
Carlos Eduardo Rocha de Paula
Célia Maria Freitas da Silva
Cícera Helena Tavares de Souza
Claudio Henrique dos Santos Simplício
Cledelvania Ferreira da Silva
Davi Tavares de Freitas
Deusivaldo de Oliveira
Elane Maria Silva Soares
Ellen Jardênia Delfino de Amorim
Eloísa Helena do Nascimento Nogueira
Emanuele Carvalho Silva
Érica de Oliveira Severino
Erivan da Silva Lima
Ester Tavares de Souza
Francisca Adriana Cunha dos Santos
Francisca Bárbara da Silva Moura
Francisca de Fátima Santos Lucas
Francisca Liliane de Lima Soares
Francisca Maria Alexandre Ferreira
Francisca Samia da Silva Mota
Francisco André Pereira dos Santos
Francisco de Assis Ferreira Souza
Graciane Maria dos Santos Paiva
Heloisy Tavares de Sousa
Ingrid Ribeiro Eduardo
Jardel Santiago Gadelha
João de Deus Eduardo
João Leonardo Martins Filho
Jorge Luis Tavares de Amorim
José da Silva (Dedé)
José Hélio Vieira de Moura
Juliana Tavares de Amorim
Julio Cezar Martins
Karlos Rhavelly Rocha de Paula
Laís Oliveira Silva
Lidenir Vaz Bragança
Lucas Tavares Eduardo
Lucineide Gomes da Silva Vieira Araújo
Luis Francisco de Amorim
Luiz Henrique de Lima Silva
Luiz Miguel da Silva
Manoeu Marcio Vieira Gomes
Marcílio Souza dos Santos
Maria Adryelli dos Santos Simplício
Maria Batista da Silva
Maria Brunna de Moura da Silva
Maria da Conceição Silva Assunção Sabino (Ceiça)
Maria de Fátima Assunção (Fatinha)
Maria Eliete de Araújo Bragança
Maria Estela Moreira de Sousa
Maria Katiely da Silva Moura
Maria Rogenia do Nascimento Ribeiro
Maria Verônica Tavares de Amorim (Vera)
Maristela Lemos Monteiro
Naason Lauro da Cunha Soares
Narcisio de Lima Rodrigues
Nataly Vasconcelos Martins
Nireide de Moura Lemos
Patrícia Vieira de Araújo Sousa
Paula Mika Praciano Nishiyama Vieira
Porfírio Miquéias Lima de Sousa
Rafaiele Nascimento Nogueira
Raimunda Marta Tavares
Raimunda Pereira Silva
Raimundo Gaudêncio de Morais Eduardo (Castelo)
Regina Elizabete da Costa Moreira
Regina Lucia Candido
Ricardo Monteiro Mota
Rodrigo Ribeiro Eduardo
Rosiene Eduardo Bernardo
Ruan Perom Moura
Rute Maria Mesquita de Matos Araújo
Sabi Yari Moïse Bandiri
Samily Maria da Silva Moura
Suzana Helena Tavares de Amorim Santiago
Tones Jardson Trindade Marreira
Valdenia dos Santos Assunção
Verônica Maria Tavares Eduardo
Will Robson Assunção Sabino
Yuri da Silva Bezerra`;

export default function BulkImportScreen({ onBack }) {
  const [text, setText]           = useState(MEMBROS_PRECARREGADOS);
  const [status, setStatus]       = useState("idle"); // idle | running | done
  const [log, setLog]             = useState([]);
  const [progress, setProgress]   = useState(0);
  const [total, setTotal]         = useState(0);

  const parsed = text
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 2);

  const run = async () => {
    if (parsed.length === 0) return;
    setStatus("running");
    setLog([]);
    setProgress(0);
    setTotal(parsed.length);

    let ok = 0;
    let fail = 0;
    const newLog = [];

    for (let i = 0; i < parsed.length; i++) {
      const nome = parsed[i];
      try {
        await addDoc(collection(db, "users"), {
          name: nome,
          email: "",
          phone: "",
          role: "membro",
          active: true,
          ministries: [],
          notes: "",
          joinedAt: new Date().toISOString().slice(0, 10),
          createdAt: serverTimestamp(),
        });
        ok++;
        newLog.push({ name: nome, ok: true });
      } catch (e) {
        fail++;
        newLog.push({ name: nome, ok: false, error: e.message });
      }
      setProgress(i + 1);
      setLog([...newLog]);
      // Pequena pausa para não sobrecarregar o Firestore
      await new Promise(r => setTimeout(r, 150));
    }

    setStatus("done");
  };

  const pct = total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <div style={{ padding: "18px 18px 0" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: C.navyMid, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, marginBottom: 14, padding: 0 }}>
        <ChevronLeft size={16} /> Voltar
      </button>

      {/* Aviso */}
      <div style={{ background: `${C.gold}18`, border: `1px solid ${C.gold}66`, borderRadius: 12, padding: 14, marginBottom: 18, display: "flex", gap: 10 }}>
        <AlertCircle size={18} color={C.gold} style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 12.5, color: C.ink, lineHeight: 1.5 }}>
          <strong>Tela temporária.</strong> Após a importação, avise o desenvolvedor para remover esta tela do app.
        </div>
      </div>

      <h1 className="serif" style={{ fontSize: 20, color: C.navy, margin: "0 0 4px", fontWeight: 700 }}>Importação em Lote</h1>
      <p style={{ fontSize: 12.5, color: C.gray, margin: "0 0 16px" }}>
        {parsed.length} membros encontrados na lista
      </p>

      {/* Lista editável */}
      {status === "idle" && (
        <>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: `${C.ink}aa`, marginBottom: 6, display: "block" }}>
            Lista de nomes (um por linha)
          </label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={12}
            style={{ width: "100%", padding: 12, borderRadius: 10, border: `1.5px solid ${C.ivoryDeep}`, fontSize: 13, resize: "vertical", marginBottom: 14, lineHeight: 1.7 }}
          />
          <button onClick={run} style={{
            width: "100%", background: C.navy, color: "#fff", border: "none",
            borderRadius: 12, padding: 15, fontSize: 15, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 24
          }}>
            <Upload size={18} /> Importar {parsed.length} membros
          </button>
        </>
      )}

      {/* Progresso */}
      {(status === "running" || status === "done") && (
        <div style={{ marginBottom: 24 }}>
          {/* Barra de progresso */}
          <div style={{ background: C.ivoryDeep, borderRadius: 8, height: 10, marginBottom: 8, overflow: "hidden" }}>
            <div style={{
              background: status === "done" ? C.green : C.navy,
              height: "100%", borderRadius: 8,
              width: `${pct}%`, transition: "width 0.3s"
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: C.gray, marginBottom: 16 }}>
            <span>{status === "running" ? "Importando..." : "Concluído!"}</span>
            <span>{progress}/{total} ({pct}%)</span>
          </div>

          {status === "done" && (
            <div style={{
              background: `${C.green}15`, border: `1px solid ${C.green}44`,
              borderRadius: 10, padding: 14, marginBottom: 14, textAlign: "center"
            }}>
              <Check size={24} color={C.green} style={{ marginBottom: 6 }} />
              <div style={{ fontWeight: 700, fontSize: 15, color: C.green }}>
                {log.filter(l => l.ok).length} membros importados com sucesso!
              </div>
              {log.filter(l => !l.ok).length > 0 && (
                <div style={{ fontSize: 12.5, color: C.navyMid, marginTop: 4 }}>
                  {log.filter(l => !l.ok).length} erros
                </div>
              )}
            </div>
          )}

          {/* Log de resultados */}
          <div style={{ maxHeight: 300, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
            {log.map((item, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "5px 8px",
                borderRadius: 6, background: item.ok ? `${C.green}08` : `${C.navyMid}08`,
                fontSize: 12.5
              }}>
                {item.ok
                  ? <Check size={13} color={C.green} />
                  : <X size={13} color={C.navyMid} />}
                <span style={{ color: item.ok ? C.ink : C.navyMid }}>{item.name}</span>
              </div>
            ))}
          </div>

          {status === "done" && (
            <button onClick={onBack} style={{
              width: "100%", background: C.green, color: "#fff", border: "none",
              borderRadius: 10, padding: 13, fontSize: 14, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 16
            }}>
              <Check size={16} /> Ver lista de membros
            </button>
          )}
        </div>
      )}
    </div>
  );
}
