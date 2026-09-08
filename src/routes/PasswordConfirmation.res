// Classifies how the confirmation input matches the master password and derives its UI feedback.

type confirmationState =
  | Empty
  | MatchingPrefix
  | ExactMatch
  | Mismatch

type confirmationView = {
  className: string,
  message: option<string>,
  ariaInvalid: option<bool>,
}

@genType
let getConfirmationState = (~masterPassword: string, ~confirmationInput: string): confirmationState =>
  if confirmationInput == "" {
    Empty
  } else if confirmationInput == masterPassword {
    ExactMatch
  } else if masterPassword->String.startsWith(confirmationInput) {
    MatchingPrefix
  } else {
    Mismatch
  }

@genType
let getConfirmationView = (~masterPassword: string, ~confirmationInput: string): confirmationView =>
  switch getConfirmationState(~masterPassword, ~confirmationInput) {
  | Empty => {className: "neutral", message: None, ariaInvalid: None}
  | MatchingPrefix => {className: "matching-prefix", message: Some("Passwords match so far."), ariaInvalid: None}
  | ExactMatch => {className: "exact-match", message: Some("Passwords match."), ariaInvalid: Some(false)}
  | Mismatch => {className: "mismatch", message: Some("Passwords do not match."), ariaInvalid: Some(true)}
  }
