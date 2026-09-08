// Generates a PwdHash password, resolving a site address to its realm before calling the legacy algorithm.

@module("./legacy/generateLegacyPassword.js")
external generateLegacyPassword: (string, string) => string = "generateLegacyPassword"

type generationError = Realm.resolutionError

let generateForRealm = (~realm: string, ~masterPassword: string): string =>
  generateLegacyPassword(masterPassword, realm)

@genType
let generatePassword = (~addressInput: string, ~masterPassword: string): result<string, generationError> => {
  let? Ok(realm) = Realm.resolve(addressInput)
  Ok(generateForRealm(~realm, ~masterPassword))
}
