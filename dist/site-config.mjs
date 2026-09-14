export const SITE_ORIGIN = 'https://kymon.pp.ua';
export const LEGACY_SITE_ORIGIN = 'https://kymon.tkgiongnoi2.chatgpt.site';
export const AI_RELAY_ORIGIN = 'https://ky-mon-codex-relay.dinhtrongddr.workers.dev';
// Keep the exact old origin usable while DNS and installed bridges are migrated.
export const ALLOWED_WEB_ORIGINS = Object.freeze([SITE_ORIGIN, LEGACY_SITE_ORIGIN]);
