<script setup>
import TransferList from './TransferList.vue';
import { useI18n } from '@/i18n/index.js';

const { t } = useI18n();
defineProps({
  nodes: { type: Array, default: () => [] },
  filteredNodes: { type: Array, default: () => [] },
  searchTerm: { type: String, default: '' },
  activeGroupFilter: { type: String, default: null },
  groups: { type: Array, default: () => [] },
  selectedIds: { type: Array, default: () => [] }
});
const emit = defineEmits(['update:searchTerm', 'update:groupFilter', 'update:selectedIds']);
</script>

<template>
  <TransferList
    :items="nodes"
    :filtered-items="filteredNodes"
    :selected-ids="selectedIds"
    :search-term="searchTerm"
    :search-placeholder="t('manualNodes.searchPlaceholder')"
    :item-fallback="t('manualNodes.unnamed')"
    :source-title="t('profileModal.availableNodes')"
    test-id="manual-node-transfer"
    @update:search-term="emit('update:searchTerm', $event)"
    @update:selected-ids="emit('update:selectedIds', $event)"
  >
    <template #filters>
      <div class="flex min-w-0 items-center gap-2 overflow-x-auto pb-1">
        <button type="button" class="shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition" :class="!activeGroupFilter ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300' : 'border-gray-200 bg-white text-gray-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-300'" @click="emit('update:groupFilter', null)">{{ t('manualNodes.allGroups') }}</button>
        <button type="button" class="shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition" :class="activeGroupFilter === t('manualNodes.defaultGroup') ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300' : 'border-gray-200 bg-white text-gray-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-300'" @click="emit('update:groupFilter', t('manualNodes.defaultGroup'))">{{ t('manualNodes.ungrouped') }}</button>
        <button v-for="group in groups" :key="group" type="button" class="shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition" :class="activeGroupFilter === group ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300' : 'border-gray-200 bg-white text-gray-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-300'" @click="emit('update:groupFilter', group)">{{ group }}</button>
      </div>
    </template>
  </TransferList>
</template>
