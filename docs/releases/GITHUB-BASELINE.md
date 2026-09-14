# Frozen Baseline, Backup And Future GitHub Upload

The user-designated backup repository is `E:/kymon-site`. It preserves the full
Sites history ending at `6cb83092d388f8acb072e1a92417706a04c79061`, corresponding
to published Site deployment 17 and app v16 / TG-CB-5.0 / protocol 5.

The intended immutable release tag is `v16.0.0-frozen.20260914`. Confirm it with
`git show --no-patch v16.0.0-frozen.20260914` and the adjacent checksums report.
`sites-upstream` records the original source; `origin` is reserved for GitHub.
The preparation task does not publish a GitHub repository or deploy the Site.

## Restore Without The Original Server

The ignored `.backups/` directory contains the upstream Git bundle and the final
frozen bundle. `.release/` contains a source ZIP and SHA256SUMS. Copy these
artifacts to a separate disk or backup service to protect against loss of drive E.
The repository directory alone is not protection against disk failure.

```powershell
Get-FileHash E:/kymon-site/.backups/kymon-v16.0.0-frozen.20260914.bundle -Algorithm SHA256
git bundle verify E:/kymon-site/.backups/kymon-v16.0.0-frozen.20260914.bundle
git clone E:/kymon-site/.backups/kymon-v16.0.0-frozen.20260914.bundle E:/kymon-restored
git -C E:/kymon-restored switch --detach v16.0.0-frozen.20260914
```

Compare the hash to `.release/SHA256SUMS.txt`, then in the restored directory:

```powershell
npm ci --ignore-scripts --no-audit --no-fund
npm run check
npm run prepare:windows
npm run verify:package
```

The standalone source ZIP contains the committed source and downloadable local
package; it omits `.git` history. Use the bundle for history/tags and the ZIP for
source-only recovery. `dist/downloads/ky-mon-ai.zip` is a separate runnable local
distribution with cloudflared, launcher, app, tests and reference documentation.
It omits its own nested download ZIP. In that extracted distribution, run
`npm run package:local` before `npm run verify` to reconstruct that download.

None of these artifacts contains the user's dedicated ChatGPT login, pairing
code, relay admin key or Cloudflare credentials. Restoring code does not restore
account access. The original private runtime configuration remains outside Git.

## Future GitHub Upload

Create an empty repository under the owner's chosen GitHub account. Keep it
private until the license/artwork decisions in `THIRD-PARTY-NOTICES.md` are made.
Do not initialize a competing README/history on GitHub. After substituting the
real owner/repository URL, run these commands from `E:/kymon-site`:

```powershell
git remote add origin https://github.com/OWNER/REPOSITORY.git
git push -u origin main
git push origin refs/tags/v16.0.0-frozen.20260914
```

Only these explicit refs need publishing. Avoid `--mirror`, `--force`, or uploading
the private runtime folders. The largest source asset is the local ZIP, below
GitHub's 100 MiB per-file limit. CI uses Node 22/24 on Windows/Linux without live
AI credentials. The source has no npm runtime dependencies.

Configure GitHub rulesets to protect `main` and `v16.0.0-frozen.*`: require reviewed
pull requests and the verification jobs, disallow force pushes and deletion, and
restrict tag creation/update to the maintainer. These server-side protections
cannot exist before the GitHub repository is created; a local tag by itself is
not tamper-proof or cryptographically signed.

## Upgrade From The Frozen Original

```powershell
git switch -c codex/upgrade-description v16.0.0-frozen.20260914
npm run check
```

In a GitHub fork, keep the upstream frozen tag and branch from it. Preserve the
golden output test unless a separately evidenced engine change is the purpose of
the upgrade. Protocol or interpretation changes must update both browser and
bridge, tests, documentation and package. Keep the original tag immutable; make a
new version/tag and backup bundle for each reviewed upgrade.

## Rebuild Windows Assets

`npm run prepare:windows` verifies the shipped launcher and obtains pinned
cloudflared from a verified existing installation or the official GitHub release.
An offline copy can be supplied explicitly:

```powershell
node scripts/prepare-windows.mjs --cloudflared-source E:/verified-tools/cloudflared.exe
npm run build:launcher
npm run package:local
npm run verify:package
```

The C# build goes to `.verification/launcher/`, exercises the icon, and leaves the
pinned release executable intact. The .NET Framework compiler embeds variable
metadata; successful compilation is not a claim of binary identity. Changes to a
shipped executable need a reviewed new checksum. ZIP inputs use fixed timestamps,
ordering, permissions and line endings; compression bytes can differ across zlib
versions, so verify file content as well as the distributed ZIP checksum.
