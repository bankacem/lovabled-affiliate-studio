import { Router } from "express";
import type { RequestHandler } from "express";

const router = Router();

// The Vercel checker loses contextual types for this callback; keep the boundary explicit.
const healthCheck: RequestHandler = (_req: any, res: any): void => {
  res.json({ status: "ok" });
};

router.get("/healthz", healthCheck);

export default router;
