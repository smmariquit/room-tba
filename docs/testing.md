# Room TBA testing

Production-grade test pyramid for CI and local development.

## Commands

| Command | What |
| -------------------------------- | ------------------------------------------------------------ |
| `bun test src/lib src/constants` | Unit tests (Bun; excludes `*.store.test.ts`) |
| `bun run test:components` | Vitest store + Svelte component tests |
| `bun run test:integration` | HTTP + service tests (E2E DB; service-only without preview) |
| `bun run test:integration:live` | Same as CI: `build:e2e` → preview → integration (incl. HTTP) |
| `bun run e2e:reset-db` | Truncate + seed E2E Supabase (host + schema guard) |
| `bun run e2e` | Playwright blocking suite |
| `bun run e2e:advisory` | Playwright advisory (non-blocking in CI) |
| `bun run e2e:staging` | Live staging smoke |
| `bun run check:migrations` | Required tables exist in `E2E_SCHEMA`, else `public` |

Full local gate (before marking PR ready):

```sh
bun run lint && bun run test:all && bun run build
bun run test:integration:live   # needs E2E DB; includes HTTP against preview
bun run e2e                     # Playwright starts its own preview (~16 min first run)
```

`bun run test:integration` alone runs **service/DB tests** only when preview is offline; **HTTP suites fail fast** with instructions. Do not treat a green `test:integration` without preview as full coverage.

E2E runs `serve:e2e`, which rebuilds with `@astrojs/node` because `@astrojs/vercel` does not support `astro preview`. After the first `build:e2e`, speed up reruns with `SKIP_E2E_BUILD=1 bun run e2e`. For fast iteration on an already-running preview, set `PLAYWRIGHT_REUSE_SERVER=1`. Default Playwright workers are **2** locally (**1** in CI via `PLAYWRIGHT_WORKERS`; override either way); the full suite is heavy on one preview server (~16 min locally; ~25 min wall clock in CI).

## CI (every PR push, including drafts)

- **CI / verify**: Biome format, ESLint, unit, components, PWA legal, prod build (~5–8 min)
- **CI / migrations**: migrate a throwaway run schema on the E2E DB, then check its tables (~2 min)
- **CI / feature retirement**: a deleted `src/pages/` entry must retire or repurpose an automated spec and refresh `docs/test-inventory.md`.

## CI (gated: ready for review or `run/e2e`)

Heavy DB + preview work runs **once before merge**, not on every draft push:

- **E2E / e2e**: reset DB → `build:e2e` → preview → **integration** → Playwright blocking (~30 min total)
- **E2E advisory**: reset DB → `build:e2e` → Playwright advisory (non-blocking)
- **Bundle advisory**: prod build + JS budget (non-blocking)

**E2E staging / e2e**: same blocking stack (integration + Playwright) on every **`staging` push** and **nightly** (02:00 Asia/Manila)

## Heavy CI gating (PRs)

Integration + Playwright share one preview build in the blocking job (~30 min wall clock). **Draft pushes skip all of this.**

| Trigger | Integration + blocking E2E | Advisory E2E + bundle |
| ------------------------ | -------------------------- | --------------------- |
| **Ready for review** | Yes (first time) | Yes |
| **`run/e2e` label** | Re-run after fixes | Re-run |
| **Reopened** (non-draft) | Yes | Yes |
| **Push to ready PR** | Yes (auto, cancels the in-flight run) | No |
| **Draft push** | No | No |

**Always on every push:** verify + migrations only.

**Before merge to `staging`:** wait for **E2E / e2e** green. Every push to a non-draft PR re-runs the blocking job automatically (per-PR concurrency cancels the stale run). The `run/e2e` label still forces a run without pushing, and is the only way to re-run the advisory suite.

```sh
gh pr ready <number>
gh pr edit <number> --add-label run/e2e   # force a run without pushing (also re-runs advisory)
```

