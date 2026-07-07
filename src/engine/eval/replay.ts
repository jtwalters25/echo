/**
 * Offline Replay  (Netflix XP / interleaving, applied to a retrieval ranker).
 *
 * Netflix evaluates a ranking change by replaying it over logged history and
 * measuring quality *before* it reaches users. Echo does the same with zero
 * labeling cost: every registry ticket already carries its resolution group, so
 * we can leave-one-out replay the whole corpus —
 *
 *   for each ticket t:
 *     hide t, rank the rest against t,
 *     did a neighbour sharing t.label land in the top-k?  (recall@k)
 *     how high?                                            (reciprocal rank → MRR)
 *
 * Swap the embedding model or k, re-run, compare recallAtK / mrr: that's an
 * offline A/B on the ranker. Interleaving two rankers is the stretch goal on top.
 *
 * Pure and in-memory (uses matchInMemory) — no database, so it runs in CI.
 */
import type { EmbeddedChunk, EngineConfig, RegistryEntry } from "../types";
import { matchInMemory } from "../match";
import type { ReplayCase, ReplayReport } from "./types";

/** A registry entry whose vector we already have (embedded corpus snapshot). */
export type ReplayCorpus = RegistryEntry[];

export function replay(config: EngineConfig, corpus: ReplayCorpus): ReplayReport {
  const cases: ReplayCase[] = [];

  for (const query of corpus) {
    const others = corpus.filter((e) => e.id !== query.id);
    const queryChunk: EmbeddedChunk = {
      index: 0,
      content: query.content,
      vector: query.vector,
      hash: "",
    };
    const matches = matchInMemory([queryChunk], others, config.k);
    const retrievedLabels = matches.map((m) => m.entry.label);
    const rankIdx = retrievedLabels.findIndex((l) => l === query.label);

    cases.push({
      queryId: query.id,
      label: query.label,
      firstRelevantRank: rankIdx === -1 ? null : rankIdx + 1,
      retrievedLabels,
    });
  }

  const hits = cases.filter((c) => c.firstRelevantRank !== null);
  const recallAtK = cases.length ? hits.length / cases.length : 0;
  const mrr = cases.length
    ? cases.reduce((s, c) => s + (c.firstRelevantRank ? 1 / c.firstRelevantRank : 0), 0) / cases.length
    : 0;

  return { config, n: cases.length, recallAtK, mrr, cases };
}

/** Compare two configs on the same corpus — the offline A/B. */
export function compareReplays(baseline: ReplayReport, candidate: ReplayReport) {
  return {
    recallDelta: candidate.recallAtK - baseline.recallAtK,
    mrrDelta: candidate.mrr - baseline.mrr,
    improved: candidate.recallAtK >= baseline.recallAtK && candidate.mrr >= baseline.mrr,
  };
}
