# Frozen Qimen Baseline Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to execute this plan in this independent backup clone. Do not deploy the Site or push to GitHub as part of preparation.

**Goal:** Preserve the published source in E:/kymon-site and prepare a reproducible, tested baseline for a future GitHub origin and immutable release tag.

**Architecture:** Preserve the shared calendar/rotating-board engine and TG-CB-5.0 protocol. Treat analysis, writer validation, browser, local bridge and relay as distinct layers. Add release checks around the existing implementation; fix a rule only after independent evidence and a failing regression test.

**Tech Stack:** Node.js 22+, browser ES modules, vendored lunar-javascript 1.7.7, Python 3.10+, Windows C# launcher, Cloudflare relay.

**Spec:** User request on 2026-09-14: download the app source to E:/kymon-site as a backup, verify the complete core architecture and rule set, and prepare the original GitHub baseline for freezing and future forks.

## Global Constraints

- Keep an independently restorable backup of upstream commit 6cb83092d388f8acb072e1a92417706a04c79061 and its Git history.
- Preserve the 480-board SHA-256 d384c9f4d42a94bd80d709eac2c865943ac5ac4f7e86489d84b003edd2b465ea; never update it to hide a failure.
- Keep gpt-5.6-sol/high, the dedicated ChatGPT profile, manual pairing, protocol 5 and the 180-second/one-repair limit.
- Never include local credentials or runtime account data in source, bundles, packages or evidence.
- This request prepares a local GitHub baseline. No public GitHub repository, remote tag or live Site change is authorized by this plan.

## Task 1: Preserve And Establish The Baseline

- [x] Clone the current Sites source to the user-specified directory and verify the commit, clean state and hosting identity.
- [x] Preserve upstream history in a Git bundle; keep changes on codex/freeze-v16-baseline.
- [x] Run `node --test tests/*.test.mjs` and `node scripts/verify-assets.mjs`; retain exact results outside tracked source.
- [x] Audit the shared core, calendar conventions, analysis, modes, fingerprints and transport against QIMEN-ARCHITECTURE.md and the independent fixtures.

## Task 2: Make The Source Reproducible

- [x] Add `.gitignore`, `.gitattributes`, package scripts and a Windows/Linux GitHub Actions verification workflow without app runtime dependencies.
- [x] Include relay source and tests with deployment-specific settings documented separately from secrets.
- [x] Make the Windows dependency and local ZIP reproducible from a fresh clone, using verified artifacts and failing explicitly for missing required inputs.
- [x] Add a checked core-file manifest plus a baseline check that fails when protected code changes; keep golden output tests independent of this manifest.
- [x] Add focused regression tests only for defects demonstrated by inspection or execution, then fix them without broad refactoring.

## Task 3: Verify And Freeze

- [x] Run the complete offline suite, release/package checks, an independent fresh-clone check and browser workflows relevant to changed code.
- [x] Review the rule coverage and record exactly which results use independent references, property checks, synthetic AI or real AI.
- [x] Refresh README, architecture/current verification notes, third-party notices and the procedure for future GitHub upload, protected tags and upgrade branches.

Finalization after the source checks: commit the verified baseline, create the
annotated local freeze tag, generate the portable bundle/source archive and verify
restoration with a clean Git state. Record completion, exact commit and checksums
in ignored `.release/RELEASE.json` and `.release/restore-check.json`; these records
are generated after the source commit and cannot be embedded in that same commit.

## Validation Records

Store raw logs under ignored `.verification/`; store the human-readable result and reproducible commands in `docs/releases/`. Never label a passing hash as proof that all schools of Qimen use the same rules, or synthetic writer fixtures as successful real AI readings.

## User Steering: Custom Domain And GitHub

The user now requests kymon.pp.ua as the app domain and upload to https://github.com/dinhtrongddr-dev/KY-MON-DON-GIAP. This supersedes the earlier local-only destination constraint. The pre-domain tag is already verified and preserved. Work on codex/domain-kymon-pp-ua; create a new immutable v16.0.1-frozen.20260914 tag after domain-origin tests, launcher rebuild, package validation and restored bundle tests. Configure the custom domain on the existing Site, supply provider DNS records and push to the specified GitHub repository when authenticated. Do not change visibility or overwrite remote history. Keep the original published origin available during DNS migration.
