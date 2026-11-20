import { auth, signOut } from "@/auth";
import { buttonClasses } from "@/components/ui";
import Link from "next/link";

export async function SiteHeader() {
  let session = null;
  try {
    session = await auth();
  } catch {
    session = null;
  }
  const user = session?.user;

  return (
    <header className="sticky top-0 z-40 border-b border-violet-400/15 bg-night-950/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-display bg-gradient-to-r from-neon-pink via-sunset-orange to-sunset-yellow bg-clip-text text-3xl tracking-wider text-transparent">
            VICE
          </span>
          <span className="font-display text-xl tracking-widest text-white">
            COLLAB
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm font-medium sm:gap-2">
          <Link
            href="/creators"
            className="rounded-full px-3 py-2 text-slate-300 transition hover:bg-white/5 hover:text-white"
          >
            Creators
          </Link>
          <Link
            href="/#how-it-works"
            className="hidden rounded-full px-3 py-2 text-slate-300 transition hover:bg-white/5 hover:text-white sm:inline"
          >
            How it works
          </Link>

          {user ? (
            <>
              <Link href="/dashboard" className={buttonClasses("secondary", "sm")}>
                Dashboard
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button type="submit" className={buttonClasses("ghost", "sm")}>
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className={buttonClasses("ghost", "sm")}>
                Sign in
              </Link>
              <Link href="/register" className={buttonClasses("primary", "sm")}>
                Join free
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
