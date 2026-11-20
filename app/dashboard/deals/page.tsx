import { CountdownChip } from "@/components/countdown-chip";
import { DealStatusBadge, DEAL_STATUS_LABELS } from "@/components/deal-timeline";
import { buttonClasses, EmptyState, PageHeader } from "@/components/ui";
import { expireStaleBookings } from "@/lib/actions/bookings";
import { requireSession } from "@/lib/auth-helpers";
import { packageTypeLabel } from "@/lib/constants";
import { formatUSD } from "@/lib/payments";
import { prisma } from "@/lib/prisma";
import { cn, formatDate } from "@/lib/utils";
import type { DealStatus, Prisma } from "@prisma/client";
import Link from "next/link";

export const dynamic = "force-dynamic";

const DEAL_STATUSES: DealStatus[] = [
  "REQUESTED",
  "ACCEPTED",
  "IN_PRODUCTION",
  "DELIVERED",
  "PAID",
  "DECLINED",
  "CANCELLED",
  "EXPIRED",
];

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  const session = await requireSession();
  const { status: statusParam } = await searchParams;
  const rawStatus = Array.isArray(statusParam) ? statusParam[0] : statusParam;
  const statusFilter: DealStatus | undefined =
    rawStatus && (DEAL_STATUSES as string[]).includes(rawStatus)
      ? (rawStatus as DealStatus)
      : undefined;

  // Lazy expiry: requests past their 72h window become EXPIRED before rendering.
  await expireStaleBookings();

  const where: Prisma.BookingWhereInput = {
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(session.user.role === "CREATOR"
      ? { creator: { userId: session.user.id } }
      : session.user.role === "BRAND"
        ? { brand: { userId: session.user.id } }
        : {}),
  };

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      creator: { select: { id: true, displayName: true } },
      brand: { select: { companyName: true } },
      package: { select: { type: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const isAdmin = session.user.role === "ADMIN";
  const isCreator = session.user.role === "CREATOR";

  return (
    <div>
      <PageHeader
        eyebrow="Dashboard"
        title="Deals"
        description={
          isCreator
            ? "Booking requests from brands, and every deal in your pipeline."
            : isAdmin
              ? "Every deal on the platform."
              : "Your booking requests and every deal in your pipeline."
        }
        actions={
          !isCreator && (
            <Link href="/creators" className={buttonClasses("primary", "md")}>
              Find creators
            </Link>
          )
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/dashboard/deals"
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
            !statusFilter
              ? "border-neon-pink/60 bg-neon-pink/15 text-white"
              : "border-white/10 bg-night-800 text-slate-300 hover:border-neon-pink/40",
          )}
        >
          All
        </Link>
        {DEAL_STATUSES.map((status) => (
          <Link
            key={status}
            href={`/dashboard/deals?status=${status}`}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
              statusFilter === status
                ? "border-neon-pink/60 bg-neon-pink/15 text-white"
                : "border-white/10 bg-night-800 text-slate-300 hover:border-neon-pink/40",
            )}
          >
            {DEAL_STATUS_LABELS[status]}
          </Link>
        ))}
      </div>

      {bookings.length === 0 ? (
        <EmptyState
          title={statusFilter ? `No ${DEAL_STATUS_LABELS[statusFilter].toLowerCase()} deals` : "No deals yet"}
          description={
            statusFilter
              ? "Try a different status filter."
              : isCreator
                ? "When a brand sends you a booking request, it will show up here."
                : "Browse creators and send your first booking request."
          }
          action={
            !isCreator &&
            !statusFilter && (
              <Link href="/creators" className={buttonClasses("primary", "md")}>
                Browse creators
              </Link>
            )
          }
        />
      ) : (
        <ul className="space-y-4">
          {bookings.map((booking) => (
            <li key={booking.id}>
              <Link
                href={`/dashboard/deals/${booking.id}`}
                className="block rounded-2xl border border-violet-400/15 bg-night-800/80 p-5 transition-all hover:border-neon-pink/50 hover:shadow-[0_0_28px_rgba(255,46,147,0.18)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-white">{booking.title}</h2>
                    <p className="mt-0.5 text-sm text-slate-400">
                      {isAdmin
                        ? `${booking.brand.companyName} → ${booking.creator.displayName}`
                        : isCreator
                          ? booking.brand.companyName
                          : booking.creator.displayName}
                      {booking.package && (
                        <span className="text-slate-500">
                          {" · "}
                          {packageTypeLabel(booking.package.type)}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <DealStatusBadge status={booking.status} />
                    {booking.status === "REQUESTED" && (
                      <CountdownChip respondBy={booking.respondBy} />
                    )}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  <span className="text-slate-400">
                    Price{" "}
                    <span className="font-semibold text-slate-100">
                      {formatUSD(booking.priceCents)}
                    </span>
                  </span>
                  <span className="text-slate-400">
                    Commission{" "}
                    <span className="font-semibold text-slate-100">
                      {formatUSD(booking.commissionCents)} ({booking.commissionRate}%)
                    </span>
                  </span>
                  <span className="text-slate-500">{formatDate(booking.createdAt)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
