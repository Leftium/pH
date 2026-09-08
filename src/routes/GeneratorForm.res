// Derives password-generation and validation data for the Svelte form from the current inputs.

type formMessage = {
  text: string,
  role: option<string>,
}

type formView = {
  generatedPassword: option<string>,
  addressMessage: formMessage,
  addressAriaInvalid: option<bool>,
  passwordMessage: formMessage,
  passwordAriaInvalid: option<bool>,
}

@genType
let getFormView = (~addressInput: string, ~masterPassword: string, ~hasSubmitted: bool): formView => {
  let realm = Realm.resolve(addressInput)
  let showValidationErrors = hasSubmitted || masterPassword != ""
  let generatedPassword = switch (realm, masterPassword) {
  | (Ok(realm), masterPassword) if masterPassword != "" => Some(Password.generateForRealm(~realm, ~masterPassword))
  | _ => None
  }
  let addressMessage = switch realm {
  | Error(MissingAddress) if showValidationErrors => {text: "Enter a site address.", role: Some("alert")}
  | Error(InvalidAddress) if showValidationErrors => {text: "Enter a valid site address.", role: Some("alert")}
  | Ok(value) => {text: `Domain: ${value}`, role: None}
  | _ => {text: "Enter a site address.", role: None}
  }
  let passwordMessage = if hasSubmitted && masterPassword == "" {
    {text: "Enter a master password.", role: Some("alert")}
  } else {
    {text: "", role: None}
  }
  {
    generatedPassword,
    addressMessage,
    addressAriaInvalid: switch addressMessage.role { | Some(_) => Some(true) | None => None },
    passwordMessage,
    passwordAriaInvalid: switch passwordMessage.role { | Some(_) => Some(true) | None => None},
  }
}
