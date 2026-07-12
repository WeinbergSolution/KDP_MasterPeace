# As-is-Audit: React-Cloud-Prototyp „KDP Workbook Studio v2"

Quelle: `legacy/react-cloud/kdp-workbook-studio.legacy.jsx` (1614 Zeilen, eine Datei).
Alle Zeilenangaben (`L…`) beziehen sich auf diese Datei.
Status: vollständig gelesen und verifiziert am 2026-07-12.

---

## 1. Feature-Inventar (Produktwissen, zu erhalten)

| # | Feature | Fundstelle | Migrationswert |
|---|---------|-----------|----------------|
| F01 | Projektverwaltung mehrerer Buchprojekte (Index + Projekt-Records, Anlegen/Wechseln/Löschen) | L560–660 | Hoch – wird zu `Project`/`Book` mit Server-Persistenz |
| F02 | Konzept-/Ideengenerierung (4 Konzepte je Nische, JSON) | L696–708 | Hoch – TaskModule `GenerateConcepts` |
| F03 | Gliederungsgenerierung (n Kapitel, Titel + Ziel, JSON) | L175–179, L710–717 | Hoch – TaskModule `GenerateOutline` |
| F04 | Kapitelgenerierung mit Vorkapitel-Kontext und Strukturvorgaben | L181–192, L719–722 | Hoch – TaskModule `GenerateChapter` |
| F05 | Kapitel-Verlängerung (letzte 1500 Zeichen als Kontext) | L194–202 | Hoch – TaskModule `ExtendChapter` |
| F06 | Autopilot (Gliederung + alle Kapitel bis Zielwortzahl + Extras, Stop/Resume, Skip bereits geschriebener) | L776–825 | Hoch – wird zu jobbasiertem `GenerationRun` |
| F07 | Rahmenteile: Einleitung, Arbeitsweise, Schlusswort, Autor:innen-Bio, Bonus-Seite mit eigenen Prompts | L50–56, L204–220, L730–733 | Hoch – FrontMatter-/BackMatter-Knoten + TaskModules |
| F08 | Eigenes Workbook-Markup (`##`, `###`, `**fett**`, `>`, `-`, `- [ ]`, `[linien:n]`, `[skala]`, `:::uebung/:::tipp/:::beispiel`) | L152–167 (Regeln), L226–256 (Parser) | Sehr hoch – Grundlage des Legacy-Parsers → Book AST |
| F09 | Live-Kapitel-Preview mit Trim-Seitenverhältnis, Font-, Größen-, Zeilenabstands-Settings | L279–311, L874–880, L1105–1133 | Hoch – Preview-Renderer auf AST |
| F10 | KDP-Formatwissen: 5 Trim-Größen, 3 Bundsteg-Stufen, 2 Papierstärken, Rücken-Formel, Bleed/Safe-Maße | L13–38, L462–466, L468–531 | Hoch – als Testvektoren + validierte Domänenregeln übernehmen |
| F11 | Cover-Komplettvorlage (Rückseite/Rücken/Vorderseite, Hilfslinien, Barcode-Zone, Rückentext ab ~100 Seiten) | L468–531 | Hoch – Cover-PDF-Renderer |
| F12 | Klappentext- und Cover-Briefing-Generierung | L746–762 | Mittel – TaskModules |
| F13 | Lokaler Qualitäts-Check (Wortzahl, Übung, Linien, Checkliste/Skala pro Kapitel; fehlende Extras) | L672–686, L1314–1338 | Hoch – Vorlage für deklarative QualityRules |
| F14 | KI-Verbesserungstipps (Manuskript-Summary → Textliste) | L764–773 | Mittel – wird zu strukturierten `RepairProposal`s |
| F15 | KDP-Marketing-Paket (Beschreibung, 7 Keywords, 3 Kategorien, JSON) | L735–744, L1389–1425 | Hoch – TaskModule `GenerateMarketing` |
| F16 | JSON-Backup-Export/-Import | L828–844 | Hoch – Basis des Legacy-Backup-Schemas für den Importer |
| F17 | Print-Interior-HTML mit @page-Regeln, gespiegelten Rändern, Silbentrennung | L339–385, L432–445 | Mittel – CSS-Wissen für den PDF-Renderer, Mechanik wird ersetzt |
| F18 | E-Book-HTML-Export | L447–456 | Niedrig – wird durch echtes EPUB ersetzt |
| F19 | Statistiken (Wörter, geschriebene Kapitel, Seitenschätzung `words/235`) | L663–670 | Mittel – Heuristik übernehmen, als Schätzung kennzeichnen |
| F20 | Schrittleiste mit Fortschritts-Häkchen, Save-Status-Anzeige, Fehlerbanner, Autopilot-Fortschrittsbalken | L883–950 | Hoch – UX-Muster für Studio-Shell |
| F21 | Migration von Speicherschema v1 → v2 (`kdp-workbook-studio` → `kdp-index`/`kdp-proj-*`) | L561–584 | Mittel – Beleg, dass Legacy-Backups in zwei Schemata existieren können |

