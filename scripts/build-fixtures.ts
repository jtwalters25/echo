/**
 * Precompute demo fixtures: run the real search() pipeline over every curated
 * example and snapshot the result to src/domain/echo/fixtures.json.
 *
 * The public demo serves these instantly for the example chips — cold-start-proof
 * and zero API cost — while still being genuine engine output. Re-run whenever the
 * examples, corpus, or model change:  npm run fixtures
 *
 * Requires the registry to be seeded first (npm run seed).
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { writeFileSync } from "fs";
import { join } from "path";
import { search } from "@/domain/echo/pipeline";
import { EXAMPLES } from "@/domain/echo/examples";
import type { EchoResult } from "@/domain/echo/rank";

async function main() {
  const fixtures: Record<string, EchoResult> = {};
  for (const ex of EXAMPLES) {
    process.stdout.write(`searching "${ex.title}"… `);
    const result = await search(ex.title, ex.body);
    fixtures[ex.id] = result;
    const match = result.confidence === ex.expected ? "✓" : `(got ${result.confidence}, hinted ${ex.expected})`;
    console.log(`${result.confidence} ${match}`);
  }
  const out = join(process.cwd(), "src/domain/echo/fixtures.json");
  writeFileSync(out, JSON.stringify(fixtures, null, 2) + "\n");
  console.log(`\nwrote ${Object.keys(fixtures).length} fixtures → ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
