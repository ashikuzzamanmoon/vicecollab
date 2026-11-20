import { Suspense } from "react";
import Link from "next/link";
import type { Platform, Prisma } from "@prisma/client";
import {
  CreatorCard,
  averageRating,
  minActivePackagePrice,
  type CreatorCardData,
} from "@/components/creator-card";
import { DirectoryFilters } from "@/components/directory-filters";
import { EmptyState, PageHeader, buttonClasses } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export const revalidate = 60;

const getCachedCreators = unstable_cache(
  async () => {
    return prisma.creatorProfile.findMany({
      where: { isPublished: true },
      include: { packages: true, reviews: true },
      orderBy: { followers: "desc" },
    });
  },
  ["creators-directory-list"],
  { revalidate: 60, tags: ["creators"] },
);

type SortKey = "followers" | "price-asc" | "price-desc" | "rating";

const SORT_KEYS: SortKey[] = ["followers", "price-asc", "price-desc", "rating"];

const PLATFORM_VALUES: Platform[] = [
  "YOUTUBE",
  "TIKTOK",
  "TWITCH",
  "KICK",
  "INSTAGRAM",
];

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

/** Parse a dollar amount from the query string into cents, or null. */
function dollarsToCents(value: string): number | null {
  if (value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100);
}

function sortCreators(creators: CreatorCardData[], sort: SortKey): CreatorCardData[] {
  const sorted = [...creators];
  switch (sort) {
    case "price-asc":
    case "price-desc": {
      const direction = sort === "price-asc" ? 1 : -1;
      return sorted.sort((a, b) => {
        const pa = minActivePackagePrice(a.packages);
        const pb = minActivePackagePrice(b.packages);
        // Creators without active packages always sort last.
        if (pa === null && pb === null) return 0;
        if (pa === null) return 1;
        if (pb === null) return -1;
        return (pa - pb) * direction;
      });
    }
    case "rating":
      return sorted.sort(
        (a, b) =>
          averageRating(b.reviews) - averageRating(a.reviews) ||
          b.followers - a.followers,
      );
    case "followers":
    default:
      return sorted.sort((a, b) => b.followers - a.followers);
  }
}

export default async function CreatorsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = firstParam(params.q).trim();
  const platformRaw = firstParam(params.platform);
  const niche = firstParam(params.niche).trim();
  const country = firstParam(params.country).trim();
  const minPrice = firstParam(params.minPrice).trim();
  const maxPrice = firstParam(params.maxPrice).trim();
  const sortRaw = firstParam(params.sort);
  const sort: SortKey = SORT_KEYS.includes(sortRaw as SortKey)
    ? (sortRaw as SortKey)
    : "followers";

  // Only a valid enum value may reach Prisma; anything else is ignored.
  const platform: Platform | null = PLATFORM_VALUES.includes(
    platformRaw as Platform,
  )
    ? (platformRaw as Platform)
    : null;

  // Fetch all published creators from cache (0ms DB delay) and filter in memory
  const allCreators = await getCachedCreators();

  let results = allCreators;
  if (platform) {
    results = results.filter((c) => c.platforms.includes(platform));
  }
  if (niche) {
    results = results.filter((c) => c.niches.includes(niche));
  }
  if (country) {
    results = results.filter((c) => c.audienceCountries.includes(country));
  }
  if (q !== "") {
    const needle = q.toLowerCase();
    results = results.filter(
      (c) =>
        c.displayName.toLowerCase().includes(needle) ||
        (c.tagline ?? "").toLowerCase().includes(needle) ||
        (c.bio ?? "").toLowerCase().includes(needle) ||
        c.niches.some((n) => n.toLowerCase().includes(needle)),
    );
  }

  // Price filter in JS: the creator needs at least one ACTIVE package
  // inside the requested dollar range.
  const minCents = dollarsToCents(minPrice);
  const maxCents = dollarsToCents(maxPrice);
  if (minCents !== null || maxCents !== null) {
    results = results.filter((c) =>
      c.packages.some(
        (p) =>
          p.isActive &&
          (minCents === null || p.priceCents >= minCents) &&
          (maxCents === null || p.priceCents <= maxCents),
      ),
    );
  }

  const sorted = sortCreators(results, sort);
  const hasFilters =
    q !== "" ||
    platform !== null ||
    niche !== "" ||
    country !== "" ||
    minCents !== null ||
    maxCents !== null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Creator directory"
        title="Browse GTA creators"
        description="Filter by platform, niche, audience, and price to find the right creator for your brand."
      />

      <Suspense
        fallback={
          <div className="mb-8 h-32 animate-pulse rounded-2xl border border-violet-400/15 bg-night-800/80" />
        }
      >
        <DirectoryFilters
          initial={{
            q,
            platform: platform ?? "",
            niche,
            country,
            minPrice,
            maxPrice,
            sort,
          }}
        />
      </Suspense>

      <p className="mb-4 text-sm text-slate-400" aria-live="polite">
        {sorted.length} {sorted.length === 1 ? "creator" : "creators"} found
      </p>

      {sorted.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((creator) => (
            <CreatorCard key={creator.id} creator={creator} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={hasFilters ? "No creators match your filters" : "No creators yet"}
          description={
            hasFilters
              ? "Try widening your price range or clearing a filter or two."
              : "Creators will appear here as soon as the first profiles are published."
          }
          action={
            hasFilters ? (
              <Link href="/creators" className={buttonClasses("secondary", "md")}>
                Clear all filters
              </Link>
            ) : (
              <Link href="/register" className={buttonClasses("secondary", "md")}>
                Join as a creator
              </Link>
            )
          }
        />
      )}
    </div>
  );
}
