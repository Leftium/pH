type formMessage = {
  text: string,
  role: option<string>,
}

type formPresentation = {
  generatedPassword: option<string>,
  domainMessage: formMessage,
  domainAriaInvalid: option<bool>,
  passwordMessage: formMessage,
  passwordAriaInvalid: option<bool>,
}

@genType
let presentForm = (~domainInput: string, ~password: string, ~hasSubmitted: bool): formPresentation => {
  let realm = Realm.resolve(domainInput)
  let showErrors = hasSubmitted || password != ""
  let generatedPassword = switch (realm, password) {
  | (Ok(realm), password) if password != "" => Some(Password.generatePasswordForDomain(~domain=realm, ~password))
  | _ => None
  }
  let domainMessage = switch realm {
  | Error(MissingAddress) if showErrors => {text: "Enter a site address.", role: Some("alert")}
  | Error(InvalidAddress) if showErrors => {text: "Enter a valid site address.", role: Some("alert")}
  | Ok(value) => {text: `Domain: ${value}`, role: None}
  | _ => {text: "Enter a site address.", role: None}
  }
  let passwordMessage = if hasSubmitted && password == "" {
    {text: "Enter a master password.", role: Some("alert")}
  } else {
    {text: "", role: None}
  }
  {
    generatedPassword,
    domainMessage,
    domainAriaInvalid: switch domainMessage.role { | Some(_) => Some(true) | None => None },
    passwordMessage,
    passwordAriaInvalid: switch passwordMessage.role { | Some(_) => Some(true) | None => None},
  }
}
