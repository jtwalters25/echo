import Link from "next/link";
import report from "@/domain/echo/eval-report.json";

export const metadata = {
  title: "Echo — ranker quality",
  description: "Offline replay evaluation: recall@k and MRR over the resolved-ticket corpus.",
};

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="text-xs font-medium uppercase tracking-widest text-neutral-500">{label}</div>
      <div className="mt-1 text-3xl font-semibold tabular-nums">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-neutral-500">{sub}</div>}
    </div>
  );
}

export default function EvalPage() {
  const { baseline, candidate, corpus, gate, generatedAt } = report;
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Ranker quality</h1>
        <Link href="/" className="text-sm text-teal-700 hover:underline">← back</Link>
      </div>
      <p className="mt-2 text-neutral-600">
        Retrieval is evaluated <span className="font-medium">offline, before shipping</span>, by
        leave-one-out replay over the resolved-ticket corpus — two tickets sharing a resolution
        are &ldquo;relevant.&rdquo; This is a Netflix XP-style offline A/B on the ranker; it runs
        entirely on vectors already in pgvector (no embedding calls).
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Metric label="recall@1" value={baseline.recallAt1.toFixed(2)} sub="relevant hit ranked first" />
        <Metric label={`recall@${baseline.k}`} value={baseline.recallAtK.toFixed(2)} sub="relevant hit in top-k" />
        <Metric label="MRR" value={baseline.mrr.toFixed(3)} sub="mean reciprocal rank" />
        <Metric label="corpus" value={String(corpus.tickets)} sub={`${corpus.resolutionGroups} resolution groups`} />
        <Metric label="depth" value={`k=${baseline.k}`} sub={`candidate tested at k=${candidate.k}`} />
        <Metric label="gate" value={gate.pass ? "PASS" : "FAIL"} sub={`${gate.metric} ≥ ${gate.floor}`} />
      </div>

      <div className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
        <span className="font-medium text-neutral-800">Offline A/B:</span> baseline{" "}
        <code>k={baseline.k}</code> vs candidate <code>k={candidate.k}</code> —{" "}
        recall {(candidate.recallAtK - baseline.recallAtK >= 0 ? "+" : "")}
        {(candidate.recallAtK - baseline.recallAtK).toFixed(2)}, MRR{" "}
        {(candidate.mrr - baseline.mrr >= 0 ? "+" : "")}
        {(candidate.mrr - baseline.mrr).toFixed(3)}. Regenerate with{" "}
        <code>npm run replay</code>.
      </div>

      <p className="mt-4 text-xs text-neutral-400">
        Evaluated {generatedAt} · registry {report.registryVersion}
      </p>
    </main>
  );
}
