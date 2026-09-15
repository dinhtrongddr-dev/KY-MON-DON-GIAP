# Cloudflare Pages Hosting Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the verified static application automatically from GitHub `main` to Cloudflare Pages and move `kymon.pp.ua` without losing the current website or mail DNS.

**Architecture:** GitHub is the production source of truth, and Cloudflare Pages serves the committed `dist/` directory after running the repository checks. Cloudflare DNS becomes authoritative only after all NIC.UA records are copied, while the existing ChatGPT Sites A records remain the temporary route until the verified Pages custom domain is attached. The existing Worker, Quick Tunnel, and local Codex bridge remain unchanged.

**Tech Stack:** Git, GitHub, GitHub Actions, static browser ES modules, Node.js 22+, Python 3.10+, Cloudflare Pages, Cloudflare DNS, NIC.UA DNS, Cloudflare Worker and Tunnel.

**Spec:** `docs/superpowers/specs/2026-09-15-cloudflare-pages-hosting-design.md`

## Global Constraints

- Canonical source is `E:\kymon-site`.
- Perform implementation on `codex/cloudflare-pages-hosting`, not directly on local `main`.
- GitHub production repository is `dinhtrongddr-dev/KY-MON-DON-GIAP`; preserve its existing visibility and history.
- Cloudflare Pages production branch is `main`, framework preset is None, root is the repository root, build command is `npm run check`, and output directory is `dist`.
- Do not change DNS until the generated `*.pages.dev` deployment passes its static application checks.
- Preserve every mail, MX, TXT, verification, `www`, and `ftp` record during the DNS move.
- Keep ChatGPT Sites and its verification TXT records available as the rollback target.
- Do not change the Worker, tunnel, local bridge protocol, Qimen engine, frozen core, model, or reasoning configuration.
- Never print, commit, or place in build logs any GitHub token, Cloudflare token, tunnel credential, relay administrator key, pairing code, ChatGPT profile, or local bridge state.
- If a browser displays a password, passkey, OAuth consent, CAPTCHA, or two-factor prompt, pause for the owner to complete it; never request or record the secret.

## File Map

- Create `wrangler.jsonc`: reproducible Cloudflare Pages project identity and output-directory contract.
- Create `tests/hosting.test.mjs`: automated guard for the Pages configuration and retained Sites fallback configuration.
- Create `docs/releases/CLOUDFLARE-PAGES.md`: final hosting, DNS, validation, and rollback record.
- Modify `docs/releases/DOMAIN-MIGRATION.md`: replace the pre-activation status with the completed Pages cutover state.
- Modify `README.md`: identify Cloudflare Pages as the production static host and ChatGPT Sites as the temporary rollback host.
- Preserve `.openai/hosting.json`: do not alter or delete the ChatGPT Sites fallback configuration.
- Use `.release/` only for ignored, locally generated DNS and deployment evidence; do not stage it.
- Configure GitHub and Cloudflare account state through their authenticated interfaces; no credentials enter repository files.

---

### Task 1: Add a Tested Cloudflare Pages Contract

**Files:**
- Create: `tests/hosting.test.mjs`
- Create: `wrangler.jsonc`
- Preserve: `.openai/hosting.json`

**Interfaces:**
- Consumes: the existing `scripts/run-tests.mjs` automatic discovery of `tests/*.test.mjs`.
- Produces: a root Pages configuration named `ky-mon-don-giap` that publishes `./dist`, plus a regression test consumed by `npm test` and Cloudflare's `npm run check` build command.

- [ ] **Step 1: Write the failing hosting contract test**

Create `tests/hosting.test.mjs` with:

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));

test('Cloudflare Pages publishes the verified dist directory without server bindings', async () => {
  const config = JSON.parse(await readFile(join(root, 'wrangler.jsonc'), 'utf8'));
  assert.equal(config.name, 'ky-mon-don-giap');
  assert.equal(config.pages_build_output_dir, './dist');
  assert.equal(config.compatibility_date, '2026-09-15');
  assert.equal(config.main, undefined);
  assert.equal(config.kv_namespaces, undefined);
  assert.equal(config.d1_databases, undefined);
  assert.equal(config.r2_buckets, undefined);
});

