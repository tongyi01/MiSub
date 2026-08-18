import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useDataStore } from '../../src/stores/useDataStore.js';
import { useSettingsStore } from '../../src/stores/settings.js';

function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}

function createStore() {
    setActivePinia(createPinia());
    return useDataStore();
}

describe('Data store settings cache', () => {
    beforeEach(() => {
        sessionStorage.clear();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
        sessionStorage.clear();
    });

    it('updates the session data cache config after saving settings', async () => {
        const initialData = {
            misubs: [],
            profiles: [],
            ruleTemplates: [],
            config: {
                siteName: 'old site',
                enablePublicPage: false,
                transformConfig: 'https://example.com/old.ini'
            }
        };
        const nextSettings = {
            siteName: 'new site',
            enablePublicPage: true,
            transformConfig: 'https://example.com/new.ini'
        };

        vi.stubGlobal('fetch', vi.fn(async (url) => {
            if (url === '/api/settings') {
                return jsonResponse({ success: true });
            }
            throw new Error(`Unexpected request: ${url}`);
        }));

        const dataStore = createStore();
        expect(dataStore.hydrateFromData(initialData)).toBe(true);

        await dataStore.saveSettings(nextSettings);

        const cachedData = JSON.parse(sessionStorage.getItem('misub_data_cache'));
        expect(cachedData.config).toMatchObject(nextSettings);

        const reloadedStore = createStore();
        await reloadedStore.fetchData(false);

        const settingsStore = useSettingsStore();
        expect(settingsStore.config.siteName).toBe('new site');
        expect(settingsStore.config.enablePublicPage).toBe(true);
        expect(settingsStore.config.transformConfig).toBe('https://example.com/new.ini');
    });

    it('updates continuously followed profiles when the master list changes', () => {
        const dataStore = createStore();
        dataStore.hydrateFromData({
            misubs: [
                { id: 'n1', name: 'Node 1', group: 'A', url: 'ss://n1' },
                { id: 's1', name: 'Sub 1', url: 'https://example.com/1' }
            ],
            profiles: [{
                id: 'p1',
                subscriptions: ['s1'],
                manualNodes: ['n1'],
                syncSettings: {
                    mode: 'continuous',
                    strategy: 'incremental',
                    subscriptions: { enabled: true, includeNew: true },
                    manualNodes: { enabled: true, includeNew: true, groups: ['A'] }
                }
            }],
            config: {}
        });

        dataStore.overwriteSubscriptions([
            { id: 'n2', name: 'Node 2', group: 'A', url: 'ss://n2' },
            { id: 'n1', name: 'Node 1', group: 'A', url: 'ss://n1' },
            { id: 's2', name: 'Sub 2', url: 'https://example.com/2' },
            { id: 's1', name: 'Sub 1', url: 'https://example.com/1' }
        ]);

        expect(dataStore.profiles[0].subscriptions).toEqual(['s2', 's1']);
        expect(dataStore.profiles[0].manualNodes).toEqual(['n2', 'n1']);
    });
});
