type resolutionError =
  | MissingAddress
  | InvalidAddress

type parsedAddress = {
  domain: string,
  hostname: string,
}

@module("./RealmParser.js")
@return(nullable)
external parseAddress: string => option<parsedAddress> = "parseAddress"

let realmForParsedAddress = parsed =>
  if parsed.domain == "org.ru" {
    let parts = parsed.hostname->String.split(".")
    let length = parts->Array.length
    if length < 3 {
      None
    } else {
      Some(parts->Array.getUnsafe(length - 3) ++ ".org.ru")
    }
  } else {
    Some(parsed.domain)
  }

@genType
let resolve = (input: string): result<string, resolutionError> =>
  if input->String.trim == "" {
    Error(MissingAddress)
  } else {
    switch parseAddress(input)->Option.flatMap(realmForParsedAddress) {
    | Some(realm) => Ok(realm)
    | None => Error(InvalidAddress)
    }
  }
