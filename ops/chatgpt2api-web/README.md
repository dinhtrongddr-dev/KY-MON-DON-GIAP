# ChatGPT2API Web Edition runtime

The Kỳ Môn Writer provider now uses the separately maintained Web Edition repository:

- Repository: https://github.com/dinhtrongddr-dev/chatgpt2api-web
- VPS install directory: `/home/dinhtrongddr/services/chatgpt2api-web`
- Runtime container: `qimen-chatgpt2api-web`
- Local endpoint: `http://127.0.0.1:3000/v1`
- Provider source commit: `f47c0ed`

The provider is loopback-only. Runtime credentials are stored outside Git in the VPS `.env` file and are loaded by `kymon-vps.service`. Do not expose the provider port through the public tunnel.
