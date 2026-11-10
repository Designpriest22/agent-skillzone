import { handler, json, parseJson, requireApiUser } from "@/lib/http";
import { getCurrentUser } from "@/lib/auth/session";
import { getMe, profilePatchSchema, updateProfile } from "@/lib/services/player";

export const GET = handler(async () => {
  const user = await getCurrentUser();
  if (!user) return json({ user: null });
  return json({ user: { username: user.username }, ...(await getMe(user.id)) });
});

export const PATCH = handler(async (req) => {
  const user = await requireApiUser();
  await updateProfile(user.id, await parseJson(req, profilePatchSchema));
  return json({ ok: true });
});
