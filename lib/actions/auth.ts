"use server";

import { requireSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  role: z.enum(["CREATOR", "BRAND"]),
});

/** Create a new account. On success the client navigates to /login?registered=1. */
export async function registerUser(input: unknown): Promise<{ ok: boolean; error?: string }> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Check your details and try again.",
    };
  }

  const { name, email, password, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: "An account with this email already exists" };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({ data: { name, email, passwordHash, role } });
  return { ok: true };
}

const onboardingRoleSchema = z.object({
  role: z.enum(["CREATOR", "BRAND"]),
});

/**
 * Onboarding role picker (used as a form action from /onboarding).
 * Google sign-ups arrive with the default CREATOR role and pick their real
 * role here. The role can only change while the user has no profile yet —
 * once a profile exists, the role is locked and we send them to the dashboard.
 */
export async function setOnboardingRole(formData: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = onboardingRoleSchema.safeParse({ role: formData.get("role") });
  if (!parsed.success) redirect("/onboarding");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      creatorProfile: { select: { id: true } },
      brandProfile: { select: { id: true } },
    },
  });
  if (!user) redirect("/login");
  if (user.creatorProfile || user.brandProfile) redirect("/dashboard");

  await prisma.user.update({
    where: { id: user.id },
    data: { role: parsed.data.role },
  });
  redirect("/dashboard/profile");
}
