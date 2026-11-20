import { auth } from "@/auth";
import { BookingForm } from "@/components/booking-form";
import { buttonClasses, Card, EmptyState, PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { getCommissionRate } from "@/lib/settings";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function BookCreatorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ package?: string }>;
}) {
  const { id } = await params;
  const { package: packageParam } = await searchParams;

  const creator = await prisma.creatorProfile.findUnique({
    where: { id },
    include: {
      packages: {
        where: { isActive: true },
        orderBy: { priceCents: "asc" },
      },
    },
  });
  if (!creator || !creator.isPublished) notFound();

  const session = await auth();
  if (!session?.user?.id) redirect(`/login?next=/creators/${id}/book`);

  if (session.user.role !== "BRAND") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <PageHeader
          eyebrow="Booking request"
          title={`Book ${creator.displayName}`}
          description="Send a booking request and start a deal."
        />
        <Card>
          <p className="text-slate-200">
            Only brands can send booking requests. Creator accounts browse and accept deals from
            their dashboard.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/creators" className={buttonClasses("primary", "md")}>
              Browse creators
            </Link>
            <Link href="/dashboard" className={buttonClasses("secondary", "md")}>
              Go to dashboard
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const brandProfile = await prisma.brandProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!brandProfile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <PageHeader
          eyebrow="Booking request"
          title={`Book ${creator.displayName}`}
          description="Send a booking request and start a deal."
        />
        <Card>
          <p className="text-slate-200">
            Complete your brand profile first so creators know who they are working with.
          </p>
          <div className="mt-5">
            <Link href="/dashboard/profile" className={buttonClasses("primary", "md")}>
              Complete brand profile
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (creator.packages.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <PageHeader
          eyebrow="Booking request"
          title={`Book ${creator.displayName}`}
          description="Send a booking request and start a deal."
        />
        <EmptyState
          title="No active packages"
          description={`${creator.displayName} has no active packages right now. Check back later or browse other creators.`}
          action={
            <Link href="/creators" className={buttonClasses("secondary", "md")}>
              Browse creators
            </Link>
          }
        />
      </div>
    );
  }

  const commissionRate = await getCommissionRate();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Booking request"
        title={`Book ${creator.displayName}`}
        description={`${creator.displayName} has 72 hours to accept or decline your request.`}
      />
      <BookingForm
        creatorId={creator.id}
        creatorName={creator.displayName}
        packages={creator.packages.map((pkg) => ({
          id: pkg.id,
          type: pkg.type,
          title: pkg.title,
          description: pkg.description,
          priceCents: pkg.priceCents,
          deliveryDays: pkg.deliveryDays,
        }))}
        preselectedPackageId={packageParam ?? null}
        commissionRate={commissionRate}
      />
      <p className="mt-6 text-sm text-slate-500">
        <Link href={`/creators/${creator.id}`} className="text-neon-cyan hover:underline">
          Back to {creator.displayName}&apos;s profile
        </Link>
      </p>
    </div>
  );
}
