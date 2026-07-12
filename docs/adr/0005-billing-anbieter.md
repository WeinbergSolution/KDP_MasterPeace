# ADR-0005: Billing – Stripe als Zielanbieter, Foundation mit Mock-Billing-Port

Status: accepted · 2026-07-12

## Kontext
Pläne, Credits, Entitlements, BYOK-Tarif, Upgrade/Downgrade, Kündigung, Grace
Period (Masterprompt §14). Foundation implementiert Domain + Guards + Mock,
reale Zahlung folgt später (Masterprompt §19 erlaubt das explizit).

## Optionen
1. **Stripe** (Billing + Customer Portal) – Standard, EU-tauglich, Webhooks.
2. Paddle/Lemon Squeezy (Merchant of Record) – nimmt Steuerlast ab, weniger flexibel
   bei Credits/Metered Usage.
3. Eigenbau – ausgeschlossen (PCI, Aufwand).

## Entscheidung
`libs/billing` definiert einen Provider-Port (`BillingProvider`); Foundation liefert
`MockBillingProvider` (deterministisch, für Demo/Tests). Stripe-Adapter ist Folgephase.
MoR-Frage (Paddle) wird vor Launch mit Rolle 6 final geprüft.

## Konsequenzen
Entitlement-Guards und Usage-Ledger sind ab Foundation real; nur der Zahlungsfluss ist gemockt
und wird in UI klar als „Testmodus" gekennzeichnet.

## Risiken
Port könnte Stripe-Konzepte zu eng spiegeln; Mitigation: Port modelliert eigene
Domäne (Plan/Subscription/Invoice-Events), Adapter übersetzt.

## Migrationswirkung
Keine.

## Revisit Trigger
Konkrete Steuer-/MoR-Anforderungen aus der Legal-Prüfung (Rolle 6).
