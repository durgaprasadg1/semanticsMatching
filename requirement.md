# Requirements & Project Setup — "NoteGraph"

Companion doc to `plan-prd.md`. This is the checklist you go through **before** writing a single line of
backend code — accounts, keys, folder layout, dependencies. Get this right first; re-plumbing env vars
and folder structure mid-build is a waste of your time.

---

## 1. Repo Structure (Monorepo)

Two runtimes (Node + Python) in one repo, kept as separate top-level apps. Not a strict Turborepo/Nx
setup for MVP — that's over-engineering at this stage — just a clean two-folder split with shared docs
at the root.

```
notegraph/
├── plan-prd.md
├── requirement.md
├── docker-compose.yml              # local Redis + (optional) local Postgres for dev
├── .gitignore
│
├── web/                             # Next.js app (frontend + BFF API routes)
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── .env.local                   # gitignored — real secrets
│   ├── .env.example                 # committed — key names only, no values
│   │
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                          # landing / redirect to app
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── callback/route.ts             # OAuth redirect handler
│   │   ├── (app)/                            # authenticated area
│   │   │   ├── layout.tsx                    # nav shell (file tree + graph nav item)
│   │   │   ├── vault/
│   │   │   │   ├── page.tsx                  # default/empty editor state
│   │   │   │   └── [fileId]/page.tsx         # editor for a specific file
│   │   │   └── graph/page.tsx                # graph view
│   │   └── api/
│   │       ├── folders/route.ts
│   │       ├── folders/[id]/route.ts
│   │       ├── files/route.ts
│   │       ├── files/[id]/route.ts
│   │       ├── graph/route.ts
│   │       └── search/route.ts
│   │
│   ├── components/
│   │   ├── editor/
│   │   │   ├── TipTapEditor.tsx
│   │   │   ├── EditorToolbar.tsx             # bold/italic/underline/highlight buttons
│   │   │   └── markdownSerializer.ts
│   │   ├── file-tree/
│   │   │   ├── FileTree.tsx
│   │   │   ├── FolderNode.tsx
│   │   │   └── FileNode.tsx
│   │   ├── graph/
│   │   │   ├── GraphView.tsx
│   │   │   └── graphTransform.ts             # DB rows -> nodes/edges shape
│   │   └── ui/                               # generic buttons, modals, inputs
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                     # browser client
│   │   │   ├── server.ts                     # server component / route handler client
│   │   │   └── middleware.ts                 # session refresh middleware
│   │   ├── redis/
│   │   │   └── client.ts                     # ioredis / Upstash client
│   │   ├── queue/
│   │   │   └── embedQueue.ts                 # BullMQ producer (enqueue reembed jobs)
│   │   └── validation/
│   │       └── schemas.ts                    # zod schemas for API payloads
│   │
│   ├── middleware.ts                          # Next.js middleware — session refresh, route protection
│   └── types/
│       └── db.ts                              # generated Supabase types
│
├── rag-service/                     # Python FastAPI service (embeddings + linking)
│   ├── pyproject.toml               # or requirements.txt
│   ├── .env                         # gitignored
│   ├── .env.example
│   ├── Dockerfile
│   │
│   ├── app/
│   │   ├── main.py                          # FastAPI app entrypoint
│   │   ├── config.py                        # env/settings via pydantic-settings
│   │   ├── db.py                            # Postgres/pgvector connection
│   │   ├── models.py                        # pydantic request/response models
│   │   ├── embeddings/
│   │   │   ├── chunker.py                   # text chunking logic
│   │   │   └── embedder.py                  # sentence-transformers wrapper
│   │   ├── linking/
│   │   │   └── similarity.py                # cosine similarity search + link writer
│   │   ├── queue/
│   │   │   └── worker.py                    # consumes embed jobs from Redis queue
│   │   └── routes/
│   │       └── internal.py                  # POST /internal/embed (manual trigger / debug)
│   │
│   └── tests/
│       ├── test_chunker.py
│       └── test_similarity.py
│
└── supabase/                        # Supabase project config (tracked in git)
    ├── migrations/
    │   ├── 0001_init_folders_files.sql
    │   ├── 0002_pgvector_setup.sql
    │   └── 0003_file_links.sql
    └── config.toml                  # Supabase CLI config (for local dev + migrations)
```

