import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Sparkles, ListTree, PenLine, LayoutTemplate, Download, Megaphone,
  Plus, Trash2, RefreshCw, Copy, Check, Loader2, BookOpen, ChevronRight,
  ArrowUp, ArrowDown, Save, AlertCircle, Printer, FileText, Lightbulb,
  Palette, Wand2, Square, Upload, ShieldCheck, FolderPlus, Languages, CornerLeftUp, Rocket, TrendingUp, Smartphone,
  Feather, Users, Quote, Globe, Mic, Library
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
  "24-150":  { label: "24–150 Seiten (Minimum 9,6 mm)",  mm: 13.5 },
  "151-300": { label: "151–300 Seiten (Minimum 12,7 mm)", mm: 16.5 },
  "301-500": { label: "301–500 Seiten (Minimum 15,9 mm)", mm: 19.5 },
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

const BOOK_TYPES = {
  workbook: { label: "Workbook / Arbeitsbuch (mit Übungen & Schreiblinien)" },
  ratgeber: { label: "Ratgeber / Sachbuch (Fließtext, ohne Ausfüllelemente)" },
  roman:    { label: "Roman / Erzählung (Belletristik)" },
};

const NICHES = [
  "Selbstwert & toxische Beziehungen",
  "Bindungsangst & Beziehungsmuster",
  "Selbstliebe & Selbstfürsorge",
  "Innere Kindheit & Schattenarbeit",
  "Achtsamkeit & Stressbewältigung",
  "Trauer & Verlust",
  "Gewohnheiten & Disziplin",
  "Produktivität & Fokus",
  "Finanzen & Money Mindset",
  "Eltern & Erziehung",
  "Spiritualität & Manifestation",
  "Kreativität & Journaling",
];

const LANGS = { de: "Deutsch", en: "Englisch", es: "Spanisch", fr: "Französisch", it: "Italienisch" };

/* Sprachabhängige Texte, die im BUCH selbst landen */
const BOOK_STRINGS = {
  de: {
    chapter: "Kapitel", contents: "Inhalt",
    intro: "Einleitung", prolog: "Vorwort", howto: "Wie du mit diesem Buch arbeitest",
    closing: "Schlusswort", afterword: "Nachwort", about: "Über die Autorin / den Autor", bonus: "Dein Bonus",
    rights: (y, a) => `© ${y} ${a}. Alle Rechte vorbehalten.`,
    copy: "Dieses Werk einschließlich aller Inhalte ist urheberrechtlich geschützt. Nachdruck oder Reproduktion (auch auszugsweise) in irgendeiner Form sowie die Verbreitung ohne schriftliche Genehmigung sind untersagt.",
    disclaimerSelfhelp: "Wichtiger Hinweis: Dieses Buch dient der Selbstreflexion und Psychoedukation. Es ersetzt keine Psychotherapie, ärztliche Behandlung oder professionelle Beratung. Bei akuten Krisen wende dich bitte an eine Fachperson oder einen Krisendienst.",
    disclaimerFiction: "Dies ist ein Werk der Fiktion. Ähnlichkeiten mit lebenden oder verstorbenen Personen sowie realen Ereignissen sind rein zufällig.",
    publisher: "Independently published.",
  },
  en: {
    chapter: "Chapter", contents: "Contents",
    intro: "Introduction", prolog: "Foreword", howto: "How to Use This Book",
    closing: "Final Words", afterword: "Afterword", about: "About the Author", bonus: "Your Bonus",
    rights: (y, a) => `© ${y} ${a}. All rights reserved.`,
    copy: "This work, including all of its contents, is protected by copyright. No part of this publication may be reproduced, distributed, or transmitted in any form without prior written permission.",
    disclaimerSelfhelp: "Important note: This book is intended for self-reflection and educational purposes only. It is not a substitute for psychotherapy, medical treatment, or professional advice. If you are in crisis, please reach out to a professional or a crisis service.",
    disclaimerFiction: "This is a work of fiction. Any resemblance to actual persons, living or dead, or actual events is purely coincidental.",
    publisher: "Independently published.",
  },
  es: {
    chapter: "Capítulo", contents: "Índice",
    intro: "Introducción", prolog: "Prólogo", howto: "Cómo trabajar con este libro",
    closing: "Palabras finales", afterword: "Epílogo", about: "Sobre la autora / el autor", bonus: "Tu bono",
    rights: (y, a) => `© ${y} ${a}. Todos los derechos reservados.`,
    copy: "Esta obra, incluidos todos sus contenidos, está protegida por derechos de autor. Queda prohibida su reproducción o distribución, total o parcial, sin autorización previa por escrito.",
    disclaimerSelfhelp: "Nota importante: Este libro está pensado para la autorreflexión y la psicoeducación. No sustituye la psicoterapia, el tratamiento médico ni el asesoramiento profesional. En caso de crisis, acude a un profesional o a un servicio de emergencia.",
    disclaimerFiction: "Esta es una obra de ficción. Cualquier parecido con personas reales, vivas o fallecidas, o con hechos reales es pura coincidencia.",
    publisher: "Independently published.",
  },
  fr: {
    chapter: "Chapitre", contents: "Table des matières",
    intro: "Introduction", prolog: "Avant-propos", howto: "Comment utiliser ce livre",
    closing: "Le mot de la fin", afterword: "Postface", about: "À propos de l'auteure / l'auteur", bonus: "Votre bonus",
    rights: (y, a) => `© ${y} ${a}. Tous droits réservés.`,
    copy: "Cette œuvre, y compris l'ensemble de son contenu, est protégée par le droit d'auteur. Toute reproduction ou diffusion, même partielle, sans autorisation écrite préalable est interdite.",
    disclaimerSelfhelp: "Note importante : ce livre est destiné à la réflexion personnelle et à la psychoéducation. Il ne remplace pas une psychothérapie, un traitement médical ou un accompagnement professionnel. En cas de crise, adressez-vous à un professionnel ou à un service d'urgence.",
    disclaimerFiction: "Ceci est une œuvre de fiction. Toute ressemblance avec des personnes réelles, vivantes ou décédées, ou avec des événements réels serait purement fortuite.",
    publisher: "Independently published.",
  },
  it: {
    chapter: "Capitolo", contents: "Indice",
    intro: "Introduzione", prolog: "Prefazione", howto: "Come lavorare con questo libro",
    closing: "Parole conclusive", afterword: "Postfazione", about: "Sull'autrice / sull'autore", bonus: "Il tuo bonus",
    rights: (y, a) => `© ${y} ${a}. Tutti i diritti riservati.`,
    copy: "Quest'opera, compresi tutti i suoi contenuti, è protetta dal diritto d'autore. È vietata la riproduzione o la diffusione, anche parziale, senza previa autorizzazione scritta.",
    disclaimerSelfhelp: "Nota importante: questo libro è pensato per l'autoriflessione e la psicoeducazione. Non sostituisce la psicoterapia, le cure mediche o la consulenza professionale. In caso di crisi, rivolgiti a un professionista o a un servizio di emergenza.",
    disclaimerFiction: "Questa è un'opera di fantasia. Ogni riferimento a persone reali, vive o defunte, o a fatti realmente accaduti è puramente casuale.",
    publisher: "Independently published.",
  },
};

/* Welche Rahmenteile es je Buchtyp gibt */
function extrasFor(bookType) {
  if (bookType === "roman") return EXTRA_DEFS.filter((d) => ["einleitung", "schlusswort", "autorin"].includes(d.key));
  return EXTRA_DEFS;
}

const STEPS = [
  { id: 0, label: "Idee",         icon: Sparkles },
  { id: 1, label: "Gliederung",   icon: ListTree },
  { id: 2, label: "Schreiben",    icon: PenLine },
  { id: 3, label: "Formatierung", icon: LayoutTemplate },
  { id: 4, label: "Cover",        icon: Palette },
  { id: 5, label: "Export",       icon: Download },
  { id: 6, label: "KDP-Paket",    icon: Megaphone },
  { id: 7, label: "Veröffentlichen", icon: Rocket },
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
  language: "de",
  bookType: "workbook",
  chapterCount: 8,
  ideas: [],
  trends: [],
  digitalIdeas: [],
  gaps: [],
  titleTests: [],
  series: [],
  voice: { sample: "", profile: "" },
  launch: { posts: [], emails: [] },
  title: "", subtitle: "", audience: "", promise: "", author: "", bio: "",
  outline: [],
  extras: { einleitung: "", arbeitsweise: "", schlusswort: "", autorin: "", bonus: "" },
  cover: { pageCount: 0, paper: "cream", bg: "#2E2A3B", fg: "#F5F1E6", blurb: "", brief: "", imgPrompt: "", imageUrl: "" },
  pub: { binding: "paperback", price: 12.99, ebookPrice: 4.99, checks: {} },
  digital: { format: "phone", fontSize: 14, accent: "#6C57B8", align: "left", withExtras: true, sel: {} },
  settings: { trim: "7x10", pages: "151-300", font: "garamond", fontSize: 11.5, lineHeight: 1.55, align: "justify", wordTarget: 1200 },
  kdp: null,
};

function mergeProject(p) {
  return {
    ...emptyProject, ...(p || {}),
    extras: { ...emptyProject.extras, ...((p && p.extras) || {}) },
    cover: { ...emptyProject.cover, ...((p && p.cover) || {}) },
    pub: { ...emptyProject.pub, ...((p && p.pub) || {}), checks: { ...((p && p.pub && p.pub.checks) || {}) } },
    digital: { ...emptyProject.digital, ...((p && p.digital) || {}), sel: { ...((p && p.digital && p.digital.sel) || {}) } },
    voice: { ...emptyProject.voice, ...((p && p.voice) || {}) },
    launch: { posts: [...(((p && p.launch) || {}).posts || [])], emails: [...(((p && p.launch) || {}).emails || [])] },
    settings: { ...emptyProject.settings, ...((p && p.settings) || {}) },
  };
}

/* Grobe Druckkosten-Schätzung (s/w Tinte, Amazon.de) – verbindlich ist immer der KDP-Preisrechner */
function estimatePrintCost(pages, binding) {
  const p = Math.max(24, pages || 0);
  if (binding === "hardcover") return p <= 108 ? 6.05 : 4.65 + 0.014 * p;
  return p <= 108 ? 1.93 : 0.6 + 0.012 * p;
}

const KDP_GUIDE = [
  { k: "konto",  t: "KDP-Konto anlegen", d: "Gehe auf kdp.amazon.com und melde dich mit deinem normalen Amazon-Konto an. Fülle einmalig das Steuerinterview aus (als Privatperson in Deutschland: TIN = deine Steuer-ID) und hinterlege dein Bankkonto für die Auszahlungen." },
  { k: "titel",  t: "Neuen Titel erstellen", d: "Im KDP-Dashboard auf „+ Erstellen“ klicken und „Taschenbuch“ wählen (das E-Book kannst du danach mit einem Klick aus demselben Projekt anlegen)." },
  { k: "details",t: "Buchdetails ausfüllen", d: "Sprache wählen, dann Titel, Untertitel, Autor und Beschreibung eintragen – nutze die Kopier-Buttons unten. Bei der Frage nach KI-Inhalten wahrheitsgemäß „Mit KI-Unterstützung erstellt“ angeben; das ist erlaubt und beeinflusst die Veröffentlichung nicht." },
  { k: "keywords", t: "SEO-Keywords & Kategorien", d: "Die 7 recherchebasierten SEO-Keywords aus deinem KDP-Paket in die 7 Felder einfügen und bis zu 3 Kategorien wählen (im KDP-Paket-Schritt generiert)." },
  { k: "isbn",   t: "ISBN zuweisen", d: "„Kostenlose KDP-ISBN“ wählen – du brauchst keine eigene zu kaufen. (Nur fürs Taschenbuch; E-Books brauchen keine ISBN.)" },
  { k: "interior", t: "Manuskript hochladen", d: "Trim-Größe exakt so einstellen wie im Tool gewählt, „Kein Beschnitt (No Bleed)“ und „Cover-Finish: Matt oder Glänzend“ wählen. Dann dein Print-PDF aus dem Export-Schritt hochladen." },
  { k: "cover",  t: "Cover hochladen", d: "Dein Cover-PDF aus dem Cover-Schritt hochladen (oder alternativ den KDP Cover Creator nutzen). Wichtig: Vorher die finale Seitenzahl aus dem Print-PDF im Cover-Schritt eintragen, damit der Buchrücken stimmt." },
  { k: "preview", t: "Print-Previewer prüfen", d: "Den „Previewer starten“ und ALLE Seiten durchblättern: Ränder, Seitenumbrüche, Schreiblinien. Erst freigeben, wenn alles passt – der Previewer zeigt exakt das spätere Druckbild." },
  { k: "preis",  t: "Preis festlegen & veröffentlichen", d: "Marktplätze auswählen, Listenpreis eintragen (Kalkulator oben hilft), dann „Veröffentlichen“. Amazon prüft das Buch – das dauert bis zu 72 Stunden, meist deutlich kürzer. Du bekommst eine E-Mail, sobald es live ist." },
];

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

/* Wie askClaude, aber MIT Websuche – für Recherche-Aufgaben (Trend-Radar) */
async function askClaudeWithSearch(system, user, expectJson = false) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{ role: "user", content: `${system}\n\n---\n\n${user}` }],
      tools: [{ type: "web_search_20250305", name: "web_search" }],
    }),
  });
  const data = await res.json();
  if (data && data.error) throw new Error(data.error.message || "API-Fehler");
  const text = (data.content || [])
    .filter((c) => c.type === "text")
    .map((c) => c.text)
    .join("\n");
  if (!text.trim()) throw new Error("Leere Antwort");
  if (expectJson) return tryParseJson(text);
  return text;
}

/* KI-Bild über den Higgsfield-Konnektor erzeugen (MCP-Server im API-Call) */
async function askHiggsfieldImage(prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
      mcp_servers: [{ type: "url", url: "https://mcp.higgsfield.ai/mcp", name: "higgsfield" }],
    }),
  });
  const data = await res.json();
  if (data && data.error) throw new Error(data.error.message || "API-Fehler");
  const allText = (data.content || [])
    .filter((c) => c.type === "text" || c.type === "mcp_tool_result")
    .map((c) => (c.type === "text" ? c.text : (c.content || []).map((x) => x.text || "").join(" ")))
    .join("\n");
  const m = allText.match(/https?:\/\/[^\s)"'\]}>]+\.(?:png|jpe?g|webp)[^\s)"'\]}>]*/i)
    || allText.match(/https?:\/\/[^\s)"'\]}>]+(?:image|media|cdn|storage)[^\s)"'\]}>]*/i);
  if (!m) throw new Error("keine Bild-URL in der Antwort gefunden – ist der Higgsfield-Konnektor verbunden und hast du Credits?");
  return m[0];
}

const SYS_AUTOR = `Du bist erfahrene:r Autor:in und Verleger:in erfolgreicher KDP-Bücher (Workbooks, Ratgeber und Romane). Dein Kernbereich ist Psychologie (Selbstwert, Beziehungen, Bindungstheorie, Selbstmitgefühl nach Neff, kognitive Umstrukturierung, Journaling-Methodik), aber du passt dich souverän jeder Nische an. Bei Sach- und Arbeitsbüchern schreibst du warm, fundiert, praxisnah und sprichst Leser:innen direkt an ("du" bzw. "you"). Bei Romanen schreibst du szenisch, atmosphärisch und mit lebendigen Dialogen. Nutze immer nur EIN Leerzeichen zwischen Wörtern. WICHTIG: Setze Gedankenstriche (–) äußerst sparsam ein, höchstens einen pro Seite. Bevorzuge stattdessen Kommas, Doppelpunkte oder eigenständige Sätze.
MENSCHLICHER SCHREIBFLUSS (strikt einhalten): Variiere Satzlängen deutlich – auf einen langen Satz folgt gern ein sehr kurzer. Variiere Satzanfänge, beginne nie mehrere Sätze hintereinander gleich. Vermeide KI-typische Floskeln komplett: "Darüber hinaus", "Des Weiteren", "Es ist wichtig zu beachten", "In der heutigen Zeit/Welt", "Zusammenfassend lässt sich sagen", "Tauchen wir ein", "spielt eine entscheidende Rolle", "Egal ob ... oder ...". Löse gleichförmige Dreier-Aufzählungen auf. Baue stattdessen konkrete, sinnliche Details, kleine Alltagsmomente und gelegentlich eine unerwartete, persönliche Wendung ein. Perfekte Parallelstrukturen sind verboten; kleine natürliche Unregelmäßigkeiten erwünscht.`;

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

function sysAutor(project) {
  const v = project && project.voice && project.voice.profile ? project.voice.profile.trim() : "";
  return v ? `${SYS_AUTOR}\n\nAUTOREN-DNA – halte dich in ALLEN Texten strikt an dieses Stil-Profil:\n${v}` : SYS_AUTOR;
}

/* ---- Prompt-Bausteine ---- */

function bookContext(project) {
  const typeLabel = project.bookType === "roman" ? "Roman" : project.bookType === "ratgeber" ? "Ratgeber/Sachbuch" : "Workbook";
  const langLine = project.language === "de"
    ? "SPRACHE: Verfasse alle Buch-Inhalte auf Deutsch."
    : `SPRACHE: Verfasse ALLE Buch-Inhalte (Texte, Überschriften, Übungen, Klappentexte, Keywords) auf ${(LANGS[project.language] || "Englisch").toUpperCase()} – idiomatisch und stimmig für Muttersprachler:innen dieses Marktes.`;
  return `Buchtyp: ${typeLabel}. Buch: "${project.title}" – ${project.subtitle}. Zielgruppe: ${project.audience}. Versprechen: ${project.promise}. ${langLine}`;
}

function outlinePrompt(project) {
  const arc = project.bookType === "roman"
    ? "Erstelle ein Kapitel-Exposé mit klarem Spannungsbogen: Einstieg mit Hook, steigende Konflikte, Wendepunkte, Höhepunkt, Auflösung. 'ziel' beschreibt, was in dem Kapitel passiert."
    : project.bookType === "ratgeber"
    ? "Roter Faden: Problem verstehen → Hintergründe & Wissen → Lösungswege → Umsetzung im Alltag. 'ziel' beschreibt den Nutzen des Kapitels."
    : "Roter Faden: vom Verstehen über das Fühlen zum Handeln. 'ziel' beschreibt, was die Leser:in in dem Kapitel erreicht.";
  return `${bookContext(project)}
Erstelle eine Gliederung mit genau ${project.chapterCount} Kapiteln. ${arc} Antworte NUR mit kompaktem JSON, ohne Zeilenumbrüche, ohne Erklärungen:
{"kapitel":[{"titel":"max 8 Wörter","ziel":"max 12 Wörter"}]}`;
}

async function generateChapterText(project, outline, i) {
  const ch = outline[i];
  const prev = outline[i - 1];
  const isRoman = project.bookType === "roman";
  const structure = isRoman
    ? "Schreibe szenisch mit Dialogen und Atmosphäre (Show, don't tell). Nutze NUR Fließtext-Absätze und gelegentlich > für hervorgehobene Gedanken – KEINE Überschriften, KEINE Übungen, KEINE Listen."
    : project.bookType === "ratgeber"
    ? "Aufbau: packender Einstieg → fundiertes Wissen verständlich erklärt → konkrete Beispiele oder Mini-Geschichten → praktische Impulse am Ende. Nutze ## Zwischenüberschriften, > Merksätze und :::tipp – aber KEINE Schreiblinien [linien:x] und KEINE Checkboxen."
    : "Aufbau: kurzer emotionaler Einstieg → Psychoedukation (fundiert, verständlich) → mindestens 1 :::uebung mit [linien:x] → 1 [skala] ODER Checkliste → :::tipp zum Abschluss.";
  const sys = isRoman ? sysAutor(project) : `${sysAutor(project)}\n${FORMAT_REGELN}`;
  const text = await askClaude(
    sys,
    `${bookContext(project)}
${prev ? `Vorheriges Kapitel: "${prev.title}".` : "Dies ist das erste Kapitel."}
Schreibe jetzt Kapitel ${i + 1}: "${ch.title}". Ziel: ${ch.goal}
${structure} Schreibe so viel wie möglich.`
  );
  return text.trim();
}

async function extendText(project, ch, existing) {
  const tail = (existing || "").slice(-1500);
  const isRoman = project.bookType === "roman";
  const deepen = isRoman
    ? "Führe die Szene bzw. Handlung nahtlos weiter (kein Neuanfang, keine Wiederholung) und bringe das Kapitel zu einem stimmigen Abschluss mit leichtem Sog zum nächsten Kapitel."
    : project.bookType === "ratgeber"
    ? "Setze nahtlos fort (kein Neuanfang, keine Wiederholung). Vertiefe mit einem weiteren Beispiel, einer Fallgeschichte oder konkreten Alltags-Impulsen. Schließe mit kurzer Zusammenfassung und Überleitung ab."
    : "Setze das Kapitel nahtlos fort (kein Neuanfang, keine Wiederholung). Vertiefe mit einer weiteren Übung, Reflexionsfragen mit [linien:x] oder einem Praxisbeispiel. Schließe mit kurzer Zusammenfassung und Überleitung ab.";
  const sys = isRoman ? sysAutor(project) : `${sysAutor(project)}\n${FORMAT_REGELN}`;
  const text = await askClaude(
    sys,
    `${bookContext(project)} Kapitel: "${ch.title}" (Ziel: ${ch.goal}).
Hier das bisherige Ende des Kapitels:\n---\n${tail}\n---\n${deepen}`
  );
  return text.trim();
}

function extraPrompt(project, outline, key) {
  const ctx = bookContext(project);
  const kap = outline.map((c, i) => `${i + 1}. ${c.title}`).join("; ");
  if (project.bookType === "roman") {
    switch (key) {
      case "einleitung":
        return `${ctx}\nSchreibe ein kurzes, stimmungsvolles VORWORT der Autorin/des Autors (ohne Spoiler): Was hat sie/ihn zu dieser Geschichte bewegt, was erwartet die Leser:in emotional. 120–200 Wörter, KEINE Überschriften, keine Listen.`;
      case "schlusswort":
        return `${ctx}\nSchreibe ein NACHWORT: Dank an die Leser:in, kurzer persönlicher Gedanke zur Geschichte (ohne Spoiler zu wiederholen) und eine freundliche, konkrete Bitte um eine ehrliche Amazon-Rezension (erkläre kurz, warum das für unabhängige Autor:innen wichtig ist). 150–250 Wörter, keine Listen.`;
      case "autorin":
        return `${ctx}\nAutor:in: ${project.author || "unbekannt"}. Stichworte zur Person: ${project.bio || "keine – schreibe eine glaubwürdige, allgemeine Bio ohne erfundene Details"}.\nSchreibe "Über die Autorin/den Autor" in der DRITTEN Person: Bezug zum Schreiben und zu den Themen des Romans, warm und persönlich. Erfinde KEINE Titel oder Auszeichnungen. 100–150 Wörter.`;
      default: return ctx;
    }
  }
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
      return `${ctx}\nSchreibe eine BONUS-SEITE: Lade die Leserin ein, sich ein kostenloses Zusatz-Material zu holen (z. B. Journal-Vorlagen oder Checklisten passend zum Buchthema) unter dem Platzhalter [DEIN-LINK]. Kurz, einladend, mit 2–3 - Aufzählungspunkten, was sie bekommt. Max. 120 Wörter.`;
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
  return groupLinesWithQuestion(blocks);
}

/* Verhindert isolierte Schreiblinien/Skalen am Seitenanfang: eine Frage
   (p/li/h3) wird mit ihren direkt folgenden [linien:x]/[skala]-Blöcken zu
   einer nicht trennbaren Gruppe zusammengefasst (page-break-inside: avoid). */
function groupLinesWithQuestion(blocks) {
  const out = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.t === "box") { out.push({ ...b, children: groupLinesWithQuestion(b.children) }); continue; }
    const isQuestion = b.t === "p" || b.t === "li" || b.t === "oli" || b.t === "h3";
    if (isQuestion) {
      const grp = [b];
      let j = i + 1;
      while (j < blocks.length && (blocks[j].t === "lines" || blocks[j].t === "skala")) { grp.push(blocks[j]); j++; }
      if (grp.length > 1) { out.push({ t: "grp", children: grp }); i = j - 1; continue; }
    }
    out.push(b);
  }
  return out;
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
      case "grp": return <div className="bk-grp" key={i}><Blocks blocks={b.children} /></div>;
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
      case "grp": return `<div class="grp">${blocksToHtml(b.children)}</div>`;
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
  @page { size: ${trim.w}mm ${trim.h}mm; margin: 19mm ${gutter}mm 20mm ${gutter}mm; }
  @page :right { margin-left: ${gutter}mm; margin-right: 15mm; }
  @page :left  { margin-left: 15mm; margin-right: ${gutter}mm; }
  .chapter, .front { page-break-before: always; }
  .titlepage { page-break-before: avoid; }
  h2, h3 { page-break-after: avoid; }
  .ebox, .wlines, .skala, .grp { page-break-inside: avoid; }
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
  const S = BOOK_STRINGS[project.language] || BOOK_STRINGS.de;
  const isRoman = project.bookType === "roman";
  const ex = project.extras || {};
  const introTitle = isRoman ? S.prolog : S.intro;
  const closingTitle = isRoman ? S.afterword : S.closing;
  const tocRows = [];
  if (ex.einleitung && ex.einleitung.trim()) tocRows.push(introTitle);
  if (!isRoman && ex.arbeitsweise && ex.arbeitsweise.trim()) tocRows.push(S.howto);
  project.outline.forEach((ch, i) => tocRows.push(`${S.chapter} ${i + 1} — ${ch.title}`));
  if (ex.schlusswort && ex.schlusswort.trim()) tocRows.push(closingTitle);
  if (ex.autorin && ex.autorin.trim()) tocRows.push(S.about);
  if (!isRoman && ex.bonus && ex.bonus.trim()) tocRows.push(S.bonus);

  const chapters = project.outline.map((ch, i) => `
    <section class="chapter">
      <div class="ch-num">${S.chapter} ${i + 1}</div>
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
    <p>${S.rights(year, esc(project.author || ""))}</p>
    <p>${S.copy}</p>
    <p>${isRoman ? S.disclaimerFiction : S.disclaimerSelfhelp}</p>
    <p>${S.publisher}</p>
  </div>
  <div class="front toc"><h1>${S.contents}</h1>${tocRows.map((r) => `<div class="trow"><span>${esc(r)}</span></div>`).join("")}</div>
  ${extraSection(introTitle, ex.einleitung)}
  ${!isRoman ? extraSection(S.howto, ex.arbeitsweise) : ""}
  ${chapters}
  ${extraSection(closingTitle, ex.schlusswort)}
  ${extraSection(S.about, ex.autorin)}
  ${!isRoman ? extraSection(S.bonus, ex.bonus) : ""}
  `;
}

