interface Signature {
  mimeType: string
  bytes: readonly number[]
  /** Byte offset the signature starts at. Defaults to 0. */
  offset?: number
}

// Ordered by how likely an API is to actually return them; checked top to
// bottom, first match wins.
const SIGNATURES: readonly Signature[] = [
  { mimeType: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mimeType: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mimeType: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38] },
  { mimeType: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] },
  { mimeType: 'image/bmp', bytes: [0x42, 0x4d] },
  { mimeType: 'image/x-icon', bytes: [0x00, 0x00, 0x01, 0x00] },
  { mimeType: 'application/gzip', bytes: [0x1f, 0x8b] },
  { mimeType: 'application/zip', bytes: [0x50, 0x4b, 0x03, 0x04] },
  // WEBP is a RIFF container - 'RIFF' at 0, 'WEBP' at 8 (the 4 bytes in
  // between are a file-size field, not part of the signature).
  { mimeType: 'image/webp', bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 }
]
const WEBP_RIFF_HEADER = [0x52, 0x49, 0x46, 0x46]

function matches(data: Uint8Array, bytes: readonly number[], offset = 0): boolean {
  if (data.length < offset + bytes.length) return false

  for (let i = 0; i < bytes.length; i++) {
    if (data[offset + i] !== bytes[i]) return false
  }

  return true
}

/**
 * Detects a binary payload's MIME type from its leading magic bytes -
 * O(1) relative to payload size (inspects at most ~12 bytes, never scans
 * the buffer), synchronous, no dependency. Covers the formats an upload
 * endpoint commonly deals with; returns `undefined` when nothing matches so
 * callers can fall back to `application/octet-stream` themselves.
 */
export function sniffContentType(data: Uint8Array): string | undefined {
  for (const signature of SIGNATURES) {
    if (signature.mimeType === 'image/webp' && !matches(data, WEBP_RIFF_HEADER)) continue
    if (matches(data, signature.bytes, signature.offset)) return signature.mimeType
  }

  return undefined
}
