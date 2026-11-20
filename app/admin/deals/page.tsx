import { Badge, Card, EmptyState, PageHeader, StatCard } from "@/components/ui";
import { requireRole } from "@/lib/auth-helpers";
import { formatUSD, paymentStatusLabel } from "@/lib/payments";
import { prisma } from "@/lib/prisma";
import { cn, formatDate } from "@/lib/utils";
import type { DealStatus, PaymentStatus } from "@prisma/client";
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

const PAYMENT_BADGE_VARIANT: Record<PaymentStatus, "muted" | "warning" | "success"> = {
  NOT_STARTED: "muted",
  PENDING: "warning",
  CONFIRMED: "success",
};

function dealStatusLabel(status: DealStatus): string {
  return status
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

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

export default async function AdminDealsPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  await requireRole("ADMIN");

  const params = await searchParams;
  const filter = params?.status;
  const activeStatus: DealStatus | "ALL" = DEAL_STATUSES.includes(filter as DealStatus)
    ? (filter as DealStatus)
    : "ALL";

  const where = activeStatus === "ALL" ? undefined : { status: activeStatus };

  const [bookings, totals] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        creator: { select: { displayName: true } },
        brand: { select: { companyName: true } },
        package: { select: { title: true } },
      },
    }),
    prisma.booking.aggregate({
      where,
      _sum: { priceCents: true, commissionCents: true },
      _count: { id: true },
    }),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Admin Console"
        title="Deals"
        description="Every booking on the platform, with volume and commission for the filtered set."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Deals" value={String(totals._count.id)} sub={activeStatus === "ALL" ? "All deals" : dealStatusLabel(activeStatus)} />
        <StatCard label="Volume" value={formatUSD(totals._sum.priceCents ?? 0)} sub="Filtered set" />
        <StatCard
          label="Commission"
          value={formatUSD(totals._sum.commissionCents ?? 0)}
          sub="Filtered set"
        />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/admin/deals"
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium transition",
            activeStatus === "ALL"
              ? "bg-gradient-to-r from-neon-pink/25 to-neon-purple/25 text-white ring-1 ring-neon-pink/50"
              : "text-slate-400 hover:bg-white/5 hover:text-white",
          )}
        >
          All
        </Link>
        {DEAL_STATUSES.map((status) => (
          <Link
            key={status}
            href={`/admin/deals?status=${status}`}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition",
              activeStatus === status
                ? "bg-gradient-to-r from-neon-pink/25 to-neon-purple/25 text-white ring-1 ring-neon-pink/50"
                : "text-slate-400 hover:bg-white/5 hover:text-white",
            )}
          >
            {dealStatusLabel(status)}
          </Link>
        ))}
      </div>

      {bookings.length === 0 ? (
        <EmptyState
          title="No deals found"
          description={
            activeStatus === "ALL"
              ? "No bookings exist yet."
              : `No deals with ${dealStatusLabel(activeStatus)} status.`
          }
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-violet-400/15 text-xs tracking-wider text-slate-400 uppercase">
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Creator</th>
                <th className="px-5 py-3 font-semibold">Brand</th>
                <th className="px-5 py-3 font-semibold">Title / Package</th>
                <th className="px-5 py-3 text-right font-semibold">Price</th>
                <th className="px-5 py-3 text-right font-semibold">Commission</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Payment</th>
                <th className="px-5 py-3 font-semibold">Deal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-violet-400/10">
              {bookings.map((booking) => (
                <tr key={booking.id} className="transition hover:bg-white/[0.03]">
                  <td className="px-5 py-3 whitespace-nowrap text-slate-400">
                    {formatDate(booking.createdAt)}
                  </td>
                  <td className="px-5 py-3 font-medium text-white">{booking.creator.displayName}</td>
                  <td className="px-5 py-3 text-slate-300">{booking.brand.companyName}</td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-100">{booking.title}</p>
                    {booking.package && (
                      <p className="text-xs text-slate-500">{booking.package.title}</p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-neon-cyan">
                    {formatUSD(booking.priceCents)}
                  </td>
                  <td className="px-5 py-3 text-right text-slate-300">
                    {formatUSD(booking.commissionCents)}
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={DEAL_BADGE_VARIANT[booking.status]}>
                      {dealStatusLabel(booking.status)}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={PAYMENT_BADGE_VARIANT[booking.paymentStatus]}>
                      {paymentStatusLabel(booking.paymentStatus)}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/dashboard/deals/${booking.id}`}
                      className="font-medium text-neon-cyan hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
