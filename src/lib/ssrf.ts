import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

// Hostnames that cloud providers expose on the link-local 169.254.169.254
// address. We match against these textually in addition to the numeric
// check below so we catch cases where the attacker provides the name
// directly (even though DNS resolution should catch those too).
const BLOCKED_HOSTNAMES = new Set([
  "metadata.google.internal",
  "metadata",
  "instance-data",
  "instance-data.ec2.internal",
]);

// RFC-1918 / loopback / link-local / CGNAT / multicast / reserved ranges.
// We check numerically against the resolved IP so that DNS redirection
// (e.g. `myhost.example.com` -> `10.0.0.1`) is caught.
export function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".").map((n) => Number(n));
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return true;
  const [a, b] = parts;
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // 127.0.0.0/8 loopback
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
  if (a >= 224) return true; // multicast + reserved
  return false;
}

export function isPrivateIpv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::" || lower === "::1") return true;
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // ULA fc00::/7
  if (lower.startsWith("fe80:")) return true; // link-local fe80::/10
  if (lower.startsWith("ff")) return true; // multicast
  if (lower.startsWith("::ffff:")) {
    // IPv4-mapped IPv6 — validate the IPv4 part.
    const v4 = lower.slice("::ffff:".length);
    return isPrivateIpv4(v4);
  }
  return false;
}

export class SsrfBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SsrfBlockedError";
  }
}

// Validates that a fully-parseable URL points to a public internet host.
// Throws `SsrfBlockedError` on anything private, loopback, link-local,
// cloud-metadata, or non-http(s).
export async function assertPublicUrl(raw: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new SsrfBlockedError("Invalid URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new SsrfBlockedError(`Unsupported scheme: ${parsed.protocol}`);
  }
  const host = parsed.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!host) throw new SsrfBlockedError("Missing hostname");
  if (BLOCKED_HOSTNAMES.has(host)) {
    throw new SsrfBlockedError(`Blocked hostname: ${host}`);
  }

  // If it's already an IP literal, validate it directly — no DNS needed.
  const ipKind = isIP(host);
  if (ipKind === 4) {
    if (isPrivateIpv4(host)) {
      throw new SsrfBlockedError(`Blocked private IPv4: ${host}`);
    }
    return;
  }
  if (ipKind === 6) {
    if (isPrivateIpv6(host)) {
      throw new SsrfBlockedError(`Blocked private IPv6: ${host}`);
    }
    return;
  }

  // Hostnames must contain a dot. Keep legacy check for defensive depth.
  if (!host.includes(".")) {
    throw new SsrfBlockedError(`Invalid hostname: ${host}`);
  }

  // Resolve all A/AAAA records and reject if any of them are private —
  // this catches `evil.example.com -> 169.254.169.254` DNS tricks.
  let addrs: { address: string; family: number }[];
  try {
    addrs = await lookup(host, { all: true });
  } catch {
    throw new SsrfBlockedError(`DNS resolution failed for ${host}`);
  }
  for (const { address, family } of addrs) {
    const bad =
      family === 4 ? isPrivateIpv4(address) : isPrivateIpv6(address);
    if (bad) {
      throw new SsrfBlockedError(
        `Host ${host} resolves to blocked address ${address}`
      );
    }
  }
}
