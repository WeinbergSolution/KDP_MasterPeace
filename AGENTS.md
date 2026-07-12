# AGENTS.md — Verbindliche Projekt- und Coding-Regeln

## 1. Geltungsbereich

Diese Datei ist die **verbindliche technische Projektverfassung** für das Repository:

`https://github.com/WeinbergSolution/KDP_MasterPeace`

Sie gilt für Menschen, KI-Agenten, Codegeneratoren, Reviews, Refactorings, Tests und Dokumentation.

Bei jedem neuen Arbeitsauftrag muss diese Datei zuerst gelesen werden. Änderungen an diesen Regeln dürfen nur nach ausdrücklicher Zustimmung von Pascal erfolgen.

## 2. Priorität der Regeln

Bei einem Konflikt gilt folgende Reihenfolge:

1. Sicherheit, Datenschutz und Schutz produktiver Daten
2. ausdrückliche aktuelle Anweisung von Pascal
3. diese Datei
4. dokumentierte Architecture Decision Records
5. offizielle Angular- und TypeScript-Konventionen
6. lokale Gewohnheiten einzelner Entwickler:innen oder Tools

Eine Abweichung muss im Implementierungsbericht mit Begründung, betroffener Datei und Folgeaufgabe dokumentiert werden.

---

# 3. Git- und Branch-Sicherheit

## 3.1 Branch-Modell

```text
main
└── staging
    └── feature/<kurzer-scope>
        oder fix/<kurzer-scope>
        oder chore/<kurzer-scope>
```

## 3.2 `main`

`main` ist der geschützte Produktionszweig.

Verbindlich:

- niemals direkt auf `main` committen
- niemals direkt auf `main` pushen
- niemals ohne Pascals ausdrückliche Zustimmung nach `main` mergen
- keine automatische Main-Merge-Funktion
- kein Force Push
- kein Löschen des Branches
- keine Produktionsmigration
- kein Production-Deployment ohne separate Zustimmung
- keine Änderung von Production-Secrets ohne separate Zustimmung

Die Zustimmung zu einer Feature-Umsetzung ist **keine** Zustimmung zum Main-Merge.

## 3.3 `staging`

`staging` ist der Integrations- und Preview-Zweig.

Verbindlich:

- neue Arbeit startet grundsätzlich von aktuellem `staging`
- keine langfristige Entwicklung direkt auf `staging`
- Änderungen werden in einem Feature-, Fix- oder Chore-Branch umgesetzt
- Merge nach `staging` nur über einen nachvollziehbaren Pull Request oder einen ausdrücklich dokumentierten Merge
- alle Pflichtchecks müssen vorher erfolgreich sein
- Staging darf keine Production-Secrets oder produktiven Daten verwenden
- Staging-Deployments dürfen keine Produktionsmigrationen ausführen

## 3.4 Arbeitsbranches

Beispiele:

```text
feature/angular-production-foundation
feature/skill-admin
fix/docx-export
chore/coding-rules
```

Nach jedem abgeschlossenen, getesteten Arbeitspaket:

1. Änderungen prüfen
2. Pflichtchecks ausführen
3. logisch zusammenhängend committen
4. Arbeitsbranch zum Remote pushen
5. Branch, Commit-Hash und Check-Ergebnis dokumentieren

So wird die Arbeit regelmäßig gesichert, ohne `main` zu gefährden.

## 3.5 Verbotene Git-Aktionen

- `git push --force`
- `git push --force-with-lease`
- Hard Reset auf fremde oder nicht gesicherte Arbeit
- Löschen fremder Branches
- Überschreiben uncommitteter Nutzeränderungen
- eigenmächtiges Rebase bereits geteilter Branches
- Main-Merge ohne Zustimmung
- Production-Release ohne Zustimmung

---

# 4. Architektur: Angular-MPA

Das Produkt wird als **Angular-basierte Multi-Page-Application** aufgebaut.

## 4.1 Verbindliche Seitenaufteilung

Mindestens folgende Webbereiche besitzen getrennte Einstiegspunkte beziehungsweise unabhängig auslieferbare Anwendungen:

```text
apps/
  public-web/
  studio-web/
  admin-web/
  api/
  worker/
```

Optional kann ein eigener Auth-Bereich ergänzt werden.

## 4.2 MPA-Regeln

- kein monolithisches Frontend mit allen öffentlichen, Studio- und Admin-Funktionen in einem einzigen Bundle
- jede Webanwendung besitzt eine eigene `index.html`
- öffentliche Seiten sind direkt über ihre URL aufrufbar
- Landingpage, Pricing, FAQ und Rechtstexte werden serverseitig oder statisch vorgerendert
- der Studio-Bereich darf innerhalb seines eigenen Einstiegspunkts Angular-Routing verwenden
- der Admin-Bereich wird getrennt geladen und abgesichert
- gemeinsam genutzte Logik liegt in Libraries, nicht als kopierter Code in mehreren Apps

