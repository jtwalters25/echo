/**
 * SEAM 1 (Echo) — a ticket is one unit.
 *
 * Unlike Clause (which splits a contract into many clauses), Echo matches whole
 * tickets against whole tickets, so the segmenter collapses title + body into a
 * single chunk. Title is weighted by repetition — it carries the most signal for
 * "have we seen this before?" — a cheap trick that measurably helps short tickets.
 */
import type { Chunk, Document, Segmenter } from "@/engine/types";

/** Build a ticket document; keep title in source so we can weight/label it. */
export function ticketText(title: string, body: string): string {
  // Title twice, then body: emphasize the headline without a custom model.
  return `${title}\n${title}\n\n${body}`.trim();
}

export const ticketSegmenter: Segmenter = (doc: Document): Chunk[] => [
  { index: 0, content: doc.text, meta: doc.source },
];
