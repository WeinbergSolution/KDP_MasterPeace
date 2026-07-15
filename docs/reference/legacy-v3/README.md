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

## Raw file status — ACTION REQUIRED

**The byte-exact raw file is not yet committed here.** The reference was delivered
as inline message content with UTF-8→Latin-1 mojibake (`Ã¼`, `Ã©`, `â`), so:

- The claimed SHA-256 `f8bc9fe4…72324` is recorded as **UNVERIFIED**
  (`source-manifest.json → sha256.verified: false`).
- No `kdp-workbook-studio.tsx` is committed, because a reconstruction from the
  corrupted inline copy would not be byte-identical and must not masquerade as the
  original.

**To close this out:** drop the raw `kdp-workbook-studio.tsx` into this folder,
then run a SHA-256 check and update `source-manifest.json` (`verified: true`,
fill `byteSize.verified`/`lineCount.verified`). Until then, Package 1 is based on
the readable inline content, which is sufficient for behavioral inventory but not
for byte verification.

```bash
# once the raw file is present:
sha256sum docs/reference/legacy-v3/kdp-workbook-studio.tsx
wc -l -c docs/reference/legacy-v3/kdp-workbook-studio.tsx
```
