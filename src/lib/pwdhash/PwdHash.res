// Wraps the legacy PwdHash implementation behind a small ReScript API.

type hashedPassword

@module("./legacy/hashed-password.js")
@new
external makeHashedPassword: (string, string) => hashedPassword = "SPH_HashedPassword"

@send
external toString: hashedPassword => string = "toString"

let generate = (~masterPassword: string, ~realm: string): string =>
  makeHashedPassword(masterPassword, realm)->toString
