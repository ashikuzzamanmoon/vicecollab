"use client";

import { Badge, Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { upsertCreatorProfile } from "@/lib/actions/profile";
import { AUDIENCE_COUNTRIES, NICHES, PLATFORMS } from "@/lib/constants";
import type { CreatorProfile, Platform, VerificationStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

function verificationBadge(status: VerificationStatus) {
  switch (status) {
    case "VERIFIED":
      return <Badge variant="success">Verified</Badge>;
    case "REJECTED":
      return <Badge variant="danger">Rejected</Badge>;
    default:
      return <Badge variant="warning">Pending review</Badge>;
  }
}

/** Pill checkbox used for platforms, countries, and niches. */
function ChipCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span className="inline-flex rounded-full border border-violet-400/30 bg-night-900/80 px-3 py-1.5 text-sm text-slate-300 transition peer-checked:border-neon-pink peer-checked:bg-neon-pink/15 peer-checked:text-pink-100 hover:border-violet-400/60">
        {label}
      </span>
    </label>
  );
}

function GroupLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <span className="mb-1.5 block text-sm font-medium text-slate-200">
      {children}
      {required && <span className="ml-1 text-neon-pink">*</span>}
    </span>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <h3 className="font-display text-xl tracking-wide text-white uppercase">{children}</h3>
  );
}

