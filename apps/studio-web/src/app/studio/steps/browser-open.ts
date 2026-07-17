// Local, real browser helpers for the cover step (ported from the Legacy V3
// openHtml/download): open a generated HTML document in a new tab, or download
// it as a file. No server round-trip, no fake success — a blocked popup falls
// back to a download and is reported to the caller.

const REVOKE_OPEN_MS = 120000;
const REVOKE_DOWNLOAD_MS = 10000;

/**
 * Triggers a client-side file download of text content.
 *
 * @param filename The download file name.
 * @param content The file content.
 * @param mime The MIME type.
 */
export function downloadTextFile(
  filename: string,
  content: string,
  mime: string,
): void {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_DOWNLOAD_MS);
}

/**
 * Opens an HTML document in a new tab; falls back to a download when blocked.
 *
 * @param html The HTML document.
 * @param filename The fallback download file name.
 * @returns True when a tab opened, false when it fell back to a download.
 */
export function openHtmlInNewTab(html: string, filename: string): boolean {
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  const win = window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_OPEN_MS);
  if (win) return true;
  downloadTextFile(filename, html, 'text/html');
  return false;
}
