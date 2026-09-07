@val external decodeUriComponent: string => string = "decodeURIComponent"
@val external jsonStringify: string => string = "JSON.stringify"

@genType
let decodeBookmarkletHash = (hash: string): string =>
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
  let script = `window.open(${jsonStringify(generatorUrl)}+'\\x23'+encodeURIComponent(location.href),'_blank','noopener')`
  `javascript:${script}`
}
