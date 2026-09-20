export const SITE_ORIGIN = 'https://kymon.pp.ua';
export const LEGACY_SITE_ORIGIN = 'https://kymon.tkgiongnoi2.chatgpt.site';
const FIXED_AI_RELAY_ORIGIN = 'https://ai-origin.kymon.pp.ua';
export function relayOriginFor(locationLike=globalThis.location){
  const host=String(locationLike?.hostname||'').toLowerCase();
  const origin=String(locationLike?.origin||'');
  return host.endsWith('.trycloudflare.com')&&/^https:\/\//i.test(origin)?origin:FIXED_AI_RELAY_ORIGIN;
}
export const AI_RELAY_ORIGIN = relayOriginFor();
export const SHARE_ORIGIN = FIXED_AI_RELAY_ORIGIN;
// Keep the exact old origin usable while DNS and installed bridges are migrated.
export const ALLOWED_WEB_ORIGINS = Object.freeze([SITE_ORIGIN, LEGACY_SITE_ORIGIN]);
