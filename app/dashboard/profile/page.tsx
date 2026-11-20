import { BrandProfileForm } from "@/components/brand-profile-form";
import { CreatorProfileForm } from "@/components/creator-profile-form";
import { PackageManager } from "@/components/package-manager";
import { buttonClasses, Card, PageHeader } from "@/components/ui";
import { requireSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await requireSession();

  // Read the role from the database, not the JWT: the onboarding role picker
  // can change the role after sign-in, and the JWT still carries the old one.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      creatorProfile: {
        include: {
          packages: {
            include: { _count: { select: { bookings: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
      },
      brandProfile: true,
    },
  });
  if (!user) redirect("/login");

  if (user.role === "ADMIN") {
    return (
      <>
        <PageHeader
          eyebrow="Dashboard"
          title="Profile"
          description="Your account settings live here."
        />
        <Card>
          <p className="text-slate-200">
            Admin accounts don&apos;t have marketplace profiles — admins manage the platform
            instead.
          </p>
          <Link href="/admin" className={buttonClasses("secondary", "md", "mt-4")}>
            Go to Admin
          </Link>
        </Card>
      </>
    );
  }

  if (user.role === "BRAND") {
    return (
      <>
        <PageHeader
          eyebrow="Dashboard"
          title="Brand Profile"
          description="Creators see this when you send them a booking request."
        />
        <BrandProfileForm profile={user.brandProfile} />
      </>
    );
  }

  // CREATOR
  const profile = user.creatorProfile;
  const packages = profile?.packages ?? [];
  const hasActivePackage = packages.some((pkg) => pkg.isActive);

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title="Creator Profile"
        description="Your public listing — what brands see when they browse the directory."
      />
      <div className="space-y-10">
        <CreatorProfileForm profile={profile} hasActivePackage={hasActivePackage} />
        {profile ? (
          <PackageManager creatorId={profile.id} packages={packages} />
        ) : (
          <Card>
            <h2 className="font-display text-2xl tracking-wide text-white">Packages</h2>
            <p className="mt-1 text-sm text-slate-400">
              Create your profile first — then you can add the packages brands will book.
            </p>
          </Card>
        )}
      </div>
    </>
  );
}