## 2. Verifizierte Probleme aus dem Auftrag (Befund je Punkt)

| # | Auftragspunkt | Verifikation |
|---|---------------|--------------|
| P01 | Monolith: UI, Logik, KI, Speicherung, Rendering, Export, QA, Styling in einer Komponente | Bestätigt. Eine Datei, eine Default-Komponente `KdpWorkbookStudio` (L545–1429) mit ~30 Handlern; CSS als String-Konstante (L1449 ff.); Export-HTML als Template-Strings. |
| P02 | Abhängigkeit von proprietären Cloud-Objekten | Bestätigt. `window.storage.get/set/delete` (L564, 572–573, 592, 600, 617, 623, 628, 638, 642, 646, 657); `window.claude.complete` als Fallback (L126–135). |
| P03 | KI-Provider direkt aus dem Browser | Bestätigt. `fetch("https://api.anthropic.com/v1/messages")` clientseitig (L107). Kein Key im Code, aber Architektur erzwingt Key-im-Browser für Produktion. |
| P04 | Hart verdrahtete Modell-/Prompt-/Sprach-/Nischen-Annahmen | Bestätigt. Modell `claude-sonnet-4-6` (L111); deutsche Psychologie-Persona `SYS_AUTOR` (L150); Default-Nische „Selbstwert … toxische Beziehungen" (L59); alle UI-Texte Deutsch. |
| P05 | Output-Limit zu klein / nicht aufgabenspezifisch | Bestätigt. `max_tokens: 1000` global (L112) – für 1200–2400-Wort-Kapitel strukturell zu klein; erklärt die Extend-Schleifen des Autopiloten (L795–800) und abgeschnittene JSON-Antworten. |
| P06 | Heuristische JSON-„Reparatur" | Bestätigt. `tryParseJson` schneidet ab und probiert Suffixe `"]", "}", "]}", "}]", "}]}", "]}]"` durch (L85–101). Ein Retry mit Formatermahnung (L145), keine Schemavalidierung. |
| P07 | Word-Export ist HTML mit `.doc`-Endung | Bestätigt. `download(….doc, buildEbookHtml(project), "application/msword")` (L1356). Kein OOXML. |
| P08 | PDF-Export = Popup + Browser-Druckdialog | Bestätigt. `openWindowWith` + `window.print()`-Button, Fehlermeldung nur bei Popup-Blocker (L860–865, L441, L516). Nicht reproduzierbar, nicht testbar, keine Font-Einbettungsgarantie. |
| P09 | E-Book-Export nur HTML | Bestätigt (L447–456, L1355). Kein EPUB-Container, kein OPF, kein NAV. |
| P10 | Speicherfehler still verschluckt | Bestätigt. Autosave-`catch` leer mit Kommentar „nächster Versuch beim nächsten Tippen" (L602); `persistNow` mit „/* egal */" (L617); Index-Schreibfehler ignoriert (L628, 638, 646, 657). `saved`-Anzeige kann dadurch dauerhaft „Speichert …" zeigen, ohne Fehlerdialog; umgekehrt setzt ein Erfolg des Projekt-Writes `saved=true`, auch wenn der Index-Write scheiterte. |
| P11 | Qualitäts-Check ohne strukturierte Issues/Reparaturaktionen | Bestätigt. Regex-Booleans pro Kapitel (L672–686), Anzeige als „✓/fehlt"-Grid (L1322–1331); kein Issue-Objekt, keine Lokalisierung auf Knotenebene, keine Fix-Aktion. |
| P12 | KI-Tipps nur Text | Bestätigt. `setTips(text)` → Absatzliste (L764–773, L1335). Nicht anwendbar, kein Diff. |
| P13 | Fehlende Plattformfunktionen | Bestätigt. Kein Auth, keine Rollen, kein Admin, kein Billing, keine Landingpage, kein Backend, keine Jobs, keine Tests, keine Observability im gesamten Code. |
| P14 | UI-/Buch-/Skill-Sprache nicht getrennt | Bestätigt. Alles Deutsch, `lang="de"` hart in Exporten (L433, 448, 489) und Preview (L1125). |
| P15 | Cover-Berechnung mit hart codierten Annahmen | Bestätigt. Nur 2 Papierstärken (L35–38: 0.0025 / 0.002252 Zoll/Seite), Bleed 3.175 mm, Safe 6.35 mm fix (L471–472); keine Hardcover-, Farbdruck- oder Marktvarianten; Formel nirgends gegen offizielle KDP-Vektoren getestet. |
| P16 | Kein revisionssicheres Generierungsprotokoll | Bestätigt. Keine Persistenz von Prompt, Modell, Tokens, Kosten, Zeitpunkt oder Antwort-Hash irgendeines Aufrufs. |