function buildPrintHtml(project) {
  return `<!DOCTYPE html><html lang="${project.language || "de"}"><head><meta charset="utf-8">
  <title>${esc(project.title)} – Print-Interior</title>
  <style>${bookCss(project, true)}
  .printbar { position: fixed; top: 12px; right: 12px; z-index: 99; font-family: sans-serif; }
  .printbar button { background: #6C57B8; color: #fff; border: 0; border-radius: 8px; padding: 12px 18px; font-size: 15px; cursor: pointer; }
  .printbar p { background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 8px 10px; font-size: 12px; max-width: 260px; margin-top: 8px; }
  @media print { .printbar { display: none; } }
  </style></head><body>
  <div class="printbar"><button onclick="window.print()">Als PDF speichern (Drucken)</button>
  <p>Im Druckdialog: Ziel „Als PDF speichern", Ränder „Standard", „Hintergrundgrafiken" AN – und unter „Weitere Einstellungen" den Haken bei „Kopf- und Fußzeilen" ENTFERNEN (sonst druckt der Browser Dateipfad/Datum auf jede Seite). Papierformat wird automatisch gesetzt.</p></div>
  ${buildBookBody(project)}
  </body></html>`;
}

function buildEbookHtml(project) {
  return `<!DOCTYPE html><html lang="${project.language || "de"}"><head><meta charset="utf-8">
  <title>${esc(project.title)}</title>
  <style>${bookCss(project, false)}
  body { max-width: 640px; margin: 0 auto; padding: 24px; }
  .chapter { margin-top: 60px; }
  </style></head><body>
  ${buildBookBody(project)}
  </body></html>`;
}

/* ------------------------------------------------------------------ */
/*  Export: echtes EPUB (eigener ZIP-Writer, keine externe Bibliothek) */
/* ------------------------------------------------------------------ */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

/* ZIP mit STORED-Einträgen (unkomprimiert) – exakt was EPUB verlangt */
function buildZip(entries) {
  const enc = new TextEncoder();
  const parts = [];
  const central = [];
  let offset = 0;
  const w = (arr) => { parts.push(arr); offset += arr.length; };
  const u16 = (v) => new Uint8Array([v & 255, (v >> 8) & 255]);
  const u32 = (v) => new Uint8Array([v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >>> 24) & 255]);
  for (const e of entries) {
    const name = enc.encode(e.name);
    const data = typeof e.data === "string" ? enc.encode(e.data) : e.data;
    const crc = crc32(data);
    const hdrOffset = offset;
    w(u32(0x04034b50)); w(u16(20)); w(u16(0x0800)); w(u16(0)); w(u16(0)); w(u16(0));
    w(u32(crc)); w(u32(data.length)); w(u32(data.length)); w(u16(name.length)); w(u16(0));
    w(name); w(data);
    central.push([u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0),
      u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0),
      u16(0), u16(0), u32(0), u32(hdrOffset), name]);
  }
  const cdStart = offset;
  for (const c of central) for (const arr of c) w(arr);
  const cdSize = offset - cdStart;
  w(u32(0x06054b50)); w(u16(0)); w(u16(0)); w(u16(entries.length)); w(u16(entries.length));
  w(u32(cdSize)); w(u32(cdStart)); w(u16(0));
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let pos = 0;
  for (const p of parts) { out.set(p, pos); pos += p.length; }
  return out;
}