test('the ChatGPT Sites configuration remains available for rollback', async () => {
  const config = JSON.parse(await readFile(join(root, '.openai/hosting.json'), 'utf8'));
  assert.equal(config.static.directory, 'dist');
});
```

- [ ] **Step 2: Run the focused test and verify that it fails**

Run: `node --test tests/hosting.test.mjs`

Expected: FAIL with `ENOENT` for the missing root `wrangler.jsonc`; the fallback assertion may pass.

- [ ] **Step 3: Add the minimal Pages configuration**

Create `wrangler.jsonc` with:

```json
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "ky-mon-don-giap",
  "pages_build_output_dir": "./dist",
  "compatibility_date": "2026-09-15"
}
```

- [ ] **Step 4: Run the focused test and verify that it passes**

Run: `node --test tests/hosting.test.mjs`

Expected: 2 tests pass.

- [ ] **Step 5: Run the complete repository verification**

Run: `npm run check`

Expected: all Node tests, the Python package regression, frozen-core hashes, static assets, launcher pins, module syntax, and release checks pass.

- [ ] **Step 6: Commit the Pages contract**

```powershell
git add -- wrangler.jsonc tests/hosting.test.mjs
git commit -m "Configure Cloudflare Pages hosting"
```

Expected: the commit contains only the new Pages config and hosting test.

---

### Task 2: Preserve the Existing GitHub History and Publish the Verified Source

**Files:**
- Resolve, if needed: `README.md`
- Inspect: all tracked files and tags

**Interfaces:**
- Consumes: local verified history ending at `v16.0.1-frozen.20260914` and GitHub `origin/main` at its one-line initial README commit.
- Produces: a remote hosting branch and a non-force fast-forward of GitHub `main` containing both histories.

- [ ] **Step 1: Confirm the branch and clean working tree**

Run: `git status --short --branch`

Expected: branch `codex/cloudflare-pages-hosting` with no unstaged or untracked files.

- [ ] **Step 2: Refresh the remote references**

Run: `git fetch --tags origin`

Expected: `origin/main` resolves and no local files change.

- [ ] **Step 3: Merge the GitHub starter history without rewriting it**

Run:

```powershell
git merge origin/main --allow-unrelated-histories -X ours -m "Merge GitHub repository history"
```

Expected: a merge commit is created; the full local `README.md` is retained instead of the remote one-line starter README.

- [ ] **Step 4: Verify ancestry and repository content**

Run: `git merge-base --is-ancestor origin/main HEAD`

Expected: exit code 0 with no output.

Run: `Get-Content README.md -TotalCount 5`

Expected: the first heading remains `# Kỳ Môn Bàn` and the application description remains present.

- [ ] **Step 5: Re-run the complete verification after the history merge**

Run: `npm run check`

Expected: the same full suite passes.

- [ ] **Step 6: Authenticate GitHub only if the credential manager requests it**

If push authentication fails, run: `git credential-manager github login --browser`

Expected: the owner completes GitHub OAuth in the browser. Do not use `--pat`, paste a token into the terminal, or expose the resulting credential.

- [ ] **Step 7: Push the implementation branch and frozen tags**

Run: `git push -u origin codex/cloudflare-pages-hosting`

Run:

```powershell
git push origin refs/tags/v16.0.0-frozen.20260914 refs/tags/v16.0.1-frozen.20260914
```

Expected: the branch and both existing immutable tags appear on GitHub without force-push.

- [ ] **Step 8: Fast-forward remote production main without force**

Run: `git push origin codex/cloudflare-pages-hosting:main`

Expected: GitHub accepts a normal fast-forward because the branch contains `origin/main`; `--force` and `--force-with-lease` are never used.

- [ ] **Step 9: Verify the remote commit**

Run: `git ls-remote origin refs/heads/main refs/heads/codex/cloudflare-pages-hosting`

Expected: both remote refs resolve to the current local `HEAD` commit.

---

### Task 3: Create the GitHub-Connected Cloudflare Pages Project

**Files:**
- Read: `wrangler.jsonc`
- No credential files are created or modified.

**Interfaces:**
- Consumes: GitHub `main`, `npm run check`, and the committed `dist/` directory.
- Produces: the Cloudflare Pages project `ky-mon-don-giap` and production URL `https://ky-mon-don-giap.pages.dev`.

- [ ] **Step 1: Confirm Cloudflare account access**

Run: `npx --yes wrangler whoami`

Expected: the authenticated Cloudflare account is shown. If it reports unauthenticated, open the Cloudflare dashboard and let the owner complete login; never ask for the account password or two-factor code.

