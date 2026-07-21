# ADR-0013: Print-PDF – Chromium (Playwright) + Paged.js im Worker

Status: accepted · 2026-07-12

## Kontext
Reproduzierbares Print-PDF mit exakter Seitengröße, gespiegelten Rändern,
Bundsteg, Umbruchkontrolle, eingebetteten Fonts, Bleed-Profilen; kein Browser-
Druckdialog als Exportweg (Masterprompt §11, Legacy-Problem P08).

## Optionen
1. **Headless Chromium + Paged.js** – nutzt vorhandene CSS-Paged-Media-Kompetenz
   aus dem Legacy (`bookCss`), gute @page-Unterstützung via Polyfill, ein Renderer
   für Interior und Cover.
2. Typst – exzellente Typografie, aber zweite Templatesprache neben AST→HTML.
3. WeasyPrint – gutes Paged Media, Python-Stack im TS-Monorepo.
4. pdf-lib/PDFKit – Low-Level-Satz von Hand, Umbruchlogik komplett Eigenbau.
5. Prince/PDFreactor – beste Qualität, kommerzielle Lizenzkosten.

## Entscheidung
Playwright-verwaltetes Chromium im Worker rendert AST→Paged-HTML (Paged.js) →
`page.pdf()` mit exakter Größe; Fonts selbst gehostet und eingebettet (kein
Google-Fonts-Runtime-Import, Befund N09). Automatische Prüfung: Seitenformat
(MediaBox), Font-Embedding, Seitenzahl (pdf-lib-Inspektion). No-Bleed zuerst,
Bleed-Profil als Parameter.

## Konsequenzen
Deterministische Ausgabe erfordert Versionspinning (Chromium, Paged.js) und
`prefers-reduced-motion`-freie Print-Styles; Seitenzahl fließt zurück in CoverProject.

## Risiken
Paged.js-Grenzen bei Widow/Orphan-Feinheiten; Mitigation: dokumentierte Grenzen,
Prince als bezahlter Ausweich hinter demselben Renderer-Port.

## Migrationswirkung
`bookCss`-Wissen (Ränder, page-break-Regeln, Silbentrennung) wird übernommen.

## Revisit Trigger
Qualitätsmängel in KDP-Previewer-Tests oder > 60 s Renderzeit pro 200 Seiten.
