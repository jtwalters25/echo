/**
 * Retrieval transparency components — make a match feel legible.
 *
 * Brutalist to match the app shell. `ConfidenceScale` visualizes where a score
 * lands relative to the calibrated band cuts and states the rule that fired;
 * `SimilarityBar` shows each match's strength.
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
      <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/50">cosine</span>
      <div className="relative h-3 flex-1 border-2 border-ink bg-white">
        <div className="h-full bg-azure" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 shrink-0 text-right font-mono text-sm font-bold tabular-nums">{value.toFixed(2)}</span>
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
      <div className="relative h-9">
        {/* band regions */}
        <div className="absolute inset-y-3 left-0 border-2 border-ink bg-novel" style={{ width: `${simPos}%` }} />
        <div className="absolute inset-y-3 border-y-2 border-ink bg-similar" style={{ left: `${simPos}%`, width: `${seenPos - simPos}%` }} />
        <div className="absolute inset-y-3 right-0 border-2 border-ink bg-seen" style={{ left: `${seenPos}%` }} />
        {/* cut lines */}
        <Tick pos={simPos} label={`similar ${thresholds.similar}`} />
        <Tick pos={seenPos} label={`seen ${thresholds.seenBefore}`} />
        {/* score marker */}
        <div className="absolute -top-0.5 flex -translate-x-1/2 flex-col items-center" style={{ left: `${pos}%` }}>
          <span className="font-mono text-[10px] font-bold tabular-nums text-ink">{value.toFixed(2)}</span>
          <span className="text-ink">▾</span>
        </div>
      </div>
      <p className="mt-1 font-mono text-xs text-ink/60">
        <span className="font-bold text-ink">{confidence}</span> — {explainBand(value, thresholds)}
      </p>
    </div>
  );
}

function Tick({ pos, label }: { pos: number; label: string }) {
  return (
    <div className="absolute inset-y-1.5" style={{ left: `${pos}%` }}>
      <div className="h-5 w-0.5 bg-ink" />
      <span className="absolute top-5 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] text-ink/45">{label}</span>
    </div>
  );
}
