// Local, deterministic outline helpers ported from the Legacy V3 reference
// (splitIntoChapters). No AI: manual "===" chapter splitting + short-chapter
// merging. Chapter ids are stable ULID-like values, not Date.now()/Math.random.

import type { Chapter } from '../../core/models/book-project';
import { countWords } from '../project-stats';

/**
 * Generates a stable unique chapter id.
 *
 * @returns A random UUID.
 */
export function newChapterId(): string {
  return crypto.randomUUID();
}

/**
 * Splits raw text into blocks on lines that contain only "===".
 *
 * @param raw The raw manuscript text.
 * @returns The non-empty text blocks.
 */
function splitBlocks(raw: string): string[] {
  const blocks: string[] = [];
  let current: string[] = [];
  for (const line of raw.split('\n')) {
    if (line.trim() === '===') {
      if (current.length) blocks.push(current.join('\n').trim());
      current = [];
    } else current.push(line);
  }
  if (current.length) blocks.push(current.join('\n').trim());
  return blocks.filter(Boolean);
}

/**
 * Turns one text block into a chapter (first line = title when short).
 *
 * @param block The text block.
 * @param index The zero-based block index.
 * @returns The chapter.
 */
function toChapter(block: string, index: number): Chapter {
  const lines = block.split('\n');
  const title = (lines[0] || '').trim();
  const rest = lines.slice(1).join('\n').trim();
  if (!rest || title.length > 80)
    return {
      id: newChapterId(),
      title: `Kapitel ${index + 1}`,
      goal: '',
      content: block,
    };
  return { id: newChapterId(), title, goal: '', content: rest };
}

/**
 * Merges too-short chapters back into the previous one as a subheading.
 *
 * @param chapters The raw chapters.
 * @returns The merged chapters.
 */
function mergeShort(chapters: Chapter[]): Chapter[] {
  const merged: Chapter[] = [];
  for (const ch of chapters) {
    if (merged.length && countWords(ch.content) < 80) {
      const prev = merged[merged.length - 1];
      prev.content = `${prev.content}\n\n## ${ch.title}\n${ch.content}`.trim();
    } else merged.push({ ...ch });
  }
  return merged;
}

/**
 * Splits raw manuscript text into chapters (Legacy V3 parity, local only).
 *
 * @param raw The raw text with "===" chapter separators.
 * @returns The parsed chapters.
 */
export function splitIntoChapters(raw: string): Chapter[] {
  return mergeShort(splitBlocks(raw).map(toChapter));
}
