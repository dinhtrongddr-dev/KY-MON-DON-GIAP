# chatgpt2api experimental Writer service

This directory is an **experimental, opt-in** deployment for the Kỳ Môn Writer v2 path.

## Upstream pin

Source is pinned to:

- repository: `basketikun/chatgpt2api`
- commit: `dc105e51bd486bd75c8ef4f74be4bc4724bdfc33`

The compose file builds that Git commit instead of using the upstream `latest` image tag. Before a production release, record the built image digest as part of the release artifact.

## Network boundary

The service is bound only to `127.0.0.1:3000`. Do not publish its admin/API port through Cloudflare Tunnel or another public reverse proxy for the Kỳ Môn app. The Node bridge talks to `http://127.0.0.1:3000/v1`.

The auth key lives in the runtime environment. Do not commit it, put it in frontend code, or send it through browser requests.

## App configuration

The adapter is disabled unless both switches are explicit:

```bash
QIMEN_WRITER_PROVIDER=chatgpt2api
QIMEN_CHATGPT2API_ENABLED=1
CHATGPT2API_BASE_URL=http://127.0.0.1:3000/v1
CHATGPT2API_AUTH_KEY=...
CHATGPT2API_WRITER_MODEL=gpt-5
CHATGPT2API_REASONING_EFFORT=xhigh
```

When `QIMEN_WRITER_PROVIDER` is not `chatgpt2api`, the current Sol → Gemini → Prism text route remains selected. The legacy structured path is unchanged.

The adapter deliberately records the requested and reported model separately and leaves the effective upstream model/effort as unknown unless independently observed. A `/v1/models` catalog response is discovery evidence, not entitlement proof.

## Start for a capability spike

1. Copy `.env.example` to `.env` and set a local secret.
2. Run `docker compose up -d --build`.
3. Import/configure only an account that is explicitly approved for this test.
4. Probe `/v1/models`, then a short Vietnamese text request, a long Writer-sized request, cancellation/error behavior, and cache behavior.
5. Leave the Kỳ Môn production writer flag off until Phase 9 evaluation passes.

## Upstream usage warning

The upstream README describes this project as reverse-engineering ChatGPT website behavior, limits its intended use to personal learning/research/non-commercial technical exchange, forbids commercial/large-scale abuse, and warns of account restriction or ban risk. Treat this as a deployment/compliance constraint. Do not make this provider the production default until its terms, account risk, and intended usage are acceptable for the actual app deployment.

## Rollback

Set `QIMEN_WRITER_PROVIDER=current` (or remove it), restart the bridge, and stop this service. No deterministic Kỳ Môn engine data or stored legacy reading needs migration for this adapter.
