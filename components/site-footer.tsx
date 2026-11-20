import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-violet-400/15 bg-night-900/60">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-display text-2xl tracking-wider text-white">
            <span className="bg-gradient-to-r from-neon-pink via-sunset-orange to-sunset-yellow bg-clip-text text-transparent">
              VICE
            </span>{" "}
            COLLAB
          </p>
          <p className="mt-2 max-w-sm text-sm text-slate-400">
            Where GTA creators meet the brands that want to reach their audience.
          </p>
        </div>

        <nav className="flex gap-12 text-sm">
          <div className="flex flex-col gap-2">
            <p className="font-semibold text-slate-200">Marketplace</p>
            <Link href="/creators" className="text-slate-400 hover:text-neon-cyan">
              Browse creators
            </Link>
            <Link href="/register" className="text-slate-400 hover:text-neon-cyan">
              Join as a creator
            </Link>
            <Link href="/register" className="text-slate-400 hover:text-neon-cyan">
              Join as a brand
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-semibold text-slate-200">Account</p>
            <Link href="/login" className="text-slate-400 hover:text-neon-cyan">
              Sign in
            </Link>
            <Link href="/dashboard" className="text-slate-400 hover:text-neon-cyan">
              Dashboard
            </Link>
          </div>
        </nav>
      </div>

      <div className="border-t border-violet-400/10">
        <p className="mx-auto max-w-7xl px-4 py-4 text-xs text-slate-500 sm:px-6">
          ViceCollab is an independent fan-made service and is not affiliated with,
          endorsed by, or connected to Rockstar Games or Take-Two Interactive.
        </p>
      </div>
    </footer>
  );
}
