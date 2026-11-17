import { handler, requireApiUser } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { exportUserData } from "@/lib/services/account";

export const GET = handler(async () => {
  const user = await requireApiUser();
  await rateLimit(`export:${user.id}`, 5, 3600);
  const data = await exportUserData(user.id);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="over-sabi-data-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
});
