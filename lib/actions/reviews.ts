"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type ActionResult = { ok: boolean; error?: string };

const createReviewSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.number().int().min(1, "Rating must be between 1 and 5.").max(5),
  comment: z.string().trim().max(2000, "Comment must be under 2,000 characters.").optional(),
});

/**
 * Leave a review on a deal. Only the booking's brand, only once the deal is
 * PAID, only one review per booking (bookingId is unique on Review).
 */
export async function createReview(
  input: z.infer<typeof createReviewSchema>,
): Promise<ActionResult> {
  const parsed = createReviewSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Please check your review and try again.",
    };
  }

  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "You must be signed in." };

  const booking = await prisma.booking.findUnique({
    where: { id: parsed.data.bookingId },
    include: {
      brand: { select: { id: true, userId: true } },
      review: { select: { id: true } },
    },
  });
  if (!booking) return { ok: false, error: "Deal not found." };
  if (booking.brand.userId !== session.user.id) {
    return { ok: false, error: "Only the brand can review this deal." };
  }
  if (booking.status !== "PAID") {
    return { ok: false, error: "You can only review a deal once it is paid." };
  }
  if (booking.review) {
    return { ok: false, error: "This deal already has a review." };
  }

  await prisma.review.create({
    data: {
      bookingId: booking.id,
      creatorId: booking.creatorId,
      brandId: booking.brand.id,
      rating: parsed.data.rating,
      comment: parsed.data.comment || null,
    },
  });

  revalidatePath(`/dashboard/deals/${booking.id}`);
  revalidatePath(`/creators/${booking.creatorId}`);
  return { ok: true };
}
