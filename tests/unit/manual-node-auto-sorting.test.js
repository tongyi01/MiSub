import { describe, expect, it } from 'vitest';
import {
  buildAutoSortedSubscriptions,
  sortManualNodes
} from '../../src/composables/manual-nodes/sorting.js';
import { sortCollection } from '../../src/utils/collection-sorting.js';

const nodes = [
  { id: 'a2', name: '日本 2', url: 'ss://a2', group: 'A', enabled: true },
  { id: 'b1', name: '香港 1', url: 'ss://b1', group: 'B', enabled: false },
  { id: 'a1', name: '香港 2', url: 'ss://a1', group: 'A', enabled: true },
  { id: 'u1', name: '美国 1', url: 'ss://u1', group: '', enabled: true }
];

describe('manual node auto sorting', () => {
  it('follows the custom group order and keeps node order stable inside each group', () => {
    expect(sortManualNodes(nodes, {
      mode: 'group-order',
      groupOrder: ['B', 'A']
    }).map(node => node.id)).toEqual(['b1', 'a2', 'a1', 'u1']);
  });

  it('supports region and name sorting as independent choices', () => {
    expect(sortManualNodes(nodes, { mode: 'region' }).map(node => node.id))
      .toEqual(['b1', 'a1', 'a2', 'u1']);

    const namedNodes = [
      { id: 'z', name: 'Zulu 10' },
      { id: 'a', name: 'Alpha' },
      { id: 'z2', name: 'Zulu 2' }
    ];
    expect(sortManualNodes(namedNodes, { mode: 'name' }).map(node => node.id))
      .toEqual(['a', 'z2', 'z']);
  });

  it('keeps airport subscriptions untouched behind the sorted manual nodes', () => {
    const subscription = { id: 's1', name: 'Airport', url: 'https://example.com/sub' };
    const result = buildAutoSortedSubscriptions([...nodes, subscription], nodes, {
      mode: 'group-order',
      groupOrder: ['B', 'A']
    });

    expect(result.map(item => item.id)).toEqual(['b1', 'a2', 'a1', 'u1', 's1']);
  });
});

describe('subscription collection auto sorting', () => {
  it('sorts by name with numeric comparison', () => {
    const items = [
      { id: '2', name: '订阅 10' },
      { id: '1', name: '订阅 2' }
    ];

    expect(sortCollection(items, 'name').map(item => item.id)).toEqual(['1', '2']);
  });

  it('moves enabled items first while preserving order inside each status', () => {
    const items = [
      { id: 'd1', enabled: false },
      { id: 'e1', enabled: true },
      { id: 'e2', enabled: true },
      { id: 'd2', enabled: false }
    ];

    expect(sortCollection(items, 'enabled-first').map(item => item.id))
      .toEqual(['e1', 'e2', 'd1', 'd2']);
  });
});
