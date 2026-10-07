import "server-only";
import postgres from "postgres";

// One small pool per server instance. On Vercel each function instance keeps
// its own; `prepare: false` keeps it compatible with Neon's pooled endpoint.
const globalForDb = globalThis as unknown as { sql?: postgres.Sql };

export function db(): postgres.Sql {
  if (!globalForDb.sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set. Add it in Vercel > Settings > Environment Variables.");
    globalForDb.sql = postgres(url, {
      max: 3,
      prepare: false,
      idle_timeout: 20,
      connect_timeout: 15,
      // COUNT/SUM come back as strings for bigint/numeric; queries cast them
      // with ::int / ::float8 so they arrive as plain JS numbers.
      transform: { undefined: null },
    });
  }
  return globalForDb.sql;
}
