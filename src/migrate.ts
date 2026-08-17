/**
 * Database migration script — uses Neon's HTTP driver, no WebSocket needed.
 * Run with: npx tsx src/migrate.ts
 *
 * This applies all pending migrations from the /drizzle folder.
 * Neon recommends using the direct (non-pooled) URL for migrations.
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { config } from "dotenv";

config({ path: ".env.local" });

const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) {
  console.error("❌  DATABASE_URL is not set in .env.local");
  process.exit(1);
}

// Strip the PgBouncer pooler suffix for migrations, as Neon recommends.
function toDirectUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hostname = u.hostname.replace(/-pooler/, "");
    u.searchParams.delete("channel_binding");
    return u.toString();
  } catch {
    return url;
  }
}

const directUrl = toDirectUrl(rawUrl);
const sql = neon(directUrl);
const db  = drizzle(sql);

async function main() {
  console.log("🔄  Running migrations…");
  try {
    await migrate(db, { migrationsFolder: "drizzle" });
    console.log("✅  Migrations complete.");
  } catch (err) {
    console.error("❌  Migration failed:", err);
    process.exit(1);
  }
}

main();
