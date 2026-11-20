import Link from "next/link";
import { notFound } from "next/navigation";
import { averageRating } from "@/components/creator-card";
import { Badge, Card, EmptyState, StatCard, buttonClasses } from "@/components/ui";
import { packageTypeLabel, platformLabel } from "@/lib/constants";
import { formatUSD } from "@/lib/payments";
import { formatDate, formatNumber } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const creators = await prisma.creatorProfile.findMany({
      where: { isPublished: true },
      select: { id: true },
      take: 20,
    });
    return creators.map((c) => ({ id: c.id }));
  } catch {
    return [];
  }
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const letters = parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  return letters || "?";
}

/** Display host for a portfolio link, falling back to the raw URL. */
function linkLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Ensure an external link has a protocol so it does not resolve relatively. */
function externalHref(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export default async function CreatorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const creator = await prisma.creatorProfile.findUnique({
    where: { id },
    include: {
      packages: {
        where: { isActive: true },
        orderBy: { priceCents: "asc" },
      },
      reviews: {
        include: { brand: { select: { companyName: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!creator || !creator.isPublished) {
    notFound();
  }

  const rating = averageRating(creator.reviews);

  return (
    <div>
      {/* Banner */}
      <div className="relative h-48 overflow-hidden sm:h-64">
        {creator.bannerUrl ? (
          <img
            src={creator.bannerUrl}
            alt=""
            loading="eager"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="bg-vice-sunset h-full w-full bg-gradient-to-r from-neon-pink/30 via-neon-purple/30 to-neon-cyan/25" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-night-950 via-night-950/20 to-transparent" />
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        {/* Identity */}
        <div className="relative -mt-14 flex flex-wrap items-end gap-4 sm:-mt-16">
          {creator.avatarUrl ? (
            <img
              src={creator.avatarUrl}
              alt={`${creator.displayName} avatar`}
              loading="eager"
              decoding="async"
              className="h-28 w-28 rounded-full border-4 border-night-950 object-cover sm:h-32 sm:w-32"
            />
          ) : (
            <div
              aria-hidden
              className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-night-950 bg-gradient-to-br from-neon-pink via-neon-purple to-neon-cyan font-display text-4xl tracking-wide text-white sm:h-32 sm:w-32"
            >
              {initials(creator.displayName)}
            </div>
          )}
          <div className="min-w-0 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-4xl tracking-wide text-white sm:text-5xl">
                {creator.displayName}
              </h1>
              {creator.verificationStatus === "VERIFIED" && (
                <Badge variant="success">Verified</Badge>
              )}
              {creator.featured && <Badge variant="neon">Featured</Badge>}
            </div>
            {creator.tagline && (
              <p className="mt-1 text-lg text-slate-300">{creator.tagline}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Followers" value={formatNumber(creator.followers)} />
          <StatCard label="Avg views" value={formatNumber(creator.avgViews)} />
          <StatCard
            label="Engagement rate"
            value={`${creator.engagementRate.toFixed(1)}%`}
          />
          <StatCard
            label="Rating"
            value={creator.reviews.length > 0 ? rating.toFixed(1) : "New"}
            sub={
              creator.reviews.length > 0
                ? `${creator.reviews.length} ${creator.reviews.length === 1 ? "review" : "reviews"}`
                : "No reviews yet"
            }
          />
        </div>

        {/* About */}
        <section className="mt-10">
          <h2 className="font-display text-3xl tracking-wide text-white">About</h2>
          {creator.bio ? (
            <p className="mt-3 max-w-3xl leading-relaxed whitespace-pre-line text-slate-300">
              {creator.bio}
            </p>
          ) : (
            <p className="mt-3 text-slate-500">
              This creator has not written a bio yet.
            </p>
          )}

          <div className="mt-6 space-y-4">
            {creator.platforms.length > 0 && (
              <div>
                <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Platforms
                </h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {creator.platforms.map((platform) => (
                    <Badge
                      key={platform}
                      variant={platform === creator.primaryPlatform ? "info" : "default"}
                    >
                      {platformLabel(platform)}
                      {platform === creator.primaryPlatform ? " (primary)" : ""}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {creator.niches.length > 0 && (
              <div>
                <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Niches
                </h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {creator.niches.map((niche) => (
                    <Badge key={niche} variant="muted">
                      {niche}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {creator.audienceCountries.length > 0 && (
              <div>
                <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Audience countries
                </h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {creator.audienceCountries.map((country) => (
                    <Badge key={country} variant="muted">
                      {country}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {creator.portfolioLinks.length > 0 && (
              <div>
                <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Portfolio
                </h3>
                <ul className="mt-2 space-y-1.5">
                  {creator.portfolioLinks.map((link) => (
                    <li key={link}>
                      <a
                        href={externalHref(link)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-neon-cyan underline-offset-2 hover:underline"
                      >
                        {linkLabel(link)}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* Packages */}
        <section className="mt-12">
          <h2 className="font-display text-3xl tracking-wide text-white">Packages</h2>
          {creator.packages.length > 0 ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {creator.packages.map((pkg) => (
                <Card key={pkg.id} className="flex flex-col">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="neon">{packageTypeLabel(pkg.type)}</Badge>
                    <p className="font-display text-3xl tracking-wide text-white">
                      {formatUSD(pkg.priceCents)}
                    </p>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-white">{pkg.title}</h3>
                  {pkg.description && (
                    <p className="mt-1 text-sm leading-relaxed text-slate-400">
                      {pkg.description}
                    </p>
                  )}
                  <div className="mt-4 flex flex-1 items-end justify-between gap-3 border-t border-violet-400/10 pt-4">
                    <p className="text-sm text-slate-400">
                      Delivery in {pkg.deliveryDays}{" "}
                      {pkg.deliveryDays === 1 ? "day" : "days"}
                    </p>
                    <Link
                      href={`/creators/${creator.id}/book?package=${pkg.id}`}
                      className={buttonClasses("primary", "sm")}
                    >
                      Book
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                title="No packages yet"
                description="This creator has not published any bookable packages yet. Check back soon."
              />
            </div>
          )}
        </section>

        {/* Reviews */}
        <section className="mt-12">
          <h2 className="font-display text-3xl tracking-wide text-white">Reviews</h2>
          {creator.reviews.length > 0 ? (
            <div className="mt-4 space-y-4">
              {creator.reviews.map((review) => (
                <Card key={review.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-slate-200">
                      <span className="text-sunset-yellow">★</span>{" "}
                      <span className="font-semibold text-white">
                        {review.rating} / 5
                      </span>
                      <span className="text-slate-400">
                        {" "}
                        from {review.brand.companyName}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(review.createdAt)}
                    </p>
                  </div>
                  {review.comment && (
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">
                      {review.comment}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                title="No reviews yet"
                description="This creator has not received any reviews yet."
              />
            </div>
          )}
        </section>

        <div className="mt-12">
          <Link href="/creators" className={buttonClasses("ghost", "md")}>
            Back to all creators
          </Link>
        </div>
      </div>
    </div>
  );
}
