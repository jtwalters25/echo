/**
 * Offline evaluation contract — Echo build (retrieval metrics).
 *
 * Sibling to Clause's canary eval: both evaluate a candidate config against
 * ground truth *before* shipping. Clause gates on verdict quality; Echo gates on
 * retrieval quality — does the ranker surface a genuinely-related past item near
 * the top? Ground truth is free: two tickets with the same `label` (resolution /
 * root-cause id) are "relevant" to each other.
 */
import type { EngineConfig } from "../types";

/** Per-query replay outcome. */
export interface ReplayCase {
  queryId: string;
  /** Ground-truth group the query belongs to. */
  label: string;
  /** 1-based rank of the first retrieved neighbour sharing the label, or null. */
  firstRelevantRank: number | null;
  /** Labels of the top-k neighbours, best-first (for inspection). */
  retrievedLabels: string[];
}

/** Aggregate retrieval metrics for one config over the whole replay set. */
export interface ReplayReport {
  config: EngineConfig;
  n: number;
  /** Fraction of queries with ≥1 relevant neighbour in the top-k. */
  recallAtK: number;
  /** Mean reciprocal rank of the first relevant neighbour. */
  mrr: number;
  cases: ReplayCase[];
}
