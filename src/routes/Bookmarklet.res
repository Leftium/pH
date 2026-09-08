// Creates the pH bookmarklet and decodes the site address it passes back to the generator.

@val external decodeUriComponent: string => string = "decodeURIComponent"
@val external jsonStringify: string => string = "JSON.stringify"

@genType
let decodeAddressFromHash = (hash: string): string =>
  if hash == "" {
    ""
  } else {
    try {
      decodeUriComponent(hash)
    } catch {
    | _ => hash
    }
  }

@genType
let createBookmarkletHref = (generatorUrl: string): string => {
  let bookmarkletScript = `window.open(${jsonStringify(generatorUrl)}+'\\x23'+encodeURIComponent(location.href),'_blank','noopener')`
  `javascript:${bookmarkletScript}`
}
