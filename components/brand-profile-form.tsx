"use client";

import { Button, Card, Field, Input, Textarea } from "@/components/ui";
import { upsertBrandProfile } from "@/lib/actions/profile";
import type { BrandProfile } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function BrandProfileForm({ profile }: { profile: BrandProfile | null }) {
  const router = useRouter();
  const [companyName, setCompanyName] = useState(profile?.companyName ?? "");
  const [website, setWebsite] = useState(profile?.website ?? "");
  const [description, setDescription] = useState(profile?.description ?? "");
  const [logoUrl, setLogoUrl] = useState(profile?.logoUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setPending(true);
    const result = await upsertBrandProfile({ companyName, website, description, logoUrl });
    setPending(false);
    if (!result.ok) {
      setError(result.error ?? "Something went wrong. Please try again.");
      return;
    }
    if (result.created) {
      router.push("/dashboard");
      router.refresh();
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="font-display text-2xl tracking-wide text-white">
            {profile ? "Edit your brand profile" : "Create your brand profile"}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Creators see this when you send them a booking request.
          </p>
        </div>

        {error && (
          <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-200">
            {error}
          </p>
        )}
        {saved && (
          <p className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-3.5 py-2.5 text-sm text-emerald-200">
            Profile saved.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company name" required>
            <Input
              type="text"
              placeholder="Your company or studio"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              required
            />
          </Field>
          <Field label="Website">
            <Input
              type="url"
              placeholder="https://..."
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
            />
          </Field>
        </div>
        <Field label="Description">
          <Textarea
            placeholder="What do you make, and what kind of creators are you looking for?"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
          />
        </Field>
        <Field label="Logo URL" hint="Link to your company logo.">
          <Input
            type="url"
            placeholder="https://..."
            value={logoUrl}
            onChange={(event) => setLogoUrl(event.target.value)}
          />
        </Field>

        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving..." : profile ? "Save profile" : "Create profile"}
        </Button>
      </form>
    </Card>
  );
}
