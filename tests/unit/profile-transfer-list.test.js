import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, it, vi } from 'vitest';
import TransferList from '../../src/components/modals/ProfileModal/TransferList.vue';
import { createI18n } from '../../src/i18n/index.js';

function mountTransfer(props = {}) {
  return mount(TransferList, {
    props: {
      items: [{ id: 's1', name: 'Source 1' }, { id: 's2', name: 'Source 2' }],
      filteredItems: [{ id: 's1', name: 'Source 1' }, { id: 's2', name: 'Source 2' }],
      selectedIds: [],
      sourceTitle: 'Available',
      ...props
    },
    global: {
      plugins: [createPinia(), createI18n({ initialLocale: 'zh-CN' })],
      stubs: {
        draggable: {
          name: 'DraggableStub',
          props: ['modelValue'],
          emits: ['update:modelValue', 'start', 'end'],
          template: '<div><slot name="item" v-for="(element, index) in modelValue" :element="element" :index="index" /><slot name="footer" /></div>'
        }
      }
    }
  });
}

describe('profile transfer list', () => {
  it('moves checked source items into the selected list', async () => {
    const wrapper = mountTransfer();
    const checkboxes = wrapper.findAll('input[type="checkbox"]');
    await checkboxes[1].setValue(true);
    await wrapper.get('button[title="加入已选"]').trigger('click');

    expect(wrapper.emitted('update:selectedIds')?.at(-1)?.[0]).toEqual(['s1']);
  });

  it('preserves subscription override objects when selected items are removed', async () => {
    const entry = { id: 's1', exclude: 'HK' };
    const wrapper = mountTransfer({ selectedIds: [entry] });
    const targetCheckbox = wrapper.findAll('input[type="checkbox"]').at(-1);
    await targetCheckbox.setValue(true);
    await wrapper.get('button[title="移出已选"]').trigger('click');

    expect(wrapper.emitted('update:selectedIds')?.at(-1)?.[0]).toEqual([]);
  });

  it('keeps included items visible and marks them as included in the source list', () => {
    const wrapper = mountTransfer({ selectedIds: ['s1'], showSelectedInSource: true });

    expect(wrapper.text()).toContain('Source 1');
    expect(wrapper.text()).toContain('已加入');
    expect(wrapper.findAll('input[type="checkbox"]')[1].attributes('disabled')).toBeDefined();
  });

  it('reorders only the visible target group while preserving hidden items', async () => {
    const wrapper = mountTransfer({
      selectedIds: ['s1', 's2'],
      targetFilteredIds: ['s1', 's2']
    });
    const draggable = wrapper.findComponent({ name: 'DraggableStub' });
    const visible = draggable.props('modelValue');
    await draggable.vm.$emit('update:modelValue', [...visible].reverse());

    expect(wrapper.emitted('update:selectedIds')?.at(-1)?.[0]).toEqual(['s2', 's1']);
  });

  it('moves multiple checked target items as one stable block', async () => {
    const items = [
      { id: 's1', name: 'Source 1' },
      { id: 's2', name: 'Source 2' },
      { id: 's3', name: 'Source 3' }
    ];
    const wrapper = mountTransfer({
      items,
      filteredItems: items,
      selectedIds: ['s1', 's2', 's3']
    });

    await wrapper.get('[data-entry-id="s1"] input[type="checkbox"]').setValue(true);
    await wrapper.get('[data-entry-id="s3"] input[type="checkbox"]').setValue(true);
    const draggable = wrapper.findComponent({ name: 'DraggableStub' });
    const visible = draggable.props('modelValue');
    await draggable.vm.$emit('start', { item: { dataset: { entryId: 's1' } } });
    await draggable.vm.$emit('update:modelValue', [visible[1], visible[2], visible[0]]);
    await draggable.vm.$emit('end');

    expect(wrapper.emitted('update:selectedIds')?.at(-1)?.[0]).toEqual(['s2', 's1', 's3']);
  });

  it('clears all included items only after confirmation', async () => {
    const confirm = vi.fn(() => true);
    Object.defineProperty(window, 'confirm', { value: confirm, configurable: true });
    const wrapper = mountTransfer({ selectedIds: ['s1', 's2'] });
    const clearButton = wrapper.findAll('button').find(button => button.text() === '清空已加入');
    await clearButton.trigger('click');

    expect(confirm).toHaveBeenCalledOnce();
    expect(wrapper.emitted('update:selectedIds')?.at(-1)?.[0]).toEqual([]);
    delete window.confirm;
  });
});
