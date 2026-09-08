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

let normalizeAddress = address =>
  address->String.startsWith("//") ? `https:${address}` : address

let extractDomain = addressInput => {
  let parsedAddress =
    addressInput
    ->String.trim
    ->normalizeAddress
    ->parseAddress({detectSpecialUse: true})

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
    switch addressInput->extractDomain {
    | Some(domain) => Ok(domain)
    | None => Error(InvalidAddress)
    }
  }
