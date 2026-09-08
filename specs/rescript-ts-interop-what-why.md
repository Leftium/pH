# Mog: ReScript and TypeScript interop, what and why

**Status:** Draft; representation decisions agreed, implementation not started.
**Project name:** Mog. This is a separate project incubating alongside pH; package names remain provisional.
**First milestone:** A manual ReScript helper/boundary proof, potentially in pH.

Mog provides idiomatic ReScript <-> TypeScript interop. It transmutes values across the language boundary by composing adapters, preserving their meaning while using predictable public representations.

Today, pH consumes genType exports directly. Mog adds reusable conversions where a different public representation is useful. The first proof succeeds when a handwritten boundary handles nested options/results, custom types, and required conversion directions without compiler-tag handling at application call sites. Code generation and rich-content authoring are later, independent milestones.

This document owns the representation contracts and scope. The companion [implementation and DX spec](rescript-ts-interop-implementation-dx.md) owns the manual workflow, implementation sequence, and automation investigation. TypeScript definitions below describe intended public contracts; they are not generated output verified by an implementation yet.

## Naming and terminology

Mog is short for transmogrify/transmog. Use Mog as the project, tool, or library name, and `transmute` as the process verb. Avoid `mog`, `mogged`, or `mogging` as technical verbs.

| Concept | Preferred term |
| --- | --- |
| Project/tool/library | Mog |
| Representation-conversion process | transmute / transmutation |
| Reusable conversion rule for a type or semantic representation | adapter |
| RS-to-TS direction | `toTS` |
| TS-to-RS direction | `toRS` |
| Place adapters are applied | boundary |
| Overall category | interop / FFI |
| SvelteKit server/client serialization | transport |

A Mog boundary may be handwritten, generated, attribute-driven, or framework-specific. Adapters perform transmutation at that boundary; they are not a separate stage before transmutation. Ordinary "convert/conversion" remains useful explanatory wording. Avoid codec, converter, mapper, or transmuter as competing names for adapters, and encode/decode or marshal/unmarshal as names for the core directional operations.

Adapters do not establish validation or rendering safety. Mog composes with genType, Svelte rendering, and SvelteKit transport; each retains its own responsibility. Package names, attribute spelling, and generated ReScript wrapper names remain provisional. The companion's [implementation and DX spec](rescript-ts-interop-implementation-dx.md) records those choices.

## Motivation and current evidence

ReScript and TypeScript exchange live JavaScript values. Mog transmutation changes their representation or ecosystem-facing shape; it does not serialize them. genType already provides useful types for many shared representations; Mog builds on that baseline.

Three pH boundaries illustrate different needs:

| Boundary | Current behavior | Proposed experiment |
| --- | --- | --- |
| [Clipboard](../src/routes/Clipboard.res) | `promise<result<unit, copyError>>`; its genType API exposes the Result variant. [The caller](../src/routes/+page.svelte) passes it back to `formatCopyFeedback` without inspecting tags. | Keep the Result inside one RS operation and return structured feedback with a separately renderable masked password. Move bidirectional Result conversion to a dedicated fixture. |
| [GeneratorForm](../src/routes/GeneratorForm.res) and [PasswordConfirmation](../src/routes/PasswordConfirmation.res) | Useful view records with simple optional fields already exposed naturally by genType. | Keep these as an identity/raw-genType baseline. Migrating an option to the managed representation is an explicit API change. |
| [Domain message](../src/routes/GeneratorForm.res) | Plain text such as `Domain: example.com`. | Later, add rich formatting through HAST. This adds capability; it does not remove an existing markup reconstruction system. |

The intended payoff is a stable public contract, reusable composition, and clear unsupported-case diagnostics. Manual adapters may be a sufficient final product.

## Recommended application architecture

Recommend a ReScript application core with a thin TS/framework shell. pH is the concrete example: ReScript owns validation, domain operations, and presentation calculations; Svelte owns reactive state, rendering, event handling, and browser capabilities. Mog remains bidirectional and also supports applications where TS owns orchestration.

```text
TS/Svelte shell
  -> event facts and narrow capability callbacks
  -> RS core: coherent operations, intermediate domain values
  -> output/view data
  -> Mog toTS where representation changes are useful
  -> TS/Svelte shell renders
```

