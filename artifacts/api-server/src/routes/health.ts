import { Router, type RequestHandler } from "express";

const router = Router();

const healthCheck: RequestHandler = (_req, res) => {
  res.json({ status: "ok" });
};

router.get("/healthz", healthCheck);

export default router;