---

## 2. Accounts & External Services to Set Up

Do these first — nothing else can be tested locally without them.

| # | Service | What it's for | Free tier OK for MVP? |
|---|---|---|---|
| 1 | **Supabase project** | Auth, Postgres, pgvector, RLS | Yes |
| 2 | **Google Cloud Console** OAuth client | "Sign in with Google" | Yes |
| 3 | **GitHub OAuth App** | "Sign in with GitHub" | Yes |
| 4 | **Upstash Redis** (or any managed Redis) | Caching + BullMQ job queue | Yes (Upstash free tier) |
| 5 | **Vercel account** | Hosting the Next.js app | Yes |
| 6 | **Render / Fly.io / Railway account** | Hosting the Python FastAPI service | Yes (small instance) |
| 7 | **GitHub repo** | Source control, CI | — |

No paid LLM/embedding API keys are required — embeddings are self-hosted via `sentence-transformers`,
per the earlier decision. If you later swap to a hosted embedding API, add that key then.

---

## 3. API Keys / Environment Variables

### 3.1 `web/.env.local` (Next.js)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=              # from Supabase project settings
NEXT_PUBLIC_SUPABASE_ANON_KEY=         # public/anon key — safe for client
SUPABASE_SERVICE_ROLE_KEY=             # server-only, NEVER exposed to client — used only in route handlers/admin tasks

# OAuth (configured in Supabase dashboard, but app needs redirect awareness)
NEXT_PUBLIC_SITE_URL=http://localhost:3000   # used for OAuth redirect callback

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
# or, if using a standard Redis connection string instead of Upstash REST:
REDIS_URL=redis://...

# Internal service-to-service
RAG_SERVICE_URL=http://localhost:8000        # Python service base URL (internal network in prod)
RAG_SERVICE_INTERNAL_SECRET=                 # shared secret so only Next.js can call internal RAG endpoints
```

> **Note on OAuth:** Google/GitHub client ID + secret are entered into the **Supabase Auth dashboard**
> (Authentication → Providers), not directly into the Next.js app. Next.js only needs to know the site
> URL for redirects. This keeps OAuth secrets out of app code entirely.

### 3.2 `rag-service/.env` (Python)

```bash
# Direct Postgres connection (for pgvector reads/writes — bypasses Supabase client SDK)
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres

# Alternatively, if using Supabase client instead of raw psycopg2:
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=             # RAG service needs elevated access to write embeddings/links across the job, RLS bypassed via service role

# Redis (same instance as Next.js, for consuming the job queue)
REDIS_URL=redis://...

# Embedding model config
EMBEDDING_MODEL_NAME=all-MiniLM-L6-v2
EMBEDDING_DIM=384

# Security
RAG_SERVICE_INTERNAL_SECRET=            # must match the value in web/.env.local
```

### 3.3 Supabase dashboard configuration (not code, but required setup)

- Enable the **pgvector** extension (Database → Extensions → `vector`).
- Authentication → Providers → enable **Google** and **GitHub**, paste their client ID/secret.
- Authentication → URL Configuration → set the redirect URL to `http://localhost:3000/callback` (dev)
  and the production domain later.
- Run the migrations in `supabase/migrations/` (via `supabase db push` or the SQL editor) to create
  `folders`, `files`, `file_embeddings`, `file_links` and their RLS policies.

---

## 4. Package Dependencies

### 4.1 `web/package.json` — key dependencies

