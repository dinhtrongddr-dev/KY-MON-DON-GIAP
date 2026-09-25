# Phase 9 staging / transport report

## Live provider transport

See `phase8-smoke-report.md` and `chatgpt2api-capabilities.json` for auth, SSE, cancel, cache and model/effort observations.

## Repository staging gates

The complete repository gate after the V2 audit fixes reports:
- 568/568 JavaScript tests passed;
- 1/1 Python regression passed;
- release/static verification passed;
- six protected core files and launcher pin passed.

Existing integration coverage exercised by `npm run check` includes:
- bridge pairing, Host and Origin enforcement;
- browser/client response validation and request fingerprints;
- async reading jobs, abort/cancel paths and stale-job handling;
- UI reading state and board changes;
- share persistence/rendering;
- PDF/report export;
- surface rendering and technical-evidence visibility;
- Mệnh and Hỏi Việc bridge paths;
- release/package consistency.

## Live canary checks already observed

- loopback bridge status: HTTP 200;
- named Tunnel status: HTTP 200;
- V2 static module served from active release: HTTP 200;
- full Case B HTTP reading: HTTP 200, Writer provider `chatgpt2api`, model `gpt-5-6`.

## Phase 10 RC evidence

Completed on RC `a857633e7536c3d6d04380160e93586981fae438`:

- final RC backend deployment;
- full Hỏi Việc Case B and Mệnh Case A smoke against that exact RC;
- actual RC → legacy → RC rollback rehearsal and return;
- local and named Tunnel authenticated status checks.

Still required before full production promotion:

- human blind readability review;
- observation window / enough real canary traffic;
- frontend/main promotion of the exact tested artifact.
