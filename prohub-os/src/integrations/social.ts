/** Official-API publishers. Platforms without approved API access fall back to the manual-publish queue. */
import { httpJson } from "./http";
import { getCredentials, IntegrationNotConfigured } from "./registry";

const GRAPH = "https://graph.facebook.com/v21.0";

export type PublishResult = { mode: "api"; externalId: string } | { mode: "manual"; reason: string };

export async function publishToPlatform(item: { platform: string; caption: string; hashtags: string[]; mediaUrl?: string | null }): Promise<PublishResult> {
  const text = [item.caption, item.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")].filter(Boolean).join("\n\n");
  switch (item.platform) {
    case "facebook": {
      const c = await getCredentials("meta");
      if (!c) return { mode: "manual", reason: new IntegrationNotConfigured("meta").message };
      const endpoint = item.mediaUrl ? `${GRAPH}/${c.pageId}/photos` : `${GRAPH}/${c.pageId}/feed`;
      const params = new URLSearchParams({ access_token: c.pageAccessToken, ...(item.mediaUrl ? { url: item.mediaUrl, caption: text } : { message: text }) });
      const res = await httpJson<{ id?: string; post_id?: string }>(endpoint, { method: "POST", body: params });
      return { mode: "api", externalId: res.post_id ?? res.id ?? "" };
    }
    case "instagram": {
      const c = await getCredentials("meta");
      if (!c?.igUserId) return { mode: "manual", reason: "Instagram Business user ID not configured in Meta integration." };
      if (!item.mediaUrl) return { mode: "manual", reason: "Instagram API publishing requires a public image/video URL." };
      const create = await httpJson<{ id: string }>(`${GRAPH}/${c.igUserId}/media`, {
        method: "POST", body: new URLSearchParams({ image_url: item.mediaUrl, caption: text, access_token: c.pageAccessToken }),
      });
      const pub = await httpJson<{ id: string }>(`${GRAPH}/${c.igUserId}/media_publish`, {
        method: "POST", body: new URLSearchParams({ creation_id: create.id, access_token: c.pageAccessToken }),
      });
      return { mode: "api", externalId: pub.id };
    }
    case "linkedin": {
      const c = await getCredentials("linkedin");
      if (!c) return { mode: "manual", reason: new IntegrationNotConfigured("linkedin").message };
      const res = await fetch("https://api.linkedin.com/rest/posts", {
        method: "POST",
        headers: { Authorization: `Bearer ${c.accessToken}`, "Content-Type": "application/json", "LinkedIn-Version": "202409", "X-Restli-Protocol-Version": "2.0.0" },
        body: JSON.stringify({ author: c.organizationUrn, commentary: text, visibility: "PUBLIC", distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] }, lifecycleState: "PUBLISHED", isReshareDisabledByAuthor: false }),
      });
      if (!res.ok) throw new Error(`LinkedIn responded ${res.status}: ${(await res.text()).slice(0, 300)}`);
      return { mode: "api", externalId: res.headers.get("x-restli-id") ?? "" };
    }
    default:
      return { mode: "manual", reason: `Direct publishing to ${item.platform} is not available via an approved API in this version.` };
  }
}