Prefer coarse-grained boundaries around coherent operations. Keep intermediate domain values inside ReScript when the TS consumer does not need to inspect them. Transmute values because the consumer needs them, not merely because control temporarily crosses languages. This guides API design and examples; Mog does not infer operation boundaries or combine operations automatically.

Pass primitives and narrow capabilities where practical. pH's clipboard writer is `string => promise<unit>`; the shell supplies the browser implementation. Extract relevant event facts in the shell instead of passing DOM events or elements into the core. Full third-party bindings remain appropriate when ReScript needs to own that API, but generating broad browser or TS-library bindings is not part of the manual proof.

Return enough structure for rendering. Clipboard feedback must expose the masked password separately so Svelte can choose spans, other tags, and classes without parsing a sentence or repeating success/failure wording. The internal Result stays in RS. A small output record is sufficient for this requirement; the optional HAST integration supports richer RS-authored markup later.

Select Mog boundaries deliberately. A coherent operation returning an already ergonomic genType shape may need no transmutation. Dedicated fixtures establish adapter correctness; real consumers of richer output establish application benefit.

## Decisions and scope

| Decision | Rationale |
| --- | --- |
| Preserve every state of supported bidirectional values. | Silent flattening makes round trips unreliable. Reject unsupported representations instead. |
| Use explicit Option envelopes by default on managed boundaries. | Presence remains distinct from the payload, including nested absence, `null`, and `undefined`. |
| Aim for structural Wellcrafted Result compatibility. | Consumers can use plain objects without installing Wellcrafted. Divergence requires a concrete benefit and an explicit policy. |
| Cover a small core and compose custom adapters. | Edge cases should not force the core to model the entire language. |
| Support both directions, prioritize RS-to-TS ergonomics and conversion efficiency. | Rich output/view values motivate the primary architecture; arguments and callbacks still require first-class inbound conversion where needed. |
| Minimize crossings of intermediate domain values. | Coherent RS operations keep values internal when TS has no use for them. |
| Keep platform/framework complexity in the shell where practical. | Primitive event facts and narrow capabilities keep application boundaries small. |
| Keep conversions with the ReScript type owner where practical. | Internal representation changes should not leak into a TS facade. |
| Prove manual use before adding metadata or code generation. | Automation must address observed repetition. |
| Keep rich content and framework glue optional. | The core must work without HAST, Svelte, or SvelteKit. |

In scope for the manual proof: primitives, unit, explicit options, compatible results, arrays, tuples, immutable record usage, promises, suitable variants, and explicit custom adapters. Include a callback composition fixture to establish direction reversal.

Initially require explicit custom boundaries for cases whose conversion cannot be established: unresolved representation-changing generics, recursive type derivation, cyclic values, mutation-sensitive graphs, unusual external objects, and unsupported language features. These are support limits, not claims that such types can never be handled.

Non-goals include a new source language, a replacement compiler or reactive system, ReScript syntax in Svelte templates, global import interception, runtime guessing of compiler tags, automatic exception-to-Result conversion, and a general validation or serialization framework.

## Public representations

### Option

```ts
type Some<T> = { readonly value: T; readonly hasValue: true };
type None = { readonly value: null; readonly hasValue: false };
type Option<T> = Some<T> | None;
```

Option uses `value`/`hasValue` for presence, while Result uses `data`/`error` for success or failure. The `hasValue` field is authoritative; never infer presence from `value`.

```ts
// None
const absent: Option<string> = { value: null, hasValue: false };

// Some(None)
const innerAbsent: Option<Option<string>> = {
  value: { value: null, hasValue: false },
  hasValue: true,
};

// Some(Some("hello"))
const nested: Option<Option<string>> = {
  value: { value: "hello", hasValue: true },
  hasValue: true,
};
```

Each option layer has one envelope. `Some<T>` names a branch; it does not add another wrapper. `Some(null)` and `Some(undefined)` have `hasValue: true` and remain distinct from `None`. In particular, `option<unit>` preserves both states.

An additional presence type parameter is possible if real APIs need to express known presence generically:

