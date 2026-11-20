"use client";

import type { AdminActionResult } from "@/lib/actions/admin";
import { updateCommissionRate } from "@/lib/actions/admin";
import { Badge, Button, Field, Input } from "@/components/ui";
import { useActionState, useState } from "react";

export function CommissionForm({ currentRate }: { currentRate: number }) {
  const [state, formAction, isPending] = useActionState<AdminActionResult, FormData>(
    updateCommissionRate,
    { ok: true },
  );
  const [submitted, setSubmitted] = useState(false);

  return (
    <form action={formAction} onSubmit={() => setSubmitted(true)} className="space-y-4">
      <Field
        label="Commission rate (%)"
        hint="Charged on every new booking. Applies to NEW bookings only — existing deals keep the rate they were created with."
        error={!state.ok ? state.error : undefined}
      >
        <Input
          type="number"
          name="rate"
          min={0}
          max={50}
          step={0.5}
          defaultValue={currentRate}
          required
          inputMode="decimal"
        />
      </Field>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save rate"}
        </Button>
        <Badge variant="success">Current rate: {currentRate}%</Badge>
      </div>

      {submitted && state.ok && (
        <p className="text-sm text-emerald-300">
          Rate saved. New bookings will use this rate.
        </p>
      )}
      {submitted && !state.ok && state.error && (
        <p className="text-sm text-red-300">{state.error}</p>
      )}
    </form>
  );
}
