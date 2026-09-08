// Resolves a user-entered site address to the registrable domain ("realm") used by PwdHash.

type resolutionError =
  | MissingAddress
  | InvalidAddress

type parseOptions = {detectSpecialUse: bool}

type parsedAddress = {
  domain: Nullable.t<string>,
  isIp: bool,
  publicSuffix: Nullable.t<string>,
}

@module("tldts-icann")
external parseAddress: (string, parseOptions) => parsedAddress = "parse"

let extractDomain = addressInput => {
  let trimmedAddress = addressInput->String.trim
  let normalizedAddress = trimmedAddress->String.startsWith("//") ? `https:${trimmedAddress}` : trimmedAddress
  let parsedAddress = parseAddress(normalizedAddress, {detectSpecialUse: true})

  switch (parsedAddress.domain->Nullable.toOption, parsedAddress.publicSuffix->Nullable.toOption) {
  | (Some(_), _) if parsedAddress.isIp => None
  | (Some(_), Some("invalid")) => None
  | (domain, _) => domain
  }
}

@genType
let resolve = (addressInput: string): result<string, resolutionError> =>
  if addressInput->String.trim == "" {
    Error(MissingAddress)
  } else {
    switch extractDomain(addressInput) {
    | Some(domain) => Ok(domain)
    | None => Error(InvalidAddress)
    }
  }
