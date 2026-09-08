// Copies a generated password through an injected clipboard writer and formats copy-result feedback.

type copyError =
  | CopyFailed

type writeText = string => promise<unit>

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
let formatCopyFeedback = (copyResult: result<unit, copyError>, generatedPassword: string): string => {
  let maskedPassword = GeneratedPassword.maskPassword(generatedPassword)
  switch copyResult {
  | Ok() => `Copied ${maskedPassword}.`
  | Error(CopyFailed) => `Could not copy ${maskedPassword}. Try again.`
  }
}
