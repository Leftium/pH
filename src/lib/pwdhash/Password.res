// Generates a PwdHash password, resolving a site address to its realm before calling PwdHash.

type generationError = Realm.resolutionError

let generateForRealm = (~realm: string, ~masterPassword: string): string =>
  PwdHash.generate(~masterPassword, ~realm)

@genType
let generatePassword = (~addressInput: string, ~masterPassword: string): result<string, generationError> => {
  let? Ok(realm) = addressInput->Realm.resolve
  Ok(generateForRealm(~realm, ~masterPassword))
}
