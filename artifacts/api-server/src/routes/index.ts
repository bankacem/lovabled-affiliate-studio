import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import designsRouter from "./designs";
import blogRouter from "./blog";
import storesRouter from "./stores";
import analyticsRouter from "./analytics";
import seoRouter from "./seo";
import aiRouter from "./ai";
import ebooksRouter from "./ebooks";
import sitemapRouter from "./sitemap";

const router: IRouter = Router();

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

export default router;
