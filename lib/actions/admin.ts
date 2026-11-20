"use server";

import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type AdminActionResult = { ok: boolean; error?: string };

const profileIdSchema = z.string().min(1, "Profile id is required.");
const verificationSchema = z.enum(["VERIFIED", "REJECTED"]);

/** Approve or reject a creator's verification. Verifying keeps isPublished as-is. */
export async function setVerification(
  profileId: string,
  status: "VERIFIED" | "REJECTED",
): Promise<AdminActionResult> {
  await requireRole("ADMIN");

  const parsed = z
    .object({ profileId: profileIdSchema, status: verificationSchema })
    .safeParse({ profileId, status });
  if (!parsed.success) return { ok: false, error: "Invalid input." };

  try {
    await prisma.creatorProfile.update({
      where: { id: profileId },
      data: { verificationStatus: status },
    });
  } catch {
    return { ok: false, error: "Creator profile not found." };
  }

  revalidatePath("/admin/creators");
  return { ok: true };
}

/** Feature or unfeature a creator on the directory. */
export async function setFeatured(
  profileId: string,
  featured: boolean,
): Promise<AdminActionResult> {
  await requireRole("ADMIN");

  const parsed = z
    .object({ profileId: profileIdSchema, featured: z.boolean() })
    .safeParse({ profileId, featured });
  if (!parsed.success) return { ok: false, error: "Invalid input." };

  try {
    await prisma.creatorProfile.update({
      where: { id: profileId },
      data: { featured },
    });
  } catch {
    return { ok: false, error: "Creator profile not found." };
  }

  revalidatePath("/admin/creators");
  return { ok: true };
}

/** Publish or unpublish a creator listing. Admin can unpublish a listing. */
export async function setPublished(
  profileId: string,
  isPublished: boolean,
): Promise<AdminActionResult> {
  await requireRole("ADMIN");

  const parsed = z
    .object({ profileId: profileIdSchema, isPublished: z.boolean() })
    .safeParse({ profileId, isPublished });
  if (!parsed.success) return { ok: false, error: "Invalid input." };

  try {
    await prisma.creatorProfile.update({
      where: { id: profileId },
      data: { isPublished },
    });
  } catch {
    return { ok: false, error: "Creator profile not found." };
  }

  revalidatePath("/admin/creators");
  return { ok: true };
}

const commissionRateSchema = z.object({
  rate: z.coerce
    .number({ error: "Enter a number." })
    .min(0, "Rate must be at least 0%.")
    .max(50, "Rate must be at most 50%.")
    .multipleOf(0.5, "Rate must be in 0.5 steps."),
});

/**
 * Update the platform commission rate (PlatformSetting row id 1).
 * Applies to NEW bookings only — existing deals keep their stored rate.
 */
export async function updateCommissionRate(
  _prevState: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  await requireRole("ADMIN");

  const parsed = commissionRateSchema.safeParse({ rate: formData.get("rate") });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid rate." };
  }

  await prisma.platformSetting.upsert({
    where: { id: 1 },
    update: { commissionRate: parsed.data.rate },
    create: { id: 1, commissionRate: parsed.data.rate },
  });

  revalidatePath("/admin/settings");
  return { ok: true };
}