- [ ] **Step 2: Connect Cloudflare Pages to GitHub**

In Cloudflare Dashboard, open **Workers & Pages**, create a Pages application, choose **Connect to Git**, authorize GitHub if prompted, and select `dinhtrongddr-dev/KY-MON-DON-GIAP`.

Expected: only the selected repository is granted if Cloudflare offers repository-scoped GitHub access.

- [ ] **Step 3: Enter the exact production build settings**

Set:

```text
Project name: ky-mon-don-giap
Production branch: main
Framework preset: None
Root directory: /
Build command: npm run check
Build output directory: dist
Environment variable NODE_VERSION: 22.23.2
Environment variable PYTHON_VERSION: 3.10
```

Expected: no Pages Function, KV, D1, R2, secret, or runtime binding is configured. If `ky-mon-don-giap` is unavailable, stop and revise the project name in the config, test, spec, and plan before proceeding.

- [ ] **Step 4: Start and inspect the first Git deployment**

Expected: Cloudflare checks out GitHub `main`, runs `npm run check`, and publishes `dist`. Inspect the complete build log and confirm it contains no secrets or private local paths.

- [ ] **Step 5: Verify the Pages deployment identity**

Open `https://ky-mon-don-giap.pages.dev`.

Expected: HTTPS is valid, the title and Kỳ Môn application load, and Cloudflare reports the production deployment as successful for the same commit returned by `git rev-parse HEAD`.

---

### Task 4: Smoke-Test the Pages URL Before DNS Changes

**Files:**
- Generate but do not commit: `.release/cloudflare-pages-precutover.txt`

**Interfaces:**
- Consumes: `https://ky-mon-don-giap.pages.dev` and the committed static release.
- Produces: evidence that the new host serves the complete static application before any DNS cutover.

- [ ] **Step 1: Check critical static paths over HTTPS**

Run:

```powershell
$pagesBase = 'https://ky-mon-don-giap.pages.dev'
$pagesPaths = @('/', '/styles.css', '/app.mjs', '/qimen.mjs', '/reading-core.mjs', '/site-config.mjs', '/vendor/lunar.js', '/qimen/core/board.mjs', '/audit.html', '/downloads/ky-mon-ai.zip')
$pagesPaths | ForEach-Object {
  $response = Invoke-WebRequest -Uri ($pagesBase + $_) -Method Head
  [pscustomobject]@{ Path = $_; Status = [int]$response.StatusCode; Length = $response.Headers['Content-Length'] }
}
```

Expected: every path returns status 200. If a server rejects HEAD, repeat only that path with `-Method Get`; do not treat a supported GET as a failure.

- [ ] **Step 2: Verify the release marker and canonical configuration**

Run:

```powershell
$index = (Invoke-WebRequest 'https://ky-mon-don-giap.pages.dev/').Content
$config = (Invoke-WebRequest 'https://ky-mon-don-giap.pages.dev/site-config.mjs').Content
if ($index -notmatch 'kymon\.pp\.ua') { throw 'Canonical domain marker missing' }
if ($config -notmatch "SITE_ORIGIN = 'https://kymon\.pp\.ua'") { throw 'Site origin mismatch' }
```

Expected: no exception.

- [ ] **Step 3: Exercise the application in a real browser**

Open the Pages URL and verify one representative chart, all five result tabs, the audit page, and a narrow mobile viewport. Check the browser console and network panel.

Expected: calculations and static navigation work, with no JavaScript exception or missing asset. Do not test the AI button from `pages.dev`; the Worker intentionally authorizes only the production and legacy origins.

- [ ] **Step 4: Record pre-cutover evidence locally**

Record the Pages deployment URL, deployment commit, build status, critical-path status results, and browser result in `.release/cloudflare-pages-precutover.txt`.

Expected: the evidence file remains ignored by Git and `git status --short` does not list it.

---

### Task 5: Move Authoritative DNS to Cloudflare Without Changing the Live Host

**Files:**
- Generate but do not commit: `.release/cloudflare-dns-before.json`
- Generate but do not commit: `.release/cloudflare-dns-after-ns.json`

**Interfaces:**
- Consumes: the full NIC.UA DNS inventory and the two existing ChatGPT Sites apex A records `162.159.143.30` and `172.66.3.26`.
- Produces: an active Cloudflare DNS zone that initially routes the apex to the unchanged ChatGPT Sites host and preserves all non-web records.

