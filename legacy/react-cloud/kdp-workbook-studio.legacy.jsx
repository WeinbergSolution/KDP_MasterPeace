import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Sparkles, ListTree, PenLine, LayoutTemplate, Download, Megaphone,
  Plus, Trash2, RefreshCw, Copy, Check, Loader2, BookOpen, ChevronRight,
  ArrowUp, ArrowDown, Save, AlertCircle, Printer, FileText, Lightbulb,
  Palette, Wand2, Square, Upload, ShieldCheck, FolderPlus
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Konstanten                                                         */
/* ------------------------------------------------------------------ */

const TRIMS = {
  "5x8":    { label: '5" × 8" (12,7 × 20,3 cm)',   w: 127,   h: 203.2 },
  "5.5x8.5":{ label: '5,5" × 8,5" (14 × 21,6 cm)', w: 139.7, h: 215.9 },
  "6x9":    { label: '6" × 9" (15,2 × 22,9 cm)',   w: 152.4, h: 228.6 },
  "7x10":   { label: '7" × 10" (17,8 × 25,4 cm) – ideal für Workbooks', w: 177.8, h: 254 },
  "8.5x11": { label: '8,5" × 11" (21,6 × 27,9 cm) – großes Workbook',   w: 215.9, h: 279.4 },
};

const GUTTERS = {
  "24-150":  { label: "24–150 Seiten",  mm: 9.6  },
  "151-300": { label: "151–300 Seiten", mm: 12.7 },
  "301-500": { label: "301–500 Seiten", mm: 15.9 },
};

const FONTS = {
  garamond: { label: "EB Garamond (klassisch)", family: "'EB Garamond', Georgia, serif", gf: "EB+Garamond:ital,wght@0,400;0,600;1,400" },
  lora:     { label: "Lora (modern-warm)",      family: "'Lora', Georgia, serif",        gf: "Lora:ital,wght@0,400;0,600;1,400" },
  crimson:  { label: "Crimson Pro (elegant)",   family: "'Crimson Pro', Georgia, serif", gf: "Crimson+Pro:ital,wght@0,400;0,600;1,400" },
  source:   { label: "Source Serif (sachlich)", family: "'Source Serif 4', Georgia, serif", gf: "Source+Serif+4:ital,wght@0,400;0,600;1,400" },
};

/* KDP-Papierstärken: Zoll pro Seite */
const PAPERS = {
  cream: { label: "Cremefarbenes Papier (Standard für Bücher)", perPage: 0.0025 },
  white: { label: "Weißes Papier",                              perPage: 0.002252 },
};

const STEPS = [
  { id: 0, label: "Idee",         icon: Sparkles },
  { id: 1, label: "Gliederung",   icon: ListTree },
  { id: 2, label: "Schreiben",    icon: PenLine },
  { id: 3, label: "Formatierung", icon: LayoutTemplate },
  { id: 4, label: "Cover",        icon: Palette },
  { id: 5, label: "Export",       icon: Download },
  { id: 6, label: "KDP-Paket",    icon: Megaphone },
];

const EXTRA_DEFS = [
  { key: "einleitung",   label: "Einleitung",                        hint: "Emotionaler Einstieg, der das Problem deiner Leserin spiegelt und dein Versprechen gibt." },
  { key: "arbeitsweise", label: "Wie du mit diesem Buch arbeitest",  hint: "Kurze Anleitung: Rhythmus, Material, Umgang mit schweren Gefühlen." },
  { key: "schlusswort",  label: "Schlusswort",                       hint: "Zusammenfassung, Ermutigung – und die wichtige Bitte um eine Amazon-Rezension." },
  { key: "autorin",      label: "Über die Autorin / den Autor",      hint: "Kurzbio in der dritten Person. Stichworte zu dir kannst du unten eintragen." },
  { key: "bonus",        label: "Bonus-Seite",                       hint: "Verweis auf ein Freebie / deine E-Mail-Liste – mit Platzhalter [DEIN-LINK]." },
];

const emptyProject = {
  niche: "Selbstwert stärken nach toxischen Beziehungen",
  chapterCount: 8,
  ideas: [],
  title: "", subtitle: "", audience: "", promise: "", author: "", bio: "",
  outline: [],
  extras: { einleitung: "", arbeitsweise: "", schlusswort: "", autorin: "", bonus: "" },
  cover: { pageCount: 0, paper: "cream", bg: "#2E2A3B", fg: "#F5F1E6", blurb: "", brief: "" },
  settings: { trim: "7x10", pages: "151-300", font: "garamond", fontSize: 11.5, lineHeight: 1.55, align: "justify", wordTarget: 1200 },
  kdp: null,
};

function mergeProject(p) {
  return {
    ...emptyProject, ...(p || {}),
    extras: { ...emptyProject.extras, ...((p && p.extras) || {}) },
    cover: { ...emptyProject.cover, ...((p && p.cover) || {}) },
    settings: { ...emptyProject.settings, ...((p && p.settings) || {}) },
  };
}

const countWords = (t) => (t || "").split(/\s+/).filter(Boolean).length;

/* ------------------------------------------------------------------ */
/*  Claude-API                                                         */
/* ------------------------------------------------------------------ */

function tryParseJson(text) {
  const clean = String(text).replace(/```json|```/g, "").trim();
  const idxObj = clean.indexOf("{");
  const idxArr = clean.indexOf("[");
  const starts = [idxObj, idxArr].filter((i) => i >= 0);
  if (!starts.length) throw new Error("keine JSON-Antwort erhalten");
  const s = clean.slice(Math.min(...starts));
  try { return JSON.parse(s); } catch (e) { /* Reparatur */ }
  for (let end = s.length; end > 1; end--) {
    const ch = s[end - 1];
    if (ch !== "}" && ch !== "]" && ch !== '"') continue;
    const base = s.slice(0, end).replace(/,\s*$/, "");
    for (const suffix of ["", "]", "}", "]}", "}]", "}]}", "]}]"]) {
      try { return JSON.parse(base + suffix); } catch (e) { /* weiter */ }
    }
  }
  throw new Error("JSON-Antwort unvollständig");
}

async function callModel(prompt) {
  let lastErr = null;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await res.json();
    if (data && data.error) throw new Error(data.error.message || "API-Fehler");
    const text = (data.content || [])
      .filter((c) => c.type === "text")
      .map((c) => c.text)
      .join("\n");
    if (text.trim()) return text;
    throw new Error("Leere Antwort");
  } catch (e) { lastErr = e; }
  try {
    if (typeof window !== "undefined" && window.claude && typeof window.claude.complete === "function") {
      const r = await window.claude.complete(prompt);
      if (typeof r === "string" && r.trim()) return r;
      if (r && typeof r.completion === "string") return r.completion;
      if (r && Array.isArray(r.content)) {
        const t = r.content.filter((c) => c.type === "text").map((c) => c.text).join("\n");
        if (t.trim()) return t;
      }
    }
  } catch (e2) { lastErr = e2; }
  throw lastErr || new Error("Keine Verbindung zur KI möglich");
}

async function askClaude(system, user, expectJson = false) {
  const prompt = `${system}\n\n---\n\n${user}`;
  const text = await callModel(prompt);
  if (!expectJson) return text;
  try { return tryParseJson(text); }
  catch (e) {
    const retry = await callModel(prompt + "\n\nWICHTIG: Antworte AUSSCHLIESSLICH mit gültigem, vollständigem JSON. Kein Text davor, kein Text danach, keine Markdown-Zeichen.");
    return tryParseJson(retry);
  }
}

const SYS_AUTOR = `Du bist erfahrene:r Autor:in und Verleger:in erfolgreicher Psychologie-Workbooks (Schwerpunkt Selbstwert & Beziehungen) für Amazon KDP. Du schreibst auf Deutsch, warm, fundiert, praxisnah und sprichst Leser:innen per "du" an. Du kennst Positive Psychologie, Bindungstheorie, Selbstmitgefühl (Neff), kognitive Umstrukturierung und Journaling-Methodik. Nutze immer nur EIN Leerzeichen zwischen Wörtern.`;

const FORMAT_REGELN = `Nutze AUSSCHLIESSLICH dieses Format (kein anderes Markdown):
## Abschnittsüberschrift
### Kleinere Überschrift
Normale Absätze als Fließtext. **Fett** ist erlaubt.
> Merksatz oder Zitat
- Aufzählungspunkt
- [ ] Checklisten-Punkt zum Abhaken
[linien:4]   ← erzeugt 4 Schreiblinien für die Leser:in (Zahl variabel)
[skala] Frage zur Selbsteinschätzung   ← erzeugt eine 1–10-Skala
:::uebung Titel der Übung
Anleitung der Übung, gern mit [linien:x] und - [ ] Punkten.
:::
:::tipp
Kurzer, konkreter Profi-Tipp.
:::
Wichtig: Beginne DIREKT mit Inhalt – KEINE Kapitelüberschrift mit # (die wird automatisch gesetzt).`;

/* ---- Prompt-Bausteine ---- */

function bookContext(project) {
  return `Buch: "${project.title}" – ${project.subtitle}. Zielgruppe: ${project.audience}. Versprechen: ${project.promise}.`;
}

function outlinePrompt(project) {
  return `${bookContext(project)}
Erstelle eine Gliederung mit genau ${project.chapterCount} Kapiteln für dieses Workbook. Roter Faden: vom Verstehen über das Fühlen zum Handeln. Antworte NUR mit kompaktem JSON, ohne Zeilenumbrüche, ohne Erklärungen:
{"kapitel":[{"titel":"max 8 Wörter","ziel":"max 12 Wörter"}]}`;
}

async function generateChapterText(project, outline, i) {
  const ch = outline[i];
  const prev = outline[i - 1];
  const text = await askClaude(
    `${SYS_AUTOR}\n${FORMAT_REGELN}`,
    `${bookContext(project)}
${prev ? `Vorheriges Kapitel: "${prev.title}".` : "Dies ist das erste Kapitel."}
Schreibe jetzt Kapitel ${i + 1}: "${ch.title}". Ziel: ${ch.goal}
Aufbau: kurzer emotionaler Einstieg → Psychoedukation (fundiert, verständlich) → mindestens 1 :::uebung mit [linien:x] → 1 [skala] ODER Checkliste → :::tipp zum Abschluss. Schreibe so viel wie möglich.`
  );
  return text.trim();
}

async function extendText(project, ch, existing) {
  const tail = (existing || "").slice(-1500);
  const text = await askClaude(
    `${SYS_AUTOR}\n${FORMAT_REGELN}`,
    `Buch: "${project.title}". Kapitel: "${ch.title}" (Ziel: ${ch.goal}).
Hier das bisherige Ende des Kapitels:\n---\n${tail}\n---\nSetze das Kapitel nahtlos fort (kein Neuanfang, keine Wiederholung). Vertiefe mit einer weiteren Übung, Reflexionsfragen mit [linien:x] oder einem Praxisbeispiel. Schließe mit kurzer Zusammenfassung und Überleitung ab.`
  );
  return text.trim();
}

