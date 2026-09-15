# Cloudflare Pages Hosting Migration Design

**Date:** 2026-09-15  
**Status:** Approved for specification  
**Canonical source:** `E:\kymon-site`  
**Production domain:** `https://kymon.pp.ua`

## Context

The application is a buildless static site whose published files are committed
under `dist/`. It is currently hosted by ChatGPT Sites, while its optional AI
path remains Cloudflare Worker -> Cloudflare Tunnel -> the local Codex bridge.
The custom domain is active at NIC.UA and email-related DNS records must remain
intact.

The owner wants hosting that remains usable without a ChatGPT Plus
subscription. The selected deployment model is GitHub-connected Cloudflare
Pages with automatic production deployments from `main`.

## Goals

- Make GitHub the durable source of truth for production releases.
- Publish `dist/` through Cloudflare Pages automatically from `main`.
- Move `kymon.pp.ua` without an avoidable outage.
- Preserve all mail, verification, `www`, and `ftp` DNS records.
- Keep ChatGPT Sites available as a rollback target during migration.
- Preserve the existing Worker, tunnel, and local Codex protocol.
- Keep credentials, pairing codes, relay secrets, and local profiles out of
  Git and Cloudflare Pages build logs.

## Non-goals

- Moving the AI backend from the local computer to OpenAI API.
- Removing the requirement that the local computer and bridge be running for
  AI-assisted features.
- Deleting the existing ChatGPT Site during this migration.
- Refactoring the application or changing its Qimen calculation behavior.

## Selected Architecture

```text
Developer machine
  -> GitHub repository (main)
  -> Cloudflare Pages production deployment
  -> kymon.pp.ua

Browser AI request
  -> existing Cloudflare Worker
  -> existing Cloudflare Tunnel
  -> local Codex bridge at 127.0.0.1:8765
```

Cloudflare Pages serves static files only. No Pages Functions, database,
storage binding, or server-side secret is required. The existing Worker
continues to authorize `https://kymon.pp.ua`, so changing the frontend host
does not change the AI request protocol.

## Repository and Pages Configuration

Work is performed on `codex/cloudflare-pages-hosting`, not directly on
`main`. The Pages project uses these production settings:

- Git provider: GitHub.
- Repository: `dinhtrongddr-dev/KY-MON-DON-GIAP`.
- Production branch: `main`.
- Framework preset: None.
- Root directory: repository root.
- Build command: `npm run check`.
- Build output directory: `dist`.
- Node version: compatible with the repository requirement, Node.js 22 or
  newer.
- Preview deployments: enabled for non-production branches.

A root `wrangler.jsonc` records the Pages project name and
`pages_build_output_dir` for reproducible local checks and emergency direct
uploads. Git integration remains the normal production deployment mechanism.

## Deployment and Domain Cutover

1. Reconcile the local verified release with the existing GitHub `main`
   without rewriting remote history, then push the hosting branch.
2. Run the complete local verification suite and merge the reviewed hosting
   configuration into `main`.
3. Connect Cloudflare Pages to GitHub and verify the generated `*.pages.dev`
   production URL before changing DNS.
4. Add `kymon.pp.ua` as a Cloudflare DNS zone and copy every record currently
   managed at NIC.UA. Initially retain the two ChatGPT Sites apex A records so
   changing authoritative nameservers alone does not change the live host.
5. Compare apex, `www`, `ftp`, MX, TXT, and verification records. Change the
   NIC.UA nameservers only after the copied zone is complete.
6. Wait for the Cloudflare zone to become active and confirm the domain still
   serves the old Site through the retained apex records.
7. Attach `kymon.pp.ua` to the verified Pages project. Replace only the
   conflicting apex hosting records with the Pages-managed record.
8. Verify DNS, TLS, static assets, application behavior, and the AI relay from
   the production domain.

The old ChatGPT Sites deployment and its verification TXT records remain in
place throughout the observation period.

## Validation

Before GitHub or Cloudflare changes:

- `npm run check` passes.
- Git status is clean except for the deliberate hosting changes.
- No secret-like files or values are staged.

Before domain cutover:

- The Pages production deployment succeeds from GitHub `main`.
- The `*.pages.dev` URL loads the application over HTTPS.
- Expected JavaScript, CSS, image, vendor, Qimen, audit, and download assets
  return successful responses.
- A representative Qimen calculation matches the frozen release.
- Browser console and network checks show no host-specific failures.

After domain cutover:

- `https://kymon.pp.ua` presents a valid certificate and the Pages release.
- Apex and `www` resolve as intended.
- MX, TXT, mail-related, and preserved auxiliary records match the pre-change
  inventory.
- The app can reach the existing Worker; when the local bridge is running, an
  AI request completes through the existing tunnel.
- A fresh `npm run check` still passes against the committed source.

## Failure Handling and Rollback

- A failed GitHub build never triggers DNS changes; fix it on the hosting
  branch and redeploy.
- A failed `pages.dev` smoke test blocks custom-domain attachment.
- Missing or mismatched mail records block the nameserver change.
- If Pages fails after cutover, restore the previous two apex A records in
  Cloudflare DNS to route traffic back to ChatGPT Sites while Pages is fixed.
- If Cloudflare DNS itself cannot be activated reliably, restore the original
  NIC.UA authoritative nameservers. This is the slower, secondary rollback.
- Do not delete the old Site or its DNS verification records until the owner
  explicitly requests cleanup after a stable observation period.

## Security and Account Boundaries

- Authenticate GitHub and Cloudflare interactively; do not save tokens in the
  repository.
- Never print or commit relay administrator keys, tunnel credentials, pairing
  codes, ChatGPT profiles, or local bridge state.
- Pages receives only public static assets from `dist/`.
- Cloudflare account access is used only to create the Pages project, manage
  the zone, attach the domain, and inspect deployment status.

## Documentation and Completion Criteria

Release documentation will record the Pages project URL, production commit,
DNS cutover date, preserved-record inventory, validation evidence, and the
rollback target. The migration is complete only when automatic deployment
from GitHub works, `kymon.pp.ua` serves Cloudflare Pages over HTTPS, mail DNS is
unchanged, and the application's existing AI path remains functional.
