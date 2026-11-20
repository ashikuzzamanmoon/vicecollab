import { Badge, buttonClasses, Card, EmptyState, PageHeader, StatCard } from "@/components/ui";
import { requireSession } from "@/lib/auth-helpers";
import { formatUSD } from "@/lib/payments";
import { prisma } from "@/lib/prisma";
import { formatDate, formatNumber, timeLeft } from "@/lib/utils";
import type { DealStatus } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

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

const ACTIVE_STATUSES: DealStatus[] = ["ACCEPTED", "IN_PRODUCTION", "DELIVERED"];

export default async function DashboardPage() {
  const session = await requireSession();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { creatorProfile: true, brandProfile: true },
  });

  if (!user) redirect("/login");

  // Onboarding guard: creators and brands need a profile before using the dashboard.
  if (user.role === "CREATOR" && !user.creatorProfile) redirect("/onboarding");
  if (user.role === "BRAND" && !user.brandProfile) redirect("/onboarding");

  if (user.role === "ADMIN") return <AdminSummary />;
  if (user.role === "CREATOR" && user.creatorProfile) {
    return <CreatorOverview profileId={user.creatorProfile.id} />;
  }
  if (user.role === "BRAND" && user.brandProfile) {
    return <BrandOverview profileId={user.brandProfile.id} />;
  }

  return (
    <EmptyState
      title="Profile not found"
      description="We could not load your profile. Try signing in again."
    />
  );
}

/* ------------------------------------------------------------------ */
/* Creator overview                                                    */
/* ------------------------------------------------------------------ */

