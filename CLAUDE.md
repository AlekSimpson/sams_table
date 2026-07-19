## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

## 5. Project Overview

**Sam's Table** is a D&D virtual tabletop (VTT). A Dungeon Master runs a session; players join their campaign, control characters, and participate in combat. The app supports real-time map editing, initiative tracking, HP updates, and dice rolls — all synced over WebSocket.

Two user roles:
- **DM** — creates campaigns, places map tiles, controls initiative, manages visibility
- **Player** — joins a campaign via character, views the map, tracks their own character sheet

## 6. Architecture

```
sams_table/
├── backend/          # Deno + vanilla TypeScript API server (blank scaffold, being rewritten from scratch)
│   └── main.ts       # Deno.serve hello-world entrypoint
│
└── frontend/         # React + TypeScript SPA (built/run via Deno)
    └── src/
        ├── models/       # Zustand stores — raw state only
        ├── viewmodels/   # Business logic — only layer that calls models + REST
        ├── views/        # React components — import viewmodels only
        ├── types/        # TypeScript type definitions
        └── util/         # rest_client, websockets, dnd_rules helpers
```

## 7. Backend Conventions (Deno + TypeScript)

The backend is currently a blank `Deno.serve` hello-world scaffold (`backend/main.ts`) pending a full rewrite. No conventions are established yet — this section will be filled in once the rewrite defines them.

## 8. Frontend Conventions (TypeScript/React)

**Naming:** `snake_case` for file names, functions, variables, and exported hooks. `PascalCase` for TypeScript types and interfaces only.

**Strict MVVM layering — enforced by convention:**
1. `types/` — plain TypeScript interfaces/types (`PascalCase`), no logic
2. `models/` — Zustand stores, raw state + setters only. Views must NOT import models directly.
3. `util/` — REST client (`rest_client.ts`), WebSocket client, pure helpers
4. `viewmodels/` — business logic. Calls models and `util/`. Exposes clean state/callbacks to views.
5. `views/` — React components. Import only from `viewmodels/`. No direct fetch calls, no model imports.

**State management:** Zustand with `persist` middleware for session (stored as `'sams-table-session'` in localStorage).

**REST client:** `util/rest_client.ts` — all API calls go through the `request<T>()` helper. Add new API groups as named export objects (e.g., `export const foo_api = { ... }`).

**Routing:** react-router-dom v6. Auth guards are `RequireAuth`, `RequireDM`, `RequirePlayer` components in `App.tsx`. Add new routes there.

**3D rendering:** Three.js via `@react-three/fiber` and `@react-three/drei`. Used for the map view (tiles, tokens, grid).

**`todo_views/`:** Work-in-progress views not yet wired into routing. These are stubs — don't treat them as reference for completed patterns.

**Key dependencies:**
- Build: Vite (run via Deno) + TypeScript
- State: Zustand
- Routing: react-router-dom v6
- 3D: three.js, @react-three/fiber, @react-three/drei

## 9. Running Locally

```bash
# Full stack via Docker Compose (requires .env with DB_PASSWORD and JWT_SECRET)
docker compose up

# Backend only
cd backend && deno task dev

# Frontend dev server (proxies /api to localhost:8080 via vite config)
cd frontend && deno install && deno task dev

# Type-check frontend without building
cd frontend && deno task typecheck
```

Required `.env` variables at repo root:
- `DB_PASSWORD` — Postgres password
- `JWT_SECRET` — secret for JWT signing

## 10. Data Model Quick Reference

| Table | Key fields |
|---|---|
| `users` | `id`, `username`, `password_hash` |
| `campaigns` | `id`, `name`, `dm_id` (FK users) |
| `characters` | `id`, `campaign_id`, `player_id`, `class`, `race`, `level`, `stats` (JSONB), `conditions` (TEXT[]) |
| `maps` | `id`, `campaign_id`, `grid_width`, `grid_height` |
| `map_tiles` | `id`, `map_id`, `asset_id`, `asset_source`, `grid_x/y/z`, `rotation_y` |
| `uploaded_assets` | `id`, `campaign_id`, `uploaded_by`, `storage_path`, `asset_type` |
| `sessions` | `id`, `campaign_id`, `active_map_id`, `started_at`, `ended_at` |

All primary keys are UUIDs. Character stats are stored as JSONB with keys `str`, `dex`, `con`, `int`, `wis`, `cha`.
