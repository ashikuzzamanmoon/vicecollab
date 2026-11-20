import { CountdownChip } from "@/components/countdown-chip";
import { DealActions, PaymentForm } from "@/components/deal-actions";
import { DealStatusBadge, DealTimeline } from "@/components/deal-timeline";
import { MessageThread } from "@/components/message-thread";
import { ReviewForm } from "@/components/review-form";
import { Badge, Card, PageHeader } from "@/components/ui";
import { expireStaleBookings } from "@/lib/actions/bookings";
import { requireSession } from "@/lib/auth-helpers";
import { packageTypeLabel } from "@/lib/constants";
import { hasDealActions } from "@/lib/deal-helpers";
import { MANUAL_PAYMENT_NOTE, formatUSD } from "@/lib/payments";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;

  // Lazy expiry: a request past its 72h window becomes EXPIRED before rendering.
  await expireStaleBookings();

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      creator: true,
      brand: true,
      package: true,
      messages: {
        include: { sender: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
      review: true,
    },
  });
  if (!booking) notFound();

  const isCreator = booking.creator.userId === session.user.id;
  const isBrand = booking.brand.userId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isCreator && !isBrand && !isAdmin) redirect("/dashboard/deals");

  const creatorPayout = booking.priceCents - booking.commissionCents;

  return (
    <div>
      <PageHeader
        eyebrow="Deal"
        title={booking.title}
        description={`Created ${formatDate(booking.createdAt)}${booking.deadline ? ` · Deadline ${formatDate(booking.deadline)}` : ""}`}
        actions={<DealStatusBadge status={booking.status} />}
      />

      <Card className="mb-6">
        <DealTimeline status={booking.status} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h2 className="font-display text-2xl tracking-wide text-white">Brief</h2>
            <p className="mt-3 text-sm whitespace-pre-wrap text-slate-200">{booking.brief}</p>
            {booking.package && (
              <div className="mt-5 border-t border-white/10 pt-4">
                <h3 className="text-sm font-semibold text-slate-200">Package</h3>
                <p className="mt-1 text-sm text-slate-400">
                  {booking.package.title}
                  <span className="text-slate-500">
                    {" · "}
                    {packageTypeLabel(booking.package.type)}
                    {" · "}
                    {booking.package.deliveryDays}{" "}
                    {booking.package.deliveryDays === 1 ? "day" : "days"} delivery
                  </span>
                </p>
                {booking.package.description && (
                  <p className="mt-1 text-sm text-slate-400">{booking.package.description}</p>
                )}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="font-display text-2xl tracking-wide text-white">Price breakdown</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Deal price</dt>
                <dd className="font-medium text-slate-100">{formatUSD(booking.priceCents)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">
                  Platform commission ({booking.commissionRate}%)
                </dt>
                <dd className="font-medium text-slate-100">
                  {formatUSD(booking.commissionCents)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
                <dt className="font-semibold text-slate-200">Creator payout</dt>
                <dd className="font-semibold text-neon-cyan">{formatUSD(creatorPayout)}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h2 className="font-display text-2xl tracking-wide text-white">Payment coordination</h2>
            <p className="mt-3 rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              {MANUAL_PAYMENT_NOTE}
            </p>
            <div className="mt-4">
              <PaymentForm
                bookingId={booking.id}
                paymentMethod={booking.paymentMethod}
                paymentStatus={booking.paymentStatus}
                paymentNote={booking.paymentNote}
                canEdit={isBrand}
              />
            </div>
          </Card>

          <MessageThread
            bookingId={booking.id}
            currentUserId={session.user.id}
            messages={booking.messages.map((message) => ({
              id: message.id,
              body: message.body,
              createdAt: message.createdAt,
              senderId: message.senderId,
              senderName:
                message.sender.name ??
                (message.senderId === booking.creator.userId
                  ? booking.creator.displayName
                  : booking.brand.companyName),
            }))}
          />

          {booking.review ? (
            <Card>
              <h2 className="font-display text-2xl tracking-wide text-white">Review</h2>
              <p className="mt-3 text-sm text-slate-200">
                <span className="text-lg font-semibold text-sunset-yellow">
                  {"★".repeat(booking.review.rating)}
                  {"☆".repeat(5 - booking.review.rating)}
                </span>
                <span className="ml-2 text-slate-400">
                  {booking.review.rating}/5 · {formatDate(booking.review.createdAt)}
                </span>
              </p>
              {booking.review.comment && (
                <p className="mt-2 text-sm whitespace-pre-wrap text-slate-200">
                  {booking.review.comment}
                </p>
              )}
            </Card>
          ) : (
            isBrand &&
            booking.status === "PAID" && (
              <Card>
                <h2 className="font-display text-2xl tracking-wide text-white">Leave a review</h2>
                <p className="mt-1 text-sm text-slate-400">
                  The deal is paid. Rate your experience with {booking.creator.displayName} — one
                  review per deal.
                </p>
                <div className="mt-4">
                  <ReviewForm bookingId={booking.id} />
                </div>
              </Card>
            )
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="font-display text-2xl tracking-wide text-white">Parties</h2>
            <div className="mt-4 space-y-4 text-sm">
              <div>
                <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Creator
                </p>
                <Link
                  href={`/creators/${booking.creator.id}`}
                  className="mt-1 block font-semibold text-neon-cyan hover:underline"
                >
                  {booking.creator.displayName}
                </Link>
                {booking.creator.tagline && (
                  <p className="mt-0.5 text-slate-400">{booking.creator.tagline}</p>
                )}
              </div>
              <div>
                <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">Brand</p>
                <p className="mt-1 font-semibold text-slate-100">{booking.brand.companyName}</p>
                {booking.brand.website && (
                  <a
                    href={booking.brand.website}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-0.5 block truncate text-neon-cyan hover:underline"
                  >
                    {booking.brand.website}
                  </a>
                )}
              </div>
            </div>
            {booking.status === "REQUESTED" && (
              <div className="mt-5 border-t border-white/10 pt-4">
                <p className="text-xs text-slate-400">
                  The creator must respond by {formatDate(booking.respondBy)}.
                </p>
                <div className="mt-2">
                  <CountdownChip respondBy={booking.respondBy} />
                </div>
              </div>
            )}
          </Card>

          <Card>
            <h2 className="font-display text-2xl tracking-wide text-white">Deal actions</h2>
            <div className="mt-4">
              {hasDealActions(booking.status, isCreator, isBrand) ? (
                <DealActions
                  bookingId={booking.id}
                  status={booking.status}
                  isCreator={isCreator}
                  isBrand={isBrand}
                />
              ) : isAdmin && !isCreator && !isBrand ? (
                <p className="text-sm text-slate-400">
                  You are viewing this deal as an admin. Only the creator and the brand can act
                  on it.
                </p>
              ) : (
                <p className="text-sm text-slate-400">
                  No actions are available for this deal right now.
                </p>
              )}
            </div>
          </Card>

          <Card>
            <h2 className="font-display text-2xl tracking-wide text-white">Deal details</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Status</dt>
                <dd>
                  <DealStatusBadge status={booking.status} />
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Created</dt>
                <dd className="text-slate-100">{formatDate(booking.createdAt)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Deadline</dt>
                <dd className="text-slate-100">
                  {booking.deadline ? formatDate(booking.deadline) : "Not set"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Response window</dt>
                <dd className="text-slate-100">72 hours</dd>
              </div>
            </dl>
            <div className="mt-4">
              <Badge variant="muted">Deal #{booking.id.slice(0, 8)}</Badge>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
