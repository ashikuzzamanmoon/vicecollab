import { Button, Card } from "@/components/ui";
import { setOnboardingRole } from "@/lib/actions/auth";
import { requireSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const ROLE_OPTIONS: { value: "CREATOR" | "BRAND"; title: string; description: string }[] = [
  {
    value: "CREATOR",
    title: "Creator",
    description: "List your channel, set your packages, and get booked by brands.",
  },
  {
    value: "BRAND",
    title: "Brand",
    description: "Find GTA creators and book sponsorships for your game or product.",
  },
];

export default async function OnboardingPage() {
  const session = await requireSession();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      creatorProfile: { select: { id: true } },
      brandProfile: { select: { id: true } },
    },
  });
  if (!user) redirect("/login");
  // Admin accounts go directly to the Admin console — no onboarding needed.
  if (user.role === "ADMIN") redirect("/admin");
  // A profile already exists — nothing left to choose here.
  if (user.creatorProfile || user.brandProfile) redirect("/dashboard");

  return (
    <div className="bg-vice-sunset">
      <div className="mx-auto flex w-full max-w-lg flex-col items-center px-4 py-14 sm:py-20">
        <p className="text-xs font-bold tracking-[0.25em] text-neon-cyan uppercase">
          One last step
        </p>
        <h1 className="font-display mt-2 text-center text-5xl tracking-wide text-white sm:text-6xl">
          <span className="text-sunset-gradient">How will you use it?</span>
        </h1>
        <p className="mt-3 text-center text-slate-400">
          Choose how you&apos;ll use the marketplace.
        </p>

        <Card className="mt-8 w-full">
          <form action={setOnboardingRole} className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Account type">
              {ROLE_OPTIONS.map((option) => (
                <label key={option.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value={option.value}
                    defaultChecked={option.value === (user.role === "BRAND" ? "BRAND" : "CREATOR")}
                    required
                    className="peer sr-only"
                  />
                  <span className="block h-full rounded-2xl border border-violet-400/25 bg-night-900/80 p-4 transition peer-checked:border-neon-pink peer-checked:bg-neon-pink/10 peer-checked:shadow-[0_0_24px_rgba(255,46,147,0.25)] hover:border-violet-400/50">
                    <span className="font-display block text-xl tracking-wide text-white">
                      {option.title}
                    </span>
                    <span className="mt-1 block text-sm text-slate-400">
                      {option.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            <Button type="submit" size="lg" className="w-full">
              Continue
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
