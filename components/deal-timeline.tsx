import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { DealStatus } from "@prisma/client";
import type { ComponentProps } from "react";

/* ------------------------------------------------------------------ */
/* Shared deal-status labels + badge variants (used by the deals pages) */
/* ------------------------------------------------------------------ */

export const DEAL_STATUS_LABELS: Record<DealStatus, string> = {
  REQUESTED: "Requested",
  ACCEPTED: "Accepted",
  IN_PRODUCTION: "In Production",
  DELIVERED: "Delivered",
  PAID: "Paid",
  DECLINED: "Declined",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

export function dealStatusLabel(status: DealStatus): string {
  return DEAL_STATUS_LABELS[status];
}

type BadgeVariant = NonNullable<ComponentProps<typeof Badge>["variant"]>;

export function dealStatusBadgeVariant(status: DealStatus): BadgeVariant {
  switch (status) {
    case "REQUESTED":
      return "warning";
    case "ACCEPTED":
    case "DELIVERED":
      return "info";
    case "IN_PRODUCTION":
      return "neon";
    case "PAID":
      return "success";
    case "DECLINED":
      return "danger";
    case "CANCELLED":
    case "EXPIRED":
    default:
      return "muted";
  }
}

export function DealStatusBadge({ status }: { status: DealStatus }) {
  return <Badge variant={dealStatusBadgeVariant(status)}>{dealStatusLabel(status)}</Badge>;
}

/* ------------------------------------------------------------------ */
/* Pipeline stepper                                                    */
/* ------------------------------------------------------------------ */

const PIPELINE: { status: DealStatus; label: string }[] = [
  { status: "REQUESTED", label: "Requested" },
  { status: "ACCEPTED", label: "Accepted" },
  { status: "IN_PRODUCTION", label: "In Production" },
  { status: "DELIVERED", label: "Delivered" },
  { status: "PAID", label: "Paid" },
];

const TERMINAL_NOTES: Partial<Record<DealStatus, string>> = {
  DECLINED: "The creator declined this request. No further action is needed.",
  CANCELLED: "This deal was cancelled. No further action is needed.",
  EXPIRED: "The creator did not respond within the 72-hour window, so this request expired.",
};

/** Visual stepper of the 5-stage deal pipeline, with the current stage highlighted. */
export function DealTimeline({ status }: { status: DealStatus }) {
  const currentIndex = PIPELINE.findIndex((step) => step.status === status);
  const isTerminal = currentIndex === -1;

  return (
    <div>
      <ol className="flex items-start">
        {PIPELINE.map((step, index) => {
          const isDone = !isTerminal && index < currentIndex;
          const isCurrent = !isTerminal && index === currentIndex;
          return (
            <li key={step.status} className="flex min-w-0 flex-1 items-start last:flex-none">
              <div className="flex min-w-0 flex-col items-center gap-1.5 text-center">
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold",
                    isDone && "border-neon-cyan/60 bg-neon-cyan/15 text-neon-cyan",
                    isCurrent &&
                      "border-neon-pink bg-neon-pink/20 text-white shadow-[0_0_18px_rgba(255,46,147,0.55)]",
                    !isDone && !isCurrent && "border-white/10 bg-night-700 text-slate-500",
                  )}
                  aria-label={step.label}
                >
                  {isDone ? "✓" : index + 1}
                </span>
                <span
                  className={cn(
                    "text-[11px] leading-tight font-medium sm:text-xs",
                    isCurrent ? "text-white" : isDone ? "text-neon-cyan" : "text-slate-500",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < PIPELINE.length - 1 && (
                <div
                  className={cn(
                    "mx-1 mt-4 h-0.5 min-w-4 flex-1 rounded sm:mx-2",
                    !isTerminal && index < currentIndex ? "bg-neon-cyan/60" : "bg-white/10",
                  )}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
      {isTerminal && TERMINAL_NOTES[status] && (
        <p className="mt-4 rounded-xl border border-white/10 bg-night-700/60 px-4 py-3 text-sm text-slate-300">
          <span className="mr-2 font-semibold text-white">{dealStatusLabel(status)}.</span>
          {TERMINAL_NOTES[status]}
        </p>
      )}
    </div>
  );
}