async function CreatorOverview({ profileId }: { profileId: string }) {
  const [paid, pendingCount, activeCount, rating, latest, profile] = await Promise.all([
    prisma.booking.aggregate({
      where: { creatorId: profileId, status: "PAID" },
      _sum: { priceCents: true, commissionCents: true },
    }),
    prisma.booking.count({ where: { creatorId: profileId, status: "REQUESTED" } }),
    prisma.booking.count({
      where: { creatorId: profileId, status: { in: ACTIVE_STATUSES } },
    }),
    prisma.review.aggregate({ where: { creatorId: profileId }, _avg: { rating: true } }),
    prisma.booking.findMany({
      where: { creatorId: profileId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { brand: { select: { companyName: true } } },
    }),
    prisma.creatorProfile.findUnique({
      where: { id: profileId },
      select: { isPublished: true },
    }),
  ]);

  const earningsCents =
    (paid._sum.priceCents ?? 0) - (paid._sum.commissionCents ?? 0);
  const avgRating = rating._avg.rating;

  return (
    <div>
      <PageHeader
        eyebrow="Creator Dashboard"
        title="Overview"
        description="Your earnings, requests, and active deals at a glance."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total earnings" value={formatUSD(earningsCents)} sub="Paid deals, after commission" />
        <StatCard label="Pending requests" value={String(pendingCount)} sub="Awaiting your response" />
        <StatCard label="Active deals" value={String(activeCount)} sub="Accepted, in production, or delivered" />
        <StatCard
          label="Average rating"
          value={avgRating ? `${avgRating.toFixed(1)} / 5` : "—"}
          sub={avgRating ? "From brand reviews" : "No reviews yet"}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl tracking-wide text-white">Latest requests</h2>
            <Link href="/dashboard/deals" className="text-sm font-medium text-neon-cyan hover:underline">
              View all deals
            </Link>
          </div>

          {latest.length === 0 ? (
            <EmptyState
              title="No requests yet"
              description="When a brand books you, their request will show up here."
            />
          ) : (
            <ul className="divide-y divide-violet-400/10">
              {latest.map((booking) => {
                const countdown = timeLeft(booking.respondBy);
                return (
                  <li key={booking.id}>
                    <Link
                      href={`/dashboard/deals/${booking.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 py-4 transition hover:opacity-90"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white">{booking.title}</p>
                        <p className="mt-0.5 text-sm text-slate-400">
                          {booking.brand.companyName} · {formatDate(booking.createdAt)}
                        </p>
                        {booking.status === "REQUESTED" && (
                          <p className="mt-1 text-xs text-amber-300">
                            {countdown.expired
                              ? "Response window expired"
                              : `Respond within ${countdown.label}`}
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
          <h2 className="font-display mb-4 text-2xl tracking-wide text-white">Quick links</h2>
          <div className="flex flex-col gap-3">
            <Link href="/dashboard/profile" className={buttonClasses("secondary", "md", "w-full")}>
              Edit profile
            </Link>
            <Link href="/dashboard/deals" className={buttonClasses("secondary", "md", "w-full")}>
              View all deals
            </Link>
            {profile?.isPublished && (
              <Link
                href={`/creators/${profileId}`}
                className={buttonClasses("secondary", "md", "w-full")}
              >
                View public profile
              </Link>
            )}
            <Link href="/creators" className={buttonClasses("ghost", "md", "w-full")}>
              Browse the directory
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Brand overview                                                      */
/* ------------------------------------------------------------------ */

async function BrandOverview({ profileId }: { profileId: string }) {
  const [totalCount, activeCount, paid, completedCount, latest] = await Promise.all([
    prisma.booking.count({ where: { brandId: profileId } }),
    prisma.booking.count({
      where: { brandId: profileId, status: { in: ACTIVE_STATUSES } },
    }),
    prisma.booking.aggregate({
      where: { brandId: profileId, status: "PAID" },
      _sum: { priceCents: true },
    }),
    prisma.booking.count({ where: { brandId: profileId, status: "PAID" } }),
    prisma.booking.findMany({
      where: { brandId: profileId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { creator: { select: { displayName: true } } },
    }),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Brand Dashboard"
        title="Overview"
        description="Your bookings, active deals, and spend at a glance."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total bookings" value={String(totalCount)} sub="All deals you started" />
        <StatCard label="Active deals" value={String(activeCount)} sub="Accepted, in production, or delivered" />
        <StatCard label="Total spent" value={formatUSD(paid._sum.priceCents ?? 0)} sub="Paid deals" />
        <StatCard label="Completed deals" value={String(completedCount)} sub="Paid and done" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl tracking-wide text-white">Latest bookings</h2>
            <Link href="/dashboard/deals" className="text-sm font-medium text-neon-cyan hover:underline">
              View all deals
            </Link>
          </div>

          {latest.length === 0 ? (
            <EmptyState
              title="No bookings yet"
              description="Browse creators and send your first booking request."
              action={
                <Link href="/creators" className={buttonClasses("primary", "md")}>
                  Browse creators
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-violet-400/10">
              {latest.map((booking) => (
                <li key={booking.id}>
                  <Link
                    href={`/dashboard/deals/${booking.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 py-4 transition hover:opacity-90"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">{booking.title}</p>
                      <p className="mt-0.5 text-sm text-slate-400">
                        {booking.creator.displayName} · {formatDate(booking.createdAt)}
                      </p>
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
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="font-display mb-4 text-2xl tracking-wide text-white">Quick links</h2>
          <div className="flex flex-col gap-3">
            <Link href="/creators" className={buttonClasses("primary", "md", "w-full")}>
              Browse creators
            </Link>
            <Link href="/dashboard/deals" className={buttonClasses("secondary", "md", "w-full")}>
              My deals
            </Link>
            <Link href="/dashboard/profile" className={buttonClasses("ghost", "md", "w-full")}>
              Brand profile
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Admin summary (compact — full console lives under /admin)           */
/* ------------------------------------------------------------------ */

async function AdminSummary() {
  const [creatorCount, publishedCount, pendingCount, dealCount, paid] = await Promise.all([
    prisma.creatorProfile.count(),
    prisma.creatorProfile.count({ where: { isPublished: true } }),
    prisma.creatorProfile.count({ where: { verificationStatus: "PENDING" } }),
    prisma.booking.count(),
    prisma.booking.aggregate({
      where: { status: "PAID" },
      _sum: { commissionCents: true },
    }),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Overview"
        description="A quick look at the marketplace. The full console lives under Admin."
        actions={
          <Link href="/admin" className={buttonClasses("primary", "md")}>
            Open admin console
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Creators" value={formatNumber(creatorCount)} sub={`${formatNumber(publishedCount)} published`} />
        <StatCard label="Pending verifications" value={String(pendingCount)} sub="Creators awaiting review" />
        <StatCard label="Total deals" value={formatNumber(dealCount)} sub="All bookings" />
        <StatCard
          label="Commission earned"
          value={formatUSD(paid._sum.commissionCents ?? 0)}
          sub="From paid deals"
        />
      </div>

      <Card className="neon-ring mt-8">
        <h2 className="font-display text-2xl tracking-wide text-white">
          Admin console
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Verify creators, feature listings, review every deal, and set the platform
          commission rate — all from the admin console.
        </p>
        <Link href="/admin" className={buttonClasses("primary", "md", "mt-4")}>
          Go to the admin console
        </Link>
      </Card>
    </div>
  );
}
