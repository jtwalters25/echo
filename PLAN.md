# Echo — build plan

Portfolio project #2 of a two-project set (**Clause** + **Echo**) built on one shared
similarity engine. Echo reuses Clause's retrieval spine verbatim and specializes it for a
*ranking* problem, proving the core transplants cleanly.

## Premise (one sentence)

Paste an incoming support ticket; Echo surfaces the most similar **resolved** tickets and
how they were fixed — so you don't solve the same problem twice.

## Working principles (the shared spine)

> ingest → chunk → embed → store(pgvector) → match → rank(seen-before + top-k)

The engine (`src/engine/`) is the same domain-agnostic core as Clause, minus the
classification scorer (Echo ranks, it doesn't classify). Two seams:

| Seam | Type | Echo implementation |
|---|---|---|
| 1. Segmenter | `Segmenter` | `domain/echo/segmenter.ts` — whole ticket = one chunk (title weighted) |
| 2. Registry | `RegistryEntry[]` | `domain/echo/tickets.ts` — resolved tickets, `label` = resolution group |

Result shaping (Echo's analogue of Clause's verdict) lives in `domain/echo/rank.ts`:
confidence band (SEEN_BEFORE / SIMILAR / NOVEL) + top-k similar tickets with resolutions.
`domain/echo/pipeline.ts` wires engine + seams.

## What changed vs Clause (the transplant story)

- **Kept verbatim:** `ingest`, `chunk`, `embed`, `store`, `match`, `hash`, `eval/types` shape.
- **Dropped:** `score.ts` + verdict types — Echo has no BLOCK/REVIEW, it ranks.
- **Swapped:** segmenter (many clauses → one ticket), registry (playbook → tickets),
  scorer (verdict policy → rank), schema (`clause` → `echo`).

## Netflix hook — Offline Replay (XP / interleaving)

Every registry ticket carries a resolution group, so ground truth is free. `eval/replay.ts`
leave-one-out replays the whole corpus: hide a ticket, rank the rest, did a neighbour
sharing its resolution land in the top-k? → **recall@k** and **MRR**. Swap the model or k,
re-run, compare — an offline A/B on the ranker. Wire `npm run replay` to exit non-zero on
regression so CI blocks a bad ranker change. Interleaving two rankers is the stretch goal.

Clause's counterpart is Automated Canary Analysis. Same discipline (evaluate offline before
shipping), two expressions.

## Build order

- [x] 0. Scaffold: engine copied + trimmed, Echo seams, pipeline, schema, app, this plan
- [ ] 1. Engine slice runs: paste → embed → match → rank (prove via script)
- [ ] 2. `npm run seed` populates the ticket registry in Supabase (`echo` schema)
- [ ] 3. UI: paste ticket → similar tickets + resolutions  *(scaffolded)*
- [x] 4. Replay harness: `npm run replay` over the seeded corpus, real recall@k / MRR + CI gate
- [ ] 5. Grow the corpus + tune k / thresholds against replay metrics
- [ ] 6. (stretch) Interleaving two rankers; LLM-drafted "resolution, adapted to this ticket"

## Scope discipline

No auth, no ticketing-system integrations, no billing. One engine, one domain, one demo
path, one replay/eval story. Keep it legible.

## Stack

Next.js 15 (App Router) · Supabase + pgvector (HNSW), `echo` schema · HF Inference
(all-mpnet-base-v2) · Vercel.
