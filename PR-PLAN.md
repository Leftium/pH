# PR Plan

Issue: #6

## Goal

Migrate `main` from repository-installed Continuum 0.3 to published stable Continuum 0.6.1 at `fab456f5cf6641f2e895d74d17156a98acdc76ef`.

The migration PR itself remains governed by Continuum 0.3 through review, plan finalization, and merge. The merge is the migration boundary; subsequent new implementation PRs bootstrap with external Continuum 0.6.1.

## Scope

- Remove root `CONTINUUM.md`.
- Remove only the managed Continuum block from `AGENTS.md`; preserve all existing project-owned Svelte/SvelteKit guidance.
- Before deleting `CONTINUUM.md`, preserve any pH-owned policy there that is not already represented in `AGENTS.md`, including:
  - `main` as the accepted integration branch and PR target;
  - final merges remain user-controlled;
  - default code verification is `pnpm test`, `pnpm check`, and `pnpm lint`;
  - changes to SvelteKit/Vite/build configuration, adapters, or dependency/toolchain boundaries also run `pnpm build`;
  - ReScript compilation remains part of the repository package scripts and should not be bypassed;
  - framework migrations stay bounded and must not absorb unrelated product/refactor work.
- Consolidate durable pH policy into project-owned `AGENTS.md` without copying generic Continuum 0.3 machinery.
- Remove `scripts/continuum-finalize-pr.sh`, `templates/PR-PLAN.md`, and other clearly vendor-managed 0.3-only Continuum support files/references.
- Remove stale operational references to deleted 0.3 files while leaving historical references intact.
- Do not rewrite historical issues, PR comments, leases, branches, tags, or merged PRs.
- Preserve the existing `continuum` GitHub label for discovery metadata.
- Do not install 0.6.1 files into the repository; new 0.6.1 PRs use the immutable external protocol pin.

## Verify

- Confirm installed 0.3 protocol/finalizer/template/managed-policy machinery and stale operational references are absent from the PR head, except intentional historical references.
- Confirm all project-owned Svelte/SvelteKit guidance remains intact in `AGENTS.md`, with pH-owned workflow/verification policy preserved there.
- Run the repository checks appropriate for this workflow-only change and record results on the PR.
- Before merge, complete independent review, then remove only the temporary root `PR-PLAN.md` using the existing 0.3 cleanup-only finalization procedure or its authorized fallback if the helper has already been deleted.
