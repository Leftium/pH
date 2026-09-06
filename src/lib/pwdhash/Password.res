@module("./legacy/generateLegacyPassword.js")
external generateLegacyPassword: (string, string) => string = "generateLegacyPassword"

type generationError = Realm.resolutionError

let generatePasswordForDomain = (~domain: string, ~password: string): string =>
  generateLegacyPassword(password, domain)

@genType
let generatePassword = (~domainInput: string, ~password: string): result<string, generationError> => {
  let? Ok(realm) = Realm.resolve(domainInput)
  Ok(generatePasswordForDomain(~domain=realm, ~password))
}
