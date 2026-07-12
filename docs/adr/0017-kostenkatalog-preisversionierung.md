# ADR-0017: Kostenkatalog und Preisversionierung – versionierter ModelCatalog + append-only-Ledger

Status: accepted · 2026-07-12

## Kontext
Kosten müssen vor und nach jedem Schritt nachvollziehbar sein; Preise ändern
sich; historische Kosten dürfen sich nie rückwirkend ändern (Masterprompt §7).

## Optionen
1. **ModelCatalogEntry mit validFrom/validTo** in DB, Admin-gepflegt, seed-bar;
   CostRecord referenziert die konkrete Preisversion.
2. Preise in Config-Dateien – kein Admin-Workflow, keine Historie zur Laufzeit.
3. Live-Preisabruf beim Provider – keine offiziellen Preis-APIs, nicht belastbar.

## Entscheidung
Option 1. Kostenformel als pure Function in `libs/domain`
(`costCents = inTok/1e6·inPrice + outTok/1e6·outPrice`, gerundet, währungsfest);
TokenEstimate speichert Basis ('provider-endpoint' | 'calibrated') und P50/P90;
Schätz-vs-Ist-Delta wird je Step persistiert und speist die Kalibrierung.
UsageRecord/CostRecord sind append-only (DB-Grants).

## Konsequenzen
Preisänderung = neue Katalogzeile; Anzeige „Preisstand vom …" möglich; Budgets
(Step/Projekt/Monat) prüfen gegen Expected+P90.

## Risiken
Veraltete Katalogpreise; Mitigation: Admin-Warnung bei Katalogalter > 30 Tage.

## Migrationswirkung
Keine (Legacy hatte keinerlei Kostenrechnung).

## Revisit Trigger
Provider führen Preis-/Limits-APIs ein → automatische Katalogpflege prüfen.
