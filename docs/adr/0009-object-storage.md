# ADR-0009: Object Storage – S3-kompatibel (MinIO dev, S3/R2 prod)

Status: accepted · 2026-07-12

## Kontext
Exporte, Cover, Bilder, KDP-Pakete; presigned Downloads; getrennte Umgebungen.

## Optionen
1. **S3-API als Standard** – MinIO lokal/CI, AWS S3 oder Cloudflare R2 in prod.
2. Dateisystem – nicht skalierbar, kein presigned Access, verworfen.
3. DB-BLOBs – Backups/Kosten, verworfen.

## Entscheidung
S3-kompatibler Port in `libs/export-core` (`ArtifactStorage`); Buckets je Umgebung,
Objekt-Keys `org/{orgId}/project/{projectId}/exports/{jobId}/{filename}`;
serverseitig verschlüsselt, Zugriff nur via kurzlebige presigned URLs.

## Konsequenzen
Kein Artefakt verlässt das System ohne Autorisierungs-Check + presigned URL.

## Risiken
R2/S3-Featureunterschiede; Mitigation: nur Kern-API (put/get/head/presign) nutzen.

## Migrationswirkung
Keine.

## Revisit Trigger
Anforderungen an EU-Datenresidenz aus der Legal-Prüfung.
