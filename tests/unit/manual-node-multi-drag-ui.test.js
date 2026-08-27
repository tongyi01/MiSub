import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import NodeTable from '../../src/components/nodes/ManualNodePanel/NodeTable.vue';
import { createI18n } from '../../src/i18n/index.js';

const nodes = ['a', 'b', 'c', 'd'].map(id => ({ id, name: id, url: `ss://${id}` }));

function mountTable() {
  return mount(NodeTable, {
    props: {
      manualNodes: nodes,
      paginatedNodes: nodes,
      filteredNodes: nodes,
      isSorting: false,
      isSelectionMode: true,
      selectedNodeIds: new Set(['b', 'd']),
      draggableManualNodes: nodes,
      baseTotalPages: 1,
      searchTotalPages: 1
    },
    global: {
      plugins: [createI18n({ initialLocale: 'zh-CN' })],
      stubs: {
        draggable: {
          name: 'DraggableStub',
          props: ['modelValue'],
          emits: ['update:modelValue', 'start', 'end'],
          template: '<div><slot name="item" v-for="(element, index) in modelValue" :element="element" :index="index" /></div>'
        },
        ManualNodeCard: { props: ['node'], template: '<div>{{ node.name }}</div>' },
        ManualNodeList: { props: ['node'], template: '<div>{{ node.name }}</div>' },
        PanelPagination: true,
        EmptyState: true
      }
    }
  });
}

describe('manual node multi-drag UI', () => {
  it('enables stable block dragging directly in batch selection mode', async () => {
    const wrapper = mountTable();
    const draggable = wrapper.findComponent({ name: 'DraggableStub' });

    expect(draggable.exists()).toBe(true);
    await draggable.vm.$emit('start', { item: { dataset: { nodeId: 'b' } } });
    await draggable.vm.$emit('update:modelValue', [nodes[0], nodes[2], nodes[3], nodes[1]]);

    expect(wrapper.emitted('update:draggableManualNodes')?.at(-1)?.[0].map(node => node.id))
      .toEqual(['a', 'c', 'b', 'd']);
  });
});
