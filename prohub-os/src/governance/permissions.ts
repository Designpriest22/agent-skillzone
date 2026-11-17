/**
 * Three-level autonomy model.
 *  L1 AUTONOMOUS        – agent executes immediately (research, drafting, internal records).
 *  L2 APPROVAL REQUIRED – agent files an approval request; executes only after owner/manager approves.
 *  L3 OWNER ONLY        – only a user with role "owner" can approve.
 */
export type PermissionLevel = 1 | 2 | 3;

export const ACTION_POLICY: Record<string, { level: PermissionLevel; label: string }> = {
  "email.send": { level: 2, label: "Send email to an external recipient" },
  "email.bulk": { level: 2, label: "Send bulk email campaign" },
  "whatsapp.send": { level: 2, label: "Send WhatsApp message" },
  "proposal.send": { level: 2, label: "Send commercial proposal" },
  "invoice.send": { level: 2, label: "Send invoice / payment link to client" },
  "social.publish": { level: 2, label: "Publish social media content" },
  "site_page.publish": { level: 2, label: "Publish or change a public web page" },
  "campaign.launch": { level: 2, label: "Launch a marketing / advertising campaign" },
  "github.commit": { level: 2, label: "Commit website code to repository" },
  "vercel.deploy": { level: 2, label: "Redeploy a published website" },
  "spend.authorize": { level: 3, label: "Spend money / increase ad budget" },
  "contract.sign": { level: 3, label: "Sign a contract" },
  "refund.issue": { level: 3, label: "Issue a refund" },
  "finance.record_change": { level: 3, label: "Change financial records" },
  "access.grant": { level: 3, label: "Grant external system access" },
  "data.delete_critical": { level: 3, label: "Delete critical business data" },
};

export function canApprove(role: string, level: number) {
  if (level >= 3) return role === "owner";
  if (level === 2) return role === "owner" || role === "manager";
  return true;
}
