# ReScript `->`: Functions That Read Like Method Chains

ReScript's pipe operator lets standalone functions read from left to right, much like a method chain. Epicenter's [`persisted-auth-storage.ts`](https://github.com/EpicenterHQ/epicenter/blob/ecba0242f6fadec4a69e0be0ff66a245b117cdb7/packages/auth/src/persisted-auth-storage.ts#L28-L43) provides a small example.

## TypeScript

Epicenter parses stored authentication data with nested function calls:

```ts
return PersistedAuth.assert(JSON.parse(raw));
```

The expression runs from the inside out:

```text
raw
-> JSON.parse
-> PersistedAuth.assert
```

Serialization reverses the flow: validate the value, then stringify it.

```ts
return JSON.stringify(PersistedAuth.assert(value));
```

## ReScript

ReScript's `->` operator writes these transformations in the order they run:

```rescript
raw
->JSON.parseOrThrow
->PersistedAuth.assert
```

The ReScript version can express that order directly:

```rescript
value
->PersistedAuth.assert
->JSON.stringify
```

`->` passes the value on its left as the first argument to the function on its right:

```rescript
raw->JSON.parseOrThrow
```

is equivalent to:

```rescript
JSON.parseOrThrow(raw)
```

For multiple steps, each result becomes the first argument to the next function. The parsing pipeline is equivalent to this nested call:

```rescript
PersistedAuth.assert(JSON.parseOrThrow(raw))
```

TypeScript can get the same left-to-right appearance when APIs provide methods:

```ts
text.trim().toLowerCase()
```

But `JSON.parse` and `PersistedAuth.assert` are independent functions from unrelated modules. There is no natural method chain:

```ts
// Not possible without introducing a wrapper API:
raw.parse().assert()
```

In ReScript, `JSON.parseOrThrow` and `PersistedAuth.assert` remain ordinary functions in separate modules. The pipe changes how they are called, not how the APIs are organized.
