type generatedPasswordPresentation = {
  value: string,
}

let maskPassword = (password: string) => {
  let maskedLength = password->String.length - 2
  let mask = if maskedLength > 0 { "•"->String.repeat(maskedLength) } else { "" }
  `${password->String.slice(~start=0, ~end=2)}${mask}`
}

@genType
let presentGeneratedPassword = (~password: option<string>, ~isFocused: bool): generatedPasswordPresentation => {
  let value = switch password {
  | None => ""
  | Some(password) if isFocused => password
  | Some(password) => maskPassword(password)
  }
  {value: value}
}