function toggleInList<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function CreatorProfileForm({
  profile,
  hasActivePackage,
}: {
  profile: CreatorProfile | null;
  hasActivePackage: boolean;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [tagline, setTagline] = useState(profile?.tagline ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl ?? "");
  const [bannerUrl, setBannerUrl] = useState(profile?.bannerUrl ?? "");
  const [platforms, setPlatforms] = useState<Platform[]>(profile?.platforms ?? []);
  const [primaryPlatform, setPrimaryPlatform] = useState<Platform>(
    profile?.primaryPlatform ?? "YOUTUBE",
  );
  const [followers, setFollowers] = useState(String(profile?.followers ?? ""));
  const [avgViews, setAvgViews] = useState(String(profile?.avgViews ?? ""));
  const [engagementRate, setEngagementRate] = useState(String(profile?.engagementRate ?? ""));
  const [audienceCountries, setAudienceCountries] = useState<string[]>(
    profile?.audienceCountries ?? [],
  );
  const [niches, setNiches] = useState<string[]>(profile?.niches ?? []);
  const [portfolioLinksText, setPortfolioLinksText] = useState(
    (profile?.portfolioLinks ?? []).join("\n"),
  );
  const [isPublished, setIsPublished] = useState(profile?.isPublished ?? false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  // Publish gate: display name + at least one platform + at least one active package.
  const missing: string[] = [];
  if (!displayName.trim()) missing.push("a display name");
  if (platforms.length === 0) missing.push("at least one platform");
  if (!hasActivePackage) missing.push("at least one active package");
  const canPublish = missing.length === 0;
  // A published profile can always be unpublished, even if the gate no longer holds.
  const publishDisabled = !canPublish && !isPublished;

  function togglePlatform(platform: Platform) {
    setPlatforms((current) => {
      const next = toggleInList(current, platform);
      if (platform === primaryPlatform && !next.includes(platform) && next.length > 0) {
        setPrimaryPlatform(next[0]);
      }
      return next;
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setPending(true);
    const result = await upsertCreatorProfile({
      displayName,
      tagline,
      bio,
      avatarUrl,
      bannerUrl,
      platforms,
      primaryPlatform,
      followers: Number(followers) || 0,
      avgViews: Number(avgViews) || 0,
      engagementRate: Number(engagementRate) || 0,
      audienceCountries,
      niches,
      portfolioLinks: portfolioLinksText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      isPublished,
    });
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
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl tracking-wide text-white">
              {profile ? "Edit your profile" : "Create your profile"}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              This is what brands see in the creator directory.
            </p>
          </div>
          {profile && (
            <div className="flex items-center gap-2">
              {verificationBadge(profile.verificationStatus)}
              {profile.isPublished ? (
                <Badge variant="success">Published</Badge>
              ) : (
                <Badge variant="muted">Draft</Badge>
              )}
            </div>
          )}
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

        {/* Basics */}
        <section className="space-y-4">
          <SectionTitle>Basics</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Display name" required>
              <Input
                type="text"
                placeholder="Your creator name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                required
              />
            </Field>
            <Field label="Tagline" hint="One line that sells your channel.">
              <Input
                type="text"
                placeholder="GTA VI clips, roleplay, and chaos"
                value={tagline}
                onChange={(event) => setTagline(event.target.value)}
                maxLength={200}
              />
            </Field>
          </div>
          <Field label="Bio">
            <Textarea
              placeholder="Tell brands what you make, who watches, and why your audience trusts you."
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              rows={4}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Avatar URL" hint="Link to your profile picture.">
              <Input
                type="url"
                placeholder="https://..."
                value={avatarUrl}
                onChange={(event) => setAvatarUrl(event.target.value)}
              />
            </Field>
            <Field label="Banner URL" hint="Wide header image for your listing.">
              <Input
                type="url"
                placeholder="https://..."
                value={bannerUrl}
                onChange={(event) => setBannerUrl(event.target.value)}
              />
            </Field>
          </div>
        </section>

        {/* Platforms & reach */}
        <section className="space-y-4">
          <SectionTitle>Platforms and reach</SectionTitle>
          <div>
            <GroupLabel required>Platforms</GroupLabel>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((platform) => (
                <ChipCheckbox
                  key={platform.value}
                  label={platform.label}
                  checked={platforms.includes(platform.value)}
                  onChange={() => togglePlatform(platform.value)}
                />
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Primary platform" required>
              <Select
                value={primaryPlatform}
                onChange={(event) => setPrimaryPlatform(event.target.value as Platform)}
              >
                {PLATFORMS.map((platform) => (
                  <option key={platform.value} value={platform.value}>
                    {platform.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Engagement rate (%)" hint="0 to 100.">
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                max={100}
                step={0.1}
                placeholder="4.2"
                value={engagementRate}
                onChange={(event) => setEngagementRate(event.target.value)}
              />
            </Field>
            <Field label="Followers" hint="Total across your platforms.">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                placeholder="12500"
                value={followers}
                onChange={(event) => setFollowers(event.target.value)}
              />
            </Field>
            <Field label="Average views" hint="Per video or stream.">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                placeholder="8000"
                value={avgViews}
                onChange={(event) => setAvgViews(event.target.value)}
              />
            </Field>
          </div>
        </section>

        {/* Audience & niches */}
        <section className="space-y-4">
          <SectionTitle>Audience and niches</SectionTitle>
          <div>
            <GroupLabel>Audience countries</GroupLabel>
            <div className="flex flex-wrap gap-2">
              {AUDIENCE_COUNTRIES.map((country) => (
                <ChipCheckbox
                  key={country}
                  label={country}
                  checked={audienceCountries.includes(country)}
                  onChange={() => setAudienceCountries((current) => toggleInList(current, country))}
                />
              ))}
            </div>
          </div>
          <div>
            <GroupLabel>Content niches</GroupLabel>
            <div className="flex flex-wrap gap-2">
              {NICHES.map((niche) => (
                <ChipCheckbox
                  key={niche}
                  label={niche}
                  checked={niches.includes(niche)}
                  onChange={() => setNiches((current) => toggleInList(current, niche))}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Portfolio */}
        <section className="space-y-4">
          <SectionTitle>Portfolio</SectionTitle>
          <Field label="Portfolio links" hint="One URL per line — your best videos or streams.">
            <Textarea
              placeholder={"https://youtube.com/watch?v=...\nhttps://tiktok.com/@you/video/..."}
              value={portfolioLinksText}
              onChange={(event) => setPortfolioLinksText(event.target.value)}
              rows={4}
            />
          </Field>
        </section>

        {/* Publishing */}
        <section className="space-y-3 rounded-2xl border border-violet-400/20 bg-night-900/60 p-4">
          <SectionTitle>Publishing</SectionTitle>
          <label className="flex cursor-pointer items-center gap-3">
            <span className="relative inline-flex shrink-0">
              <input
                type="checkbox"
                checked={isPublished}
                disabled={publishDisabled}
                onChange={(event) => setIsPublished(event.target.checked)}
                className="peer sr-only"
              />
              <span className="h-6 w-11 rounded-full bg-white/10 transition peer-checked:bg-neon-pink peer-disabled:opacity-50" />
              <span className="pointer-events-none absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5" />
            </span>
            <span className="text-sm font-medium text-slate-200">
              Published — visible in the creator directory
            </span>
          </label>
          {!canPublish && (
            <p className="text-sm text-amber-200">
              To publish you still need {missing.join(", ")}.
            </p>
          )}
          {profile && profile.verificationStatus === "PENDING" && (
            <p className="text-sm text-slate-400">
              Your profile is pending verification. You can publish while waiting — verified
              creators get a badge in the directory.
            </p>
          )}
        </section>

        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving..." : profile ? "Save profile" : "Create profile"}
        </Button>
      </form>
    </Card>
  );
}
