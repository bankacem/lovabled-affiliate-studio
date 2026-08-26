import express, { type Express } from "express";
import cors from "cors";
import { pinoHttp } from "pino-http";
import { db, sql } from "@workspace/db";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

const app: Express = express();

let designsSchemaPromise: Promise<void> | undefined;

function ensureDesignsTable(): Promise<void> {
  designsSchemaPromise ??= db
    .execute(sql`
      CREATE TABLE IF NOT EXISTS designs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        description text,
        image_url text NOT NULL,
        category text NOT NULL DEFAULT 'T-Shirts',
        tags text[] DEFAULT ARRAY[]::text[],
        teepublic_url text,
        redbubble_url text,
        amazon_url text,
        etsy_url text,
        featured boolean DEFAULT false,
        source text,
        external_id text UNIQUE,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      )
    `)
    .then(() => undefined)
    .catch((error) => {
      designsSchemaPromise = undefined;
      throw error;
    });

  return designsSchemaPromise;
}

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/designs", async (_req, _res, next) => {
  try {
    await ensureDesignsTable();
    next();
  } catch (error) {
    next(error);
  }
});

app.use("/api", router);

export default app;
