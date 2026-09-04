import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const dbUrl =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL ||
  process.env.NEON_DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.NETLIFY_DATABASE_URL;

if (!dbUrl) {
  console.error("❌ Error: DATABASE_URL or NEON_DATABASE_URL is not set in environment.");
  process.exit(1);
}


const sql = neon(dbUrl);

async function resetDatabase() {
  console.log("🔥 Clean Database Reset: Wiping public schema cleanly on Neon Cloud...");
  try {
    await sql`DROP SCHEMA IF EXISTS public CASCADE;`;
    await sql`CREATE SCHEMA public;`;
    console.log("✨ Public schema recreated 100% clean! 0 tables remain.");
  } catch (e: any) {
    console.error("❌ Reset error:", e.message);
  }
  process.exit(0);
}

resetDatabase().catch((err) => {
  console.error("❌ Reset failed:", err);
  process.exit(1);
});
