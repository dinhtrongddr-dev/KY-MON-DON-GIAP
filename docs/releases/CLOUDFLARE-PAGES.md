# Cloudflare Pages Hosting

Production domain: https://kymon.pp.ua
Pages project: ky-mon-don-giap
Pages URL: https://ky-mon-don-giap.pages.dev
Production branch: main
Build command: npm run check
Build output: dist
Deployment commit: ea9df4f05d87790c9f4306ece3e7339be697ff93
Deployment time: 2026-09-15T03:25:59.094585Z

## Production State

- PASS - Cloudflare's Git-connected production deployment completed from GitHub
  `main` with the configured `npm run check` build and `dist` output.
- PASS - the Cloudflare zone became active at
  `2026-09-15T05:07:44.752691Z` on `aspen.ns.cloudflare.com` and
  `quincy.ns.cloudflare.com`.
- PASS - the Pages custom domain, validation, and verification states are all
  active for `kymon.pp.ua`.
- PASS - MX, mail, `www`, `ftp`, and both verification TXT records were
  preserved. The intended changes are limited to authoritative nameservers and
  the apex web route.
- PASS - HTTPS serves the production application. All 59 deployed files match
  the committed `dist/` bytes; Pages clean URLs map `index.html` to `/` and
  `audit.html` to `/audit`.
- PASS - the production browser loaded the complete application at a 390 x 844
  viewport with no horizontal overflow, console error, console warning, or
  failed observed request.
- PASS - one controlled AI request completed through the existing relay in 140
  seconds with HTTP 200, CORS for `https://kymon.pp.ua`, model `gpt-5.6-sol`,
  rules `TG-CB-5.0`, protocol 5, and matching chart and request fingerprints.

The application is served as static assets by Cloudflare Pages. AI readings
continue through the existing Cloudflare Worker, Cloudflare Tunnel, and local
Codex bridge; the local connector must still be running. No GitHub account
credential, Cloudflare credential, relay administrator secret, tunnel
credential, pairing code, or ChatGPT profile is stored in Git or in the Pages
configuration.

Some recursive or ISP resolvers may temporarily return the former ChatGPT Sites
apex addresses until their cached TTL expires. Current Cloudflare DNS answers
and direct production checks already serve the Pages deployment. The local
post-nameserver evidence is in `.release/cloudflare-dns-after-ns.json`.

## Rollback

For a Pages-only rollback, remove the Pages-managed apex CNAME and restore the
two former ChatGPT Sites apex A records as DNS-only records:

```text
162.159.143.30
172.66.3.26
```

Keep the MX record, `mail`, `www`, `ftp`, `_cf-custom-hostname`, and
`_openai-site-verification` records unchanged. The legacy deployment remains at
`https://kymon.tkgiongnoi2.chatgpt.site` as the rollback target.

For the slower authoritative-DNS rollback, restore the former NIC.UA
nameservers recorded in `.release/cloudflare-dns-before.json`:

```text
ns10.uadns.com
ns11.uadns.com
ns12.uadns.com
```

Do not delete the legacy Site or either verification TXT record during the
observation period.
