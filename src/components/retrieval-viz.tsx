/**
 * Retrieval transparency components — make a match feel legible.
 *
 * Dark telemetry styling. `ConfidenceScale` plots the score against the
 * calibrated band cuts and states the rule that fired; `SimilarityBar` shows
 * each match's strength.
 */
import type { Confidence, RankThresholds } from "@/domain/echo/rank";

/** Plain-English rule for why a confidence band fired. */
export function explainBand(value: number, t: RankThresholds): string {
  const v = value.toFixed(2);
  if (value >= t.seenBefore) return `${v} ≥ ${t.seenBefore} → near-duplicate → Seen before`;
  if (value >= t.similar) return `${t.similar} ≤ ${v} < ${t.seenBefore} → same topic, distinct → Similar`;
  return `${v} < ${t.similar} → no strong match → Novel`;
}

const clamp = (v: number) => Math.max(0, Math.min(1, v));

export function SimilarityBar({ value }: { value: number }) {
  const pct = Math.round(clamp(value) * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-[10px] uppercase tracking-widest text-faint">cosine</span>
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-panel2">
        <div className="h-full rounded-full bg-emerald" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 shrink-0 text-right font-mono text-xs font-semibold tabular-nums text-fg">
        {value.toFixed(2)}
      </span>
    </div>
  );
}

/** A 0→1 track with the band cut-lines, a marker at the score, and the fired rule. */
export function ConfidenceScale({
  value,
  thresholds,
  confidence,
}: {
  value: number;
  thresholds: RankThresholds;
  confidence: Confidence;
}) {
  const pos = clamp(value) * 100;
  const simPos = thresholds.similar * 100;
  const seenPos = thresholds.seenBefore * 100;

  return (
    <div>
      <div className="relative h-8">
        {/* band regions */}
        <div className="absolute inset-y-3 left-0 rounded-l bg-novel/40" style={{ width: `${simPos}%` }} />
        <div className="absolute inset-y-3 bg-amber/40" style={{ left: `${simPos}%`, width: `${seenPos - simPos}%` }} />
        <div className="absolute inset-y-3 right-0 rounded-r bg-seen/40" style={{ left: `${seenPos}%` }} />
        {/* cut lines */}
        <Tick pos={simPos} label={`similar ${thresholds.similar}`} />
        <Tick pos={seenPos} label={`seen ${thresholds.seenBefore}`} />
        {/* score marker */}
        <div className="absolute -top-0.5 flex -translate-x-1/2 flex-col items-center" style={{ left: `${pos}%` }}>
          <span className="font-mono text-[10px] font-bold tabular-nums text-fg">{value.toFixed(2)}</span>
          <span className="leading-none text-fg">▾</span>
        </div>
      </div>
      <p className="mt-1 font-mono text-xs text-muted">
        <span className="font-bold text-fg">{confidence}</span> — {explainBand(value, thresholds)}
      </p>
    </div>
  );
}

function Tick({ pos, label }: { pos: number; label: string }) {
  return (
    <div className="absolute inset-y-2" style={{ left: `${pos}%` }}>
      <div className="h-4 w-px bg-faint" />
      <span className="absolute top-4 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] text-faint">
        {label}
      </span>
    </div>
  );
}
