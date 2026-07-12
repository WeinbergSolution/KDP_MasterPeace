# ADR-0011: DOCX – npm-Bibliothek `docx` (echtes OOXML)

Status: accepted · 2026-07-12

## Kontext
Echtes .docx mit Stilen, TOC-Struktur, Listen, Tabellen, Boxen, Umbrüchen,
Metadaten, Sprache, Bildern, Print-Seitengrößen (Masterprompt §11). HTML-mit-
.doc-Endung ist ausdrücklich verboten (Legacy-Problem P07).

## Optionen
1. **`docx` (dolanmiu/docx)** – reine TS-Erzeugung echter OOXML-Pakete, aktiv gepflegt.
2. Eigener OOXML-Renderer (XML+ZIP) – volle Kontrolle, hoher Aufwand.
3. LibreOffice headless Konvertierung – schwerer Container, Layout-Blackbox.
4. html-docx-js u. ä. – erzeugt HTML-basierte Mogelpackungen, verworfen.

## Entscheidung
`docx`-Bibliothek im Worker; Mapping AST→docx in `libs/export-docx`. Checklisten/
Übungsboxen als Absatzstile + Tabellenrahmen; TOC als Word-Feld (TOC-kompatible
Heading-Stile), Sprachattribut aus Buchsprache.

## Konsequenzen
Integrationstest validiert ZIP-Struktur + document.xml (XML-Parse, Pflichtparts);
Smoke-Open via LibreOffice headless in CI, soweit verfügbar.

## Risiken
Exotische Layoutwünsche stoßen an Bibliotheksgrenzen; Mitigation: Renderer-Port,
Eigenbau bleibt austauschbare Option.

## Migrationswirkung
Ersetzt `.doc`-Fake vollständig.

## Revisit Trigger
Nicht abbildbare Pflicht-Features (z. B. komplexe Textrahmen) in zwei Sprints.
