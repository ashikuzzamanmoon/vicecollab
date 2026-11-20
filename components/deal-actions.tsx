"use client";

import {
  advanceBooking,
  cancelBooking,
  markPaid,
  respondToBooking,
  updatePayment,
} from "@/lib/actions/bookings";
import {
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  paymentMethodLabel,
  paymentStatusLabel,
} from "@/lib/payments";
import type { DealStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import { useState, useTransition } from "react";
import { Button, Field, Select, Textarea } from "@/components/ui";

/* ------------------------------------------------------------------ */
/* Role-aware pipeline actions                                         */
/* ------------------------------------------------------------------ */

export function DealActions({
  bookingId,
  status,
  isCreator,
  isBrand,
}: {
  bookingId: string;
  status: DealStatus;
  isCreator: boolean;
  isBrand: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) setError(result.error ?? "Something went wrong. Please try again.");
    });
  };

  const canCancel =
    (isCreator || isBrand) && (status === "REQUESTED" || status === "ACCEPTED");
  const showAcceptDecline = isCreator && status === "REQUESTED";
  const showStartProduction = isCreator && status === "ACCEPTED";
  const showMarkDelivered = isCreator && status === "IN_PRODUCTION";
  const showMarkPaid = isBrand && status === "DELIVERED";

  if (!canCancel && !showAcceptDecline && !showStartProduction && !showMarkDelivered && !showMarkPaid) {
    return null;
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {showAcceptDecline && (
          <>
            <Button
              disabled={isPending}
              onClick={() => run(() => respondToBooking(bookingId, "accept"))}
            >
              Accept request
            </Button>
            <Button
              variant="danger"
              disabled={isPending}
              onClick={() => {
                if (window.confirm("Decline this booking request? This cannot be undone.")) {
                  run(() => respondToBooking(bookingId, "decline"));
                }
              }}
            >
              Decline
            </Button>
          </>
        )}
        {showStartProduction && (
          <Button
            disabled={isPending}
            onClick={() => run(() => advanceBooking({ bookingId, to: "IN_PRODUCTION" }))}
          >
            Start production
          </Button>
        )}
        {showMarkDelivered && (
          <Button
            disabled={isPending}
            onClick={() => run(() => advanceBooking({ bookingId, to: "DELIVERED" }))}
          >
            Mark delivered
          </Button>
        )}
        {showMarkPaid && (
          <Button disabled={isPending} onClick={() => run(() => markPaid(bookingId))}>
            Mark as paid
          </Button>
        )}
        {canCancel && (
          <Button
            variant="ghost"
            disabled={isPending}
            onClick={() => {
              if (window.confirm("Cancel this deal? This cannot be undone.")) {
                run(() => cancelBooking(bookingId));
              }
            }}
          >
            Cancel deal
          </Button>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Manual payment coordination panel                                   */
/* ------------------------------------------------------------------ */

export function PaymentForm({
  bookingId,
  paymentMethod,
  paymentStatus,
  paymentNote,
  canEdit,
}: {
  bookingId: string;
  paymentMethod: PaymentMethod | null;
  paymentStatus: PaymentStatus;
  paymentNote: string | null;
  canEdit: boolean;
}) {
  const [method, setMethod] = useState<PaymentMethod | "">(paymentMethod ?? "");
  const [status, setStatus] = useState<PaymentStatus>(paymentStatus);
  const [note, setNote] = useState(paymentNote ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (!canEdit) {
    return (
      <dl className="space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-slate-400">Payment method</dt>
          <dd className="font-medium text-slate-100">{paymentMethodLabel(paymentMethod)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-400">Payment status</dt>
          <dd className="font-medium text-slate-100">{paymentStatusLabel(paymentStatus)}</dd>
        </div>
        {paymentNote && (
          <div>
            <dt className="text-slate-400">Note from the brand</dt>
            <dd className="mt-1 rounded-xl bg-night-900/70 px-3 py-2 whitespace-pre-wrap text-slate-200">
              {paymentNote}
            </dd>
          </div>
        )}
      </dl>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        setSaved(false);
        startTransition(async () => {
          const result = await updatePayment({
            bookingId,
            paymentMethod: method === "" ? null : method,
            paymentStatus: status,
            paymentNote: note,
          });
          if (!result.ok) {
            setError(result.error ?? "Could not save payment details.");
          } else {
            setSaved(true);
          }
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Payment method">
          <Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod | "")}>
            <option value="">Not set yet</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Payment status">
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as PaymentStatus)}
          >
            {PAYMENT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field
        label="Payment note"
        hint="Anything the creator needs to know — account details, timing, or a reference."
      >
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Bank transfer sent on Friday, reference #1234."
          rows={3}
        />
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="secondary" disabled={isPending}>
          {isPending ? "Saving..." : "Save payment details"}
        </Button>
        {saved && <span className="text-sm text-emerald-300">Saved.</span>}
        {error && <span className="text-sm text-red-300">{error}</span>}
      </div>
    </form>
  );
}
