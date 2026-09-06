type formPresentation = {
  generatedPassword: option<string>,
  resolvedDomain: option<string>,
  domainError: option<string>,
  passwordError: option<string>,
}

@genType
let presentForm = (~domainInput: string, ~password: string, ~hasSubmitted: bool): formPresentation => {
  let realm = Realm.resolve(domainInput)
  let showErrors = hasSubmitted || password != ""
  let resolvedDomain = switch realm {
  | Ok(value) => Some(value)
  | Error(_) => None
  }
  let generatedPassword = switch (realm, password) {
  | (Ok(realm), password) if password != "" => Some(Password.generatePasswordForDomain(~domain=realm, ~password))
  | _ => None
  }
  let domainError = switch realm {
  | Error(MissingAddress) if showErrors => Some("Enter a site address.")
  | Error(InvalidAddress) if showErrors => Some("Enter a valid site address.")
  | _ => None
  }
  let passwordError = if hasSubmitted && password == "" {
    Some("Enter a master password.")
  } else {
    None
  }
  {generatedPassword, resolvedDomain, domainError, passwordError}
}
