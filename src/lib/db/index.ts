import { getDatabase } from "@netlify/database";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString =
  process.env.NETLIFY_DATABASE_URL ||
  process.env.DATABASE_URL ||
  process.env.NEON_DATABASE_URL ||
  "postgresql://placeholder:placeholder@localhost:5432/placeholder";

const netlifyDb = getDatabase({ connectionString });
const sql = ("httpClient" in netlifyDb && netlifyDb.httpClient)
  ? netlifyDb.httpClient
  : neon(netlifyDb.connectionString || connectionString);
export const db = drizzle(sql, { schema });

export type Database = typeof db;
