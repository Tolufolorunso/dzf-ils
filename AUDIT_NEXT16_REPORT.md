# Codebase Audit and Next.js 16.2.6 Upgrade Plan

## Scope
This audit is based on a code review of the current repository state (App Router project, Next.js 15.x, React 19.x, Mongoose backend APIs).

## Executive Summary
The project is functional and already uses modern foundations (App Router, React 19, ESLint 9). The most impactful improvements are:

1. Stabilize data consistency around circulation/cohort state transitions.
2. Reduce auth/token inconsistency and edge/runtime surprises.
3. Improve operational quality (logging, lint hygiene, migration safety).
4. Upgrade to `next@16.2.6` with a staged, low-risk rollout.

---

## 1. Improvements That Can Be Made

## 1.1 High Priority

### A. Unify authentication token handling
- Current issue:
  - `middleware.js` expects cookie value string (`token`), verified with `jose`.
  - `src/lib/auth.js` uses `cookies()` but assigns `cookieToken` object, then uses `token?.value` while `token` may be bearer string.
- Impact:
  - Inconsistent behavior and hard-to-debug auth failures across API/web flows.
- Improvement:
  - Normalize extraction to a plain token string in one helper and reuse across middleware/server routes.
  - Use one JWT library strategy where possible (`jose` or `jsonwebtoken`) consistently.

### B. Make DB connection + index migration robust
- Current issue:
  - `dbConnect` uses module-level `isConnected` boolean only; better to leverage `mongoose.connection.readyState` and cached connection promises.
  - Runtime index operations in API route are useful but should be hardened.
- Impact:
  - Potential race conditions in serverless/edge-like runtime patterns; migration logic can be repeated across cold starts.
- Improvement:
  - Adopt standard cached connection pattern (`global.mongoose` cache).
  - Move index migration into explicit one-time script for production deploys; keep defensive fallback in route if needed.

### C. Strengthen circulation transaction integrity
- Current issue:
  - Check-in/check-out updates cross multiple documents and arrays.
- Impact:
  - Partial writes possible if one save succeeds and another fails.
- Improvement:
  - Use MongoDB transactions (`session.withTransaction`) for circulation operations.
  - Add post-condition checks in response (e.g., returned flags and active-loan state).

### D. Fix production logging hygiene
- Current issue:
  - Several `console.log` debug statements remain in API/UI paths.
- Impact:
  - Noisy logs, possible data leakage, harder incident response.
- Improvement:
  - Replace with structured logger utility (`info/warn/error`, env-based levels).
  - Remove development debug logs from server routes.

## 1.2 Medium Priority

### E. Clean up lint debt and hook dependency warnings
- Current issue:
  - Multiple `react-hooks/exhaustive-deps` warnings and disable comments.
- Impact:
  - Risk of stale closures and subtle UI bugs.
- Improvement:
  - Resolve warnings page by page.
  - Introduce small conventions: `useCallback` for fetchers, avoid disabling rules unless justified.

### F. Improve API consistency and validation
- Current issue:
  - Repeated manual validation patterns across routes.
- Impact:
  - Inconsistent error shapes and duplicated logic.
- Improvement:
  - Use schema validation (e.g., Zod) for request bodies and response envelopes.
  - Standardize `{ status, message, data, errorCode }` contract.

### G. Cohort model and operations hardening
- Current issue:
  - Cohort operations now support multi-cohort by `barcode + cohortType` uniqueness (good), but move/remove flows may still assume single-record behavior by barcode.
- Impact:
  - Ambiguity when same barcode exists in multiple cohorts.
- Improvement:
  - Require `cohortType` in remove/move operations where ambiguity exists.
  - Add explicit endpoints for add-to-cohort vs move-within-cohort semantics.

## 1.3 Low Priority

### H. UTF/encoding cleanup
- Current issue:
  - Some garbled characters appear in comments/messages.
- Impact:
  - Professional polish/readability.
