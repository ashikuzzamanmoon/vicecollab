"use client";

import { createReview } from "@/lib/actions/reviews";
import { useState, useTransition } from "react";
import { Button, Field, Select, Textarea } from "@/components/ui";

const RATING_OPTIONS = [
  { value: 5, label: "5 — Excellent" },
  { value: 4, label: "4 — Great" },
  { value: 3, label: "3 — Good" },
  { value: 2, label: "2 — Below expectations" },
  { value: 1, label: "1 — Poor" },
];

/** Brand-only review form, shown once a deal is paid. One review per deal. */
export function ReviewForm({ bookingId }: { bookingId: string }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await createReview({ bookingId, rating, comment });
          if (!result.ok) setError(result.error ?? "Could not save your review.");
        });
      }}
    >
      <Field label="Rating" required>
        <Select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
          {RATING_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Comment" hint="Optional — what did the creator do well?">
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share a few words about working with this creator."
          rows={4}
          maxLength={2000}
        />
      </Field>
      {error && <p className="text-sm text-red-300">{error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Submitting..." : "Submit review"}
      </Button>
    </form>
  );
}
