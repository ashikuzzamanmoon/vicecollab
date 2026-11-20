"use server";

import { auth } from "@/auth";
import { RESPONSE_WINDOW_HOURS } from "@/lib/constants";
import { calculateCommission } from "@/lib/payments";
import { prisma } from "@/lib/prisma";
import { getCommissionRate } from "@/lib/settings";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

export type ActionResult = { ok: boolean; error?: string };

function zodMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Please check your input and try again.";
}

/**
 * Lazy expiry: any booking still REQUESTED past its response window becomes
 * EXPIRED. Called from the deal page loaders before they render.
 */
export async function expireStaleBookings(): Promise<void> {
  await prisma.booking.updateMany({
    where: { status: "REQUESTED", respondBy: { lt: new Date() } },
    data: { status: "EXPIRED" },
  });
}

function revalidateDeal(bookingId: string) {
  revalidatePath("/dashboard/deals");
  revalidatePath(`/dashboard/deals/${bookingId}`);
}

async function loadBookingForAction(bookingId: string) {
  return prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      creator: { select: { userId: true } },
      brand: { select: { userId: true } },
    },
  });
}

/* ------------------------------------------------------------------ */
/* Create a booking                                                    */
/* ------------------------------------------------------------------ */

const createBookingSchema = z.object({
  creatorId: z.string().min(1),
  packageId: z.string().min(1, "Please choose a package."),
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters.")
    .max(120, "Title must be under 120 characters."),
  brief: z
    .string()
    .trim()
    .min(20, "Brief must be at least 20 characters — tell the creator what you need.")
    .max(5000, "Brief must be under 5,000 characters."),
  deadline: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), {
      message: "Deadline must be a valid date.",
    }),
});

export async function createBooking(
  input: z.infer<typeof createBookingSchema>,
): Promise<ActionResult> {
  const parsed = createBookingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: zodMessage(parsed.error) };

  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "You must be signed in to book a creator." };
  if (session.user.role !== "BRAND") {
    return { ok: false, error: "Only brands can send booking requests." };
  }

  const brandProfile = await prisma.brandProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!brandProfile) {
    return { ok: false, error: "Complete your brand profile before sending a booking request." };
  }

  const { creatorId, packageId, title, brief, deadline } = parsed.data;

  const creator = await prisma.creatorProfile.findUnique({ where: { id: creatorId } });
  if (!creator || !creator.isPublished) {
    return { ok: false, error: "This creator is not available for bookings." };
  }

  const pkg = await prisma.package.findUnique({ where: { id: packageId } });
  if (!pkg || !pkg.isActive || pkg.creatorId !== creatorId) {
    return { ok: false, error: "That package is no longer available." };
  }

  // Snapshot the price and the commission rate at booking time.
  const rate = await getCommissionRate();
  const commissionCents = calculateCommission(pkg.priceCents, rate);
  const respondBy = new Date(Date.now() + RESPONSE_WINDOW_HOURS * 60 * 60 * 1000);

  const booking = await prisma.booking.create({
    data: {
      creatorId,
      brandId: brandProfile.id,
      packageId: pkg.id,
      title,
      brief,
      priceCents: pkg.priceCents,
      commissionRate: rate,
      commissionCents,
      deadline: deadline ? new Date(deadline) : null,
      respondBy,
    },
  });

  revalidatePath("/dashboard/deals");
  redirect(`/dashboard/deals/${booking.id}`);
}

/* ------------------------------------------------------------------ */
/* Creator response: Accept / Decline                                  */
/* ------------------------------------------------------------------ */

export async function respondToBooking(
  bookingId: string,
  action: "accept" | "decline",
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "You must be signed in." };

  const booking = await loadBookingForAction(bookingId);
  if (!booking) return { ok: false, error: "Deal not found." };
  if (booking.creator.userId !== session.user.id) {
    return { ok: false, error: "Only the creator can respond to this request." };
  }
  if (booking.status !== "REQUESTED") {
    return { ok: false, error: "This deal is no longer awaiting a response." };
  }
  if (booking.respondBy <= new Date()) {
    await prisma.booking.update({ where: { id: bookingId }, data: { status: "EXPIRED" } });
    revalidateDeal(bookingId);
    return { ok: false, error: "The response window has expired." };
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: action === "accept" ? "ACCEPTED" : "DECLINED" },
  });
  revalidateDeal(bookingId);
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Creator progress: ACCEPTED -> IN_PRODUCTION -> DELIVERED            */
/* ------------------------------------------------------------------ */

