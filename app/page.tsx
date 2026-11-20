import Link from "next/link";
import { CreatorCard } from "@/components/creator-card";
import { Hero } from "@/components/hero";
import { Card, EmptyState, buttonClasses } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { getCommissionRate } from "@/lib/settings";

export const revalidate = 60;

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Browse creators",
    body: "Explore verified GTA creators by platform, niche, audience, and price. Compare followers, average views, and engagement before you reach out.",
  },
  {
    step: "02",
    title: "Send a booking request",
    body: "Pick a package or describe a custom brief. The creator reviews your request and accepts, or replies with questions, within the response window.",
  },
  {
    step: "03",
    title: "Creator delivers, you pay direct",
    body: "Follow the deal from production to delivery in one thread. Payment is arranged directly between you and the creator, and the platform tracks its commission on each deal.",
  },
];

export default async function Home() {
  const [featuredCreators, commissionRate] = await Promise.all([
    prisma.creatorProfile.findMany({
      where: { isPublished: true, featured: true },
      include: { packages: true, reviews: true },
      orderBy: { followers: "desc" },
      take: 6,
    }),
    getCommissionRate(),
  ]);

  return (
    <div>
      <Hero />

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <p className="text-xs font-bold tracking-[0.25em] text-neon-cyan uppercase">
            How it works
          </p>
          <h2 className="font-display mt-2 text-4xl tracking-wide text-white sm:text-5xl">
            From discovery to <span className="text-sunset-gradient">paid deal</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-400">
            Three steps, no middlemen in the money flow. The platform takes a{" "}
            {commissionRate}% commission, tracked on every deal.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {HOW_IT_WORKS.map((item) => (
            <Card key={item.step} className="relative">
              <p className="font-display text-sunset-gradient text-5xl tracking-wide">
                {item.step}
              </p>
              <h3 className="font-display mt-3 text-2xl tracking-wide text-white">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Featured creators */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.25em] text-neon-cyan uppercase">
              Featured creators
            </p>
            <h2 className="font-display mt-2 text-4xl tracking-wide text-white sm:text-5xl">
              Creators in the <span className="text-sunset-gradient">spotlight</span>
            </h2>
          </div>
          <Link href="/creators" className={buttonClasses("secondary", "md")}>
            View all creators
          </Link>
        </div>
        {featuredCreators.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredCreators.map((creator) => (
              <CreatorCard key={creator.id} creator={creator} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No featured creators yet"
            description="Featured creators will appear here as soon as the first creators publish their profiles."
            action={
              <Link href="/creators" className={buttonClasses("secondary", "md")}>
                Browse all creators
              </Link>
            }
          />
        )}
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="neon-ring relative overflow-hidden rounded-3xl bg-gradient-to-r from-neon-pink/25 via-neon-purple/25 to-neon-cyan/20 px-6 py-12 text-center sm:px-12">
          <h2 className="font-display mx-auto max-w-2xl text-4xl tracking-wide text-white sm:text-5xl">
            Ready to get your brand into Leonida?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">
            GTA VI is the biggest stage in gaming. Put your brand in front of
            the audience that lives there.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/creators" className={buttonClasses("primary", "lg")}>
              Browse creators
            </Link>
            <Link href="/register" className={buttonClasses("secondary", "lg")}>
              Join as a creator
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
