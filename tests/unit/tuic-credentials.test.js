import { describe, expect, it } from 'vitest';
import yaml from 'js-yaml';
import { urlToClashProxy } from '../../functions/utils/url-to-clash.js';
import { generateBuiltinClashConfig } from '../../functions/modules/subscription/builtin-clash-generator.js';
import { convertTuicToUrl } from '../../src/utils/protocols/converters/tuic.js';

const uuid = '00000000-0000-4000-8000-000000000001';
const password = 'fixture-secret:@ /?+%3A#';
const tail = '@203.0.113.1:30001?sni=tuic.example.test&alpn=h3&congestion_control=bbr&allow_insecure=0#TUICFixture';

describe('TUIC v5 凭据在 MiSub/Clash 中分离', () => {
    it.each([
        `${uuid}:${encodeURIComponent(password)}`,
        encodeURIComponent(`${uuid}:${password}`),
        encodeURIComponent(`${uuid}:${password}`).replace('%3A', '%3a'),
    ])('输出真实 Clash YAML 时解码一次并保留密码和 TLS 设置：%s', auth => {
        const output = yaml.load(generateBuiltinClashConfig(`tuic://${auth}${tail}`));
        const node = output.proxies.find(proxy => proxy.type === 'tuic');
        expect(node.uuid).toBe(uuid);
        expect(node.password).toBe(password);
        expect(node.sni).toBe('tuic.example.test');
        expect(node.alpn).toEqual(['h3']);
        expect(node['congestion-controller']).toBe('bbr');
        expect(node['skip-cert-verify']).not.toBe(true);
    });

    it('修复已有 uuid:password / 空 password 节点并保持输入不变', () => {
        const broken = {
            type: 'tuic', name: 'TUICFixture', server: '203.0.113.1', port: 30001,
            uuid: `${uuid}:${password}`, password: '', sni: 'tuic.example.test',
            alpn: ['h3'], 'skip-cert-verify': false,
        };
        const before = structuredClone(broken);
        const link = convertTuicToUrl(broken);
        const parsed = urlToClashProxy(link);
        expect(parsed.uuid).toBe(uuid);
        expect(parsed.password).toBe(password);
        expect(parsed.sni).toBe(broken.sni);
        expect(parsed['skip-cert-verify']).not.toBe(true);
        expect(broken).toEqual(before);
    });

    it('显式密码不会被重写', () => {
        const parsed = urlToClashProxy(convertTuicToUrl({
            server: '203.0.113.1', port: 30001, uuid, password, name: 'TUICFixture',
        }));
        expect(parsed.uuid).toBe(uuid);
        expect(parsed.password).toBe(password);
    });

    it('保留非 UUID 的不透明旧版标识，不猜测密码', () => {
        const opaque = 'legacy:opaque-token';
        const parsed = urlToClashProxy(`tuic://${encodeURIComponent(opaque)}${tail}`);
        expect(parsed.uuid).toBe(opaque);
        expect(parsed.password).toBe('');
        const link = convertTuicToUrl({ server: '203.0.113.1', port: 30001, uuid: opaque, password: '' });
        expect(link).toContain(`tuic://${encodeURIComponent(opaque)}@`);
    });
});
