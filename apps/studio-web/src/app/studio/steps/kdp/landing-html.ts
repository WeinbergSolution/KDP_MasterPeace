// Reader-sample landing-page builder (ported 1:1 from Legacy V3): a responsive
// sales page with a brand-coloured hero, a benefit list from the chapters, a real
// reader sample with a fade-out, two purchase CTAs (placeholder [KAUF-LINK]), a
// newsletter block (with an honest "replace this form" note) and imprint/privacy
// placeholders + copyright. Manuscript content is HTML-escaped by the renderer.

import type { BookProject } from '../../../core/models/book-project';
import { FONT_FAMILIES } from '../writing-utils';
import { esc, parseBlocks } from '../export/block-parse';
import { blocksToHtml } from '../export/blocks-html';
import { fontImport } from '../export/fonts';

/** Base + hero CSS. */
function landingCssA(accent: string): string {
  return `* { box-sizing: border-box; margin: 0; }
  body { font-family: 'Inter', sans-serif; color: #26212F; line-height: 1.65; }
  .hero { background: ${accent}; color: #fff; text-align: center; padding: 72px 20px 64px; }
  .hero h1 { font-family: 'Fraunces', serif; font-size: clamp(30px, 5vw, 52px); line-height: 1.12; max-width: 800px; margin: 0 auto 16px; }
  .hero .st { font-size: clamp(16px, 2.4vw, 21px); opacity: 0.93; max-width: 640px; margin: 0 auto 14px; font-style: italic; }
  .hero .au { letter-spacing: 0.16em; text-transform: uppercase; font-size: 13px; opacity: 0.85; margin-bottom: 34px; }
  .cta { display: inline-block; background: #fff; color: ${accent}; font-weight: 600; padding: 15px 34px; border-radius: 999px; text-decoration: none; font-size: 17px; }`;
}

/** Section, benefit-list and sample CSS. */
function landingCssB(accent: string, family: string): string {
  return `section { max-width: 720px; margin: 0 auto; padding: 56px 20px; }
  h2 { font-family: 'Fraunces', serif; font-size: 28px; margin-bottom: 18px; color: ${accent}; }
  ul.benefits { list-style: none; padding: 0; }
  ul.benefits li { padding: 10px 0 10px 34px; position: relative; border-bottom: 1px dashed #E5E1EF; }
  ul.benefits li::before { content: "→"; position: absolute; left: 4px; color: ${accent}; font-weight: 700; }
  .probe { background: #FAF9FC; border: 1px solid #EAE6F2; border-radius: 16px; padding: 30px; font-family: ${family}; font-size: 17px; }
  .probe h2 { font-size: 22px; } .probe p { margin-bottom: 12px; }
  .probe .fade { height: 90px; background: linear-gradient(transparent, #FAF9FC); margin-top: -90px; position: relative; }`;
}

/** Signup, footer and reset-visibility CSS. */
function landingCssC(accent: string): string {
  return `.signup { background: ${accent}14; border-radius: 16px; padding: 34px; text-align: center; }
  .signup input { padding: 13px 16px; border: 1px solid #CFC8E0; border-radius: 10px; font-size: 15px; width: min(320px, 100%); margin: 12px 6px 6px 0; }
  .signup button { padding: 13px 26px; background: ${accent}; color: #fff; border: 0; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; }
  footer { text-align: center; font-size: 12.5px; color: #8B84A0; padding: 34px 20px 44px; } footer a { color: inherit; }
  .wlines, .wline, .skala, .ebox { display: none; }
  blockquote { border-left: 3px solid ${accent}; padding-left: 14px; font-style: italic; margin: 14px 0; }`;
}

/**
 * Builds the reader sample (intro + first-chapter excerpt).
 *
 * @param project The book project.
 * @returns The sample HTML.
 */
function landingSample(project: BookProject): string {
  const intro = project.extras.einleitung?.trim()
    ? blocksToHtml(parseBlocks(project.extras.einleitung))
    : '';
  const firstCh = project.outline[0];
  if (!firstCh) return intro;
  const excerpt = (firstCh.content || '')
    .split('\n\n')
    .slice(0, 6)
    .join('\n\n');
  return `${intro}<h2>${esc(firstCh.title)}</h2>${blocksToHtml(parseBlocks(excerpt))}`;
}

/**
 * Builds the landing-page body sections.
 *
 * @param project The book project.
 * @param accent The brand accent colour.
 * @returns The body HTML.
 */
function landingBody(project: BookProject, accent: string): string {
  const benefits = project.outline
    .slice(0, 6)
    .map((ch) => `<li>${esc(ch.title)}</li>`)
    .join('');
  const hero = `<div class="hero"><h1>${esc(project.title)}</h1><div class="st">${esc(project.subtitle)}</div><div class="au">von ${esc(project.author)}</div><a class="cta" href="[KAUF-LINK]">Jetzt lesen →</a></div>`;
  const erwartet = `<section><h2>Das erwartet dich</h2><p>${esc(project.promise)}</p><ul class="benefits">${benefits}</ul></section>`;
  const probe = `<section><h2>Lies kostenlos hinein</h2><div class="probe">${landingSample(project)}<div class="fade"></div></div><p style="text-align:center;margin-top:22px"><a class="cta" style="background:${accent};color:#fff" href="[KAUF-LINK]">Weiterlesen – jetzt holen →</a></p></section>`;
  const signup = `<section><div class="signup"><h2>Gratis-Kapitel per E-Mail</h2><p>Trage dich ein und erhalte die Leseprobe als PDF direkt in dein Postfach.</p><input type="email" placeholder="Deine E-Mail-Adresse"><button>Leseprobe holen</button><p style="font-size:12px;color:#7A7392;margin-top:10px">Hinweis: Dieses Formular durch den Einbett-Code deines Newsletter-Tools ersetzen.</p></div></section>`;
  const footer = `<footer>© ${new Date().getFullYear()} ${esc(project.author)} · <a href="[IMPRESSUM-LINK]">Impressum</a> · <a href="[DATENSCHUTZ-LINK]">Datenschutz</a></footer>`;
  return `${hero}${erwartet}${probe}${signup}${footer}`;
}

/**
 * Builds the complete reader-sample landing page HTML document.
 *
 * @param project The book project.
 * @returns The full HTML document.
 */
export function buildLandingHtml(project: BookProject): string {
  const accent = project.digital.accent || '#6C57B8';
  const family =
    FONT_FAMILIES[project.settings.font] ?? FONT_FAMILIES['garamond'];
  const guide = `<!-- ANLEITUNG: [KAUF-LINK] durch deinen Shop-/Amazon-Link ersetzen und das E-Mail-Formular durch den Einbett-Code deines Newsletter-Anbieters ersetzen. Impressum-/Datenschutz-Links unten anpassen (in DE Pflicht). -->`;
  const css = `${fontImport(project.settings.font)}\n${landingCssA(accent)}\n${landingCssB(accent, family)}\n${landingCssC(accent)}`;
  const head = `<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(project.title)} – ${esc(project.author)}</title>${guide}<style>${css}</style></head>`;
  return `<!DOCTYPE html><html lang="${project.language || 'de'}">${head}<body>${landingBody(project, accent)}</body></html>`;
}
