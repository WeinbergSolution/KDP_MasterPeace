// Central, type-safe comparison configuration for the landing page. Strictly
// qualitative and verifiable — no invented minutes, costs, ghostwriter prices,
// "faster than everyone" claims, or competitor names/logos. Add verified,
// sourced measurements here later; the UI needs no change.

/** A comparison column (one offering). */
export interface CompareColumn {
  readonly name: string;
  readonly highlighted: boolean;
}

export const COMPARE_COLUMNS: readonly CompareColumn[] = [
  { name: 'KDP MasterPeace', highlighted: true },
  { name: 'Einzelne Software-Werkzeuge', highlighted: false },
  { name: 'Ghostwriter oder Agentur', highlighted: false },
];

/** One comparison row: a category and its value per offering. */
export interface CompareRow {
  readonly category: string;
  readonly mp: string;
  readonly tools: string;
  readonly agency: string;
}

export const COMPARE_ROWS: readonly CompareRow[] = [
  {
    category: 'Arbeitsweise',
    mp: 'Geführter 8-Schritte-Workflow in einem Arbeitsbereich',
    tools: 'Mehrere getrennte Anwendungen möglich',
    agency: 'Projektbasierte Zusammenarbeit',
  },
  {
    category: 'Projektkontrolle',
    mp: 'Du behältst die direkte Kontrolle',
    tools: 'Kontrolle über mehrere Werkzeuge verteilt',
    agency: 'Umsetzung liegt bei Dritten',
  },
  {
    category: 'Ideen und Gliederung',
    mp: 'Ideen-/Trend-Bereich und Gliederung integriert',
    tools: 'Je nach Werkzeugwahl getrennt',
    agency: 'Im Briefing abzustimmen',
  },
  {
    category: 'Schreiben und Überarbeiten',
    mp: 'Schreibbereich mit Live-Vorschau; manuell jederzeit möglich',
    tools: 'Inhalte häufig zwischen Werkzeugen übertragen',
    agency: 'Über Korrekturrunden abgestimmt',
  },
  {
    category: 'Formatierung',
    mp: 'Trim, Schrift, Bundsteg und Satz integriert',
    tools: 'Separates Layout-/Satzwerkzeug nötig',
    agency: 'Teil des Leistungsumfangs, individuell',
  },
  {
    category: 'Cover-Workflow',
    mp: 'Maße, Rücken, Klappentext und druckfertige Vorlage',
    tools: 'Separates Grafikwerkzeug nötig',
    agency: 'Individuell beauftragt',
  },
  {
    category: 'Export und KDP-Paket',
    mp: 'Print-PDF, EPUB, Digitalprodukt und KDP-Paket integriert',
    tools: 'Export je Werkzeug unterschiedlich',
    agency: 'Abhängig vom Angebot',
  },
  {
    category: 'Veröffentlichungs-Checkliste',
    mp: 'Pre-Flight-Check und Upload-Anleitung integriert',
    tools: 'Selbst zusammenzustellen',
    agency: 'Je nach Leistungsumfang',
  },
  {
    category: 'Anzahl benötigter Werkzeuge',
    mp: 'Ein zentraler Arbeitsbereich',
    tools: 'Mehrere Anwendungen',
    agency: 'Externe Dienstleistung',
  },
  {
    category: 'Preismodell',
    mp: 'Tarif mit festem Buch- und KI-Kontingent',
    tools: 'Ggf. mehrere Software-Abonnements',
    agency: 'Individuelles projektbezogenes Angebot',
  },
  {
    category: 'Typische Abstimmungsschleifen',
    mp: 'Direkte Selbstbedienung, keine externen Runden',
    tools: 'Abhängig von der Werkzeugkombination',
    agency: 'Mehrere Briefing- und Korrekturrunden möglich',
  },
  {
    category: 'Zeitaufwand',
    mp: 'Geführter Selbstbedienungs-Workflow',
    tools: 'Abhängig von Werkzeugwechseln und manueller Zusammenführung',
    agency: 'Abhängig von Briefing, Umfang und Korrekturschleifen',
  },
  {
    category: 'Kosten',
    mp: 'Transparenter Tarif mit festem Buch- und KI-Kontingent',
    tools: 'Je nach Kombination mehrere Software-Abonnements möglich',
    agency: 'Individuelles projektbezogenes Angebot',
  },
];

/** Neutral footnote below the comparison table. */
export const COMPARE_NOTE =
  'Zeit und Kosten hängen von Buchumfang, gewünschter Qualität, Überarbeitungsbedarf und Arbeitsweise ab.';
