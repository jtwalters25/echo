import Link from "next/link";
import report from "@/domain/echo/eval-report.json";

export const metadata = {
  title: "Echo — ranker quality",
  description: "Offline replay evaluation: recall@k and MRR over the resolved-ticket corpus.",
};

function Cell({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="panel p-4">
      <div className="font-mono text-[11px] uppercase tracking-widest text-faint">{label}</div>
      <div className="metric-value mt-1">{value}</div>
      {sub && <div className="mt-0.5 font-mono text-[11px] text-muted">{sub}</div>}
    </div>
  );
}

export default function EvalPage() {
  const { baseline, candidate, corpus, gate, generatedAt } = report;
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-edge bg-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2.5">
            <span className={`inline-block h-2 w-2 rounded-full ${gate.pass ? "bg-emerald" : "bg-amber"}`} />
            <span className="font-mono text-sm font-semibold text-fg">echo</span>
            <span className="font-mono text-xs text-faint">/ ranker quality</span>
          </div>
          <Link href="/" className="font-mono text-xs text-muted hover:text-emerald">← back</Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-10">
        <h1 className="text-2xl font-semibold tracking-tight text-fg">Ranker quality</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Retrieval is evaluated <span className="text-fg">offline, before shipping</span>, by
          leave-one-out replay over the resolved-ticket corpus — two tickets sharing a resolution are
          &ldquo;relevant.&rdquo; A Netflix XP-style offline A/B on the ranker; runs entirely on
          vectors already in pgvector (no embedding calls) and gates CI on recall@1.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Cell label="recall@1" value={baseline.recallAt1.toFixed(2)} sub="relevant hit ranked first" />
          <Cell label={`recall@${baseline.k}`} value={baseline.recallAtK.toFixed(2)} sub="relevant hit in top-k" />
          <Cell label="MRR" value={baseline.mrr.toFixed(3)} sub="mean reciprocal rank" />
          <Cell label="corpus" value={String(corpus.tickets)} sub={`${corpus.resolutionGroups} resolution groups`} />
          <Cell label="depth" value={`k=${baseline.k}`} sub={`candidate tested at k=${candidate.k}`} />
          <Cell label="gate" value={gate.pass ? "PASS" : "FAIL"} sub={`${gate.metric} ≥ ${gate.floor}`} />
        </div>

        <div className="mt-6 panel p-4 font-mono text-sm text-muted">
          <span className="font-semibold text-fg">offline A/B:</span> baseline{" "}
          <span className="text-emerald">k={baseline.k}</span> vs candidate{" "}
          <span className="text-emerald">k={candidate.k}</span> — recall{" "}
          {(candidate.recallAtK - baseline.recallAtK >= 0 ? "+" : "")}
          {(candidate.recallAtK - baseline.recallAtK).toFixed(2)}, MRR{" "}
          {(candidate.mrr - baseline.mrr >= 0 ? "+" : "")}
          {(candidate.mrr - baseline.mrr).toFixed(3)}.{" "}
          <span className="text-faint">regenerate with `npm run replay`</span>
        </div>

        <p className="mt-4 font-mono text-[11px] text-faint">
          evaluated {generatedAt} · registry {report.registryVersion}
        </p>
      </main>
    </div>
  );
}
