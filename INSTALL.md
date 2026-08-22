# Dropping this into `semantics-matching`

This zip is a **delta**, not a fresh project — it's built to sit on top of the `create-next-app`
scaffold you already have (App Router, TS, ESLint flat config, Tailwind). It does **not** include
`package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, or `.gitignore` — you
already have those; don't overwrite them.

## 1. Copy files in

Unzip and copy these folders/files into your project root, merging into what's already there:

```
app/(auth)/         → new
app/(app)/           → new
app/api/             → new
app/layout.tsx       → REPLACES your current one (see note below)
app/globals.css      → REPLACES your current one (see note below)
components/          → new
lib/                 → new
types/               → new
middleware.ts        → new, project root
supabase/            → new, project root
.env.example         → new, project root
```

**Before you overwrite `app/layout.tsx`:** your scaffold's default one likely has `next/font/google`
(Geist) setup. Open both, and paste that font import + `className` back onto `<body>` in the new one
if you want to keep it — I stripped it since I can't see your actual file.

**`app/globals.css`:** I assumed Tailwind v4 (the `@import "tailwindcss";` line), which is what
`create-next-app` ships by default now (no `tailwind.config.js`). If you're on v3, swap that line for
the classic `@tailwind base/components/utilities` trio.

## 2. Install the extra dependencies

Your `package.json` already has `next`/`react`/`eslint`/etc. Add these:

```bash
npm install @supabase/supabase-js @supabase/ssr \
  @tiptap/react @tiptap/starter-kit @tiptap/extension-underline @tiptap/extension-highlight @tiptap/pm tiptap-markdown \
  react-force-graph-2d ioredis zod date-fns
```

## 3. Env vars

Copy `.env.example` → `.env.local`, fill in your Supabase project URL / anon key / service role key.
Redis vars can stay blank for local dev — caching just no-ops without them.

## 4. Run the migrations

Run the 3 SQL files in `supabase/migrations/` against your Supabase project (SQL editor is fastest,
or `supabase db push` if you've linked the CLI).

## 5. Run it

```bash
npm run dev
```

You should land on `/login` since there's no session yet. Sign up, confirm the email (or skip that by
enabling auto-confirm in Supabase's dashboard for local testing), then you're in `/vault`.

---

Same scope as before: auth, folder/file CRUD, TipTap editor with autosave, structural linking, graph
view. Python `rag-service` (embeddings/semantic linking) still not built — that's next.
