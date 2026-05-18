import { Router } from "express";
import { db, storesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/stores", async (_req, res) => {
  const stores = await db.select().from(storesTable);
  res.json(stores);
});

router.post("/stores", async (req, res) => {
  const [store] = await db.insert(storesTable).values(req.body).returning();
  res.status(201).json(store);
});

router.delete("/stores/:id", async (req, res) => {
  await db.delete(storesTable).where(eq(storesTable.id, req.params.id));
  res.status(204).end();
});

export default router;