```ts
type OptionWithPresence<T, P extends boolean = boolean> =
  P extends true ? Some<T> : None;
```

This changes only the type spelling. Start with the simpler union and branch aliases. A presence parameter describes one layer; it does not replace nested envelopes.

`T | undefined` remains an explicit opt-in representation when the converted payload excludes `undefined`. Do not silently choose it for managed options or flatten nested absence. Existing raw genType exports retain their current contract until deliberately migrated.

### Result

```ts
type Result<T, E> =
  | { readonly data: T; readonly error: null }
  | { readonly data: null; readonly error: E };
```

Use Wellcrafted's structural envelope without requiring its runtime or type imports in consumer projects. Both branches recursively convert their payloads. The default adapter requires the public error type to exclude `null`, because `null` identifies success. Check `error !== null`, not truthiness.

An error type whose public representation can contain `null` needs an explicit adapter, for example an object with `{ name: "DomainError", value: originalPayload }`. Preserve the payload; do not silently reinterpret an error as success. Unsupported error representations must be reported rather than guessed.

Nested results and options retain each envelope:

```text
result<option<User.t>, LookupError.t>
  -> Result<Option<User>, LookupError>

result<result<User.t, InnerError.t>, OuterError.t>
  -> Result<Result<User, InnerError>, OuterError>
```

Returned Result values, thrown exceptions, and rejected promises remain separate channels. Converting a Result does not catch an exception or rejection.

### Supported core

Here, `T'` means the public representation selected for `T`.

| ReScript type | Public representation | Conversion rule |
| --- | --- | --- |
| `string`, `bool`, `int`, `float` | `string`, `boolean`, `number` | Identity at the representation level. Static TS `number` does not validate ReScript numeric or domain assumptions. |
| `unit` | `void` for function returns; `undefined` as a payload | Preserve unit when nested in an envelope. |
| `option<T>` | `Option<T'>` | Convert the present payload; preserve every absence layer. |
| `result<T, E>` | `Result<T', E'>` | Convert the selected branch; require a non-null public error representation. |
| `array<T>` | `Array<T'>` | Compose the child adapter; identity only when compatible. |
| Tuple | TS tuple | Compose each position. |
| Record | Object with declared public fields | Compose each field; preserve field presence and declared mutability constraints. |
| `promise<T>` | `Promise<T'>` | Convert fulfillment; preserve rejection behavior. |
| Compatible variant | Literal union or discriminated union | Preserve a suitable compiler-emitted shape, or use an explicit adapter. |
| Function/callback | Function with adapted parameters and return | Compose conversions with direction reversal at each function boundary. |
| Custom type | Adapter's declared public type | The adapter owns the internal conversion. |

Record fields containing managed options are required envelope fields unless the public contract explicitly says otherwise. Do not confuse `{ field: Option<T> }`, `{ field: T | undefined }`, and `{ field?: T }`.

Do not rebuild identity-compatible values merely for consistency. Managed Option and Result envelopes are deliberate representation choices even when a raw genType representation was already usable. Converted containers may allocate; promise and callback conversion may create wrappers. There is no blanket zero-overhead or reference-identity promise.

For frequently recomputed view outputs, preserve identity-compatible values and unchanged child references where the declared contract permits. Converting a child usually requires a new containing record; do not mutate the original to avoid that allocation. Primitive inputs under the default identity policy require no representation conversion or allocation. This does not imply that an entire call, callback wrapper, or converted container is allocation-free.

## Adapter selection and composition

Use declared types and explicit policy, never guesses based on arbitrary object shapes.

```text
boundary type
  -> explicitly selected custom adapter, if any
  -> otherwise supported default and child adapters
  -> otherwise unsupported-boundary diagnostic
```

A custom adapter ends automatic traversal of that type's internals. Its declared public representation must still satisfy the selected boundary's requirements. An in-memory adapter is not automatically suitable for remote transport.

Manual mode composes the adapter tree explicitly. Future automation may derive it. A handwritten helper library still requires explicit composition for records containing `Money.t`.

### Directions

`ToTS` and `ToRS` are fundamental capabilities; `Adapter` combines both:

