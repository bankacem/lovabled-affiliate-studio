import { spawnSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  console.log("DATABASE_URL is not set; skipping database bootstrap.");
  process.exit(0);
}

const sql = `
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
`;

const script = `
  import pg from "pg";
  const { Pool } = pg;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.query(${JSON.stringify(sql)});
    console.log("The designs table is ready.");
  } finally {
    await pool.end();
  }
`;

console.log("DATABASE_URL detected; ensuring the designs table exists.");
const result = spawnSync(
  "pnpm",
  [
    "--filter",
    "@workspace/db",
    "exec",
    "node",
    "--input-type=module",
    "-e",
    script,
  ],
  {
    cwd: new URL("..", import.meta.url),
    stdio: "inherit",
    env: process.env,
  },
);

if (result.error) {
  throw result.error;
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
