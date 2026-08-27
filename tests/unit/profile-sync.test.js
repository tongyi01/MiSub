import { describe, expect, it } from 'vitest';
import {
  applyContinuousProfileSync,
  applyProfileSync,
  normalizeProfileSyncSettings,
  previewProfileSync
} from '../../src/utils/profile-sync.js';

const subscriptions = [
  { id: 's2', name: 'Subscription 2' },
  { id: 's1', name: 'Subscription 1' },
  { id: 's3', name: 'Subscription 3' }
];

const manualNodes = [
  { id: 'n2', name: 'Node 2', group: 'B' },
  { id: 'n1', name: 'Node 1', group: 'A' },
  { id: 'n3', name: 'Node 3', group: 'A' },
  { id: 'n4', name: 'Node 4', group: '' }
];

describe('profile sync', () => {
  it('incrementally follows source order, adds missing items and preserves custom entries', () => {
    const profile = {
      id: 'p1',
      subscriptions: [{ id: 's1', exclude: 'HK' }, 'custom-sub', 's2'],
      manualNodes: ['n1', 'custom-node']
    };

    const result = applyProfileSync(profile, { subscriptions, manualNodes }, {
      strategy: 'incremental',
      subscriptions: { enabled: true, includeNew: true },
      manualNodes: { enabled: true, includeNew: true, groups: ['A'] }
    });

    expect(result.profile.subscriptions).toEqual([
      's2',
      { id: 's1', exclude: 'HK' },
      's3',
      'custom-sub'
    ]);
    expect(result.profile.manualNodes).toEqual(['n1', 'n3', 'custom-node']);
    expect(result.diff.subscriptions.added).toBe(1);
    expect(result.diff.manualNodes.added).toBe(1);
  });

  it('can reorder existing items without adding new ones', () => {
    const result = applyProfileSync({
      id: 'p1',
      subscriptions: ['s1', 's2'],
      manualNodes: []
    }, { subscriptions, manualNodes }, {
      subscriptions: { enabled: true, includeNew: false },
      manualNodes: { enabled: false }
    });

    expect(result.profile.subscriptions).toEqual(['s2', 's1']);
    expect(result.profile.manualNodes).toEqual([]);
  });

  it('exact mode removes entries outside the selected source scope', () => {
    const result = applyProfileSync({
      id: 'p1',
      subscriptions: ['s1', 'old'],
      manualNodes: ['n2', 'n1', 'n4']
    }, { subscriptions, manualNodes }, {
      strategy: 'exact',
      subscriptions: { enabled: false },
      manualNodes: { enabled: true, includeNew: true, groups: ['A'] }
    });

    expect(result.profile.subscriptions).toEqual(['s1', 'old']);
    expect(result.profile.manualNodes).toEqual(['n1', 'n3']);
    expect(result.diff.manualNodes.removed).toBe(2);
  });

  it('continuous mode updates only profiles that opted in', () => {
    const profiles = [
      {
        id: 'follow',
        subscriptions: ['s1', 's2'],
        manualNodes: [],
        syncSettings: {
          mode: 'continuous',
          subscriptions: { enabled: true, includeNew: false },
          manualNodes: { enabled: false }
        }
      },
      { id: 'manual', subscriptions: ['s1', 's2'], manualNodes: [] }
    ];

    const result = applyContinuousProfileSync(profiles, { subscriptions, manualNodes });

    expect(result.profiles[0].subscriptions).toEqual(['s2', 's1']);
    expect(result.profiles[1]).toBe(profiles[1]);
  });

  it('supports an independent manual-node group order for each profile', () => {
    const profiles = [
      {
        id: 'a-first',
        subscriptions: [],
        manualNodes: ['n2', 'n1', 'n3', 'n4'],
        syncSettings: {
          mode: 'continuous',
          subscriptions: { enabled: false },
          manualNodes: { enabled: true, includeNew: true, groupOrder: ['A', 'B', '__ungrouped__'] }
        }
      },
      {
        id: 'ungrouped-first',
        subscriptions: [],
        manualNodes: ['n2', 'n1', 'n3', 'n4'],
        syncSettings: {
          mode: 'continuous',
          subscriptions: { enabled: false },
          manualNodes: { enabled: true, includeNew: true, groupOrder: ['__ungrouped__', 'B', 'A'] }
        }
      }
    ];

    const result = applyContinuousProfileSync(profiles, { subscriptions, manualNodes });

    expect(result.profiles[0].manualNodes).toEqual(['n1', 'n3', 'n2', 'n4']);
    expect(result.profiles[1].manualNodes).toEqual(['n4', 'n2', 'n1', 'n3']);
  });

  it('normalizes and deduplicates a saved profile group order', () => {
    const settings = normalizeProfileSyncSettings({
      manualNodes: { groupOrder: [' B ', 'A', 'B', '__ungrouped__', ' '] }
    });

    expect(settings.manualNodes.groupOrder).toEqual(['B', 'A', '__ungrouped__']);
  });

  it('builds a per-profile preview without mutating the profiles', () => {
    const profiles = [{ id: 'p1', name: 'Home', subscriptions: ['s1'], manualNodes: [] }];
    const preview = previewProfileSync(profiles, ['p1'], { subscriptions, manualNodes }, {
      subscriptions: { enabled: true, includeNew: true },
      manualNodes: { enabled: true, includeNew: true, groups: ['A'] }
    });

    expect(preview[0].subscriptions.added).toBe(2);
    expect(preview[0].manualNodes.added).toBe(2);
    expect(profiles[0].subscriptions).toEqual(['s1']);
  });
});