---

# 5. Clean Code

## 5.1 Eine Funktion, eine Aufgabe

Jede Funktion oder Methode erfüllt genau eine klar benennbare Aufgabe.

Verboten:

- laden, validieren, speichern und UI-Status in einer Funktion
- Providerlogik direkt in einer Komponente
- Export, Dateidownload und Qualitätsprüfung in derselben Funktion
- Methoden mit mehreren fachlich unabhängigen Seiteneffekten

## 5.2 Maximale Funktionslänge

Eine Funktion oder Methode besitzt maximal **14 ausführbare Codezeilen**.

Nicht mitgezählt werden:

- Funktionssignatur
- schließende Klammer
- Leerzeilen
- Kommentare
- JSDoc
- ausgelagerte HTML-Templates

Wird das Limit überschritten, wird die Funktion nach Verantwortlichkeiten zerlegt.

Ausnahmen sind nur mit einem ADR oder einem dokumentierten technischen Grund zulässig.

## 5.3 Maximale Dateilänge

Jede manuell gepflegte Quell-, Template-, Style- und Testdatei besitzt maximal **400 Lines of Code**.

Ausgenommen:

- automatisch generierte Dateien
- Lockfiles
- maschinell generierte API-Clients
- unveränderte Vendor-Dateien
- Build-Artefakte

Eine Ausnahme darf nicht genutzt werden, um handgeschriebenen Code als „generiert“ zu tarnen.

## 5.4 Abstände

Zwischen zwei Funktionen oder Methoden stehen **zwei Leerzeilen**.

Dies gilt auch innerhalb von Klassen.

Ein Formatter darf diese Regel nicht entfernen. Falls erforderlich, wird sie durch einen projektspezifischen Check abgesichert.

## 5.5 Funktions- und Variablennamen

Variablen, Funktionen und Methoden:

- camelCase
- erster Buchstabe klein
- beschreiben Zweck oder Ergebnis
- keine bedeutungslosen Kürzel

Richtig:

```ts
shoppingCart
calculateEstimatedCost()
loadProjectVersion()
applyChapterRepair()
```

Falsch:

```ts
Shopping_Cart
doIt()
data1
tmp
handleClick()
```

Event-Handler werden nach ihrer Wirkung benannt:

```ts
saveProject()
openExportDialog()
applyRepairProposal()
```

## 5.6 Typnamen

Klassen, Interfaces, Types und Enums verwenden PascalCase, da sie Typen repräsentieren:

```ts
BookProject
QualityIssue
ExportJobStatus
```

## 5.7 Dateinamen

### Angular- und TypeScript-Dateien

Angular-Dateien verwenden die offizielle, konsistente kebab-case-Konvention:

```text
book-preview.ts
book-preview.html
book-preview.scss
book-preview.spec.ts
```

Das ist die bewusste Angular-Ausnahme von einer allgemeinen camelCase-Dateinamenregel.

### Variablen und Funktionen

Variablen und Funktionen bleiben immer camelCase.

### Einstiegspunkte

Jede Angular-Webanwendung besitzt:

```text
index.html
main.ts
styles.scss
```

Die klassischen Namen `script.js` und `style.css` gelten nur für eigenständige Vanilla-JavaScript-Artefakte. Sie ersetzen in einem Angular-Projekt nicht `main.ts` und `styles.scss`.

## 5.8 Aussagekräftige Dateien

- eine primäre fachliche Verantwortung pro Datei
- keine Sammeldateien wie `helpers.ts`, `utils.ts` oder `common.ts`
- keine God Components
- keine God Services
- keine Geschäftslogik in `app.ts`
- keine Featurelogik in globalen Styles
- Featurecode wird nach Fachbereich gruppiert

---

# 6. HTML und Templates

## 6.1 Statisches HTML

Statisches Markup wird nicht durch JavaScript- oder TypeScript-Strings erzeugt.

Verboten:

```ts
const html = '<div class="card">...</div>';
element.innerHTML = html;
```

Statisches UI-Markup liegt in einer eigenen `.html`-Template-Datei.

Dynamische Inhalte werden über Angular-Bindings, Kontrollfluss und Komponenten dargestellt.

## 6.2 HTML in eigener Datei

Komponenten verwenden grundsätzlich:

```ts
templateUrl: './book-preview.html'
styleUrl: './book-preview.scss'
```

