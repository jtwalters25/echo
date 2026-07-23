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

**Core pipeline and CI-gating evaluation are complete** — not a scaffold. The engine, Echo
seams (segmenter, registry), rank step, `search()` pipeline, `/api/search` route, and UI are
built and typecheck clean. The offline replay is a real merge gate: `npm run replay` leave-one-out
replays the corpus, reports recall@k / MRR, and **exits non-zero when recall@1 falls below its
floor (0.8)**; `.github/workflows/eval.yml` runs it plus `tsc --noEmit` on every push and PR, with
no secrets, so a ranker regression blocks the merge.

The real limitation is **corpus size, not completeness**: n=9 resolved tickets across a few
resolution groups. The perfect scores (recall@1/@5 1.00, MRR 1.00) reflect that small,
well-separated set — they're evidence the harness works, not a claim about production accuracy.
**The artifact here is the harness — the pipeline and the CI-gating eval loop — rather than a
tuned model.** Grow the corpus and the same gate keeps the ranker honest. Build order tracked in
[`PLAN.md`](./PLAN.md).
