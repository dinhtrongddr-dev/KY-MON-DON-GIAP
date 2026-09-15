# Custom Domain Baseline - 16.0.1

Canonical website: https://kymon.pp.ua
GitHub source: https://github.com/dinhtrongddr-dev/KY-MON-DON-GIAP
Final release tag: `v16.0.1-frozen.20260914`.

The earlier `v16.0.0-frozen.20260914` tag preserves the verified pre-domain source
at `2dbadae7cf8cc095a8c6a3ce353308fcdd8acd85`. Its backup was restored successfully
and passed all 95 Node tests, the Python packaging regression and package checks.
The domain update is a separate commit/version; it does not move that tag.

## Domain Configuration

`dist/site-config.mjs` declares the canonical HTTPS origin, the existing relay
endpoint and the exact prior Sites origin allowed during migration. Browser,
bridge and Worker import the shared configuration. The Windows launcher opens
the new domain; the tunnel landing redirect also uses it. The local installer
link is relative, so it works on both domain names. `index.html` declares the new
canonical URL.

The Worker checks the incoming Origin against the two exact allowed strings,
echoes that Origin in CORS and forwards it unchanged to the bridge. It does not
allow wildcard subdomains, lookalike suffixes, insecure HTTP or arbitrary ports.
Keeping the old origin available allows DNS propagation and installed bridges
to be migrated without removing access to the existing published website.

The calendar/rotating-board core, 480-board golden hash, TG-CB-5.0 protocol 5,
Sol/high model and 180-second/one-repair budget remain unchanged.

## Activation

On 15/09/2026, GitHub `main` became the production source for the Cloudflare
Pages project `ky-mon-don-giap`, published at
`https://ky-mon-don-giap.pages.dev`. The production deployment for the cutover
used commit `ea9df4f05d87790c9f4306ece3e7339be697ff93`, ran `npm run check`,
and published `dist` successfully.

Cloudflare DNS is authoritative through `aspen.ns.cloudflare.com` and
`quincy.ns.cloudflare.com`. The apex is a proxied Pages-managed CNAME to
`ky-mon-don-giap.pages.dev`; mail, MX, `www`, `ftp`, and both verification TXT
records remain in place. The Pages custom domain, certificate validation, and
domain verification are active. Public Cloudflare DNS resolves the apex to the
current Pages route, although individual ISP resolvers can continue returning
the former Sites addresses until their cached TTL expires.

HTTPS, all 59 deployed files, the audit route, a 390px browser layout, browser
console and network activity, and one controlled production AI reading all
passed. The AI request still follows Worker -> Tunnel -> local Codex bridge and
therefore still requires the local connector to be running. The legacy ChatGPT
Sites deployment remains available for rollback. Full production evidence and
rollback instructions are in `docs/releases/CLOUDFLARE-PAGES.md`; generated DNS
evidence remains local under `.release/`.

## Validation And Release Records

On Windows, all 97 Node tests plus the Python packaging regression passed under
Node 22.23.2 and 24.14.0. The release verifier passed six core hashes, the paired
launcher source/binary hashes, 59 assets and 118 local references. Chrome tested
the new HTTPS origin using an explicit local route override: eight chart cases,
Auto plus six modes, five tabs, streamed error handling, input invalidation and a
390px mobile layout all passed without page errors. This override does not claim
that public DNS or HTTPS is active; see `evidence/domain-browser-check.json`.

`tests/domain.test.mjs` covers both allowed Origins, denied variants and the
launcher/canonical address. Existing bridge and relay transport tests exercise
the new primary Origin. Windows binary is rebuilt from the changed C# source,
self-tested, assigned a reviewed checksum and included in the complete ZIP.

Final test counts, GitHub push/CI state, domain status, archive checksums and
restore result are written to `.release/RELEASE.json` and accompanying generated
records. The local browser check uses controlled AI responses; the older public
real-AI evidence remains explicitly attached to the original published domain.

The Cloudflare Pages completion check ran 99 passing Node tests, the Python
packaging regression, a 59-file production byte comparison, and a real
production-origin AI request with matching protocol-5 fingerprints. This
hosting migration does not change the frozen Qimen core or the earlier release
evidence.