function xhtmlWrap(title, body, lang, hasCss) {
  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${lang}" lang="${lang}">
<head><title>${esc(title)}</title>${hasCss ? '<link rel="stylesheet" type="text/css" href="style.css"/>' : ""}</head>
<body>${body}</body></html>`;
}

function epubDocs(project) {
  const S = BOOK_STRINGS[project.language] || BOOK_STRINGS.de;
  const isRoman = project.bookType === "roman";
  const ex = project.extras || {};
  const year = new Date().getFullYear();
  const docs = [];
  docs.push({
    id: "titlepage", title: project.title || "Titel",
    body: `<div class="titlepage"><h1 class="tt">${esc(project.title || "")}</h1><p class="st">${esc(project.subtitle || "")}</p><p class="au">${esc(project.author || "")}</p></div>`,
  });
  docs.push({
    id: "copyright", title: "Copyright",
    body: `<div class="copyright"><p>${S.rights(year, esc(project.author || ""))}</p><p>${S.copy}</p><p>${isRoman ? S.disclaimerFiction : S.disclaimerSelfhelp}</p><p>${S.publisher}</p></div>`,
  });
  const pushExtra = (id, title, content) => {
    if (content && content.trim()) docs.push({ id, title, body: `<h1>${esc(title)}</h1>${blocksToHtml(parseBlocks(content))}` });
  };
  pushExtra("intro", isRoman ? S.prolog : S.intro, ex.einleitung);
  if (!isRoman) pushExtra("howto", S.howto, ex.arbeitsweise);
  project.outline.forEach((ch, i) => {
    docs.push({
      id: `ch${i + 1}`, title: `${S.chapter} ${i + 1}: ${ch.title}`,
      body: `<p class="chnum">${S.chapter} ${i + 1}</p><h1>${esc(ch.title)}</h1>${blocksToHtml(parseBlocks(ch.content))}`,
    });
  });
  pushExtra("closing", isRoman ? S.afterword : S.closing, ex.schlusswort);
  pushExtra("about", S.about, ex.autorin);
  if (!isRoman) pushExtra("bonus", S.bonus, ex.bonus);
  return docs;
}

function buildEpub(project) {
  const lang = project.language || "de";
  const S = BOOK_STRINGS[lang] || BOOK_STRINGS.de;
  const docs = epubDocs(project);
  const uuid = "urn:uuid:" + ("xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  }));
  const font = FONTS[project.settings.font];
  const css = `body{font-family:${font.family};line-height:1.6;}
h1{font-size:1.7em;line-height:1.2;margin:0 0 0.8em;}
h2{font-size:1.3em;margin:1.2em 0 0.4em;} h3{font-size:1.1em;margin:1em 0 0.3em;}
p{margin:0 0 0.6em;} .chnum{font-size:0.8em;letter-spacing:0.2em;text-transform:uppercase;color:#666;}
blockquote{margin:1em 1.5em;font-style:italic;}
.titlepage{text-align:center;margin-top:20%;} .tt{font-size:2em;} .st{font-style:italic;} .au{letter-spacing:0.15em;text-transform:uppercase;margin-top:2em;}
.copyright{font-size:0.85em;margin-top:60%;}
.li{margin:0 0 0.3em 1em;}
.chk{margin:0 0 0.5em;} .box{display:inline-block;width:0.85em;height:0.85em;border:1px solid #333;border-radius:2px;margin-right:0.5em;vertical-align:-0.1em;}
.wlines{margin:0.6em 0 1em;} .wline{border-bottom:1px solid #999;height:1.8em;}
.skala p{margin-bottom:0.3em;} .skrow span{display:inline-block;width:1.5em;height:1.5em;border:1px solid #333;border-radius:50%;text-align:center;line-height:1.5em;margin-right:0.3em;font-size:0.85em;}
.ebox{border:1px solid #333;border-radius:6px;padding:0.8em 1em;margin:1em 0;}
.ebox.tipp{border-style:dashed;}
.elabel{font-weight:bold;font-size:0.8em;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:0.4em;}`;
  const manifest = docs.map((d) => `<item id="${d.id}" href="${d.id}.xhtml" media-type="application/xhtml+xml"/>`).join("\n    ");
  const spine = docs.map((d) => `<itemref idref="${d.id}"/>`).join("\n    ");
  const opf = `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">${uuid}</dc:identifier>
    <dc:title>${esc(project.title || "Ohne Titel")}</dc:title>
    <dc:language>${lang}</dc:language>
    <dc:creator>${esc(project.author || "")}</dc:creator>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z/, "Z")}</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="css" href="style.css" media-type="text/css"/>
    ${manifest}
  </manifest>
  <spine toc="ncx">
    ${spine}
  </spine>
</package>`;
  const navList = docs.map((d) => `<li><a href="${d.id}.xhtml">${esc(d.title)}</a></li>`).join("\n      ");
  const nav = xhtmlWrap(S.contents, `<nav epub:type="toc" xmlns:epub="http://www.idpf.org/2007/ops"><h1>${S.contents}</h1><ol>
      ${navList}
    </ol></nav>`, lang, true);
  const navPoints = docs.map((d, i) => `<navPoint id="np${i + 1}" playOrder="${i + 1}"><navLabel><text>${esc(d.title)}</text></navLabel><content src="${d.id}.xhtml"/></navPoint>`).join("\n    ");
  const ncx = `<?xml version="1.0" encoding="utf-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head><meta name="dtb:uid" content="${uuid}"/><meta name="dtb:depth" content="1"/><meta name="dtb:totalPageCount" content="0"/><meta name="dtb:maxPageNumber" content="0"/></head>
  <docTitle><text>${esc(project.title || "")}</text></docTitle>
  <navMap>
    ${navPoints}
  </navMap>
</ncx>`;
  const entries = [
    { name: "mimetype", data: "application/epub+zip" },
    { name: "META-INF/container.xml", data: `<?xml version="1.0" encoding="utf-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>` },
    { name: "OEBPS/content.opf", data: opf },
    { name: "OEBPS/nav.xhtml", data: nav },
    { name: "OEBPS/toc.ncx", data: ncx },
    { name: "OEBPS/style.css", data: css },
    ...docs.map((d) => ({ name: `OEBPS/${d.id}.xhtml`, data: xhtmlWrap(d.title, d.body, lang, true) })),
  ];
  return new Blob([buildZip(entries)], { type: "application/epub+zip" });
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.rel = "noopener";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/* ------------------------------------------------------------------ */
/*  Export: Digital-Produkt (Smartphone-optimierte PDF)                */
/* ------------------------------------------------------------------ */

const DIGITAL_FORMATS = {
  phone: { label: "Smartphone hoch (9:16) – ohne Zoomen lesbar", w: 113, h: 201 },
  a5:    { label: "A5 / Tablet (14,8 × 21 cm)", w: 148, h: 210 },
  a4:    { label: "A4 – Bildschirm & Selbstausdruck", w: 210, h: 297 },
};

function buildDigitalHtml(project) {
  const d = project.digital;
  const f = DIGITAL_FORMATS[d.format] || DIGITAL_FORMATS.phone;
  const S = BOOK_STRINGS[project.language] || BOOK_STRINGS.de;
  const font = FONTS[project.settings.font];
  const accent = d.accent || "#6C57B8";
  const fs = d.fontSize || 14;
  const align = d.align === "justify" ? "justify" : "left";
  const year = new Date().getFullYear();
  const selChapters = project.outline.filter((ch) => d.sel[ch.id] !== false);
  const ex = project.extras || {};
  const isRoman = project.bookType === "roman";
  const withEx = d.withExtras;

  const tocRows = [];
  if (withEx && ex.einleitung && ex.einleitung.trim()) tocRows.push(isRoman ? S.prolog : S.intro);
  selChapters.forEach((ch) => tocRows.push(ch.title));
  if (withEx && ex.schlusswort && ex.schlusswort.trim()) tocRows.push(isRoman ? S.afterword : S.closing);
  if (withEx && !isRoman && ex.bonus && ex.bonus.trim()) tocRows.push(S.bonus);

  const chapters = selChapters.map((ch, i) => `
    <section class="chapter">
      <div class="ch-num">${S.chapter} ${i + 1}</div>
      <h1>${esc(ch.title)}</h1>
      ${blocksToHtml(parseBlocks(ch.content))}
    </section>`).join("");

  return `<!DOCTYPE html><html lang="${project.language || "de"}"><head><meta charset="utf-8">
  <title>${esc(project.title)} – Digital</title>
  <style>
  @import url('https://fonts.googleapis.com/css2?family=${font.gf}&family=Fraunces:opsz,wght@9..144,500;9..144,700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @page { size: ${f.w}mm ${f.h}mm; margin: 11mm 10mm 13mm 10mm; }
  body { font-family: ${font.family}; font-size: ${fs}pt; line-height: 1.6; color: #26212F; }
  h1 { font-family: 'Fraunces', ${font.family}; font-size: ${fs * 1.7}pt; font-weight: 700; color: ${accent}; margin: 0 0 ${fs}pt; line-height: 1.2; }
  h2 { font-family: 'Fraunces', ${font.family}; font-size: ${fs * 1.25}pt; font-weight: 700; color: ${accent}; margin: ${fs * 1.3}pt 0 ${fs * 0.5}pt; }
  h3 { font-size: ${fs * 1.05}pt; font-weight: 600; margin: ${fs}pt 0 ${fs * 0.35}pt; }
  p { margin: 0 0 ${fs * 0.6}pt; text-align: ${align}; hyphens: auto; -webkit-hyphens: auto; }
  blockquote { margin: ${fs * 0.8}pt 0; padding: ${fs * 0.5}pt ${fs * 0.9}pt; border-left: 3pt solid ${accent}; font-style: italic; background: ${accent}12; border-radius: 0 6pt 6pt 0; }
  .li { display: flex; gap: 6pt; margin: 0 0 4pt 4pt; } .dot { width: 4pt; height: 4pt; border-radius: 50%; background: ${accent}; margin-top: ${fs * 0.55}pt; flex: none; }
  .chk { display: flex; gap: 7pt; margin: 0 0 7pt 2pt; align-items: flex-start; }
  .box { width: 12pt; height: 12pt; border: 1.4pt solid ${accent}; border-radius: 3pt; margin-top: 2pt; flex: none; }
  .wlines { margin: 8pt 0 12pt; } .wline { border-bottom: 0.9pt solid #B9B2CC; height: 26pt; }
  .skala { margin: 8pt 0 12pt; } .skrow { display: flex; gap: 5pt; margin-top: 6pt; flex-wrap: wrap; }
  .skrow span { width: 21pt; height: 21pt; border: 1.2pt solid ${accent}; color: ${accent}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: ${fs * 0.75}pt; font-weight: 600; }
  .ebox { border: 1.4pt solid ${accent}; background: ${accent}0E; border-radius: 8pt; padding: 11pt 12pt; margin: 11pt 0 13pt; }
  .ebox.tipp { border-style: dashed; background: transparent; }
  .elabel { font-family: 'Fraunces', serif; font-weight: 700; font-size: ${fs * 0.8}pt; letter-spacing: 0.12em; text-transform: uppercase; color: ${accent}; margin-bottom: 5pt; }
  .ch-num { font-size: ${fs * 0.8}pt; letter-spacing: 0.25em; text-transform: uppercase; color: ${accent}; margin-bottom: 8pt; }
  .chapter, .front { page-break-before: always; }
  h2, h3 { page-break-after: avoid; } .ebox, .wlines, .skala, .grp { page-break-inside: avoid; }
  .coverpage { page-break-before: avoid; background: ${accent}; color: #fff; border-radius: 10pt; min-height: 92vh; display: flex; flex-direction: column; justify-content: center; text-align: center; padding: 8%; }
  .coverpage .tt { font-family: 'Fraunces', serif; font-size: ${fs * 2.2}pt; font-weight: 700; line-height: 1.15; margin-bottom: 12pt; }
  .coverpage .st { font-size: ${fs * 1.1}pt; font-style: italic; opacity: 0.92; margin-bottom: 30pt; }
  .coverpage .au { font-size: ${fs * 0.95}pt; letter-spacing: 0.15em; text-transform: uppercase; }
  .coverpage .imprint { margin-top: 40pt; font-size: ${fs * 0.7}pt; opacity: 0.75; }
  .toc h1 { margin-bottom: ${fs * 1.4}pt; }
  .toc .trow { border-bottom: 0.7pt dotted #B9B2CC; padding: 6pt 0; }
  .printbar { position: fixed; top: 12px; right: 12px; z-index: 99; font-family: sans-serif; }
  .printbar button { background: ${accent}; color: #fff; border: 0; border-radius: 8px; padding: 12px 18px; font-size: 15px; cursor: pointer; }
  .printbar p { background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 8px 10px; font-size: 12px; max-width: 270px; margin-top: 8px; }
  @media print { .printbar { display: none; } }
  </style></head><body>
  <div class="printbar"><button onclick="window.print()">Als PDF speichern</button>
  <p>Druckdialog: Ziel „Als PDF speichern", „Hintergrundgrafiken" AN, „Kopf- und Fußzeilen" AUS (unter „Weitere Einstellungen").</p></div>
  <div class="coverpage">
    <div class="tt">${esc(project.title || "Ohne Titel")}</div>
    <div class="st">${esc(project.subtitle || "")}</div>
    <div class="au">${esc(project.author || "")}</div>
    <div class="imprint">© ${year} ${esc(project.author || "")} · ${S.publisher}</div>
  </div>
  <div class="front toc"><h1>${S.contents}</h1>${tocRows.map((r) => `<div class="trow">${esc(r)}</div>`).join("")}</div>
  ${withEx ? extraSection(isRoman ? S.prolog : S.intro, ex.einleitung) : ""}
  ${chapters}
  ${withEx ? extraSection(isRoman ? S.afterword : S.closing, ex.schlusswort) : ""}
  ${withEx && !isRoman ? extraSection(S.bonus, ex.bonus) : ""}
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
  .frontp { left: ${bleed + trim.w + spine}mm; width: ${trim.w + bleed}mm; padding: ${bleed + safe}mm ${bleed + safe + 2}mm ${bleed + safe}mm ${safe + 4}mm; display: flex; flex-direction: column; justify-content: center; text-align: center; ${project.cover.imageUrl ? `background: linear-gradient(${bg}D9, ${bg}8C), url('${project.cover.imageUrl}') center/cover no-repeat;` : ""} }
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
  <div>Gesamtmaß: ${W} × ${H} mm · Buchrücken: ${spine} mm bei ${pages} Seiten (${project.cover.paper === "white" ? "weißes" : "cremefarbenes"} Papier). „Hintergrundgrafiken" AN und „Kopf- und Fußzeilen" AUS (unter „Weitere Einstellungen" im Druckdialog)!</div></div>
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

/* ------------------------------------------------------------------ */
/*  Paket A/B/D: Lesbarkeit, Zitate, Übungen, Hörbuch, Landingpage     */
/* ------------------------------------------------------------------ */

const FILLERS = ["eigentlich", "quasi", "halt", "irgendwie", "sozusagen", "gewissermaßen", "letztendlich", "im grunde", "ziemlich", "durchaus", "gleichsam", "praktisch gesehen"];

function readabilityOf(text) {
  const plain = String(text || "").replace(/[#>*_\[\]:]/g, " ").replace(/-\s\[\s\]/g, " ");
  const sentences = plain.split(/[.!?…]+\s/).map((s) => s.trim()).filter((s) => countWords(s) > 2);
  const lens = sentences.map((s) => countWords(s));
  const avg = lens.length ? lens.reduce((a, b) => a + b, 0) / lens.length : 0;
  const long = lens.filter((l) => l > 25).length;
  const lower = " " + plain.toLowerCase().replace(/[.,!?;:]/g, " ") + " ";
  const fill = FILLERS.reduce((n, f) => n + (lower.split(" " + f + " ").length - 1), 0);
  return { avg: Math.round(avg * 10) / 10, long, fill };
}

function collectQuotes(project) {
  const out = [];
  project.outline.forEach((ch) => {
    parseBlocks(ch.content).forEach((b) => {
      if (b.t === "quote" && b.x && b.x.length > 15 && b.x.length < 180) out.push(tidy(b.x).replace(/\*\*/g, ""));
    });
  });
  return [...new Set(out)].slice(0, 12);
}

function collectExercises(project) {
  const out = [];
  project.outline.forEach((ch, ci) => {
    parseBlocks(ch.content).forEach((b) => {
      if (b.t === "box" && b.kind !== "tipp") out.push({ title: b.title || `Übung aus Kapitel ${ci + 1}`, chapter: ch.title, block: b });
    });
  });
  return out.slice(0, 20);
}

function blocksToAudio(blocks) {
  return blocks.map((b) => {
    switch (b.t) {
      case "h2": case "h3": return `\n${tidy(b.x).replace(/\*\*/g, "")}.\n`;
      case "p": return tidy(b.x).replace(/\*\*/g, "");
      case "quote": return `Merke dir: ${tidy(b.x).replace(/\*\*/g, "")}`;
      case "li": case "oli": return `– ${tidy(b.x).replace(/\*\*/g, "")}`;
      case "check": return `Aufgabe: ${tidy(b.x).replace(/\*\*/g, "")}`;
      case "lines": return "[PAUSE – Zeit zum Nachdenken oder Mitschreiben]";
      case "skala": return `${tidy(b.x).replace(/\*\*/g, "")} Überlege dir einen Wert zwischen eins und zehn. [KURZE PAUSE]`;
      case "box": return `\n${b.kind === "tipp" ? "Ein Tipp für dich" : "Eine Übung"}${b.title ? `: ${b.title}` : ""}.\n` + blocksToAudio(b.children);
      default: return "";
    }
  }).filter(Boolean).join("\n");
}

function buildAudioScript(project) {
  const S = BOOK_STRINGS[project.language] || BOOK_STRINGS.de;
  const ex = project.extras || {};
  let out = `HÖRBUCH-SKRIPT\n${"=".repeat(50)}\n${project.title}\n${project.subtitle}\nvon ${project.author}\n\n[SPRECHHINWEIS: Warmer, ruhiger Ton. Bei [PAUSE] 3–5 Sekunden stille lassen. Übungen langsamer und deutlicher sprechen.]\n`;
  if (ex.einleitung && ex.einleitung.trim()) out += `\n\n===== ${S.intro} =====\n\n${blocksToAudio(parseBlocks(ex.einleitung))}`;
  project.outline.forEach((ch, i) => {
    out += `\n\n===== ${S.chapter} ${i + 1}: ${ch.title} =====\n\n${blocksToAudio(parseBlocks(ch.content))}`;
  });
  if (ex.schlusswort && ex.schlusswort.trim()) out += `\n\n===== ${S.closing} =====\n\n${blocksToAudio(parseBlocks(ex.schlusswort))}`;
  return out;
}

function buildPrintableHtml(project, exercise) {
  const accent = project.digital.accent || "#6C57B8";
  const font = FONTS[project.settings.font];
  return `<!DOCTYPE html><html lang="${project.language || "de"}"><head><meta charset="utf-8">
  <title>${esc(exercise.title)}</title>
  <style>
  @import url('https://fonts.googleapis.com/css2?family=${font.gf}&family=Fraunces:opsz,wght@9..144,500;9..144,700&display=swap');
  * { box-sizing: border-box; margin: 0; }
  @page { size: 210mm 297mm; margin: 0; }
  html, body { width: 210mm; min-height: 297mm; }
  body { font-family: ${font.family}; font-size: 13pt; line-height: 1.65; color: #26212F; padding: 18mm 17mm; }
  .head { border-bottom: 3pt solid ${accent}; padding-bottom: 8mm; margin-bottom: 10mm; }
  .kicker { font-size: 10pt; letter-spacing: 0.22em; text-transform: uppercase; color: ${accent}; margin-bottom: 4mm; }
  h1 { font-family: 'Fraunces', serif; font-size: 26pt; color: ${accent}; line-height: 1.15; }
  p { margin: 0 0 5mm; }
  .chk { display: flex; gap: 8pt; margin: 0 0 8pt 2pt; } .box { width: 13pt; height: 13pt; border: 1.5pt solid ${accent}; border-radius: 3pt; margin-top: 3pt; flex: none; }
  .li { display: flex; gap: 7pt; margin: 0 0 4pt 4pt; } .dot { width: 4pt; height: 4pt; border-radius: 50%; background: ${accent}; margin-top: 8pt; flex: none; }
  .wlines { margin: 6mm 0; } .wline { border-bottom: 1pt solid #B9B2CC; height: 11mm; }
  .skala { margin: 6mm 0; } .skrow { display: flex; gap: 3mm; margin-top: 3mm; }
  .skrow span { width: 9mm; height: 9mm; border: 1.3pt solid ${accent}; color: ${accent}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10pt; font-weight: 600; }
  .ebox, .elabel { border: 0; padding: 0; margin: 0; } .elabel { display: none; }
  h2, h3, blockquote { color: ${accent}; margin: 5mm 0 2mm; font-size: 14pt; }
  .foot { position: fixed; bottom: 12mm; left: 17mm; right: 17mm; border-top: 1pt solid #E0DCEA; padding-top: 3mm; font-size: 9pt; color: #8B84A0; display: flex; justify-content: space-between; }
  .printbar { position: fixed; top: 12px; right: 12px; font-family: sans-serif; }
  .printbar button { background: ${accent}; color: #fff; border: 0; border-radius: 8px; padding: 12px 18px; font-size: 15px; cursor: pointer; }
  @media print { .printbar { display: none; } }
  </style></head><body>
  <div class="printbar"><button onclick="window.print()">Als PDF speichern</button></div>
  <div class="head"><div class="kicker">${esc(project.title || "")}</div><h1>${esc(exercise.title)}</h1></div>
  ${blocksToHtml(exercise.block.children)}
  <div class="foot"><span>© ${new Date().getFullYear()} ${esc(project.author || "")}</span><span>${esc(project.subtitle || "")}</span></div>
  </body></html>`;
}

function buildLandingHtml(project) {
  const accent = project.digital.accent || "#6C57B8";
  const font = FONTS[project.settings.font];
  const ex = project.extras || {};
  const firstCh = project.outline[0];
  const sample = (ex.einleitung && ex.einleitung.trim() ? blocksToHtml(parseBlocks(ex.einleitung)) : "") +
    (firstCh ? `<h2>${esc(firstCh.title)}</h2>` + blocksToHtml(parseBlocks((firstCh.content || "").split("\n\n").slice(0, 6).join("\n\n"))) : "");
  const benefits = project.outline.slice(0, 6).map((ch) => `<li>${esc(ch.title)}</li>`).join("");
  return `<!DOCTYPE html><html lang="${project.language || "de"}"><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(project.title)} – ${esc(project.author)}</title>
  <!-- ANLEITUNG: [KAUF-LINK] durch deinen Shop-/Amazon-Link ersetzen und das E-Mail-Formular
       durch den Einbett-Code deines Newsletter-Anbieters (z. B. MailerLite, Brevo) austauschen.
       Impressum-/Datenschutz-Links unten anpassen (in DE Pflicht). -->
  <style>
  @import url('https://fonts.googleapis.com/css2?family=${font.gf}&family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Inter:wght@400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; }
  body { font-family: 'Inter', sans-serif; color: #26212F; line-height: 1.65; }
  .hero { background: ${accent}; color: #fff; text-align: center; padding: 72px 20px 64px; }
  .hero h1 { font-family: 'Fraunces', serif; font-size: clamp(30px, 5vw, 52px); line-height: 1.12; max-width: 800px; margin: 0 auto 16px; }
  .hero .st { font-size: clamp(16px, 2.4vw, 21px); opacity: 0.93; max-width: 640px; margin: 0 auto 14px; font-style: italic; }
  .hero .au { letter-spacing: 0.16em; text-transform: uppercase; font-size: 13px; opacity: 0.85; margin-bottom: 34px; }
  .cta { display: inline-block; background: #fff; color: ${accent}; font-weight: 600; padding: 15px 34px; border-radius: 999px; text-decoration: none; font-size: 17px; }
  section { max-width: 720px; margin: 0 auto; padding: 56px 20px; }
  h2 { font-family: 'Fraunces', serif; font-size: 28px; margin-bottom: 18px; color: ${accent}; }
  ul.benefits { list-style: none; padding: 0; }
  ul.benefits li { padding: 10px 0 10px 34px; position: relative; border-bottom: 1px dashed #E5E1EF; }
  ul.benefits li::before { content: "✓"; position: absolute; left: 4px; color: ${accent}; font-weight: 700; }
  .probe { background: #FAF9FC; border: 1px solid #EAE6F2; border-radius: 16px; padding: 30px; font-family: ${font.family}; font-size: 17px; }
  .probe h2 { font-size: 22px; } .probe p { margin-bottom: 12px; }
  .probe .fade { height: 90px; background: linear-gradient(transparent, #FAF9FC); margin-top: -90px; position: relative; }
  .signup { background: ${accent}14; border-radius: 16px; padding: 34px; text-align: center; }
  .signup input { padding: 13px 16px; border: 1px solid #CFC8E0; border-radius: 10px; font-size: 15px; width: min(320px, 100%); margin: 12px 6px 6px 0; }
  .signup button { padding: 13px 26px; background: ${accent}; color: #fff; border: 0; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; }
  footer { text-align: center; font-size: 12.5px; color: #8B84A0; padding: 34px 20px 44px; }
  footer a { color: inherit; }
  .wlines, .wline, .skala, .ebox { display: none; }
  blockquote { border-left: 3px solid ${accent}; padding-left: 14px; font-style: italic; margin: 14px 0; }
  </style></head><body>
  <div class="hero">
    <h1>${esc(project.title)}</h1>
    <div class="st">${esc(project.subtitle)}</div>
    <div class="au">von ${esc(project.author)}</div>
    <a class="cta" href="[KAUF-LINK]">Jetzt lesen →</a>
  </div>
  <section>
    <h2>Das erwartet dich</h2>
    <p>${esc(project.promise)}</p>
    <ul class="benefits">${benefits}</ul>
  </section>
  <section>
    <h2>Lies kostenlos hinein</h2>
    <div class="probe">${sample}<div class="fade"></div></div>
    <p style="text-align:center;margin-top:22px"><a class="cta" style="background:${accent};color:#fff" href="[KAUF-LINK]">Weiterlesen – jetzt holen →</a></p>
  </section>
  <section>
    <div class="signup">
      <h2>Gratis-Kapitel per E-Mail</h2>
      <p>Trage dich ein und erhalte die Leseprobe als PDF direkt in dein Postfach.</p>
      <input type="email" placeholder="Deine E-Mail-Adresse"><button>Leseprobe holen</button>
      <p style="font-size:12px;color:#7A7392;margin-top:10px">Hinweis: Dieses Formular durch den Einbett-Code deines Newsletter-Tools ersetzen.</p>
    </div>
  </section>
  <footer>© ${new Date().getFullYear()} ${esc(project.author)} · <a href="[IMPRESSUM-LINK]">Impressum</a> · <a href="[DATENSCHUTZ-LINK]">Datenschutz</a></footer>
  </body></html>`;
}

function download(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/* ------------------------------------------------------------------ */
/*  Import: vorhandenes Manuskript (PDF) einlesen                      */
/* ------------------------------------------------------------------ */

let pdfjsLoadPromise = null;
function loadScriptTag(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error("Skript nicht erreichbar: " + src));
    document.head.appendChild(s);
  });
}
function loadPdfJs() {
  if (typeof window !== "undefined" && window.pdfjsLib && window.pdfjsWorker) return Promise.resolve(window.pdfjsLib);
  if (pdfjsLoadPromise) return pdfjsLoadPromise;
  pdfjsLoadPromise = (async () => {
    await loadScriptTag("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.min.js");
    /* Worker-Skript als normales Skript laden: die Sandbox erlaubt keine echten
       Web-Worker, daher läuft die PDF-Verarbeitung im Hauptthread ("fake worker").
       pdf.js erkennt window.pdfjsWorker automatisch und lädt nichts weiter nach. */
    await loadScriptTag("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js");
    const lib = window.pdfjsLib;
    if (!lib) throw new Error("pdf.js hat sich nicht korrekt initialisiert");
    if (!window.pdfjsWorker && window["pdfjs-dist/build/pdf.worker"]) {
      window.pdfjsWorker = window["pdfjs-dist/build/pdf.worker"];
    }
    return lib;
  })();
  pdfjsLoadPromise.catch(() => { pdfjsLoadPromise = null; });
  return pdfjsLoadPromise;
}

/* Textzeilen aus rohen PDF-Textfragmenten gruppieren (nach Y-Position) */
function linesFromItems(items) {
  const sorted = [...items].sort((a, b) => (b.y - a.y) || (a.x - b.x));
  const lines = [];
  let cur = null;
  const TOL = 2.2;
  for (const it of sorted) {
    if (!it.str.trim() && !cur) continue;
    if (cur && Math.abs(it.y - cur.y) <= TOL) {
      const sep = /\s$/.test(cur.str) || /^\s/.test(it.str) ? "" : " ";
      cur.str += sep + it.str;
      cur.h = Math.max(cur.h, it.h);
    } else {
      if (cur) lines.push(cur);
      cur = { str: it.str, y: it.y, h: it.h || 10 };
    }
  }
  if (cur) lines.push(cur);
  return lines.filter((l) => l.str.trim());
}

/* Aus allen Seiten Fließtext rekonstruieren: Kopf-/Fußzeilen entfernen,
   Zeilen zu Absätzen zusammenführen, große Überschriften mit ===  markieren. */
function reconstructText(allPagesLines) {
  const freq = {};
  allPagesLines.forEach((lines) => {
    if (!lines.length) return;
    [lines[0].str.trim(), lines[lines.length - 1].str.trim()].forEach((t) => {
      const key = t.replace(/\d+/g, "#");
      if (key) freq[key] = (freq[key] || 0) + 1;
    });
  });
  const pageCount = allPagesLines.length || 1;
  const noise = new Set(Object.keys(freq).filter((k) => freq[k] >= Math.max(3, pageCount * 0.4)));

  /* Seiten des ORIGINAL-Inhaltsverzeichnisses erkennen und komplett überspringen –
     das Tool erzeugt beim Export ein eigenes, aktuelles Inhaltsverzeichnis. */
  const isTocPage = (lines) => {
    if (!lines.length) return false;
    const entryLike = lines.filter((l) => {
      const t = l.str.trim();
      return t.length > 6 && /\s\d{1,3}$/.test(t);
    }).length;
    const hasTocTitle = lines.some((l) =>
      /^(inhaltsverzeichnis|inhalt|contents|table of contents|table des mati\u00e8res|\u00edndice|indice)$/i.test(l.str.trim()));
    return (entryLike >= 4 && entryLike / lines.length >= 0.4) || (hasTocTitle && entryLike >= 2);
  };

  const cleanPages = allPagesLines.map((lines) => {
    if (isTocPage(lines)) return [];
    return lines.filter((l, idx) => {
      const t = l.str.trim();
      if (/^\d{1,4}$/.test(t)) return false;                                   /* nackte Seitenzahl */
      const nearEdge = idx <= 1 || idx >= lines.length - 2;
      if (nearEdge && /^\d{1,4}\s*[|·—–-]/.test(t) && t.length < 40) return false;   /* Fußzeile "2 | Titel" */
      if (nearEdge && /[|·—–-]\s*\d{1,4}$/.test(t) && t.length < 40) return false;   /* Fußzeile "Titel | 2" */
      const key = t.replace(/\d+/g, "#");
      const isEdge = idx === 0 || idx === lines.length - 1;
      if (isEdge && noise.has(key)) return false;
      return true;
    });
  });

  const heights = [];
  cleanPages.forEach((lines) => lines.forEach((l) => heights.push(l.h)));
  heights.sort((a, b) => a - b);
  const median = heights.length ? heights[Math.floor(heights.length / 2)] : 10;

  /* Überschriften-Kandidaten sammeln und in zwei Ebenen einteilen:
     Nur die GRÖSSTE Ebene (bzw. typische Kapitel-Muster) wird zum Kapitelanfang,
     kleinere Überschriften bleiben als ##-Zwischenüberschriften IM Kapitel. */
  const candHeights = [];
  cleanPages.forEach((lines) => lines.forEach((l) => {
    const t = l.str.trim();
    if (l.h > median * 1.2 && t.length < 80 && !/[.,;:]$/.test(t)) candHeights.push(l.h);
  }));
  candHeights.sort((a, b) => b - a);
  const maxHeadH = candHeights.length ? candHeights[0] : median * 2;
  const chapterMinH = Math.max(median * 1.45, maxHeadH * 0.88);
  const CH_PATTERN = /^(kapitel|chapter|cap[i\u00ed]tulo|chapitre|capitolo|teil|part|prolog|epilog(ue)?|vorwort|nachwort|einleitung|introduction|foreword|afterword|schlusswort)\b/i;
  const CAPS_CHAPTER = /^(EINLEITUNG|VORWORT|PROLOG|EPILOG|NACHWORT|SCHLUSSWORT|SCHLUSSGEDANKEN|AUTORENNOTIZ|DANKSAGUNG|INTRODUCTION|FOREWORD|PREFACE|EPILOGUE|AFTERWORD|CONCLUSION)\b/;
  const ALLCAPS = /^[A-Z\u00c4\u00d6\u00dc0-9 \-\u2013&:!?.]{4,42}$/;
  const stripPageNo = (t) => t.replace(/\s+\d{1,3}$/, "").trim();

  const out = [];
  cleanPages.forEach((lines) => {
    let prev = null;
    lines.forEach((l) => {
      const text = l.str.trim();
      if (!text) return;
      const isBig = l.h > median * 1.2 && text.length < 80 && !/[.,;:]$/.test(text);
      /* Kapitel-typische Namen erkennen wir auch in normaler Schriftgröße
         (kurze Zeile, max. 6 Wörter): "Kapitel 2", "Vorwort", "EINLEITUNG" … */
      const chapterName = text.length < 40 && countWords(text) <= 6 && !/[.,;:]$/.test(text) &&
        (CH_PATTERN.test(text) || CAPS_CHAPTER.test(text));
      if (isBig || chapterName) {
        const isChapter = chapterName || l.h >= chapterMinH;
        if (isChapter) {
          out.push(""); out.push("==="); out.push(stripPageNo(text)); out.push("");
        } else {
          out.push(""); out.push("## " + stripPageNo(text)); out.push("");
        }
        prev = null;
        return;
      }
      /* Kurze GROSSBUCHSTABEN-Labels (z. B. FALLBEISPIEL, ÜBUNG) als kleine Überschrift erhalten */
      if (ALLCAPS.test(text) && /[A-Z\u00c4\u00d6\u00dc]{4}/.test(text.replace(/[^A-Z\u00c4\u00d6\u00dc]/g, "")) && prev !== null) {
        out.push(""); out.push("### " + text); out.push("");
        prev = l;
        return;
      }
      if (prev == null) {
        out.push(text);
      } else {
        const gap = prev.y - l.y;
        const bigGap = gap > prev.h * 1.9;
        const lastOut = out.length ? out[out.length - 1] : "";
        if (bigGap || !lastOut || lastOut.startsWith("## ") || lastOut.startsWith("### ")) {
          out.push(text);
        } else if (/[a-zäöüß]-$/.test(lastOut)) {
          out[out.length - 1] = lastOut.slice(0, -1) + text;
        } else {
          out[out.length - 1] = lastOut + " " + text;
        }
      }
      prev = l;
    });
    out.push("");
  });
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/* Rohtext anhand von "==="-Trennzeilen in Kapitel aufteilen */
function splitIntoChapters(raw) {
  const lines = raw.split("\n");
  const blocks = [];
  let cur = [];
  for (const ln of lines) {
    if (ln.trim() === "===") {
      if (cur.length) blocks.push(cur);
      cur = [];
    } else {
      cur.push(ln);
    }
  }
  if (cur.length) blocks.push(cur);
  const chapters = blocks
    .map((b) => b.join("\n").trim())
    .filter(Boolean)
    .map((block, i) => {
      const ls = block.split("\n");
      const title = (ls[0] || "").trim();
      const rest = ls.slice(1).join("\n").trim();
      if (!rest || title.length > 80) {
        return { id: Date.now() + i + Math.random(), title: `Kapitel ${i + 1}`, goal: "", content: block };
      }
      return { id: Date.now() + i + Math.random(), title: title || `Kapitel ${i + 1}`, goal: "", content: rest };
    });
  /* Sehr kurze "Kapitel" sind fast immer fälschlich abgetrennte Zwischenüberschriften
     → zurück ins vorherige Kapitel verschmelzen (als ##-Überschrift). */
  const merged = [];
  for (const ch of chapters) {
    if (merged.length && countWords(ch.content) < 80) {
      const prev = merged[merged.length - 1];
      prev.content = (prev.content + "\n\n## " + ch.title + "\n" + (ch.content || "")).trim();
    } else {
      merged.push(ch);
    }
  }
  return merged;
}

/* Typografie-Bereinigung: Abstände, Satzzeichen, Anführungszeichen.
   Konservative Regeln, die das Workbook-Markup (##, :::, [linien:x], - [ ]) nicht anfassen. */
function cleanText(t, lang) {
  let s = String(t || "");
  s = s.replace(/\u00A0/g, " ");                            /* geschützte Leerzeichen */
  s = s.replace(/[ \t]+\n/g, "\n");                          /* Leerzeichen am Zeilenende */
  s = s.replace(/[ \t]{2,}/g, " ");                          /* Mehrfach-Leerzeichen */
  s = s.replace(/ ([.,!?;:])/g, "$1");                       /* Leerzeichen VOR Satzzeichen */
  s = s.replace(/,([A-Za-zÄÖÜäöüß])/g, ", $1");              /* fehlendes Leerzeichen nach Komma */
  s = s.replace(/([a-zäöüß])\.([A-ZÄÖÜ])/g, "$1. $2");       /* fehlendes Leerzeichen nach Punkt */
  s = s.replace(/([!?])([A-Za-zÄÖÜäöüß])/g, "$1 $2");        /* fehlendes Leerzeichen nach ! und ? */
  s = s.replace(/\.\.\./g, "…");                             /* Auslassungspunkte */
  s = s.replace(/ - /g, " – ");                              /* Gedankenstrich */
  s = s.replace(/\n{3,}/g, "\n\n");                          /* zu viele Leerzeilen */
  if (lang === "de") {
    s = s.replace(/(^|[\s([])"/g, "$1\u201E").replace(/"/g, "\u201C");
  } else {
    s = s.replace(/(^|[\s([])"/g, "$1\u201C").replace(/"/g, "\u201D");
  }
  s = s.replace(/([A-Za-zÄÖÜäöüß])'([A-Za-zÄÖÜäöüß])/g, "$1\u2019$2"); /* Apostroph */
  return s.trim();
}

/* Text an Absatzgrenzen in Stücke von max. maxWords Wörtern teilen (für Übersetzung) */
function chunkByWords(text, maxWords) {
  const paras = String(text || "").split(/\n\n+/);
  const chunks = [];
  let cur = [];
  let n = 0;
  for (const p of paras) {
    const w = countWords(p);
    if (n + w > maxWords && cur.length) { chunks.push(cur.join("\n\n")); cur = []; n = 0; }
    cur.push(p); n += w;
    if (w > maxWords) { chunks.push(cur.join("\n\n")); cur = []; n = 0; }
  }
  if (cur.length) chunks.push(cur.join("\n\n"));
  return chunks.filter((c) => c.trim());
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
  const [imp, setImp] = useState({ raw: "", busy: false, err: null, fileName: "" });
  const [confirmArm, setConfirmArm] = useState(null);
  const [transTarget, setTransTarget] = useState("en");
  const [notice, setNotice] = useState(null);
  const armTimer = useRef(null);
  const stopRef = useRef(false);

  const arm = (key) => {
    setConfirmArm(key);
    clearTimeout(armTimer.current);
    armTimer.current = setTimeout(() => setConfirmArm(null), 6000);
  };

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
  const upPub = (patch) => setProject((p) => ({ ...p, pub: { ...p.pub, ...patch } }));
  const upDigital = (patch) => setProject((p) => ({ ...p, digital: { ...p.digital, ...patch } }));
  const toggleDigitalCh = (id) => setProject((p) => ({ ...p, digital: { ...p.digital, sel: { ...p.digital.sel, [id]: p.digital.sel[id] === false ? true : false } } }));
  const togglePubCheck = (k) => setProject((p) => ({ ...p, pub: { ...p.pub, checks: { ...p.pub.checks, [k]: !p.pub.checks[k] } } }));
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
    if (confirmArm !== "delproj") { arm("delproj"); return; }
    setConfirmArm(null);
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
    const isWb = project.bookType === "workbook";
    const rows = project.outline.map((ch, i) => {
      const c = ch.content || "";
      return {
        i, title: ch.title,
        words: countWords(c),
        uebung: !isWb || /:::\s*(uebung|übung)/i.test(c),
        linien: !isWb || /\[linien:/i.test(c),
        check: !isWb || /- \[ \]/.test(c) || /\[skala\]/i.test(c),
      };
    });
    const missingExtras = extrasFor(project.bookType).filter((d) => !(project.extras[d.key] || "").trim()).map((d) => d.label);
    return { rows, missingExtras, isWb };
  }, [project.outline, project.extras, project.bookType]);

  /* ---- Pre-Flight: KDP-Vorgaben prüfen ---- */
  const preflight = useMemo(() => {
    const c = [];
    const add = (level, text) => c.push({ level, text });
    const binding = project.pub.binding;
    const pages = project.cover.pageCount || 0;
    const estPages = pages || stats.pages;
    const titleLen = (project.title || "").length + (project.subtitle || "").length;

    if (!project.title.trim()) add("err", "Kein Titel eingetragen (Schritt 1).");
    else if (titleLen > 200) add("warn", `Titel + Untertitel haben zusammen ${titleLen} Zeichen – KDP erlaubt max. 200.`);
    else add("ok", "Titel & Untertitel vorhanden und innerhalb des KDP-Limits.");

    if (!project.author.trim()) add("err", "Kein Autorname eingetragen (Schritt 1) – ohne Autor lehnt KDP den Upload ab.");
    else add("ok", "Autorname vorhanden.");

    const empty = project.outline.filter((ch) => countWords(ch.content) < 30);
    if (!project.outline.length) add("err", "Noch keine Kapitel vorhanden.");
    else if (empty.length) add("warn", `${empty.length} Kapitel sind (fast) leer: ${empty.slice(0, 3).map((ch) => `„${ch.title}"`).join(", ")}${empty.length > 3 ? " …" : ""}`);
    else add("ok", `Alle ${project.outline.length} Kapitel haben Inhalt.`);

    const minP = binding === "hardcover" ? 75 : 24;
    const maxP = binding === "hardcover" ? 550 : 828;
    if (!pages) add("warn", "Finale Seitenzahl fehlt (im Cover-Schritt eintragen, sobald dein Print-PDF fertig ist). Bis dahin gilt die Schätzung.");
    if ((estPages || 0) > 0 && estPages < minP) add("err", `${estPages} Seiten – KDP-Minimum für ${binding === "hardcover" ? "Hardcover ist 75" : "Taschenbücher ist 24"} Seiten.`);
    else if ((estPages || 0) > maxP) add("err", `${estPages} Seiten – KDP-Maximum für dieses Format ist ${maxP}.`);
    else if (estPages) add("ok", `Seitenzahl ${estPages} liegt im erlaubten Bereich (${minP}–${maxP}).`);

    const g = GUTTERS[project.settings.pages];
    const usedPages = pages || 0;
    if (usedPages) {
      const [lo, hi] = project.settings.pages.split("-").map((n) => parseInt(n, 10));
      if (usedPages < lo || usedPages > hi) add("warn", `Bundsteg-Einstellung „${g.label}" passt nicht zu deinen ${usedPages} Seiten – in der Formatierung anpassen und Print-PDF neu erzeugen.`);
      else add("ok", `Bundsteg (${g.mm} mm) passt zur Seitenzahl.`);
    }

    const desc = (project.kdp && project.kdp.beschreibung) || "";
    if (!desc) add("warn", "Noch keine Buchbeschreibung – im Schritt „KDP-Paket“ generieren.");
    else if (desc.length > 4000) add("warn", `Beschreibung hat ${desc.length} Zeichen – KDP erlaubt max. 4000.`);
    else add("ok", "Buchbeschreibung vorhanden (unter 4000 Zeichen).");

    const kws = (project.kdp && project.kdp.keywords) || [];
    if (!kws.length) add("warn", "Noch keine Keywords – im Schritt „KDP-Paket“ generieren.");
    else {
      const tooLong = kws.filter((k) => k.length > 50);
      if (tooLong.length) add("warn", `${tooLong.length} Keyword(s) über 50 Zeichen – KDP schneidet sie ab.`);
      else add("ok", `${kws.length} Keywords vorhanden, alle innerhalb des Limits.`);
    }

    const allText = project.outline.map((ch) => ch.content).join("\n") + "\n" + Object.values(project.extras).join("\n");
    if (allText.includes("[DEIN-LINK]")) add("warn", "Der Platzhalter [DEIN-LINK] steht noch im Text (Bonus-Seite) – vor dem Export durch deinen echten Link ersetzen oder die Bonus-Seite leeren.");
    if (audit.missingExtras.length) add("warn", `Buchgerüst unvollständig: ${audit.missingExtras.join(", ")} (Schritt 3).`);
    else add("ok", "Buchgerüst komplett (Einleitung, Schlusswort & Co.).");

    if (!project.cover.blurb) add("warn", "Kein Klappentext für die Buchrückseite – im Cover-Schritt generieren.");
    else add("ok", "Klappentext vorhanden.");

    const errs = c.filter((x) => x.level === "err").length;
    const warns = c.filter((x) => x.level === "warn").length;
    return { checks: c, errs, warns };
  }, [project, audit.missingExtras, stats.pages]);

  /* ---- KI-Aktionen ---- */
  const run = async (tag, fn) => {
    setLoading(tag); setError(null);
    try { await fn(); }
    catch (e) { setError(`Das hat nicht geklappt (${e.message}). Bitte erneut versuchen.`); }
    setLoading(null);
  };

  const genIdeas = () => run("ideas", async () => {
    const typeLabel = project.bookType === "roman" ? "Roman-Konzepte" : project.bookType === "ratgeber" ? "Ratgeber-Konzepte" : "Workbook-Konzepte";
    const market = project.language === "en" ? "für den englischsprachigen Amazon-Markt (US/UK) – ALLE Felder auf ENGLISCH" : "für den deutschen Amazon-Markt";
    const arr = await askClaude(
      SYS_AUTOR,
      `Nische/Fokus: "${project.niche}". Entwickle 4 verkaufsstarke ${typeLabel} für Amazon KDP ${market}. Antworte NUR mit einem JSON-Array, keine Erklärungen:
[{"titel":"prägnanter Titel","untertitel":"Nutzen-Untertitel mit Keywords","zielgruppe":"max 10 Wörter","versprechen":"max 12 Wörter"}] Kompakt, ohne Zeilenumbrüche.`,
      true
    );
    up({ ideas: Array.isArray(arr) ? arr : [] });
  });

  const pickIdea = (idea) => {
    up({ title: idea.titel, subtitle: idea.untertitel, audience: idea.zielgruppe, promise: idea.versprechen });
  };

  const genTrends = () => run("trends", async () => {
    const market = project.language === "en" ? "amazon.com (englischsprachiger Markt)" : "amazon.de (deutscher Markt)";
    const typeLabel = project.bookType === "roman" ? "Romane" : project.bookType === "ratgeber" ? "Ratgeber" : "Workbooks & Arbeitsbücher";
    const data = await askClaudeWithSearch(
      `Du bist KDP-Marktanalyst:in. Du recherchierst per Websuche aktuelle Bestseller-Themen und Nachfrage-Trends für Self-Publisher. Heute ist ${new Date().toLocaleDateString("de-DE")}.`,
      `Recherchiere per Websuche: Welche Themen und Unter-Nischen verkaufen sich aktuell am besten auf ${market} im Bereich "${project.niche}" (Buchtyp: ${typeLabel})? Suche nach Amazon-Bestsellerlisten, KDP-Nischen-Analysen und aktuellen Themen-Trends. Leite daraus 3 konkrete, ORIGINALE Buchchancen ab (keine Kopien bestehender Titel). Antworte NUR mit kompaktem JSON:
{"trends":[{"thema":"Unter-Nische/Thema, max 8 Wörter","warum":"Beleg aus der Recherche, max 20 Wörter","nachfrage":"hoch|mittel","wettbewerb":"niedrig|mittel|hoch","idee":{"titel":"origineller Titel","untertitel":"Nutzen-Untertitel","zielgruppe":"max 8 Wörter","versprechen":"max 10 Wörter"}}]}`,
      true
    );
    up({ trends: Array.isArray(data.trends) ? data.trends : [] });
  });

  const pickTrend = (t) => {
    up({ niche: t.thema, title: t.idee.titel, subtitle: t.idee.untertitel, audience: t.idee.zielgruppe, promise: t.idee.versprechen });
    setNotice(`Trend-Idee „${t.idee.titel}" übernommen. Du kannst sie unten in den Buchdaten anpassen oder direkt zur Gliederung weitergehen.`);
  };

  const genDigitalIdeas = () => run("digideas", async () => {
    const market = project.language === "en" ? "englischsprachiger Markt" : "deutschsprachiger Markt";
    const data = await askClaudeWithSearch(
      `Du bist Expert:in für den Verkauf digitaler Produkte (PDF-Downloads) über eigene Websites, Etsy, Gumroad und ähnliche Plattformen. Du recherchierst per Websuche, was sich aktuell gut verkauft. Heute ist ${new Date().toLocaleDateString("de-DE")}.`,
      `Recherchiere per Websuche: Welche digitalen PDF-Produkte verkaufen sich in der Nische "${project.niche}" (${market}) aktuell am besten – z. B. auf Etsy-Bestsellerlisten, Gumroad, Pinterest-Trends? Denke an Formate wie Mini-Workbook, geführtes Journal, Checklisten-Bundle, Planer, Selbsttest, Kartenset als PDF, Vorlagen. Leite 3 konkrete, ORIGINALE Produktideen ab. Antworte NUR mit kompaktem JSON:
{"produkte":[{"format":"z. B. Geführtes Journal","thema":"max 8 Wörter","warum":"Beleg aus Recherche, max 18 Wörter","preis":"z. B. 9-17 €","kapitel":6,"idee":{"titel":"origineller Produkttitel","untertitel":"Nutzen-Untertitel","zielgruppe":"max 8 Wörter","versprechen":"max 10 Wörter"}}]}`,
      true
    );
    up({ digitalIdeas: Array.isArray(data.produkte) ? data.produkte : [] });
  });

  const pickDigitalIdea = (t) => {
    up({
      niche: t.thema || project.niche,
      title: t.idee.titel, subtitle: t.idee.untertitel,
      audience: t.idee.zielgruppe, promise: t.idee.versprechen,
      bookType: "workbook",
      chapterCount: Math.max(3, Math.min(12, parseInt(t.kapitel, 10) || 6)),
    });
    setNotice(`Produkt-Idee „${t.idee.titel}" (${t.format}) übernommen und als kompaktes Workbook mit ${Math.max(3, Math.min(12, parseInt(t.kapitel, 10) || 6))} Kapiteln eingerichtet. Empfohlener Weg: Gliederung → Autopilot → Export → „Digital-Produkt" mit deiner Markenfarbe.`);
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
    const text = await askClaude(`${sysAutor(project)}\n${FORMAT_REGELN}`, extraPrompt(project, project.outline, key));
    upExtra(key, text.trim());
  });

  const genKdp = () => run("kdp", async () => {
    const market = project.language === "en" ? "amazon.com" : "amazon.de";
    const data = await askClaudeWithSearch(
      `${SYS_AUTOR}\nDu bist zusätzlich erfahrene:r Amazon-SEO-Spezialist:in: Du kennst die A9/A10-Suchalgorithmus-Logik von KDP, recherchierst reale Suchbegriffe und vermeidest Keyword-Stuffing.`,
      `${bookContext(project)} Kapitel: ${project.outline.map((c) => c.title).join("; ")}.
Recherchiere kurz per Websuche, wonach Leser:innen zu diesem Thema auf ${market} tatsächlich suchen (Autocomplete-Begriffe, verwandte Bestseller-Titel, Formulierungen aus Rezensionen). Erstelle darauf aufbauend das KDP-Marketing-Paket:

1. BESCHREIBUNG (150–200 Wörter, SEO-optimiert für die Amazon-Produktseite): Die wichtigsten Suchbegriffe natürlich in den ersten 2 Sätzen unterbringen (dort gewichtet Amazons Algorithmus am stärksten), dann Hook, Nutzen-Aufzählung, Absätze (\\n\\n), CTA am Ende. Fließend lesbar für Menschen, nicht wie eine Keyword-Liste.
2. SEO-KEYWORDS: genau 7 Backend-Keywords/-Phrasen, jeweils bis 50 Zeichen. Recherchebasiert (reale Suchintention statt Vermutung), unterschiedliche Nischen-Facetten abdeckend (kein Keyword wiederholt ein anderes), KEINE Wiederholung von Wörtern aus Titel/Untertitel (die sind bei KDP bereits automatisch mitindexiert), keine Konkurrenz-Markennamen.
3. KATEGORIEN: 3 passende, tatsächlich existierende KDP-Kategorien.

Antworte NUR mit JSON:
{"beschreibung":"...","keywords":["...", "...", "...", "...", "...", "...", "..."],"kategorien":["...","...","..."]}`,
      true
    );
    up({ kdp: data });
    setNotice("SEO-optimiertes KDP-Paket erstellt: Beschreibung mit Suchbegriffen in den ersten Sätzen, 7 recherchebasierte Keywords, 3 Kategorien.");
  });

  const genBlurb = () => run("blurb", async () => {
    const text = await askClaude(
      sysAutor(project),
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

  /* Detaillierter Bild-Prompt für das KOMPLETTE Cover (Vorder- + Rückseite) */
  const genCoverPrompt = () => run("coverprompt", async () => {
    const text = await askClaude(
      "Du bist Art Director für Buchcover und Experte für Bildgenerierungs-Prompts (Higgsfield, Midjourney & Co.). Du schreibst präzise, bildstarke Prompts.",
      `${bookContext(project)}
${project.cover.brief ? `Design-Briefing:\n${project.cover.brief.slice(0, 700)}\n` : ""}
Erstelle einen detaillierten BILDGENERIERUNGS-PROMPT für ein komplettes Buchcover, gegliedert in zwei Abschnitte:

VORDERSEITE: Hauptmotiv (konkret beschrieben: Objekt/Szene, Komposition, Lichtstimmung), Farbpalette mit Hex-Codes passend zu ${project.cover.bg}, ruhige Fläche im oberen Drittel für den Titel, Hochformat 2:3.
RÜCKSEITE: dezente, flächige Weiterführung des Motivs (z. B. verblasster Verlauf, einzelnes Ornament-Element), viel ruhige Fläche für Klappentext und Barcode unten rechts.

Beide Abschnitte MÜSSEN enthalten: "kein Text, keine Buchstaben, keine Wörter im Bild". Schreibe den Prompt so, dass er direkt in ein Bild-Tool kopiert werden kann. Kein Kommentar davor oder danach.`
    );
    upCover({ imgPrompt: text.trim() });
  });

  const genCoverImage = () => run("coverimg", async () => {
    const base = project.cover.imgPrompt
      ? `Bild-Prompt (nur den VORDERSEITE-Teil umsetzen):\n${project.cover.imgPrompt.slice(0, 900)}`
      : `Motiv passend zu diesem Buch: "${project.title}" – ${project.subtitle}. Thema: ${project.niche}. Stimmung: warm, heilsam, hochwertig, Selbsthilfe-Regal. Farbwelt um ${project.cover.bg}.`;
    const url = await askHiggsfieldImage(
      `Nutze das Higgsfield-Tool generate_image, um EIN Buchcover-Hintergrundbild zu erzeugen. WICHTIG: KEIN Text, KEINE Buchstaben, KEINE Wörter im Bild (der Titel wird später überlagert). Hochformat (2:3), ruhige Fläche im oberen Drittel. ${base} Warte auf das fertige Ergebnis (bei Bedarf Status prüfen) und antworte am Ende AUSSCHLIESSLICH mit der direkten Bild-URL, ohne weiteren Text.`
    );
    upCover({ imageUrl: url });
    setNotice("Cover-Bild erzeugt (Higgsfield-Credits wurden verbraucht). Vorschau unten – das Bild liegt jetzt hinter der Vorderseite deiner Cover-Vorlage. Wichtig: Bild per Rechtsklick/Langdruck zusätzlich herunterladen und sichern, generierte URLs können ablaufen.");
  });

  const genTips = () => run("tips", async () => {
    const summary = audit.rows.map((r) => `Kap.${r.i + 1} "${r.title}": ${r.words} Wörter${audit.isWb ? `, Übung:${r.uebung ? "ja" : "NEIN"}, Linien:${r.linien ? "ja" : "NEIN"}` : ""}`).join("\n");
    const text = await askClaude(
      SYS_AUTOR,
      `${bookContext(project)}
Analyse des Manuskripts:\n${summary}\nFehlende Rahmenteile: ${audit.missingExtras.join(", ") || "keine"}.
Gib 4–6 konkrete, priorisierte Verbesserungsvorschläge für dieses Buch (Struktur, Dramaturgie, ${audit.isWb ? "Übungsvielfalt, " : ""}Verkaufswirkung). Kurze "- " Punkte, direkt umsetzbar. Antworte auf Deutsch.`
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
      const extraDefs = extrasFor(project.bookType);
      const totalSteps = outline.length + extraDefs.length;
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
      for (let k = 0; k < extraDefs.length; k++) {
        if (stopRef.current) break;
        const def = extraDefs[k];
        if ((extras[def.key] || "").trim().length > 80) continue;
        setAuto({ msg: `Erstellt: ${def.label} …`, pct: Math.round(((outline.length + k + 0.5) / totalSteps) * 100) });
        const text = await askClaude(`${sysAutor(project)}\n${FORMAT_REGELN}`, extraPrompt(project, outline, def.key));
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

  /* ---- Fehler-Prüfung & Bereinigung ---- */
  const applyTypography = () => {
    setProject((p) => ({
      ...p,
      outline: p.outline.map((c) => ({ ...c, content: cleanText(c.content, p.language) })),
      extras: Object.fromEntries(Object.entries(p.extras).map(([k, v]) => [k, cleanText(v, p.language)])),
    }));
    setTips("Typografie-Bereinigung angewendet: Mehrfach-Leerzeichen entfernt, Satzzeichen-Abstände korrigiert, Anführungszeichen und Gedankenstriche vereinheitlicht – in allen Kapiteln und Rahmenteilen.");
  };

  const runProofread = async () => {
    stopRef.current = false;
    setLoading("proof"); setError(null);
    const results = [];
    try {
      let outline = [...project.outline];
      for (let i = 0; i < outline.length; i++) {
        if (stopRef.current) break;
        setAuto({ msg: `Prüft Kapitel ${i + 1}/${outline.length} auf Fehler …`, pct: Math.round(((i + 0.5) / outline.length) * 100) });
        const data = await askClaude(
          `Du bist professionelle:r Lektor:in für ${project.language === "en" ? "englische" : "deutsche"} Buchmanuskripte. Du korrigierst nur echte Fehler und veränderst niemals Stil oder Inhalt.`,
          `Prüfe den folgenden Buchtext auf Rechtschreib-, Grammatik- und Zeichensetzungsfehler sowie fehlende oder doppelte Leerzeichen. Ignoriere die Markup-Zeichen (##, ###, :::, [linien:x], [skala], - [ ], **fett**). Antworte NUR mit JSON, maximal 25 Einträge, ausschließlich ECHTE Fehler (keine Stilvorschläge). Wenn fehlerfrei: {"fehler":[]}
{"fehler":[{"falsch":"exakte fehlerhafte Textstelle","richtig":"Korrektur"}]}

TEXT:
${outline[i].content}`,
          true
        );
        let fixed = outline[i].content;
        let n = 0;
        const samples = [];
        (data.fehler || []).forEach((f) => {
          if (f && f.falsch && typeof f.richtig === "string" && f.falsch !== f.richtig && fixed.includes(f.falsch)) {
            fixed = fixed.split(f.falsch).join(f.richtig);
            n++;
            if (samples.length < 3) samples.push(`„${f.falsch}" → „${f.richtig}"`);
          }
        });
        if (n > 0) {
          outline = outline.map((c, j) => (j === i ? { ...c, content: fixed } : c));
          const snap = [...outline];
          setProject((p) => ({ ...p, outline: snap }));
        }
        results.push(`Kapitel ${i + 1} („${outline[i].title}"): ${n === 0 ? "fehlerfrei ✓" : n + " Korrektur" + (n === 1 ? "" : "en") + (samples.length ? ", z. B. " + samples.join("; ") : "")}`);
      }
      setTips("KI-Rechtschreibprüfung abgeschlossen:\n" + results.map((r) => "- " + r).join("\n"));
    } catch (e) {
      setError(`Prüfung unterbrochen (${e.message}). Bereits geprüfte Kapitel wurden korrigiert – einfach erneut starten.`);
      if (results.length) setTips(results.map((r) => "- " + r).join("\n"));
    }
    setAuto(null); setLoading(null);
  };

  /* ---- Gedankenstriche reduzieren (KI) ---- */
  const countDashes = (t) => (String(t || "").match(/\s–\s|\s—\s/g) || []).length;
  const dashFixText = async (text, langLabel) => {
    let current = text;
    for (let pass = 0; pass < 3; pass++) {
      if (countDashes(current) === 0 || stopRef.current) break;
      const data = await askClaude(
        `Du bist professionelle:r Lektor:in für ${langLabel} Buchmanuskripte. Du verbesserst den Lesefluss, ohne Inhalt oder Stimme des Textes zu verändern.`,
        `Der folgende Text enthält zu viele Gedankenstriche (–). Formuliere die Sätze mit Gedankenstrich so um, dass sie OHNE Gedankenstrich natürlich fließen: nutze Komma, Doppelpunkt, Punkt, Klammern oder eine Satzumstellung. Inhalt, Ton und Markup-Zeichen (##, :::, [linien:x], - [ ], **fett**) bleiben unverändert. Zahlen- und Jahresbereiche wie „8–10" NICHT anfassen. Antworte NUR mit JSON, max. 25 Einträge:
{"ersetzungen":[{"alt":"exakte Textstelle mit Gedankenstrich","neu":"Umformulierung ohne Gedankenstrich"}]}
Wenn nichts umzuformulieren ist: {"ersetzungen":[]}

TEXT:
${current}`,
        true
      );
      let applied = 0;
      (data.ersetzungen || []).forEach((r) => {
        if (r && r.alt && typeof r.neu === "string" && r.alt !== r.neu && current.includes(r.alt)) {
          current = current.split(r.alt).join(r.neu);
          applied++;
        }
      });
      if (!applied) break;
    }
    return current;
  };

  /* ---- Humanize-Durchlauf: bestehende Texte menschlicher machen ---- */
  const runHumanize = async () => {
    stopRef.current = false;
    setLoading("humanize"); setError(null); setNotice(null);
    try {
      let outline = [...project.outline];
      const chapterChunks = outline.map((c) => chunkByWords(c.content || "", 450));
      const extraDefs = extrasFor(project.bookType).filter((d) => (project.extras[d.key] || "").trim());
      const total = chapterChunks.reduce((n, c) => n + c.length, 0) + extraDefs.length || 1;
      let done = 0;
      const tick = (msg) => { done++; setAuto({ msg, pct: Math.min(99, Math.round((done / total) * 100)) }); };
      const HUM = `Überarbeite den folgenden Buchtext-Abschnitt so, dass er klingt, als hätte ihn ein:e erfahrene:r menschliche:r Autor:in geschrieben: Variiere Satzlängen und Satzanfänge deutlich (auf lange Sätze folgen kurze). Ersetze KI-typische Floskeln ("Darüber hinaus", "Es ist wichtig zu beachten", "In der heutigen Zeit", "Zusammenfassend", "spielt eine entscheidende Rolle"). Löse gleichförmige Dreier-Aufzählungen und perfekte Parallelstrukturen auf. Füge, wo es passt, eine konkrete sinnliche Kleinigkeit oder natürliche Wendung ein. Inhalt, Bedeutung, Fakten, Du-Ansprache und ALLE Markup-Zeichen (##, ###, :::uebung, :::tipp, :::, [linien:x], [skala], - [ ], **fett**, >) bleiben exakt erhalten. Gib NUR den überarbeiteten Text zurück, ohne Kommentar.`;
      for (let i = 0; i < outline.length; i++) {
        if (stopRef.current) break;
        const parts = [];
        for (let k = 0; k < chapterChunks[i].length; k++) {
          if (stopRef.current) break;
          tick(`Humanisiert Kapitel ${i + 1}/${outline.length} (Abschnitt ${k + 1}/${chapterChunks[i].length}) …`);
          const t = await askClaude(sysAutor(project), `${HUM}\n\nTEXT:\n${chapterChunks[i][k]}`);
          parts.push(t.trim());
        }
        if (stopRef.current) break;
        outline = outline.map((c, j) => (j === i ? { ...c, content: parts.join("\n\n") } : c));
        const snap = [...outline];
        setProject((p) => ({ ...p, outline: snap }));
      }
      let extras = { ...project.extras };
      for (const def of extraDefs) {
        if (stopRef.current) break;
        tick(`Humanisiert: ${def.label} …`);
        const t = await askClaude(sysAutor(project), `${HUM}\n\nTEXT:\n${extras[def.key]}`);
        extras = { ...extras, [def.key]: t.trim() };
        const snap = { ...extras };
        setProject((p) => ({ ...p, extras: snap }));
      }
      if (!stopRef.current) {
        setNotice("Humanize-Durchlauf abgeschlossen: Alle Kapitel und Rahmenteile wurden auf natürlichen, menschlichen Schreibfluss überarbeitet. Empfehlung: danach einmal die KI-Rechtschreibprüfung laufen lassen. Zur Ehrlichkeit: Die KI-Angabe beim KDP-Upload bleibt trotzdem korrekt bestehen – dieser Durchlauf verbessert die Textqualität, er ist kein Versteckspiel.");
      } else {
        setError("Humanize gestoppt. Bereits überarbeitete Kapitel sind gespeichert.");
      }
    } catch (e) {
      setError(`Humanize unterbrochen (${e.message}). Bereits überarbeitete Kapitel sind gespeichert – einfach erneut starten.`);
    }
    setAuto(null); setLoading(null);
  };

  const runDashFix = async () => {
    stopRef.current = false;
    setLoading("dash"); setError(null); setNotice(null);
    const langLabel = project.language === "de" ? "deutsche" : LANGS[project.language] ? `${LANGS[project.language].toLowerCase()}e` : "deutsche";
    const before = project.outline.reduce((n, c) => n + countDashes(c.content), 0)
      + Object.values(project.extras).reduce((n, t) => n + countDashes(t), 0);
    try {
      let outline = [...project.outline];
      const withDashes = outline.map((c, i) => ({ i, d: countDashes(c.content) })).filter((x) => x.d > 0);
      const extraDefs = extrasFor(project.bookType).filter((d) => countDashes(project.extras[d.key]) > 0);
      const total = withDashes.length + extraDefs.length || 1;
      let done = 0;
      for (const { i } of withDashes) {
        if (stopRef.current) break;
        done++;
        setAuto({ msg: `Formuliert Gedankenstriche um: Kapitel ${i + 1}/${outline.length} …`, pct: Math.round((done / total) * 100) });
        const fixed = await dashFixText(outline[i].content, langLabel);
        outline = outline.map((c, j) => (j === i ? { ...c, content: fixed } : c));
        const snap = [...outline];
        setProject((p) => ({ ...p, outline: snap }));
      }
      let extras = { ...project.extras };
      for (const def of extraDefs) {
        if (stopRef.current) break;
        done++;
        setAuto({ msg: `Formuliert Gedankenstriche um: ${def.label} …`, pct: Math.round((done / total) * 100) });
        extras = { ...extras, [def.key]: await dashFixText(extras[def.key], langLabel) };
        const snap = { ...extras };
        setProject((p) => ({ ...p, extras: snap }));
      }
      const after = outline.reduce((n, c) => n + countDashes(c.content), 0)
        + Object.values(extras).reduce((n, t) => n + countDashes(t), 0);
      setNotice(`Gedankenstriche reduziert: vorher ${before}, jetzt noch ${after}${after > 0 ? " (die verbliebenen sind dort sinnvoll oder in Zahlenbereichen)" : ""}. Die Umformulierungen wurden direkt in die Kapitel übernommen.`);
    } catch (e) {
      setError(`Durchlauf unterbrochen (${e.message}). Bereits bearbeitete Kapitel sind gespeichert – einfach erneut starten.`);
    }
    setAuto(null); setLoading(null);
  };

  /* ---- Paket A: Autoren-DNA, Titel-Tester, Beta-Panel ---- */
  const [beta, setBeta] = useState(null);
  const upVoice = (patch) => setProject((p) => ({ ...p, voice: { ...p.voice, ...patch } }));

  const genVoice = () => run("voice", async () => {
    const text = await askClaude(
      "Du bist Lektor:in und Stilanalyst:in. Du erstellst präzise, umsetzbare Stil-Profile aus Textproben.",
      `Analysiere diese Textprobe und erstelle ein kompaktes SCHREIBSTIL-PROFIL (max. 120 Wörter), das eine KI exakt nachahmen kann: Satzrhythmus (kurz/lang, Wechsel), Ansprache & Nähe, Tonalität, typische Stilmittel, Wortwahl-Ebene, was der/die Autor:in NIE macht. Als "- " Liste. Nur das Profil, kein Kommentar.

TEXTPROBE:
${project.voice.sample.slice(0, 4000)}`
    );
    upVoice({ profile: text.trim() });
    setNotice("Autoren-DNA erstellt. Ab jetzt klingen alle generierten Texte (Kapitel, Buchgerüst, Klappentext) nach diesem Stil-Profil – du kannst es unten jederzeit anpassen.");
  });

  const genTitleTests = () => run("titles", async () => {
    const data = await askClaude(
      sysAutor(project),
      `${bookContext(project)}
Aktueller Arbeitstitel: "${project.title}" – ${project.subtitle}.
Erzeuge 8 Titel-Varianten und bewerte jede nach Verkaufskraft auf Amazon (Klarheit des Nutzens, Keyword-Stärke, Emotion, Einprägsamkeit). Antworte NUR mit kompaktem JSON, sortiert nach Score absteigend:
{"titel":[{"t":"Titel","u":"Untertitel","s":87,"w":"Begründung max 8 Wörter"}]}`,
      true
    );
    up({ titleTests: Array.isArray(data.titel) ? data.titel : [] });
  });

  const genBeta = () => run("beta", async () => {
    const mid = project.outline[Math.floor(project.outline.length / 2)] || project.outline[0] || { content: "" };
    const data = await askClaude(
      "Du simulierst ein Beta-Leser-Panel: drei sehr unterschiedliche, ehrliche Leser:innen aus der Zielgruppe. Kein Schönreden – konstruktiv, aber direkt.",
      `${bookContext(project)}
Kapitel: ${project.outline.map((c) => c.title).join("; ")}
Auszug Einleitung: ${(project.extras.einleitung || "").slice(0, 900)}
Auszug Mitte: ${(mid.content || "").slice(0, 900)}
Lasse 3 Personas das Buch bewerten. Antworte NUR mit JSON:
{"personas":[{"name":"Vorname, Alter","profil":"max 10 Wörter","begeistert":"max 15 Wörter","fehlt":"max 15 Wörter","absprung":"wo/warum sie aussteigen würde, max 15 Wörter"}]}`,
      true
    );
    setBeta(Array.isArray(data.personas) ? data.personas : []);
  });

  /* ---- Lesbarkeit (lokal) ---- */
  const readability = useMemo(() =>
    project.outline.map((ch, i) => ({ i, title: ch.title, ...readabilityOf(ch.content) })),
    [project.outline]);

  /* ---- Paket C: Lücken-Finder, Serien, Duplizieren ---- */
  const genGaps = () => run("gaps", async () => {
    const market = project.language === "en" ? "amazon.com" : "amazon.de";
    const data = await askClaudeWithSearch(
      `Du bist KDP-Marktanalyst:in. Du recherchierst per Websuche, was Leser:innen an Bestsellern KRITISIEREN – denn Kritik an der Konkurrenz ist die Produktchance. Heute ist ${new Date().toLocaleDateString("de-DE")}.`,
      `Recherchiere per Websuche: Was bemängeln Leser:innen in Rezensionen der erfolgreichsten Bücher zur Nische "${project.niche}" auf ${market}? Suche nach kritischen Rezensionen, Reddit-/Forendiskussionen, "buch enttäuscht"-Threads. Antworte NUR mit kompaktem JSON:
{"luecken":[{"kritik":"was Leser bemängeln, max 14 Wörter","chance":"wie DEIN Buch es besser macht, max 14 Wörter","haeufig":"oft|gelegentlich"}]} – 4 Einträge.`,
      true
    );
    up({ gaps: Array.isArray(data.luecken) ? data.luecken : [] });
  });

  const genSeries = () => run("series", async () => {
    const data = await askClaude(
      sysAutor(project),
      `${bookContext(project)}
Kapitel von Band 1: ${project.outline.map((c) => c.title).join("; ")}
Plane 2 Folgebände als Serie mit gemeinsamem Branding (erkennbares Titel-Muster) und klarer Abgrenzung. Antworte NUR mit kompaktem JSON:
{"baende":[{"titel":"","untertitel":"","fokus":"max 12 Wörter","zielgruppe":"max 8 Wörter","versprechen":"max 10 Wörter"}]}`,
      true
    );
    up({ series: Array.isArray(data.baende) ? data.baende : [] });
  });

  const createProjectFrom = async (b) => {
    await persistNow();
    const id = "p" + Date.now();
    const list = [...projList, { id, title: b.titel }];
    setProjList(list);
    setProject({
      ...emptyProject,
      niche: project.niche, language: project.language, bookType: project.bookType,
      author: project.author, bio: project.bio,
      voice: { ...project.voice },
      digital: { ...emptyProject.digital, accent: project.digital.accent },
      title: b.titel, subtitle: b.untertitel || "", audience: b.zielgruppe || project.audience, promise: b.versprechen || "",
    });
    setStep(1); setActiveCh(0); setBeta(null); setTips("");
    setActiveId(id);
    try { await window.storage.set("kdp-index", JSON.stringify({ activeId: id, list })); } catch (e) { /* egal */ }
    setNotice(`Neues Serien-Projekt „${b.titel}" angelegt (Stil-Profil und Einstellungen übernommen). Jetzt Gliederung generieren oder direkt den Autopiloten starten.`);
  };

  const duplicateProject = async () => {
    await persistNow();
    const id = "p" + Date.now();
    const title = (project.title || "Projekt") + " (Kopie)";
    const list = [...projList, { id, title }];
    setProjList(list);
    const copy = JSON.parse(JSON.stringify(project));
    copy.title = title;
    setProject(mergeProject(copy));
    setActiveId(id);
    try { await window.storage.set("kdp-index", JSON.stringify({ activeId: id, list })); } catch (e) { /* egal */ }
    setNotice("Projekt dupliziert – du arbeitest jetzt in der Kopie. Ideal als Vorlage für Varianten (andere Sprache, anderes Format).");
  };

  /* ---- Paket B: Launch-Kit, Zitat-Karten ---- */
  const genPosts = async () => {
    stopRef.current = false;
    setLoading("posts"); setError(null);
    try {
      let posts = [];
      for (let batch = 0; batch < 2; batch++) {
        if (stopRef.current) break;
        setAuto({ msg: `Erstellt Social-Media-Plan (Tag ${batch * 15 + 1}–${batch * 15 + 15}) …`, pct: batch === 0 ? 25 : 70 });
        const data = await askClaude(
          sysAutor(project),
          `${bookContext(project)}
Kapitel: ${project.outline.map((c) => c.title).join("; ")}
Erstelle Social-Media-Post-Ideen für Tag ${batch * 15 + 1} bis ${batch * 15 + 15} eines 30-Tage-Launch-Plans (Instagram/TikTok/Pinterest). Mische: Mehrwert aus Kapiteln, persönliche Story-Hooks, Mini-Übungen, Buch-Teaser. Antworte NUR mit kompaktem JSON:
{"posts":[{"t":${batch * 15 + 1},"idee":"Post-Hook + Kernaussage, max 22 Wörter"}]}`,
          true
        );
        posts = posts.concat((data.posts || []).map((p, i) => ({ t: p.t || batch * 15 + i + 1, idee: p.idee || "" })));
      }
      setProject((p) => ({ ...p, launch: { ...p.launch, posts } }));
      setNotice(`${posts.length} Post-Ideen erstellt – unten in der Liste, mit einem Klick komplett kopierbar.`);
    } catch (e) { setError(`Content-Plan unterbrochen (${e.message}).`); }
    setAuto(null); setLoading(null);
  };

  const EMAIL_PLAN = [
    { tag: 0, rolle: "Freebie-Lieferung: Leseprobe übergeben, herzlich willkommen heißen, kurz dich vorstellen" },
    { tag: 2, rolle: "Persönliche Story: warum du dieses Buch geschrieben hast, Verbindung aufbauen" },
    { tag: 4, rolle: "Purer Mehrwert: eine konkrete Mini-Übung oder Erkenntnis aus dem Buch verschenken" },
    { tag: 6, rolle: "Einwände nehmen: warum dieses Buch anders ist als die üblichen Ratgeber" },
    { tag: 8, rolle: "Angebot: das Buch vorstellen mit klarem Kauf-Link [KAUF-LINK] und ehrlicher Dringlichkeit" },
  ];
  const genEmails = async () => {
    stopRef.current = false;
    setLoading("emails"); setError(null);
    try {
      let emails = [];
      for (let i = 0; i < EMAIL_PLAN.length; i++) {
        if (stopRef.current) break;
        setAuto({ msg: `Schreibt E-Mail ${i + 1}/5 (Tag ${EMAIL_PLAN[i].tag}) …`, pct: Math.round(((i + 0.5) / 5) * 100) });
        const data = await askClaude(
          sysAutor(project),
          `${bookContext(project)}
Schreibe E-Mail ${i + 1} von 5 einer Launch-Sequenz (Tag ${EMAIL_PLAN[i].tag} nach Freebie-Download). Aufgabe dieser Mail: ${EMAIL_PLAN[i].rolle}. 120–180 Wörter, persönlich, per Du, 1 klarer CTA. Antworte NUR mit JSON: {"betreff":"neugierig machender Betreff","text":"E-Mail-Text mit Absätzen (\\n\\n)"}`,
          true
        );
        emails.push({ tag: EMAIL_PLAN[i].tag, betreff: data.betreff || "", text: data.text || "" });
        const snap = [...emails];
        setProject((p) => ({ ...p, launch: { ...p.launch, emails: snap } }));
      }
      setNotice("E-Mail-Sequenz fertig – jede Mail einzeln kopierbar, [KAUF-LINK] vor dem Versand ersetzen.");
    } catch (e) { setError(`E-Mail-Sequenz unterbrochen (${e.message}). Fertige Mails sind gespeichert.`); }
    setAuto(null); setLoading(null);
  };

  const downloadQuoteCard = async (quote) => {
    try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (e) { /* egal */ }
    const size = 1080;
    const c = document.createElement("canvas");
    c.width = size; c.height = size;
    const x = c.getContext("2d");
    const accent = project.digital.accent || "#6C57B8";
    x.fillStyle = accent; x.fillRect(0, 0, size, size);
    x.strokeStyle = "rgba(255,255,255,0.45)"; x.lineWidth = 3; x.strokeRect(56, 56, size - 112, size - 112);
    x.fillStyle = "#fff"; x.textAlign = "center";
    const words = quote.split(/\s+/);
    const maxW = size - 240;
    const wrap = (fs) => {
      x.font = `600 ${fs}px Fraunces, Georgia, serif`;
      const lines = []; let line = "";
      for (const w of words) {
        const t = line ? line + " " + w : w;
        if (x.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
      }
      if (line) lines.push(line);
      return lines;
    };
    let fs = 62; let lines = wrap(fs);
    while ((lines.length * fs * 1.4 > size - 460 || lines.some((l) => x.measureText(l).width > maxW)) && fs > 30) { fs -= 4; lines = wrap(fs); }
    x.font = `700 ${fs * 2.3}px Fraunces, Georgia, serif`; x.globalAlpha = 0.35;
    let y = size / 2 - ((lines.length - 1) * fs * 1.4) / 2;
    x.fillText("\u201E", size / 2, y - fs * 1.1);
    x.globalAlpha = 1; x.font = `600 ${fs}px Fraunces, Georgia, serif`;
    lines.forEach((l) => { x.fillText(l, size / 2, y); y += fs * 1.4; });
    x.globalAlpha = 0.9; x.font = "500 30px Inter, sans-serif";
    x.fillText(`— ${project.author || ""}`, size / 2, size - 150);
    x.globalAlpha = 0.65; x.font = "500 23px Inter, sans-serif";
    x.fillText(project.title || "", size / 2, size - 104);
    c.toBlob((b) => {
      const url = URL.createObjectURL(b);
      const a = document.createElement("a");
      a.href = url; a.download = "zitat-karte.png";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 8000);
    }, "image/png");
  };

  /* ---- Übersetzung des kompletten Buchs ---- */
  const runTranslate = async () => {
    if (transTarget === project.language) { setError("Ziel- und Ausgangssprache sind identisch."); return; }
    stopRef.current = false;
    setLoading("translate"); setError(null); setNotice(null);
    const target = LANGS[transTarget];
    const SYS_T = `Du bist professionelle:r Literaturübersetzer:in ins ${target}. Du überträgst Texte sinngemäß, idiomatisch und kulturell passend für Muttersprachler:innen – niemals Wort für Wort. Redewendungen, Beispiele und Ansprache passt du natürlich an die Zielsprache an. Markup-Zeichen (##, ###, :::uebung, :::tipp, :::, [linien:x], [skala], - [ ], **fett**, >) lässt du exakt unverändert und übersetzt nur die Inhalte dazwischen.`;
    try {
      let outline = [...project.outline];
      const chapterChunks = outline.map((c) => chunkByWords(c.content || "", 450));
      const extraDefs = extrasFor(project.bookType).filter((d) => (project.extras[d.key] || "").trim());
      const total = 2 + chapterChunks.reduce((n, c) => n + c.length, 0) + extraDefs.length;
      let done = 0;
      const tick = (msg) => { done++; setAuto({ msg, pct: Math.min(99, Math.round((done / total) * 100)) }); };

      tick(`Übersetzt Titel & Buchdaten ins ${target} …`);
      const meta = await askClaude(SYS_T,
        `Übersetze diese Buchdaten ins ${target} – verkaufsstark und idiomatisch, kein Wort-für-Wort. Antworte NUR mit JSON:
{"titel":"...","untertitel":"...","zielgruppe":"...","versprechen":"..."}
Titel: ${project.title}
Untertitel: ${project.subtitle}
Zielgruppe: ${project.audience}
Versprechen: ${project.promise}`, true);

      tick("Übersetzt Kapitelüberschriften …");
      const titlesData = await askClaude(SYS_T,
        `Übersetze diese Kapitelüberschriften ins ${target}. Antworte NUR mit JSON, gleiche Reihenfolge, exakt ${outline.length} Einträge:
{"titel":["..."]}
${outline.map((c, i) => `${i + 1}. ${c.title}`).join("\n")}`, true);
      const newTitles = Array.isArray(titlesData.titel) && titlesData.titel.length === outline.length
        ? titlesData.titel : outline.map((c) => c.title);

      for (let i = 0; i < outline.length; i++) {
        if (stopRef.current) break;
        const parts = [];
        for (let k = 0; k < chapterChunks[i].length; k++) {
          if (stopRef.current) break;
          tick(`Übersetzt Kapitel ${i + 1}/${outline.length} (Abschnitt ${k + 1}/${chapterChunks[i].length}) …`);
          const t = await askClaude(SYS_T,
            `Übersetze den folgenden Buchtext-Abschnitt ins ${target}. Sinngemäß, flüssig und stilistisch stimmig – so, als wäre er original in dieser Sprache geschrieben. Gib NUR den übersetzten Text zurück, ohne Kommentar oder Anführungszeichen drumherum.

TEXT:
${chapterChunks[i][k]}`);
          parts.push(t.trim());
        }
        if (stopRef.current) break;
        outline = outline.map((c, j) => (j === i ? { ...c, title: newTitles[i], content: parts.join("\n\n") } : c));
        const snap = [...outline];
        setProject((p) => ({ ...p, outline: snap }));
      }

      let extras = { ...project.extras };
      for (const def of extraDefs) {
        if (stopRef.current) break;
        tick(`Übersetzt: ${def.label} …`);
        const t = await askClaude(SYS_T,
          `Übersetze den folgenden Buchteil ins ${target}. Sinngemäß und idiomatisch. Gib NUR den übersetzten Text zurück.

TEXT:
${extras[def.key]}`);
        extras = { ...extras, [def.key]: t.trim() };
        const snap = { ...extras };
        setProject((p) => ({ ...p, extras: snap }));
      }

      if (!stopRef.current) {
        setProject((p) => ({
          ...p, language: transTarget, kdp: null,
          title: meta.titel || p.title, subtitle: meta.untertitel || p.subtitle,
          audience: meta.zielgruppe || p.audience, promise: meta.versprechen || p.promise,
        }));
        setNotice(`Übersetzung ins ${target} abgeschlossen. Die Buchsprache (Silbentrennung, „${BOOK_STRINGS[transTarget].chapter}", Copyright-Texte) ist umgestellt. Bitte Klappentext und KDP-Paket neu generieren und die KI-Rechtschreibprüfung einmal laufen lassen.`);
      } else {
        setError("Übersetzung gestoppt. Achtung: Das Buch ist jetzt teilweise übersetzt – stelle bei Bedarf dein Backup wieder her oder starte die Übersetzung erneut komplett.");
      }
    } catch (e) {
      setError(`Übersetzung unterbrochen (${e.message}). Achtung: Das Buch kann teilweise übersetzt sein – stelle bei Bedarf dein Backup wieder her oder starte erneut.`);
    }
    setAuto(null); setLoading(null);
  };

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

  /* ---- Import: vorhandenes Manuskript ---- */
  const handlePdfFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setImp((s) => ({ ...s, busy: true, err: null, fileName: file.name }));
    try {
      const pdfjsLib = await loadPdfJs();
      const buf = await file.arrayBuffer();
      const doc = await pdfjsLib.getDocument({ data: buf, isEvalSupported: false }).promise;
      const allPagesLines = [];
      for (let p = 1; p <= doc.numPages; p++) {
        const page = await doc.getPage(p);
        const content = await page.getTextContent();
        const items = content.items.map((it) => ({
          str: it.str, x: it.transform[4], y: it.transform[5], h: it.height || Math.abs(it.transform[3]) || 10,
        }));
        allPagesLines.push(linesFromItems(items));
        setImp((s) => ({ ...s, busy: true, fileName: `${file.name} – Seite ${p}/${doc.numPages}` }));
      }
      const text = reconstructText(allPagesLines);
      if (!text.trim()) throw new Error("kein Text gefunden – vermutlich ein gescanntes PDF ohne Textebene");
      setImp((s) => ({ ...s, raw: cleanText(text, project.language), busy: false, fileName: file.name }));
    } catch (err) {
      setImp((s) => ({ ...s, busy: false, err: `PDF konnte nicht automatisch gelesen werden (${err.message}). Markiere den Text stattdessen in deinem PDF-Betrachter mit Strg/Cmd+A, kopiere ihn (Strg/Cmd+C) und füge ihn unten ein.` }));
    }
    e.target.value = "";
  };

  const applyImportChapters = (mode) => {
    const chapters = splitIntoChapters(imp.raw);
    if (!chapters.length) { setImp((s) => ({ ...s, err: "Kein Kapitel erkannt. Prüfe, ob Text vorhanden ist." })); return; }
    if (mode === "replace" && project.outline.length && confirmArm !== "imp-replace") {
      arm("imp-replace");
      return;
    }
    setConfirmArm(null);
    setProject((p) => ({ ...p, outline: mode === "append" ? [...p.outline, ...chapters] : chapters }));
    setImp({ raw: "", busy: false, err: null, fileName: "" });
    setActiveCh(0);
    setNotice(`${chapters.length} Kapitel übernommen. Weiter zu Schritt 3 (Schreiben) zum Prüfen – oder direkt zu Formatierung & Export.`);
  };

  const [manualCopy, setManualCopy] = useState(null);

  const copy = async (tag, text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(tag); setTimeout(() => setCopied(null), 1800);
      return;
    } catch (e) { /* Zwischenablage blockiert – Fallback unten */ }
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed"; ta.style.left = "-9999px"; ta.style.top = "0";
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      if (ok) { setCopied(tag); setTimeout(() => setCopied(null), 1800); return; }
    } catch (e2) { /* auch das blockiert – letzter Fallback */ }
    setManualCopy({ tag, text });
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
  const mergeChapterUp = (i) => {
    if (i <= 0) return;
    setProject((p) => {
      const o = [...p.outline];
      const prev = o[i - 1];
      const cur = o[i];
      o[i - 1] = { ...prev, content: (prev.content + "\n\n## " + cur.title + "\n" + (cur.content || "")).trim() };
      o.splice(i, 1);
      return { ...p, outline: o };
    });
    setActiveCh(0);
  };

  const runStructureFix = () => run("structure", async () => {
    const count = project.outline.length;
    const titles = project.outline.map((c, i) => `${i + 1}. ${c.title} (${countWords(c.content)} Wörter)`).join("\n");
    const data = await askClaude(
      "Du bist erfahrene:r Buchlektor:in und erkennst Kapitelstrukturen zuverlässig.",
      `Diese Abschnittsliste entstand beim PDF-Import eines Buchs. Sie enthält ECHTE Kapitelanfänge, aber auch fälschlich abgetrennte Zwischenüberschriften und Labels. Erkenne anhand der Titel und Wortzahlen, welche Nummern echte Kapitelanfänge sind (Vorwort, Einleitung, Nachwort usw. zählen als eigene Kapitel; kurze Labels und Zwischenüberschriften NICHT). Antworte NUR mit JSON:
{"kapitel":[1,4,9]}

${titles}`,
      true
    );
    const keep = new Set((data.kapitel || []).map((n) => parseInt(n, 10) - 1).filter((n) => n >= 0 && n < count));
    keep.add(0);
    if (keep.size >= count) { setNotice("Die Struktur sieht bereits sauber aus – nichts geändert."); return; }
    const merged = [];
    project.outline.forEach((ch, i) => {
      if (keep.has(i) || !merged.length) {
        merged.push({ ...ch });
      } else {
        const prev = merged[merged.length - 1];
        prev.content = (prev.content + "\n\n## " + ch.title + "\n" + (ch.content || "")).trim();
      }
    });
    setProject((p) => ({ ...p, outline: merged }));
    setActiveCh(0);
    setNotice(`Struktur bereinigt: ${merged.length} Kapitel (vorher ${count} Abschnitte). Die Zwischenüberschriften sind jetzt als Überschriften in den Kapiteln enthalten.`);
  });

  const openHtml = (html, filename) => {
    setError(null);
    try {
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const w = window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 120000);
      if (!w) {
        download(filename, html, "text/html");
        setError("Das neue Fenster wurde blockiert – die Datei wurde stattdessen heruntergeladen. Öffne sie per Doppelklick im Browser und speichere sie dort über Strg/Cmd+P als PDF.");
      }
    } catch (e) {
      download(filename, html, "text/html");
      setError("Direktes Öffnen nicht möglich – die Datei wurde heruntergeladen. Öffne sie per Doppelklick im Browser und speichere sie dort über Strg/Cmd+P als PDF.");
    }
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
            <button className="proj-btn" onClick={duplicateProject} title="Projekt duplizieren"><Copy size={13} /> Kopie</button>
            <button className="proj-btn danger" onClick={deleteProject} title="Projekt löschen"><Trash2 size={13} /> {confirmArm === "delproj" ? "Sicher?" : "Löschen"}</button>
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
              (s.id === 6 && !!project.kdp) ||
              (s.id === 7 && KDP_GUIDE.every((g) => project.pub.checks[g.k]));
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
        {notice && <div className="ok"><Check size={15} /> <span className="grow">{notice}</span><button className="okx" onClick={() => setNotice(null)}>×</button></div>}
        {manualCopy && (
          <div className="manualcopy">
            <div className="row-sb">
              <b>Automatisches Kopieren wurde vom Browser blockiert</b>
              <button className="okx" onClick={() => setManualCopy(null)}>×</button>
            </div>
            <p className="muted small-t">Markiere den Text unten von Hand (antippen und halten bzw. Dreifach-Klick) und kopiere ihn selbst mit Strg/Cmd+C.</p>
            <textarea className="ta short" readOnly value={manualCopy.text} onFocus={(e) => e.target.select()} />
          </div>
        )}
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
              <div className="row">
                <div className="grow">
                  <label className="lbl">Buchtyp</label>
                  <select className="inp" value={project.bookType} onChange={(e) => up({ bookType: e.target.value })}>
                    {Object.entries(BOOK_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="lbl">Buchsprache</label>
                  <select className="inp" value={project.language} onChange={(e) => up({ language: e.target.value })} style={{ width: 150 }}>
                    {Object.entries(LANGS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <label className="lbl">Nische wählen …</label>
              <select className="inp" value={NICHES.includes(project.niche) ? project.niche : ""} onChange={(e) => e.target.value && up({ niche: e.target.value })}>
                <option value="">Eigene Nische (unten eintragen)</option>
                {NICHES.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <label className="lbl">… oder frei beschreiben</label>
              <div className="row">
                <input className="inp grow" value={project.niche} onChange={(e) => up({ niche: e.target.value })}
                  placeholder="z. B. Selbstwert nach Trennung, Bindungsangst überwinden …" />
                <button className="btn primary" onClick={genIdeas} disabled={loading === "ideas" || !project.niche.trim()}>
                  {loading === "ideas" ? <Loader2 size={15} className="spin" /> : <Sparkles size={15} />} Konzepte entwickeln
                </button>
              </div>
              {project.language !== "de" && <p className="muted small-t">{LANGS[project.language]} gewählt: Titel, Kapitel, Klappentext und Keywords werden auf {LANGS[project.language]} generiert – die Bedienoberfläche bleibt Deutsch.</p>}
            </div>

            <div className="card trendcard">
              <div className="card-h row-sb"><span><TrendingUp size={15} style={{ verticalAlign: "-2px" }} /> Trend-Radar: Was verkauft sich gerade?</span>
                <button className="btn tiny" onClick={genTrends} disabled={loading === "trends" || !project.niche.trim()}>
                  {loading === "trends" ? <Loader2 size={13} className="spin" /> : <TrendingUp size={13} />} {project.trends.length ? "Neu recherchieren" : "Trends recherchieren"}
                </button>
              </div>
              <p className="muted">Recherchiert per Live-Websuche aktuelle Bestseller-Themen und Nachfrage-Trends in deiner Nische auf {project.language === "en" ? "amazon.com" : "amazon.de"} und leitet daraus übernehmbare Buchchancen ab. Hinweis: Das ist Web-Recherche als Orientierung, kein Zugriff auf Amazons interne Verkaufszahlen – und die Ideen sind bewusst originale Konzepte, keine Kopien bestehender Bücher.</p>
              {project.trends.length > 0 && (
                <div className="trends">
                  {project.trends.map((t, i) => (
                    <div className="trend" key={i}>
                      <div className="trend-t">{t.thema}</div>
                      <div className="trend-badges">
                        <span className={`tbadge ${t.nachfrage === "hoch" ? "ok-bg" : "warn-bg"}`}>Nachfrage: {t.nachfrage}</span>
                        <span className={`tbadge ${t.wettbewerb === "niedrig" ? "ok-bg" : t.wettbewerb === "mittel" ? "warn-bg" : "bad-bg"}`}>Wettbewerb: {t.wettbewerb}</span>
                      </div>
                      <div className="trend-why">{t.warum}</div>
                      {t.idee && <div className="trend-idea"><b>{t.idee.titel}</b><br />{t.idee.untertitel}</div>}
                      <button className="btn tiny primary-t" onClick={() => pickTrend(t)}><Check size={12} /> Als Buchidee übernehmen</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card trendcard">
              <div className="card-h row-sb"><span><Smartphone size={15} style={{ verticalAlign: "-2px" }} /> Digital-Produkt-Ideen: Was verkauft sich als Download?</span>
                <button className="btn tiny" onClick={genDigitalIdeas} disabled={loading === "digideas" || !project.niche.trim()}>
                  {loading === "digideas" ? <Loader2 size={13} className="spin" /> : <Sparkles size={13} />} {project.digitalIdeas.length ? "Neu recherchieren" : "Ideen recherchieren"}
                </button>
              </div>
              <p className="muted">Recherchiert per Live-Websuche, welche PDF-Downloads (Mini-Workbooks, Journals, Checklisten-Bundles, Planer …) sich in deiner Nische auf Etsy, Gumroad & Co. gerade gut verkaufen – mit Preis-Orientierung. Ein Klick richtet das Produkt als kompaktes Projekt ein; am Ende exportierst du es über „Digital-Produkt" in deiner Markenfarbe für deine eigene Website.</p>
              {project.digitalIdeas.length > 0 && (
                <div className="trends">
                  {project.digitalIdeas.map((t, i) => (
                    <div className="trend" key={i}>
                      <div className="trend-t">{t.idee ? t.idee.titel : t.thema}</div>
                      <div className="trend-badges">
                        <span className="tbadge ok-bg">{t.format}</span>
                        {t.preis && <span className="tbadge warn-bg">≈ {t.preis}</span>}
                      </div>
                      <div className="trend-why">{t.warum}</div>
                      {t.idee && <div className="trend-idea">{t.idee.untertitel}<br /><b>Für:</b> {t.idee.zielgruppe}</div>}
                      <button className="btn tiny primary-t" onClick={() => pickDigitalIdea(t)}><Check size={12} /> Als Produkt einrichten</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card trendcard">
              <div className="card-h row-sb"><span><ShieldCheck size={15} style={{ verticalAlign: "-2px" }} /> Rezensions-Lücken-Finder: Was fehlt der Konkurrenz?</span>
                <button className="btn tiny" onClick={genGaps} disabled={loading === "gaps" || !project.niche.trim()}>
                  {loading === "gaps" ? <Loader2 size={13} className="spin" /> : <Sparkles size={13} />} {project.gaps.length ? "Neu recherchieren" : "Lücken recherchieren"}
                </button>
              </div>
              <p className="muted">Recherchiert per Websuche, was Leser:innen an den Top-Büchern deiner Nische <b>kritisieren</b> – jede häufige Beschwerde ist eine konkrete Chance, es in deinem Buch besser zu machen.</p>
              {project.gaps.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  {project.gaps.map((g, i) => (
                    <div className="gap-row" key={i}>
                      <span className={`tbadge ${g.haeufig === "oft" ? "bad-bg" : "warn-bg"}`}>{g.haeufig}</span>
                      <div><b>Kritik:</b> {g.kritik}<br /><b style={{ color: "#3E8E7E" }}>Deine Chance:</b> {g.chance}</div>
                    </div>
                  ))}
                  <p className="muted small-t">Tipp: Nimm 1–2 dieser Chancen explizit in dein Transformations-Versprechen und die Gliederung auf.</p>
                </div>
              )}
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
              <div className="row" style={{ marginTop: 12 }}>
                <button className="btn tiny" onClick={genTitleTests} disabled={!!loading || !project.title.trim()}>
                  {loading === "titles" ? <Loader2 size={13} className="spin" /> : <Sparkles size={13} />} Titel-Tester: 8 Varianten bewerten
                </button>
              </div>
              {project.titleTests.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  {project.titleTests.map((t, i) => (
                    <button className="title-row" key={i} onClick={() => up({ title: t.t, subtitle: t.u })} title="Übernehmen">
                      <span className={`tscore ${t.s >= 80 ? "ok-bg" : t.s >= 65 ? "warn-bg" : "bad-bg"}`}>{t.s}</span>
                      <span className="grow"><b>{t.t}</b><br /><span className="muted">{t.u}</span> · <span className="muted">{t.w}</span></span>
                      <Check size={14} />
                    </button>
                  ))}
                  <p className="muted small-t">Antippen übernimmt Titel + Untertitel in deine Buchdaten.</p>
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-h row-sb"><span><Feather size={15} style={{ verticalAlign: "-2px" }} /> Autoren-DNA – dein Schreibstil für alle Texte</span>
                <button className="btn tiny" onClick={genVoice} disabled={!!loading || project.voice.sample.trim().length < 200}>
                  {loading === "voice" ? <Loader2 size={13} className="spin" /> : <Sparkles size={13} />} {project.voice.profile ? "Profil neu erstellen" : "Stil-Profil erstellen"}
                </button>
              </div>
              <p className="muted" style={{ marginBottom: 8 }}>Füge eine Textprobe von dir ein (mind. 200 Zeichen, ideal 1–2 Seiten aus einem eigenen Text). Daraus wird ein Stil-Profil erstellt, an das sich <b>alle</b> KI-Texte halten – Kapitel, Buchgerüst, Klappentext, E-Mails. So klingen deine Bücher nach dir, nicht nach KI, und über alle Projekte konsistent (wird beim Serien-Anlegen mitkopiert).</p>
              <textarea className="ta short" value={project.voice.sample} onChange={(e) => upVoice({ sample: e.target.value })}
                placeholder="Hier deine Textprobe einfügen …" />
              {project.voice.profile && (
                <>
                  <label className="lbl">Dein Stil-Profil (aktiv – editierbar)</label>
                  <textarea className="ta short" value={project.voice.profile} onChange={(e) => upVoice({ profile: e.target.value })} />
                </>
              )}
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

            <div className="card import">
              <div className="card-h"><FileText size={15} style={{ verticalAlign: "-2px" }} /> Vorhandenes Manuskript importieren</div>
              <p className="muted" style={{ marginBottom: 10 }}>Hast du dein Buch schon fertig geschrieben (z. B. als E-Book-PDF)? Lies es hier ein – der Text läuft danach durch dieselbe Formatierungs- und Export-Pipeline wie ein im Tool geschriebenes Buch. Hinweis: Nur der reine Text wird übernommen, Layout-Elemente wie Bilder oder Boxen aus dem Original nicht.</p>
              <div className="row">
                <label className="btn primary" style={{ cursor: imp.busy ? "default" : "pointer" }}>
                  {imp.busy ? <Loader2 size={15} className="spin" /> : <Upload size={15} />} PDF automatisch auslesen
                  <input type="file" accept="application/pdf" style={{ display: "none" }} onChange={handlePdfFile} disabled={imp.busy} />
                </label>
                {imp.fileName && !imp.busy && <span className="muted small-t">{imp.fileName}</span>}
              </div>
              {imp.err && <p className="warn-inline">{imp.err}</p>}
              <label className="lbl">Text zur Kontrolle (automatisch befüllt oder selbst eingefügt)</label>
              <textarea className="ta" style={{ minHeight: 180 }} value={imp.raw}
                onChange={(e) => setImp((s) => ({ ...s, raw: e.target.value, err: null }))}
                placeholder={"Text hier einfügen, z. B. aus deinem PDF-Betrachter kopiert (Strg/Cmd+A, dann Strg/Cmd+C).\nTrenne Kapitel mit einer eigenen Zeile: ==="} />
              <p className="muted small-t">Erkennbare Kapitelüberschriften wurden automatisch mit <code>===</code> markiert – bitte kurz prüfen und bei Bedarf verschieben oder ergänzen.</p>
              <div className="row" style={{ marginTop: 10 }}>
                <button className={`btn ${confirmArm === "imp-replace" ? "warn" : "primary"}`} onClick={() => applyImportChapters("replace")} disabled={!imp.raw.trim()}>
                  {confirmArm === "imp-replace" ? "Bestehende Kapitel werden ersetzt – zum Bestätigen erneut tippen" : "In Kapitel aufteilen & übernehmen"}
                </button>
                {hasOutline && <button className="btn" onClick={() => applyImportChapters("append")} disabled={!imp.raw.trim()}>An bestehende Kapitel anhängen</button>}
              </div>
            </div>

            <div className="divider"><span>oder KI-Gliederung generieren</span></div>

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

            {hasOutline && project.outline.length > 1 && (
              <div className="card">
                <div className="card-h row-sb">Struktur prüfen ({project.outline.length} Kapitel)
                  <button className="btn tiny" onClick={runStructureFix} disabled={!!loading || !!auto}>
                    {loading === "structure" ? <Loader2 size={13} className="spin" /> : <Sparkles size={13} />} Kapitelstruktur mit KI bereinigen
                  </button>
                </div>
                <p className="muted">Zu viele Kapitel nach dem Import? Die KI erkennt die echten Kapitelanfänge und verschmilzt fälschlich abgetrennte Zwischenüberschriften zurück in ihre Kapitel (sie bleiben dort als Überschriften erhalten). Einzelne Abschnitte kannst du auch manuell per <CornerLeftUp size={12} style={{ verticalAlign: "-1px" }} />-Knopf ans vorherige Kapitel anhängen.</p>
              </div>
            )}

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
                  {i > 0 && <button className="ico" onClick={() => mergeChapterUp(i)} title="Mit vorherigem Kapitel zusammenführen"><CornerLeftUp size={14} /></button>}
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

            {hasOutline && (
              <div className="card exp">
                <div className="exp-ico"><Languages size={20} /></div>
                <div className="grow">
                  <div className="card-h">Buch übersetzen</div>
                  <p className="muted">Übersetzt das komplette Manuskript <b>sinngemäß und idiomatisch</b> – keine Wort-für-Wort-Übersetzung: Redewendungen, Beispiele und Ansprache werden natürlich an die Zielsprache angepasst. Kapitel, Überschriften, Buchgerüst und Buchdaten werden übertragen; die Buchsprache im Export (Silbentrennung, Kapitel-Beschriftung, Copyright) stellt sich automatisch um. <b>Tipp:</b> Lade vorher im Export-Schritt ein Backup herunter.</p>
                  <div className="row">
                    <div>
                      <label className="lbl">Zielsprache</label>
                      <select className="inp" value={transTarget} onChange={(e) => setTransTarget(e.target.value)}>
                        {Object.entries(LANGS).filter(([k]) => k !== project.language).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                    <div style={{ alignSelf: "flex-end" }}>
                      {!auto ? (
                        <button className="btn primary" onClick={runTranslate} disabled={!!loading}>
                          <Languages size={15} /> Übersetzung starten
                        </button>
                      ) : (
                        <button className="btn" onClick={stopAutopilot}><Square size={15} /> Stoppen</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                      <div className="page" lang={project.language} style={previewStyle}>
                        <div className="page-inner">
                          <div className="bk-chnum">{BOOK_STRINGS[project.language].chapter} {activeCh + 1}</div>
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
                {extrasFor(project.bookType).map((def) => (
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
                <div className="page" lang={project.language} style={previewStyle}>
                  <div className="page-inner">
                    <div className="bk-chnum">{BOOK_STRINGS[project.language].chapter} 1</div>
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

            <div className="card trendcard">
              <div className="card-h row-sb"><span><Palette size={15} style={{ verticalAlign: "-2px" }} /> KI-Cover-Bild (Higgsfield)</span>
                <div className="row" style={{ gap: 6 }}>
                  <button className="btn tiny" onClick={genCoverPrompt} disabled={!!loading || !hasConcept}>
                    {loading === "coverprompt" ? <Loader2 size={13} className="spin" /> : <Sparkles size={13} />} Cover-Prompt (vorne + hinten)
                  </button>
                  <button className="btn tiny" onClick={genCoverImage} disabled={!!loading || !hasConcept}>
                    {loading === "coverimg" ? <Loader2 size={13} className="spin" /> : <Wand2 size={13} />} Bild generieren
                  </button>
                </div>
              </div>
              <p className="muted">Zwei Wege: <b>„Cover-Prompt"</b> erstellt einen detaillierten Bild-Prompt für Vorder- <b>und</b> Rückseite (mit Farbcodes, Komposition, „kein Text im Bild") – zum Kopieren in Higgsfield, Midjourney oder ein anderes Bild-Tool. <b>„Bild generieren"</b> erzeugt das Vorderseiten-Motiv direkt über deinen Higgsfield-Konnektor (verbraucht Higgsfield-Credits) und legt es automatisch hinter die Vorderseite deiner druckfertigen Cover-Vorlage.</p>
              {project.cover.imgPrompt && (
                <>
                  <div className="row-sb" style={{ marginTop: 10 }}>
                    <label className="lbl" style={{ margin: 0 }}>Dein Cover-Prompt (editierbar)</label>
                    <button className="btn tiny" onClick={() => copy("imgprompt", project.cover.imgPrompt)}>{copied === "imgprompt" ? <Check size={13} /> : <Copy size={13} />} Kopieren</button>
                  </div>
                  <textarea className="ta short" value={project.cover.imgPrompt} onChange={(e) => upCover({ imgPrompt: e.target.value })} />
                </>
              )}
              {project.cover.imageUrl && (
                <div style={{ marginTop: 10 }}>
                  <div className="row-sb">
                    <label className="lbl" style={{ margin: 0 }}>Generiertes Vorderseiten-Motiv (liegt hinter der Cover-Vorlage)</label>
                    <button className="btn tiny" onClick={() => upCover({ imageUrl: "" })}><Trash2 size={12} /> Entfernen</button>
                  </div>
                  <img src={project.cover.imageUrl} alt="KI-Cover-Motiv" style={{ maxWidth: 220, borderRadius: 10, border: "1px solid #E3DFEE", marginTop: 6 }} />
                  <p className="muted small-t">Per Rechtsklick/Langdruck zusätzlich sichern – generierte URLs können nach einiger Zeit ablaufen. In der Cover-Vorlage wird das Bild mit einem Farbschleier deiner Cover-Farbe überlagert, damit der Titel lesbar bleibt.</p>
                </div>
              )}
            </div>

            <div className="card exp">
              <div className="exp-ico"><Palette size={20} /></div>
              <div className="grow">
                <div className="card-h">Druckfertige Cover-Vorlage</div>
                <p className="muted">Komplett-Cover in exakten KDP-Maßen: Rückseite mit Klappentext und ausgespartem Barcode-Bereich, Buchrücken, Vorderseite. Als PDF speichern und direkt bei KDP hochladen – oder als maßgenaue Vorlage in Canva nachbauen.</p>
                <div className="row">
                  <button className="btn primary" onClick={() => openHtml(buildCoverHtml(project, stats.pages, false), "cover-final.html")} disabled={!hasConcept}><Printer size={15} /> Cover öffnen (final)</button>
                  <button className="btn" onClick={() => openHtml(buildCoverHtml(project, stats.pages, true), "cover-hilfslinien.html")} disabled={!hasConcept}>Mit Hilfslinien</button>
                  <button className="btn" onClick={() => download("cover-final.html", buildCoverHtml(project, stats.pages, false), "text/html")} disabled={!hasConcept}><Download size={15} /> Als Datei</button>
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
                  <div className="row" style={{ marginBottom: 12 }}>
                    <button className="btn" onClick={applyTypography} disabled={!!loading || !!auto}>
                      <Check size={14} /> Typografie bereinigen
                    </button>
                    <button className="btn" onClick={runProofread} disabled={!!loading || !!auto}>
                      {loading === "proof" ? <Loader2 size={14} className="spin" /> : <ShieldCheck size={14} />} KI-Rechtschreibprüfung (alle Kapitel)
                    </button>
                    <button className="btn" onClick={runDashFix} disabled={!!loading || !!auto}>
                      {loading === "dash" ? <Loader2 size={14} className="spin" /> : <PenLine size={14} />} Gedankenstriche reduzieren (KI)
                    </button>
                    <button className="btn" onClick={runHumanize} disabled={!!loading || !!auto}>
                      {loading === "humanize" ? <Loader2 size={14} className="spin" /> : <Feather size={14} />} Humanize-Durchlauf (alle Kapitel)
                    </button>
                  </div>
                  <p className="muted" style={{ marginBottom: 12 }}>„Typografie bereinigen" korrigiert sofort Abstände, Satzzeichen und Anführungszeichen in allen Kapiteln. Die KI-Prüfung geht danach Kapitel für Kapitel durch Rechtschreibung und Grammatik und wendet Korrekturen automatisch an (Protokoll unten).</p>
                  <div className={`qgrid qhead ${audit.isWb ? "" : "q2"}`}><span>Kapitel</span><span>Wörter</span>{audit.isWb && <><span>Übung</span><span>Linien</span><span>Checkliste/Skala</span></>}</div>
                  {audit.rows.map((r) => (
                    <div className={`qgrid ${audit.isWb ? "" : "q2"}`} key={r.i}>
                      <span className="qtitle">{r.i + 1}. {r.title}</span>
                      <span className={r.words < 400 ? "bad" : "good"}>{r.words}</span>
                      {audit.isWb && <>
                        <span className={r.uebung ? "good" : "bad"}>{r.uebung ? "✓" : "fehlt"}</span>
                        <span className={r.linien ? "good" : "bad"}>{r.linien ? "✓" : "fehlt"}</span>
                        <span className={r.check ? "good" : "bad"}>{r.check ? "✓" : "fehlt"}</span>
                      </>}
                    </div>
                  ))}
                  {audit.missingExtras.length > 0 && (
                    <p className="warn-inline" style={{ marginTop: 10 }}>Noch offen im Buchgerüst (Schritt 3): {audit.missingExtras.join(", ")}</p>
                  )}
                  {tips && <div className="desc tips">{tips.split("\n").map((p, i) => p.trim() && <p key={i}>{p}</p>)}</div>}

                  <div className="card-h" style={{ marginTop: 18 }}>Lesbarkeit (sofort, ohne KI)</div>
                  <div className="qgrid q4 qhead"><span>Kapitel</span><span>Ø Satzlänge</span><span>Sätze &gt; 25 W.</span><span>Füllwörter</span></div>
                  {readability.map((r) => (
                    <div className="qgrid q4" key={r.i}>
                      <span className="qtitle">{r.i + 1}. {r.title}</span>
                      <span className={r.avg > 18 ? "bad" : "good"}>{r.avg}</span>
                      <span className={r.long > 3 ? "bad" : "good"}>{r.long}</span>
                      <span className={r.fill > 4 ? "bad" : "good"}>{r.fill}</span>
                    </div>
                  ))}
                  <p className="muted small-t">Richtwerte für Ratgeber/Workbooks: Ø Satzlänge unter 18 Wörtern, wenige Schachtelsätze. Auffällige Kapitel gezielt in Schritt 3 überarbeiten oder die KI-Rechtschreibprüfung ergänzt kürzen lassen.</p>

                  <div className="card-h row-sb" style={{ marginTop: 18 }}><span><Users size={15} style={{ verticalAlign: "-2px" }} /> Beta-Leser-Panel</span>
                    <button className="btn tiny" onClick={genBeta} disabled={!!loading || !!auto}>
                      {loading === "beta" ? <Loader2 size={13} className="spin" /> : <Sparkles size={13} />} 3 Personas lesen dein Buch
                    </button>
                  </div>
                  {beta && beta.map((p, i) => (
                    <div className="persona" key={i}>
                      <b>{p.name}</b> <span className="muted">({p.profil})</span>
                      <div className="p-line ok-t">♥ {p.begeistert}</div>
                      <div className="p-line warn-t">△ Fehlt: {p.fehlt}</div>
                      <div className="p-line bad-t">✕ Absprung: {p.absprung}</div>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="card exp">
              <div className="exp-ico"><Printer size={20} /></div>
              <div className="grow">
                <div className="card-h">Taschenbuch (Print-Interior)</div>
                <p className="muted">Öffnet dein fertig gesetztes Buch mit exakter Trim-Größe ({trim.label.split("(")[0].trim()}), gespiegelten KDP-Rändern, Bundsteg, deutscher Silbentrennung und komplettem Buchgerüst. Im neuen Fenster auf „Als PDF speichern" klicken → dieses PDF lädst du bei KDP als Manuskript hoch.</p>
                <div className="row">
                  <button className="btn primary" onClick={() => openHtml(buildPrintHtml(project), `${(project.title || "buch").replace(/\s+/g, "-")}-print.html`)} disabled={!hasOutline}><Printer size={15} /> Print-Version öffnen</button>
                  <button className="btn" onClick={() => download(`${(project.title || "buch").replace(/\s+/g, "-")}-print.html`, buildPrintHtml(project), "text/html")} disabled={!hasOutline}><Download size={15} /> Als Datei speichern</button>
                </div>
                <p className="muted small-t">Falls sich kein Fenster öffnet: „Als Datei speichern" nutzen, die Datei per Doppelklick im Browser öffnen und dort mit Strg/Cmd+P als PDF speichern. Wichtig im Druckdialog: „Hintergrundgrafiken" AN und unter „Weitere Einstellungen" den Haken bei „Kopf- und Fußzeilen" ENTFERNEN – sonst druckt der Browser den Dateipfad auf jede Seite.</p>
              </div>
            </div>

            <div className="card exp">
              <div className="exp-ico"><FileText size={20} /></div>
              <div className="grow">
                <div className="card-h">E-Book (Kindle)</div>
                <p className="muted">Lädt eine <b>fertige, validierte EPUB-Datei</b> herunter (EPUB 3, besteht den offiziellen W3C-Check mit 0 Fehlern) – direkt bei KDP als E-Book-Manuskript hochladbar, ganz ohne Umwandlungs-Tools. HTML und Word gibt es weiterhin als Alternativen für eigene Workflows.</p>
                <div className="row">
                  <button className="btn primary" onClick={() => downloadBlob(`${(project.title || "ebook").replace(/\s+/g, "-")}.epub`, buildEpub(project))} disabled={!hasOutline}><Download size={15} /> EPUB herunterladen</button>
                  <button className="btn" onClick={() => download(`${(project.title || "ebook").replace(/\s+/g, "-")}.html`, buildEbookHtml(project), "text/html")} disabled={!hasOutline}><Download size={15} /> HTML</button>
                  <button className="btn" onClick={() => download(`${(project.title || "buch").replace(/\s+/g, "-")}.doc`, buildEbookHtml(project), "application/msword")} disabled={!hasOutline}><Download size={15} /> Word (.doc)</button>
                </div>
              </div>
            </div>

            <div className="card exp">
              <div className="exp-ico" style={{ background: `${project.digital.accent}22`, color: project.digital.accent }}><Smartphone size={20} /></div>
              <div className="grow">
                <div className="card-h">Digital-Produkt (PDF für deine eigene Website)</div>
                <p className="muted">Erstellt eine <b>fürs Smartphone optimierte PDF</b>: schmales Hochformat, große Schrift, farbige Überschriften und Übungsboxen in deiner Markenfarbe – ohne Zoomen lesbar. Perfekt als Freebie/Lead-Magnet oder kaufbarer Download. Über die Kapitel-Auswahl kannst du auch nur einzelne Kapitel auskoppeln (z. B. Kapitel 1 als Gratis-Leseprobe).</p>
                <div className="row">
                  <div className="grow">
                    <label className="lbl">Format</label>
                    <select className="inp" value={project.digital.format} onChange={(e) => upDigital({ format: e.target.value })}>
                      {Object.entries(DIGITAL_FORMATS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="lbl">Markenfarbe</label>
                    <input type="color" className="colorinp" value={project.digital.accent} onChange={(e) => upDigital({ accent: e.target.value })} />
                  </div>
                  <div>
                    <label className="lbl">Schrift: {project.digital.fontSize} pt</label>
                    <input type="range" min={12} max={18} step={0.5} value={project.digital.fontSize} className="range" style={{ width: 110 }}
                      onChange={(e) => upDigital({ fontSize: parseFloat(e.target.value) })} />
                  </div>
                </div>
                {hasOutline && (
                  <>
                    <label className="lbl">Enthaltene Kapitel (antippen zum Ab-/Anwählen)</label>
                    <div className="chtabs" style={{ marginBottom: 6 }}>
                      {project.outline.map((ch, i) => (
                        <button key={ch.id} className={`chtab ${project.digital.sel[ch.id] !== false ? "on" : ""}`} onClick={() => toggleDigitalCh(ch.id)} title={ch.title}>
                          {i + 1}
                        </button>
                      ))}
                    </div>
                    <label className="chk-line">
                      <input type="checkbox" checked={project.digital.withExtras} onChange={(e) => upDigital({ withExtras: e.target.checked })} />
                      Buchgerüst einbeziehen (Einleitung, Schlusswort, Bonus-Seite)
                    </label>
                  </>
                )}
                <div className="row" style={{ marginTop: 10 }}>
                  <button className="btn primary" onClick={() => openHtml(buildDigitalHtml(project), `${(project.title || "digital").replace(/\s+/g, "-")}-digital.html`)} disabled={!hasOutline}><Smartphone size={15} /> Digital-PDF öffnen</button>
                  <button className="btn" onClick={() => download(`${(project.title || "digital").replace(/\s+/g, "-")}-digital.html`, buildDigitalHtml(project), "text/html")} disabled={!hasOutline}><Download size={15} /> Als Datei speichern</button>
                </div>
              </div>
            </div>

            <div className="card exp">
              <div className="exp-ico"><Mic size={20} /></div>
              <div className="grow">
                <div className="card-h">Hörbuch-Skript</div>
                <p className="muted">Wandelt dein Buch in ein sprechfertiges Skript um: Kapitel-Ansagen, Sprechhinweise, [PAUSE]-Marker statt Schreiblinien, Übungen als gesprochene Anleitungen. Für KDPs Virtual Voice, eine eigene Aufnahme oder ein:e Sprecher:in.</p>
                <button className="btn" onClick={() => download(`${(project.title || "buch").replace(/\s+/g, "-")}-hoerbuch-skript.txt`, buildAudioScript(project), "text/plain")} disabled={!hasOutline}><Download size={15} /> Skript herunterladen (.txt)</button>
              </div>
            </div>

            {audit.isWb && collectExercises(project).length > 0 && (
              <div className="card exp">
                <div className="exp-ico" style={{ background: `${project.digital.accent}22`, color: project.digital.accent }}><FileText size={20} /></div>
                <div className="grow">
                  <div className="card-h">Printable-Generator (Einzel-Übungen)</div>
                  <p className="muted">Macht aus jeder Übung deines Workbooks ein schön gestaltetes A4-Arbeitsblatt in deiner Markenfarbe – das klassische Etsy-/Freebie-Produkt. {collectExercises(project).length} Übungen gefunden:</p>
                  {collectExercises(project).map((ex, i) => (
                    <div className="gap-row" key={i}>
                      <div className="grow"><b>{ex.title}</b><br /><span className="muted">aus: {ex.chapter}</span></div>
                      <button className="btn tiny" onClick={() => openHtml(buildPrintableHtml(project, ex), `uebung-${i + 1}.html`)}><Printer size={12} /> Öffnen</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
            <p className="ps">SEO-optimierte Buchbeschreibung, 7 recherchebasierte SEO-Keywords und Kategorien – fertig zum Einfügen in dein KDP-Dashboard.</p>

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
                  <div className="card-h row-sb">7 SEO-Keywords
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
            <div className="card" style={{ marginTop: 14 }}>
              <div className="card-h row-sb"><span><Rocket size={15} style={{ verticalAlign: "-2px" }} /> Launch-Kit</span>
                <div className="row" style={{ gap: 6 }}>
                  <button className="btn tiny" onClick={genPosts} disabled={!!loading || !!auto || !hasOutline}>
                    {loading === "posts" ? <Loader2 size={13} className="spin" /> : <Sparkles size={13} />} 30-Tage-Content-Plan
                  </button>
                  <button className="btn tiny" onClick={genEmails} disabled={!!loading || !!auto || !hasConcept}>
                    {loading === "emails" ? <Loader2 size={13} className="spin" /> : <Sparkles size={13} />} E-Mail-Sequenz (5 Mails)
                  </button>
                </div>
              </div>
              <p className="muted">Social-Media-Post-Ideen direkt aus deinen Kapiteln und eine 5-teilige E-Mail-Sequenz (Freebie → Kauf) – beides im Stil deiner Autoren-DNA, falls hinterlegt.</p>
              {project.launch.posts.length > 0 && (
                <>
                  <div className="card-h row-sb" style={{ marginTop: 12 }}>Content-Plan ({project.launch.posts.length} Tage)
                    <button className="btn tiny" onClick={() => copy("posts", project.launch.posts.map((p) => `Tag ${p.t}: ${p.idee}`).join("\n"))}>
                      {copied === "posts" ? <Check size={13} /> : <Copy size={13} />} Alle kopieren
                    </button>
                  </div>
                  <div className="postlist">
                    {project.launch.posts.map((p, i) => <div className="cl" key={i}><b>Tag {p.t}:</b> {p.idee}</div>)}
                  </div>
                </>
              )}
              {project.launch.emails.length > 0 && project.launch.emails.map((m, i) => (
                <div className="persona" key={i}>
                  <div className="row-sb"><b>Mail {i + 1} · Tag {m.tag}: {m.betreff}</b>
                    <button className="btn tiny" onClick={() => copy(`mail${i}`, `Betreff: ${m.betreff}\n\n${m.text}`)}>
                      {copied === `mail${i}` ? <Check size={13} /> : <Copy size={13} />} Kopieren
                    </button>
                  </div>
                  <div className="muted" style={{ whiteSpace: "pre-wrap", marginTop: 6 }}>{m.text}</div>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="card-h"><Quote size={15} style={{ verticalAlign: "-2px" }} /> Zitat-Karten für Social Media</div>
              <p className="muted">Merksätze aus deinem Buch als teilbare 1080×1080-Grafiken in deiner Markenfarbe – fertige PNG-Downloads für Instagram & Pinterest.</p>
              {collectQuotes(project).length === 0 ? (
                <p className="muted small-t">Noch keine Merksätze gefunden – Merksätze entstehen aus &gt;-Zeilen in deinen Kapiteln (der Autopilot baut sie automatisch ein).</p>
              ) : collectQuotes(project).map((q, i) => (
                <div className="gap-row" key={i}>
                  <div className="grow" style={{ fontStyle: "italic" }}>„{q}"</div>
                  <button className="btn tiny" onClick={() => downloadQuoteCard(q)}><Download size={12} /> PNG</button>
                </div>
              ))}
            </div>

            <div className="card exp">
              <div className="exp-ico"><Globe size={20} /></div>
              <div className="grow">
                <div className="card-h">Leseprobe-Landingpage</div>
                <p className="muted">Eine fertige, mobilfreundliche Verkaufsseite für deine Website: Hero in Markenfarbe, Nutzen-Liste aus deinen Kapiteln, echte Leseprobe mit Ausblend-Effekt, Kauf-Buttons und E-Mail-Eintragung. Platzhalter [KAUF-LINK] und das Formular ersetzt du laut Anleitung in der Datei; Impressum/Datenschutz sind als Pflicht-Links vorgesehen.</p>
                <div className="row">
                  <button className="btn primary" onClick={() => openHtml(buildLandingHtml(project), "landingpage.html")} disabled={!hasOutline}><Globe size={15} /> Vorschau öffnen</button>
                  <button className="btn" onClick={() => download("landingpage.html", buildLandingHtml(project), "text/html")} disabled={!hasOutline}><Download size={15} /> Als Datei speichern</button>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-h row-sb"><span><Library size={15} style={{ verticalAlign: "-2px" }} /> Serien-Planer</span>
                <button className="btn tiny" onClick={genSeries} disabled={!!loading || !hasConcept}>
                  {loading === "series" ? <Loader2 size={13} className="spin" /> : <Sparkles size={13} />} 2 Folgebände planen
                </button>
              </div>
              <p className="muted">Serien verkaufen sich besser als Einzeltitel: Wer Band 1 mag, kauft Band 2. Der Planer entwirft Folgebände mit gemeinsamem Titel-Branding – ein Klick legt Band 2 als neues Projekt an, mit deiner Autoren-DNA und allen Einstellungen.</p>
              {project.series.map((b, i) => (
                <div className="gap-row" key={i}>
                  <div className="grow"><b>{b.titel}</b><br /><span className="muted">{b.untertitel}</span><br /><span className="muted">Fokus: {b.fokus}</span></div>
                  <button className="btn tiny primary-t" onClick={() => createProjectFrom(b)}><FolderPlus size={12} /> Als Projekt anlegen</button>
                </div>
              ))}
            </div>

            <div className="next"><button className="btn primary" onClick={() => setStep(7)}>Weiter zum Veröffentlichen <ChevronRight size={15} /></button></div>
          </div>
        )}

        {/* ============ SCHRITT 8: VERÖFFENTLICHEN ============ */}
        {step === 7 && (
          <div className="panel">
            <h1 className="pt">Veröffentlichen bei KDP</h1>
            <p className="ps">Erst prüfen, dann Preis kalkulieren, dann Schritt für Schritt durch das KDP-Dashboard – auch wenn du es noch nie gemacht hast.</p>

            <div className="card">
              <div className="card-h"><ShieldCheck size={15} style={{ verticalAlign: "-2px" }} /> Pre-Flight-Check gegen die KDP-Vorgaben
                <span className={`pf-badge ${preflight.errs ? "bad-bg" : preflight.warns ? "warn-bg" : "ok-bg"}`}>
                  {preflight.errs ? `${preflight.errs} Fehler` : preflight.warns ? `${preflight.warns} Hinweise` : "Bereit ✓"}
                </span>
              </div>
              {preflight.checks.map((ch, i) => (
                <div className={`pf-row ${ch.level}`} key={i}>
                  <span className="pf-ico">{ch.level === "ok" ? "✓" : ch.level === "warn" ? "!" : "✕"}</span>
                  <span>{ch.text}</span>
                </div>
              ))}
              <p className="muted small-t">Der Check prüft alles, was das Tool sehen kann. Was er nicht prüfen kann: das fertige PDF selbst (gerade Seitenzahl, Schrift-Einbettung) – dafür ist der KDP-Previewer in Schritt 8 der Anleitung da, der ist verbindlich.</p>
            </div>

            <div className="card">
              <div className="card-h">Preis-Kalkulator</div>
              <div className="row">
                <div className="grow">
                  <label className="lbl">Ausgabe</label>
                  <select className="inp" value={project.pub.binding} onChange={(e) => upPub({ binding: e.target.value })}>
                    <option value="paperback">Taschenbuch</option>
                    <option value="hardcover">Hardcover (gebunden)</option>
                  </select>
                </div>
                <div>
                  <label className="lbl">Print-Listenpreis (€)</label>
                  <input type="number" step="0.5" min="1" className="inp num" value={project.pub.price}
                    onChange={(e) => upPub({ price: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="lbl">E-Book-Preis (€)</label>
                  <input type="number" step="0.5" min="0" className="inp num" value={project.pub.ebookPrice}
                    onChange={(e) => upPub({ ebookPrice: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
              {(() => {
                const pages = project.cover.pageCount || stats.pages;
                const cost = estimatePrintCost(pages, project.pub.binding);
                const netto = project.pub.price / 1.07;
                const royalty = 0.6 * netto - cost;
                const minPrice = Math.ceil(((cost / 0.6) * 1.07) * 100) / 100;
                const eNetto = project.pub.ebookPrice / 1.07;
                const e70 = project.pub.ebookPrice >= 2.99 && project.pub.ebookPrice <= 9.99;
                const eRoyalty = e70 ? 0.7 * eNetto : 0.35 * eNetto;
                return (
                  <div className="dims" style={{ marginTop: 12 }}>
                    <div><span>Druckkosten (≈ bei {pages} S.)</span><b>{cost.toFixed(2)} €</b></div>
                    <div><span>Mindest-Listenpreis</span><b>{minPrice.toFixed(2)} €</b></div>
                    <div><span>Deine Print-Tantieme</span><b className={royalty < 0 ? "bad" : ""}>{royalty.toFixed(2)} € / Buch</b></div>
                    <div><span>E-Book-Tantieme ({e70 ? "70 %" : "35 %"})</span><b>{eRoyalty.toFixed(2)} € / Verkauf</b></div>
                  </div>
                );
              })()}
              <p className="muted small-t">Formel: 60 % vom Nettopreis minus Druckkosten (s/w, Amazon.de); E-Book 70 % zwischen 2,99–9,99 €, sonst 35 %. Das ist eine Schätzung als Orientierung – der verbindliche Rechner ist der im KDP-Preis-Tab. Hardcover-Werte sind Richtwerte.</p>
              {project.pub.binding === "hardcover" && (
                <p className="warn-inline">Hardcover: Dein Interior-PDF passt unverändert (Minimum 75 Seiten). Für das Cover nutze aber den KDP-Vorlagenrechner („KDP Cover-Vorlage berechnen") statt unserer Taschenbuch-Vorlage – Hardcover-Cover haben zusätzliche Einschlag-Ränder.</p>
              )}
            </div>

            <div className="card">
              <div className="card-h">Deine Upload-Anleitung ({Object.values(project.pub.checks).filter(Boolean).length}/{KDP_GUIDE.length} erledigt)</div>
              {KDP_GUIDE.map((g, i) => (
                <div className={`guide ${project.pub.checks[g.k] ? "done" : ""}`} key={g.k}>
                  <button className="guide-check" onClick={() => togglePubCheck(g.k)} aria-label="Erledigt umschalten">
                    {project.pub.checks[g.k] ? <Check size={13} /> : <span className="guide-num">{i + 1}</span>}
                  </button>
                  <div className="grow">
                    <div className="guide-t">{g.t}</div>
                    <div className="guide-d">{g.d}</div>
                    {g.k === "details" && (
                      <div className="row" style={{ marginTop: 8 }}>
                        <button className="btn tiny" onClick={() => copy("g-t", project.title)}>{copied === "g-t" ? <Check size={12} /> : <Copy size={12} />} Titel</button>
                        <button className="btn tiny" onClick={() => copy("g-st", project.subtitle)}>{copied === "g-st" ? <Check size={12} /> : <Copy size={12} />} Untertitel</button>
                        <button className="btn tiny" onClick={() => copy("g-au", project.author)}>{copied === "g-au" ? <Check size={12} /> : <Copy size={12} />} Autor</button>
                        {project.kdp && <button className="btn tiny" onClick={() => copy("g-d", project.kdp.beschreibung)}>{copied === "g-d" ? <Check size={12} /> : <Copy size={12} />} Beschreibung</button>}
                      </div>
                    )}
                    {g.k === "keywords" && project.kdp && (
                      <div className="row" style={{ marginTop: 8 }}>
                        <button className="btn tiny" onClick={() => copy("g-kw", (project.kdp.keywords || []).join("; "))}>{copied === "g-kw" ? <Check size={12} /> : <Copy size={12} />} Alle 7 Keywords kopieren</button>
                      </div>
                    )}
                    {g.k === "interior" && (
                      <div className="guide-d" style={{ marginTop: 6 }}><b>Deine Werte:</b> Trim-Größe {trim.label.split("(")[0].trim()} · Kein Beschnitt · {project.cover.paper === "white" ? "Weißes" : "Cremefarbenes"} Papier</div>
                    )}
                  </div>
                </div>
              ))}
              <p className="muted small-t">Deine Häkchen werden im Projekt gespeichert – du kannst jederzeit unterbrechen und später weitermachen.</p>
            </div>
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
.ok { display: flex; gap: 8px; align-items: flex-start; background: #EAF6F0; border: 1px solid #BCE0CE; color: #23694C; padding: 10px 14px; border-radius: 10px; font-size: 13px; margin-bottom: 16px; }
.okx { border: 0; background: none; color: #23694C; font-size: 16px; cursor: pointer; line-height: 1; padding: 0 2px; }
.manualcopy { background: #FBF3E4; border: 1px solid #E9D6AE; border-radius: 12px; padding: 14px 16px; margin-bottom: 16px; }
.manualcopy .ta { margin-top: 8px; min-height: 70px; background: #fff; }
.btn.warn { background: #B4762A; border-color: #B4762A; color: #fff; }
.btn.warn:hover:not(:disabled) { background: #9A6120; color: #fff; }
.autobar { display: flex; gap: 12px; align-items: center; background: #241E31; color: #fff; padding: 12px 16px; border-radius: 12px; margin-bottom: 16px; position: sticky; top: 10px; z-index: 20; box-shadow: 0 8px 24px -10px rgba(36,30,49,0.5); }
.auto-msg { font-size: 13px; margin-bottom: 6px; }
.auto-track { height: 5px; background: rgba(255,255,255,0.15); border-radius: 99px; overflow: hidden; }
.auto-fill { height: 100%; background: #9C86E8; border-radius: 99px; transition: width 0.6s ease; }

.card { background: #fff; border: 1px solid #E3DFEE; border-radius: 14px; padding: 18px 20px; margin-bottom: 14px; }
.card-h { font-weight: 600; font-size: 14.5px; margin-bottom: 12px; }
.card.hint { display: flex; gap: 10px; align-items: flex-start; background: #F5F1E6; border-color: #E5DCC2; font-size: 13px; color: #5C5334; }
.card.autopilot { display: flex; gap: 16px; background: linear-gradient(135deg, #FDFBF4, #F4EFFC); border-color: #D9CBEE; }
.card.import { border-color: #CFE0DA; background: #F6FAF8; }
.divider { display: flex; align-items: center; gap: 10px; margin: 18px 0; color: #8B84A0; font-size: 12px; }
.divider::before, .divider::after { content: ""; flex: 1; height: 1px; background: #E3DFEE; }
code { background: #EDE8F8; color: #4E3D8F; padding: 1px 5px; border-radius: 4px; font-size: 0.92em; }
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
.qgrid.q2 { grid-template-columns: 1fr 90px; }
.qgrid.qhead { font-weight: 600; color: #8B84A0; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; border-bottom: 1px solid #E3DFEE; }
.qtitle { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.good { color: #3E8E7E; font-weight: 600; }
.bad { color: #B04444; font-weight: 600; }
.tips { margin-top: 12px; background: #F4F1FA; border-radius: 10px; padding: 12px 14px; }

/* Trend-Radar */
.gap-row { display: flex; gap: 10px; align-items: flex-start; font-size: 12.5px; padding: 9px 0; border-bottom: 1px dashed #E9E5F2; line-height: 1.5; }
.gap-row:last-of-type { border-bottom: 0; }
.gap-row .tbadge { flex: none; margin-top: 2px; }
.title-row { display: flex; gap: 10px; align-items: center; width: 100%; text-align: left; background: #FCFBFE; border: 1px solid #E3DFEE; border-radius: 10px; padding: 9px 12px; margin-bottom: 6px; cursor: pointer; font-family: inherit; font-size: 12.5px; color: inherit; line-height: 1.45; }
.title-row:hover { border-color: #6C57B8; }
.tscore { flex: none; width: 34px; height: 26px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; }
.persona { background: #FCFBFE; border: 1px solid #E9E5F2; border-radius: 10px; padding: 12px 14px; margin-top: 10px; font-size: 12.5px; line-height: 1.5; }
.p-line { margin-top: 4px; }
.ok-t { color: #23694C; } .warn-t { color: #8A5A1B; } .bad-t { color: #8C3535; }
.postlist { max-height: 260px; overflow-y: auto; border: 1px solid #EEEBF5; border-radius: 10px; padding: 4px 12px; }
.qgrid.q4 { grid-template-columns: 1fr 90px 90px 90px; }
.chk-line { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: #4A4460; margin-top: 4px; cursor: pointer; }
.chk-line input { accent-color: #6C57B8; width: 15px; height: 15px; }
.trendcard { background: linear-gradient(135deg, #FFFDF7, #F2F6FC); border-color: #D4DEED; }
.trends { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-top: 12px; }
.trend { background: #fff; border: 1px solid #E3DFEE; border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 8px; }
.trend-t { font-family: 'Fraunces', serif; font-weight: 600; font-size: 14.5px; }
.trend-badges { display: flex; gap: 6px; flex-wrap: wrap; }
.tbadge { font-size: 10.5px; font-weight: 600; padding: 3px 8px; border-radius: 999px; }
.trend-why { font-size: 12px; color: #5A5370; line-height: 1.5; }
.trend-idea { font-size: 12px; color: #4A4460; background: #F4F1FA; border-radius: 8px; padding: 8px 10px; line-height: 1.5; }
.btn.primary-t { background: #6C57B8; border-color: #6C57B8; color: #fff; justify-content: center; }
.btn.primary-t:hover:not(:disabled) { background: #5B47A3; color: #fff; }

/* Pre-Flight & Guide */
.pf-badge { float: right; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 999px; }
.ok-bg { background: #EAF6F0; color: #23694C; } .warn-bg { background: #FBF3E4; color: #8A5A1B; } .bad-bg { background: #FBEAEA; color: #8C3535; }
.pf-row { display: flex; gap: 9px; align-items: flex-start; font-size: 13px; padding: 6px 0; border-bottom: 1px dashed #E9E5F2; }
.pf-row:last-of-type { border-bottom: 0; }
.pf-ico { width: 18px; height: 18px; flex: none; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; margin-top: 1px; }
.pf-row.ok .pf-ico { background: #EAF6F0; color: #23694C; }
.pf-row.warn .pf-ico { background: #FBF3E4; color: #8A5A1B; }
.pf-row.err .pf-ico { background: #FBEAEA; color: #8C3535; }
.pf-row.err { color: #8C3535; font-weight: 500; }
.guide { display: flex; gap: 12px; padding: 12px 0; border-bottom: 1px dashed #E9E5F2; }
.guide:last-of-type { border-bottom: 0; }
.guide.done { opacity: 0.55; }
.guide-check { width: 26px; height: 26px; flex: none; border-radius: 8px; border: 1.5px solid #C9C2DC; background: #fff; color: #3E8E7E; display: flex; align-items: center; justify-content: center; cursor: pointer; margin-top: 2px; }
.guide.done .guide-check { background: #EAF6F0; border-color: #7FBFA5; }
.guide-num { font-size: 12px; font-weight: 600; color: #6C57B8; }
.guide-t { font-weight: 600; font-size: 13.5px; margin-bottom: 3px; }
.guide-d { font-size: 12.5px; color: #5A5370; line-height: 1.55; }

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
