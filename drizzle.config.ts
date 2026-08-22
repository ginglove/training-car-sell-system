import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/db/schema/index.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.NEON_DATABASE_URL!,
  },
});
