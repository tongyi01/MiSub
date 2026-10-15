const TUIC_V5_UUID_PREFIX = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})%3a(?=.)/i;

/**
 * Canonicalize the TUIC v5 credential separator for cross-client imports.
 *
 * v2rayN and some exporters percent-encode the whole `uuid:password`
 * userinfo and emit `%3A` for the separator. That is valid URL encoding, but
 * Shadowrocket expects the separator itself to remain a literal colon. Only
 * the delimiter after an unambiguous v5 UUID is restored; password escapes,
 * query parameters, fragments, non-TUIC links, and opaque v4 tokens remain
 * untouched.
 */
export function normalizeTuicV5Url(nodeUrl) {
  if (typeof nodeUrl !== 'string' || !/^tuic:\/\//i.test(nodeUrl)) {
    return nodeUrl;
  }

  const match = /^(tuic:\/\/)([^@/?#]*)@/i.exec(nodeUrl);
  if (!match) return nodeUrl;

  const userInfo = match[2];
  if (userInfo.includes(':') || !TUIC_V5_UUID_PREFIX.test(userInfo)) {
    return nodeUrl;
  }

  const normalizedUserInfo = userInfo.replace(TUIC_V5_UUID_PREFIX, '$1:');
  return `${match[1]}${normalizedUserInfo}@${nodeUrl.slice(match[0].length)}`;
}
