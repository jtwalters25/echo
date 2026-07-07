/**
 * Echo pipeline — composes the engine spine with the Echo seams into a single
 * search(title, body) call the API route uses.
 *
 *   ingest → chunk(ticketSegmenter) → embed → match → rank(seen-before + top-k)
 *
 * The only place the engine and the Echo domain are wired together.
 */
import { fromText } from "@/engine/ingest";
import { chunk } from "@/engine/chunk";
import { embedChunks } from "@/engine/embed";
import { matchChunks } from "@/engine/match";
import type { EngineConfig } from "@/engine/types";
import { ticketSegmenter, ticketText } from "./segmenter";
import { rank, DEFAULT_THRESHOLDS, type EchoResult, type RankThresholds } from "./rank";
import { REGISTRY_VERSION } from "./tickets";

export const baselineConfig: EngineConfig = {
  embedModel: process.env.EMBED_MODEL ?? "sentence-transformers/all-mpnet-base-v2",
  registryVersion: REGISTRY_VERSION,
  k: 5,
};

export async function search(
  title: string,
  body: string,
  config: EngineConfig = baselineConfig,
  thresholds: RankThresholds = DEFAULT_THRESHOLDS,
): Promise<EchoResult> {
  const doc = fromText(ticketText(title, body));
  const chunks = chunk(doc, ticketSegmenter);
  const embedded = await embedChunks(chunks, config.embedModel);
  const matches = await matchChunks(embedded, {
    registryVersion: config.registryVersion,
    k: config.k,
  });
  return rank(matches, thresholds);
}
