# ADR-0006: i18n – Transloco (Runtime) + prerenderte Locale-Routen für Public

Status: accepted · 2026-07-12

## Kontext
Runtime-Sprachwechsel DE/EN/ES im Studio, getrennte UI-/Buch-/Skill-/Markt-/
Formatierungs-Locales, SSR/SEO für öffentliche Seiten (Masterprompt §13).

## Optionen
1. Angular built-in i18n – compile-time, ein Build pro Locale, kein Runtime-Wechsel.
2. **Transloco** – Runtime-Wechsel, Lazy-Loading von Scopes, testbar, aktiv gepflegt.
3. ngx-translate – verbreitet, aber Wartungslage schwächer.
4. Hybrid: built-in für public-web, Transloco für studio/admin.

## Entscheidung
Transloco in allen drei Frontends (einheitliches Modell, gemeinsame Message-Keys in
`libs/contracts`). public-web wird pro Locale unter `/de|/en|/es` prerendert
(SSG mit vorgeladenem Transloco-State) – SEO ohne Doppel-Toolchain.

## Konsequenzen
Keine hart codierten UI-Texte (Lint-Regel); Validierungs- und Qualitätsmeldungen
laufen über messageKeys; Zahlen/Daten/Währungen über Intl mit expliziter Locale.

## Risiken
Prerender+Runtime-i18n erfordert saubere Hydration; Mitigation: E2E-Smoke je Locale.

## Migrationswirkung
Alle deutschen Legacy-Texte werden als `de`-Basiswerte extrahiert.

## Revisit Trigger
Angular built-in i18n erhält offiziellen Runtime-Wechsel.
