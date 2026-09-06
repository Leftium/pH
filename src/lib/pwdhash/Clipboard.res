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
let copyFeedbackMessage = (result: result<unit, copyError>): string =>
  switch result {
  | Ok(_) => "Copied."
  | Error(CopyFailed) => "Copy failed. Use the generated-password field instead."
  }
