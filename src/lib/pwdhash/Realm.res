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

let parseDomain = input => {
  let address = input->String.trim
  let normalizedAddress = address->String.startsWith("//") ? `https:${address}` : address
  let parsed = parseAddress(normalizedAddress, {detectSpecialUse: true})

  switch (parsed.domain->Nullable.toOption, parsed.publicSuffix->Nullable.toOption) {
  | (Some(_), _) if parsed.isIp => None
  | (Some(_), Some("invalid")) => None
  | (domain, _) => domain
  }
}

@genType
let resolve = (input: string): result<string, resolutionError> =>
  if input->String.trim == "" {
    Error(MissingAddress)
  } else {
    switch parseDomain(input) {
    | Some(domain) => Ok(domain)
    | None => Error(InvalidAddress)
    }
  }
