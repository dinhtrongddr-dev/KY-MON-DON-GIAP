# Ky Mon Relay

Cloudflare Worker source preserved alongside the app. `npm test` in the repository
root runs its isolated tests; no deployment or credentials are required.

`wrangler.jsonc` preserves the existing Worker name, compatibility date and KV
namespace ID. Those identifiers are public deployment configuration, not access
credentials. A future independent fork must use its own Worker/KV and explicitly
coordinate its website Origin, browser endpoint and local launcher settings.

The relay only forwards `/api/status` and `/api/read` for the exact configured
website Origins in `dist/site-config.mjs`: kymon.pp.ua and the old Sites origin
during migration. It preserves the response stream, JSON whitespace keepalive, status,
Retry-After and cancellation signal. The local bridge remains responsible for
pairing, protocol/fingerprints, chart recomputation and writer validation.

The authenticated `/admin/origin` operation changes the active Quick Tunnel in KV.
`RELAY_ADMIN_SECRET` must be provisioned outside Git as a Worker secret. The user's
pairing code is entered manually in the browser and is never the admin secret.
Neither value nor a Cloudflare account credential belongs in this repository.

CI intentionally performs tests only. Deploying this Worker or modifying the
live KV mapping is a separate operational action.
