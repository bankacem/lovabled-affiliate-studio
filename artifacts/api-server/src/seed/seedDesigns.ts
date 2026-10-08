import { db, designsTable, sql } from "@workspace/db";
import { logger } from "../lib/logger.js";
import { SEED_DESIGNS } from "./designs.js";

let seedPromise: Promise<void> | undefined;

/**
 * One-time seed: if the designs table is empty, insert the bundled
 * BANKACEM.STORE catalogue (152 Redbubble designs). Safe to run on every
 * cold start — the count check makes it a no-op after the first seed, and
 * ON CONFLICT DO NOTHING guards against concurrent inserts.
 */
export function seedDesignsIfEmpty(): Promise<void> {
  seedPromise ??= (async () => {
    try {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(designsTable);
      if (Number(count) > 0) return;

      logger.info({ designs: SEED_DESIGNS.length }, "Seeding designs catalogue");
      await db
        .insert(designsTable)
        .values(SEED_DESIGNS)
        .onConflictDoNothing({ target: designsTable.external_id });
      logger.info("Designs catalogue seeded");
    } catch (error) {
      seedPromise = undefined;
      throw error;
    }
  })();

  return seedPromise;
}
