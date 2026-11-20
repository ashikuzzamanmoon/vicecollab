import { cache } from "react";
import { prisma } from "@/lib/prisma";

/** Fallback commission rate (percent) used when no setting row exists yet. */
export const DEFAULT_COMMISSION_RATE = 15;

/**
 * Current platform commission rate (percent). Admin-configurable via the
 * PlatformSetting row (id 1). Falls back to the default if the database
 * is unreachable (e.g. during a build with no DATABASE_URL).
 */
export const getCommissionRate = cache(async (): Promise<number> => {
  try {
    const setting = await prisma.platformSetting.findUnique({ where: { id: 1 } });
    return setting?.commissionRate ?? DEFAULT_COMMISSION_RATE;
  } catch {
    return DEFAULT_COMMISSION_RATE;
  }
});
