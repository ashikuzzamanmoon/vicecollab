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

function GoogleIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function EyeIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

function EyeOffIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );
}

export function GoogleButton({
  label,
  googleEnabled = true,
}: {
  label: string;
  googleEnabled?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [notConfigured, setNotConfigured] = useState(false);

  return (
    <div>
      <Button
        type="button"
        variant="secondary"
        className="flex w-full items-center justify-center gap-2.5 font-medium shadow-sm transition hover:bg-white/10"
        disabled={pending}
        onClick={() => {
          if (!googleEnabled) {
            setNotConfigured(true);
            return;
          }
          setPending(true);
          void signIn("google", { callbackUrl: "/onboarding" });
        }}
      >
        <GoogleIcon />
        <span>{pending ? "Redirecting to Google..." : label}</span>
      </Button>
      {notConfigured && (
        <p className="mt-2 text-center text-xs text-amber-300">
          Google OAuth is not configured yet. Add GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET in .env to enable.
        </p>
      )}
    </div>
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
  const [showPassword, setShowPassword] = useState(false);
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
      <GoogleButton label="Continue with Google" googleEnabled={googleEnabled} />
      <Divider />
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBox message={error} />}
        <Field label="Email" required>
          <Input
            type="email"
            autoComplete="email"
            placeholder=""
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </Field>
        <Field label="Password" required>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder=""
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
          </div>
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
  const [showPassword, setShowPassword] = useState(false);
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
      <GoogleButton label="Sign up with Google" googleEnabled={googleEnabled} />
      <Divider />
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
            placeholder=""
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </Field>
        <Field label="Password" hint="At least 8 characters." required>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder=""
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
          </div>
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Creating your account..." : "Create account"}
        </Button>
      </form>
    </div>
  );
}
