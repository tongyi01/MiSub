<script setup>
import { computed, ref } from 'vue';
import TransferList from './TransferList.vue';
import { useI18n } from '@/i18n/index.js';
import { normalizeManualNodeGroupName } from '../../../composables/manual-nodes/groups.js';

const { t } = useI18n();
const props = defineProps({
  nodes: { type: Array, default: () => [] },
  filteredNodes: { type: Array, default: () => [] },
  searchTerm: { type: String, default: '' },
  activeGroupFilter: { type: String, default: null },
  groups: { type: Array, default: () => [] },
  selectedIds: { type: Array, default: () => [] }
});
const emit = defineEmits(['update:searchTerm', 'update:groupFilter', 'update:selectedIds']);
const sourceMode = ref('all');
const targetGroup = ref(null);
const entryId = entry => typeof entry === 'object' && entry !== null ? entry.id : entry;
const selectedSet = computed(() => new Set(props.selectedIds.map(entryId)));
const nodeMap = computed(() => new Map(props.nodes.map(node => [node.id, node])));
const sourceNodes = computed(() => {
  if (sourceMode.value === 'selected') return props.filteredNodes.filter(node => selectedSet.value.has(node.id));
  if (sourceMode.value === 'unselected') return props.filteredNodes.filter(node => !selectedSet.value.has(node.id));
  return props.filteredNodes;
});
const selectedNodes = computed(() => props.selectedIds
  .map(entry => nodeMap.value.get(entryId(entry)))
  .filter(Boolean));
const targetFilteredIds = computed(() => {
  if (!targetGroup.value) return null;
  return selectedNodes.value
    .filter(node => {
      const group = normalizeManualNodeGroupName(node.group);
      return targetGroup.value === '__ungrouped__' ? !group : group === targetGroup.value;
    })
    .map(node => node.id);
});
const targetGroupCounts = computed(() => {
  const counts = new Map();
  selectedNodes.value.forEach(node => {
    const group = normalizeManualNodeGroupName(node.group) || '__ungrouped__';
    counts.set(group, (counts.get(group) || 0) + 1);
  });
  return counts;
});

function sortSelectedByGroupOrder() {
  const ranks = new Map(props.groups.map((group, index) => [normalizeManualNodeGroupName(group), index]));
  const fallbackRank = ranks.size;
  const ordered = props.selectedIds
    .map((entry, index) => ({ entry, index, node: nodeMap.value.get(entryId(entry)) }))
    .sort((a, b) => {
      const groupA = normalizeManualNodeGroupName(a.node?.group);
      const groupB = normalizeManualNodeGroupName(b.node?.group);
      const rankA = groupA ? (ranks.get(groupA) ?? fallbackRank) : Number.POSITIVE_INFINITY;
      const rankB = groupB ? (ranks.get(groupB) ?? fallbackRank) : Number.POSITIVE_INFINITY;
      return rankA - rankB || a.index - b.index;
    })
    .map(item => item.entry);
  emit('update:selectedIds', ordered);
}
</script>

<template>
  <TransferList
    :items="nodes"
    :filtered-items="sourceNodes"
    :selected-ids="selectedIds"
    :search-term="searchTerm"
    :search-placeholder="t('manualNodes.searchPlaceholder')"
    :item-fallback="t('manualNodes.unnamed')"
    :source-title="t('profileModal.availableNodes')"
    :show-selected-in-source="true"
    :target-filtered-ids="targetFilteredIds"
    test-id="manual-node-transfer"
    @update:search-term="emit('update:searchTerm', $event)"
    @update:selected-ids="emit('update:selectedIds', $event)"
  >
    <template #filters>
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex min-w-0 items-center gap-2 overflow-x-auto pb-1">
        <button type="button" class="shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition" :class="!activeGroupFilter ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300' : 'border-gray-200 bg-white text-gray-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-300'" @click="emit('update:groupFilter', null)">{{ t('manualNodes.allGroups') }}</button>
        <button type="button" class="shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition" :class="activeGroupFilter === t('manualNodes.defaultGroup') ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300' : 'border-gray-200 bg-white text-gray-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-300'" @click="emit('update:groupFilter', t('manualNodes.defaultGroup'))">{{ t('manualNodes.ungrouped') }}</button>
        <button v-for="group in groups" :key="group" type="button" class="shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition" :class="activeGroupFilter === group ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300' : 'border-gray-200 bg-white text-gray-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-300'" @click="emit('update:groupFilter', group)">{{ group }}</button>
        </div>
        <div class="inline-flex shrink-0 rounded-lg border border-gray-200 bg-white p-1 dark:border-white/10 dark:bg-white/[0.04]">
          <button v-for="mode in [{ id: 'all', key: 'profileModal.showAll' }, { id: 'unselected', key: 'profileModal.showNotAdded' }, { id: 'selected', key: 'profileModal.showAdded' }]" :key="mode.id" type="button" class="min-h-8 rounded-md px-2.5 text-xs font-semibold" :class="sourceMode === mode.id ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5'" @click="sourceMode = mode.id">{{ t(mode.key) }}</button>
        </div>
      </div>
    </template>
    <template #target-filters>
      <div class="flex items-center gap-2 overflow-x-auto pb-1">
        <button type="button" class="shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold" :class="!targetGroup ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300' : 'border-gray-200 text-gray-500 dark:border-white/10 dark:text-gray-300'" @click="targetGroup = null">{{ t('manualNodes.allGroups') }} {{ selectedIds.length }}</button>
        <button type="button" class="shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold" :class="targetGroup === '__ungrouped__' ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300' : 'border-gray-200 text-gray-500 dark:border-white/10 dark:text-gray-300'" @click="targetGroup = '__ungrouped__'">{{ t('manualNodes.ungrouped') }} {{ targetGroupCounts.get('__ungrouped__') || 0 }}</button>
        <button v-for="group in groups" :key="group" type="button" class="shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold" :class="targetGroup === group ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300' : 'border-gray-200 text-gray-500 dark:border-white/10 dark:text-gray-300'" @click="targetGroup = group">{{ group }} {{ targetGroupCounts.get(group) || 0 }}</button>
        <button type="button" class="ml-auto shrink-0 rounded-md px-2.5 py-1 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-500/10" @click="sortSelectedByGroupOrder">{{ t('profileModal.sortByGroupOrder') }}</button>
      </div>
    </template>
  </TransferList>
</template>
