# Ky Mon Relay

Cloudflare Worker source preserved alongside the app. `npm test` in the repository
root runs its isolated tests; no deployment or credentials are required.

The relay only forwards `/api/status` and `/api/read` for the exact configured
website Origins in `dist/site-config.mjs`: kymon.pp.ua and the old Sites origin
during migration. It preserves the response stream, JSON whitespace keepalive, status,
Retry-After and cancellation signal. The local bridge remains responsible for
pairing, protocol/fingerprints, chart recomputation and writer validation.

The upstream is the fixed Cloudflare Named Tunnel application
`https://ai-origin.kymon.pp.ua`. The old Quick Tunnel KV mapping and
`/admin/origin` mutation endpoint are no longer used. `RELAY_ADMIN_SECRET` remains
outside Git and is only used as a salt for the relay's per-client privacy hash.
The user's pairing code and Cloudflare Tunnel token are also secrets and must never
be committed to this repository.

`wrangler.jsonc` preserves the existing Worker name and compatibility date without
the obsolete KV binding. CI intentionally performs tests only. Deploying this Worker
is a separate production action and must not happen merely because code changed on
`develop`.
