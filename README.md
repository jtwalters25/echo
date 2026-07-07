# Echo

**Ticket dedup & resolution finder.** Paste an incoming support ticket; Echo finds the most
similar **resolved** tickets and surfaces how they were fixed — so your team doesn't solve
the same problem twice.

Built on the same domain-agnostic similarity engine (`src/engine/`) as its sibling project
[Clause](../clause) — Echo reuses the retrieval spine verbatim and specializes it for
ranking. See [`PLAN.md`](./PLAN.md) for the architecture and the transplant story.

## How it works

```
ingest → chunk(ticket) → embed → pgvector kNN → rank(seen-before? + top-k resolutions)
```

The engine is domain-agnostic; the ticket-specific behavior lives in `src/domain/echo`
behind two seams (**segmenter**, **registry**) plus a **rank** step.

### Offline Replay evaluation

Every resolved ticket carries a resolution group, so ground truth is free. `npm run replay`
leave-one-out replays the corpus and reports **recall@k** and **MRR** — a Netflix XP-style
offline A/B on the ranker. Swap the embedding model or `k`, re-run, compare; wire it into CI
to block a ranker change that regresses retrieval quality.

## Tech

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router), React 19, Tailwind |
| Database | Supabase Postgres + pgvector (HNSW), `echo` schema |
| Embeddings | HuggingFace Inference — `all-mpnet-base-v2` (768-dim) |
| Hosting | Vercel |

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Supabase + HF keys
# In Supabase SQL editor: run schema.sql; then Settings → API → expose the `echo` schema
npm run seed                 # embed + upsert the resolved-ticket corpus
npm run dev                  # http://localhost:3000
```

## Status

Scaffold stage — engine (copied from Clause + trimmed), Echo seams, rank, pipeline, API, and
UI are in place. Build order tracked in [`PLAN.md`](./PLAN.md).
