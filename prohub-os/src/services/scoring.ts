/**
 * Transparent lead-scoring model (0–100). Agents supply *signals*; code computes the score,
 * so priorities are consistent and explainable rather than model-invented numbers.
 */
export type LeadSignals = {
  /** Industry is one of Prohub's priority segments. */
  industryFit?: boolean;
  /** Count of concrete, observed weaknesses in branding/digital presence (with evidence). */
  observedWeaknesses?: number;
  /** Evidence of marketing budget: running ads, recent funding, large footprint, multiple locations. */
  budgetSignal?: "none" | "weak" | "strong";
  /** Timing trigger: launching a product, opening a branch, upcoming event, rebrand, tender. */
  timingTrigger?: boolean;
  /** A verified public contact route exists (business email, phone, WhatsApp). */
  verifiedContact?: boolean;
  /** Decision-maker identified by name/role from a public source. */
  decisionMakerKnown?: boolean;
  /** Inbound enquiry (they came to us) — strongest intent signal. */
  inbound?: boolean;
};

export const PRIORITY_SEGMENTS = [
  "sme", "corporate", "hospitality", "restaurant", "hotel", "events", "entertainment", "real estate", "financial services",
  "fintech", "bank", "ngo", "government", "technology", "international", "retail", "fmcg", "education", "healthcare",
];

export function scoreLead(s: LeadSignals): { score: number; priority: "hot" | "warm" | "cold"; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {
    fit: s.industryFit ? 20 : 5,
    need: Math.min(25, (s.observedWeaknesses ?? 0) * 8),
    budget: s.budgetSignal === "strong" ? 20 : s.budgetSignal === "weak" ? 8 : 0,
    timing: s.timingTrigger ? 15 : 0,
    reachability: (s.verifiedContact ? 7 : 0) + (s.decisionMakerKnown ? 3 : 0),
    intent: s.inbound ? 10 : 0,
  };
  const score = Math.min(100, Object.values(breakdown).reduce((a, b) => a + b, 0));
  const priority = score >= 65 ? "hot" : score >= 40 ? "warm" : "cold";
  return { score, priority, breakdown };
}

/** Probability weights used for the *weighted* pipeline — an estimate, never booked revenue. */
export const STAGE_PROBABILITY: Record<string, number> = {
  new_lead: 0.05,
  contacted: 0.1,
  follow_up_required: 0.12,
  responded: 0.2,
  qualified: 0.3,
  meeting_scheduled: 0.4,
  proposal_sent: 0.55,
  negotiation: 0.7,
  won: 1,
  lost: 0,
};

export const STAGE_LABEL: Record<string, string> = {
  new_lead: "New Lead",
  contacted: "Contacted",
  responded: "Responded",
  qualified: "Qualified",
  meeting_scheduled: "Meeting Scheduled",
  proposal_sent: "Proposal Sent",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
  follow_up_required: "Follow-up Required",
};