```ts
type ToTS<RS, TS> = { toTS(value: RS): TS };
type ToRS<RS, TS> = { toRS(value: TS): RS };
type Adapter<RS, TS> = ToTS<RS, TS> & ToRS<RS, TS>;
```

An outbound-only adapter is valid until a boundary needs its inbound capability. `Adapter` above illustrates the bidirectional combination, not a requirement that every adapter supply both methods. These TS signatures explain the model; exact ReScript helper signatures and spelling remain to be proven.

```text
TS argument -> toRS adapter -> RS function -> toTS adapter -> TS result

Callback supplied by TS:
RS argument -> toTS adapter -> TS callback -> toRS adapter -> RS caller
```

An input position can therefore need `toTS` inside a callback. Determine requirements recursively from function positions, not just from whether a type occurs in a top-level argument or result.

Direction requirements apply to manual composition and are the core model for any later generator. In these examples, the named data types contain no functions; any nested function positions require further reversal:

```text
Input.t -> View.t
  Input: toRS only if its representation changes
  View:  toTS only; no inbound requirement

(User.t -> result<Order.t, Error.t>) -> View.t
  callback argument User: toTS
  callback return Result and its payloads: toRS
  operation return View: toTS
```

An outbound-only view adapter is normal. An input/command adapter may provide only `toRS`; a shared domain adapter may provide both. These describe usage, not new adapter categories or annotations. Require only the capabilities encountered in the actual boundary, including recursively reversed callback positions.

### Generic exports

`array<Money.t>` identifies a child adapter. `array<'a>` does not identify one when `'a` requires a representation change. TS type arguments do not supply executable converters.

Support generic cases whose behavior can be established, including appropriate identity-only operations. Otherwise require a concrete export, an explicit adapter parameter/factory, or a custom boundary. Do not categorically reject all generics or promise automatic conversion of every generic export.

### Correctness and failure

For supported bidirectional values, converting to the public representation and back must preserve meaning in both directions. Equality here is semantic: new record objects, equivalent callbacks, and new promises need not have the same identity. One-way adapters promise only their declared conversion.

The initial automatic/default contract excludes reliance on shared mutable aliases or callback reference identity. Identity-sensitive registration/removal APIs need an explicit boundary that manages wrapper reuse. Recursive and cyclic structures need an explicit strategy before support is claimed.

Future analyzer diagnostics should cover unsupported declared types, missing directions, and incompatible adapter contracts. In manual mode, typed helper signatures and explicit review establish the supported boundary; there is no general analyzer yet. They cannot prove that arbitrary runtime values meet numeric, domain, or trust assumptions.

Untrusted input follows this path:

```text
external input
  -> validation or decoding
  -> typed public value
  -> Mog transmutation (toRS adapter)
  -> domain operation
```

An opaque domain constructor may still fail for a typed public value. A total adapter requires established input preconditions. Otherwise expose a fallible constructor explicitly, returning the domain's error result; do not hide that failure inside a supposedly total conversion or silently change the enclosing API's error type.

## Optional rich-content integration

HAST is the preferred shared markup format. A later experiment should compare its added capability and complexity against pH's current plain text and useful view records.

```text
ReScript JSX or Markdown
  -> HAST
  -> approved construction or sanitization policy
  -> SafeHast
  -> Svelte renderer
```

Use the existing Markdown ecosystem: Markdown to MDAST to HAST, with raw HTML disabled or sanitized and unsafe URL schemes rejected. Do not create a Markdown parser or custom HTML AST without a demonstrated limitation.

The JSX path should implement ReScript's generic JSX runtime for a small rich-text subset. Begin with text, `span`, `strong`, and `em`; add links with a URL policy, and other block/list elements only when needed. React elements, interactive controls, arbitrary handlers, Svelte directives, and component-framework behavior are outside this experiment.

### SafeHast trust contract

Start with opaque/value types and developer discipline. A `SafeHast` value is constructed or sanitized through approved APIs and is not subsequently modified outside those APIs. Type annotations document and constrain ordinary use; they do not prove safety against casts, foreign code, or mutation through aliases. Runtime freezing and effect checking are not initial requirements.

Conceptual trusted primitives:

```text
text(string)                 -> SafeHast
link(SafeUrl, array<SafeHast>) -> SafeHast
sanitize(Hast)               -> SafeHast
```

