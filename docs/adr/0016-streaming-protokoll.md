# ADR-0016: Streaming-Protokoll – Server-Sent Events (SSE)

Status: accepted · 2026-07-12

## Kontext
Generierungs-/Exportfortschritt und partielle AST-Knoten müssen live in die UI
(Masterprompt §12); unidirektional genügt, Commands laufen über REST.

## Optionen
1. **SSE** – simpel, HTTP-nativ, Auto-Reconnect (Last-Event-ID), proxy-freundlich.
2. WebSocket – bidirektional (unnötig), mehr Infrastruktur-/Auth-Aufwand.
3. Polling – Latenz/Last, kein partial-content-Erlebnis.

## Entscheidung
SSE-Endpoint je Run/Job (`GET /runs/{id}/events`), Events typisiert in
`libs/generation` (GenerationEvent, data-model.md §3), Resume über Last-Event-ID;
Worker→API-Brücke via Redis-PubSub.

## Konsequenzen
UI rendert `partial-content`-AST-Knoten direkt in die Preview; Abbruch/Resume
bleiben REST-Commands.

## Risiken
Verbindungslimits älterer HTTP/1.1-Proxys; Mitigation: HTTP/2, ein Multiplex-
Event-Stream pro Nutzer als Option.

## Migrationswirkung
Ersetzt Legacy-setState-Streaming im UI-Thread.

## Revisit Trigger
Kollaboratives Editing (dann WebSocket/CRDT separat bewerten).
