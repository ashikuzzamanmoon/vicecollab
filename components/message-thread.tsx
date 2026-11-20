"use client";

import { sendMessage } from "@/lib/actions/messages";
import { cn } from "@/lib/utils";
import { useState, useTransition } from "react";
import { Button, Card, Textarea } from "@/components/ui";

export type ThreadMessage = {
  id: string;
  body: string;
  createdAt: Date | string;
  senderId: string;
  senderName: string;
};

function formatMessageTime(d: Date | string): string {
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Per-deal message thread: history (oldest first) + send form. */
export function MessageThread({
  bookingId,
  currentUserId,
  messages,
}: {
  bookingId: string;
  currentUserId: string;
  messages: ThreadMessage[];
}) {
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <Card className="p-0">
      <div className="border-b border-violet-400/15 px-5 py-4">
        <h2 className="font-display text-2xl tracking-wide text-white">Messages</h2>
        <p className="text-xs text-slate-400">
          Only you and the other party to this deal can see these messages.
        </p>
      </div>

      <div className="max-h-[420px] space-y-4 overflow-y-auto px-5 py-4">
        {messages.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">
            No messages yet. Start the conversation below.
          </p>
        ) : (
          messages.map((message) => {
            const isOwn = message.senderId === currentUserId;
            return (
              <div key={message.id} className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl border px-4 py-3 sm:max-w-[70%]",
                    isOwn
                      ? "border-neon-pink/40 bg-neon-pink/15"
                      : "border-white/10 bg-night-700/70",
                  )}
                >
                  <p className="text-xs font-semibold text-slate-300">
                    {isOwn ? "You" : message.senderName}
                    <span className="ml-2 font-normal text-slate-500">
                      {formatMessageTime(message.createdAt)}
                    </span>
                  </p>
                  <p className="mt-1 text-sm whitespace-pre-wrap text-slate-100">{message.body}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form
        className="border-t border-violet-400/15 px-5 py-4"
        onSubmit={(e) => {
          e.preventDefault();
          const trimmed = body.trim();
          if (!trimmed) return;
          setError(null);
          startTransition(async () => {
            const result = await sendMessage({ bookingId, body: trimmed });
            if (!result.ok) {
              setError(result.error ?? "Could not send your message.");
            } else {
              setBody("");
            }
          });
        }}
      >
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a message..."
          rows={3}
          maxLength={2000}
        />
        <div className="mt-3 flex items-center gap-3">
          <Button type="submit" disabled={isPending || !body.trim()}>
            {isPending ? "Sending..." : "Send message"}
          </Button>
          {error && <span className="text-sm text-red-300">{error}</span>}
        </div>
      </form>
    </Card>
  );
}
