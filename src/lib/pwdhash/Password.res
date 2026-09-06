@module("./legacy/generateLegacyPassword.js")
external generateLegacyPassword: (string, string) => string = "generateLegacyPassword"

type generationError = DomainExtractor.extractionError

@genType
let generatePassword = (~domainInput: string, ~password: string): result<string, generationError> => {
  let? Ok(domain) = DomainExtractor.extractDomain(domainInput)
  Ok(generateLegacyPassword(password, domain))
}
