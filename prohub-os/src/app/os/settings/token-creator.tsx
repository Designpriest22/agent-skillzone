"use client";
import { useActionState } from "react";
import { createApiTokenAction } from "../actions";
import { SubmitButton } from "@/components/client";
import { inputClass } from "@/components/ui";

/** Creates a Claude-connector token and shows it exactly once (it is stored only as a hash). */
export function TokenCreator({ mcpUrl }: { mcpUrl: string }) {
  const [state, action] = useActionState(createApiTokenAction, null as null | { token?: string; error?: string });
  return (
    <div className="space-y-2">
      <form action={action} className="flex gap-2">
        <input name="name" placeholder="e.g. Claude Desktop" className={inputClass} maxLength={80} />
        <SubmitButton>Create token</SubmitButton>
      </form>
      {state?.error && <p className="text-[12.5px] text-[var(--color-bad,#c0392b)]">{state.error}</p>}
      {state?.token && (
        <div className="space-y-2 rounded-md border border-line bg-panel-2 p-3 text-[12.5px]">
          <p className="font-medium">Copy this token now — it won&apos;t be shown again.</p>
          <code className="block break-all rounded bg-panel px-2 py-1 font-mono">{state.token}</code>
          <p className="text-fg-2">Claude Code: <code className="break-all font-mono">claude mcp add --transport http prohub {mcpUrl} --header &quot;Authorization: Bearer {state.token}&quot;</code></p>
          <p className="text-fg-2">Claude.ai / Claude Desktop custom connector URL (keep it private — the token is in the link): <code className="break-all font-mono">{mcpUrl}/{state.token}</code></p>
        </div>
      )}
    </div>
  );
}
