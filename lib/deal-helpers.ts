import type { DealStatus } from "@prisma/client";

/**
 * Whether any pipeline action is available for this viewer + status.
 * Pure helper — kept in lib/ (not in a client component file) so server
 * components can call it directly.
 */
export function hasDealActions(
  status: DealStatus,
  isCreator: boolean,
  isBrand: boolean,
): boolean {
  if ((isCreator || isBrand) && (status === "REQUESTED" || status === "ACCEPTED")) return true;
  if (isCreator && (status === "REQUESTED" || status === "ACCEPTED" || status === "IN_PRODUCTION"))
    return true;
  if (isBrand && status === "DELIVERED") return true;
  return false;
}
