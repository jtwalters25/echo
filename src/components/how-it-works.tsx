/**
 * "How it works" strip — the pipeline + the shared-engine transplant story.
 *
 * One domain-agnostic engine (ingest → embed → pgvector kNN) powers both Echo and
 * Clause; only the seams differ. Marked seams (*) are the domain-specific swaps.
 * Neutral Tailwind on purpose — Echo's theming happens later.
 */
const STAGES = [
  { label: "Ingest", seam: false },
  { label: "Chunk", seam: true, note: "whole ticket" },
  { label: "Embed", seam: false, note: "mpnet 768-d" },
  { label: "pgvector kNN", seam: false, note: "HNSW cosine" },
  { label: "Rank", seam: true, note: "seen-before + top-k" },
];

export function HowItWorks() {
  return (
    <section className="mt-12 rounded-xl border border-neutral-200 bg-white p-5">
      <div className="text-xs font-semibold uppercase tracking-widest text-neutral-500">How it works</div>

      <div className="mt-4 flex flex-wrap items-stretch gap-2">
        {STAGES.map((s, i) => (
          <div key={s.label} className="flex items-stretch gap-2">
            <div
              className={`flex min-w-[7rem] flex-col justify-center rounded-lg border px-3 py-2 ${
                s.seam ? "border-teal-300 bg-teal-50" : "border-neutral-200 bg-neutral-50"
              }`}
            >
              <span className="text-sm font-semibold text-neutral-800">
                {s.label}
                {s.seam && <sup className="text-teal-600">*</sup>}
              </span>
              {s.note && <span className="font-mono text-[10px] text-neutral-400">{s.note}</span>}
            </div>
            {i < STAGES.length - 1 && <span className="self-center text-lg text-neutral-300">→</span>}
          </div>
        ))}
      </div>

      <p className="mt-4 text-sm leading-relaxed text-neutral-600">
        <span className="rounded bg-teal-50 px-1 font-semibold text-teal-700">*</span> = domain seam.
        The rest — ingest, embedding, and the pgvector kNN search — is a{" "}
        <span className="font-semibold text-neutral-800">domain-agnostic engine</span> shared verbatim
        with its sibling project.
      </p>

      <a
        href="https://github.com/jtwalters25/clause"
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:border-teal-400 hover:text-teal-700"
      >
        ▸ Same engine, classification instead of ranking → Clause
      </a>
    </section>
  );
}