Inline-HTML ist nur für sehr kleine technische Komponenten zulässig und muss unter 10 Zeilen bleiben.

## 6.3 Templates

- keine komplexe Geschäftslogik in Templates
- keine verschachtelten unlesbaren Ausdrücke
- wiederkehrendes Markup in Komponenten auslagern
- semantisches HTML verwenden
- Buttons sind echte `button`-Elemente
- Formfelder besitzen Labels
- Überschriftenhierarchie bleibt korrekt
- dynamisches HTML wird nicht ungeprüft als `innerHTML` eingebunden

## 6.4 Ordner

Statische Vorlagen und Bilder werden klar getrennt:

```text
src/
  assets/
    img/
  templates/
```

Angular-Komponenten-Templates bleiben direkt bei ihrer Komponente. `templates/` ist für dokumentartige, exportbezogene oder wiederverwendbare statische Vorlagen vorgesehen.

---

# 7. JSDoc

Jede benannte Funktion und Methode wird nach JSDoc-Standard dokumentiert.

Mindestens:

- kurze Beschreibung
- `@param` für jeden Parameter
- `@returns`, sofern ein Rückgabewert existiert
- `@throws`, wenn Fehler bewusst weitergereicht werden
- Seiteneffekte oder Sicherheitsannahmen, wenn relevant

Beispiel:

```ts
/**
 * Berechnet die erwarteten Providerkosten für einen Generierungsschritt.
 *
 * @param request Der vollständig aufgelöste Generierungsauftrag.
 * @param pricing Das zum Ausführungszeitpunkt gültige Preismodell.
 * @returns Die geschätzten Minimal-, Erwartungs- und Maximalkosten.
 * @throws Wenn Modell- oder Preisinformationen fehlen.
 */
calculateGenerationCost(
  request: GenerationRequest,
  pricing: ModelPricing,
): CostEstimate {
  return this.costCalculator.calculate(request, pricing);
}
```

Kommentare erklären das **Warum**, nicht offensichtlichen Code erneut.

---

# 8. JavaScript und TypeScript

- TypeScript strict mode ist verbindlich
- kein implizites `any`
- `unknown` statt unsicherem `any`
- keine nicht geprüften Type Assertions
- keine globalen veränderbaren Zustände
- keine Geschäftslogik in Browser-Globals
- keine direkten Provider-API-Aufrufe aus dem Frontend
- keine Secrets im Browserbundle
- kleine pure Funktionen bevorzugen
- Seiteneffekte an klaren Grenzen bündeln
- Datenverträge mit Schemas validieren
- Fehler nicht leer abfangen
- Promise-Fehler behandeln
- keine unkontrollierten Fire-and-forget-Aufrufe

---

# 9. Konsole, Logging und Fehler

## 9.1 Browserkonsole

In Development, Staging und Production gilt:

- keine ungefangenen Fehler
- keine Angular-Warnungen
- keine Netzwerkfehler ohne sichtbare Behandlung
- keine `console.log`
- keine `console.warn`
- keine `console.error` aus Anwendungscode

## 9.2 Logging

Technische Logs laufen über einen zentralen Logger.

- Browser: nur kontrollierte Telemetrie
- Backend: strukturierte Logs
- Correlation-ID
- keine Secrets
- keine vollständigen Manuskripte
- keine personenbezogenen Daten ohne Redaction
- Produktionslog-Level konfigurierbar

## 9.3 Nutzerfehler

Fehler werden:

- verständlich angezeigt
- einer Aktion zugeordnet
- mit Retry versehen, wenn sinnvoll
- nicht still verschluckt
- nicht als Erfolg dargestellt

---

# 10. Unmittelbare Sichtbarkeit

Erstellter oder geänderter Content wird unmittelbar sichtbar.

Verbindlich:

- optimistische oder gestreamte Vorschau
- sichtbarer Lade- und Speicherstatus
- Kapitel erscheint während der Generierung
- Reparatur-Diff erscheint direkt
- nach Anwendung aktualisiert sich die Preview ohne Reload
- kein erfolgreiches Ergebnis nur in Logs oder verstecktem State

---

# 11. Responsiveness

## 11.1 Mindestbreite

Jede Seite funktioniert ab **320 CSS-Pixeln** Breite.

## 11.2 Geräte

Jede Seite funktioniert auf:

- Smartphone
- Tablet
- Laptop
- Desktop
- großen Monitoren

## 11.3 Keine horizontalen Scrollbalken

Bei kleinen Auflösungen gibt es keinen horizontalen Seiten-Scrollbalken.

