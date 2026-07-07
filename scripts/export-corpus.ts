/**
 * Export the embedded corpus to a committed fixture — `npm run export-corpus`
 *
 * Pulls the seeded registry (vectors included) out of Supabase and writes it to
 * src/domain/echo/corpus.fixture.json. Replay then runs entirely from this file,
 * so it works in CI with no Supabase/HF secrets. Re-run whenever the corpus or
 * embedding model changes.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { writeFileSync } from "fs";
import { join } from "path";
import { loadCorpus } from "@/engine/store";
import { REGISTRY_VERSION } from "@/domain/echo/tickets";

async function main() {
  const corpus = await loadCorpus(REGISTRY_VERSION);
  if (corpus.length === 0) {
    console.error(`no corpus for ${REGISTRY_VERSION} — run \`npm run seed\` first.`);
    process.exit(1);
  }
  const out = join(process.cwd(), "src/domain/echo/corpus.fixture.json");
  writeFileSync(out, JSON.stringify({ registryVersion: REGISTRY_VERSION, entries: corpus }, null, 2) + "\n");
  console.log(`exported ${corpus.length} embedded tickets → ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
