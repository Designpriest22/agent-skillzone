import "server-only";
import { requirePageUser } from "./guards";
import type { Role } from "./session";

export function requireAdminPage(role: Role) {
  return requirePageUser({ role, next: "/admin", allowUnonboarded: true });
}
