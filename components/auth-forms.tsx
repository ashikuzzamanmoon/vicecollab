"use client";

import { Button, Field, Input } from "@/components/ui";
import { registerUser } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

function ErrorBox({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-200">
      {message}
    </p>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-violet-400/20" />
      <span className="text-xs font-medium tracking-wider text-slate-500 uppercase">or</span>
      <span className="h-px flex-1 bg-violet-400/20" />
    </div>
  );
}

export function GoogleButton({ label }: { label: string }) {
  const [pending, setPending] = useState(false);
  return (
    <Button
      type="button"
      variant="secondary"
      className="w-full"
      disabled={pending}
      onClick={() => {
        setPending(true);
        void signIn("google", { callbackUrl: "/onboarding" });
      }}
    >
      {pending ? "Redirecting to Google..." : label}
    </Button>
  );
}

/* ------------------------------------------------------------------ */
/* Login                                                               */
/* ------------------------------------------------------------------ */

export function LoginForm({
  googleEnabled,
  callbackUrl = "/dashboard",
}: {
  googleEnabled: boolean;
  callbackUrl?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.ok) {
        router.push(callbackUrl);
        router.refresh();
      } else {
        setError("Invalid email or password");
      }
    } catch {
      setError("Invalid email or password");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-5">
      {googleEnabled && (
        <>
          <GoogleButton label="Continue with Google" />
          <Divider />
        </>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBox message={error} />}
        <Field label="Email" required>
          <Input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </Field>
        <Field label="Password" required>
          <Input
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Register                                                            */
/* ------------------------------------------------------------------ */

type RoleChoice = "CREATOR" | "BRAND";

const ROLE_OPTIONS: { value: RoleChoice; title: string; description: string }[] = [
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

export function RegisterForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const [role, setRole] = useState<RoleChoice>("CREATOR");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const result = await registerUser({ name, email, password, role });
    setPending(false);
    if (!result.ok) {
      setError(result.error ?? "Something went wrong. Please try again.");
      return;
    }
    router.push("/login?registered=1");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {googleEnabled && (
        <>
          <GoogleButton label="Sign up with Google" />
          <Divider />
        </>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBox message={error} />}

        <div>
          <span className="mb-1.5 block text-sm font-medium text-slate-200">
            I am joining as <span className="ml-1 text-neon-pink">*</span>
          </span>
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Account type">
            {ROLE_OPTIONS.map((option) => {
              const selected = role === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setRole(option.value)}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition",
                    selected
                      ? "border-neon-pink bg-neon-pink/10 shadow-[0_0_24px_rgba(255,46,147,0.25)]"
                      : "border-violet-400/25 bg-night-900/80 hover:border-violet-400/50",
                  )}
                >
                  <span className="font-display block text-xl tracking-wide text-white">
                    {option.title}
                  </span>
                  <span className="mt-1 block text-sm text-slate-400">{option.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        <Field label="Name" required>
          <Input
            type="text"
            autoComplete="name"
            placeholder="Your name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </Field>
        <Field label="Email" required>
          <Input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </Field>
        <Field label="Password" hint="At least 8 characters." required>
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="Choose a password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
          />
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Creating your account..." : "Create account"}
        </Button>
      </form>
    </div>
  );
}
