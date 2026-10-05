# PR Plan

Issue: #4

## Goal

Add Reanalyze dead-code analysis for pH's ReScript source using the ReScript toolchain already in the repository.

## Scope

- Configure DCE in `rescript.json` with non-transitive reporting.
- Add a package script that rebuilds ReScript artifacts before running Reanalyze.
- Do not remove/refactor code based on findings in this PR.
- Do not add a separate Reanalyze dependency.

## Verify

- `pnpm reanalyze`
- `pnpm test`
- `pnpm check`
- `pnpm lint` (record the existing #3 formatting baseline if it still fails)
- `pnpm build`
