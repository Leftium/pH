type resolutionError =
  | MissingAddress
  | InvalidAddress

@module("./RealmParser.js")
@return(nullable)
external parseAddress: string => option<string> = "parseAddress"

@genType
let resolve = (input: string): result<string, resolutionError> =>
  if input->String.trim == "" {
    Error(MissingAddress)
  } else {
    switch parseAddress(input) {
    | Some(domain) => Ok(domain)
    | None => Error(InvalidAddress)
    }
  }
