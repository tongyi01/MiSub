import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import { useManualNodeSearchPagination } from '../../src/composables/manual-nodes/useManualNodeSearchPagination.js';

describe('manual node search and group scope', () => {
  it('keeps the active group applied while searching and selecting filtered results', () => {
    const manualNodes = ref([
      { id: 'hk-a', name: '香港 A', group: 'A' },
      { id: 'hk-b', name: '香港 B', group: 'B' },
      { id: 'jp-a', name: '日本 A', group: 'A' }
    ]);
    const result = useManualNodeSearchPagination({
      manualNodes,
      paginatedManualNodes: ref([]),
      initialSearchTerm: ref('香港'),
      activeGroupFilter: ref('A')
    });

    expect(result.filteredNodes.value.map(node => node.id)).toEqual(['hk-a']);
    expect(result.paginatedNodes.value.map(node => node.id)).toEqual(['hk-a']);
  });
});