Horizontales Scrollen ist nur innerhalb ausdrücklich dafür vorgesehener Elemente erlaubt, zum Beispiel einer Datentabelle mit eigener zugänglicher Scrollregion.

## 11.4 Große Monitore

Fachlicher Content besitzt standardmäßig:

```css
max-width: 1440px;
```

Der Inhaltsbereich bleibt innerhalb seiner App-Shell linksbündig und gut lesbar.

Dekorative Hintergründe und Design-Elemente dürfen Full-Width sein.

## 11.5 Mobile Landscape

Die Anwendung ist standardmäßig portrait-first.

Da normale Websites die Geräteorientierung nicht auf allen Browsern zuverlässig sperren können:

- wird Portrait bevorzugt
- wird eine Orientation-Lock-API nur dort verwendet, wo sie offiziell unterstützt wird
- zeigt eine nicht optimierte Landscape-Ansicht einen verständlichen Hinweis
- blockiert keine sicherheitskritische oder notwendige Nutzeraktion
- darf eine Seite Landscape erst aktiv unterstützen, wenn sie dafür getestet und freigegeben wurde

## 11.6 Pflicht-Viewports

Mindestens testen:

```text
320 × 568
360 × 800
390 × 844
768 × 1024
1024 × 768
1440 × 900
1920 × 1080
```

---

# 12. Styling

- SCSS
- Design Tokens für Farben, Abstände, Typografie und Radien
- keine unkontrollierten Inline-Styles
- keine willkürlichen Magic Numbers
- Komponentenstyles lokal halten
- globale Styles nur für Reset, Tokens, Typografie und App-Shell
- `prefers-reduced-motion` berücksichtigen
- Focus States sichtbar
- ausreichende Kontraste
- Touch-Ziele ausreichend groß

---

# 13. Tests und Qualitätsgates

Vor jedem als abgeschlossen gemeldeten Arbeitspaket müssen mindestens laufen:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
```

Für betroffene Funktionen zusätzlich:

```bash
npm run test:integration
npm run test:e2e:smoke
npm run check:file-size
npm run check:function-size
npm run check:console
npm run check:responsive
```

## 13.1 Verbindliche Checks

CI blockiert bei:

- Datei über 400 LOC
- Funktion über 14 ausführbaren Zeilen
- fehlender JSDoc-Dokumentation
- verbotener `console.*`-Nutzung
- TypeScript-Fehler
- Lint-Fehler
- fehlgeschlagenen Tests
- Build-Fehler
- horizontalem Overflow in Pflicht-Viewports
- direktem Provider-Key im Frontend
- Production-Mock-Auth
- unerlaubter Änderung an `main`

## 13.2 Ausnahmen

Eine Ausnahme benötigt:

- eindeutige ID
- Begründung
- betroffene Datei
- verantwortliche Person
- Ablauf- oder Prüftermin
- Folgeaufgabe

Keine stillen Ausnahmen.

---

# 14. Definition of Done

Eine Änderung ist nur fertig, wenn:

- sie die fachliche Anforderung erfüllt
- sie auf dem richtigen Arbeitsbranch liegt
- sie regelmäßig committed und gepusht wurde
- keine bestehende Funktion unbeabsichtigt beschädigt
- jede Funktion eine Aufgabe besitzt
- jede Funktion maximal 14 ausführbare Zeilen hat
- jede manuell gepflegte Datei maximal 400 LOC besitzt
- Namen eindeutig und konsistent sind
- JSDoc vorhanden ist
- kein statisches HTML in TypeScript erzeugt wird
- keine Konsolenfehler oder Logs auftreten
- Content unmittelbar sichtbar ist
- 320-Pixel-Ansicht funktioniert
- kein horizontaler Seiten-Overflow existiert
- Desktop und Mobile geprüft sind
- Tests und Build erfolgreich sind
- Dokumentation aktualisiert wurde
- Branch, Commit und Pushstatus berichtet wurden
- `main` unverändert geblieben ist, sofern Pascal keinen Main-Merge freigegeben hat

---

# 15. Pflichtbericht jeder Implementierungsinstanz

Der Abschlussbericht enthält:

1. Source Branch
2. Working Branch
3. Target Branch
4. Branch-Visualisierung
5. Commit-Hashes
6. Pushstatus
7. geänderte Dateien
8. LOC jeder geänderten Datei
9. größte Funktion je Datei
10. JSDoc-Status
11. ausgeführte Checks und Exit-Codes
12. getestete Viewports
13. Konsolenstatus
14. bekannte Abweichungen
15. Bestätigung: `main` wurde nicht verändert
16. nächster sicherer Arbeitsschritt
