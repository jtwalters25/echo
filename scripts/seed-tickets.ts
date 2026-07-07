/**
 * Seed the registry: embed every resolved ticket and upsert it.
 * Run once after schema.sql:  npm run seed
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { embedText } from "@/engine/embed";
import { upsertEntries } from "@/engine/store";
import { SEED_TICKETS, REGISTRY_VERSION } from "@/domain/echo/tickets";
import { ticketText } from "@/domain/echo/segmenter";
import type { RegistryEntry } from "@/engine/types";

async function main() {
  const entries: RegistryEntry[] = [];
  for (const t of SEED_TICKETS) {
    process.stdout.write(`embedding ${t.id}… `);
    const content = ticketText(t.title, t.body);
    const vector = await embedText(content);
    entries.push({
      id: t.id,
      content,
      vector,
      label: t.resolutionId,
      meta: { title: t.title, resolutionId: t.resolutionId },
      registryVersion: REGISTRY_VERSION,
    });
    console.log("ok");
  }
  await upsertEntries(entries);
  console.log(`\nseeded ${entries.length} tickets @ ${REGISTRY_VERSION}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
