import { cn } from "@/lib/utils";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-neon-pink via-neon-magenta to-neon-purple text-white shadow-[0_0_24px_rgba(255,46,147,0.45)] hover:shadow-[0_0_32px_rgba(255,46,147,0.65)] hover:brightness-110",
  secondary:
    "border border-neon-purple/60 bg-neon-purple/10 text-violet-100 hover:bg-neon-purple/20 hover:border-neon-purple",
  ghost: "text-slate-300 hover:bg-white/5 hover:text-white",
  danger: "bg-red-500/15 border border-red-500/50 text-red-200 hover:bg-red-500/25",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

/** Shared button classes — reuse on <Link> elements that should look like buttons. */
export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all disabled:pointer-events-none disabled:opacity-50",
    buttonVariants[variant],
    buttonSizes[size],
    className,
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  return <button className={buttonClasses(variant, size, className)} {...props} />;
}

/* ------------------------------------------------------------------ */
/* Cards                                                               */
/* ------------------------------------------------------------------ */

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-violet-400/15 bg-night-800/80 p-5 shadow-[0_0_0_1px_rgba(168,85,247,0.05)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Card with a neon hover lift — for clickable directory cards. */
export function HoverCard({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-violet-400/15 bg-night-800/80 p-5 transition-all hover:border-neon-pink/50 hover:shadow-[0_0_28px_rgba(255,46,147,0.18)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Form controls                                                       */
/* ------------------------------------------------------------------ */

const inputClasses =
  "w-full rounded-xl border border-violet-400/25 bg-night-900/80 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-neon-pink/70 focus:ring-2 focus:ring-neon-pink/25 disabled:opacity-50";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClasses, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputClasses, "min-h-24 resize-y", className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(inputClasses, "appearance-none", className)} {...props}>
      {children}
    </select>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
  required,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-200">
        {label}
        {required && <span className="ml-1 text-neon-pink">*</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-300">{error}</span>}
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Badges                                                              */
/* ------------------------------------------------------------------ */

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "neon" | "muted";

const badgeVariants: Record<BadgeVariant, string> = {
  default: "border-violet-400/30 bg-violet-500/15 text-violet-200",
  success: "border-emerald-400/30 bg-emerald-500/15 text-emerald-200",
  warning: "border-amber-400/30 bg-amber-500/15 text-amber-200",
  danger: "border-red-400/30 bg-red-500/15 text-red-200",
  info: "border-cyan-400/30 bg-cyan-500/15 text-cyan-200",
  neon: "border-neon-pink/40 bg-neon-pink/15 text-pink-200",
  muted: "border-white/10 bg-white/5 text-slate-400",
};

export function Badge({
  variant = "default",
  className,
  children,
}: {
  variant?: BadgeVariant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        badgeVariants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Page header, stat card, empty state                                 */
/* ------------------------------------------------------------------ */

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-bold tracking-[0.25em] text-neon-cyan uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-4xl tracking-wide text-white sm:text-5xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-slate-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card>
      <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">{label}</p>
      <p className="font-display mt-1 text-3xl tracking-wide text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </Card>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-violet-400/25 bg-night-800/40 px-6 py-12 text-center">
      <p className="font-display text-2xl tracking-wide text-slate-200">{title}</p>
      {description && <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
