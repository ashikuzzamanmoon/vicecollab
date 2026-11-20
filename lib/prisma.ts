import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Prisma 7: the client connects through a driver adapter. The adapter only
// opens a connection on the first query, so constructing it is safe at
// build time even with a placeholder DATABASE_URL.
function createClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL ?? "",
  });
  return new PrismaClient({ adapter });
}

// Reuse a single PrismaClient in development to avoid exhausting
// connections on hot reloads (standard Next.js pattern).
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
