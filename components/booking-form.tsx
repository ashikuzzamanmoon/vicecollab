"use client";

import { createBooking } from "@/lib/actions/bookings";
import { packageTypeLabel } from "@/lib/constants";
import { MANUAL_PAYMENT_NOTE, calculateCommission, formatUSD } from "@/lib/payments";
import type { PackageType } from "@prisma/client";
import { useState, useTransition } from "react";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/ui";

export type BookingPackageOption = {
  id: string;
  type: PackageType;
  title: string;
  description: string | null;
  priceCents: number;
  deliveryDays: number;
};

/** Booking request form: package, title, brief, deadline + live price summary. */
export function BookingForm({
  creatorId,
  creatorName,
  packages,
  preselectedPackageId,
  commissionRate,
}: {
  creatorId: string;
  creatorName: string;
  packages: BookingPackageOption[];
  preselectedPackageId?: string | null;
  commissionRate: number;
}) {
  const [packageId, setPackageId] = useState(
    preselectedPackageId && packages.some((p) => p.id === preselectedPackageId)
      ? preselectedPackageId
      : (packages[0]?.id ?? ""),
  );
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [deadline, setDeadline] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const selectedPackage = packages.find((p) => p.id === packageId) ?? packages[0];
  const commissionCents = selectedPackage
    ? calculateCommission(selectedPackage.priceCents, commissionRate)
    : 0;

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await createBooking({
            creatorId,
            packageId,
            title,
            brief,
            deadline: deadline || undefined,
          });
          // On success the action redirects to the new deal page.
          if (!result.ok) setError(result.error ?? "Could not send your booking request.");
        });
      }}
    >
      <Card className="space-y-5">
        <Field label="Package" required>
          <Select value={packageId} onChange={(e) => setPackageId(e.target.value)}>
            {packages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.title} — {formatUSD(pkg.priceCents)} ({packageTypeLabel(pkg.type)})
              </option>
            ))}
          </Select>
          {selectedPackage && (
            <p className="mt-2 text-sm text-slate-400">
              {selectedPackage.description ?? "No description provided."}
              <span className="mt-1 block text-xs text-slate-500">
                Typical delivery: {selectedPackage.deliveryDays}{" "}
                {selectedPackage.deliveryDays === 1 ? "day" : "days"}
              </span>
            </p>
          )}
        </Field>

        <Field
          label="Deal title"
          hint={`What is this deal about? ${creatorName} will see this first.`}
          required
        >
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Sponsored GTA VI gameplay short"
            maxLength={120}
            required
          />
        </Field>

        <Field
          label="Brief"
          hint="Describe the deliverable, key talking points, links, and anything the creator must include or avoid."
          required
        >
          <Textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="Tell the creator exactly what you need..."
            rows={6}
            maxLength={5000}
            required
          />
        </Field>

        <Field label="Deadline" hint="Optional — when do you need the content live?">
          <Input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </Field>
      </Card>

      {selectedPackage && (
        <Card>
          <h2 className="font-display text-2xl tracking-wide text-white">Price summary</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">{selectedPackage.title}</dt>
              <dd className="font-medium text-slate-100">
                {formatUSD(selectedPackage.priceCents)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">
                Platform commission ({commissionRate}%, paid to the platform)
              </dt>
              <dd className="font-medium text-slate-100">{formatUSD(commissionCents)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
              <dt className="font-semibold text-slate-200">Creator payout</dt>
              <dd className="font-semibold text-neon-cyan">
                {formatUSD(selectedPackage.priceCents - commissionCents)}
              </dd>
            </div>
          </dl>
          <p className="mt-4 rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {MANUAL_PAYMENT_NOTE}
          </p>
        </Card>
      )}

      {error && (
        <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={isPending || !selectedPackage} className="w-full sm:w-auto">
        {isPending ? "Sending request..." : `Send booking request to ${creatorName}`}
      </Button>
    </form>
  );
}