## 3. Neue Befunde (im Audit ergänzt)

| # | Befund | Fundstelle | Risiko |
|---|--------|-----------|--------|
| N01 | Stille Fallback-Kette: schlägt der API-Fetch fehl, wird unbemerkt `window.claude.complete` versucht – zwei semantisch verschiedene Antwortformate, keine Provider-Kennzeichnung im Ergebnis | L104–137 | Nicht nachvollziehbare Herkunft von Inhalten |
| N02 | Destruktive Aktionen ohne Versionsschutz: „Gliederung neu generieren" ersetzt die Kapitelliste inkl. aller Texte; nur ein Inline-Warnhinweis | L710–717, L1034 | Datenverlust; erzwingt Snapshots/Versionierung im Zielsystem |
| N03 | Backup-Import ersetzt das aktive Projekt ohne Schema-Validierung und ohne Snapshot | L831–844 | Datenverlust, defekte Zustände; zudem CSS-/Content-Injection-Vektor (siehe N04) |
| N04 | Injection-Fläche in Export-HTML: `project.cover.bg`/`fg` werden unescaped in CSS interpoliert (L495); via Backup-Import sind beliebige Strings möglich → CSS-Injection im Cover-/Print-Fenster. Textinhalte sind über `esc()` weitgehend escaped, Farb-/Settingswerte nicht | L474–476, L495, L831–844 | XSS-/Injection-Risiko im Exportpfad |
| N05 | IDs über `Date.now()` (Projekte `"p"+Date.now()`, Kapitel `Date.now()+i`) – kollisionsanfällig, nicht global eindeutig | L569, L632, L713, L851 | Referenzintegrität; im Zielsystem UUID/ULID |
| N06 | Autopilot ohne jede Kostenkontrolle: bis zu 1 + n×5 + 5 Modellaufrufe pro Lauf (Extend-Guard bis 4), keine Schätzung, keine Bestätigung, kein Budget | L776–825 | Unkontrollierte Providerkosten |
| N07 | Seitenschätzung `ceil(words/235) + 1.5×Kapitel + 5` ist eine unvalidierte Heuristik, fließt aber als Fallback in die Rücken-/Coverberechnung ein | L663–670, L462–466, L871 | Falsche Covermaße bei ungeprüfter Übernahme |
| N08 | Bundsteg nur in 3 groben Stufen (9.6/12.7/15.9 mm) und vom Nutzer manuell zu wählen statt aus realer Seitenzahl abgeleitet | L21–25, L1180–1183 | KDP-Reject-Risiko bei Fehlwahl |
| N09 | Google-Fonts-Import zur Laufzeit in App, Print- und Cover-HTML | L355, L491, L1453 | Keine Font-Einbettungsgarantie im Druck-PDF; Datenschutz (Third-Party-Request) |
| N10 | `parseBlocks`-Eigenheiten: Leerzeilen gehen verloren (keine Absatztrennung innerhalb Boxen nötig, aber Informationsverlust), `# `-H1 wird zu h2 degradiert, nummerierte Listen verlieren ihre echte Nummer (`oli` rendert Blockindex `i+1`), Boxen nicht verschachtelbar, unbekannte `:::`-Typen schließen offene Boxen | L226–256, L287 | Präzedenzfälle für den Legacy-Parser: dokumentierte Migrationswarnungen nötig |
| N11 | Clipboard-Fehler still verschluckt („Browser blockiert") | L846–848 | Kleines UX-Problem, Muster stiller Fehler |
| N12 | `window.confirm`/`window.open` als UI-Primitive; Löschen ohne Undo | L641, L860 | Nicht barrierefrei, nicht testbar |
| N13 | Kapitelzahl hart auf 1–15 begrenzt, Wortziel-Auswahl fix (700/1200/1800/2400) | L1024–1025, L1073–1078 | Produktannahmen, im Zielsystem konfigurierbar per Format-Skill |
| N14 | Kein `react` Error Boundary, keine Behandlung von Rate Limits (429) oder Timeouts; jeder Fehler wird generisch als „Das hat nicht geklappt (…)" gezeigt | L689–694 | Fehlerklassen im Gateway nötig |
| N15 | „Gespeichert"-Status ist rein clientseitig (Debounce 800 ms) und bezieht sich auf einen Storage, der zwischen Umgebungen nicht existiert (`window.storage` außerhalb der Cloud undefiniert → App bricht beim Laden) | L560–605 | Prototyp läuft außerhalb der Cloud-Umgebung gar nicht |

## 4. Konkrete Ursachen der vier Kernprobleme

1. **Speichern:** leere `catch`-Blöcke an allen sechs Schreibpfaden (P10) + `saved`-Flag entkoppelt vom tatsächlichen Persistenzerfolg + Abhängigkeit vom nicht portablen `window.storage` (N15). Es gibt keinen Retry, keine Offline-Queue, keine Konflikt- oder Versionslogik.
2. **Word:** Es existiert kein DOCX-Renderer; `buildEbookHtml` wird mit MIME `application/msword` und Endung `.doc` heruntergeladen (P07). Word öffnet das zwar, aber es ist kein OOXML-Paket – Formatverlust, keine Stile, keine Metadaten, von KDP/Kindle Create nur eingeschränkt verwertbar.
3. **HTML/E-Book:** Der „E-Book-Export" ist eine einzelne HTML-Datei (P09); der Nutzer soll extern (Calibre/Kindle Previewer) konvertieren. Es gibt keinen EPUB-Container, keine Navigation, keine Validierung.
4. **Repair:** Der Qualitäts-Check erzeugt Booleans statt adressierbarer Issues (P11); der einzige „Fix" ist Kapitel-Neugenerierung oder manuelles Editieren. KI-Tipps sind reiner Text ohne Patch-Semantik (P12). Token-effiziente Einzelreparatur ist strukturell unmöglich, weil kein Knotenmodell existiert – der Content ist ein Markup-String.

## 5. Erhaltenswerte Qualitäten

- Das Workbook-Markup ist klein, lesbar und LLM-tauglich – ideale Quelle für die AST-Knotentypen und den Legacy-Parser.
- Die Prompts (Kapitelstruktur „Einstieg → Psychoedukation → Übung → Skala/Checkliste → Tipp", Bio ohne erfundene Qualifikationen, Rezensions-Bitte im Schlusswort, Krisen-Disclaimer im Copyright) sind fachlich gutes Ausgangsmaterial für den ersten Skill-Pack `self-development-crisis-and-self-worth-v1`.
- Die KDP-Maßtabellen (Trims, Rückenformel, Bleed/Safe, Barcode-Zone 50.8×30.5 mm, Rückentext ab ~100 Seiten) sind korrekt geerdetes Domänenwissen – zu übernehmen als **zu validierende Testvektoren**, nicht als ungeprüfte Wahrheit.
- Die UX-Muster (Schrittleiste, Fortschritts-Häkchen, Autopilot mit Stop, sichtbarer Save-Status, Live-Preview neben dem Editor) sind bewährt und werden in die Studio-App übertragen.

## 6. Golden-Master-Fixture

Aus `emptyProject` (L58–68), `SAMPLE` (L1435–1447) und dem Markup-Regelwerk (L152–167) wird in der Implementierungsphase ein Golden-Master-Legacy-Backup (`docs/migration/fixtures/legacy-golden-master.json`) erzeugt: ein vollständiges Beispielprojekt im Alt-Schema `{ project, step }` inkl. aller Markup-Konstrukte, beider Speicherschema-Varianten (v1/v2) und bewusst eingebauter Grenzfälle (leere Box, `[linien:20]`-Clamp, `#`-H1, unbekannter Box-Typ). Der Legacy-Importer muss dieses Fixture verlustarm in das Book AST überführen; Abweichungen erzeugen Migrationswarnungen (siehe `docs/migration/legacy-react-to-angular.md`).
