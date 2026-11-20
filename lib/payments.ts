/**
 * Payments module — v1: MANUAL PAYMENT COORDINATION (no gateway, no escrow).
 *
 * WHY: Stripe is unavailable in Bangladesh, and Paddle / Lemon Squeezy are
 * merchants-of-record for digital products, not escrow marketplaces. So v1
 * deliberately has NO automated checkout and NO escrow.
 *
 * HOW IT WORKS IN v1:
 * - A booking records the agreed price, the platform commission (default 15%),
 *   the payment method the two parties agreed on, and a manual payment status.
 * - Money moves OUTSIDE the platform (bank transfer / Payoneer / PayPal).
 * - The brand marks the deal Paid once the creator confirms receipt; the
 *   commission is tracked on the deal for the operator to settle.
 *
 * PLUGGING IN A GATEWAY LATER:
 * - Replace `createCheckoutSession()` with a real provider call (e.g. Stripe
 *   Connect, once available) and store the provider's session/payment id on
 *   the Booking. Commission math, deal statuses and this module's labels all
 *   stay the same.
 */

import type { PaymentMethod, PaymentStatus } from "@prisma/client";

/** Short explainer shown wherever money is discussed (booking form, deal page). */
export const MANUAL_PAYMENT_NOTE =
  "Payment is arranged directly between you and the creator, outside the platform. The platform tracks the deal and its 15% commission.";

/** Commission in cents for a deal price, at the given rate (percent). */
export function calculateCommission(priceCents: number, ratePercent: number): number {
  return Math.round(priceCents * (ratePercent / 100));
}

/** Format cents as USD: 50000 -> "$500.00". */
export function formatUSD(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "BANK_TRANSFER", label: "Bank transfer" },
  { value: "PAYONEER", label: "Payoneer" },
  { value: "PAYPAL", label: "PayPal" },
  { value: "OTHER", label: "Other (see note)" },
];

export function paymentMethodLabel(value: PaymentMethod | null | undefined): string {
  if (!value) return "Not set";
  return PAYMENT_METHODS.find((m) => m.value === value)?.label ?? value;
}

export const PAYMENT_STATUSES: { value: PaymentStatus; label: string }[] = [
  { value: "NOT_STARTED", label: "Not started" },
  { value: "PENDING", label: "Payment pending" },
  { value: "CONFIRMED", label: "Payment confirmed" },
];

export function paymentStatusLabel(value: PaymentStatus): string {
  return PAYMENT_STATUSES.find((s) => s.value === value)?.label ?? value;
}

/**
 * Gateway stub. Throws in v1 — there is intentionally no checkout provider.
 * See the module docblock above for how to plug one in later.
 */
export function createCheckoutSession(): never {
  throw new Error(
    "Payments are manual in v1 — no payment gateway is connected. See lib/payments.ts.",
  );
}
