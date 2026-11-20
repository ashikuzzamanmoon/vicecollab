"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type ActionResult = { ok: boolean; error?: string };

const sendMessageSchema = z.object({
  bookingId: z.string().min(1),
  body: z
    .string()
    .trim()
    .min(1, "Message cannot be empty.")
    .max(2000, "Message is too long (max 2,000 characters)."),
});

/** Send a message on a deal. Only the two parties of the booking may send. */
export async function sendMessage(input: z.infer<typeof sendMessageSchema>): Promise<ActionResult> {
  const parsed = sendMessageSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Please check your message and try again.",
    };
  }

  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "You must be signed in." };

  const booking = await prisma.booking.findUnique({
    where: { id: parsed.data.bookingId },
    include: {
      creator: { select: { userId: true } },
      brand: { select: { userId: true } },
    },
  });
  if (!booking) return { ok: false, error: "Deal not found." };

  const isParty =
    booking.creator.userId === session.user.id || booking.brand.userId === session.user.id;
  if (!isParty) return { ok: false, error: "Only the parties to this deal can message here." };

  await prisma.message.create({
    data: {
      bookingId: booking.id,
      senderId: session.user.id,
      body: parsed.data.body,
    },
  });

  revalidatePath(`/dashboard/deals/${booking.id}`);
  return { ok: true };
}
