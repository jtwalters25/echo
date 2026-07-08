"use client";

import { useState } from "react";
import Link from "next/link";
import type { Confidence, EchoResult } from "@/domain/echo/rank";
import { DEFAULT_THRESHOLDS } from "@/domain/echo/rank";
import { EXAMPLES } from "@/domain/echo/examples";
import { ConfidenceScale, SimilarityBar } from "@/components/retrieval-viz";
import { HowItWorks } from "@/components/how-it-works";
import fixtures from "@/domain/echo/fixtures.json";
import evalReport from "@/domain/echo/eval-report.json";

/** Confidence → telemetry swatch. emerald=near-dup, amber=related, slate=unrelated. */
const BAND: Record<Confidence, { label: string; text: string; dot: string; ring: string }> = {
  SEEN_BEFORE: { label: "Seen before", text: "text-seen", dot: "bg-seen", ring: "border-seen/40 bg-seen/10" },
  SIMILAR: { label: "Similar tickets found", text: "text-amber", dot: "bg-amber", ring: "border-amber/40 bg-amber/10" },
  NOVEL: { label: "Looks novel", text: "text-muted", dot: "bg-novel", ring: "border-edge bg-panel2" },
};

const FIXTURES = fixtures as Record<string, EchoResult>;

export default function Home() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [result, setResult] = useState<EchoResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function loadExample(id: string) {
    const ex = EXAMPLES.find((e) => e.id === id);
    if (!ex) return;
    setTitle(ex.title);
    setBody(ex.body);
    setError(null);
    if (FIXTURES[id]) setResult(FIXTURES[id]);
    else {
      setResult(null);
      run(ex.title, ex.body);
    }
  }

  async function run(t = title, b = body) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: t, body: b }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "failed");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      {/* ── Top bar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 border-b border-edge bg-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2.5">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald" />
            <span className="font-mono text-sm font-semibold tracking-tight text-fg">echo</span>
            <span className="font-mono text-xs text-faint">/ retrieval</span>
          </div>
          <Link href="/eval" className="font-mono text-xs text-muted hover:text-emerald">
            ranker quality: <span className="text-emerald">recall@1 {evalReport.baseline.recallAt1.toFixed(2)}</span> ·
            MRR {evalReport.baseline.mrr.toFixed(2)} · {evalReport.gate.pass ? "PASS" : "FAIL"} →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-10">
        <h1 className="text-2xl font-semibold tracking-tight text-fg">Have we seen this ticket before?</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Paste an incoming ticket. Echo retrieves the most similar <span className="text-fg">resolved</span> tickets
          and how they were fixed — semantic search over a pgvector corpus, evaluated offline before it ships.
        </p>

        {/* Examples */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-widest text-faint">examples</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex.id}
              onClick={() => loadExample(ex.id)}
              className="group inline-flex items-center gap-2 rounded-md border border-edge bg-panel px-3 py-1.5 text-xs text-muted transition-colors hover:border-emerald/50 hover:text-fg"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${BAND[ex.expected].dot}`} />
              {ex.title}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="mt-4 panel overflow-hidden">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ticket title…"
            className="w-full border-b border-edge bg-transparent px-4 py-3 text-sm text-fg outline-none placeholder:text-faint"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="describe the issue…"
            className="h-36 w-full resize-none bg-transparent px-4 py-3 font-mono text-sm text-fg outline-none placeholder:text-faint"
          />
          <div className="flex items-center justify-between border-t border-edge bg-panel2/50 px-4 py-2.5">
            <span className="font-mono text-[11px] text-faint">
              {(title + body).trim().length} chars · pgvector kNN
            </span>
            <button
              onClick={() => run()}
              disabled={loading || (title + body).trim().length < 10}
              className="rounded-md bg-emerald px-4 py-1.5 text-sm font-semibold text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {loading ? "searching…" : "Find similar"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-amber/40 bg-amber/10 px-4 py-3 font-mono text-sm text-amber">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <section className="mt-8">
            <div className="panel">
              <div className="panel-head">
                <div className="flex items-center gap-2.5">
                  <span className={`h-2 w-2 rounded-full ${BAND[result.confidence].dot}`} />
                  <span className={`text-sm font-semibold ${BAND[result.confidence].text}`}>
                    {BAND[result.confidence].label}
                  </span>
                </div>
                <span className="font-mono text-xs text-faint">
                  {result.matches.length} matches · top {result.topSimilarity.toFixed(2)}
                </span>
              </div>
              <div className="px-4 py-4">
                <ConfidenceScale value={result.topSimilarity} thresholds={DEFAULT_THRESHOLDS} confidence={result.confidence} />
              </div>
            </div>

            {result.matches.length === 0 ? (
              <p className="mt-4 rounded-md border border-edge bg-panel px-4 py-3 font-mono text-sm text-muted">
                no past ticket cleared the similarity floor — likely a genuinely new issue.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {result.matches.map((m) => (
                  <li key={m.ticketId} className="panel p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-fg">{m.title}</span>
                      {m.resolution && <span className="chip">{m.resolution.id}</span>}
                    </div>
                    <div className="mt-3">
                      <SimilarityBar value={m.similarity} />
                    </div>
                    {m.resolution && (
                      <p className="mt-3 rounded-md border-l-2 border-emerald bg-panel2/60 px-3 py-2 text-sm text-muted">
                        <span className="font-medium text-emerald">resolution</span> · {m.resolution.summary}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <HowItWorks />

        <footer className="mt-16 border-t border-edge pt-4 font-mono text-xs text-faint">
          similarity engine · pgvector HNSW · offline replay eval · recall@k / MRR gate
        </footer>
      </main>
    </div>
  );
}
