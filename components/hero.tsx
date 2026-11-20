import Link from "next/link";
import { buttonClasses } from "@/components/ui";

/**
 * Landing hero. Original CSS/SVG decoration only — a synthwave sun, horizon
 * grid and palm silhouettes. No Rockstar assets or key art.
 */
export function Hero() {
  return (
    <section className="bg-vice-sunset relative overflow-hidden">
      {/* Synthwave sun */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-10 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-gradient-to-b from-sunset-yellow via-sunset-orange to-neon-pink opacity-90 sm:h-72 sm:w-72"
        style={{
          maskImage:
            "repeating-linear-gradient(to bottom, black 0 26px, transparent 26px 30px)",
          WebkitMaskImage:
            "repeating-linear-gradient(to bottom, black 0 26px, transparent 26px 30px)",
        }}
      />
      {/* Horizon grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 opacity-25"
        style={{
          backgroundImage:
            "linear-gradient(rgba(34,211,238,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.5) 1px, transparent 1px)",
          backgroundSize: "100% 16px, 48px 100%",
          maskImage: "linear-gradient(to bottom, transparent, black 60%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent, black 60%)",
        }}
      />
      {/* Palm silhouettes */}
      <svg
        aria-hidden
        viewBox="0 0 100 100"
        className="pointer-events-none absolute bottom-0 left-2 h-32 w-32 text-night-950 opacity-80 sm:left-10 sm:h-44 sm:w-44"
        fill="currentColor"
      >
        <path d="M47 100 C45 72 43 52 50 30 L55 30 C51 54 53 74 55 100 Z" />
        <path d="M52 32 Q32 8 6 14 Q30 20 51 34 Z" />
        <path d="M52 32 Q38 2 18 2 Q36 12 51 32 Z" />
        <path d="M52 30 Q60 2 82 4 Q66 12 53 30 Z" />
        <path d="M52 32 Q72 8 96 16 Q72 20 53 34 Z" />
        <path d="M52 32 Q50 12 52 0 Q56 14 54 32 Z" />
      </svg>
      <svg
        aria-hidden
        viewBox="0 0 100 100"
        className="pointer-events-none absolute right-2 bottom-0 h-24 w-24 -scale-x-100 text-night-950 opacity-70 sm:right-10 sm:h-36 sm:w-36"
        fill="currentColor"
      >
        <path d="M47 100 C45 72 43 52 50 30 L55 30 C51 54 53 74 55 100 Z" />
        <path d="M52 32 Q32 8 6 14 Q30 20 51 34 Z" />
        <path d="M52 32 Q38 2 18 2 Q36 12 51 32 Z" />
        <path d="M52 30 Q60 2 82 4 Q66 12 53 30 Z" />
        <path d="M52 32 Q72 8 96 16 Q72 20 53 34 Z" />
        <path d="M52 32 Q50 12 52 0 Q56 14 54 32 Z" />
      </svg>

      <div className="relative mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
        <p className="text-xs font-bold tracking-[0.3em] text-neon-cyan uppercase">
          Sponsorships for the Leonida era
        </p>
        <h1 className="font-display mx-auto mt-4 max-w-3xl text-6xl leading-[0.95] tracking-wide text-white sm:text-7xl lg:text-8xl">
          Find your <span className="text-sunset-gradient">GTA creator</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
          Brands meet the creators shaping GTA VI. Browse verified creators,
          book a short, a stream shout-out, or a full dedicated video, and
          track the deal from request to paid.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/creators" className={buttonClasses("primary", "lg")}>
            Browse creators
          </Link>
          <Link href="/register" className={buttonClasses("secondary", "lg")}>
            Join as a creator
          </Link>
        </div>
        <p className="mt-6 text-xs tracking-wide text-slate-400">
          Verified creators · Transparent pricing · Payment arranged directly
          between brand and creator
        </p>
      </div>
    </section>
  );
}
