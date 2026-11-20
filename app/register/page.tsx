import { auth } from "@/auth";
import { RegisterForm } from "@/components/auth-forms";
import { Card } from "@/components/ui";
import Link from "next/link";
import { redirect } from "next/navigation";



export default async function RegisterPage() {
  const session = await auth();
  if (session?.user?.id) redirect("/dashboard");

  const googleEnabled = Boolean(
    (process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID) &&
      (process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET),
  );

  return (
    <div className="bg-vice-sunset">
      <div className="mx-auto flex w-full max-w-lg flex-col items-center px-4 py-14 sm:py-20">
        <p className="text-xs font-bold tracking-[0.25em] text-neon-cyan uppercase">
          ViceCollab
        </p>
        <h1 className="font-display mt-2 text-center text-5xl tracking-wide text-white sm:text-6xl">
          <span className="text-sunset-gradient">Join the marketplace</span>
        </h1>
        <p className="mt-3 text-center text-slate-400">
          Creators get sponsored. Brands find the right GTA creators.
        </p>

        <Card className="mt-8 w-full">
          <RegisterForm googleEnabled={googleEnabled} />
        </Card>

        <p className="mt-6 text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-neon-cyan hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
