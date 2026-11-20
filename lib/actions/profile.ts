"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type ActionResult = { ok: boolean; error?: string; created?: boolean };

async function currentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

function firstIssue(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? "Check your details and try again.";
}

/** Trim a user-entered URL and add https:// when no scheme is present. Empty -> undefined. */
function normalizeUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/** Trim optional free text. Empty -> undefined. */
function optionalText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

/* ------------------------------------------------------------------ */
/* Creator profile                                                     */
/* ------------------------------------------------------------------ */

const platformEnum = z.enum(["YOUTUBE", "TIKTOK", "TWITCH", "KICK", "INSTAGRAM"]);

const creatorProfileSchema = z
  .object({
    displayName: z.string().trim().min(1, "Display name is required").max(100),
    tagline: z.string().trim().max(200).optional(),
    bio: z.string().trim().max(5000).optional(),
    avatarUrl: z.string().url("Avatar must be a valid URL").optional(),
    bannerUrl: z.string().url("Banner must be a valid URL").optional(),
    platforms: z.array(platformEnum).min(1, "Choose at least one platform"),
    primaryPlatform: platformEnum,
    followers: z.coerce.number().int().min(0).default(0),
    avgViews: z.coerce.number().int().min(0).default(0),
    engagementRate: z.coerce.number().min(0).max(100).default(0),
    audienceCountries: z.array(z.string()).default([]),
    niches: z.array(z.string()).default([]),
    portfolioLinks: z
      .array(z.string().url("Each portfolio link must be a valid URL"))
      .default([]),
    isPublished: z.boolean().default(false),
  })
  .refine((data) => data.platforms.includes(data.primaryPlatform), {
    message: "Primary platform must be one of your selected platforms",
    path: ["primaryPlatform"],
  });

/** Create or update the signed-in creator's profile. Returns `created` on first creation. */
export async function upsertCreatorProfile(input: unknown): Promise<ActionResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Please sign in to continue." };

  const raw = (input ?? {}) as Record<string, unknown>;
  const parsed = creatorProfileSchema.safeParse({
    ...raw,
    tagline: optionalText(raw.tagline),
    bio: optionalText(raw.bio),
    avatarUrl: normalizeUrl(raw.avatarUrl),
    bannerUrl: normalizeUrl(raw.bannerUrl),
    portfolioLinks: Array.isArray(raw.portfolioLinks)
      ? raw.portfolioLinks
          .map((link) => normalizeUrl(link))
          .filter((link): link is string => Boolean(link))
      : [],
  });
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { creatorProfile: { select: { id: true } } },
  });
  if (!user) return { ok: false, error: "Account not found." };
  if (user.role !== "CREATOR") {
    return { ok: false, error: "Only creator accounts can have a creator profile." };
  }

  const data = parsed.data;
  const existingId = user.creatorProfile?.id;

  if (data.isPublished) {
    // Publishing requires at least one active package (display name and
    // platforms are already enforced by the schema above).
    const activePackage = existingId
      ? await prisma.package.findFirst({
          where: { creatorId: existingId, isActive: true },
          select: { id: true },
        })
      : null;
    if (!activePackage) {
      return {
        ok: false,
        error: "Add at least one active package before publishing your profile.",
      };
    }
  }

  const profileData = {
    displayName: data.displayName,
    tagline: data.tagline ?? null,
    bio: data.bio ?? null,
    avatarUrl: data.avatarUrl ?? null,
    bannerUrl: data.bannerUrl ?? null,
    platforms: data.platforms,
    primaryPlatform: data.primaryPlatform,
    followers: data.followers,
    avgViews: data.avgViews,
    engagementRate: data.engagementRate,
    audienceCountries: data.audienceCountries,
    niches: data.niches,
    portfolioLinks: data.portfolioLinks,
    isPublished: data.isPublished,
  };

  if (existingId) {
    await prisma.creatorProfile.update({ where: { id: existingId }, data: profileData });
  } else {
    await prisma.creatorProfile.create({ data: { userId, ...profileData } });
  }
  revalidatePath("/dashboard/profile");
  revalidatePath("/creators");
  return { ok: true, created: !existingId };
}

/* ------------------------------------------------------------------ */
/* Brand profile                                                       */
/* ------------------------------------------------------------------ */

const brandProfileSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required").max(120),
  website: z.string().url("Website must be a valid URL").optional(),
  description: z.string().trim().max(5000).optional(),
  logoUrl: z.string().url("Logo must be a valid URL").optional(),
});

