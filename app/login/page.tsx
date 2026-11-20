import { auth } from "@/auth";
import { LoginForm } from "@/components/auth-forms";
import { Card } from "@/components/ui";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string; next?: string }>;
}) {
  const { registered, next } = await searchParams;
  // Honor ?next= (e.g. /creators/[id]/book) so a sign-in from a gated page
  // returns there. Only same-site paths are accepted (no open redirects).
  const callbackUrl =
    next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  const session = await auth();
  if (session?.user?.id) redirect(callbackUrl);

  const googleEnabled = Boolean(
    (process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID) &&
      (process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET),
  );

  return (
    <div className="bg-vice-sunset">
      <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-14 sm:py-20">
        <p className="text-xs font-bold tracking-[0.25em] text-neon-cyan uppercase">
          ViceCollab
        </p>
        <h1 className="font-display mt-2 text-center text-5xl tracking-wide text-white sm:text-6xl">
          <span className="text-sunset-gradient">Welcome back</span>
        </h1>
        <p className="mt-3 text-center text-slate-400">
          Sign in to manage your deals and profile.
        </p>

        <Card className="mt-8 w-full">
          {registered === "1" && (
            <p className="mb-5 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-3.5 py-2.5 text-sm text-emerald-200">
              Account created — please sign in.
            </p>
          )}
          <LoginForm googleEnabled={googleEnabled} callbackUrl={callbackUrl} />
        </Card>

        <p className="mt-6 text-sm text-slate-400">
          New here?{" "}
          <Link href="/register" className="font-semibold text-neon-cyan hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
