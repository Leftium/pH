type generatedPasswordPresentation = {
  value: string,
}

@genType
let presentGeneratedPassword = (~password: option<string>, ~isFocused: bool): generatedPasswordPresentation => {
  let value = switch password {
  | None => ""
  | Some(password) if isFocused => password
  | Some(password) => {
      let maskedLength = password->String.length - 2
      let mask = if maskedLength > 0 { "•"->String.repeat(maskedLength) } else { "" }
      `${password->String.slice(~start=0, ~end=2)}${mask}`
    }
  }
  {value: value}
}
