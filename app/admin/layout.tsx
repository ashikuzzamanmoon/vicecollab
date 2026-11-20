import { AdminNav } from "@/components/admin-nav";
import { requireRole } from "@/lib/auth-helpers";
import type { ReactNode } from "react";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Non-admins are bounced to /dashboard by the helper.
  await requireRole("ADMIN");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <AdminNav />
      {children}
    </div>
  );
}
