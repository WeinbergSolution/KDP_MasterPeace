# Legacy-Backup-Schema (React-Cloud-Prototyp)

Grundlage für den `LegacyBackupImporter`. Quelle: `legacy/react-cloud/kdp-workbook-studio.legacy.jsx` (L58–68 `emptyProject`, L828–844 Export/Import, L560–584 Speicherschemata).

## 1. Dateiformat des Backups

```json
{
  "project": { … },
  "step": 0
}
```

`step` (0–6) ist reiner UI-Zustand und wird beim Import verworfen.
Ältere Direkt-Exporte können auch nur `{ … }` (das Projekt selbst) sein – der Alt-Import akzeptiert `d.project || d`; der neue Importer ebenso.

## 2. Projekt-Schema (v2, effektiv)

```ts
interface LegacyProject {
  niche: string;                       // Nische/Fokus (Default: dt. Psychologie-Nische)
  chapterCount: number;                // 1–15
  ideas: LegacyIdea[];                 // { titel, untertitel, zielgruppe, versprechen }
  title: string; subtitle: string;
  audience: string; promise: string;
  author: string; bio: string;
  outline: LegacyChapter[];            // { id:number(Date.now()+i), title, goal, content:string(Markup) }
  extras: {
    einleitung: string; arbeitsweise: string;
    schlusswort: string; autorin: string; bonus: string;   // jeweils Markup-Strings
  };
  cover: {
    pageCount: number;                 // 0 = Schätzung verwenden
    paper: 'cream' | 'white';
    bg: string; fg: string;            // Hex erwartet, NICHT garantiert (Injection-Fläche N04)
    blurb: string; brief: string;
  };
  settings: {
    trim: '5x8'|'5.5x8.5'|'6x9'|'7x10'|'8.5x11';
    pages: '24-150'|'151-300'|'301-500';    // Bundsteg-Stufe
    font: 'garamond'|'lora'|'crimson'|'source';
    fontSize: number;                  // 10–14 pt
    lineHeight: number;                // 1.3–1.9
    align: 'justify'|'left';
    wordTarget: number;                // 700|1200|1800|2400
  };
  kdp: null | {
    beschreibung: string;
    keywords: string[];                // 7 erwartet
    kategorien: string[];              // 3 erwartet
  };
}
```

Alle Felder können fehlen; der Alt-Code merged gegen `emptyProject` (Deep-Merge nur für `extras`, `cover`, `settings`). Der Importer übernimmt dieselbe Toleranz, validiert aber mit Zod und protokolliert unbekannte Felder als Warnung statt sie still zu verwerfen.

## 3. Cloud-Speicherschemata (nur relevant für dokumentierte Historie)

- **v1:** ein Key `kdp-workbook-studio` → `{ project, step }`
- **v2:** Key `kdp-index` → `{ activeId, list: [{id,title}] }` plus `kdp-proj-<id>` → `{ project, step }`

Backups aus beiden Generationen enthalten identische Projektobjekte; nur die Umgebungs-Persistenz unterschied sich.

## 4. Markup-Grammatik in `content`/`extras` (Zeilenbasiert)

| Konstrukt | Bedeutung | AST-Ziel |
|---|---|---|
| `## Text` / `### Text` | Überschrift Ebene 2/3 | `heading{level}` |
| `# Text` | Alt: als h2 gerendert | `heading{level:2}` + Warnung |
| Fließtextzeile | Absatz; `**fett**` inline | `paragraph` mit `strong`-Spans |
| `> Text` | Merksatz/Zitat | `quote` |
| `- Text` / `* Text` | ungeordnete Liste (zeilenweise) | `unorderedList>listItem` |
| `1. Text` | geordnete Liste | `orderedList>listItem` |
| `- [ ] Text` / `- [x] Text` | Checklistenpunkt (checked-Status im Alt-Renderer ignoriert) | `checklist>checkItem{checked}` |
| `[linien:n]` | n Schreiblinien (Clamp 15) | `writingLines{count}` |
| `[skala] Frage` | 1–10-Skala | `scale{min:1,max:10,question}` |
| `:::uebung Titel` … `:::` | Übungsbox mit Kindern | `exerciseBox{title}` |
| `:::tipp` … `:::` | Tippbox | `tipBox` |
| `:::beispiel Titel` … `:::` | Beispielbox | `exampleBox{title}` |

Nicht unterstützt im Alt-Format: Tabellen, Bilder, Seitenumbrüche, Verschachtelung von Boxen. Das neue AST unterstützt sie; der Importer erzeugt sie nie aus Legacy-Daten.

## 5. Import-Vertrag

```
LegacyBackupImporter.import(json: unknown): {
  project: NewProjectDraft;        // inkl. Book AST
  warnings: MigrationWarning[];    // Codes siehe legacy-react-to-angular.md §3
}
```

- Import ist **rein** (keine Seiteneffekte), deterministisch und unit-getestet.
- Ein Import legt immer ein **neues** Projekt bzw. eine neue Version an – nie stilles Überschreiben (Gegenentwurf zu Alt-Verhalten N03).
