// Copies a generated password through an injected clipboard writer and formats copy-result feedback.

type copyError =
  | CopyFailed

type writeText = string => promise<unit>

@genType
type copyFeedback = {
  prefix: string,
  password: string,
  suffix: string,
}

@genType
let copyToClipboard: (writeText, string) => promise<result<unit, copyError>> = async (writeText, generatedPassword) => {
  try {
    await writeText(generatedPassword)
    Ok()
  } catch {
  | _ => Error(CopyFailed)
  }
}

@genType
let formatCopyFeedback = (copyResult: result<unit, copyError>, generatedPassword: string): copyFeedback => {
  let maskedPassword = GeneratedPassword.maskPassword(generatedPassword)
  switch copyResult {
  | Ok() => {prefix: "Copied ", password: maskedPassword, suffix: "."}
  | Error(CopyFailed) => {prefix: "Could not copy ", password: maskedPassword, suffix: ". Try again."}
  }
}
