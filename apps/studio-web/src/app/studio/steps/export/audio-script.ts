// Audiobook-script builder (ported 1:1 from Legacy V3): title/author, a narration
// hint, chapter announcements and the spoken rendering of every block.

import type { BookProject } from '../../../core/models/book-project';
import { bookStrings } from './book-strings';
import { parseBlocks } from './block-parse';
import { blocksToAudio } from './blocks-audio';

const HINT =
  '[SPRECHHINWEIS: Warmer, ruhiger Ton. Bei [PAUSE] 3–5 Sekunden Stille lassen. Übungen langsamer und deutlicher sprechen.]';

/**
 * Builds a speakable audiobook script (.txt) for the project.
 *
 * @param project The book project.
 * @returns The script text.
 */
export function buildAudioScript(project: BookProject): string {
  const S = bookStrings(project.language);
  const ex = project.extras;
  let out = `HÖRBUCH-SKRIPT\n${'='.repeat(50)}\n${project.title}\n${project.subtitle}\nvon ${project.author}\n\n${HINT}\n`;
  if (ex.einleitung?.trim())
    out += `\n\n===== ${S.intro} =====\n\n${blocksToAudio(parseBlocks(ex.einleitung))}`;
  project.outline.forEach((ch, i) => {
    out += `\n\n===== ${S.chapter} ${i + 1}: ${ch.title} =====\n\n${blocksToAudio(parseBlocks(ch.content))}`;
  });
  if (ex.schlusswort?.trim())
    out += `\n\n===== ${S.closing} =====\n\n${blocksToAudio(parseBlocks(ex.schlusswort))}`;
  return out;
}
