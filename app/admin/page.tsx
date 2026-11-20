import { Badge, Card, EmptyState, PageHeader, StatCard } from "@/components/ui";
import { requireRole } from "@/lib/auth-helpers";
import { formatUSD } from "@/lib/payments";
import { prisma } from "@/lib/prisma";
import { formatDate, formatNumber, timeLeft } from "@/lib/utils";
import type { DealStatus } from "@prisma/client";
import Link from "next/link";

export const dynamic = "force-dynamic";

const DEAL_BADGE_VARIANT: Record<
  DealStatus,
  "warning" | "info" | "neon" | "success" | "muted" | "danger"
> = {
  REQUESTED: "warning",
  ACCEPTED: "info",
  IN_PRODUCTION: "neon",
  DELIVERED: "info",
  PAID: "success",
  DECLINED: "muted",
  CANCELLED: "danger",
  EXPIRED: "muted",
};

function dealStatusLabel(status: DealStatus): string {
  return status
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

const TERMINAL_STATUSES: DealStatus[] = ["DECLINED", "CANCELLED", "EXPIRED"];
const IN_FLIGHT_STATUSES: DealStatus[] = ["ACCEPTED", "IN_PRODUCTION", "DELIVERED"];

function getFortyEightHoursAgo() {
  return new Date(Date.now() - 48 * 60 * 60 * 1000);
}

export default async function AdminOverviewPage() {
  await requireRole("ADMIN");

  const fortyEightHoursAgo = getFortyEightHoursAgo();

  const [
    creatorCount,
    publishedCount,
    pendingVerifications,
    brandCount,
    dealCount,
    volume,
    commissionEarned,
    commissionPending,
    staleRequests,
    latestBookings,
    awaitingVerification,
  ] = await Promise.all([
    prisma.creatorProfile.count(),
    prisma.creatorProfile.count({ where: { isPublished: true } }),
    prisma.creatorProfile.count({ where: { verificationStatus: "PENDING" } }),
    prisma.brandProfile.count(),
    prisma.booking.count(),
    prisma.booking.aggregate({
      where: { status: { notIn: TERMINAL_STATUSES } },
      _sum: { priceCents: true },
    }),
    prisma.booking.aggregate({
      where: { status: "PAID" },
      _sum: { commissionCents: true },
    }),
    prisma.booking.aggregate({
      where: { status: { in: IN_FLIGHT_STATUSES } },
      _sum: { commissionCents: true },
    }),
    // Requests sitting unanswered for over 48 hours.
    prisma.booking.findMany({
      where: { status: "REQUESTED", createdAt: { lt: fortyEightHoursAgo } },
      orderBy: { createdAt: "asc" },
      take: 5,
      include: {
        creator: { select: { displayName: true } },
        brand: { select: { companyName: true } },
      },
    }),
    // Fallback / top-up: the newest bookings of any status.
    prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        creator: { select: { displayName: true } },
        brand: { select: { companyName: true } },
      },
    }),
    prisma.creatorProfile.findMany({
      where: { verificationStatus: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 5,
      include: { user: { select: { email: true } } },
    }),
  ]);

  // Bookings needing attention: stale requests first, topped up with the
  // newest bookings so the list is never empty while deals exist.
  const attentionIds = new Set(staleRequests.map((b) => b.id));
  const attention = [
    ...staleRequests,
    ...latestBookings.filter((b) => !attentionIds.has(b.id)),
  ].slice(0, 5);

  return (
    <div>
      <PageHeader
        eyebrow="Admin Console"
        title="Overview"
        description="Marketplace health, money in flight, and what needs your attention."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total creators" value={formatNumber(creatorCount)} sub="All creator profiles" />
        <StatCard label="Published creators" value={formatNumber(publishedCount)} sub="Live in the directory" />
        <StatCard label="Pending verifications" value={String(pendingVerifications)} sub="Awaiting review" />
        <StatCard label="Total brands" value={formatNumber(brandCount)} sub="Brand accounts" />
        <StatCard label="Total deals" value={formatNumber(dealCount)} sub="All bookings" />
        <StatCard
          label="Total volume"
          value={formatUSD(volume._sum.priceCents ?? 0)}
          sub="Non-cancelled deals"
        />
        <StatCard
          label="Commission earned"
          value={formatUSD(commissionEarned._sum.commissionCents ?? 0)}
          sub="From paid deals"
        />
        <StatCard
          label="Commission pending"
          value={formatUSD(commissionPending._sum.commissionCents ?? 0)}
          sub="Accepted, in production, or delivered"
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl tracking-wide text-white">Needs attention</h2>
            <Link href="/admin/deals" className="text-sm font-medium text-neon-cyan hover:underline">
              All deals
            </Link>
          </div>
          <p className="mb-4 text-xs text-slate-400">
            Requests unanswered for over 48 hours, then the newest bookings.
          </p>

          {attention.length === 0 ? (
            <EmptyState
              title="All clear"
              description="No bookings need attention right now."
            />
          ) : (
            <ul className="divide-y divide-violet-400/10">
              {attention.map((booking) => {
                const countdown = timeLeft(booking.respondBy);
                return (
                  <li key={booking.id}>
                    <Link
                      href={`/dashboard/deals/${booking.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 py-3 transition hover:opacity-90"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white">{booking.title}</p>
                        <p className="mt-0.5 text-sm text-slate-400">
                          {booking.creator.displayName} · {booking.brand.companyName} ·{" "}
                          {formatDate(booking.createdAt)}
                        </p>
                        {booking.status === "REQUESTED" && (
                          <p className="mt-1 text-xs text-amber-300">
                            {countdown.expired
                              ? "Response window expired"
                              : `Response window: ${countdown.label}`}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-display text-xl tracking-wide text-neon-cyan">
                          {formatUSD(booking.priceCents)}
                        </span>
                        <Badge variant={DEAL_BADGE_VARIANT[booking.status]}>
                          {dealStatusLabel(booking.status)}
                        </Badge>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl tracking-wide text-white">Awaiting verification</h2>
            <Link
              href="/admin/creators?verification=PENDING"
              className="text-sm font-medium text-neon-cyan hover:underline"
            >
              Review all
            </Link>
          </div>

          {awaitingVerification.length === 0 ? (
            <EmptyState
              title="No pending verifications"
              description="Every creator has been reviewed."
            />
          ) : (
            <ul className="divide-y divide-violet-400/10">
              {awaitingVerification.map((creator) => (
                <li key={creator.id} className="py-3">
                  <Link
                    href="/admin/creators?verification=PENDING"
                    className="flex flex-wrap items-center justify-between gap-3 transition hover:opacity-90"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">{creator.displayName}</p>
                      <p className="mt-0.5 truncate text-sm text-slate-400">{creator.user.email}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Joined {formatDate(creator.createdAt)}
                      </p>
                    </div>
                    <Badge variant="warning">Pending</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
