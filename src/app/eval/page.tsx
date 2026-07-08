import Link from "next/link";
import report from "@/domain/echo/eval-report.json";

export const metadata = {
  title: "Echo — ranker quality",
  description: "Offline replay evaluation: recall@k and MRR over the resolved-ticket corpus.",
};

function Cell({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="brutal-box p-4">
      <div className="font-mono text-xs font-bold uppercase tracking-widest text-ink/60">{label}</div>
      <div className="mt-1 font-mono text-3xl font-bold tabular-nums">{value}</div>
      {sub && <div className="mt-0.5 font-mono text-xs text-ink/50">{sub}</div>}
    </div>
  );
}

export default function EvalPage() {
  const { baseline, candidate, corpus, gate, generatedAt } = report;
  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <header className="brutal-box shadow-brutal-lg">
        <div className="flex items-center justify-between border-b-3 border-ink bg-azure px-5 py-3">
          <span className="font-mono text-xl font-bold uppercase tracking-tighter text-white">◗ Ranker quality</span>
          <Link href="/" className="brutal-tag border-white bg-acid text-ink">← back</Link>
        </div>
        <p className="px-5 py-4 font-medium leading-snug">
          Retrieval is evaluated <span className="font-bold">offline, before shipping</span>, by
          leave-one-out replay over the resolved-ticket corpus — two tickets sharing a resolution
          are &ldquo;relevant.&rdquo; A Netflix XP-style offline A/B on the ranker; it runs entirely
          on vectors already in pgvector (no embedding calls) and gates CI on recall@1.
        </p>
      </header>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Cell label="recall@1" value={baseline.recallAt1.toFixed(2)} sub="relevant hit ranked first" />
        <Cell label={`recall@${baseline.k}`} value={baseline.recallAtK.toFixed(2)} sub="relevant hit in top-k" />
        <Cell label="MRR" value={baseline.mrr.toFixed(3)} sub="mean reciprocal rank" />
        <Cell label="corpus" value={String(corpus.tickets)} sub={`${corpus.resolutionGroups} resolution groups`} />
        <Cell label="depth" value={`k=${baseline.k}`} sub={`candidate tested at k=${candidate.k}`} />
        <Cell label="gate" value={gate.pass ? "PASS" : "FAIL"} sub={`${gate.metric} ≥ ${gate.floor}`} />
      </div>

      <div className="mt-6 brutal-box p-4 font-mono text-sm">
        <span className="font-bold">Offline A/B:</span> baseline <code>k={baseline.k}</code> vs
        candidate <code>k={candidate.k}</code> — recall{" "}
        {(candidate.recallAtK - baseline.recallAtK >= 0 ? "+" : "")}
        {(candidate.recallAtK - baseline.recallAtK).toFixed(2)}, MRR{" "}
        {(candidate.mrr - baseline.mrr >= 0 ? "+" : "")}
        {(candidate.mrr - baseline.mrr).toFixed(3)}.{" "}
        <span className="text-ink/50">Regenerate with `npm run replay`.</span>
      </div>

      <p className="mt-4 font-mono text-xs text-ink/40">
        Evaluated {generatedAt} · registry {report.registryVersion}
      </p>
    </main>
  );
}
