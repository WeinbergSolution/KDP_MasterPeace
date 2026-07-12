# ADR-0012: EPUB – eigener EPUB-3-Builder + epubcheck-Validierung

Status: accepted · 2026-07-12

## Kontext
Valides reflowables EPUB 3: mimetype unkomprimiert an erster Position,
container.xml, Package Document, Manifest, Spine, NAV, XHTML je Kapitel, CSS,
Cover, Sprache, a11y-Navigation (Masterprompt §11).

## Optionen
1. **Eigener Builder** auf Basis eines ZIP-Writers (archiver/fflate) mit striktem
   Template für Container/OPF/NAV – volle Kontrolle über Validität.
2. epub-gen / ähnliche npm-Pakete – veraltet, EPUB-2-Reste, wenig kontrollierbar.
3. Pandoc – mächtig, aber externer Binär-Stack und AST-Mapping-Verlust.

## Entscheidung
Eigener Builder in `libs/export-epub` (AST→XHTML-Renderer wird mit dem HTML-Export
geteilt); Validierung mit aktuellem epubcheck (Java) im Worker-Image und in CI
(`npm run validate:epub`). Ohne bestandenen epubcheck gilt der Export als fehlgeschlagen.

## Konsequenzen
XHTML-Serialisierung strikt (xhtml, xml:lang); Schreiblinien/Skalen erhalten
reflow-taugliche Darstellungen (Linien als gestylte Blöcke, keine Fixhöhen).

## Risiken
epubcheck braucht JRE im Worker; Mitigation: Docker-Layer, Versionspinning.

## Migrationswirkung
Ersetzt HTML-„E-Book" (P09).

## Revisit Trigger
Fixed-Layout- oder Media-Overlay-Anforderungen.
