import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma 7 config: connection URL for Migrate/CLI commands.
// The runtime client gets its connection via the PrismaPg adapter (lib/prisma.ts).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.mjs",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
