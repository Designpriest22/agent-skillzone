import { ACHIEVEMENTS } from "../../content/catalog";

export const ACHIEVEMENT_NAMES: Record<string, string> = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.code, a.name]),
);
