"use client";

import { useState } from "react";
import Link from "next/link";
import type { Confidence, EchoResult } from "@/domain/echo/rank";
import { DEFAULT_THRESHOLDS } from "@/domain/echo/rank";
import { EXAMPLES } from "@/domain/echo/examples";
import { ConfidenceScale, SimilarityBar } from "@/components/retrieval-viz";
import fixtures from "@/domain/echo/fixtures.json";
import evalReport from "@/domain/echo/eval-report.json";

const BAND: Record<Confidence, { label: string; style: string }> = {
  SEEN_BEFORE: { label: "Seen before", style: "bg-teal-100 text-teal-800 border-teal-300" },
  SIMILAR: { label: "Similar tickets found", style: "bg-amber-100 text-amber-800 border-amber-300" },
  NOVEL: { label: "Looks novel", style: "bg-neutral-100 text-neutral-700 border-neutral-300" },
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
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Echo</h1>
      <p className="mt-2 text-neutral-600">
        Paste an incoming ticket. Echo finds the most similar <span className="font-medium">resolved</span> tickets
        and shows how they were fixed — so you don&apos;t solve the same problem twice.
      </p>

      {/* Ranker-quality strip — the eval story, on screen. */}
      <Link
        href="/eval"
        className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-600 hover:border-teal-400"
      >
        <span className="font-medium text-neutral-800">Ranker quality</span>
        <span>recall@1 <b className="tabular-nums">{evalReport.baseline.recallAt1.toFixed(2)}</b></span>
        <span>MRR <b className="tabular-nums">{evalReport.baseline.mrr.toFixed(2)}</b></span>
        <span>{evalReport.corpus.tickets} tickets</span>
        <span className={evalReport.gate.pass ? "text-teal-700" : "text-red-600"}>
          gate {evalReport.gate.pass ? "PASS" : "FAIL"}
        </span>
        <span className="ml-auto text-teal-700">evaluated offline →</span>
      </Link>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="text-sm text-neutral-500">Try an example:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex.id}
            onClick={() => loadExample(ex.id)}
            className="rounded-full border border-neutral-300 bg-white px-3 py-1 text-sm text-neutral-700 hover:border-teal-400 hover:text-teal-700"
          >
            {ex.title}
          </button>
        ))}
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Ticket title…"
        className="mt-3 w-full rounded-lg border border-neutral-300 p-3 text-sm focus:border-teal-500 focus:outline-none"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Describe the issue…"
        className="mt-3 h-40 w-full rounded-lg border border-neutral-300 p-4 text-sm focus:border-teal-500 focus:outline-none"
      />

      <button
        onClick={() => run()}
        disabled={loading || (title + body).trim().length < 10}
        className="mt-4 rounded-lg bg-teal-600 px-5 py-2.5 font-medium text-white disabled:opacity-40"
      >
        {loading ? "Searching…" : "Find similar tickets"}
      </button>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {result && (
        <section className="mt-8">
          <div className="flex items-center gap-3">
            <span className={`rounded-md border px-3 py-1 text-sm font-semibold ${BAND[result.confidence].style}`}>
              {BAND[result.confidence].label}
            </span>
            <span className="text-sm text-neutral-500">{result.matches.length} matches</span>
          </div>

          {/* Why this band fired — the score against the calibrated cut-lines. */}
          <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-4">
            <ConfidenceScale
              value={result.topSimilarity}
              thresholds={DEFAULT_THRESHOLDS}
              confidence={result.confidence}
            />
          </div>

          {result.matches.length === 0 ? (
            <p className="mt-6 text-sm text-neutral-500">
              No past ticket cleared the similarity floor — likely a genuinely new issue.
            </p>
          ) : (
            <ul className="mt-6 space-y-4">
              {result.matches.map((m) => (
                <li key={m.ticketId} className="rounded-lg border border-neutral-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-neutral-800">{m.title}</span>
                    {m.resolution && (
                      <span className="shrink-0 rounded bg-neutral-100 px-2 py-0.5 font-mono text-[10px] text-neutral-500">
                        {m.resolution.id}
                      </span>
                    )}
                  </div>
                  <div className="mt-2">
                    <SimilarityBar value={m.similarity} />
                  </div>
                  {m.resolution && (
                    <p className="mt-3 border-l-2 border-teal-200 pl-3 text-sm text-neutral-600">
                      <span className="font-medium text-teal-700">Resolution:</span> {m.resolution.summary}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
