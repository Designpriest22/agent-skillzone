"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/client/api";

export function CheckoutButton({ priceId, label }: { priceId: string; label: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={async () => {
          setPending(true);
          setError(null);
          try {
            const { url } = await api<{ url: string }>("/api/billing/checkout", { body: { priceId } });
            window.location.assign(url);
          } catch (err) {
            setError(
              err instanceof ApiError
                ? err.status === 401
                  ? "Sign in first to upgrade."
                  : err.message
                : "Couldn't start checkout.",
            );
            setPending(false);
          }
        }}
        disabled={pending}
      >
        {pending ? "Opening secure checkout…" : label}
      </Button>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
