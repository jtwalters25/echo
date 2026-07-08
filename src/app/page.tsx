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

/** Confidence → brutalist swatch. mint=near-dup, acid=related, slate=unrelated. */
const BAND: Record<Confidence, { label: string; bg: string; fg: string }> = {
  SEEN_BEFORE: { label: "Seen before", bg: "bg-seen", fg: "text-ink" },
  SIMILAR: { label: "Similar tickets found", bg: "bg-similar", fg: "text-ink" },
  NOVEL: { label: "Looks novel", bg: "bg-novel", fg: "text-ink" },
};

const FIXTURES = fixtures as Record<string, EchoResult>;

export default function Home() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [result, setResult] = useState<EchoResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Load an example: serve its precomputed fixture instantly if present,
   *  otherwise fall back to running it live. */
  function loadExample(id: string) {
    const ex = EXAMPLES.find((e) => e.id === id);
    if (!ex) return;
    setTitle(ex.title);
    setBody(ex.body);
    setError(null);
    if (FIXTURES[id]) {
      setResult(FIXTURES[id]); // instant, no API call
    } else {
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
    <main className="mx-auto max-w-4xl px-5 py-10">
      {/* ── Masthead ─────────────────────────────────────────── */}
      <header className="brutal-box shadow-brutal-lg">
        <div className="flex items-center justify-between border-b-3 border-ink bg-azure px-5 py-3">
          <span className="font-mono text-2xl font-bold uppercase tracking-tighter text-white">
            ◗ Echo
          </span>
          <span className="brutal-tag border-white bg-acid text-ink">resolution·finder</span>
        </div>
        <p className="px-5 py-4 text-lg font-medium leading-snug">
          Paste an incoming ticket. Echo retrieves the most similar{" "}
          <span className="underline decoration-azure decoration-2">resolved</span> tickets and how
          they were fixed — so you don&apos;t solve the same problem twice.
        </p>
      </header>

      {/* ── Ranker-quality strip — the eval story, on screen ── */}
      <Link
        href="/eval"
        className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 border-3 border-ink bg-white px-4 py-2 font-mono text-sm shadow-brutal-sm transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal"
      >
        <span className="font-bold uppercase tracking-widest text-ink/70">Ranker quality</span>
        <span>recall@1 <b className="tabular-nums">{evalReport.baseline.recallAt1.toFixed(2)}</b></span>
        <span>MRR <b className="tabular-nums">{evalReport.baseline.mrr.toFixed(2)}</b></span>
        <span>{evalReport.corpus.tickets} tickets</span>
        <span className={`px-1.5 ${evalReport.gate.pass ? "bg-seen" : "bg-azure text-white"}`}>
          gate {evalReport.gate.pass ? "PASS" : "FAIL"}
        </span>
        <span className="ml-auto text-azure">evaluated offline →</span>
      </Link>

      {/* ── Examples ─────────────────────────────────────────── */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <span className="font-mono text-xs font-bold uppercase tracking-widest text-ink/60">Try →</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex.id}
            onClick={() => loadExample(ex.id)}
            className="border-3 border-ink bg-white px-3 py-1.5 font-mono text-sm font-bold shadow-brutal-sm transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal active:translate-x-0 active:translate-y-0 active:shadow-none"
          >
            {ex.title}
            <span className={`ml-2 inline-block h-2.5 w-2.5 border border-ink ${BAND[ex.expected].bg}`} />
          </button>
        ))}
      </div>

      {/* ── Input ────────────────────────────────────────────── */}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Ticket title…"
        className="mt-4 w-full border-3 border-ink bg-white p-3 font-mono text-sm shadow-brutal outline-none placeholder:text-ink/40 focus:shadow-brutal-azure"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Describe the issue…"
        className="mt-3 h-40 w-full resize-none border-3 border-ink bg-white p-4 font-mono text-sm shadow-brutal outline-none placeholder:text-ink/40 focus:shadow-brutal-azure"
      />

      <div className="mt-5 flex items-center gap-4">
        <button
          onClick={() => run()}
          disabled={loading || (title + body).trim().length < 10}
          className="border-3 border-ink bg-azure px-6 py-3 font-mono text-base font-bold uppercase tracking-wide text-white shadow-brutal transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg active:translate-x-0 active:translate-y-0 active:shadow-none disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-brutal"
        >
          {loading ? "Searching…" : "▶ Find similar tickets"}
        </button>
        {(title + body).trim().length > 0 && (title + body).trim().length < 10 && (
          <span className="font-mono text-xs text-ink/50">min 10 chars</span>
        )}
      </div>

      {error && (
        <div className="mt-6 border-3 border-ink bg-azure px-4 py-3 font-mono text-sm font-bold text-white shadow-brutal">
          ✕ {error}
        </div>
      )}

      {/* ── Result ───────────────────────────────────────────── */}
      {result && (
        <section className="mt-10">
          <div className="brutal-box shadow-brutal-lg">
            <div className={`flex flex-wrap items-center justify-between gap-3 border-b-3 border-ink px-5 py-4 ${BAND[result.confidence].bg} ${BAND[result.confidence].fg}`}>
              <span className="font-mono text-2xl font-bold uppercase tracking-tight">
                {BAND[result.confidence].label}
              </span>
              <span className="font-mono text-xs font-bold uppercase tracking-widest opacity-70">
                {result.matches.length} matches · top {result.topSimilarity.toFixed(2)}
              </span>
            </div>
            {/* Why this band fired — score against the calibrated cut-lines. */}
            <div className="px-5 py-4">
              <ConfidenceScale
                value={result.topSimilarity}
                thresholds={DEFAULT_THRESHOLDS}
                confidence={result.confidence}
              />
            </div>
          </div>

          {result.matches.length === 0 ? (
            <p className="mt-6 border-3 border-ink bg-white p-4 font-mono text-sm text-ink/60 shadow-brutal">
              No past ticket cleared the similarity floor — likely a genuinely new issue.
            </p>
          ) : (
            <ul className="mt-6 space-y-5">
              {result.matches.map((m) => (
                <li key={m.ticketId} className="brutal-box p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-bold">{m.title}</span>
                    {m.resolution && (
                      <span className="brutal-tag border-2 bg-white px-1.5 py-0 text-[10px]">{m.resolution.id}</span>
                    )}
                  </div>
                  <div className="mt-3">
                    <SimilarityBar value={m.similarity} />
                  </div>
                  {m.resolution && (
                    <p className="mt-3 border-3 border-ink bg-paper p-3 font-mono text-xs leading-relaxed text-ink/70">
                      <span className="font-bold text-azure">resolution ▸ </span>
                      {m.resolution.summary}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <HowItWorks />

      <footer className="mt-16 border-t-3 border-ink pt-4 font-mono text-xs text-ink/50">
        similarity engine · pgvector HNSW · offline replay eval · recall@k / MRR gate
      </footer>
    </main>
  );
}
