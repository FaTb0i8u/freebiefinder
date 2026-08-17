import type { Config } from "drizzle-kit";
import { config } from "dotenv";
import { neonConfig } from "@neondatabase/serverless";

// drizzle-kit doesn't load .env.local automatically (that's a Next.js convention)
config({ path: ".env.local" });

// Node 22+ ships native WebSocket. Wire it into @neondatabase/serverless so
// drizzle-kit can connect without needing the `ws` package installed.
neonConfig.webSocketConstructor = globalThis.WebSocket;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in .env.local");
}

/**
 * drizzle-kit migrations need a DIRECT Neon connection — not the pooled one.
 * Neon pooler URLs contain "-pooler" in the hostname and use PgBouncer,
 * which blocks DDL statements. Strip the pooler suffix and remove
 * `channel_binding=require` (not supported by all drivers) for local migrations.
 */
function getDirectUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hostname = u.hostname.replace(/-pooler/, "");
    u.searchParams.delete("channel_binding");
    return u.toString();
  } catch {
    return url; // fall back to original if URL parsing fails
  }
}

export default {
  schema:  "./src/db/schema.ts",
  out:     "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: getDirectUrl(process.env.DATABASE_URL),
  },
} satisfies Config;
