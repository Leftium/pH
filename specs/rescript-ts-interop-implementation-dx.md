# ReScript and TypeScript interop: implementation and DX

**Status:** Draft implementation plan; manual proof first, automation deferred.
**Project name:** Undecided. Existing filenames are descriptive placeholders.
**Companion:** [What and why](rescript-ts-interop-what-why.md) defines the public representations and semantic requirements.

Build a small ReScript helper library and handwritten public boundaries before deciding whether type-driven generation is worth maintaining. A manual implementation may be the stopping point.

pH currently consumes raw genType exports. The first change should add an isolated boundary and concrete consumers while keeping that baseline available for comparison. Completion requires runtime semantics and emitted TS contracts to agree, including nested Option/Result payloads and inbound conversion. This document is a plan, not a claim that the sample helper APIs already compile.

## Ownership and public surface

```text
Foo.res                 domain implementation
FooInterop.res          optional handwritten public boundary
  -> ReScript compiler
  -> FooInterop.res.js + FooInterop.gen.tsx
  -> TypeScript consumer
```

Domain modules own opaque representations and their adapters. Boundary modules compose them. ReScript and genType produce the public JS and TS surface. TS/framework-specific facades remain optional.

For pH, use a separate `ClipboardInterop.res` during the proof so the existing clipboard API remains usable. Consumers of that experiment import `./ClipboardInterop.gen.tsx`. This is a proposed path, not an existing module. A small project may instead put deliberate public conversions next to internal functions in one `.res` file.

Use `Foo.res.interop.ts` only when a TS facade adds value, such as a TS-specific brand, schema integration, or framework wrapper. Do not require both RS and TS wrapper files.

New managed boundaries adopt the [Option and Result contracts](rescript-ts-interop-what-why.md#public-representations). Raw `@genType` exports retain their existing shapes. Changing an import to a managed boundary can change nested fields and argument types, even if the function name stays the same.

Do not treat all existing `@genType` exports as managed by default. Public raw exports may coexist during an experiment; generated helpers and internal adapter symbols must not accidentally become the intended package API.

## Initial compatibility baseline

Use pH's pinned ReScript and runtime versions, currently `12.3.1` in [package.json](../package.json), and its existing [genType configuration](../rescript.json). The compiler emits in-source `.res.js` and `.gen.tsx` files. Record the actual versions used by the proof before claiming compatibility with other releases.

The manual proof must establish how ReScript expresses the exact public envelopes and how genType emits their discriminated unions. A compiler-accepted wrapper alone is not proof that its TS declaration matches the intended runtime shape.

Do not change project-wide compiler settings or introduce a new package structure just to start the experiment. Follow pH's existing scripts and repository approval requirements when running builds or tests.

## Helper model

Use `Adapter`, `toTS`, and `toRS` consistently in the design. Exact ReScript signatures are an implementation spike; TS-like notation here describes capabilities rather than prescribing a heterogeneous ReScript record API.

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
  const result = await lookup(id);

  if (result.error !== null) {
    showError(result.error);
  } else if (result.data.hasValue) {
    showUser(result.data.value);
  } else {
    showNotFound();
  }
}
```

`lookup` and the display functions are illustrative. The proof must include a real TS consumer using generated declarations, with no application-level casts added to force agreement.

## Manual pH experiment

### Clipboard boundary

Current consumer flow inside an async handler in [the page](../src/routes/+page.svelte), with state assignment abbreviated:

```ts
const copyResult = await copyToClipboard(writeText, generatedPassword);
const feedback = formatCopyFeedback(copyResult, generatedPassword);
```

The real page supplies a browser clipboard callback and stores the feedback in reactive state. It does not inspect the Result tag, so this is a compatibility/composition experiment rather than an assumed call-site simplification.

Target contracts, with the same high-level call flow:

```ts
type CopyError = "CopyFailed";

// Result refers to the companion spec's structural envelope.
type Copy = (
  writeText: (text: string) => Promise<void>,
  generatedPassword: string,
) => Promise<Result<undefined, CopyError>>;

