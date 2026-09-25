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

## Still required before Phase 10 is called fully observed

- final RC deployment after current audit fixes;
- full Hỏi Việc + Mệnh smoke against that exact RC;
- actual legacy→RC rollback rehearsal and return;
- human blind readability review;
- observation window / enough real canary traffic.
