type confirmationState =
  | Empty
  | MatchingPrefix
  | ExactMatch
  | Mismatch

type confirmationPresentation = {
  className: string,
  message: option<string>,
  ariaInvalid: option<bool>,
}

@genType
let getConfirmationState = (~password: string, ~confirmation: string): confirmationState =>
  if confirmation == "" {
    Empty
  } else if confirmation == password {
    ExactMatch
  } else if password->String.startsWith(confirmation) {
    MatchingPrefix
  } else {
    Mismatch
  }

@genType
let presentConfirmation = (~password: string, ~confirmation: string): confirmationPresentation =>
  switch getConfirmationState(~password, ~confirmation) {
  | Empty => {className: "neutral", message: None, ariaInvalid: None}
  | MatchingPrefix => {className: "matching-prefix", message: Some("Passwords match so far."), ariaInvalid: None}
  | ExactMatch => {className: "exact-match", message: Some("Passwords match."), ariaInvalid: Some(false)}
  | Mismatch => {className: "mismatch", message: Some("Passwords do not match."), ariaInvalid: Some(true)}
  }