function extraPrompt(project, outline, key) {
  const ctx = bookContext(project);
  const kap = outline.map((c, i) => `${i + 1}. ${c.title}`).join("; ");
  switch (key) {
    case "einleitung":
      return `${ctx}\nKapitel: ${kap}\nSchreibe die EINLEITUNG des Buchs: Hole die Leserin bei ihrem Schmerz ab (ohne Drama), zeige, dass sie hier richtig ist, gib das Versprechen des Buchs und einen kurzen Ausblick auf die Reise. Warm, persönlich, ohne Übungen. 300–450 Wörter.`;
    case "arbeitsweise":
      return `${ctx}\nSchreibe den Abschnitt "Wie du mit diesem Buch arbeitest": empfohlener Rhythmus (z. B. 1 Kapitel pro Woche), benötigtes Material (Stift!), Erlaubnis für eigenes Tempo, Umgang mit schweren Gefühlen (Pausen, ggf. professionelle Hilfe), gern mit einer kleinen - [ ] Checkliste zum Start. 200–300 Wörter.`;
    case "schlusswort":
      return `${ctx}\nKapitel: ${kap}\nSchreibe das SCHLUSSWORT: Würdige den Weg der Leserin, fasse die Kernbotschaft zusammen, gib einen ermutigenden Ausblick. Bitte am Ende freundlich und konkret um eine ehrliche Amazon-Rezension (erkläre kurz, warum das für unabhängige Autor:innen wichtig ist). 250–350 Wörter.`;
    case "autorin":
      return `${ctx}\nAutor:in: ${project.author || "unbekannt"}. Stichworte zur Person: ${project.bio || "keine – schreibe eine glaubwürdige, allgemeine Bio ohne erfundene Titel oder Qualifikationen"}.\nSchreibe "Über die Autorin/den Autor" in der DRITTEN Person: Motivation für dieses Buch, Bezug zum Thema, persönlicher warmer Ton. WICHTIG: Erfinde KEINE akademischen Titel, Ausbildungen oder Zertifikate. 120–180 Wörter.`;
    case "bonus":
      return `${ctx}\nSchreibe eine BONUS-SEITE: Lade die Leserin ein, sich ein kostenloses Zusatz-Material zu holen (z. B. Journal-Vorlagen oder Affirmationskarten passend zum Buchthema) unter dem Platzhalter [DEIN-LINK]. Kurz, einladend, mit 2–3 - Aufzählungspunkten, was sie bekommt. Max. 120 Wörter.`;
    default: return ctx;
  }
}

/* ------------------------------------------------------------------ */
/*  Content-Parser (Workbook-Markup)                                   */
/* ------------------------------------------------------------------ */

function parseBlocks(text) {
  const lines = (text || "").split("\n");
  const blocks = [];
  let box = null;
  const push = (b) => (box ? box.children : blocks).push(b);
  for (let raw of lines) {
    const l = raw.trim();
    if (l.startsWith(":::")) {
      if (box && (l === ":::" || l === "::: ")) { blocks.push(box); box = null; continue; }
      const m = l.match(/^:::(uebung|übung|tipp|beispiel)\s*(.*)$/i);
      if (m) {
        if (box) { blocks.push(box); }
        box = { t: "box", kind: m[1].toLowerCase().replace("ü", "ue"), title: m[2] || "", children: [] };
      } else if (box) { blocks.push(box); box = null; }
      continue;
    }
    if (!l) continue;
    if (l.startsWith("### ")) push({ t: "h3", x: l.slice(4) });
    else if (l.startsWith("## ")) push({ t: "h2", x: l.slice(3) });
    else if (l.startsWith("# ")) push({ t: "h2", x: l.slice(2) });
    else if (/^\[linien:\s*\d+\]/i.test(l)) push({ t: "lines", n: Math.min(15, parseInt(l.match(/\d+/)[0], 10) || 3) });
    else if (/^\[skala\]/i.test(l)) push({ t: "skala", x: l.replace(/^\[skala\]\s*/i, "") });
    else if (l.startsWith("- [ ]") || l.startsWith("- [x]")) push({ t: "check", x: l.slice(5).trim() });
    else if (l.startsWith("> ")) push({ t: "quote", x: l.slice(2) });
    else if (l.startsWith("- ") || l.startsWith("* ")) push({ t: "li", x: l.slice(2) });
    else if (/^\d+\.\s/.test(l)) push({ t: "oli", x: l.replace(/^\d+\.\s/, "") });
    else push({ t: "p", x: l });
  }
  if (box) blocks.push(box);
  return blocks;
}

/* Mehrfach-Leerzeichen entfernen (Typografie-Fix) */
const tidy = (s) => String(s || "").replace(/\u00A0/g, " ").replace(/[ \t]{2,}/g, " ");

/* Inline: **fett** → JSX */
function fmt(text) {
  const parts = tidy(text).split(/\*\*(.+?)\*\*/g);
  return parts.map((p, i) => (i % 2 ? <strong key={i}>{p}</strong> : p));
}

