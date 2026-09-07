type copyError =
  | CopyFailed

type writeText = string => promise<unit>

@genType
let copyToClipboard: (writeText, string) => promise<result<unit, copyError>> = async (writeText, text) => {
  try {
    await writeText(text)
    Ok()
  } catch {
  | _ => Error(CopyFailed)
  }
}

@genType
let presentCopyFeedback = (result: result<unit, copyError>, password: string): string => {
  let maskedPassword = GeneratedPassword.maskPassword(password)
  switch result {
  | Ok() => `Copied ${maskedPassword}.`
  | Error(CopyFailed) => `Could not copy ${maskedPassword}. Try again.`
  }
}