/** Create or update the signed-in brand's profile. Returns `created` on first creation. */
export async function upsertBrandProfile(input: unknown): Promise<ActionResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Please sign in to continue." };

  const raw = (input ?? {}) as Record<string, unknown>;
  const parsed = brandProfileSchema.safeParse({
    ...raw,
    website: normalizeUrl(raw.website),
    description: optionalText(raw.description),
    logoUrl: normalizeUrl(raw.logoUrl),
  });
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { brandProfile: { select: { id: true } } },
  });
  if (!user) return { ok: false, error: "Account not found." };
  if (user.role !== "BRAND") {
    return { ok: false, error: "Only brand accounts can have a brand profile." };
  }

  const data = {
    companyName: parsed.data.companyName,
    website: parsed.data.website ?? null,
    description: parsed.data.description ?? null,
    logoUrl: parsed.data.logoUrl ?? null,
  };
  const existingId = user.brandProfile?.id;

  if (existingId) {
    await prisma.brandProfile.update({ where: { id: existingId }, data });
  } else {
    await prisma.brandProfile.create({ data: { userId, ...data } });
  }
  revalidatePath("/dashboard/profile");
  return { ok: true, created: !existingId };
}

/* ------------------------------------------------------------------ */
/* Packages                                                            */
/* ------------------------------------------------------------------ */

const packageSchema = z.object({
  type: z.enum(["SHORT", "STREAM_MENTION", "DEDICATED_VIDEO", "CUSTOM"]),
  title: z.string().trim().min(1, "Title is required").max(120),
  description: z.string().trim().max(2000).optional(),
  priceDollars: z.coerce.number().min(0.01, "Price must be at least $0.01"),
  deliveryDays: z.coerce
    .number()
    .int()
    .min(1, "Delivery time must be at least 1 day")
    .max(365, "Delivery time must be 365 days or less"),
  isActive: z.boolean().default(true),
});

/** Load a package only if it belongs to the signed-in creator. */
async function ownPackage(packageId: string, userId: string) {
  const pkg = await prisma.package.findUnique({
    where: { id: packageId },
    include: { creator: { select: { userId: true } } },
  });
  if (!pkg || pkg.creator.userId !== userId) return null;
  return pkg;
}

export async function createPackage(
  creatorId: string,
  input: unknown,
): Promise<ActionResult & { packageId?: string }> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Please sign in to continue." };

  const profile = await prisma.creatorProfile.findFirst({
    where: { id: creatorId, userId },
    select: { id: true },
  });
  if (!profile) return { ok: false, error: "Creator profile not found." };

  const raw = (input ?? {}) as Record<string, unknown>;
  const parsed = packageSchema.safeParse({
    ...raw,
    description: optionalText(raw.description),
  });
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const priceCents = Math.round(parsed.data.priceDollars * 100);
  if (priceCents <= 0) return { ok: false, error: "Price must be greater than $0." };

  const pkg = await prisma.package.create({
    data: {
      creatorId,
      type: parsed.data.type,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      priceCents,
      deliveryDays: parsed.data.deliveryDays,
      isActive: parsed.data.isActive,
    },
  });
  revalidatePath("/dashboard/profile");
  revalidatePath("/creators");
  return { ok: true, packageId: pkg.id };
}

export async function updatePackage(
  packageId: string,
  input: unknown,
): Promise<ActionResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Please sign in to continue." };

  const pkg = await ownPackage(packageId, userId);
  if (!pkg) return { ok: false, error: "Package not found." };

  const raw = (input ?? {}) as Record<string, unknown>;
  const parsed = packageSchema.safeParse({
    ...raw,
    description: optionalText(raw.description),
  });
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const priceCents = Math.round(parsed.data.priceDollars * 100);
  if (priceCents <= 0) return { ok: false, error: "Price must be greater than $0." };

  await prisma.package.update({
    where: { id: pkg.id },
    data: {
      type: parsed.data.type,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      priceCents,
      deliveryDays: parsed.data.deliveryDays,
      isActive: parsed.data.isActive,
    },
  });

  // Keep the publish invariant (published profiles always have an active
  // package): deactivating the last active package auto-unpublishes.
  if (!parsed.data.isActive) {
    const remainingActive = await prisma.package.count({
      where: { creatorId: pkg.creatorId, isActive: true },
    });
    if (remainingActive === 0) {
      await prisma.creatorProfile.updateMany({
        where: { id: pkg.creatorId, isPublished: true },
        data: { isPublished: false },
      });
    }
  }

  revalidatePath("/dashboard/profile");
  revalidatePath("/creators");
  return { ok: true };
}

export async function deletePackage(packageId: string): Promise<ActionResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Please sign in to continue." };

  const pkg = await ownPackage(packageId, userId);
  if (!pkg) return { ok: false, error: "Package not found." };

  const bookingCount = await prisma.booking.count({ where: { packageId: pkg.id } });
  if (bookingCount > 0) {
    return {
      ok: false,
      error: "This package has bookings and cannot be deleted. Deactivate it instead.",
    };
  }

  await prisma.package.delete({ where: { id: pkg.id } });
  revalidatePath("/dashboard/profile");
  revalidatePath("/creators");
  return { ok: true };
}
