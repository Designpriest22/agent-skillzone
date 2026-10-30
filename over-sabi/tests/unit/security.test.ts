import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { hashToken, newToken } from "@/lib/auth/tokens";
import { verifyPaystackSignature } from "@/lib/payments/paystack";
import { buildTutorSystemPrompt } from "@/lib/ai/prompts";
import { DEFAULT_TUTOR_SETTINGS } from "@/lib/ai/schemas";

describe("passwords and tokens", () => {
  it("hashes with scrypt and verifies", async () => {
    const h = await hashPassword("correct horse battery");
    expect(h.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("correct horse battery", h)).toBe(true);
    expect(await verifyPassword("wrong", h)).toBe(false);
  });
  it("stores only token hashes", () => {
    const { token, hash } = newToken();
    expect(hash).toBe(hashToken(token));
    expect(hash).not.toContain(token);
  });
});

describe("Paystack webhook signature", () => {
  const secret = "sk_test_x";
  const body = JSON.stringify({ event: "charge.success", data: { id: 1 } });
  const sig = createHmac("sha512", secret).update(body).digest("hex");
  it("accepts a correct HMAC-SHA512 over the raw body", () =>
    expect(verifyPaystackSignature(body, sig, secret)).toBe(true));
  it("rejects a tampered body, a wrong key or a missing header", () => {
    expect(verifyPaystackSignature(body.replace("1", "2"), sig, secret)).toBe(false);
    expect(verifyPaystackSignature(body, sig, "sk_other")).toBe(false);
    expect(verifyPaystackSignature(body, null, secret)).toBe(false);
  });
});

describe("tutor system prompt", () => {
  const prompt = buildTutorSystemPrompt({
    language: {
      code: "yo",
      name: "Yoruba",
      native_name: "Yorùbá",
      orthography_notes: "Three tones.",
      register_notes: "Ẹ for elders.",
      dialect_notes: "",
    },
    tutor: {
      id: "kemi",
      name: "Kẹ́mi",
      persona: "patient",
      tagline: "t",
      teaching_approach: "a",
      correction_style: "c",
      specialties: ["Greetings"],
    },
    learner: { displayName: "Ada", level: "beginner", goals: ["family"], explanationLanguage: "pcm" },
    settings: { ...DEFAULT_TUTOR_SETTINGS, translationAssist: false },
    knownVocab: [{ text: "Ẹ ṣé", translation: "Thank you", reviewStatus: "editorial_draft" }],
  });
  it("discloses AI, forbids invented culture and pronunciation claims", () => {
    expect(prompt).toContain("You are an AI character");
    expect(prompt).toContain("Never invent proverbs");
    expect(prompt).toContain("Never claim to judge pronunciation");
  });
  it("applies learner settings and grounds in curated vocabulary", () => {
    expect(prompt).toContain("Nigerian Pidgin");
    expect(prompt).toContain("set `translation` to null");
    expect(prompt).toContain("Ẹ ṣé — Thank you (draft, awaiting review)");
  });
});