```jsonc
{
  "dependencies": {
    "next": "^15.x",
    "react": "^19.x",
    "react-dom": "^19.x",

    // Supabase
    "@supabase/supabase-js": "^2.x",
    "@supabase/ssr": "^0.x",              // SSR-safe session helpers for Next.js App Router

    // Editor
    "@tiptap/react": "^2.x",
    "@tiptap/starter-kit": "^2.x",
    "@tiptap/extension-underline": "^2.x",
    "@tiptap/extension-highlight": "^2.x",
    "tiptap-markdown": "^0.x",            // TipTap JSON <-> Markdown serialization

    // Graph
    "react-force-graph-2d": "^1.x",

    // Caching / queue
    "ioredis": "^5.x",                    // if using raw Redis rather than Upstash REST SDK
    "@upstash/redis": "^1.x",             // if using Upstash REST client instead
    "bullmq": "^5.x",

    // Validation
    "zod": "^3.x",

    // Utility
    "date-fns": "^3.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "eslint": "^9.x",
    "eslint-config-next": "^15.x",
    "prettier": "^3.x",
    "@types/node": "^20.x",
    "@types/react": "^19.x"
  }
}
```

### 4.2 `rag-service/pyproject.toml` (or `requirements.txt`) — key dependencies

```
fastapi>=0.115
uvicorn[standard]>=0.30
pydantic>=2.9
pydantic-settings>=2.5

# Embeddings
sentence-transformers>=3.1
torch>=2.4                     # CPU build is sufficient for MVP

# DB
psycopg2-binary>=2.9           # or asyncpg if going fully async
pgvector>=0.3                  # python client for pgvector type handling
supabase>=2.7                  # optional, if calling Supabase via its Python client instead of raw SQL

# Queue (consuming BullMQ-compatible jobs from Redis)
redis>=5.0

# Dev/test
pytest>=8.3
httpx>=0.27                    # for testing FastAPI endpoints
```

> **Note:** BullMQ is a Node-native queue library. Since jobs are *produced* from Next.js (`bullmq`) and
> *consumed* from Python, the Python side needs to speak BullMQ's Redis job format directly (BullMQ's
> job data is just structured Redis keys/streams) — either via a small compatible consumer, or by using
> a simpler custom Redis list/stream as the queue instead of full BullMQ if cross-language compatibility
> becomes annoying. **Flag this as a decision to revisit once you're actually wiring up M4** — the
> pragmatic MVP choice may be a plain Redis Stream (`XADD`/`XREADGROUP`) that both Node and Python can
> speak natively, rather than BullMQ's Node-specific job format.

---

## 5. Local Dev Environment

- **Node.js** version: 20.x LTS (match whatever Next.js 15 requires).
- **Python** version: 3.11+ (sentence-transformers/torch compatibility).
- **Docker** (optional but recommended): `docker-compose.yml` for local Redis, so you're not hitting
  Upstash for every dev cycle.
- **Supabase CLI**: for running migrations and optionally a local Supabase stack (`supabase start`) —
  saves you from making schema changes directly against production during development.

```yaml
# docker-compose.yml (local dev only)
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

---

## 6. Deployment Targets

| Component | Where | Notes |
|---|---|---|
| Next.js app | Vercel | Native fit, zero-config for App Router |
| Python RAG service | Render / Fly.io / Railway | Needs a persistent process (worker + API), not a serverless function — sentence-transformers model load time makes cold starts expensive |
| Postgres + pgvector | Supabase (managed) | No separate hosting needed |
| Redis | Upstash | Serverless-friendly, works from both Vercel and the Python service |

---

## 7. What I Need From You Before Backend Build Starts

When you give the go-ahead, have these ready (or tell me to stub them for local dev):

1. Supabase project URL + anon key + service role key
2. Google OAuth client ID/secret, GitHub OAuth client ID/secret (or say "skip OAuth for now, email/pass only")
3. Upstash Redis URL/token (or confirm local Docker Redis is fine for now)
4. Confirmation on the BullMQ-vs-Redis-Streams call from §4.2 — I'd default to **Redis Streams** for
   cross-language simplicity unless you have a strong reason to keep BullMQ

Once you give the command, I'll scaffold `web/` and `rag-service/` per the structure above, wire up the
Supabase migrations, and get the file CRUD + editor save path working end-to-end before layering in RAG.
