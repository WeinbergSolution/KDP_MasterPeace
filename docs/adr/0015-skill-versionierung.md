# ADR-0015: Skill-Versionierung – unveränderliche Published-Versionen mit Lifecycle

Status: accepted · 2026-07-12

## Kontext
Skills sind deklarativ, schema-validiert, versioniert; veröffentlichte Versionen
werden nicht still überschrieben; Rollback nötig (Masterprompt §3.4, §6).

## Optionen
1. **DB-basierte SkillVersion-Zeilen** (semver, Status-Lifecycle, jsonb-Definition,
   Zod-validiert), published = immutable (DB-Trigger).
2. Git-basierte Skill-Files + Deployment – gute Diffs, aber Admin-UI-Pflege und
   Runtime-Zuordnung (Pläne/Nutzergruppen) unhandlich.
3. Unversionierte Skills mit Audit-Log – verletzt Anforderungen, verworfen.

## Entscheidung
Option 1. Lifecycle draft→testing→published→deprecated→archived. Laufende
GenerationRuns pinnen ihre SkillVersion (Negativtest „Skill-Version ändert sich
während laufendem Projekt" wird dadurch trivial korrekt). Übersetzungen als
SkillTranslation je Locale mit eigenem Status. Kein ausführbarer Code in Skills –
nur deklarative Daten + referenzierte PromptTemplates/QualityRules.

## Konsequenzen
Admin-UI kann Versionen vergleichen (jsonb-Diff), veröffentlichen, deaktivieren,
zurückrollen (= ältere published Version wieder aktiv zuordnen).

## Risiken
Definition-Schema-Drift; Mitigation: schemaVersion im Skill-jsonb + Migrationsfunktionen.

## Migrationswirkung
Legacy-Prompts werden als v1 des ersten Skills importiert.

## Revisit Trigger
Bedarf an Git-Sync für Skill-Reviews durch Externe.
