import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, it } from 'vitest';
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
          props: ['modelValue'],
          emits: ['update:modelValue'],
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
});
