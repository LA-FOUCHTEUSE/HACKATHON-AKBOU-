"use client";

import { useTransition } from "react";
import { Check } from "lucide-react";
import { markAllRead, markRead } from "@/actions/notifications";
import { Button } from "@/components/ui/button";

export function MarkReadButton({ id, label }: { id: string; label: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      disabled={pending}
      onClick={() => startTransition(async () => void (await markRead(id)))}
    >
      <Check className="size-4" />
    </Button>
  );
}

export function MarkAllReadButton({ label }: { label: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(async () => void (await markAllRead()))}
    >
      {label}
    </Button>
  );
}
