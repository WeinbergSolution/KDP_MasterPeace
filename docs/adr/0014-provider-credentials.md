# ADR-0014: Provider-Credential-Strategie – Envelope Encryption serverseitig

Status: accepted · 2026-07-12

## Kontext
BYOK-Schlüssel und Plattform-Keys dürfen nie im Browser oder Klartext liegen
(Masterprompt §3.3, §15).

## Optionen
1. **Envelope Encryption**: Daten-Key (AES-256-GCM) je Credential, Daten-Key mit
   Master-Key (ENV/KMS) verschlüsselt; keyVersion für Rotation.
2. Nur ENV-Master-Key + direkte AES-Verschlüsselung – einfacher, Rotation schwerer.
3. Externes KMS/Vault ab Tag 1 – betrieblich schwer für Foundation.

## Entscheidung
Option 1 in `libs/auth`/api implementiert; Master-Key aus Environment (Schema-
validiert), Interface KMS-ready. `ProviderCredential` hat keine Klartext-Lese-API;
Entschlüsselung ausschließlich innerhalb des LLM-Gateway-Requests, Klartext nie
geloggt, nie persistiert, nie an Clients.

## Konsequenzen
Key-Rotation als Admin-Job (Re-Encrypt der Daten-Keys); Audit-Log je Credential-Nutzung.

## Risiken
Master-Key-Kompromittierung; Mitigation: Rotation, spätere KMS-Anbindung, Zugriff nur worker/api.

## Migrationswirkung
Keine.

## Revisit Trigger
Produktivbetrieb → KMS (AWS KMS/GCP KMS/Vault) verpflichtend prüfen.