- [ ] **Step 1: Capture the current public DNS answers**

Query at least `NS`, apex `A`, `www`, `ftp`, `MX`, and `TXT` with `Resolve-DnsName`, and record the returned data in `.release/cloudflare-dns-before.json`.

Expected: the apex includes `162.159.143.30` and `172.66.3.26`. Do not proceed if the public answers differ from the NIC.UA control panel; reconcile the inventory first.

- [ ] **Step 2: Inventory every NIC.UA record in the authenticated DNS page**

Open the NIC.UA DNS page for nameserver set `2853339` and transcribe every record's name, type, value, priority, and TTL into the local evidence record.

Expected: apex hosting records, Sites verification TXT records, mail/MX records, `www`, `ftp`, and any additional record are accounted for exactly once.

- [ ] **Step 3: Add `kymon.pp.ua` to the existing Cloudflare account on the Free plan**

Allow Cloudflare to scan records, then compare its proposed zone line by line with the NIC.UA inventory. Add missing records and correct mismatches before continuing.

Expected: the Cloudflare zone still contains both old apex A records. Keep those temporary ChatGPT Sites A records DNS-only. Mail, MX, TXT, `www`, and `ftp` values match NIC.UA, and all mail/FTP records are also DNS-only rather than proxied.

- [ ] **Step 4: Change only the authoritative nameservers at NIC.UA**

Replace the domain's current authoritative nameservers with the two exact nameservers assigned by Cloudflare.

Expected: no individual DNS record is deleted at NIC.UA, and no apex hosting value is edited during this step.

- [ ] **Step 5: Wait for Cloudflare zone activation and verify the unchanged route**

Use Cloudflare's zone status plus `Resolve-DnsName -Type NS kymon.pp.ua` until the Cloudflare nameservers are authoritative.

Expected: `https://kymon.pp.ua` still serves ChatGPT Sites because the copied apex A records remain unchanged; TLS remains valid and mail DNS still matches the captured inventory.

- [ ] **Step 6: Record the post-nameserver state**

Write the active nameservers and resolved apex, `www`, `ftp`, MX, and TXT answers to `.release/cloudflare-dns-after-ns.json`.

Expected: only authoritative nameservers have changed; record content remains equivalent.

---

### Task 6: Attach the Production Domain to Pages and Verify the AI Path

**Files:**
- No repository files change during cutover.

**Interfaces:**
- Consumes: the verified Pages project, active Cloudflare DNS zone, and existing Worker allowlist for `https://kymon.pp.ua`.
- Produces: `https://kymon.pp.ua` served by Cloudflare Pages with a valid certificate and the existing AI relay path intact.

- [ ] **Step 1: Add the apex custom domain in Pages**

In the `ky-mon-don-giap` Pages project, add `kymon.pp.ua` as a custom domain.

Expected: Cloudflare identifies the two old apex A records as the only hosting conflict and offers or creates the Pages-managed apex record. Do not delete MX, TXT, mail, `www`, or `ftp` records.

- [ ] **Step 2: Complete the apex hosting-record replacement**

Replace only `162.159.143.30` and `172.66.3.26` with the Pages-managed record for `ky-mon-don-giap.pages.dev`.

Expected: the Pages custom domain reaches Active status and certificate provisioning begins or completes. Keep the old A values in the rollback documentation, not as simultaneous apex records.

- [ ] **Step 3: Verify DNS and TLS**

Run: `Resolve-DnsName kymon.pp.ua`

Run: `Invoke-WebRequest -Uri 'https://kymon.pp.ua' -Method Get`

Expected: resolution uses Cloudflare, HTTPS returns 200 with a valid certificate, and the application content matches the Pages deployment.

- [ ] **Step 4: Repeat the static browser smoke test on the production origin**

Verify one representative chart, all five result tabs, audit page, downloads link, desktop layout, and a 390px mobile layout. Inspect console and network failures.

Expected: no JavaScript exception, missing asset, redirect loop, mixed content, or stale ChatGPT Sites response.

- [ ] **Step 5: Verify the existing relay and AI flow**

Confirm the local launcher, bridge, and tunnel are running, then use the production site's status check and one controlled AI reading.

Expected: the browser request origin is `https://kymon.pp.ua`, the existing Worker accepts it, the tunnel reaches the local bridge, and the response renders. If the local bridge is offline, restore it without changing the Pages or DNS design; if the Worker returns 403, stop and inspect the deployed Worker version before modifying code.