type FormatFeedback = (
  copyResult: Result<undefined, CopyError>,
  generatedPassword: string,
) => string;
```

The Result success payload is `undefined`, matching the unit-payload contract. The injected clipboard callback keeps its conventional `Promise<void>` return type; its fulfillment value is ignored.

Wrap both exported operations. Outbound conversion alone would leave the formatter expecting the raw ReScript Result. Keep clipboard exception handling in the existing domain operation; the adapter must not add another catch policy.

A separate TS fixture should inspect `error !== null` to demonstrate consumer narrowing. Do not rewrite the UI solely to manufacture a use for the new envelope.

### Baselines and additional fixtures

Keep [GeneratorForm](../src/routes/GeneratorForm.res) and [PasswordConfirmation](../src/routes/PasswordConfirmation.res) as examples where raw genType is already ergonomic. Preserve useful view records. If a managed Option is introduced there later, migrate all affected reads and arguments deliberately; `value ?? fallback` is not an envelope presence check.

Use small dedicated fixtures for behavior pH does not naturally exercise:

- Nested Option/Result composition, including `option<unit>`.
- A custom domain type inside a record or array.
- A TS callback receiving an adapted RS value and returning a value that requires `toRS`.
- A generic operation that is demonstrably identity-compatible, and one that needs an explicit adapter or concrete boundary.

These fixtures should prove the shared contract without adding unrelated features to the password application.

## Verification contract

Verify consequences, not an exhaustive inventory of hypothetical features. The manual proof needs:

| Concern | Evidence |
| --- | --- |
| Option state preservation | Both directions distinguish `None`, `Some(None)`, deeper nesting, and supported `Some(null)`/`Some(undefined)` payloads. |
| Result compatibility | Success/error branches, nested payloads, and TS assignability against a pinned Wellcrafted type in development; consumers need no Wellcrafted dependency. |
| Invalid default Result error | A nullable public error type requires an explicit adapter or is rejected. Falsy non-null errors remain errors. |
| Composition | A custom leaf conversion is actually used inside a containing value in each required direction. |
| Functions and promises | Callback directions are correct; thrown exceptions and rejections are not swallowed; conversion failures follow the declared contract. |
| Public type accuracy | Generated TS supports narrowing and rejects incorrect calls without application casts masking mismatches. |
| pH behavior | Clipboard success/failure feedback remains correct through the public boundary; existing comparison APIs still work. |
| Capability failures | Missing conversion directions and unsupported defaults fail clearly. In manual mode, compiler errors or an explicit support gate may supply this evidence. |

Do not promise automated unsupported-type detection before the analyzer exists. Manual authors must use supported helpers or explicit custom boundaries; the compiler checks their signatures, while semantic adapter laws require focused tests/review. Future generation must refuse types it cannot establish as supported.

For immutable data, round-trip equivalence concerns declared values, not reference identity or undeclared extra JS properties. Identity-sensitive mutable structures, callback registrations, and cyclic graphs need explicit adapters and their own contracts before support is claimed.

## Implementation sequence

### First: manual proof

1. Record the current compiler/runtime baseline and inspect existing generated bindings.
2. Establish minimal ReScript definitions/helpers that emit the exact Option and Result public types. Prove TS narrowing before expanding the helper catalog.
3. Add nested-state and custom-composition fixtures, including required inbound conversions and a callback.
4. Add the proposed clipboard boundary while preserving the original API. Move the experimental consumers to it and verify behavior and public types.
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

Potential `@ffi`-style metadata would mark raw exports for adaptation, select a non-default representation, associate a custom adapter, or rename a public export. Names and syntax are provisional and must be verified with the pinned compiler and formatter. Do not duplicate full type expressions in attributes.

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

The analyzer must understand aliases, abstraction boundaries, type parameters, and directional requirements sufficiently to either derive a conversion or issue a diagnostic. It must not substitute runtime shape guessing for missing type information.

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

| Choice | When it fits |
| --- | --- |
| Raw genType | Existing shapes already serve consumers. |
| Inline handwritten exports | A small module benefits from colocated public conversions. |
| Separate handwritten RS boundary | Keep domain and public representation concerns separate. Preferred pH experiment. |
| Shared helper library | Reduce repeated conversions in either handwritten arrangement. Potential stopping point. |
| Thin TS facade | TS or framework-specific integration adds value. |
| Human/agent-maintained wrappers | Maintain explicit boundaries without a dedicated generator. |
| Attributes plus type-driven generation | Repetition justifies tooling, and feasibility gates pass. Preferred automation candidate. |
| Separate small FFI DSL | Only if attributes/conventions cannot express necessary policy. |
| ReScript-derived source language | Only if ordinary ReScript becomes a demonstrated limitation; brings parser/editor maintenance. |
| PPX/compiler AST extension | Possible compiler-coupled implementation after feasibility research. |
| Native compiler/genType integration | Revisit after practical use establishes a stable model worth upstreaming. |

## Remaining decisions and revisit triggers

| Question | Current position | Revisit when |
| --- | --- | --- |
| Exact ReScript envelope/helper encoding | Prove the smallest definitions with correct genType output. | First manual spike. |
| Presence type parameter | Use `Option<T>` with `Some<T>`/`None` aliases. | A real generic API benefits from parameterized presence. |
| Additional defaults and generic support | Support only cases whose conversion can be established; use custom boundaries otherwise. | Repeated concrete use demonstrates a worthwhile addition. |
| Wellcrafted divergence | Aim for structural compatibility without a consumer dependency. | A concrete semantic or DX benefit warrants an explicit alternate policy. |
| Rich-content renderer and sanitizer policy | Small optional integration, approved APIs, developer discipline. | Content milestone begins. |
| Safe-function coloring | Deferred; value types and trusted constructors first. | Real failures show the trust contract is insufficient. |
| Analyzer, attributes, config, build ordering | Deferred; generated ReScript is a candidate, not a commitment. | Manual repetition justifies automation. |
| Product/package name and extraction | Keep descriptive filenames and a pH-local proof for now. | A reusable package is ready to extract. |

Upstream comparisons and project evidence are collected in the companion's [references](rescript-ts-interop-what-why.md#references-and-related-projects).
