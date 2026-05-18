# AIPrintVerse

AI-powered print-on-demand design store and blog platform with ebook/PDF book generation.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/app run dev` — run the frontend (port from $PORT)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Optional env: `OPENROUTER_API_KEY`, `OPENAI_API_KEY`, `GROQ_API_KEY`, `UNSPLASH_ACCESS_KEY`
- `JWT_SECRET` — secret for signing auth tokens (defaults to dev value; set in production)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 18, Vite, Tailwind CSS v3, shadcn/ui
- API: Express 5, mounted at `/api`
- DB: PostgreSQL + Drizzle ORM
- Auth: Custom JWT (bcryptjs + jsonwebtoken), stored in localStorage
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec → @workspace/api-client-react)
- Build: esbuild (CJS bundle)
- Fonts: Playfair Display (headings), Inter (body)
- Primary color: coral (HSL 0 76% 65%)

## Where things live

- `lib/db/src/schema/` — all Drizzle schema files (designs, auth, stores, blog, analytics, seo_templates, ebooks)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contracts)
- `lib/api-client-react/src/generated/` — auto-generated React Query hooks (do not edit manually)
- `artifacts/api-server/src/routes/` — Express route handlers (auth, blog, designs, stores, analytics, seo, ai, ebooks, sitemap)
- `artifacts/app/src/` — React frontend
- `artifacts/app/src/integrations/supabase/client.ts` — Supabase compatibility shim (wraps our API)
- `artifacts/app/src/contexts/AuthContext.tsx` — Auth context (JWT-based)
- `artifacts/app/tailwind.config.ts` — Tailwind v3 config with all custom colors/tokens
- `artifacts/app/vite.config.ts` — Vite config; proxies `/api` → localhost:8080

## Architecture decisions

- Supabase replaced entirely: auth is custom JWT (bcryptjs), DB is Drizzle/Postgres, edge functions → Express routes
- A compatibility shim at `supabase/client.ts` wraps the new API so legacy admin components continue working without a full rewrite
- All AI features (article generation, SEO analytics, SERP analysis) are server-side Express routes calling OpenRouter/OpenAI/Groq
- Ebook system: blog posts tagged `ebook_ready=true` can be assembled into PDF ebooks; chapters are stored in `ebook_chapters` table
- Auth tokens stored in localStorage, passed via `Authorization: Bearer` header to API

## Product

- Public store: browse AI-curated print-on-demand designs (T-shirts, mugs, stickers) linking to TeePublic/Redbubble
- Blog: SEO-optimized articles with auto-linking, internal linking, and programmatic generation
- Admin panel: full content management, AI article generation, bulk import, analytics dashboard, ebook builder
- Ebook generator: compile blog posts into downloadable PDF/EPUB books; future KDP/Gumroad/Lulu integration

## User preferences

- Keep Supabase shim working — do not break existing admin components
- Original Lovable.dev design preserved (coral primary color, Playfair Display headings)
- AI providers priority: OpenRouter → Groq → OpenAI (configurable per request)

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after any openapi.yaml change
- Run `pnpm --filter @workspace/db run push` after schema changes
- Tailwind is v3 (postcss plugin pattern) — do NOT use `@tailwindcss/vite` plugin
- The Supabase shim is a best-effort compatibility layer; admin components that use complex Supabase-specific features may need individual migration
- API server port is 8080 in dev; frontend proxies `/api` → port 8080 via Vite proxy
- esbuild is a devDependency of api-server — do not remove it

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