Workflows: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml), [`.github/workflows/e2e.yml`](../.github/workflows/e2e.yml), [`.github/workflows/e2e-advisory.yml`](../.github/workflows/e2e-advisory.yml), [`.github/workflows/e2e-staging.yml`](../.github/workflows/e2e-staging.yml), [`.github/workflows/bundle-advisory.yml`](../.github/workflows/bundle-advisory.yml).

### One schema per run (`E2E_SCHEMA`)

Blocking, advisory, and staging E2E all call [`e2e-reusable.yml`](../.github/workflows/e2e-reusable.yml) against the **same** Supabase project, so before #773 they reset and wrote each other's tables: sub-second flakes in DB-touching integration suites whenever two runs overlapped. Each run now gets its own Postgres schema in that project:

- The reusable workflow sets job-level `E2E_SCHEMA=e2e_<run_id>_<run_attempt>`, so reset, `build:e2e`, the preview server, integration, and Playwright all see it.
- `e2e:reset-db` creates the schema, replays **every** `drizzle/*.sql` in filename order into it (a fresh schema has no history, so nothing needs registering by hand when you add a migration), then seeds the usual fixtures.
- Every connection pins itself with `SET search_path TO <schema>` right after connect ([`scripts/e2e-schema.ts`](../scripts/e2e-schema.ts), used by [`src/lib/db.ts`](../src/lib/db.ts), the reset script, `integration/`, and `e2e/helpers/db.ts`). The Supabase **session pooler** silently ignores `?options=-csearch_path=…` in the URL and rejects node-postgres `options`, so the URL tricks do not work here.
- Teardown runs `bun run scripts/e2e-reset-db.ts --drop` under `if: always()`. Cancelled jobs that skip it are covered by the sweeper: each schema is stamped with `COMMENT ON SCHEMA … IS '<iso>'` at creation, and every reset drops stamped `e2e_*` schemas older than 24 h.
- The `CI / migrations` job builds one too (`e2e_migrations_<run_id>_<run_attempt>`) and runs `check:migrations` against it, so the cheap always-on check validates the schema CI actually produces instead of an E2E `public` nobody migrates any more (#806). `check:migrations` reads `E2E_SCHEMA` like everything else, so with it unset the release workflow still checks prod `public`.

Pinning costs one extra round trip per new connection, and several proposal-service tests already sat at bun's 5 s default while doing ~20 round trips to Supabase, so `test:integration` now runs with `--timeout 20000`. CI calls that script instead of repeating the flags.

**Contract:** `E2E_SCHEMA` unset (the local default) = today's behavior against `public`. Set = must match `^e2e_[a-z0-9_]+$`; anything else throws instead of silently falling back to `public`. Never point it at `public`, and never run `e2e:reset-db` without it while CI is live, because unset truncates the shared schema.

### Connection budget (`pool_size: 15`)

Schema isolation removed the data contention between overlapping runs, which moved the binding limit to **connections**: the E2E project's session pooler caps at `pool_size: 15`, and four heavy jobs (blocking + advisory for two PRs) used to want ~20 (#782). Read this before adding a connection anywhere in CI.

| Holder | Connections | When |
| ------------------------------------ | ----------- | ------------------------------ |
| `e2e:reset-db` | 1 | job start, seconds |
| Preview server (`DATABASE_POOL_MAX`) | up to 2 | preview up to teardown |
| `test:integration` pool | up to 2 | blocking job, integration step |
| `test:integration` per-suite client | 1 | blocking job, integration step |
| `CI / migrations` | 1 | every push, seconds |

That is **5 for a blocking job** and **2 for an advisory one** at the theoretical peak, so two PRs sit at 14 with the always-on `migrations` job taking the 15th for a few seconds. In practice the two pools in a blocking job never both sit at their max (idle connections are released after 10 s), so the real peak is lower.

Two things keep it there:

- `DATABASE_POOL_MAX` is `2` job-wide in [`e2e-reusable.yml`](../.github/workflows/e2e-reusable.yml), and `src/lib/db.ts` defaults to the same `2` under `CI`. **2 is also the floor.** A few edit-conflict paths (`updateRoom`, `updateEvent`, the merge helpers) read through the global `db` while a transaction already holds a client, so a single in-flight request can need two connections; at `1` those paths wait on themselves and the job hangs instead of failing.
- `e2e:reset-db` takes the global advisory lock **only** when resetting `public`. A run schema is the job's own, so nothing needs serializing; before #782 every concurrent job held a pooler connection while queueing behind the others' full chain replay, which is how a run died at 2m01s with `EMAXCONNSESSION` during its own reset. The stale-schema sweep still takes the lock, with `pg_try_advisory_lock`: a run that loses the race skips the sweep and the next reset picks the schemas up.

Do **not** switch to the transaction pooler (port 6543) to raise the ceiling: `SET search_path` is session state, and transaction mode hands out a different backend per transaction, so run schemas would stop being honored and tests would silently read `public`. Three PRs at once still will not fit; raise `pool_size` on the Supabase project when that becomes routine.

## CI (advisory, non-blocking)

- **E2E advisory**: axe, touch drag, offline, jeepney, etc. (gated like blocking)
- **Bundle advisory**: PWA JS size budget (gated like blocking)
- **Staging smoke**: read-only Playwright against live `staging.room-tba.uplb.tools` (non-blocking)

## Databases

| DB | Use in tests |
| ---------------------------- | -------------------------------------------------- |
| E2E (`yhzinxlakcewqjaqbbaj`) | CI build, integration, Playwright: **mutating** |
| Staging | Local dev, staging smoke: read-only in automation |
| Production | **Never** automated writes |

Set locally (gitignored: copy from `.env.example`):

```sh
cp .env.example .env.local    # bun dev + E2E vars
cp .env.example .env.staging  # optional: staging smoke / preview DB only
```

GitHub Actions uses secrets `E2E_DATABASE_URL`, `E2E_ADMIN_PASSWORD`, `E2E_ADMIN_SESSION_SECRET`.

## AMIS: never in CI

Do **not** run `import:amis-classes, fetch` in CI. The script exits when `CI=true` and `, fetch` is passed. Unit tests use fixture JSON only.

## Manual only

- Subjective visual polish
- AMIS live fetch (maintainer runbook)
- Mobile drag “feel”
- Post-deploy prod spot-check
- Contributor proposal staging QA: [contributor-proposal-qa.md](contributor-proposal-qa.md). It is read-only except for deliberately submitted throwaway proposals that are promptly withdrawn or rejected.

See also [docs/editor-foundation-test-plan.md](editor-foundation-test-plan.md) and [docs/agentic-qa-process.md](agentic-qa-process.md).

## Tests with issues

When implementing a GitHub issue, add tests in the **same PR**: do not defer. Use [issue-test-matrix.md](issue-test-matrix.md) for tier hints (unit / integration / component / E2E). Full file list: [test-inventory.md](test-inventory.md). Regenerate:

```sh
bun run generate:issue-test-matrix
bun run generate:test-inventory
```

**Discord `#test-suite`:** CI posts a pinned, auto-updated inventory (summary embed + tier embeds with full file lists) via [discord-test-inventory.yml](../.github/workflows/discord-test-inventory.yml). Local dry-run: `GATEWAY_URL=… SECRET=… bun run post:test-inventory-discord`.

Agent policy: [AGENTS.md § Tests with GitHub issues](../AGENTS.md#tests-with-github-issues).

## Retiring a feature

When removing a user-facing page, remove or repurpose its unit, component, integration, or E2E coverage in the same PR. Then run `bun run generate:test-inventory`. CI compares the PR diff and blocks a page deletion when no test and inventory update accompanies it. This prevents an obsolete feature spec from reaching `main` after its feature is gone.
