type confirmationState =
  | Empty
  | MatchingPrefix
  | ExactMatch
  | Mismatch

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
let confirmationClass = (~password: string, ~confirmation: string): string =>
  switch getConfirmationState(~password, ~confirmation) {
  | Empty => "neutral"
  | MatchingPrefix => "matching-prefix"
  | ExactMatch => "exact-match"
  | Mismatch => "mismatch"
  }
