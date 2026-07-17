# Legacy V3 Reference Archive

This folder holds the **product-behavior reference** for the Legacy V3 integration
(`feature/legacy-v3-product-parity-preview`). It is documentation only.

## What this is

`kdp-workbook-studio.tsx` is a working single-file React/TSX application
(`KdpWorkbookStudio`, UI labelled "v2") that implements the full KDP authoring
product we are re-building natively in Angular/NestJS/Nx. It is the authoritative
reference for **product behavior** (user flows, fields, calculations, prompts,
outputs, error states), NOT a code template. See `../../migration/legacy-v3-*.md`.

## Rules for this file (per master brief §7)

- Not imported by Angular, not compiled, not executed, not auto-formatted, never
  bundled into a production artifact.
- The unsafe/monolithic technical patterns of the reference are **not** carried
  over (direct browser provider calls, `window.claude`/`window.storage`, dynamic
  CDN script injection, browser-print "PDF", `.doc`=HTML, random-id domain keys).
  See `source-manifest.json → detectedSecurityRisks`.

## Raw file status — VERIFIED (byte-exact archive committed)

**`kdp-workbook-studio_aktuell.jsx` is the byte-exact original**, archived
verbatim in this folder. The three canonical values reproduce exactly:

| Metric | Value |
| --- | --- |
| Lines (`wc -l`) | **3823** |
| Bytes (`wc -c`) | **239911** |
| SHA-256 | **`f8bc9fe43427a95c957522710cdaa4d7ddb664fcc4ac7f5c5f1c6bc5b5a72324`** |

**Encoding note:** the file is **Latin-1 (ISO-8859-1 / Windows-1252)**, so German
umlauts are single-byte and the total is 239911 bytes (not 242442 as it would be
in UTF-8). Opened as UTF-8 it *looks* like mojibake (`Ã¼`, `Ã©`), but those bytes
are the canonical original — that is exactly why the SHA-256 matches. **Do not
re-encode this file to UTF-8 and do not let a formatter touch it** (it is covered
by the `/docs` rule in `.prettierignore`); re-encoding changes every umlaut byte
and breaks the hash.

```bash
# reproduce the verification:
sha256sum docs/reference/legacy-v3/kdp-workbook-studio_aktuell.jsx
wc -l -c docs/reference/legacy-v3/kdp-workbook-studio_aktuell.jsx
```

See `source-manifest.json → archivedCurrentReference` (`verified: true`).