- [ ] **Step 6: Recheck preserved DNS records**

Query MX, TXT, mail, `www`, and `ftp` again and compare them with `.release/cloudflare-dns-before.json`.

Expected: mail and auxiliary records remain semantically identical; only the intended web-hosting and authoritative nameserver records differ.

---

### Task 7: Record the Migration and Verify Automatic Redeployment

**Files:**
- Create: `docs/releases/CLOUDFLARE-PAGES.md`
- Modify: `docs/releases/DOMAIN-MIGRATION.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: the live Pages project URL, production deployment commit, final DNS state, test results, and rollback values.
- Produces: durable operator documentation and a final GitHub commit that triggers and proves automatic Pages deployment.

- [ ] **Step 1: Write the Cloudflare Pages release record**

Create `docs/releases/CLOUDFLARE-PAGES.md` with the heading `# Cloudflare Pages Hosting` and these exact stable fields:

```text
Production domain: https://kymon.pp.ua
Pages project: ky-mon-don-giap
Pages URL: https://ky-mon-don-giap.pages.dev
Production branch: main
Build command: npm run check
Build output: dist
```

Run `git rev-parse HEAD` and write its exact output after `Deployment commit:`. Add the exact UTC deployment time shown by Cloudflare after `Deployment time:`. State the observed results for Pages build status, nameserver activation, preserved DNS comparison, HTTPS, browser smoke testing, and the controlled AI request; each result must say `PASS` or describe the concrete failure.

State that the application is served as static assets by Cloudflare Pages, the existing Worker/Tunnel/local bridge remains the AI path, and no account or relay credential is stored in Git or Pages configuration. Add a `## Rollback` section that restores apex A records `162.159.143.30` and `172.66.3.26`, keeps all mail and verification records unchanged, and points to the former NIC.UA nameservers captured in local release evidence for the secondary DNS rollback.

- [ ] **Step 2: Update the existing domain migration record**

In `docs/releases/DOMAIN-MIGRATION.md`, preserve the historical baseline and replace the outdated activation paragraph with the actual Cloudflare Pages project, activation date, final DNS ownership, successful HTTPS/browser/AI checks, and rollback pointer to `docs/releases/CLOUDFLARE-PAGES.md`.

- [ ] **Step 3: Update the README hosting sentence**

State that `https://kymon.pp.ua` is published from GitHub `main` by Cloudflare Pages, while the legacy ChatGPT Sites deployment is temporarily retained only for rollback. Do not imply that publishing the frontend removes the need for the local bridge for AI readings.

- [ ] **Step 4: Run documentation and secret checks**

Run: `rg -ni "unfinished|replace this|insert value|token=|api[_-]?key|relay-admin|pairing-code" README.md docs/releases/CLOUDFLARE-PAGES.md docs/releases/DOMAIN-MIGRATION.md wrangler.jsonc`

Expected: no unfinished marker and no secret value. References explaining that secrets are excluded are acceptable; inspect every match manually.

- [ ] **Step 5: Run the complete verification again**

Run: `npm run check`

Expected: all tests and release checks pass, including the new hosting contract.

- [ ] **Step 6: Commit the completed migration record**

```powershell
git add -- README.md docs/releases/CLOUDFLARE-PAGES.md docs/releases/DOMAIN-MIGRATION.md
git commit -m "Document Cloudflare Pages production hosting"
```

Expected: ignored `.release/` evidence and credentials are not staged.

- [ ] **Step 7: Push the final documentation commit to branch and main**

Run: `git push origin codex/cloudflare-pages-hosting`

Run: `git push origin codex/cloudflare-pages-hosting:main`

Expected: both pushes are normal fast-forwards and the second push starts a new automatic Pages production deployment.

- [ ] **Step 8: Verify automatic production redeployment**

In Cloudflare Pages, wait for the deployment of the final `main` commit.

Expected: build passes, the production deployment commit equals local `HEAD`, `https://ky-mon-don-giap.pages.dev` and `https://kymon.pp.ua` remain healthy, and the old ChatGPT Site remains available as an unadvertised rollback target.

- [ ] **Step 9: Confirm final repository state**

Run: `git status --short --branch`

Run: `git ls-remote origin refs/heads/main refs/heads/codex/cloudflare-pages-hosting`

Expected: the working tree is clean and both remote refs equal local `HEAD`.
