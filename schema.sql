-- Echo — Supabase schema (pgvector + HNSW)
--
-- Echo shares a Supabase PROJECT with other apps (Provenance, Clause) but lives
-- in its own `echo` schema, so its tables can never collide with theirs and the
-- whole app tears down with `drop schema echo cascade`.
--
-- Setup:
--   1. `vector` extension is already enabled at the project level — nothing to do.
--   2. Run this file in the Supabase SQL editor.
--   3. Dashboard → Settings → API → "Exposed schemas": add `echo`.

create schema if not exists echo;
create extension if not exists vector;  -- no-op if already installed project-wide

-- Resolved tickets we rank incoming tickets against. label = resolution group id.
create table if not exists echo.registry (
  id                text primary key,
  content           text not null,               -- embedded text (title+body)
  embedding         vector(768) not null,        -- all-mpnet-base-v2 = 768 dims
  label             text not null,               -- resolutionId (root-cause group)
  meta              jsonb not null default '{}',  -- { title, resolutionId }
  registry_version  text not null,
  created_at        timestamptz not null default now()
);

create index if not exists registry_embedding_hnsw
  on echo.registry using hnsw (embedding vector_cosine_ops);

create index if not exists registry_version_idx on echo.registry (registry_version);

-- kNN RPC: nearest past tickets to a query embedding, within a snapshot.
create or replace function echo.match_entries(
  query_embedding vector(768),
  match_count int,
  reg_version text
)
returns table (
  id text,
  content text,
  label text,
  meta jsonb,
  registry_version text,
  similarity float
)
language sql stable as $$
  select
    r.id, r.content, r.label, r.meta, r.registry_version,
    1 - (r.embedding <=> query_embedding) as similarity   -- cosine similarity
  from echo.registry r
  where r.registry_version = reg_version
  order by r.embedding <=> query_embedding
  limit match_count;
$$;

grant usage on schema echo to anon, authenticated, service_role;
grant all on all tables in schema echo to service_role;
grant execute on all functions in schema echo to anon, authenticated, service_role;
