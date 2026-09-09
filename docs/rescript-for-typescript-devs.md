# Intro to ReScript for TypeScript Developers

This guide explains ReScript through code from [pH](https://github.com/Leftium/pH), a SvelteKit password generator.

---

## 10-second teaser: `option` + pattern matching

Source: [`GeneratedPassword.res:9–15`](https://github.com/Leftium/pH/blob/59242e5bddc137aee3fba4ff6f03bf0a3cae92c2/src/routes/GeneratedPassword.res#L9-L15)

```rescript
@genType
let formatGeneratedPassword = (~generatedPassword: option<string>, ~reveal: bool): string =>
  switch generatedPassword {
  | None => ""
  | Some(generatedPassword) if reveal => generatedPassword
  | Some(generatedPassword) => maskPassword(generatedPassword)
  }
```

<details>
<summary>TypeScript equivalent</summary>

```ts
export function formatGeneratedPassword(
  generatedPassword: string | undefined,
  reveal: boolean
): string {
  if (generatedPassword === undefined) {
    return '';
  }

  if (reveal) {
    return generatedPassword;
  }

  return maskPassword(generatedPassword);
}
```

</details>

**ReScript concepts**

- `option<T>`: a value is explicitly `Some(value)` or `None`.
- Pattern matching: matches a case and unwraps its value at the same time.
- Pattern guard: `if reveal` adds a condition to a matching case.
- Expression-oriented code: the `switch` itself produces the returned value.

The function handles absence where it consumes the value instead of relying on nullish checks elsewhere.

---

## 1. Model UI states explicitly

Source: [`PasswordConfirmation.res:3–34`](https://github.com/Leftium/pH/blob/59242e5bddc137aee3fba4ff6f03bf0a3cae92c2/src/routes/PasswordConfirmation.res#L3-L34)

```rescript
type confirmationState =
  | Empty
  | MatchingPrefix
  | ExactMatch
  | Mismatch

type confirmationView = {
  className: string,
  message: option<string>,
  ariaInvalid: option<bool>,
}

@genType
let getConfirmationState = (~masterPassword: string, ~confirmationInput: string): confirmationState =>
  if confirmationInput == "" {
    Empty
  } else if confirmationInput == masterPassword {
    ExactMatch
  } else if masterPassword->String.startsWith(confirmationInput) {
    MatchingPrefix
  } else {
    Mismatch
  }

@genType
let getConfirmationView = (~masterPassword: string, ~confirmationInput: string): confirmationView =>
  switch getConfirmationState(~masterPassword, ~confirmationInput) {
  | Empty => {className: "neutral", message: None, ariaInvalid: None}
  | MatchingPrefix => {className: "matching-prefix", message: Some("Passwords match so far."), ariaInvalid: None}
  | ExactMatch => {className: "exact-match", message: Some("Passwords match."), ariaInvalid: Some(false)}
  | Mismatch => {className: "mismatch", message: Some("Passwords do not match."), ariaInvalid: Some(true)}
  }
```

<details>
<summary>TypeScript equivalent</summary>

```ts
type ConfirmationState =
  | 'empty'
  | 'matching-prefix'
  | 'exact-match'
  | 'mismatch';

type ConfirmationView = {
  className: string;
  message?: string;
  ariaInvalid?: boolean;
};

function getConfirmationState(
  masterPassword: string,
  confirmationInput: string
): ConfirmationState {
  if (confirmationInput === '') {
    return 'empty';
  } else if (confirmationInput === masterPassword) {
    return 'exact-match';
  } else if (masterPassword.startsWith(confirmationInput)) {
    return 'matching-prefix';
  } else {
    return 'mismatch';
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled confirmation state: ${value}`);
}

export function getConfirmationView(
  masterPassword: string,
  confirmationInput: string
): ConfirmationView {
  const state = getConfirmationState(masterPassword, confirmationInput);

  switch (state) {
    case 'empty':
      return { className: 'neutral' };

    case 'matching-prefix':
      return {
        className: 'matching-prefix',
        message: 'Passwords match so far.'
      };

    case 'exact-match':
      return {
        className: 'exact-match',
        message: 'Passwords match.',
        ariaInvalid: false
      };

    case 'mismatch':
      return {
        className: 'mismatch',
        message: 'Passwords do not match.',
        ariaInvalid: true
      };

    default:
      return assertNever(state);
  }
}
```

</details>

**ReScript concepts**

- Variants: `confirmationState` defines exactly the states that can exist.
- Exhaustive pattern matching: every variant case must be handled.
- Records: related UI data is returned as one typed value.
- `option` fields: optional UI values are represented explicitly as `Some` or `None`.
- Labeled arguments: `~masterPassword` and `~confirmationInput` name the values at each call site.

If you add a confirmation state, the compiler points to every match that needs updating. Each case also keeps its related UI properties together.

---

## 2. Propagate typed failures with `Result`

Source: [`Password.res:8–12`](https://github.com/Leftium/pH/blob/59242e5bddc137aee3fba4ff6f03bf0a3cae92c2/src/lib/pwdhash/Password.res#L8-L12)

```rescript
@genType
let generatePassword = (~addressInput: string, ~masterPassword: string): result<string, generationError> => {
  let? Ok(realm) = addressInput->Realm.resolve
  Ok(generateForRealm(~realm, ~masterPassword))
}
```

<details>
<summary>TypeScript equivalent</summary>

```ts
type Result<T, E> =
  | { data: T; error: null }
  | { data: null; error: E };

type GenerationError = ResolutionError;

export function generatePassword(
  addressInput: string,
  masterPassword: string
): Result<string, GenerationError> {
  const realm = resolve(addressInput);

  if (realm.error !== null) {
    return realm;
  }

  return {
    data: generateForRealm({
      realm: realm.data,
      masterPassword
    }),
    error: null
  };
}
```

</details>

**ReScript concepts**

- `result<T, E>`: success and failure are both explicit in the return type.
- `Ok` / `Error`: the two cases of a `result`.
- `let?`: unwraps the success case and returns the failure case early.
- Type aliases: `generationError` reuses the error type defined by `Realm`.
- Module composition: the function delegates realm resolution and password generation to focused modules.
- `@genType`: exposes a typed boundary that TypeScript can call.

The happy path stays linear, and the return type still tells callers what can fail.

---

## 3. Put a typed boundary around legacy JavaScript

Source: [`PwdHash.res:3–13`](https://github.com/Leftium/pH/blob/59242e5bddc137aee3fba4ff6f03bf0a3cae92c2/src/lib/pwdhash/PwdHash.res#L3-L13)

```rescript
type hashedPassword

@module("./legacy/hashed-password.js")
@new
external makeHashedPassword: (string, string) => hashedPassword = "SPH_HashedPassword"

@send
external toString: hashedPassword => string = "toString"

let generate = (~masterPassword: string, ~realm: string): string =>
  makeHashedPassword(masterPassword, realm)->toString
```

<details>
<summary>TypeScript equivalent</summary>

```ts
import { SPH_HashedPassword as LegacyHashedPassword } from './legacy/hashed-password.js';

type HashedPassword = {
  toString(): string;
};

type HashedPasswordConstructor = new (
  masterPassword: string,
  realm: string
) => HashedPassword;

const SPH_HashedPassword =
  LegacyHashedPassword as unknown as HashedPasswordConstructor;

export function generate(
  masterPassword: string,
  realm: string
): string {
  return new SPH_HashedPassword(masterPassword, realm).toString();
}
```

</details>

**ReScript concepts**

- Opaque types: `hashedPassword` can be used without exposing or depending on its representation.
- `external` bindings: describe an existing JavaScript API instead of rewriting it.
- `@module`: binds to an export from a JavaScript module.
- `@new`: describes a JavaScript constructor call.
- `@send`: describes an instance method call.
- Pipe operator: `->toString` passes the constructed value into the bound method.

This adds a typed ReScript API without changing the legacy JavaScript implementation.

---

## 4. Put the pieces together

Source: [`Realm.res:21–44`](https://github.com/Leftium/pH/blob/59242e5bddc137aee3fba4ff6f03bf0a3cae92c2/src/lib/pwdhash/Realm.res#L21-L44)

```rescript
let extractDomain = addressInput => {
  let parsedAddress =
    addressInput
    ->String.trim
    ->normalizeAddress
    ->parseAddress({detectSpecialUse: true})

  switch (parsedAddress.domain->Nullable.toOption, parsedAddress.publicSuffix->Nullable.toOption) {
  | (Some(_), _) if parsedAddress.isIp => None
  | (Some(_), Some("invalid")) => None
  | (domain, _) => domain
  }
}

@genType
let resolve = (addressInput: string): result<string, resolutionError> =>
  if addressInput->String.trim == "" {
    Error(MissingAddress)
  } else {
    switch addressInput->extractDomain {
    | Some(domain) => Ok(domain)
    | None => Error(InvalidAddress)
    }
  }
```

<details>
<summary>TypeScript equivalent</summary>

```ts
type ResolutionError =
  | 'MissingAddress'
  | 'InvalidAddress';

type Result<T, E> =
  | { data: T; error: null }
  | { data: null; error: E };

function extractDomain(addressInput: string): string | undefined {
  const parsedAddress = parseAddress(
    normalizeAddress(addressInput.trim()),
    { detectSpecialUse: true }
  );

  if (parsedAddress.domain !== null && parsedAddress.isIp) {
    return undefined;
  }

  if (
    parsedAddress.domain !== null &&
    parsedAddress.publicSuffix === 'invalid'
  ) {
    return undefined;
  }

  return parsedAddress.domain ?? undefined;
}

export function resolve(
  addressInput: string
): Result<string, ResolutionError> {
  if (addressInput.trim() === '') {
    return { data: null, error: 'MissingAddress' };
  }

  const domain = extractDomain(addressInput);

  if (domain === undefined) {
    return { data: null, error: 'InvalidAddress' };
  }

  return { data: domain, error: null };
}
```

</details>

**ReScript concepts**

- Pipe operator: expresses a data-transformation sequence from left to right.
- `Nullable.toOption`: converts a nullable JavaScript value into a ReScript `option`.
- Tuple pattern matching: matches two values together without nested conditionals.
- Wildcards: `_` means that part of the matched value is irrelevant.
- Pattern guards: add conditions such as `if parsedAddress.isIp`.
- `Option` + `Result`: internal absence uses `option`; the public API gives callers a reason for failure.
- Typed JavaScript interop: an external parser can feed values into typed ReScript code.

`extractDomain` converts the parser's nullable output to an `option`. `resolve` then turns `None` into a typed application error.

---

You can introduce ReScript without rewriting the rest of the application. In pH, small ReScript modules handle domain logic and JavaScript interop, while the SvelteKit UI remains in TypeScript.
