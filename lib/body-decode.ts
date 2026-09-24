// Response bodies are decoded by their declared charset, not by the UTF-8
// default of Response.text(). A windows-125x page decoded as UTF-8 mojibakes
// the title and metadata that the calibrated on-page controls (o1/o4/o5/o8)
// measure, which would publish wrong findings and a wrong score.
//
// Priority follows the WHATWG encoding spec: BOM, then the transport header,
// then the first-1024-byte <meta charset> prescan, then UTF-8.

function charsetFromContentType(contentType: string | null | undefined): string | null {
  const match = /charset\s*=\s*["']?([^"';\s]+)/i.exec(contentType ?? "");
  return match?.[1] ?? null;
}

function sniffBom(bytes: Uint8Array): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) return "utf-8";
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) return "utf-16le";
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) return "utf-16be";
  return null;
}

function sniffMetaCharset(bytes: Uint8Array): string | null {
  // ASCII survives a latin1 read of the prescan window, so byte values are preserved.
  const prefix = Buffer.from(bytes.subarray(0, 1024)).toString("latin1");
  const match = /<meta[^>]{0,512}charset\s*=\s*["']?([^"'>\s;]+)/i.exec(prefix);
  return match?.[1] ?? null;
}

function decodeWith(label: string, bytes: Uint8Array): string {
  try {
    return new TextDecoder(label).decode(bytes);
  } catch {
    // An unknown or malformed charset label must never break the crawl.
    return new TextDecoder("utf-8").decode(bytes);
  }
}

export function decodeBody(body: ArrayBuffer | Uint8Array, contentType: string | null | undefined): string {
  const bytes = body instanceof Uint8Array ? body : new Uint8Array(body);
  const label = sniffBom(bytes) ?? charsetFromContentType(contentType) ?? sniffMetaCharset(bytes) ?? "utf-8";
  return decodeWith(label, bytes);
}
