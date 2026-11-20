"use client";

import { Badge } from "@/components/ui";
import { timeLeft } from "@/lib/utils";
import { useEffect, useState } from "react";

/**
 * Live-ticking countdown to the creator's response deadline. Ticks every
 * 30 seconds, turns red under 6 hours, and shows "Expired" once passed.
 * The first render uses the same timeLeft() label the server would render.
 */
export function CountdownChip({
  respondBy,
  className,
}: {
  respondBy: Date | string;
  className?: string;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const { expired, label } = timeLeft(respondBy);
  const msLeft = new Date(respondBy).getTime() - now;
  const urgent = !expired && msLeft < 6 * 60 * 60 * 1000;

  return (
    <Badge
      variant={expired || urgent ? "danger" : "warning"}
      className={className}
    >
      {expired ? "Expired" : `Response due in ${label.replace(" left", "")}`}
    </Badge>
  );
}
