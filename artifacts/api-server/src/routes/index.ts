import { Router } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import designsRouter from "./designs.js";
import blogRouter from "./blog.js";
import storesRouter from "./stores.js";
import analyticsRouter from "./analytics.js";
import seoRouter from "./seo.js";
import aiRouter from "./ai.js";
import ebooksRouter from "./ebooks.js";
import sitemapRouter from "./sitemap.js";
import githubContentRouter from "./githubContent.js";

const router = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(designsRouter);
router.use(blogRouter);
router.use(storesRouter);
router.use(analyticsRouter);
router.use(seoRouter);
router.use(aiRouter);
router.use(ebooksRouter);
router.use(sitemapRouter);
router.use(githubContentRouter);

export default router;
