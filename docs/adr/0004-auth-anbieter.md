# ADR-0004: Auth – eigenes NestJS-Auth-Modul (Passport) statt Auth-SaaS

Status: accepted · 2026-07-12

## Kontext
Gefordert: E-Mail/Passwort, E-Mail-Verifizierung, Passwort-Reset, Sessions,
Google OAuth, Rollen/Guards, Dev-only Mock-Auth ohne Produktions-Bypass
(Masterprompt §14). TOTP-2FA ist spätere, getrennte Funktion.

## Optionen
1. **Eigenes Modul**: Passport-Strategien (local, google), Argon2id, serverseitige
   Sessions (Redis-Store), signierte HttpOnly-Cookies.
2. Auth0/Clerk – schnell, aber Vendor-Lock-in, Kosten, Datenabfluss, Mandanten-
   modell muss trotzdem selbst gebaut werden.
3. Keycloak self-hosted – mächtig, aber schwerer Betriebs-Overhead für Foundation.

## Entscheidung
Eigenes Auth-Modul in `libs/auth` + `apps/api`. Google OAuth über Passport-Strategie.
Mock-Auth nur bei `AUTH_MODE=dev-mock` in non-production Environments, mit
Build-Time-Exklusion im Frontend, Runtime-Assertion im Backend und CI-Test,
dass Production-Builds keinen Mock enthalten.

## Konsequenzen
Volle Kontrolle über Session-/Rollenmodell und Mandantentrennung; Aufwand für
Verifizierungs-/Reset-Mails (Mailer-Port, in Foundation Dev-Transport).

## Risiken
Eigenbau-Auth ist sicherheitskritisch; Mitigation: OWASP-ASVS-Checkliste,
Security-Review durch Rolle 5, Rate-Limits auf Auth-Endpoints.

## Migrationswirkung
Keine Altnutzer vorhanden.

## Revisit Trigger
Enterprise-Anforderungen (SAML/SCIM) oder 2FA-Ausbau → Keycloak/SaaS neu bewerten.
