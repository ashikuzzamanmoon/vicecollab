import { Badge, buttonClasses, Card, EmptyState, PageHeader } from "@/components/ui";
import { setFeatured, setPublished, setVerification } from "@/lib/actions/admin";
import { requireRole } from "@/lib/auth-helpers";
import { platformLabel } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { formatDate, formatNumber } from "@/lib/utils";
import type { VerificationStatus } from "@prisma/client";
import Link from "next/link";

export const dynamic = "force-dynamic";

const VERIFICATION_FILTERS: { value: string; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "VERIFIED", label: "Verified" },
  { value: "REJECTED", label: "Rejected" },
];

const VERIFICATION_BADGE: Record<VerificationStatus, "success" | "warning" | "danger"> = {
  VERIFIED: "success",
  PENDING: "warning",
  REJECTED: "danger",
};

function verificationLabel(status: VerificationStatus): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export default async function AdminCreatorsPage({
  searchParams,
}: {
  searchParams?: Promise<{ verification?: string }>;
}) {
  await requireRole("ADMIN");

  const params = await searchParams;
  const filter = params?.verification;
  const activeFilter: VerificationStatus | "ALL" =
    filter === "PENDING" || filter === "VERIFIED" || filter === "REJECTED" ? filter : "ALL";

  const creators = await prisma.creatorProfile.findMany({
    where: activeFilter === "ALL" ? undefined : { verificationStatus: activeFilter },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { email: true } } },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Admin Console"
        title="Creators"
        description="Verify creators, feature listings, and publish or unpublish profiles."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {VERIFICATION_FILTERS.map((option) => {
          const href =
            option.value === "ALL"
              ? "/admin/creators"
              : `/admin/creators?verification=${option.value}`;
          const active = option.value === activeFilter;
          return (
            <Link
              key={option.value}
              href={href}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition",
                active
                  ? "bg-gradient-to-r from-neon-pink/25 to-neon-purple/25 text-white ring-1 ring-neon-pink/50"
                  : "text-slate-400 hover:bg-white/5 hover:text-white",
              )}
            >
              {option.label}
            </Link>
          );
        })}
      </div>

      {creators.length === 0 ? (
        <EmptyState
          title="No creators found"
          description={
            activeFilter === "ALL"
              ? "No creator profiles exist yet."
              : `No creators with ${verificationLabel(activeFilter as VerificationStatus)} status.`
          }
        />
      ) : (
        <div className="space-y-4">
          {creators.map((creator) => {
            // Inline wrappers: the shared actions return a result object, which
            // React's form `action` type does not accept, so discard it here.
            const verifyAction = async () => {
              "use server";
              await setVerification(creator.id, "VERIFIED");
            };
            const rejectAction = async () => {
              "use server";
              await setVerification(creator.id, "REJECTED");
            };
            const featureAction = async () => {
              "use server";
              await setFeatured(creator.id, !creator.featured);
            };
            const publishAction = async () => {
              "use server";
              await setPublished(creator.id, !creator.isPublished);
            };

            return (
              <Card key={creator.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-2xl tracking-wide text-white">
                        {creator.displayName}
                      </h2>
                      <Badge variant={VERIFICATION_BADGE[creator.verificationStatus]}>
                        {verificationLabel(creator.verificationStatus)}
                      </Badge>
                      {creator.isPublished ? (
                        <Badge variant="success">Published</Badge>
                      ) : (
                        <Badge variant="muted">Unpublished</Badge>
                      )}
                      {creator.featured && <Badge variant="neon">Featured</Badge>}
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-400">{creator.user.email}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {platformLabel(creator.primaryPlatform)} ·{" "}
                      {formatNumber(creator.followers)} followers · Joined{" "}
                      {formatDate(creator.createdAt)}
                    </p>
                    {creator.tagline && (
                      <p className="mt-1 text-sm text-slate-500">{creator.tagline}</p>
                    )}
                  </div>

                  <Link
                    href={`/creators/${creator.id}`}
                    className={buttonClasses("ghost", "sm")}
                  >
                    View public profile
                  </Link>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-violet-400/10 pt-4">
                  <form action={verifyAction}>
                    <button
                      type="submit"
                      disabled={creator.verificationStatus === "VERIFIED"}
                      className={buttonClasses("primary", "sm")}
                    >
                      Verify
                    </button>
                  </form>
                  <form action={rejectAction}>
                    <button
                      type="submit"
                      disabled={creator.verificationStatus === "REJECTED"}
                      className={buttonClasses("danger", "sm")}
                    >
                      Reject
                    </button>
                  </form>
                  <form action={featureAction}>
                    <button type="submit" className={buttonClasses("secondary", "sm")}>
                      {creator.featured ? "Unfeature" : "Feature"}
                    </button>
                  </form>
                  <form action={publishAction}>
                    <button type="submit" className={buttonClasses("secondary", "sm")}>
                      {creator.isPublished ? "Unpublish" : "Publish"}
                    </button>
                  </form>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
