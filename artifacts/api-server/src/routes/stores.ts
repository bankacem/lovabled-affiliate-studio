import { Router, type Request, type Response } from "express";
import { db, storesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middleware/requireAuth.js";
import { getParam } from "../lib/params.js";

const router = Router();

router.get("/stores", async (_req: Request, res: Response) => {
  const stores = await db.select().from(storesTable);
  res.json(stores);
});

router.post("/stores", requireAdmin, async (req: Request, res: Response) => {
  const [store] = await db.insert(storesTable).values(req.body).returning();
  res.status(201).json(store);
});

router.delete("/stores/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = getParam(req, "id");
  await db.delete(storesTable).where(eq(storesTable.id, id));
  res.status(204).end();
});

export default router;
