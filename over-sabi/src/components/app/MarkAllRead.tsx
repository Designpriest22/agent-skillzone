"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/client/api";

export function MarkAllRead() {
  const router = useRouter();
  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={async () => {
        await api("/api/notifications", { method: "PATCH", body: { all: true } });
        router.refresh();
      }}
    >
      Mark all as read
    </Button>
  );
}
