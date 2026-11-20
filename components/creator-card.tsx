import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Badge, HoverCard } from "@/components/ui";
import { platformLabel } from "@/lib/constants";
import { formatUSD } from "@/lib/payments";
import { formatNumber } from "@/lib/utils";

/** A published creator with the relations the card needs. */
export type CreatorCardData = Prisma.CreatorProfileGetPayload<{
  include: { packages: true; reviews: true };
}>;

/** Average review rating (0 when there are no reviews). */
export function averageRating(reviews: { rating: number }[]): number {
  if (reviews.length === 0) return 0;
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}

/** Lowest active package price in cents, or null when no active packages. */
export function minActivePackagePrice(
  packages: { priceCents: number; isActive: boolean }[],
): number | null {
  const active = packages.filter((p) => p.isActive);
  if (active.length === 0) return null;
  return Math.min(...active.map((p) => p.priceCents));
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const letters = parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  return letters || "?";
}

export function CreatorCard({ creator }: { creator: CreatorCardData }) {
  const rating = averageRating(creator.reviews);
  const startingPrice = minActivePackagePrice(creator.packages);
  const visibleNiches = creator.niches.slice(0, 3);
  const extraNiches = creator.niches.length - visibleNiches.length;

  return (
    <Link href={`/creators/${creator.id}`} className="block h-full">
      <HoverCard
        className={`flex h-full flex-col ${creator.featured ? "neon-ring" : ""}`}
      >
        <div className="flex items-start gap-3">
          {creator.avatarUrl ? (
            <img
              src={creator.avatarUrl}
              alt={`${creator.displayName} avatar`}
              className="h-14 w-14 shrink-0 rounded-full border border-violet-400/30 object-cover"
            />
          ) : (
            <div
              aria-hidden
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-neon-pink via-neon-purple to-neon-cyan font-display text-xl tracking-wide text-white"
            >
              {initials(creator.displayName)}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="truncate font-display text-xl tracking-wide text-white">
                {creator.displayName}
              </h3>
              {creator.verificationStatus === "VERIFIED" && (
                <Badge variant="success">Verified</Badge>
              )}
              {creator.featured && <Badge variant="neon">Featured</Badge>}
            </div>
            <p className="mt-0.5 text-xs font-semibold tracking-wider text-neon-cyan uppercase">
              {platformLabel(creator.primaryPlatform)}
            </p>
          </div>
        </div>

        {creator.tagline && (
          <p className="mt-3 line-clamp-2 text-sm text-slate-300">{creator.tagline}</p>
        )}

        <div className="mt-4 flex gap-4 text-sm">
          <div>
            <p className="font-semibold text-white">{formatNumber(creator.followers)}</p>
            <p className="text-xs text-slate-400">Followers</p>
          </div>
          <div>
            <p className="font-semibold text-white">{formatNumber(creator.avgViews)}</p>
            <p className="text-xs text-slate-400">Avg views</p>
          </div>
          <div>
            <p className="font-semibold text-white">
              {creator.engagementRate.toFixed(1)}%
            </p>
            <p className="text-xs text-slate-400">Engagement</p>
          </div>
        </div>

        {visibleNiches.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {visibleNiches.map((niche) => (
              <Badge key={niche} variant="muted">
                {niche}
              </Badge>
            ))}
            {extraNiches > 0 && (
              <span className="inline-flex items-center px-1 text-xs text-slate-400">
                +{extraNiches} more
              </span>
            )}
          </div>
        )}

        <div className="flex-1" />

        <div className="mt-4 flex items-end justify-between gap-2 border-t border-violet-400/10 pt-4">
          <div>
            {creator.reviews.length > 0 ? (
              <p className="text-sm text-slate-300">
                <span className="text-sunset-yellow">★</span>{" "}
                <span className="font-semibold text-white">{rating.toFixed(1)}</span>{" "}
                <span className="text-slate-400">
                  ({creator.reviews.length}{" "}
                  {creator.reviews.length === 1 ? "review" : "reviews"})
                </span>
              </p>
            ) : (
              <p className="text-sm text-slate-500">No reviews yet</p>
            )}
          </div>
          <p className="text-right text-sm">
            {startingPrice !== null ? (
              <>
                <span className="text-xs text-slate-400">from </span>
                <span className="font-semibold text-white">{formatUSD(startingPrice)}</span>
              </>
            ) : (
              <span className="text-slate-500">No packages yet</span>
            )}
          </p>
        </div>
      </HoverCard>
    </Link>
  );
}
