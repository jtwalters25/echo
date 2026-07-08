# Echo

[![eval-gate](https://github.com/jtwalters25/echo/actions/workflows/eval.yml/badge.svg)](https://github.com/jtwalters25/echo/actions/workflows/eval.yml)

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
offline A/B on the ranker. Swap the embedding model or `k`, re-run, compare; the script exits
non-zero if recall@1 drops below a floor, so it doubles as a CI gate against ranker regressions.

Current corpus scores **recall@1 1.00 · recall@5 1.00 · MRR 1.00** over 9 tickets — every
ticket retrieves a same-resolution neighbour first. It runs entirely on vectors already in
Supabase (no embedding calls), and prints a per-ticket rank table plus a baseline-vs-candidate
(k=5 vs k=3) comparison:

```
$ npm run replay
▓ baseline  (k=5, n=9)   recall@1 1.00   recall@5 1.00   MRR 1.000
gate: recall@1 1.00 vs floor 0.8 → PASS ✓
```

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