The content experiment must choose allowed nodes/properties, URL handling, and renderer behavior. Transformations that may introduce unsafe content must precede sanitization or invalidate the safe designation. Preserve accessibility data such as pH's message role independently of markup.

Function "coloring" is a deferred idea: an annotation could mean that a function preserves rendering safety. Restricting calls alone is insufficient; construction, mutation, callbacks, and FFI access also matter. Revisit only if the value-type contract proves insufficient. Rendering safety does not imply purity, absence of exceptions, or general security.

### Svelte and transport

Svelte owns reactivity, lifecycle, bindings, and component composition. ReScript-derived calculations remain ordinary functions. A small `RichText` component can consume `SafeHast`; an optional local snippet adapter must not become the shared representation.

SvelteKit handlers can consume an interop API and expose it through native remote functions. Transport is a separate contract: safe rendering does not guarantee serializability, and arbitrary HAST extensions need not be transportable. A remote integration must define and verify its transportable subset.

When both operations are needed, they occur in sequence:

```text
ReScript value
  -> Mog transmutation (toTS adapter)
  -> TypeScript-friendly value
  -> SvelteKit transport (server/client serialization)
  -> browser
```

pH currently uses static deployment and prerendering. Runtime remote-function experiments belong in a separate server-capable fixture, not in pH's manual proof. Do not add devalue to the core merely because Kit uses it.

## Success criteria

The manual milestone is complete when:

- A concrete ReScript API returning `promise<result<option<User.t>, LookupError.t>>` has a typed public `Promise<Result<Option<User>, LookupError>>` boundary.
- A TS consumer narrows the Result and Option branches without inspecting compiler tags or importing Wellcrafted.
- Both directions preserve nested absence, nullable/undefined option payloads, and supported nested Result payloads.
- One custom domain adapter composes into a larger boundary, with the manual composition visible.
- An adapted callback fixture demonstrates direction reversal, and missing capabilities fail clearly.
- pH's clipboard operation keeps its Result internal and returns feedback whose masked password can be styled separately; existing ergonomic genType APIs remain a comparison baseline.
- A dedicated bidirectional Result fixture covers outbound conversion, actual TS branch inspection, and inbound conversion. Outbound-only view and inbound-only input examples require no unused inverse capability.
- Unsupported cases are rejected or explicitly delegated to a custom boundary. No broad automatic derivation is implied.

The later content milestone succeeds when ReScript-authored rich text can render safely in Svelte without React, using a documented construction/sanitization contract. Evaluate it independently of code generation and remote functions.

## References and related projects

| Reference | What to reuse or compare |
| --- | --- |
| [ReScript TypeScript integration / genType](https://rescript-lang.org/docs/manual/typescript-integration/) | Baseline public types and existing representation support. Verify against the pinned compiler. |
| [ReScript options](https://rescript-lang.org/docs/manual/null-undefined-option/) | Source semantics; nested absence must survive conversion. |
| [Wellcrafted](https://github.com/wellcrafted-dev/wellcrafted) | Structural Result and tagged-error conventions, without a required consumer dependency. |
| [Sury, formerly ReScript Schema](https://github.com/DZakh/sury) | Existing schema, transformation, and serialization approach to compare before adding validation machinery. |
| [ReScript generic JSX](https://rescript-lang.org/docs/manual/jsx/#generic-jsx-transform-jsx-beyond-react-experimental) and [ResX](https://github.com/zth/res-x) | Runtime requirements and an existing use of JSX outside React. |
| [HAST](https://github.com/syntax-tree/hast), [MDAST](https://github.com/syntax-tree/mdast), and [rehype-sanitize](https://github.com/rehypejs/rehype-sanitize) | Shared formats and sanitization policy. |
| [hast-util-to-jsx-runtime](https://github.com/syntax-tree/hast-util-to-jsx-runtime) | Rendering bridge to investigate before building framework glue; compatibility still needs a spike. |
| [SvelteKit remote functions](https://svelte.dev/docs/kit/remote-functions) | Separate handler, validation, and transport boundary. |
| [pH v2 spec](2026-09-06-v2.md) | Host application's architecture and scope; this new project does not supersede it. |
