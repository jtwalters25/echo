/**
 * Offline Replay CLI — `npm run replay`
 *
 * Leave-one-out replays the seeded ticket corpus and reports retrieval quality
 * (recall@k, MRR), then compares the baseline retrieval depth against a candidate
 * one — a Netflix XP-style offline A/B on the ranker. Exits non-zero if recall@1
 * falls below a floor, so it doubles as a CI gate against ranker regressions.
 *
 * Runs entirely on vectors already stored in Supabase — no embedding calls.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { writeFileSync } from "fs";
import { join } from "path";
import { loadCorpus } from "@/engine/store";
import { replay, compareReplays } from "@/engine/eval/replay";
import { baselineConfig } from "@/domain/echo/pipeline";
import { REGISTRY_VERSION } from "@/domain/echo/tickets";
import type { ReplayReport } from "@/engine/eval/types";

const RECALL_AT_1_FLOOR = 0.8; // gate: ≥80% of tickets must retrieve a relevant neighbour first

function recallAt(report: ReplayReport, rank: number): number {
  const hits = report.cases.filter((c) => c.firstRelevantRank !== null && c.firstRelevantRank <= rank);
  return report.cases.length ? hits.length / report.cases.length : 0;
}

function printReport(label: string, report: ReplayReport) {
  console.log(`\n▓ ${label}  (k=${report.config.k}, n=${report.n})`);
  console.log(`  recall@1 ${recallAt(report, 1).toFixed(2)}   recall@${report.config.k} ${report.recallAtK.toFixed(2)}   MRR ${report.mrr.toFixed(3)}`);
}

async function main() {
  const corpus = await loadCorpus(REGISTRY_VERSION);
  if (corpus.length === 0) {
    console.error(`no corpus for ${REGISTRY_VERSION} — run \`npm run seed\` first.`);
    process.exit(1);
  }

  // Baseline: shipped retrieval depth.
  const baseline = replay(baselineConfig, corpus);
  printReport("baseline", baseline);

  // Candidate: a shallower ranker (k=3) — the offline A/B knob.
  const candidate = replay({ ...baselineConfig, k: 3 }, corpus);
  printReport("candidate k=3", candidate);

  const diff = compareReplays(baseline, candidate);
  console.log(
    `\nΔ candidate vs baseline:  recall ${diff.recallDelta >= 0 ? "+" : ""}${diff.recallDelta.toFixed(2)}   MRR ${diff.mrrDelta >= 0 ? "+" : ""}${diff.mrrDelta.toFixed(3)}   → ${diff.improved ? "no regression" : "REGRESSION"}`,
  );

  // Per-case detail (leave-one-out ranks).
  console.log("\n  ticket            first-relevant-rank   top-k labels");
  for (const c of baseline.cases) {
    const rank = c.firstRelevantRank ?? "—";
    console.log(`  ${c.queryId.padEnd(16)}  ${String(rank).padStart(4)}                 ${c.retrievedLabels.join(", ")}`);
  }

  // Gate.
  const r1 = recallAt(baseline, 1);
  const pass = r1 >= RECALL_AT_1_FLOOR;

  // Panel-facing report — committed and rendered at /eval (no DB call on page load).
  const groups = new Set(corpus.map((e) => e.label)).size;
  const report = {
    generatedAt: new Date().toISOString().slice(0, 10),
    registryVersion: REGISTRY_VERSION,
    corpus: { tickets: corpus.length, resolutionGroups: groups },
    baseline: { k: baseline.config.k, recallAt1: recallAt(baseline, 1), recallAtK: baseline.recallAtK, mrr: baseline.mrr },
    candidate: { k: candidate.config.k, recallAt1: recallAt(candidate, 1), recallAtK: candidate.recallAtK, mrr: candidate.mrr },
    gate: { metric: "recall@1", value: r1, floor: RECALL_AT_1_FLOOR, pass },
  };
  writeFileSync(join(process.cwd(), "src/domain/echo/eval-report.json"), JSON.stringify(report, null, 2) + "\n");

  console.log(`\ngate: recall@1 ${r1.toFixed(2)} vs floor ${RECALL_AT_1_FLOOR} → ${pass ? "PASS ✓" : "FAIL ✗"}`);
  process.exit(pass ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
