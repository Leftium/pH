# Mog: ReScript and TypeScript interop, implementation and DX

**Status:** Draft implementation plan; manual proof first, automation deferred.
**Project name:** Mog. Package names, attribute spelling, and generated ReScript wrapper names remain provisional; spec filenames remain descriptive.
**Companion:** [What and why](rescript-ts-interop-what-why.md) defines the public representations, semantic requirements, and [naming vocabulary](rescript-ts-interop-what-why.md#naming-and-terminology).

Build Mog as a small ReScript helper library and handwritten public boundaries that compose adapters to transmute values. Decide whether type-driven generation is worth maintaining after that proof. A manual implementation may be the stopping point.

pH currently consumes raw genType exports. The manual proof should add isolated adapter fixtures and concrete TS consumers while keeping that baseline available for comparison. The pH clipboard target is a coherent RS operation returning structured feedback, with its intermediate Result kept internal. Completion requires runtime semantics and emitted TS contracts to agree, including nested Option/Result payloads and inbound conversion. This document is a plan, not a claim that the sample helper APIs already compile.

## Ownership and public surface

```text
Foo.res                 domain implementation
FooInterop.res          optional handwritten public boundary
  -> ReScript compiler
  -> FooInterop.res.js + FooInterop.gen.tsx
  -> TypeScript consumer
```

Domain modules own opaque representations and their adapters. Boundary modules compose them. ReScript and genType produce the public JS and TS surface. TS/framework-specific facades remain optional.

Use separate fixture boundary modules for the bidirectional Result proof, preserving the existing clipboard API during migration. The pH operation can live in `Clipboard.res` and export through genType when its feedback record is already ergonomic; add a separate interop module only if a selected representation requires conversion. A small project may put deliberate public conversions next to internal functions in one `.res` file.

Use `Foo.res.interop.ts` only when a TS facade adds value, such as a TS-specific brand, schema integration, or framework wrapper. Do not require both RS and TS wrapper files.

Keep `interop` as the file-purpose descriptor; adopting Mog does not rename the facade to `Foo.res.mog.ts`. Package names should follow the Mog brand when extraction needs them, but no package layout or exact names are selected yet.

New managed boundaries adopt the [Option and Result contracts](rescript-ts-interop-what-why.md#public-representations). Raw `@genType` exports retain their existing shapes. Changing an import to a managed boundary can change nested fields and argument types, even if the function name stays the same.

Do not treat all existing `@genType` exports as managed by default. Public raw exports may coexist during an experiment; generated helpers and internal adapter symbols must not accidentally become the intended package API.

## Initial compatibility baseline

Use pH's pinned ReScript and runtime versions, currently `12.3.1` in [package.json](../package.json), and its existing [genType configuration](../rescript.json). The compiler emits in-source `.res.js` and `.gen.tsx` files. Record the actual versions used by the proof before claiming compatibility with other releases.

The manual proof must establish how ReScript expresses the exact public envelopes and how genType emits their discriminated unions. A compiler-accepted wrapper alone is not proof that its TS declaration matches the intended runtime shape.

Do not change project-wide compiler settings or introduce a new package structure just to start the experiment. Follow pH's existing scripts and repository approval requirements when running builds or tests.

## Helper model

Treat `ToTS` and `ToRS` as independent capabilities and `Adapter` as their combination. Use `toTS` and `toRS` consistently in the design. Exact ReScript signatures and language-appropriate spelling are an implementation spike; TS-like notation here describes capabilities rather than prescribing a heterogeneous ReScript record API. Use destination-based direction names in conceptual examples; avoid mixing `toRS` with `fromTs` or calling the operations encode/decode.

```text
identity
option(child)
result(okChild, errorChild)
array(child)
tuple(children)
record(fields)
promise(child)
function(arguments, returnValue)
custom(explicitAdapter)
```

Start with the minimum helpers needed by real boundary modules. Handwritten record/variant mapping is acceptable. Do not build a general record-derivation engine to make the manual workflow look automatic.

Each direction should be independently usable. Composing outbound adapters must not require unused inbound functions; callback positions may introduce the opposite requirement. Prefer signatures that make a missing capability a type error rather than an optional field discovered at runtime.

Identity is selected from the declared contract. Do not scan runtime objects for `TAG`, `_0`, or other compiler conventions. ReScript pattern matching should own option/result conversion.

### Custom domain adapters

Preferred convention:

```text
Money.t
Money.Interop.publicValue
Money.Interop.toTS
Money.Interop.toRS       only if meaningful and total on its declared inputs
```

A separate `MoneyInterop` module is valid when the type owner cannot be changed. In manual mode, select adapters explicitly; no registry is required.

The adapter's public type must be visible to consumers and genType. For modules with `.resi` interfaces, expose the required public type and conversion functions through that interface while preserving the abstraction of `t`.

Custom adapters own internal conversion and stop default derivation at that type. Their public output must satisfy the selected in-memory or transport contract. Unsupported internals are not a reason to reject a correctly declared custom boundary.

If constructing the domain type can fail, expose a separate fallible function returning a domain Result, or require a validated public input type. Do not disguise fallible construction as a total `toRS`, catch every exception, or silently add errors to the containing API.

### Manual composition example

```text
Lookup.lookup
  string -> promise<result<option<User.t>, LookupError.t>>

LookupInterop.lookup
  identity argument
  -> Lookup.lookup
  -> promise(result(option(User.toTS), LookupError.toTS))
```

The public consumer then has this target shape:

```ts
async function displayLookup(id: string) {
	const { ok, data, error } = await lookup(id);

	if (!ok) {
		showError(error);
	} else if (data.hasValue) {
		showUser(data.value);
	} else {
		showNotFound();
	}
}
```

`lookup` and the display functions are illustrative. The destructured `ok`, `data`, and `error` fields must retain their branch relationship for TS narrowing. The proof must include a real TS consumer using generated declarations, with no application-level casts added to force agreement.

## Manual pH experiment

### Clipboard boundary

Current consumer flow inside an async handler in [the page](../src/routes/+page.svelte), with state assignment abbreviated:

```ts
const copyResult = await copyToClipboard(writeText, generatedPassword);
const feedback = formatCopyFeedback(copyResult, generatedPassword);
```

The real page supplies a browser clipboard callback and stores the feedback in reactive state. It does not inspect the Result tag. Replace this application round trip with one coherent RS operation; retain the two-operation shape only as a dedicated bidirectional adapter fixture.

The target public contract is illustrative TS notation, not verified generated output:

```ts
type CopyFeedback = {
	readonly prefix: string;
	readonly maskedPassword: string;
	readonly suffix: string;
};

type CopyGeneratedPassword = (
	writeText: (text: string) => Promise<void>,
	generatedPassword: string
) => Promise<CopyFeedback>;
```

`Clipboard.copyGeneratedPassword` calls the existing `copyToClipboard`, handles its Result inside RS, and derives this feedback record using the existing password masking function:

| Outcome | prefix              | maskedPassword         | suffix           |
| ------- | ------------------- | ---------------------- | ---------------- |
| Success | `"Copied "`         | Masked operation input | `"."`            |
| Failure | `"Could not copy "` | Masked operation input | `". Try again."` |

The field boundaries are a deliberate presentation contract. Svelte renders prefix and suffix as text and the masked password in its chosen element with its chosen class. Preserve spaces and text order. Do not parse a formatted sentence, duplicate outcome wording in TS, return an interpolated HTML string, or expose the unmasked password in feedback. Use the password supplied to this operation even if form state changes while the write is pending.

The page already defines a `copyGeneratedPassword` event handler. Alias the RS import to avoid a name collision; inside that handler, replace the two RS calls with:

```ts
import { copyGeneratedPassword as copyPasswordWithFeedback } from './Clipboard.gen.tsx';

// Inside the existing copyGeneratedPassword handler:
copyFeedback = await copyPasswordWithFeedback(
	(text) => navigator.clipboard.writeText(text),
	generatedPassword
);
```

Keep reactive state, feedback clearing, the `isCopyPending` guard and reset, and element/class selection in Svelte. Update the feedback state type and rendering together; preserve current validation-before-copy behavior and existing accessibility behavior. RS owns masking and outcome wording. A plain record may need only genType; do not force a Mog adapter onto it. If a later requirement needs RS-authored markup, use the optional HAST integration without changing the rule that intermediate Results remain internal.

Keep clipboard exception handling in the existing domain operation. The adapter must not add another catch policy. The injected callback retains its conventional `Promise<void>` return type; its fulfillment value is ignored.

### Dedicated bidirectional Result fixture

In this fixture, `CopyError` is the public literal type `"CopyFailed"`, and `Result` is the companion spec's explicit-discriminant envelope. Retain the old two-function flow: an operation returns managed `Result<undefined, CopyError>`, and a second operation accepts that same public Result. Wrap both directions so the second operation receives a converted RS Result. The TS consumer must inspect `ok` and use both branches to demonstrate branch narrowing independently of the production page. Use injected resolving/rejecting writers, without a system clipboard or production page dependency.

This fixture proves conversion and composition. It is not the recommended pH API or evidence that pH needs to expose a Result. The success payload remains `undefined`, matching the unit-payload contract.

### Baselines and additional fixtures

Keep [GeneratorForm](../src/routes/GeneratorForm.res) and [PasswordConfirmation](../src/routes/PasswordConfirmation.res) as examples where raw genType is already ergonomic. Preserve useful view records. If a managed Option is introduced there later, migrate all affected reads and arguments deliberately; `value ?? fallback` is not an envelope presence check.

Use small dedicated fixtures for behavior pH does not naturally exercise:

- Nested Option/Result composition, including `option<unit>`.
- A custom domain type inside a record or array.
- An outbound-only view adapter and an inbound-only input adapter, each usable without its inverse. Use validated inputs where domain construction requires them.
- A TS callback receiving an adapted RS value and returning a value that requires `toRS`.
- A generic operation that is demonstrably identity-compatible, and one that needs an explicit adapter or concrete boundary.

These fixtures should prove the shared contract without adding unrelated features to the password application.

## Verification contract

Verify consequences, not an exhaustive inventory of hypothetical features. The manual proof needs:

| Concern                      | Evidence                                                                                                                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Option state preservation    | Both directions distinguish `None`, `Some(None)`, deeper nesting, and supported `Some(null)`/`Some(undefined)` payloads.                                                                         |
| Result state preservation   | Success/error branches, nested payloads, and nullable or falsy payloads all retain their branch through the `ok` discriminant. Consumers need no Wellcrafted dependency.                        |
| Composition                  | A custom leaf conversion is actually used inside a containing value in each required direction.                                                                                                  |
| Functions and promises       | Callback directions are correct; thrown exceptions and rejections are not swallowed; conversion failures follow the declared contract.                                                           |
| Public type accuracy         | Generated TS supports narrowing and rejects incorrect calls without application casts masking mismatches.                                                                                        |
| pH behavior                  | Success/failure wording and masking remain correct; the password is separately styleable, with no Result round trip, and validation still precedes writing. Existing comparison APIs still work. |
| Capability failures          | Missing conversion directions and unsupported defaults fail clearly. In manual mode, compiler errors or an explicit support gate may supply this evidence.                                       |

Do not promise automated unsupported-type detection before the analyzer exists. Manual authors must use supported helpers or explicit custom boundaries; the compiler checks their signatures, while semantic adapter laws require focused tests/review. Future generation must refuse types it cannot establish as supported.

For immutable data, round-trip equivalence concerns declared values, not reference identity or undeclared extra JS properties. Identity-sensitive mutable structures, callback registrations, and cyclic graphs need explicit adapters and their own contracts before support is claimed.

## Implementation sequence

### First: manual proof

1. Record the current compiler/runtime baseline and inspect existing generated bindings.
2. Establish minimal ReScript definitions/helpers that emit the exact Option and Result public types. Prove TS narrowing before expanding the helper catalog.
3. Add nested-state and custom-composition fixtures, including required inbound conversions and a callback.
4. Add the coherent clipboard operation while preserving the original API. Move the page to structured feedback and verify success/failure text, masking, separate password styling, and public types. Keep the bidirectional Result flow in its dedicated fixture.
5. Compare ergonomics, wrapper maintenance, and emitted runtime work against raw genType. Stop at manual helpers if they provide enough value.

Remove an old boundary only after its replacement is verified and its remaining consumers are accounted for. The spec does not require removing the raw API or migrating every pH export.

### Next, independently: rich content

Implement the companion spec's [rich-content contract](rescript-ts-interop-what-why.md#optional-rich-content-integration) without code generation:

1. Start with HAST construction and a small Svelte renderer; retain the message's accessibility metadata.
2. Define approved construction/sanitization APIs and the developer-discipline rule for `SafeHast`.
3. Prove ReScript's generic JSX runtime and child conversions with a small working example. The earlier JSX idea is not assumed to compile without that runtime.
4. Compare one rich domain message against today's plain text. Add Markdown only when that authoring path is needed.

This is an optional integration milestone, not a prerequisite for the interop library. Keep HAST/Markdown and framework dependencies outside the core. Defer runtime remote functions to a separate server-capable fixture.

### Later: analyze repetition

Inspect several real manual boundaries. Identify repeated structural mapping, domain-specific policy, and the maintenance cost of keeping wrappers synchronized. Agent-maintained wrappers are a possible workflow, subject to the same checks as human edits.

Add attributes only when there is a concrete consumer for the metadata or an experiment that needs them. Ordinary `.res` with small policy attributes remains the preferred automation direction if generation is justified.

## Deferred automation design

### Metadata and discovery

Potential `@mog`-style metadata would mark raw exports for adaptation, select a non-default representation, associate a custom adapter, or rename a public export. Use `@mog` for brevity in concrete examples, with exact spelling explicitly TBD. `@transmute` remains an alternative: `@mog` is short and branded, while `@transmute` names the operation. Names and syntax are provisional and must be verified with the pinned compiler and formatter. Do not duplicate full type expressions in attributes.

Prefer explicit module-local associations over project configuration. Configuration may later handle external adapters or project-wide policy. If several policies can apply, define deterministic precedence and reject ambiguous registrations.

Keep raw exports selected for generation distinct from already-adapted handwritten boundaries. Generated modules must not be rediscovered. Reusing `@genType` as an automatic opt-in requires an explicit migration policy; it is not the default.

### Preferred generated shape

```text
authored Foo.res + resolved type information + policy
  -> analyzer
  -> generated src/__ffi__/FooInterop.res
  -> ReScript + genType
  -> public JS/TS boundary
```

Prefer generated ReScript so the compiler checks conversions. A TS facade remains an alternative where the target contract benefits from it. Generated naming, module collisions, and public import stability must be resolved before promising this exact layout.

The analyzer must derive required capabilities recursively from function positions: top-level inputs need `toRS`, outputs need `toTS`, and callback arguments/returns reverse those requirements at each function boundary. Identity-compatible positions need no representation conversion. It must not require unused inverse adapters. The analyzer must understand aliases, abstraction boundaries, and type parameters sufficiently to either derive a conversion or issue a diagnostic. It must not substitute runtime shape guessing for missing type information.

### Feasibility gates

Build/watch ordering is deliberately unresolved. Excluding generated files from discovery does not solve acquisition of compiler-resolved types or stale-wrapper failures.

Before substantial implementation, establish:

- Which compiler/tooling API or artifact exposes attributes and resolved public types, and its version compatibility.
- Whether obtaining that information requires an initial compilation, and how that works when generated modules are absent or stale.
- A deterministic clean-checkout build, plus correct deletion/rename behavior and cleanup limited to generator-owned files.
- Watch convergence without loops, unnecessary rewrites, or stale TS declarations; recovery after source errors.
- Clear diagnostics that identify the export, nested type position, missing direction/policy, and available custom-boundary escape hatch.
- A stable public import path and deliberate separation of raw, handwritten, and generated APIs.

Only then specify process orchestration. Manual mode continues to use pH's existing ReScript/Vite workflow without a third watcher.

### Alternatives

Wrapper location, reuse, maintenance, and generation are partly independent choices.

| Choice                                 | When it fits                                                                                                                       |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Raw genType                            | Existing shapes already serve consumers.                                                                                           |
| Inline handwritten exports             | A small module benefits from colocated public conversions.                                                                         |
| Separate handwritten RS boundary       | Keep domain and public representation concerns separate. Useful for isolated adapter fixtures; optional for pH's clipboard record. |
| Shared helper library                  | Reduce repeated conversions in either handwritten arrangement. Potential stopping point.                                           |
| Thin TS facade                         | TS or framework-specific integration adds value.                                                                                   |
| Human/agent-maintained wrappers        | Maintain explicit boundaries without a dedicated generator.                                                                        |
| Attributes plus type-driven generation | Repetition justifies tooling, and feasibility gates pass. Preferred automation candidate.                                          |
| Separate small FFI DSL                 | Only if attributes/conventions cannot express necessary policy.                                                                    |
| ReScript-derived source language       | Only if ordinary ReScript becomes a demonstrated limitation; brings parser/editor maintenance.                                     |
| PPX/compiler AST extension             | Possible compiler-coupled implementation after feasibility research.                                                               |
| Native compiler/genType integration    | Revisit after practical use establishes a stable model worth upstreaming.                                                          |

## Remaining decisions and revisit triggers

| Question                                     | Current position                                                                                                                  | Revisit when                                                             |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Exact ReScript envelope/helper encoding      | Prove the smallest definitions with correct genType output.                                                                       | First manual spike.                                                      |
| Presence type parameter                      | Use `Option<T>` with `Some<T>`/`None` aliases.                                                                                    | A real generic API benefits from parameterized presence.                 |
| Additional defaults and generic support      | Support only cases whose conversion can be established; use custom boundaries otherwise.                                          | Repeated concrete use demonstrates a worthwhile addition.                |
| Wellcrafted distinction                      | Preserve the familiar `data` and `error` fields, but make Mog's `ok` discriminant authoritative; exact structural compatibility is not required. | A concrete semantic or DX benefit warrants an explicit alternate policy. |
| Rich-content renderer and sanitizer policy   | Small optional integration, approved APIs, developer discipline.                                                                  | Content milestone begins.                                                |
| Safe-function coloring                       | Deferred; value types and trusted constructors first.                                                                             | Real failures show the trust contract is insufficient.                   |
| Analyzer, attributes, config, build ordering | Deferred; generated ReScript is a candidate, not a commitment.                                                                    | Manual repetition justifies automation.                                  |
| Package names and extraction                 | Mog is the settled project name. Exact package names remain provisional; keep descriptive filenames and a pH-local proof for now. | A reusable package is ready to extract.                                  |

Upstream comparisons and project evidence are collected in the companion's [references](rescript-ts-interop-what-why.md#references-and-related-projects).
