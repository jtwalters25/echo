/**
 * Echo result shaping — ranked matches → "seen before?" answer.
 *
 * This is Echo's analogue of Clause's verdict policy, but for ranking: instead of
 * STANDARD/REVIEW/BLOCK it returns a confidence band plus the top-k similar past
 * tickets and their resolutions. Pure function of matches + thresholds so replay
 * can reason about it offline.
 */
import type { Match } from "@/engine/types";
import { RESOLUTIONS, type Resolution } from "./tickets";

export type Confidence = "SEEN_BEFORE" | "SIMILAR" | "NOVEL";

export interface SimilarTicket {
  ticketId: string;
  title: string;
  similarity: number;
  resolution: Resolution | null;
}

export interface EchoResult {
  confidence: Confidence;
  /** Best cosine similarity observed (drives the confidence band). */
  topSimilarity: number;
  matches: SimilarTicket[];
}

export interface RankThresholds {
  seenBefore: number; // ≥ this ⇒ high-confidence duplicate
  similar: number; // ≥ this ⇒ related, worth showing
}

// Calibrated against the seed corpus + demo probes (all-mpnet-base-v2):
//   ~0.85+  near-duplicate ticket      → SEEN_BEFORE
//   ~0.5–0.82  same topic, distinct    → SIMILAR   (e.g. a paraphrased SSO issue ≈0.57)
//   <0.5   unrelated                   → NOVEL     (e.g. a dark-mode UI bug ≈0.28)
// The replay harness (npm run replay) makes this tuning systematic.
export const DEFAULT_THRESHOLDS: RankThresholds = { seenBefore: 0.82, similar: 0.5 };

export function rank(matches: Match[], thresholds = DEFAULT_THRESHOLDS): EchoResult {
  const sorted = [...matches].sort((a, b) => b.similarity - a.similarity);
  const top = sorted[0]?.similarity ?? 0;

  const confidence: Confidence =
    top >= thresholds.seenBefore ? "SEEN_BEFORE" : top >= thresholds.similar ? "SIMILAR" : "NOVEL";

  const similar: SimilarTicket[] = sorted
    .filter((m) => m.similarity >= thresholds.similar)
    .map((m) => {
      const resolutionId = (m.entry.meta?.resolutionId as string) ?? m.entry.label;
      const title = (m.entry.meta?.title as string) ?? m.entry.content.slice(0, 60);
      return {
        ticketId: m.entry.id,
        title,
        similarity: m.similarity,
        resolution: RESOLUTIONS[resolutionId] ?? null,
      };
    });

  return { confidence, topSimilarity: top, matches: similar };
}
