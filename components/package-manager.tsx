"use client";

import { Badge, Button, Card, EmptyState, Field, Input, Select, Textarea } from "@/components/ui";
import { createPackage, deletePackage, updatePackage } from "@/lib/actions/profile";
import { PACKAGE_TYPES, packageTypeLabel } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Package, PackageType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export type PackageWithBookings = Package & { _count: { bookings: number } };

function formatPrice(priceCents: number): string {
  return `$${(priceCents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const EMPTY_FORM = {
  type: "SHORT" as PackageType,
  title: "",
  description: "",
  priceDollars: "",
  deliveryDays: "7",
  isActive: true,
};

export function PackageManager({
  creatorId,
  packages,
}: {
  creatorId: string;
  packages: PackageWithBookings[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function setField<K extends keyof typeof EMPTY_FORM>(key: K, value: (typeof EMPTY_FORM)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openAddForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setConfirmDeleteId(null);
    setShowForm(true);
  }

  function openEditForm(pkg: PackageWithBookings) {
    setEditingId(pkg.id);
    setForm({
      type: pkg.type,
      title: pkg.title,
      description: pkg.description ?? "",
      priceDollars: String(pkg.priceCents / 100),
      deliveryDays: String(pkg.deliveryDays),
      isActive: pkg.isActive,
    });
    setError(null);
    setConfirmDeleteId(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const input = {
      type: form.type,
      title: form.title,
      description: form.description,
      priceDollars: Number(form.priceDollars),
      deliveryDays: Number(form.deliveryDays) || 7,
      isActive: form.isActive,
    };
    const result = editingId
      ? await updatePackage(editingId, input)
      : await createPackage(creatorId, input);
    setPending(false);
    if (!result.ok) {
      setError(result.error ?? "Something went wrong. Please try again.");
      return;
    }
    closeForm();
    router.refresh();
  }

  async function handleDelete(packageId: string) {
    setError(null);
    setPending(true);
    const result = await deletePackage(packageId);
    setPending(false);
    setConfirmDeleteId(null);
    if (!result.ok) {
      setError(result.error ?? "Something went wrong. Please try again.");
      return;
    }
    router.refresh();
  }

  const selectedType = PACKAGE_TYPES.find((t) => t.value === form.type);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl tracking-wide text-white">Packages</h2>
          <p className="mt-1 text-sm text-slate-400">
            What brands can book. You need at least one active package to publish your profile.
          </p>
        </div>
        {!showForm && (
          <Button variant="secondary" onClick={openAddForm}>
            Add package
          </Button>
        )}
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-200">
          {error}
        </p>
      )}

      {showForm && (
        <Card className="neon-ring">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="font-display text-xl tracking-wide text-white">
              {editingId ? "Edit package" : "New package"}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Type" hint={selectedType?.hint} required>
                <Select
                  value={form.type}
                  onChange={(event) => setField("type", event.target.value as PackageType)}
                >
                  {PACKAGE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Price (USD)" hint="What the brand pays for this package." required>
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0.01}
                  step={0.01}
                  placeholder="50.00"
                  value={form.priceDollars}
                  onChange={(event) => setField("priceDollars", event.target.value)}
                  required
                />
              </Field>
            </div>
            <Field label="Title" required>
              <Input
                type="text"
                placeholder="e.g. Sponsored GTA VI short with a gameplay hook"
                value={form.title}
                onChange={(event) => setField("title", event.target.value)}
                required
              />
            </Field>
            <Field label="Description" hint="What the brand gets — length, format, revisions.">
              <Textarea
                placeholder="A 30-60 second vertical video featuring your game, posted to my main channel."
                value={form.description}
                onChange={(event) => setField("description", event.target.value)}
                rows={3}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Delivery (days)" required>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={365}
                  step={1}
                  value={form.deliveryDays}
                  onChange={(event) => setField("deliveryDays", event.target.value)}
                  required
                />
              </Field>
              <div className="flex items-end pb-2">
                <label className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) => setField("isActive", event.target.checked)}
                    className="h-4 w-4 accent-[#ff2e93]"
                  />
                  <span className="text-sm font-medium text-slate-200">
                    Active — brands can book this
                  </span>
                </label>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={pending}>
                {pending ? "Saving..." : editingId ? "Save changes" : "Add package"}
              </Button>
              <Button type="button" variant="ghost" onClick={closeForm} disabled={pending}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {packages.length === 0 ? (
        <EmptyState
          title="No packages yet"
          description="Add your first package so brands know what to book — and so you can publish your profile."
          action={
            !showForm ? (
              <Button variant="secondary" onClick={openAddForm}>
                Add your first package
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {packages.map((pkg) => {
            const hasBookings = pkg._count.bookings > 0;
            const confirmingDelete = confirmDeleteId === pkg.id;
            return (
              <Card key={pkg.id} className={cn(!pkg.isActive && "opacity-70")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="neon">{packageTypeLabel(pkg.type)}</Badge>
                      {pkg.isActive ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="muted">Inactive</Badge>
                      )}
                    </div>
                    <p className="mt-2 truncate text-base font-semibold text-white">{pkg.title}</p>
                    {pkg.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-slate-400">
                        {pkg.description}
                      </p>
                    )}
                  </div>
                  <p className="font-display shrink-0 text-2xl tracking-wide text-neon-cyan">
                    {formatPrice(pkg.priceCents)}
                  </p>
                </div>
                <p className="mt-3 text-xs text-slate-400">
                  Delivery in {pkg.deliveryDays} {pkg.deliveryDays === 1 ? "day" : "days"} ·{" "}
                  {hasBookings
                    ? `${pkg._count.bookings} ${pkg._count.bookings === 1 ? "booking" : "bookings"}`
                    : "No bookings yet"}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openEditForm(pkg)}
                    disabled={pending}
                  >
                    Edit
                  </Button>
                  {confirmingDelete ? (
                    <>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => void handleDelete(pkg.id)}
                        disabled={pending}
                      >
                        Confirm delete
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmDeleteId(null)}
                        disabled={pending}
                      >
                        Keep it
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setConfirmDeleteId(pkg.id)}
                      disabled={pending || hasBookings}
                      title={
                        hasBookings
                          ? "This package has bookings and cannot be deleted"
                          : undefined
                      }
                    >
                      Delete
                    </Button>
                  )}
                  {hasBookings && (
                    <span className="self-center text-xs text-slate-500">
                      Has bookings — deactivate instead of deleting.
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
