import { CommissionForm } from "@/components/commission-form";
import { Card, PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/auth-helpers";
import { getCommissionRate } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireRole("ADMIN");

  const currentRate = await getCommissionRate();

  return (
    <div>
      <PageHeader
        eyebrow="Admin Console"
        title="Settings"
        description="Platform-wide configuration."
      />

      <div className="grid max-w-2xl grid-cols-1 gap-6">
        <Card>
          <h2 className="font-display mb-1 text-2xl tracking-wide text-white">
            Commission rate
          </h2>
          <p className="mb-5 text-sm text-slate-400">
            The percentage the platform keeps from each booking.
          </p>
          <CommissionForm currentRate={currentRate} />
          <p className="mt-4 rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Applies to NEW bookings only — existing deals keep the rate they were created with.
          </p>
        </Card>

        <Card>
          <h2 className="font-display mb-1 text-2xl tracking-wide text-white">
            Admin accounts
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            The first admin account is created by setting a user&apos;s role to ADMIN directly in
            the database (Prisma Studio or SQL) — registration never grants admin.
          </p>
        </Card>
      </div>
    </div>
  );
}