- Improvement:
  - Normalize file encoding to UTF-8 and remove corrupted symbols.

### I. Documentation and runbooks
- Add:
  - Operational runbook for competition controls and circulation recovery.
  - Migration runbook (indexes, rollbacks, smoke tests).

---

## 2. Upgrade Plan to Next.js 16.2.6

## 2.1 Current baseline
- `next`: `15.5.9`
- `react`: `19.1.0`
- `react-dom`: `19.1.0`
- `eslint-config-next`: `15.5.4`

## 2.2 Target
- `next`: `16.2.6`
- Align `eslint-config-next` with `16.2.6`
- Keep React versions compatible with Next 16 requirements.

## 2.3 Recommended staged path

### Phase 0: Pre-upgrade safety
1. Create upgrade branch.
2. Run baseline checks:
   - `npm run lint`
   - `npm run build`
   - key manual smoke tests:
     - auth login/logout
     - circulation check-out/check-in
     - cohorts add/remove/move
     - competition controls + reading page forms
3. Capture current behavior screenshots for critical pages.

### Phase 1: Dependency upgrade
1. Update packages:
   - `next` -> `16.2.6`
   - `eslint-config-next` -> `16.2.6`
2. Reinstall lockfile.
3. Confirm Node runtime requirement for Next 16 and update runtime/hosting if needed.

### Phase 2: Config and build fixes
1. Validate `next.config.mjs` compatibility.
2. Resolve build warnings/errors introduced by Next 16.
3. Re-check middleware behavior (matcher/auth redirects/API responses).

### Phase 3: Runtime regression testing
Focus areas likely to break on major upgrade:
1. Middleware auth flow
   - cookie parsing
   - API 401 vs redirect behavior
2. App Router server/client boundaries
   - `use client` pages
   - fetch usage in client components
3. File upload/image flows
   - avatar/photo upload pages
4. API routes with Mongoose
   - connection reuse
   - error handling and status codes

### Phase 4: Hardening after successful upgrade
1. Remove deprecated APIs/warnings surfaced by Next 16.
2. Tighten lint rules and clear remaining warnings.
3. Publish migration notes and rollback strategy.

## 2.4 Specific changes to plan for

### A. ESLint alignment
- Upgrade `eslint-config-next` to match Next major/minor.
- Re-run lint and resolve newly enforced rules.

### B. Middleware + auth normalization
- Before/after upgrade, normalize token handling to avoid false negatives introduced by runtime differences.

### C. Turbopack behavior
- You already use Turbopack in `dev` and `build` scripts.
- Keep a fallback path (`next build` without `--turbopack`) during upgrade debugging.

### D. Image optimization warnings
- Existing warnings around `<img>` can be migrated to `next/image` where applicable.

## 2.5 Rollback strategy
1. Tag pre-upgrade commit.
2. Keep lockfile snapshot.
3. If production issues occur:
   - rollback to tag
   - restore lockfile
   - redeploy

---

## 3. Suggested Implementation Order (Practical)

1. Auth token normalization (highest reliability gain).
2. Mongoose connection/cache hardening.
3. Next.js 16.2.6 dependency upgrade + lint config alignment.
4. Regression test critical business flows.
5. Lint warning cleanup and logging cleanup.
6. API validation standardization (Zod) as iterative refactor.

---

## 4. Quick Checklist

- [ ] Upgrade `next` and `eslint-config-next` to `16.2.6`
- [ ] Verify Node runtime requirement and hosting config
- [ ] Run `lint` + `build`
- [ ] Validate middleware auth flows
- [ ] Validate circulation and cohort workflows
- [ ] Validate competition control gating from admin dashboard
- [ ] Remove debug logs and fix hook dependency warnings

---

## Notes
- The cohort duplicate key error (`barcode_1`) came from legacy DB index state, not only model code.
- Competition check-in/check-out controls should remain API-enforced; UI disabling is convenience, API is source of truth.
