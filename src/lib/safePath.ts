// Returns `raw` only when it is a safe same-origin relative path.
// Falls back to `fallback` otherwise.
//
// Blocks:
//   - absolute URLs (http:, https:, data:, javascript:, etc.)
//   - protocol-relative URLs ("//evil.com")
//   - anything not starting with "/"
export function safePath(
  raw: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!raw || typeof raw !== "string") return fallback;
  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//")) return fallback;
  // Reject any embedded scheme, including backslash-encoded variants
  // some browsers normalize back to forward-slash before resolving.
  if (raw.includes("\\")) return fallback;
  return raw;
}
