import { DashboardNav } from "@/components/dashboard-nav";
import { requireSession } from "@/lib/auth-helpers";
import type { ReactNode } from "react";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();
  const role = session.user.role;

  const links = [
    { href: "/dashboard", label: "Overview" },
    { href: "/dashboard/deals", label: "Deals" },
    { href: "/dashboard/profile", label: "Profile" },
    ...(role === "ADMIN" ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <DashboardNav links={links} />
      {children}
    </div>
  );
}
