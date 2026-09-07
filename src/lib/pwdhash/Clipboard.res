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
