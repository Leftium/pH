// Controls how a generated password is displayed: masked normally and revealed when requested.

let maskPassword = (generatedPassword: string) => {
  let maskedLength = generatedPassword->String.length - 2
  let mask = if maskedLength > 0 { "•"->String.repeat(maskedLength) } else { "" }
  `${generatedPassword->String.slice(~start=0, ~end=2)}${mask}`
}

@genType
let formatGeneratedPassword = (~generatedPassword: option<string>, ~reveal: bool): string =>
  switch generatedPassword {
  | None => ""
  | Some(generatedPassword) if reveal => generatedPassword
  | Some(generatedPassword) => maskPassword(generatedPassword)
  }
