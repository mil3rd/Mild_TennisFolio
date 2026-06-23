import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("❌  DATABASE_URL is not set in .env.local");
  process.exit(1);
}

const sql = neon(url);

console.log("⏳  Connecting to Neon and creating table…");

try {
  await sql`
    CREATE TABLE IF NOT EXISTS achievements (
      id          SERIAL PRIMARY KEY,
      title       VARCHAR(255) NOT NULL,
      age_group   VARCHAR(20)  NOT NULL,
      category    VARCHAR(100),
      event_date  DATE         NOT NULL,
      award       VARCHAR(255) NOT NULL,
      description TEXT,
      images      TEXT[],
      created_at  TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log("✅  Table 'achievements' is ready.");

  await sql`
    CREATE TABLE IF NOT EXISTS images (
      id           TEXT PRIMARY KEY,
      content_type VARCHAR(100) NOT NULL,
      data         TEXT         NOT NULL,
      created_at   TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log("✅  Table 'images' is ready.");
} catch (err) {
  console.error("❌  Failed:", err instanceof Error ? err.message : err);
  process.exit(1);
}
