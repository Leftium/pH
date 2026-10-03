# PR Plan

Issue: #1

## Goal

Move pH from the SvelteKit 3 prerelease packages to stable SvelteKit 3 while preserving application behavior, ReScript integration, and the static deployment model.

Use this PR as the first real Continuum 0.3 implementation run in pH.

## Scope

- Replace `@sveltejs/kit ^3.0.0-next.0` and `@sveltejs/adapter-static ^4.0.0-next.4` with stable Kit 3-compatible releases.
- Review the rest of the Svelte/SvelteKit/Vite/TypeScript toolchain for only the compatibility changes required by the stable migration.
- Run the official SvelteKit 3 migration tooling if it reports remaining RC-era work; inspect every generated change/TODO.
- Update the lockfile and required configuration only.
- Preserve existing ReScript integration, package scripts, application behavior, and static-adapter deployment.
- Do not mix unrelated dependency refreshes, UI/product changes, or refactors into this PR.

## Checkpoint A — establish stable Kit 3 delta

- Inspect current package/config state against the accepted stable Kit 3 baseline.
- Run the official migration tooling if applicable.
- Update only the framework/adapter dependencies and required config/imports.
- Review the diff for unrelated changes.
- Run focused checks appropriate to the changed package/config surface.
- Commit and non-force-push the coherent checkpoint, then continue without yielding.

## Checkpoint B — compatibility cleanup

- Resolve any migrator TODOs, type/config incompatibilities, or lockfile issues caused by the stable migration.
- Preserve the existing `#lib` imports and ReScript/Vite integration unless stable Kit 3 specifically requires a change.
- Confirm no SvelteKit/adapter `-next` prerelease remains.
- Commit and non-force-push the coherent checkpoint, then continue without yielding.

## Checkpoint C — full verification

Run the pH project-policy checks:

- `pnpm test`
- `pnpm check`
- `pnpm lint`
- `pnpm build`

Also inspect the final dependency/config diff for leftover prerelease versions, migrator TODOs, and unrelated dependency churn.

Record any Continuum 0.3 workflow friction on the PR so it can be promoted to `Leftium/continuum#9`.

## Completion

When implementation is complete and verified:

- record durable verification/results on the PR;
- release the run-scoped write lease;
- mark the PR Ready for independent review;
- leave root `PR-PLAN.md` present through review;
- after review is otherwise clean, use `scripts/continuum-finalize-pr.sh` to remove only the temporary plan and exercise the new 0.3 finalizer.

The user controls final merge.
