# PR Plan

Issue: #4

## Goal

Make Reanalyze useful in pH by suppressing the reviewed JS/Svelte interop false positives without hiding legitimate ReScript dead-code findings.

## Scope

- Preserve the existing Reanalyze DCE configuration and `pnpm reanalyze` script.
- Mark record shapes that cross the GenType/Svelte boundary as live where Reanalyze cannot observe their JS consumers:
  - `src/routes/GeneratorForm.res`: `formView` and `formMessage`
  - `src/routes/PasswordConfirmation.res`: `confirmationView`
  - `src/routes/Bookmarklet.res`: `initialAddress`
- Mark only the externally consumed `Realm.parseOptions.detectSpecialUse` record field live for the `tldts-icann` JS boundary.
- Prefer targeted `@live` annotations over file/path suppression.
- Do not remove or refactor code based on Reanalyze findings in this PR.

## Verify

- `pnpm reanalyze` reports no current interop false-positive warnings; investigate any remaining output rather than broadly suppressing it.
- `pnpm test`
- `pnpm check`
- `pnpm build`
- `pnpm lint`; if it still stops on the unchanged Markdown baseline, reference #3 and run ESLint separately so this PR's source changes are still checked.