/* Inline: **fett** → HTML (nach Escaping) */
function esc(s) {
  return tidy(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function fmtHtml(text) {
  return esc(text).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

/* ------------------------------------------------------------------ */
/*  Block-Renderer: React-Vorschau                                     */
/* ------------------------------------------------------------------ */

function Blocks({ blocks }) {
  return blocks.map((b, i) => {
    switch (b.t) {
      case "h2": return <h2 className="bk-h2" key={i}>{fmt(b.x)}</h2>;
      case "h3": return <h3 className="bk-h3" key={i}>{fmt(b.x)}</h3>;
      case "p": return <p className="bk-p" key={i}>{fmt(b.x)}</p>;
      case "quote": return <blockquote className="bk-quote" key={i}>{fmt(b.x)}</blockquote>;
      case "li": return <div className="bk-li" key={i}><span className="bk-dot" />{fmt(b.x)}</div>;
      case "oli": return <div className="bk-li" key={i}><span className="bk-num">{i + 1}.</span>{fmt(b.x)}</div>;
      case "check": return <div className="bk-check" key={i}><span className="bk-box" />{fmt(b.x)}</div>;
      case "lines": return (
        <div className="bk-lines" key={i}>
          {Array.from({ length: b.n }).map((_, j) => <div className="bk-line" key={j} />)}
        </div>
      );
      case "skala": return (
        <div className="bk-skala" key={i}>
          <p className="bk-p">{fmt(b.x)}</p>
          <div className="bk-skala-row">
            {Array.from({ length: 10 }).map((_, j) => <span className="bk-skala-n" key={j}>{j + 1}</span>)}
          </div>
        </div>
      );
      case "box": return (
        <div className={`bk-boxwrap ${b.kind === "tipp" ? "is-tipp" : "is-uebung"}`} key={i}>
          <div className="bk-boxlabel">{b.kind === "tipp" ? "Tipp" : b.kind === "beispiel" ? "Beispiel" : "Übung"}{b.title ? `: ${b.title}` : ""}</div>
          <Blocks blocks={b.children} />
        </div>
      );
      default: return null;
    }
  });
}

/* ------------------------------------------------------------------ */
/*  Block-Renderer: HTML für Export                                    */
/* ------------------------------------------------------------------ */

function blocksToHtml(blocks) {
  return blocks.map((b) => {
    switch (b.t) {
      case "h2": return `<h2>${fmtHtml(b.x)}</h2>`;
      case "h3": return `<h3>${fmtHtml(b.x)}</h3>`;
      case "p": return `<p>${fmtHtml(b.x)}</p>`;
      case "quote": return `<blockquote>${fmtHtml(b.x)}</blockquote>`;
      case "li": return `<div class="li"><span class="dot"></span><span>${fmtHtml(b.x)}</span></div>`;
      case "oli": return `<div class="li"><span>${fmtHtml(b.x)}</span></div>`;
      case "check": return `<div class="chk"><span class="box"></span><span>${fmtHtml(b.x)}</span></div>`;
      case "lines": return `<div class="wlines">${'<div class="wline"></div>'.repeat(b.n)}</div>`;
      case "skala": return `<div class="skala"><p>${fmtHtml(b.x)}</p><div class="skrow">${Array.from({ length: 10 }).map((_, j) => `<span>${j + 1}</span>`).join("")}</div></div>`;
      case "box": return `<div class="ebox ${b.kind === "tipp" ? "tipp" : "uebung"}"><div class="elabel">${b.kind === "tipp" ? "Tipp" : b.kind === "beispiel" ? "Beispiel" : "Übung"}${b.title ? ": " + esc(b.title) : ""}</div>${blocksToHtml(b.children)}</div>`;
      default: return "";
    }
  }).join("\n");
}

/* ------------------------------------------------------------------ */
/*  Export: Buch-Interior                                              */
/* ------------------------------------------------------------------ */

function bookCss(project, forPrint) {
  const s = project.settings;
  const trim = TRIMS[s.trim];
  const gutter = GUTTERS[s.pages].mm;
  const font = FONTS[s.font];
  const align = s.align === "left" ? "left" : "justify";
  const pageRules = forPrint ? `
  @page { size: ${trim.w}mm ${trim.h}mm; margin: 16mm ${gutter}mm 17mm ${gutter}mm; }
  @page :right { margin-left: ${gutter}mm; margin-right: 12.7mm; }
  @page :left  { margin-left: 12.7mm; margin-right: ${gutter}mm; }
  .chapter, .front { page-break-before: always; }
  .titlepage { page-break-before: avoid; }
  h2, h3 { page-break-after: avoid; }
  .ebox, .wlines, .skala { page-break-inside: avoid; }
  ` : "";
  return `
  @import url('https://fonts.googleapis.com/css2?family=${font.gf}&family=Fraunces:opsz,wght@9..144,500;9..144,700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: ${font.family}; font-size: ${s.fontSize}pt; line-height: ${s.lineHeight}; color: #1d1a24; }
  ${pageRules}
  h1 { font-family: 'Fraunces', ${font.family}; font-size: ${s.fontSize * 2}pt; font-weight: 700; margin: 0 0 ${s.fontSize * 1.6}pt; line-height: 1.15; }
  h2 { font-family: 'Fraunces', ${font.family}; font-size: ${s.fontSize * 1.35}pt; font-weight: 700; margin: ${s.fontSize * 1.5}pt 0 ${s.fontSize * 0.6}pt; }
  h3 { font-size: ${s.fontSize * 1.1}pt; font-weight: 600; margin: ${s.fontSize * 1.1}pt 0 ${s.fontSize * 0.4}pt; }
  p { margin: 0 0 ${s.fontSize * 0.65}pt; text-align: ${align}; hyphens: auto; -webkit-hyphens: auto; word-spacing: normal; }
  blockquote { margin: ${s.fontSize}pt ${s.fontSize * 1.5}pt; font-style: italic; text-align: center; }
  .li { display: flex; gap: 7pt; margin: 0 0 4pt 8pt; } .dot { width: 4pt; height: 4pt; border-radius: 50%; background: #1d1a24; margin-top: ${s.fontSize * 0.55}pt; flex: none; }
  .chk { display: flex; gap: 8pt; margin: 0 0 7pt 4pt; align-items: flex-start; }
  .box { width: 11pt; height: 11pt; border: 1.2pt solid #1d1a24; border-radius: 2.5pt; margin-top: 2pt; flex: none; }
  .wlines { margin: 8pt 0 12pt; }
  .wline { border-bottom: 0.8pt solid #9a93ad; height: 24pt; }
  .skala { margin: 8pt 0 12pt; }
  .skrow { display: flex; gap: 6pt; margin-top: 6pt; }
  .skrow span { width: 20pt; height: 20pt; border: 1pt solid #1d1a24; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: ${s.fontSize * 0.8}pt; }
  .ebox { border: 1.1pt solid #1d1a24; border-radius: 6pt; padding: 12pt 14pt; margin: 12pt 0 14pt; }
  .ebox.tipp { border-style: dashed; }
  .elabel { font-family: 'Fraunces', serif; font-weight: 700; font-size: ${s.fontSize * 0.85}pt; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 6pt; }
  .ch-num { font-size: ${s.fontSize * 0.85}pt; letter-spacing: 0.25em; text-transform: uppercase; margin-bottom: 10pt; }
  .titlepage { text-align: center; display: flex; flex-direction: column; justify-content: center; min-height: 85vh; }
  .titlepage .tt { font-family: 'Fraunces', serif; font-size: ${s.fontSize * 2.6}pt; font-weight: 700; line-height: 1.15; margin-bottom: 14pt; }
  .titlepage .st { font-size: ${s.fontSize * 1.2}pt; font-style: italic; margin-bottom: 40pt; }
  .titlepage .au { font-size: ${s.fontSize * 1.1}pt; letter-spacing: 0.15em; text-transform: uppercase; }
  .copyright { font-size: ${s.fontSize * 0.8}pt; display: flex; flex-direction: column; justify-content: flex-end; min-height: 80vh; }
  .copyright p { text-align: left; margin-bottom: 6pt; }
  .toc h1 { margin-bottom: ${s.fontSize * 2}pt; }
  .toc .trow { display: flex; justify-content: space-between; border-bottom: 0.6pt dotted #9a93ad; padding: 6pt 0; }
  `;
}

function extraSection(title, content) {
  if (!content || !content.trim()) return "";
  return `<section class="chapter"><h1>${esc(title)}</h1>${blocksToHtml(parseBlocks(content))}</section>`;
}

function buildBookBody(project) {
  const year = new Date().getFullYear();
  const ex = project.extras || {};
  const tocRows = [];
  if (ex.einleitung && ex.einleitung.trim()) tocRows.push("Einleitung");
  if (ex.arbeitsweise && ex.arbeitsweise.trim()) tocRows.push("Wie du mit diesem Buch arbeitest");
  project.outline.forEach((ch, i) => tocRows.push(`Kapitel ${i + 1} — ${ch.title}`));
  if (ex.schlusswort && ex.schlusswort.trim()) tocRows.push("Schlusswort");
  if (ex.autorin && ex.autorin.trim()) tocRows.push("Über die Autorin / den Autor");
  if (ex.bonus && ex.bonus.trim()) tocRows.push("Dein Bonus");

  const chapters = project.outline.map((ch, i) => `
    <section class="chapter">
      <div class="ch-num">Kapitel ${i + 1}</div>
      <h1>${esc(ch.title)}</h1>
      ${blocksToHtml(parseBlocks(ch.content))}
    </section>`).join("");

  return `
  <div class="titlepage">
    <div class="tt">${esc(project.title || "Ohne Titel")}</div>
    <div class="st">${esc(project.subtitle || "")}</div>
    <div class="au">${esc(project.author || "")}</div>
  </div>
  <div class="front copyright">
    <p>© ${year} ${esc(project.author || "")}. Alle Rechte vorbehalten.</p>
    <p>Dieses Werk einschließlich aller Inhalte ist urheberrechtlich geschützt. Nachdruck oder Reproduktion (auch auszugsweise) in irgendeiner Form sowie die Verbreitung ohne schriftliche Genehmigung sind untersagt.</p>
    <p>Wichtiger Hinweis: Dieses Workbook dient der Selbstreflexion und Psychoedukation. Es ersetzt keine Psychotherapie, ärztliche Behandlung oder professionelle Beratung. Bei akuten Krisen wende dich bitte an eine Fachperson oder einen Krisendienst.</p>
    <p>Independently published.</p>
  </div>
  <div class="front toc"><h1>Inhalt</h1>${tocRows.map((r) => `<div class="trow"><span>${esc(r)}</span></div>`).join("")}</div>
  ${extraSection("Einleitung", ex.einleitung)}
  ${extraSection("Wie du mit diesem Buch arbeitest", ex.arbeitsweise)}
  ${chapters}
  ${extraSection("Schlusswort", ex.schlusswort)}
  ${extraSection("Über die Autorin / den Autor", ex.autorin)}
  ${extraSection("Dein Bonus", ex.bonus)}
  `;
}

function buildPrintHtml(project) {
  return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8">
  <title>${esc(project.title)} – Print-Interior</title>
  <style>${bookCss(project, true)}
  .printbar { position: fixed; top: 12px; right: 12px; z-index: 99; font-family: sans-serif; }
  .printbar button { background: #6C57B8; color: #fff; border: 0; border-radius: 8px; padding: 12px 18px; font-size: 15px; cursor: pointer; }
  .printbar p { background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 8px 10px; font-size: 12px; max-width: 260px; margin-top: 8px; }
  @media print { .printbar { display: none; } }
  </style></head><body>
  <div class="printbar"><button onclick="window.print()">Als PDF speichern (Drucken)</button>
  <p>Im Druckdialog: Ziel „Als PDF speichern", Ränder „Standard", Option „Hintergrundgrafiken" aktivieren. Papierformat wird automatisch gesetzt.</p></div>
  ${buildBookBody(project)}
  </body></html>`;
}

function buildEbookHtml(project) {
  return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8">
  <title>${esc(project.title)}</title>
  <style>${bookCss(project, false)}
  body { max-width: 640px; margin: 0 auto; padding: 24px; }
  .chapter { margin-top: 60px; }
  </style></head><body>
  ${buildBookBody(project)}
  </body></html>`;
}

/* ------------------------------------------------------------------ */
/*  Export: Komplett-Cover (Vorderseite + Rücken + Rückseite)          */
/* ------------------------------------------------------------------ */

function spineWidthMm(project, fallbackPages) {
  const pages = project.cover.pageCount || fallbackPages || 120;
  const per = (PAPERS[project.cover.paper] || PAPERS.cream).perPage;
  return { pages, mm: +(pages * per * 25.4).toFixed(2) };
}

function buildCoverHtml(project, fallbackPages, withGuides) {
  const trim = TRIMS[project.settings.trim];
  const { pages, mm: spine } = spineWidthMm(project, fallbackPages);
  const bleed = 3.175;           /* 0,125" Beschnitt */
  const safe = 6.35;             /* 0,25" Sicherheitsabstand */
  const W = +(trim.w * 2 + spine + bleed * 2).toFixed(2);
  const H = +(trim.h + bleed * 2).toFixed(2);
  const bg = project.cover.bg || "#2E2A3B";
  const fg = project.cover.fg || "#F5F1E6";
  const spineText = pages >= 100;
  const blurbHtml = (project.cover.blurb || "Dein Klappentext – generiere ihn im Cover-Schritt.")
    .split("\n").filter((l) => l.trim())
    .map((l) => `<p>${fmtHtml(l.replace(/^[-•]\s*/, "• "))}</p>`).join("");
  const guides = withGuides ? `
    <div class="g v" style="left:${bleed}mm"></div>
    <div class="g v" style="left:${bleed + trim.w}mm"></div>
    <div class="g v" style="left:${bleed + trim.w + spine}mm"></div>
    <div class="g v" style="left:${bleed + trim.w * 2 + spine}mm"></div>
    <div class="g h" style="top:${bleed}mm"></div>
    <div class="g h" style="top:${bleed + trim.h}mm"></div>
    <div class="glabel">Hilfslinien: gestrichelt = Schnittkanten & Buchrücken. Für die finale Datei die Version ohne Hilfslinien drucken.</div>` : "";
  return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>Cover – ${esc(project.title)}</title>
  <style>
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=${FONTS[project.settings.font].gf}&display=swap');
  * { box-sizing: border-box; margin: 0; }
  @page { size: ${W}mm ${H}mm; margin: 0; }
  html, body { width: ${W}mm; height: ${H}mm; }
  body { background: ${bg}; color: ${fg}; font-family: ${FONTS[project.settings.font].family}; position: relative; overflow: hidden; }
  .panel { position: absolute; top: 0; height: ${H}mm; }
  .back  { left: 0; width: ${bleed + trim.w}mm; padding: ${bleed + safe + 6}mm ${safe + 4}mm ${bleed + safe}mm ${bleed + safe + 2}mm; }
  .spine { left: ${bleed + trim.w}mm; width: ${spine}mm; display: flex; align-items: center; justify-content: center; }
  .frontp { left: ${bleed + trim.w + spine}mm; width: ${trim.w + bleed}mm; padding: ${bleed + safe}mm ${bleed + safe + 2}mm ${bleed + safe}mm ${safe + 4}mm; display: flex; flex-direction: column; justify-content: center; text-align: center; }
  .frontp .tt { font-family: 'Fraunces', serif; font-size: 34pt; font-weight: 700; line-height: 1.12; margin-bottom: 10mm; }
  .frontp .st { font-size: 14pt; font-style: italic; margin-bottom: 22mm; opacity: 0.92; }
  .frontp .au { font-size: 13pt; letter-spacing: 0.18em; text-transform: uppercase; }
  .back p { font-size: 10.5pt; line-height: 1.55; margin-bottom: 4mm; max-width: ${trim.w - safe * 2 - 8}mm; }
  .back .bt { font-family: 'Fraunces', serif; font-size: 15pt; font-weight: 700; margin-bottom: 6mm; }
  .spine .sp { writing-mode: vertical-rl; font-family: 'Fraunces', serif; font-size: ${Math.min(13, Math.max(7, spine * 1.7))}pt; letter-spacing: 0.06em; white-space: nowrap; }
  .barcode { position: absolute; right: ${bleed + safe}mm; bottom: ${bleed + safe}mm; width: 50.8mm; height: 30.5mm; background: #ffffff; border-radius: 1.5mm; display: flex; align-items: center; justify-content: center; color: #999; font-family: sans-serif; font-size: 8pt; text-align: center; }
  .g { position: absolute; border: 0; border-left: 0.4mm dashed rgba(255,255,255,0.55); }
  .g.v { top: 0; height: ${H}mm; width: 0; }
  .g.h { left: 0; width: ${W}mm; height: 0; border-left: 0; border-top: 0.4mm dashed rgba(255,255,255,0.55); }
  .glabel { position: absolute; top: 2mm; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.55); color: #fff; font-family: sans-serif; font-size: 7pt; padding: 1mm 3mm; border-radius: 2mm; }
  .printbar { position: fixed; top: 12px; right: 12px; z-index: 99; font-family: sans-serif; }
  .printbar button { background: #6C57B8; color: #fff; border: 0; border-radius: 8px; padding: 12px 18px; font-size: 15px; cursor: pointer; }
  .printbar div { background: #fff; color: #333; border: 1px solid #ddd; border-radius: 8px; padding: 8px 10px; font-size: 12px; max-width: 280px; margin-top: 8px; }
  @media print { .printbar { display: none; } }
  </style></head><body>
  <div class="printbar"><button onclick="window.print()">Als PDF speichern</button>
  <div>Gesamtmaß: ${W} × ${H} mm · Buchrücken: ${spine} mm bei ${pages} Seiten (${project.cover.paper === "white" ? "weißes" : "cremefarbenes"} Papier). „Hintergrundgrafiken" im Druckdialog aktivieren!</div></div>
  <div class="panel back">
    <div class="bt">${esc(project.promise || project.subtitle || "")}</div>
    ${blurbHtml}
    <div class="barcode">Barcode-Bereich<br>frei lassen (fügt KDP ein)</div>
  </div>
  <div class="panel spine">${spineText ? `<div class="sp">${esc(project.title)} · ${esc(project.author)}</div>` : ""}</div>
  <div class="panel frontp">
    <div class="tt">${esc(project.title || "Titel")}</div>
    <div class="st">${esc(project.subtitle || "")}</div>
    <div class="au">${esc(project.author || "")}</div>
  </div>
  ${guides}
  </body></html>`;
}

function download(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/* ------------------------------------------------------------------ */
/*  Haupt-App                                                          */
/* ------------------------------------------------------------------ */

export default function KdpWorkbookStudio() {
  const [project, setProject] = useState(emptyProject);
  const [step, setStep] = useState(0);
  const [activeCh, setActiveCh] = useState(0);
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(true);
  const [copied, setCopied] = useState(null);
  const [auto, setAuto] = useState(null);
  const [tips, setTips] = useState("");
  const [projList, setProjList] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const stopRef = useRef(false);

  /* ---- Laden: Projektindex + aktives Projekt ---- */
  useEffect(() => {
    (async () => {
      let idx = null;
      try { const r = await window.storage.get("kdp-index"); if (r) idx = JSON.parse(r.value); } catch (e) { /* neu */ }
      if (!idx || !idx.list || !idx.list.length) {
        /* Migration von Version 1 */
        let old = null;
        try { const r = await window.storage.get("kdp-workbook-studio"); if (r) old = JSON.parse(r.value); } catch (e) { /* keins */ }
        const id = "p" + Date.now();
        idx = { activeId: id, list: [{ id, title: (old && old.project && old.project.title) || "Mein Buchprojekt" }] };
        try {
          if (old) await window.storage.set("kdp-proj-" + id, JSON.stringify(old));
          await window.storage.set("kdp-index", JSON.stringify(idx));
        } catch (e) { /* offline */ }
      }
      setProjList(idx.list);
      setActiveId(idx.activeId);
      try {
        const r = await window.storage.get("kdp-proj-" + idx.activeId);
        if (r) { const d = JSON.parse(r.value); setProject(mergeProject(d.project)); setStep(d.step || 0); }
      } catch (e) { /* leer starten */ }
      setLoaded(true);
    })();
  }, []);

  /* ---- Autospeichern ---- */
  useEffect(() => {
    if (!loaded || !activeId) return;
    setSaved(false);
    const t = setTimeout(async () => {
      try {
        await window.storage.set("kdp-proj-" + activeId, JSON.stringify({ project, step }));
        const title = project.title || "Ohne Titel";
        let list = projList;
        const cur = projList.find((p) => p.id === activeId);
        if (!cur || cur.title !== title) {
          list = projList.map((p) => (p.id === activeId ? { ...p, title } : p));
          setProjList(list);
        }
        await window.storage.set("kdp-index", JSON.stringify({ activeId, list }));
        setSaved(true);
      } catch (e) { /* nächster Versuch beim nächsten Tippen */ }
    }, 800);
    return () => clearTimeout(t);
  }, [project, step, loaded, activeId]);

  const up = (patch) => setProject((p) => ({ ...p, ...patch }));
  const upSettings = (patch) => setProject((p) => ({ ...p, settings: { ...p.settings, ...patch } }));
  const upCover = (patch) => setProject((p) => ({ ...p, cover: { ...p.cover, ...patch } }));
  const upExtra = (key, val) => setProject((p) => ({ ...p, extras: { ...p.extras, [key]: val } }));
  const upChapter = (i, patch) => setProject((p) => ({
    ...p, outline: p.outline.map((c, j) => (j === i ? { ...c, ...patch } : c)),
  }));

  /* ---- Projektverwaltung ---- */
  const persistNow = async () => {
    try { await window.storage.set("kdp-proj-" + activeId, JSON.stringify({ project, step })); } catch (e) { /* egal */ }
  };
  const switchProject = async (id) => {
    if (!id || id === activeId) return;
    await persistNow();
    let d = null;
    try { const r = await window.storage.get("kdp-proj-" + id); if (r) d = JSON.parse(r.value); } catch (e) { /* leer */ }
    setProject(d ? mergeProject(d.project) : { ...emptyProject });
    setStep(d ? d.step || 0 : 0);
    setActiveCh(0); setError(null); setTips("");
    setActiveId(id);
    try { await window.storage.set("kdp-index", JSON.stringify({ activeId: id, list: projList })); } catch (e) { /* egal */ }
  };
  const newProject = async () => {
    await persistNow();
    const id = "p" + Date.now();
    const list = [...projList, { id, title: "Neues Buchprojekt" }];
    setProjList(list);
    setProject({ ...emptyProject, title: "", ideas: [] });
    setStep(0); setActiveCh(0); setError(null); setTips("");
    setActiveId(id);
    try { await window.storage.set("kdp-index", JSON.stringify({ activeId: id, list })); } catch (e) { /* egal */ }
  };
  const deleteProject = async () => {
    if (!window.confirm("Dieses Buchprojekt endgültig löschen?")) return;
    try { await window.storage.delete("kdp-proj-" + activeId); } catch (e) { /* egal */ }
    const rest = projList.filter((p) => p.id !== activeId);
    if (rest.length) {
      setProjList(rest);
      try { await window.storage.set("kdp-index", JSON.stringify({ activeId: rest[0].id, list: rest })); } catch (e) { /* egal */ }
      let d = null;
      try { const r = await window.storage.get("kdp-proj-" + rest[0].id); if (r) d = JSON.parse(r.value); } catch (e) { /* leer */ }
      setProject(d ? mergeProject(d.project) : { ...emptyProject });
      setStep(d ? d.step || 0 : 0);
      setActiveId(rest[0].id);
    } else {
      const id = "p" + Date.now();
      const list = [{ id, title: "Mein Buchprojekt" }];
      setProjList(list); setActiveId(id);
      setProject({ ...emptyProject }); setStep(0);
      try { await window.storage.set("kdp-index", JSON.stringify({ activeId: id, list })); } catch (e) { /* egal */ }
    }
    setActiveCh(0); setError(null); setTips("");
  };

  /* ---- Statistiken ---- */
  const stats = useMemo(() => {
    const chWords = project.outline.reduce((n, c) => n + countWords(c.content), 0);
    const exWords = Object.values(project.extras || {}).reduce((n, t) => n + countWords(t), 0);
    const words = chWords + exWords;
    const written = project.outline.filter((c) => countWords(c.content) > 150).length;
    const pages = Math.max(0, Math.ceil(words / 235) + Math.round(project.outline.length * 1.5) + (words ? 5 : 0));
    return { words, written, pages };
  }, [project.outline, project.extras]);

  /* ---- Qualitäts-Check (lokal) ---- */
  const audit = useMemo(() => {
    const rows = project.outline.map((ch, i) => {
      const c = ch.content || "";
      return {
        i, title: ch.title,
        words: countWords(c),
        uebung: /:::\s*(uebung|übung)/i.test(c),
        linien: /\[linien:/i.test(c),
        check: /- \[ \]/.test(c) || /\[skala\]/i.test(c),
      };
    });
    const missingExtras = EXTRA_DEFS.filter((d) => !(project.extras[d.key] || "").trim()).map((d) => d.label);
    return { rows, missingExtras };
  }, [project.outline, project.extras]);

  /* ---- KI-Aktionen ---- */
  const run = async (tag, fn) => {
    setLoading(tag); setError(null);
    try { await fn(); }
    catch (e) { setError(`Das hat nicht geklappt (${e.message}). Bitte erneut versuchen.`); }
    setLoading(null);
  };

  const genIdeas = () => run("ideas", async () => {
    const arr = await askClaude(
      SYS_AUTOR,
      `Nische/Fokus: "${project.niche}". Entwickle 4 verkaufsstarke Workbook-Konzepte für Amazon KDP (deutscher Markt). Antworte NUR mit einem JSON-Array, keine Erklärungen:
[{"titel":"prägnanter Titel","untertitel":"Nutzen-Untertitel mit Keywords","zielgruppe":"max 10 Wörter","versprechen":"max 12 Wörter"}] Kompakt, ohne Zeilenumbrüche.`,
      true
    );
    up({ ideas: Array.isArray(arr) ? arr : [] });
  });

  const pickIdea = (idea) => {
    up({ title: idea.titel, subtitle: idea.untertitel, audience: idea.zielgruppe, promise: idea.versprechen });
  };

  const genOutline = () => run("outline", async () => {
    const data = await askClaude(SYS_AUTOR, outlinePrompt(project), true);
    const chapters = (data.kapitel || []).map((k, i) => ({
      id: Date.now() + i, title: k.titel, goal: k.ziel, content: "",
    }));
    up({ outline: chapters });
    setActiveCh(0);
  });

  const writeChapter = (i) => run(`write-${i}`, async () => {
    const text = await generateChapterText(project, project.outline, i);
    upChapter(i, { content: text });
  });

  const extendChapter = (i) => run(`extend-${i}`, async () => {
    const ch = project.outline[i];
    const text = await extendText(project, ch, ch.content);
    upChapter(i, { content: (ch.content + "\n\n" + text).trim() });
  });

  const genExtra = (key) => run(`extra-${key}`, async () => {
    const text = await askClaude(`${SYS_AUTOR}\n${FORMAT_REGELN}`, extraPrompt(project, project.outline, key));
    upExtra(key, text.trim());
  });

  const genKdp = () => run("kdp", async () => {
    const data = await askClaude(
      SYS_AUTOR,
      `${bookContext(project)} Kapitel: ${project.outline.map((c) => c.title).join("; ")}.
Erstelle das KDP-Marketing-Paket (deutscher Markt). Antworte NUR mit JSON:
{"beschreibung":"Verkaufsstarke Buchbeschreibung, 150-200 Wörter, mit Absätzen (\\n\\n), Hook am Anfang, Aufzählung der Vorteile, CTA am Ende","keywords":["7 Backend-Keywords/Phrasen, keine Titel-Wiederholung"],"kategorien":["3 passende KDP-Kategorien"]}`,
      true
    );
    up({ kdp: data });
  });

  const genBlurb = () => run("blurb", async () => {
    const text = await askClaude(
      SYS_AUTOR,
      `${bookContext(project)}
Schreibe den KLAPPENTEXT für die Buchrückseite (Print): 120–170 Wörter. Aufbau: 1 starker Hook-Satz, 2–3 kurze Absätze, die den Schmerz spiegeln und die Lösung zeigen, dann 3 Zeilen, die mit "- " beginnen (was die Leserin bekommt), zum Schluss 1 ermutigender CTA-Satz. Nur der Klappentext, kein Kommentar.`
    );
    upCover({ blurb: text.trim() });
  });

  const genBrief = () => run("brief", async () => {
    const text = await askClaude(
      SYS_AUTOR,
      `${bookContext(project)}
Erstelle ein kompaktes COVER-DESIGN-BRIEFING für Canva (deutscher Markt, Psychologie-/Selbsthilfe-Regal): Stilrichtung, 2 konkrete Farbpaletten mit Hex-Codes, Typografie-Empfehlung (Titel/Untertitel), Bildwelt/Motive (was funktioniert im Thumbnail bei Amazon!), 3 Dinge, die man vermeiden sollte. Kurz und umsetzbar, als einfache Liste mit "- " Punkten.`
    );
    upCover({ brief: text.trim() });
  });

  const genTips = () => run("tips", async () => {
    const summary = audit.rows.map((r) => `Kap.${r.i + 1} "${r.title}": ${r.words} Wörter, Übung:${r.uebung ? "ja" : "NEIN"}, Linien:${r.linien ? "ja" : "NEIN"}`).join("\n");
    const text = await askClaude(
      SYS_AUTOR,
      `${bookContext(project)}
Analyse des Manuskripts:\n${summary}\nFehlende Rahmenteile: ${audit.missingExtras.join(", ") || "keine"}.
Gib 4–6 konkrete, priorisierte Verbesserungsvorschläge für dieses Workbook (Struktur, Dramaturgie, Übungsvielfalt, Verkaufswirkung). Kurze "- " Punkte, direkt umsetzbar.`
    );
    setTips(text.trim());
  });

  /* ---- Autopilot ---- */
  const runAutopilot = async () => {
    stopRef.current = false;
    setError(null); setLoading("auto");
    try {
      let outline = [...project.outline];
      if (!outline.length) {
        setAuto({ msg: "Erstelle Gliederung …", pct: 2 });
        const data = await askClaude(SYS_AUTOR, outlinePrompt(project), true);
        outline = (data.kapitel || []).map((k, idx) => ({ id: Date.now() + idx, title: k.titel, goal: k.ziel, content: "" }));
        setProject((p) => ({ ...p, outline: [...outline] }));
      }
      const target = project.settings.wordTarget || 1200;
      const totalSteps = outline.length + EXTRA_DEFS.length;
      for (let i = 0; i < outline.length; i++) {
        if (stopRef.current) break;
        if (countWords(outline[i].content) >= Math.min(400, target * 0.5)) continue;
        setAuto({ msg: `Schreibt Kapitel ${i + 1}/${outline.length}: „${outline[i].title}"`, pct: Math.round(((i + 0.3) / totalSteps) * 100) });
        let text = await generateChapterText(project, outline, i);
        let guard = 0;
        while (countWords(text) < target && guard < 4 && !stopRef.current) {
          guard++;
          setAuto({ msg: `Vertieft Kapitel ${i + 1}/${outline.length} (${countWords(text)} Wörter) …`, pct: Math.round(((i + 0.3 + guard * 0.15) / totalSteps) * 100) });
          const more = await extendText(project, outline[i], text);
          text = (text + "\n\n" + more).trim();
        }
        outline = outline.map((c, j) => (j === i ? { ...c, content: text } : c));
        const snapshot = [...outline];
        setProject((p) => ({ ...p, outline: snapshot }));
      }
      /* Buchgerüst */
      let extras = { ...project.extras };
      for (let k = 0; k < EXTRA_DEFS.length; k++) {
        if (stopRef.current) break;
        const def = EXTRA_DEFS[k];
        if ((extras[def.key] || "").trim().length > 80) continue;
        setAuto({ msg: `Erstellt: ${def.label} …`, pct: Math.round(((outline.length + k + 0.5) / totalSteps) * 100) });
        const text = await askClaude(`${SYS_AUTOR}\n${FORMAT_REGELN}`, extraPrompt(project, outline, def.key));
        extras = { ...extras, [def.key]: text.trim() };
        const snap = { ...extras };
        setProject((p) => ({ ...p, extras: snap }));
      }
      setAuto(null);
      if (!stopRef.current) setError(null);
    } catch (e) {
      setAuto(null);
      setError(`Autopilot unterbrochen (${e.message}). Dein Fortschritt ist gespeichert – einfach erneut starten, es geht dort weiter, wo er aufgehört hat.`);
    }
    setLoading(null);
  };
  const stopAutopilot = () => { stopRef.current = true; setAuto((a) => (a ? { ...a, msg: "Stoppt nach dem aktuellen Schritt …" } : a)); };

  /* ---- Sicherung ---- */
  const exportBackup = () => {
    download(`${(project.title || "buchprojekt").replace(/\s+/g, "-")}-backup.json`, JSON.stringify({ project, step }, null, 2), "application/json");
  };
  const importBackup = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const d = JSON.parse(String(reader.result));
        setProject(mergeProject(d.project || d));
        setError(null);
      } catch (err) { setError("Die Datei konnte nicht gelesen werden – ist es ein Backup aus diesem Tool?"); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const copy = async (tag, text) => {
    try { await navigator.clipboard.writeText(text); setCopied(tag); setTimeout(() => setCopied(null), 1800); } catch (e) { /* Browser blockiert */ }
  };

  /* ---- Gliederungs-Handling ---- */
  const addChapter = () => up({ outline: [...project.outline, { id: Date.now(), title: "Neues Kapitel", goal: "", content: "" }] });
  const removeChapter = (i) => up({ outline: project.outline.filter((_, j) => j !== i) });
  const moveChapter = (i, dir) => {
    const o = [...project.outline]; const j = i + dir;
    if (j < 0 || j >= o.length) return;
    [o[i], o[j]] = [o[j], o[i]];
    up({ outline: o });
  };

  const openWindowWith = (html) => {
    const w = window.open("", "_blank");
    if (!w) { setError("Popup blockiert – bitte Popups für diese Seite erlauben."); return; }
    w.document.write(html);
    w.document.close();
  };

  const trim = TRIMS[project.settings.trim];
  const font = FONTS[project.settings.font];
  const hasConcept = !!project.title;
  const hasOutline = project.outline.length > 0;
  const spine = spineWidthMm(project, stats.pages);
  const coverW = +(trim.w * 2 + spine.mm + 6.35).toFixed(1);
  const coverH = +(trim.h + 6.35).toFixed(1);
  const previewStyle = {
    fontFamily: font.family,
    fontSize: `${project.settings.fontSize * 1.05}px`,
    lineHeight: project.settings.lineHeight,
    aspectRatio: `${trim.w}/${trim.h}`,
    "--al": project.settings.align === "left" ? "left" : "justify",
  };

  /* ================================================================ */
  return (
    <div className="app">
      <style>{CSS}</style>

      {/* -------- Seitenleiste -------- */}
      <aside className="rail">
        <div className="brand">
          <BookOpen size={20} />
          <div>
            <div className="brand-t">Workbook Studio</div>
            <div className="brand-s">für Amazon KDP · v2</div>
          </div>
        </div>

        <div className="projbox">
          <label className="proj-lbl">Buchprojekt</label>
          <select className="proj-sel" value={activeId || ""} onChange={(e) => switchProject(e.target.value)}>
            {projList.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
          <div className="proj-actions">
            <button className="proj-btn" onClick={newProject} title="Neues Projekt"><FolderPlus size={13} /> Neu</button>
            <button className="proj-btn danger" onClick={deleteProject} title="Projekt löschen"><Trash2 size={13} /> Löschen</button>
          </div>
        </div>

        <nav>
          {STEPS.map((s) => {
            const Icon = s.icon;
            const done =
              (s.id === 0 && hasConcept) ||
              (s.id === 1 && hasOutline) ||
              (s.id === 2 && hasOutline && stats.written === project.outline.length) ||
              (s.id === 4 && !!project.cover.blurb) ||
              (s.id === 6 && !!project.kdp);
            return (
              <button key={s.id} className={`rail-step ${step === s.id ? "on" : ""}`} onClick={() => setStep(s.id)}>
                <span className="rail-idx">{done ? <Check size={13} /> : s.id + 1}</span>
                <Icon size={15} />
                <span>{s.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="rail-foot">
          <div className="rail-stats">
            <div><b>{stats.words.toLocaleString("de-DE")}</b> Wörter</div>
            <div><b>{stats.written}/{project.outline.length || "–"}</b> Kapitel geschrieben</div>
            <div><b>≈ {stats.pages}</b> Buchseiten</div>
          </div>
          <div className="rail-save">
            {saved ? <><Check size={12} /> Gespeichert</> : <><Save size={12} /> Speichert …</>}
          </div>
        </div>
      </aside>

      {/* -------- Hauptbereich -------- */}
      <main className="main">
        {error && <div className="err"><AlertCircle size={15} /> {error}</div>}
        {auto && (
          <div className="autobar">
            <Loader2 size={15} className="spin" />
            <div className="grow">
              <div className="auto-msg">{auto.msg}</div>
              <div className="auto-track"><div className="auto-fill" style={{ width: `${Math.min(100, auto.pct || 2)}%` }} /></div>
            </div>
            <button className="btn tiny" onClick={stopAutopilot}><Square size={12} /> Stopp</button>
          </div>
        )}

        {/* ============ SCHRITT 1: IDEE ============ */}
        {step === 0 && (
          <div className="panel">
            <h1 className="pt">Deine Buchidee</h1>
            <p className="ps">Beschreibe deine Nische – ich entwickle daraus verkaufsstarke Workbook-Konzepte für den deutschen KDP-Markt.</p>

            <div className="card">
              <label className="lbl">Nische / Thema</label>
              <div className="row">
                <input className="inp grow" value={project.niche} onChange={(e) => up({ niche: e.target.value })}
                  placeholder="z. B. Selbstwert nach Trennung, Bindungsangst überwinden …" />
                <button className="btn primary" onClick={genIdeas} disabled={loading === "ideas" || !project.niche.trim()}>
                  {loading === "ideas" ? <Loader2 size={15} className="spin" /> : <Sparkles size={15} />} Konzepte entwickeln
                </button>
              </div>
            </div>

            {project.ideas.length > 0 && (
              <div className="ideas">
                {project.ideas.map((idea, i) => (
                  <button key={i} className={`idea ${project.title === idea.titel ? "picked" : ""}`} onClick={() => pickIdea(idea)}>
                    <div className="idea-t">{idea.titel}</div>
                    <div className="idea-s">{idea.untertitel}</div>
                    <div className="idea-m"><b>Zielgruppe:</b> {idea.zielgruppe}</div>
                    <div className="idea-m"><b>Versprechen:</b> {idea.versprechen}</div>
                    {project.title === idea.titel && <div className="idea-check"><Check size={13} /> Ausgewählt</div>}
                  </button>
                ))}
              </div>
            )}

            <div className="card">
              <div className="card-h">Buchdaten <span className="muted">(auswählen oder selbst eintragen – alles editierbar)</span></div>
              <label className="lbl">Titel</label>
              <input className="inp" value={project.title} onChange={(e) => up({ title: e.target.value })} placeholder="Titel deines Workbooks" />
              <label className="lbl">Untertitel</label>
              <input className="inp" value={project.subtitle} onChange={(e) => up({ subtitle: e.target.value })} placeholder="Nutzen-Untertitel mit Keywords" />
              <div className="row">
                <div className="grow">
                  <label className="lbl">Zielgruppe</label>
                  <input className="inp" value={project.audience} onChange={(e) => up({ audience: e.target.value })} placeholder="Für wen ist das Buch?" />
                </div>
                <div className="grow">
                  <label className="lbl">Autor:in / Pseudonym</label>
                  <input className="inp" value={project.author} onChange={(e) => up({ author: e.target.value })} placeholder="Name auf dem Cover" />
                </div>
              </div>
              <label className="lbl">Transformations-Versprechen</label>
              <input className="inp" value={project.promise} onChange={(e) => up({ promise: e.target.value })} placeholder="Was verändert sich für die Leser:in?" />
            </div>

            <div className="next"><button className="btn primary" disabled={!hasConcept} onClick={() => setStep(1)}>Weiter zur Gliederung <ChevronRight size={15} /></button></div>
          </div>
        )}

        {/* ============ SCHRITT 2: GLIEDERUNG ============ */}
        {step === 1 && (
          <div className="panel">
            <h1 className="pt">Gliederung</h1>
            <p className="ps">Der rote Faden deines Workbooks: vom Verstehen über das Fühlen zum Handeln. Du kannst jedes Kapitel bearbeiten, verschieben oder ergänzen.</p>

            {!hasConcept && (
              <div className="card hint">
                <Lightbulb size={15} />
                <div>Trage zuerst in <b>Schritt 1 (Idee)</b> mindestens einen <b>Titel</b> ein – dann kannst du hier die Gliederung generieren lassen. Kapitel manuell anlegen geht jederzeit über den Button unten.</div>
              </div>
            )}

            <div className="card">
              <div className="row">
                <div>
                  <label className="lbl">Anzahl Kapitel</label>
                  <input type="number" inputMode="numeric" min={1} max={15} className="inp num" value={project.chapterCount}
                    onChange={(e) => up({ chapterCount: Math.max(1, Math.min(15, parseInt(e.target.value) || 8)) })} />
                </div>
                <div className="grow" style={{ alignSelf: "flex-end" }}>
                  <button className="btn primary" onClick={genOutline} disabled={loading === "outline" || !hasConcept || !!auto}>
                    {loading === "outline" ? <Loader2 size={15} className="spin" /> : hasOutline ? <RefreshCw size={15} /> : <Sparkles size={15} />}
                    {hasOutline ? "Neu generieren" : "Gliederung generieren"}
                  </button>
                </div>
              </div>
              {hasOutline && <p className="warn-inline">Achtung: „Neu generieren" ersetzt die Kapitelliste. Bereits geschriebene Texte gehen dabei verloren.</p>}
            </div>

            {project.outline.map((ch, i) => (
              <div className="chrow" key={ch.id}>
                <div className="chrow-idx">{i + 1}</div>
                <div className="grow">
                  <input className="inp" value={ch.title} onChange={(e) => upChapter(i, { title: e.target.value })} />
                  <input className="inp small" value={ch.goal} placeholder="Ziel des Kapitels"
                    onChange={(e) => upChapter(i, { goal: e.target.value })} />
                </div>
                <div className="chrow-actions">
                  <button className="ico" onClick={() => moveChapter(i, -1)} title="Nach oben"><ArrowUp size={14} /></button>
                  <button className="ico" onClick={() => moveChapter(i, 1)} title="Nach unten"><ArrowDown size={14} /></button>
                  <button className="ico danger" onClick={() => removeChapter(i)} title="Löschen"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}

            <button className="btn ghost" onClick={addChapter}><Plus size={15} /> Kapitel manuell hinzufügen</button>

            <div className="next"><button className="btn primary" disabled={!hasOutline} onClick={() => { setStep(2); setActiveCh(0); }}>Weiter zum Schreiben <ChevronRight size={15} /></button></div>
          </div>
        )}

        {/* ============ SCHRITT 3: SCHREIBEN ============ */}
        {step === 2 && (
          <div className="panel wide">
            <h1 className="pt">Kapitel schreiben</h1>
            <p className="ps">Autopilot schreibt das ganze Buch durch – oder du gehst Kapitel für Kapitel vor. Rechts siehst du die Buchvorschau live.</p>

            <div className="card autopilot">
              <div className="exp-ico gold"><Wand2 size={20} /></div>
              <div className="grow">
                <div className="card-h">Autopilot – das ganze Buch schreiben lassen</div>
                <p className="muted" style={{ marginBottom: 10 }}>Erstellt die Gliederung (falls noch keine da ist), schreibt alle Kapitel bis zur Ziellänge und erzeugt danach Einleitung, Schlusswort & Co. Bereits geschriebene Kapitel werden übersprungen – du kannst also jederzeit stoppen und später weitermachen.</p>
                <div className="row">
                  <div>
                    <label className="lbl">Ziellänge pro Kapitel</label>
                    <select className="inp" value={project.settings.wordTarget} onChange={(e) => upSettings({ wordTarget: parseInt(e.target.value) })}>
                      <option value={700}>Kompakt (~700 Wörter)</option>
                      <option value={1200}>Standard (~1.200 Wörter)</option>
                      <option value={1800}>Ausführlich (~1.800 Wörter)</option>
                      <option value={2400}>Sehr ausführlich (~2.400 Wörter)</option>
                    </select>
                  </div>
                  <div style={{ alignSelf: "flex-end" }}>
                    {!auto ? (
                      <button className="btn primary" onClick={runAutopilot} disabled={!hasConcept || !!loading}>
                        <Wand2 size={15} /> Autopilot starten
                      </button>
                    ) : (
                      <button className="btn" onClick={stopAutopilot}><Square size={15} /> Stoppen</button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {!hasOutline ? (
              <div className="card">Noch keine Gliederung: Starte den Autopiloten oben (erstellt sie automatisch) oder lege sie in Schritt 2 an.</div>
            ) : (
              <>
                <div className="chtabs">
                  {project.outline.map((ch, i) => (
                    <button key={ch.id} className={`chtab ${activeCh === i ? "on" : ""} ${ch.content ? "done" : ""}`} onClick={() => setActiveCh(i)}>
                      {ch.content ? <Check size={11} /> : null} {i + 1}
                    </button>
                  ))}
                </div>

                {project.outline[activeCh] && (
                  <div className="writegrid">
                    <div className="card">
                      <div className="card-h">Kapitel {activeCh + 1}: {project.outline[activeCh].title}</div>
                      <div className="row" style={{ marginBottom: 10 }}>
                        <button className="btn primary" onClick={() => writeChapter(activeCh)} disabled={!!loading || !!auto}>
                          {loading === `write-${activeCh}` ? <Loader2 size={15} className="spin" /> : <PenLine size={15} />}
                          {project.outline[activeCh].content ? "Neu schreiben" : "Kapitel schreiben lassen"}
                        </button>
                        <button className="btn" onClick={() => extendChapter(activeCh)} disabled={!!loading || !!auto || !project.outline[activeCh].content}>
                          {loading === `extend-${activeCh}` ? <Loader2 size={15} className="spin" /> : <Plus size={15} />} Verlängern
                        </button>
                      </div>
                      <textarea className="ta" value={project.outline[activeCh].content}
                        onChange={(e) => upChapter(activeCh, { content: e.target.value })}
                        placeholder={"Hier entsteht dein Kapitel. Du kannst auch selbst schreiben – Format:\n## Überschrift\n:::uebung Titel\n[linien:4]\n:::\n- [ ] Checkpunkt\n[skala] Frage"} />
                      <div className="muted small-t">{countWords(project.outline[activeCh].content)} Wörter</div>
                    </div>
                    <div className="prevwrap">
                      <div className="prevlabel">Vorschau · {trim.label.split("(")[0]}</div>
                      <div className="page" lang="de" style={previewStyle}>
                        <div className="page-inner">
                          <div className="bk-chnum">Kapitel {activeCh + 1}</div>
                          <div className="bk-h1">{project.outline[activeCh].title}</div>
                          <Blocks blocks={parseBlocks(project.outline[activeCh].content)} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ---- Buchgerüst ---- */}
                <h2 className="sect">Buchgerüst – Einleitung, Schlusswort & Co.</h2>
                <p className="ps">Diese Rahmenteile machen dein Buch komplett und professionell. Sie landen automatisch an der richtigen Stelle im Export. Der Autopilot füllt sie mit – oder du generierst sie einzeln.</p>
                {EXTRA_DEFS.map((def) => (
                  <div className="card" key={def.key}>
                    <div className="card-h row-sb">{def.label}
                      <button className="btn tiny" onClick={() => genExtra(def.key)} disabled={!!loading || !!auto}>
                        {loading === `extra-${def.key}` ? <Loader2 size={13} className="spin" /> : (project.extras[def.key] ? <RefreshCw size={13} /> : <Sparkles size={13} />)}
                        {project.extras[def.key] ? "Neu generieren" : "Generieren"}
                      </button>
                    </div>
                    <p className="muted" style={{ marginBottom: 8 }}>{def.hint}</p>
                    {def.key === "autorin" && (
                      <>
                        <label className="lbl">Stichworte zu dir (optional, fließen in die Bio ein)</label>
                        <input className="inp" value={project.bio} onChange={(e) => up({ bio: e.target.value })}
                          placeholder="z. B. selbst toxische Beziehung erlebt, Coach, Mutter, schreibt seit 2020 …" style={{ marginBottom: 8 }} />
                      </>
                    )}
                    <textarea className="ta short" value={project.extras[def.key]}
                      onChange={(e) => upExtra(def.key, e.target.value)}
                      placeholder="Noch leer – generieren lassen oder selbst schreiben." />
                  </div>
                ))}
              </>
            )}

            <div className="next"><button className="btn primary" onClick={() => setStep(3)}>Weiter zur Formatierung <ChevronRight size={15} /></button></div>
          </div>
        )}

        {/* ============ SCHRITT 4: FORMATIERUNG ============ */}
        {step === 3 && (
          <div className="panel wide">
            <h1 className="pt">Formatierung</h1>
            <p className="ps">Alle Einstellungen entsprechen den KDP-Vorgaben für den Buchsatz ohne Beschnitt (Bleed). Die Innenränder (Bundsteg) richten sich nach der Seitenzahl.</p>

            <div className="writegrid">
              <div>
                <div className="card">
                  <label className="lbl">Trim-Größe (Buchformat)</label>
                  <select className="inp" value={project.settings.trim} onChange={(e) => upSettings({ trim: e.target.value })}>
                    {Object.entries(TRIMS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <label className="lbl">Seitenumfang (bestimmt den Bundsteg)</label>
                  <select className="inp" value={project.settings.pages} onChange={(e) => upSettings({ pages: e.target.value })}>
                    {Object.entries(GUTTERS).map(([k, v]) => <option key={k} value={k}>{v.label} → Innenrand {v.mm} mm</option>)}
                  </select>
                  <p className="muted small-t">Aktuelle Schätzung deines Buchs: ≈ {stats.pages} Seiten.</p>
                  <label className="lbl">Schriftart (Buchtext)</label>
                  <select className="inp" value={project.settings.font} onChange={(e) => upSettings({ font: e.target.value })}>
                    {Object.entries(FONTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <label className="lbl">Textausrichtung</label>
                  <select className="inp" value={project.settings.align} onChange={(e) => upSettings({ align: e.target.value })}>
                    <option value="justify">Blocksatz mit Silbentrennung (Buch-Standard)</option>
                    <option value="left">Linksbündig / Flattersatz (keine Wortlücken)</option>
                  </select>
                  <div className="row">
                    <div className="grow">
                      <label className="lbl">Schriftgröße: {project.settings.fontSize} pt</label>
                      <input type="range" min={10} max={14} step={0.5} value={project.settings.fontSize}
                        onChange={(e) => upSettings({ fontSize: parseFloat(e.target.value) })} className="range" />
                    </div>
                    <div className="grow">
                      <label className="lbl">Zeilenabstand: {project.settings.lineHeight}</label>
                      <input type="range" min={1.3} max={1.9} step={0.05} value={project.settings.lineHeight}
                        onChange={(e) => upSettings({ lineHeight: parseFloat(e.target.value) })} className="range" />
                    </div>
                  </div>
                </div>
                <div className="card hint">
                  <Lightbulb size={15} />
                  <div>Große Wortabstände entstehen im Blocksatz, wenn die Silbentrennung fehlt – sie ist hier aktiviert (deutsche Trennung, im Print-Export automatisch). Wenn du gar keine Lücken willst, wähle <b>Linksbündig</b>.</div>
                </div>
              </div>

              <div className="prevwrap">
                <div className="prevlabel">Live-Vorschau · {trim.label.split("(")[0]}</div>
                <div className="page" lang="de" style={previewStyle}>
                  <div className="page-inner">
                    <div className="bk-chnum">Kapitel 1</div>
                    <div className="bk-h1">{project.outline[0]?.title || "Dein erstes Kapitel"}</div>
                    <Blocks blocks={parseBlocks(project.outline[0]?.content || SAMPLE)} />
                  </div>
                </div>
              </div>
            </div>

            <div className="next"><button className="btn primary" onClick={() => setStep(4)}>Weiter zum Cover <ChevronRight size={15} /></button></div>
          </div>
        )}

        {/* ============ SCHRITT 5: COVER ============ */}
        {step === 4 && (
          <div className="panel">
            <h1 className="pt">Cover</h1>
            <p className="ps">Berechnet die exakten KDP-Cover-Maße inkl. Buchrücken und erstellt dir eine druckfertige Komplett-Vorlage (hinten + Rücken + vorne) – plus Klappentext und Design-Briefing für Canva.</p>

            <div className="card">
              <div className="card-h">Maße berechnen</div>
              <div className="row">
                <div>
                  <label className="lbl">Finale Seitenzahl</label>
                  <input type="number" inputMode="numeric" min={24} max={800} className="inp num" value={project.cover.pageCount || ""}
                    placeholder={String(stats.pages)}
                    onChange={(e) => upCover({ pageCount: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="grow">
                  <label className="lbl">Papier</label>
                  <select className="inp" value={project.cover.paper} onChange={(e) => upCover({ paper: e.target.value })}>
                    {Object.entries(PAPERS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <p className="muted small-t">Ohne Eingabe wird die Schätzung (≈ {stats.pages} Seiten) verwendet. <b>Wichtig:</b> Trage vor dem finalen Cover-Export die echte Seitenzahl aus deinem fertigen Print-PDF ein!</p>
              <div className="dims">
                <div><span>Buchrücken</span><b>{spine.mm} mm</b></div>
                <div><span>Cover gesamt (mit Beschnitt)</span><b>{coverW} × {coverH} mm</b></div>
                <div><span>Rückentext möglich</span><b>{spine.pages >= 100 ? "Ja" : "Nein (erst ab ~100 Seiten)"}</b></div>
              </div>
              <div className="row" style={{ marginTop: 10 }}>
                <div>
                  <label className="lbl">Hintergrundfarbe</label>
                  <input type="color" className="colorinp" value={project.cover.bg} onChange={(e) => upCover({ bg: e.target.value })} />
                </div>
                <div>
                  <label className="lbl">Textfarbe</label>
                  <input type="color" className="colorinp" value={project.cover.fg} onChange={(e) => upCover({ fg: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-h row-sb">Klappentext (Buchrückseite)
                <button className="btn tiny" onClick={genBlurb} disabled={!!loading || !hasConcept}>
                  {loading === "blurb" ? <Loader2 size={13} className="spin" /> : <Sparkles size={13} />} {project.cover.blurb ? "Neu generieren" : "Generieren"}
                </button>
              </div>
              <textarea className="ta short" value={project.cover.blurb} onChange={(e) => upCover({ blurb: e.target.value })}
                placeholder="Der Text für die Buchrückseite – wird automatisch in die Cover-Vorlage gesetzt." />
            </div>

            <div className="card">
              <div className="card-h row-sb">Design-Briefing für Canva
                <div className="row" style={{ gap: 6 }}>
                  {project.cover.brief && <button className="btn tiny" onClick={() => copy("brief", project.cover.brief)}>{copied === "brief" ? <Check size={13} /> : <Copy size={13} />} Kopieren</button>}
                  <button className="btn tiny" onClick={genBrief} disabled={!!loading || !hasConcept}>
                    {loading === "brief" ? <Loader2 size={13} className="spin" /> : <Sparkles size={13} />} {project.cover.brief ? "Neu generieren" : "Generieren"}
                  </button>
                </div>
              </div>
              {project.cover.brief ? <div className="desc">{project.cover.brief.split("\n").map((p, i) => p.trim() && <p key={i}>{p}</p>)}</div>
                : <p className="muted">Stilrichtung, Farbpaletten, Typografie und Bildwelt – als Anleitung für dein Cover-Design in Canva.</p>}
            </div>

            <div className="card exp">
              <div className="exp-ico"><Palette size={20} /></div>
              <div className="grow">
                <div className="card-h">Druckfertige Cover-Vorlage</div>
                <p className="muted">Komplett-Cover in exakten KDP-Maßen: Rückseite mit Klappentext und ausgespartem Barcode-Bereich, Buchrücken, Vorderseite. Als PDF speichern und direkt bei KDP hochladen – oder als maßgenaue Vorlage in Canva nachbauen.</p>
                <div className="row">
                  <button className="btn primary" onClick={() => openWindowWith(buildCoverHtml(project, stats.pages, false))} disabled={!hasConcept}><Printer size={15} /> Cover öffnen (final)</button>
                  <button className="btn" onClick={() => openWindowWith(buildCoverHtml(project, stats.pages, true))} disabled={!hasConcept}>Mit Hilfslinien</button>
                </div>
              </div>
            </div>

            <div className="next"><button className="btn primary" onClick={() => setStep(5)}>Weiter zum Export <ChevronRight size={15} /></button></div>
          </div>
        )}

        {/* ============ SCHRITT 6: EXPORT ============ */}
        {step === 5 && (
          <div className="panel">
            <h1 className="pt">Export für KDP</h1>
            <p className="ps">Qualität prüfen, sichern, exportieren – dann bist du bereit für den Upload.</p>

            <div className="card">
              <div className="card-h row-sb"><span><ShieldCheck size={15} style={{ verticalAlign: "-2px" }} /> Qualitäts-Check</span>
                <button className="btn tiny" onClick={genTips} disabled={!!loading || !hasOutline}>
                  {loading === "tips" ? <Loader2 size={13} className="spin" /> : <Sparkles size={13} />} KI-Verbesserungstipps
                </button>
              </div>
              {!hasOutline ? <p className="muted">Noch keine Kapitel vorhanden.</p> : (
                <>
                  <div className="qgrid qhead"><span>Kapitel</span><span>Wörter</span><span>Übung</span><span>Linien</span><span>Checkliste/Skala</span></div>
                  {audit.rows.map((r) => (
                    <div className="qgrid" key={r.i}>
                      <span className="qtitle">{r.i + 1}. {r.title}</span>
                      <span className={r.words < 400 ? "bad" : "good"}>{r.words}</span>
                      <span className={r.uebung ? "good" : "bad"}>{r.uebung ? "✓" : "fehlt"}</span>
                      <span className={r.linien ? "good" : "bad"}>{r.linien ? "✓" : "fehlt"}</span>
                      <span className={r.check ? "good" : "bad"}>{r.check ? "✓" : "fehlt"}</span>
                    </div>
                  ))}
                  {audit.missingExtras.length > 0 && (
                    <p className="warn-inline" style={{ marginTop: 10 }}>Noch offen im Buchgerüst (Schritt 3): {audit.missingExtras.join(", ")}</p>
                  )}
                  {tips && <div className="desc tips">{tips.split("\n").map((p, i) => p.trim() && <p key={i}>{p}</p>)}</div>}
                </>
              )}
            </div>

            <div className="card exp">
              <div className="exp-ico"><Printer size={20} /></div>
              <div className="grow">
                <div className="card-h">Taschenbuch (Print-Interior)</div>
                <p className="muted">Öffnet dein fertig gesetztes Buch mit exakter Trim-Größe ({trim.label.split("(")[0].trim()}), gespiegelten KDP-Rändern, Bundsteg, deutscher Silbentrennung und komplettem Buchgerüst. Im neuen Fenster auf „Als PDF speichern" klicken → dieses PDF lädst du bei KDP als Manuskript hoch.</p>
                <button className="btn primary" onClick={() => openWindowWith(buildPrintHtml(project))} disabled={!hasOutline}><Printer size={15} /> Print-Version öffnen</button>
              </div>
            </div>

            <div className="card exp">
              <div className="exp-ico"><FileText size={20} /></div>
              <div className="grow">
                <div className="card-h">E-Book (Kindle)</div>
                <p className="muted">Reflowable Datei mit sauberer Kapitelstruktur. Empfohlener Weg: mit dem kostenlosen <b>Kindle Previewer</b> oder <b>Calibre</b> in EPUB umwandeln und bei KDP hochladen. Alternativ die .doc-Datei in <b>Kindle Create</b> importieren.</p>
                <div className="row">
                  <button className="btn" onClick={() => download(`${(project.title || "ebook").replace(/\s+/g, "-")}.html`, buildEbookHtml(project), "text/html")} disabled={!hasOutline}><Download size={15} /> E-Book HTML</button>
                  <button className="btn" onClick={() => download(`${(project.title || "buch").replace(/\s+/g, "-")}.doc`, buildEbookHtml(project), "application/msword")} disabled={!hasOutline}><Download size={15} /> Word-Datei (.doc)</button>
                </div>
              </div>
            </div>

            <div className="card exp">
              <div className="exp-ico"><Save size={20} /></div>
              <div className="grow">
                <div className="card-h">Projekt-Sicherung</div>
                <p className="muted">Lade dein komplettes Projekt als Datei herunter (empfohlen nach jeder größeren Sitzung) – und spiele es bei Bedarf wieder ein, auch auf einem anderen Gerät.</p>
                <div className="row">
                  <button className="btn" onClick={exportBackup}><Download size={15} /> Backup herunterladen</button>
                  <label className="btn" style={{ cursor: "pointer" }}>
                    <Upload size={15} /> Backup einspielen
                    <input type="file" accept="application/json,.json" style={{ display: "none" }} onChange={importBackup} />
                  </label>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-h">Deine KDP-Checkliste</div>
              <div className="cl">✓ Interior-PDF hochladen (Taschenbuch) – Trim-Größe bei KDP identisch wählen: {trim.label.split("(")[0].trim()}</div>
              <div className="cl">✓ „Kein Beschnitt (No Bleed)" auswählen – das Interior ist ohne Bleed gesetzt</div>
              <div className="cl">✓ Finale Seitenzahl aus dem PDF in Schritt 5 (Cover) eintragen → Cover-PDF erzeugen und hochladen</div>
              <div className="cl">✓ Seitenzahlen: KDP verlangt keine – falls gewünscht, füge sie nachträglich mit einem kostenlosen PDF-Tool hinzu</div>
              <div className="cl">✓ Vorschau im KDP „Print Previewer" prüfen, bevor du veröffentlichst</div>
            </div>

            <div className="next"><button className="btn primary" onClick={() => setStep(6)}>Weiter zum KDP-Paket <ChevronRight size={15} /></button></div>
          </div>
        )}

        {/* ============ SCHRITT 7: KDP-PAKET ============ */}
        {step === 6 && (
          <div className="panel">
            <h1 className="pt">KDP-Marketing-Paket</h1>
            <p className="ps">Buchbeschreibung, Backend-Keywords und Kategorien – fertig zum Einfügen in dein KDP-Dashboard.</p>

            <button className="btn primary" onClick={genKdp} disabled={loading === "kdp" || !hasConcept}>
              {loading === "kdp" ? <Loader2 size={15} className="spin" /> : <Megaphone size={15} />}
              {project.kdp ? "Paket neu generieren" : "Paket generieren"}
            </button>

            {project.kdp && (
              <>
                <div className="card" style={{ marginTop: 14 }}>
                  <div className="card-h row-sb">Buchbeschreibung
                    <button className="btn tiny" onClick={() => copy("desc", project.kdp.beschreibung)}>
                      {copied === "desc" ? <Check size={13} /> : <Copy size={13} />} Kopieren
                    </button>
                  </div>
                  <div className="desc">{project.kdp.beschreibung.split("\n").map((p, i) => p.trim() && <p key={i}>{p}</p>)}</div>
                </div>
                <div className="card">
                  <div className="card-h row-sb">7 Backend-Keywords
                    <button className="btn tiny" onClick={() => copy("kw", (project.kdp.keywords || []).join("; "))}>
                      {copied === "kw" ? <Check size={13} /> : <Copy size={13} />} Kopieren
                    </button>
                  </div>
                  <div className="tags">{(project.kdp.keywords || []).map((k, i) => <span className="tag" key={i}>{k}</span>)}</div>
                </div>
                <div className="card">
                  <div className="card-h">Kategorie-Vorschläge</div>
                  {(project.kdp.kategorien || []).map((k, i) => <div className="cl" key={i}>→ {k}</div>)}
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Beispieltext für die Format-Vorschau                               */
/* ------------------------------------------------------------------ */

const SAMPLE = `Vielleicht kennst du dieses Gefühl: Du gibst alles in deinen Beziehungen – und fragst dich trotzdem, ob du genug bist. **Dein Selbstwert** ist kein festes Merkmal, sondern eine Fähigkeit, die du trainieren kannst.
> Du musst dich nicht beweisen, um wertvoll zu sein.
:::uebung Deine innere Stimme kennenlernen
Notiere drei Sätze, die dein innerer Kritiker dir häufig sagt:
[linien:3]
- [ ] Ich habe die Sätze aufgeschrieben
- [ ] Ich habe sie laut ausgesprochen
:::
[skala] Wie stark bestimmt deine innere Kritik gerade deinen Alltag?
:::tipp
Beobachte deine Gedanken diese Woche wie ein neugieriger Forscher – ohne zu bewerten.
:::`;

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600&family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=Lora:ital,wght@0,400;0,600;1,400&family=Crimson+Pro:ital,wght@0,400;0,600;1,400&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=swap');

* { box-sizing: border-box; margin: 0; }
.app { display: flex; min-height: 100vh; background: #F1EFF6; font-family: 'Inter', system-ui, sans-serif; color: #26212F; }

/* ---- Rail ---- */
.rail { width: 236px; flex: none; background: #241E31; color: #CFC8E2; display: flex; flex-direction: column; padding: 22px 14px; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
.brand { display: flex; gap: 10px; align-items: center; color: #fff; padding: 0 8px 16px; }
.brand-t { font-family: 'Fraunces', serif; font-weight: 600; font-size: 16px; }
.brand-s { font-size: 11px; color: #9A8FC0; letter-spacing: 0.06em; }
.projbox { background: #2F2841; border-radius: 12px; padding: 10px; margin-bottom: 14px; }
.proj-lbl { display: block; font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #9A8FC0; margin-bottom: 6px; }
.proj-sel { width: 100%; background: #241E31; color: #fff; border: 1px solid #4A4162; border-radius: 8px; padding: 7px 8px; font-size: 12.5px; font-family: inherit; }
.proj-actions { display: flex; gap: 6px; margin-top: 7px; }
.proj-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px; background: transparent; border: 1px solid #4A4162; color: #B4ABCE; border-radius: 7px; padding: 5px; font-size: 11px; font-family: inherit; cursor: pointer; }
.proj-btn:hover { border-color: #6C57B8; color: #fff; }
.proj-btn.danger:hover { border-color: #B04444; color: #E58989; }
.rail nav { display: flex; flex-direction: column; gap: 3px; }
.rail-step { display: flex; align-items: center; gap: 9px; padding: 9px 10px; border: 0; background: transparent; color: #B4ABCE; border-radius: 9px; cursor: pointer; font-size: 13.5px; font-family: inherit; text-align: left; }
.rail-step:hover { background: #2F2841; color: #fff; }
.rail-step.on { background: #6C57B8; color: #fff; }
.rail-idx { width: 19px; height: 19px; border-radius: 6px; background: rgba(255,255,255,0.12); display: flex; align-items: center; justify-content: center; font-size: 11px; flex: none; }
.rail-foot { margin-top: auto; padding: 14px 8px 0; font-size: 12px; }
.rail-stats { border-top: 1px solid #3A3350; padding-top: 14px; display: flex; flex-direction: column; gap: 5px; color: #9A8FC0; }
.rail-stats b { color: #fff; font-weight: 600; }
.rail-save { display: flex; align-items: center; gap: 5px; margin-top: 12px; color: #7FBFA5; }

/* ---- Main ---- */
.main { flex: 1; padding: 34px 40px 60px; min-width: 0; }
.panel { max-width: 760px; }
.panel.wide { max-width: 1080px; }
.pt { font-family: 'Fraunces', serif; font-weight: 600; font-size: 30px; margin-bottom: 6px; }
.sect { font-family: 'Fraunces', serif; font-weight: 600; font-size: 21px; margin: 28px 0 6px; }
.ps { color: #6B6480; font-size: 14px; margin-bottom: 18px; max-width: 640px; }
.err { display: flex; gap: 8px; align-items: center; background: #FBEAEA; border: 1px solid #E8BDBD; color: #8C3535; padding: 10px 14px; border-radius: 10px; font-size: 13px; margin-bottom: 16px; }
.autobar { display: flex; gap: 12px; align-items: center; background: #241E31; color: #fff; padding: 12px 16px; border-radius: 12px; margin-bottom: 16px; position: sticky; top: 10px; z-index: 20; box-shadow: 0 8px 24px -10px rgba(36,30,49,0.5); }
.auto-msg { font-size: 13px; margin-bottom: 6px; }
.auto-track { height: 5px; background: rgba(255,255,255,0.15); border-radius: 99px; overflow: hidden; }
.auto-fill { height: 100%; background: #9C86E8; border-radius: 99px; transition: width 0.6s ease; }

.card { background: #fff; border: 1px solid #E3DFEE; border-radius: 14px; padding: 18px 20px; margin-bottom: 14px; }
.card-h { font-weight: 600; font-size: 14.5px; margin-bottom: 12px; }
.card.hint { display: flex; gap: 10px; align-items: flex-start; background: #F5F1E6; border-color: #E5DCC2; font-size: 13px; color: #5C5334; }
.card.autopilot { display: flex; gap: 16px; background: linear-gradient(135deg, #FDFBF4, #F4EFFC); border-color: #D9CBEE; }
.muted { color: #8B84A0; font-weight: 400; font-size: 12.5px; }
.small-t { font-size: 12px; margin-top: 6px; }
.warn-inline { font-size: 12px; color: #A2652C; margin-top: 10px; }

.lbl { display: block; font-size: 12px; font-weight: 600; color: #5A5370; margin: 12px 0 5px; letter-spacing: 0.02em; }
.lbl:first-child { margin-top: 0; }
.inp { width: 100%; border: 1px solid #D8D3E6; border-radius: 9px; padding: 9px 12px; font-size: 14px; font-family: inherit; background: #FCFBFE; color: inherit; }
.inp:focus { outline: 2px solid #6C57B8; outline-offset: 0; border-color: transparent; }
.inp.small { font-size: 12.5px; margin-top: 5px; color: #6B6480; }
.inp.num { width: 110px; }
.colorinp { width: 60px; height: 38px; border: 1px solid #D8D3E6; border-radius: 9px; padding: 3px; background: #fff; cursor: pointer; }
.row { display: flex; gap: 10px; align-items: flex-end; flex-wrap: wrap; }
.row-sb { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; }
.grow { flex: 1; min-width: 180px; }
.range { width: 100%; accent-color: #6C57B8; }
.dims { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 12px; }
.dims > div { background: #F4F1FA; border-radius: 10px; padding: 9px 14px; font-size: 12px; }
.dims span { display: block; color: #8B84A0; margin-bottom: 2px; }
.dims b { font-size: 14px; }

.btn { display: inline-flex; align-items: center; gap: 7px; border: 1px solid #D8D3E6; background: #fff; color: #3A3350; border-radius: 9px; padding: 9px 15px; font-size: 13.5px; font-weight: 500; font-family: inherit; cursor: pointer; }
.btn:hover:not(:disabled) { border-color: #6C57B8; color: #6C57B8; }
.btn.primary { background: #6C57B8; border-color: #6C57B8; color: #fff; }
.btn.primary:hover:not(:disabled) { background: #5B47A3; color: #fff; }
.btn.ghost { background: transparent; border-style: dashed; width: 100%; justify-content: center; }
.btn.tiny { padding: 5px 10px; font-size: 12px; }
.btn:disabled { opacity: 0.45; cursor: not-allowed; }
.btn:focus-visible, .rail-step:focus-visible, .inp:focus-visible { outline: 2px solid #6C57B8; outline-offset: 2px; }
.spin { animation: sp 1s linear infinite; }
@keyframes sp { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .spin { animation: none; } .auto-fill { transition: none; } }

.next { margin-top: 22px; display: flex; justify-content: flex-end; }

/* Ideen */
.ideas { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
.idea { text-align: left; background: #fff; border: 1.5px solid #E3DFEE; border-radius: 14px; padding: 16px; cursor: pointer; font-family: inherit; color: inherit; position: relative; }
.idea:hover { border-color: #6C57B8; }
.idea.picked { border-color: #6C57B8; background: #F5F2FC; }
.idea-t { font-family: 'Fraunces', serif; font-weight: 600; font-size: 15.5px; margin-bottom: 4px; }
.idea-s { font-size: 12.5px; color: #6B6480; font-style: italic; margin-bottom: 8px; }
.idea-m { font-size: 12px; color: #5A5370; margin-bottom: 3px; }
.idea-check { display: inline-flex; align-items: center; gap: 4px; margin-top: 8px; font-size: 11.5px; font-weight: 600; color: #6C57B8; }

/* Gliederung */
.chrow { display: flex; gap: 12px; background: #fff; border: 1px solid #E3DFEE; border-radius: 12px; padding: 12px 14px; margin-bottom: 8px; align-items: flex-start; }
.chrow-idx { width: 26px; height: 26px; flex: none; border-radius: 8px; background: #EDE8F8; color: #6C57B8; font-weight: 600; font-size: 13px; display: flex; align-items: center; justify-content: center; margin-top: 4px; }
.chrow-actions { display: flex; flex-direction: column; gap: 3px; }
.ico { border: 0; background: #F1EFF6; border-radius: 6px; width: 26px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #5A5370; }
.ico:hover { background: #E3DFEE; }
.ico.danger:hover { background: #FBEAEA; color: #B04444; }

/* Schreiben */
.chtabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }
.chtab { display: inline-flex; align-items: center; gap: 4px; border: 1px solid #D8D3E6; background: #fff; border-radius: 8px; padding: 6px 12px; font-size: 13px; font-weight: 600; cursor: pointer; color: #5A5370; font-family: inherit; }
.chtab.done { border-color: #7FBFA5; color: #3E8E7E; }
.chtab.on { background: #6C57B8; border-color: #6C57B8; color: #fff; }
.writegrid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; align-items: start; }
.ta { width: 100%; min-height: 420px; border: 1px solid #D8D3E6; border-radius: 10px; padding: 12px 14px; font-family: ui-monospace, 'SF Mono', Menlo, monospace; font-size: 12.5px; line-height: 1.55; resize: vertical; background: #FCFBFE; color: inherit; }
.ta.short { min-height: 130px; }
.ta:focus { outline: 2px solid #6C57B8; border-color: transparent; }

/* Buchvorschau */
.prevwrap { position: sticky; top: 20px; }
.prevlabel { font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #8B84A0; margin-bottom: 8px; }
.page { background: #fff; border: 1px solid #DCD7E8; box-shadow: 0 14px 34px -18px rgba(38,30,60,0.4), 0 2px 6px rgba(38,30,60,0.07); overflow: hidden; }
.page-inner { padding: 9% 9.5%; height: 100%; overflow-y: auto; }
.bk-chnum { font-size: 0.72em; letter-spacing: 0.25em; text-transform: uppercase; color: #6B6480; margin-bottom: 0.8em; }
.bk-h1 { font-family: 'Fraunces', serif; font-size: 1.9em; font-weight: 700; line-height: 1.15; margin-bottom: 1em; }
.bk-h2 { font-family: 'Fraunces', serif; font-size: 1.32em; font-weight: 700; margin: 1.3em 0 0.5em; }
.bk-h3 { font-size: 1.08em; font-weight: 600; margin: 1em 0 0.35em; }
.bk-p { margin: 0 0 0.65em; text-align: var(--al, justify); hyphens: auto; -webkit-hyphens: auto; }
.bk-quote { margin: 0.9em 1.4em; font-style: italic; text-align: center; }
.bk-li { display: flex; gap: 0.55em; margin: 0 0 0.3em 0.6em; }
.bk-dot { width: 0.28em; height: 0.28em; border-radius: 50%; background: currentColor; margin-top: 0.62em; flex: none; }
.bk-num { font-weight: 600; }
.bk-check { display: flex; gap: 0.6em; margin: 0 0 0.5em 0.3em; align-items: flex-start; }
.bk-box { width: 0.85em; height: 0.85em; border: 1.5px solid currentColor; border-radius: 0.2em; margin-top: 0.22em; flex: none; }
.bk-lines { margin: 0.6em 0 1em; }
.bk-line { border-bottom: 1px solid #A79FBE; height: 1.9em; }
.bk-skala { margin: 0.6em 0 1em; }
.bk-skala-row { display: flex; gap: 0.4em; margin-top: 0.4em; flex-wrap: wrap; }
.bk-skala-n { width: 1.6em; height: 1.6em; border: 1px solid currentColor; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8em; }
.bk-boxwrap { border: 1.5px solid #26212F; border-radius: 0.5em; padding: 0.9em 1em; margin: 1em 0 1.1em; }
.bk-boxwrap.is-tipp { border-style: dashed; }
.bk-boxlabel { font-family: 'Fraunces', serif; font-weight: 700; font-size: 0.8em; letter-spacing: 0.13em; text-transform: uppercase; margin-bottom: 0.5em; }

/* Export */
.exp { display: flex; gap: 16px; }
.exp-ico { width: 44px; height: 44px; flex: none; border-radius: 12px; background: #EDE8F8; color: #6C57B8; display: flex; align-items: center; justify-content: center; }
.exp-ico.gold { background: #F3EAD3; color: #9A7B2D; }
.exp p { margin-bottom: 12px; font-size: 13px; line-height: 1.55; }
.cl { font-size: 13px; padding: 6px 0; border-bottom: 1px dashed #E9E5F2; color: #4A4460; }
.cl:last-child { border-bottom: 0; }

/* Qualitäts-Check */
.qgrid { display: grid; grid-template-columns: 1fr 70px 70px 70px 110px; gap: 8px; font-size: 12.5px; padding: 6px 0; border-bottom: 1px dashed #E9E5F2; align-items: center; }
.qgrid.qhead { font-weight: 600; color: #8B84A0; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; border-bottom: 1px solid #E3DFEE; }
.qtitle { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.good { color: #3E8E7E; font-weight: 600; }
.bad { color: #B04444; font-weight: 600; }
.tips { margin-top: 12px; background: #F4F1FA; border-radius: 10px; padding: 12px 14px; }

/* KDP-Paket */
.desc p { font-size: 13.5px; line-height: 1.6; margin-bottom: 10px; }
.tags { display: flex; flex-wrap: wrap; gap: 7px; }
.tag { background: #EDE8F8; color: #4E3D8F; border-radius: 999px; padding: 5px 12px; font-size: 12.5px; }

@media (max-width: 900px) {
  .app { flex-direction: column; }
  .rail { width: 100%; height: auto; position: static; padding: 14px; overflow: visible; }
  .rail nav { flex-direction: row; flex-wrap: wrap; }
  .rail-foot { display: none; }
  .main { padding: 20px 16px 50px; }
  .writegrid, .ideas { grid-template-columns: 1fr; }
  .prevwrap { position: static; }
  .qgrid { grid-template-columns: 1fr 55px 55px 55px 80px; }
}
`;