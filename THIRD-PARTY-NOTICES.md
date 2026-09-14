# Third-Party Notices

The application source has no project-wide open-source license grant in this baseline.
`package.json` marks it `private` and `UNLICENSED`. Before making a public GitHub
repository, the owner should choose a license for the original code and confirm
redistribution rights for the artwork. Keeping a backup does not establish those rights.

| Component | Version / source | License / handling |
| --- | --- | --- |
| lunar-javascript | 1.7.7, https://github.com/6tail/lunar-javascript | MIT; complete notice in `dist/vendor/LICENSE.lunar-javascript` |
| cloudflared Windows amd64 | 2026.9.0, official Cloudflare GitHub release | Apache-2.0; notice in `tools/LICENSE.cloudflared`; downloaded binary verified against the release SHA-256 |
| Node.js | 22 or 24, installed separately | Node.js distribution licenses apply; no Node binary bundled |
| Python | 3.10+, installed separately | Python distribution licenses apply; no Python binary bundled |
| Microsoft .NET Framework | Windows launcher compiler/runtime, installed separately | Microsoft terms; no framework/compiler redistribution |
| Codex CLI / ChatGPT | Official installation and account required separately | OpenAI product terms; no CLI binary, account token or API key bundled |
| App artwork and launcher assets | Preserved from the published Sites repository | No separate license declaration found; retain attribution/provenance and confirm before public reuse |

Classical rule references are documented in `docs/releases/RULE-COVERAGE.md`.
The Hong Kong Observatory PDF is an external verification reference, not bundled
as an application asset. The checked-in fixture values are facts transcribed from
that reference; no HKO endorsement is implied.
