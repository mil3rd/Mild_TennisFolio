import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.local" });

// Parse the DATABASE_URL so we can pass ssl options explicitly.
// pg v8 on Windows treats sslmode=require as verify-full (strict cert check),
// which fails against Neon. Splitting the URL and setting ssl manually avoids this.
const raw = process.env.DATABASE_URL;
if (!raw) throw new Error("DATABASE_URL is not set in .env.local");

const u = new URL(raw);

export default defineConfig({
  schema: "./lib/db.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host: u.hostname,
    port: u.port ? Number(u.port) : 5432,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ""),
    ssl: { rejectUnauthorized: false },
  },
});
