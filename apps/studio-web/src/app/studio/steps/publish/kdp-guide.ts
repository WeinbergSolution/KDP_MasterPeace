// The 9-step KDP upload guide (Step 8), ported 1:1 from the Legacy V3 reference,
// in reference order. The descriptions mirror Amazon's KDP dashboard flow as
// general orientation only — they are no individual tax/legal advice and no
// guarantee of Amazon's current UI. See KDP_RULES for the versioned source date;
// re-verify these steps against the official KDP dashboard before production.

/** A single KDP upload-guide step (key, title, description). */
export interface GuideStep {
  readonly k: string;
  readonly t: string;
  readonly d: string;
}

export const KDP_GUIDE: readonly GuideStep[] = [
  {
    k: 'konto',
    t: 'KDP-Konto anlegen',
    d: 'Gehe auf kdp.amazon.com und melde dich mit deinem normalen Amazon-Konto an. Fülle einmalig das Steuerinterview aus (als Privatperson in Deutschland: TIN = deine Steuer-ID) und hinterlege dein Bankkonto für die Auszahlungen.',
  },
  {
    k: 'titel',
    t: 'Neuen Titel erstellen',
    d: 'Im KDP-Dashboard auf „+ Erstellen" klicken und „Taschenbuch" wählen (das E-Book kannst du danach mit einem Klick aus demselben Projekt anlegen).',
  },
  {
    k: 'details',
    t: 'Buchdetails ausfüllen',
    d: 'Sprache wählen, dann Titel, Untertitel, Autor und Beschreibung eintragen — nutze die Kopier-Buttons unten. Bei der Frage nach KI-Inhalten wahrheitsgemäß „Mit KI-Unterstützung erstellt" angeben; das ist erlaubt und beeinflusst die Veröffentlichung nicht.',
  },
  {
    k: 'keywords',
    t: 'SEO-Keywords & Kategorien',
    d: 'Die 7 recherchebasierten SEO-Keywords aus deinem KDP-Paket in die 7 Felder einfügen und bis zu 3 Kategorien wählen (im KDP-Paket-Schritt generiert).',
  },
  {
    k: 'isbn',
    t: 'ISBN zuweisen',
    d: '„Kostenlose KDP-ISBN" wählen — du brauchst keine eigene zu kaufen. (Nur fürs Taschenbuch; E-Books brauchen keine ISBN.)',
  },
  {
    k: 'interior',
    t: 'Manuskript hochladen',
    d: 'Trim-Größe exakt so einstellen wie im Tool gewählt, „Kein Beschnitt (No Bleed)" und „Cover-Finish: Matt oder Glänzend" wählen. Dann dein Print-PDF aus dem Export-Schritt hochladen.',
  },
  {
    k: 'cover',
    t: 'Cover hochladen',
    d: 'Dein Cover-PDF aus dem Cover-Schritt hochladen (oder alternativ den KDP Cover Creator nutzen). Wichtig: Vorher die finale Seitenzahl aus dem Print-PDF im Cover-Schritt eintragen, damit der Buchrücken stimmt.',
  },
  {
    k: 'preview',
    t: 'Print-Previewer prüfen',
    d: 'Den „Previewer starten" und ALLE Seiten durchblättern: Ränder, Seitenumbrüche, Schreiblinien. Erst freigeben, wenn alles passt — der Previewer zeigt exakt das spätere Druckbild.',
  },
  {
    k: 'preis',
    t: 'Preis festlegen & veröffentlichen',
    d: 'Marktplätze auswählen, Listenpreis eintragen (Kalkulator oben hilft), dann „Veröffentlichen". Amazon prüft das Buch — das dauert bis zu 72 Stunden, meist deutlich kürzer. Du bekommst eine E-Mail, sobald es live ist.',
  },
];
