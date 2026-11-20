import { auth } from "@/auth";
import type { Role } from "@prisma/client";
import { redirect } from "next/navigation";

/** Require a signed-in user; redirect to /login otherwise. */
export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session;
}

/** Require a signed-in user with one of the given roles; otherwise bounce to /dashboard. */
export async function requireRole(roles: Role | Role[]) {
  const session = await requireSession();
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!allowed.includes(session.user.role)) redirect("/dashboard");
  return session;
}
