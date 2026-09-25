# ADR: chatgpt2api as an experimental Writer provider

## Decision

Integrate `chatgpt2api` as an **optional Writer-text provider**, not as a replacement for deterministic analysis or the structured Planner path.

The default production route remains unchanged until controlled evaluation.

## Why

The current bottleneck is at the surface Writer: the existing Prism/Codex structured path is optimized for schema-bound JSON and the legacy Writer is coupled to wording/format validation. A natural-text transport is needed before Writer v2 can be evaluated fairly.

`chatgpt2api` exposes a compatible text Chat Completions path, but its own upstream documentation describes the implementation as reverse-engineered and not a complete general-purpose ChatGPT proxy. Its catalog and response model fields are therefore not treated as proof of effective model entitlement or execution.

## Boundaries

- deterministic Kỳ Môn computation never moves into chatgpt2api;
- structured Planner can remain on the current provider;
- chatgpt2api receives only the Writer projection once Phase 3–5 are implemented;
- provider URL is backend allowlisted to loopback; frontend cannot submit arbitrary provider URLs;
- secrets remain server-side;
- selecting chatgpt2api is explicit and does not silently fall back to a different provider;
- cancellation/error state remains visible to the orchestrator.

## Evaluation required before production

Live Phase 8 probe must cover:

- advertised models versus actually successful text calls;
- short and long Vietnamese output;
- truncation;
- system/user role handling;
- cancellation and timeout;
- 401/403/429/5xx;
- cache behavior;
- requested/transmitted/reported effort;
- repeated calls with cache accounted for.

Phase 9 then compares legacy/current-provider versus Writer-v2/current-provider first, and only then Writer-v2/chatgpt2api using the same locked narrative package.

## Rollback

Disable the Writer provider flag and return to `current`. Stop the experimental service. No chart or legacy-reading migration is required.
