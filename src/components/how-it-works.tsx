/**
 * "How it works" strip — the pipeline + the shared-engine transplant story.
 *
 * One domain-agnostic engine (ingest → embed → pgvector kNN) powers both Echo and
 * Clause; only the seams differ. Marked seams (*) are the domain-specific swaps.
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
    <section className="mt-12 panel">
      <div className="panel-head">
        <span className="font-mono text-xs uppercase tracking-widest text-muted">how it works</span>
      </div>

      <div className="p-4">
        <div className="flex flex-wrap items-stretch gap-1.5">
          {STAGES.map((s, i) => (
            <div key={s.label} className="flex items-stretch gap-1.5">
              <div
                className={`flex min-w-[7rem] flex-col justify-center rounded-md border px-3 py-2 ${
                  s.seam ? "border-emerald/40 bg-emerald/10" : "border-edge bg-panel2"
                }`}
              >
                <span className="font-mono text-sm font-semibold text-fg">
                  {s.label}
                  {s.seam && <sup className="text-emerald">*</sup>}
                </span>
                {s.note && <span className="font-mono text-[10px] text-faint">{s.note}</span>}
              </div>
              {i < STAGES.length - 1 && <span className="self-center font-mono text-lg text-faint">→</span>}
            </div>
          ))}
        </div>

        <p className="mt-4 text-sm leading-relaxed text-muted">
          <span className="font-mono text-emerald">*</span> = domain seam. The rest — ingest,
          embedding, and the pgvector kNN search — is a{" "}
          <span className="font-medium text-fg">domain-agnostic engine</span> shared verbatim with
          its sibling project.
        </p>

        <a
          href="https://github.com/jtwalters25/clause"
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-2 rounded-md border border-edge bg-panel2 px-3 py-1.5 font-mono text-xs text-muted transition-colors hover:border-emerald/50 hover:text-fg"
        >
          → same engine, classification instead of ranking · Clause
        </a>
      </div>
    </section>
  );
}
