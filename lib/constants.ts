import type { PackageType, Platform } from "@prisma/client";

/** Platforms a creator can list. Keep in sync with the Prisma Platform enum. */
export const PLATFORMS: { value: Platform; label: string }[] = [
  { value: "YOUTUBE", label: "YouTube" },
  { value: "TIKTOK", label: "TikTok" },
  { value: "TWITCH", label: "Twitch" },
  { value: "KICK", label: "Kick" },
  { value: "INSTAGRAM", label: "Instagram" },
];

export function platformLabel(value: Platform): string {
  return PLATFORMS.find((p) => p.value === value)?.label ?? value;
}

/** Package types a creator can offer. Keep in sync with PackageType enum. */
export const PACKAGE_TYPES: { value: PackageType; label: string; hint: string }[] = [
  { value: "SHORT", label: "Sponsored Short", hint: "A short-form video (Shorts / TikTok / Reel)" },
  { value: "STREAM_MENTION", label: "Stream Mention", hint: "A live shout-out or segment on stream" },
  { value: "DEDICATED_VIDEO", label: "Dedicated Video", hint: "A full video built around the brand" },
  { value: "CUSTOM", label: "Custom", hint: "Anything else — describe it in the title" },
];

export function packageTypeLabel(value: PackageType): string {
  return PACKAGE_TYPES.find((p) => p.value === value)?.label ?? value;
}

/** GTA content niches shown as tags on creator profiles and directory filters. */
export const NICHES = [
  "Gameplay",
  "Roleplay (RP)",
  "Clips & Shorts",
  "Reviews",
  "Tutorials",
  "Speedruns",
  "Funny Moments",
  "News & Updates",
  "Live Streams",
  "Machinima",
] as const;

/** Common audience countries for filters and profile stats. */
export const AUDIENCE_COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Brazil",
  "Germany",
  "France",
  "India",
  "Bangladesh",
  "Australia",
  "Mexico",
  "Indonesia",
  "Philippines",
  "Japan",
  "Spain",
  "Italy",
] as const;

/** Creator response window for a booking request (hours). */
export const RESPONSE_WINDOW_HOURS = 72;
