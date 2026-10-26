# Deployment

The app is a standard Next.js 16 server: about 195 statically generated routes (pages, illustration plates, social images), two server routes (`/api/forms`, `/api/health`) and two request-time pages (`/partners`, which reads `?interest=`, and `/search`). It deploys anywhere Next.js runs.

## Option A: Vercel (simplest)

1. Import the repository and set the **root directory** to `destination-nigeria`.
2. Framework preset: Next.js. Build command `npm run build`; output is automatic.
3. Add the environment variables from `.env.example` (Production and Preview), and at minimum:
   - `NEXT_PUBLIC_SITE_URL=https://your-domain`
   - one form-delivery option (`FORMS_WEBHOOK_URL`, or `RESEND_API_KEY` + `FORMS_NOTIFY_TO` + `FORMS_FROM`)
   - `SITE_INDEXING=off` for **Preview** only
4. Attach the domain and enforce HTTPS.
5. Turn on the platform firewall / rate limiting for `POST /api/forms`. The built-in limiter is per instance only (see Security).

## Option B: Node server or container

```bash
cd destination-nigeria
npm ci
npm run build
NODE_ENV=production PORT=3000 npm start
```

Put it behind a reverse proxy (nginx, Caddy or a load balancer) that terminates TLS and forwards `X-Forwarded-For`. Health check: `GET /api/health` returns `{ ok: true, formsDelivery: "configured" | "not_configured" }`.

Minimal Dockerfile:

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY destination-nigeria/package*.json ./
RUN npm ci
COPY destination-nigeria/ .
ARG NEXT_PUBLIC_SITE_URL
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
EXPOSE 3000
CMD ["npm", "start"]
```

`NEXT_PUBLIC_*` values are baked in at build time, so rebuild when they change.

## Pre-launch checklist

- [ ] `NEXT_PUBLIC_SITE_URL` set to the production origin, then rebuild
- [ ] Form delivery configured and tested end to end (submit each form; confirm receipt in the CRM or inbox)
- [ ] `/api/health` shows `formsDelivery: "configured"`
- [ ] Policy placeholders completed: search for `To be confirmed by the platform owner` in `src/app/privacy`, `terms` and `accessibility`
- [ ] `officialContact` and `socialLinks` set in `src/content/platform.ts` if available
- [ ] Search Console verified, sitemap submitted (see below)
- [ ] Analytics configured, or deliberately left off
- [ ] `npm run check` and `npm run test:e2e` pass on the release build
- [ ] Preview deployments return `Disallow: /` in robots.txt

## Search Console and analytics

- **Google Search Console:** add a Domain property and verify with a DNS TXT record (preferred), or set `GOOGLE_SITE_VERIFICATION` to the HTML-tag token and redeploy. Submit `https://your-domain/sitemap.xml`.
- **Bing Webmaster Tools:** import from Search Console.
- **Analytics:** see `ANALYTICS.md`.

## Security

- **Headers** (`next.config.ts`): Content-Security-Policy (no `unsafe-eval` in production, `frame-ancestors 'none'`, `object-src 'none'`, `form-action 'self'`), HSTS (production), `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`.
- **CSP and inline scripts:** Next.js needs `'unsafe-inline'` for its bootstrap scripts. For a stricter policy, add nonce-based CSP via a `proxy.ts` (Next 16's replacement for middleware) and make those pages dynamic.
- **Forms:** server-side zod validation (the same schemas as the client), 20 KB body limit, same-origin check, honeypot field, minimum fill time, per-IP rate limit (5 per 10 minutes per instance), and no personal data in logs. Bots that trip the honeypot get a generic `202` and nothing is delivered.
- **Rate-limit keying:** the built-in limiter keys on the first `X-Forwarded-For` address. Deploy behind a proxy that overwrites that header (Vercel, nginx with `real_ip`, a cloud load balancer); a client talking directly to Node could spoof it. Treat the platform WAF or rate limiting as the primary control and the in-app limiter as a backstop.
- **Secrets:** server-only variables are never exposed to the browser (only `NEXT_PUBLIC_*` are). `.env*` files are git-ignored.
- **Webhook authenticity:** set `FORMS_WEBHOOK_SECRET` and verify the `X-Destination-Nigeria-Signature` HMAC on the receiving end.

## Redirects and status codes

Friendly URLs (`/visit`, `/explore`, `/ntw`, `/journal/*` …) are permanent redirects in `next.config.ts`. Unknown destinations, states, stories and experiences return real 404s (`dynamicParams = false`). States without published destinations deliberately have no page.
