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

The domain has been registered with the existing Sites project. At preparation
time its A record still points to NIC.UA's parked page at 135.181.41.169. It is not
yet an active HTTPS app domain. Required apex targets returned by Sites are
162.159.143.30 and 172.66.3.26, plus the ownership/provider TXT records listed in
the local release handoff `E:/kymon-site/.release/DOMAIN-DNS.md`.

Changing application source or uploading it to GitHub does not change DNS. The
owner must apply these DNS records at the provider, then refresh the custom
domain status in Sites. The relay and local bridge must also run the matching
domain-aware version before AI requests from the new origin can succeed.
Keep account, pairing and admin credentials outside source control.

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
