import { describe, expect, it } from 'vitest';
import { normalizeTuicV5Url } from '../../src/utils/tuic-url.js';
import { fixNodeUrlEncoding } from '../../functions/utils/node-utils.js';
import { generateCombinedNodeList } from '../../functions/services/subscription-service.js';

const uuid = '00000000-0000-4000-8000-000000000001';

describe('TUIC links remain importable across clients', () => {
  it('restores only the encoded v5 credential delimiter', () => {
    const input = `tuic://${uuid}%3Apass%3Aword%40mail@203.0.113.1:443?sni=example.test#Node%201`;
    const expected = `tuic://${uuid}:pass%3Aword%40mail@203.0.113.1:443?sni=example.test#Node%201`;

    expect(normalizeTuicV5Url(input)).toBe(expected);
    expect(normalizeTuicV5Url(expected)).toBe(expected);
  });

  it('supports lowercase escapes without changing unrelated or opaque links', () => {
    expect(normalizeTuicV5Url(`tuic://${uuid}%3apass@example.com:443`))
      .toBe(`tuic://${uuid}:pass@example.com:443`);
    expect(normalizeTuicV5Url('tuic://legacy%3Aopaque@example.com:443'))
      .toBe('tuic://legacy%3Aopaque@example.com:443');
    expect(normalizeTuicV5Url('vless://id%3Apass@example.com:443'))
      .toBe('vless://id%3Apass@example.com:443');
  });

  it('normalizes v2rayN-style TUIC links in the server node pipeline', () => {
    const input = `tuic://${uuid}%3Asecret@example.com:443?alpn=h3#Test`;
    expect(fixNodeUrlEncoding(input))
      .toBe(`tuic://${uuid}:secret@example.com:443?alpn=h3#Test`);
  });

  it('emits a Shadowrocket-compatible raw subscription while preserving password escapes', async () => {
    const input = `tuic://${uuid}%3Apass%3Aword@example.com:443?sni=example.com#Test`;
    const output = await generateCombinedNodeList(
      {},
      { enableAccessLog: false },
      'v2rayN/7.23',
      [{ id: 'tuic-1', name: 'TUIC Test', url: input, enabled: true }],
      '',
      { enableManualNodes: false, enableSubscriptions: true },
      false
    );

    expect(output).toContain(`tuic://${uuid}:pass%3Aword@example.com:443`);
    expect(output).not.toContain(`${uuid}%3Apass`);
  });
});
