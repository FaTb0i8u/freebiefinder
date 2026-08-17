import { createHash } from "crypto";

/**
 * One-way hash of an IP address for privacy-preserving rate limiting.
 * We never store raw IPs.
 */
export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

/** Extract the real IP from Next.js request headers. */
export function getIpFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