const advanceSchema = z.object({
  bookingId: z.string().min(1),
  to: z.enum(["IN_PRODUCTION", "DELIVERED"]),
});

export async function advanceBooking(
  input: z.infer<typeof advanceSchema>,
): Promise<ActionResult> {
  const parsed = advanceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: zodMessage(parsed.error) };

  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "You must be signed in." };

  const booking = await loadBookingForAction(parsed.data.bookingId);
  if (!booking) return { ok: false, error: "Deal not found." };
  if (booking.creator.userId !== session.user.id) {
    return { ok: false, error: "Only the creator can move this deal forward." };
  }

  const allowed: Record<string, string> = {
    ACCEPTED: "IN_PRODUCTION",
    IN_PRODUCTION: "DELIVERED",
  };
  if (allowed[booking.status] !== parsed.data.to) {
    return { ok: false, error: "This deal cannot move to that stage right now." };
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: parsed.data.to },
  });
  revalidateDeal(booking.id);
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Brand marks a delivered deal as paid                                */
/* ------------------------------------------------------------------ */

export async function markPaid(bookingId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "You must be signed in." };

  const booking = await loadBookingForAction(bookingId);
  if (!booking) return { ok: false, error: "Deal not found." };
  if (booking.brand.userId !== session.user.id) {
    return { ok: false, error: "Only the brand can mark this deal as paid." };
  }
  if (booking.status !== "DELIVERED") {
    return { ok: false, error: "Only a delivered deal can be marked as paid." };
  }

  await prisma.booking.update({ where: { id: bookingId }, data: { status: "PAID" } });
  revalidateDeal(bookingId);
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Either side cancels while REQUESTED or ACCEPTED                     */
/* ------------------------------------------------------------------ */

export async function cancelBooking(bookingId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "You must be signed in." };

  const booking = await loadBookingForAction(bookingId);
  if (!booking) return { ok: false, error: "Deal not found." };
  const isParty =
    booking.creator.userId === session.user.id || booking.brand.userId === session.user.id;
  if (!isParty) return { ok: false, error: "Only a party to this deal can cancel it." };
  if (booking.status !== "REQUESTED" && booking.status !== "ACCEPTED") {
    return { ok: false, error: "This deal can no longer be cancelled." };
  }

  await prisma.booking.update({ where: { id: bookingId }, data: { status: "CANCELLED" } });
  revalidateDeal(bookingId);
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Manual payment coordination (brand only)                            */
/* ------------------------------------------------------------------ */

const updatePaymentSchema = z.object({
  bookingId: z.string().min(1),
  paymentMethod: z.enum(["BANK_TRANSFER", "PAYONEER", "PAYPAL", "OTHER"]).nullable(),
  paymentStatus: z.enum(["NOT_STARTED", "PENDING", "CONFIRMED"]),
  paymentNote: z.string().trim().max(1000, "Payment note must be under 1,000 characters."),
});

export async function updatePayment(
  input: z.infer<typeof updatePaymentSchema>,
): Promise<ActionResult> {
  const parsed = updatePaymentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: zodMessage(parsed.error) };

  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "You must be signed in." };

  const booking = await loadBookingForAction(parsed.data.bookingId);
  if (!booking) return { ok: false, error: "Deal not found." };
  if (booking.brand.userId !== session.user.id) {
    return { ok: false, error: "Only the brand can update payment details." };
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      paymentMethod: parsed.data.paymentMethod,
      paymentStatus: parsed.data.paymentStatus,
      paymentNote: parsed.data.paymentNote || null,
    },
  });
  revalidateDeal(booking.id);
  return { ok: true };
}
