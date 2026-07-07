/**
 * Engine contract — domain-agnostic (Echo build).
 *
 * Same retrieval spine as Clause, but Echo is a *ranking* problem, not a
 * classification one — so this file carries only the pure retrieval types.
 * There is no STANDARD/REVIEW/BLOCK here; a domain decides what to do with the
 * ranked matches (Echo: "seen before?" + top-k resolutions).
 *
 * Domains plug in via two seams:
 *   1. Segmenter — how raw text becomes Chunks   (chunk.ts consumes it)
 *   2. Registry  — the corpus we rank against     (store.ts persists it)
 *
 * Keep this file free of domain vocabulary (no "ticket", no "resolution").
 */

// ── Ingestion ────────────────────────────────────────────────

export interface Document {
  id: string;
  text: string;
  source?: Record<string, unknown>;
}

// ── Chunking ─────────────────────────────────────────────────

export interface Chunk {
  index: number;
  content: string;
  meta?: Record<string, unknown>;
}

/** SEAM 1: turns normalized text into ordered chunks. Injected per domain. */
export type Segmenter = (doc: Document) => Chunk[];

// ── Embedding ────────────────────────────────────────────────

export type Vector = number[];

export interface EmbeddedChunk extends Chunk {
  vector: Vector;
  /** Content-addressable seal: sha256(content + canonical meta). Tamper-evident. */
  hash: string;
}

// ── Registry (the corpus we rank against) ────────────────────

/** SEAM 2: one entry in the corpus. `label` is the ground-truth group id
 *  (Echo: the resolution / root-cause id shared by duplicate tickets). */
export interface RegistryEntry {
  id: string;
  content: string;
  vector: Vector;
  label: string;
  meta?: Record<string, unknown>;
  registryVersion: string;
}

// ── Matching ─────────────────────────────────────────────────

export interface Match {
  queryIndex: number;
  entry: RegistryEntry;
  /** Cosine similarity in [-1, 1]; higher = closer. */
  similarity: number;
}

// ── Engine configuration ─────────────────────────────────────

/** Everything that makes a retrieval run reproducible. */
export interface EngineConfig {
  embedModel: string;
  registryVersion: string;
  /** Neighbours to retrieve. */
  k: number;
}
