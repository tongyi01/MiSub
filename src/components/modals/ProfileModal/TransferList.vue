<script setup>
import { computed, ref, watch } from 'vue';
import draggable from 'vuedraggable';
import { useI18n } from '@/i18n/index.js';

const { t } = useI18n();
const props = defineProps({
  items: { type: Array, default: () => [] },
  filteredItems: { type: Array, default: () => [] },
  selectedIds: { type: Array, default: () => [] },
  searchTerm: { type: String, default: '' },
  searchPlaceholder: { type: String, default: '' },
  itemFallback: { type: String, default: '' },
  sourceTitle: { type: String, default: '' },
  showSelectedInSource: { type: Boolean, default: false },
  targetFilteredIds: { type: Array, default: null },
  testId: { type: String, default: 'profile-transfer' }
});
const emit = defineEmits(['update:searchTerm', 'update:selectedIds']);
const sourceChecked = ref(new Set());
const targetChecked = ref(new Set());
const entryId = entry => typeof entry === 'object' && entry !== null ? entry.id : entry;
const itemMap = computed(() => new Map(props.items.map(item => [item.id, item])));
const selectedIdSet = computed(() => new Set(props.selectedIds.map(entryId)));
const sourceItems = computed(() => props.showSelectedInSource
  ? props.filteredItems
  : props.filteredItems.filter(item => !selectedIdSet.value.has(item.id)));
const addableSourceItems = computed(() => sourceItems.value.filter(item => !selectedIdSet.value.has(item.id)));
const orderedSelectedItems = computed({
  get: () => props.selectedIds
    .map(entry => {
      const item = itemMap.value.get(entryId(entry));
      return item ? { ...item, __profileEntry: entry } : null;
    })
    .filter(Boolean),
  set: items => emit('update:selectedIds', items.map(item => item.__profileEntry))
});
const targetFilterSet = computed(() => props.targetFilteredIds ? new Set(props.targetFilteredIds) : null);
const displayedSelectedItems = computed({
  get: () => targetFilterSet.value
    ? orderedSelectedItems.value.filter(item => targetFilterSet.value.has(item.id))
    : orderedSelectedItems.value,
  set: items => {
    if (!targetFilterSet.value) {
      orderedSelectedItems.value = items;
      return;
    }
    const reordered = [...items];
    orderedSelectedItems.value = orderedSelectedItems.value.map(item => (
      targetFilterSet.value.has(item.id) ? reordered.shift() : item
    ));
  }
});

watch([sourceItems, displayedSelectedItems], () => {
  const availableIds = new Set(addableSourceItems.value.map(item => item.id));
  const selectedIds = new Set(displayedSelectedItems.value.map(item => item.id));
  sourceChecked.value = new Set([...sourceChecked.value].filter(id => availableIds.has(id)));
  targetChecked.value = new Set([...targetChecked.value].filter(id => selectedIds.has(id)));
});

function toggleChecked(target, id) {
  const next = new Set(target.value);
  if (next.has(id)) next.delete(id); else next.add(id);
  target.value = next;
}
const toggleSourceChecked = id => toggleChecked(sourceChecked, id);
const toggleTargetChecked = id => toggleChecked(targetChecked, id);
function toggleAllAvailable() {
  const ids = addableSourceItems.value.map(item => item.id);
  const allSelected = ids.length > 0 && ids.every(id => sourceChecked.value.has(id));
  sourceChecked.value = allSelected ? new Set() : new Set(ids);
}
function toggleAllSelected() {
  const ids = displayedSelectedItems.value.map(item => item.id);
  const allSelected = ids.length > 0 && ids.every(id => targetChecked.value.has(id));
  targetChecked.value = allSelected ? new Set() : new Set(ids);
}
function moveRight() {
  if (!sourceChecked.value.size) return;
  emit('update:selectedIds', [...props.selectedIds, ...addableSourceItems.value.filter(item => sourceChecked.value.has(item.id)).map(item => item.id)]);
  sourceChecked.value = new Set();
}
function moveLeft() {
  if (!targetChecked.value.size) return;
  emit('update:selectedIds', props.selectedIds.filter(entry => !targetChecked.value.has(entryId(entry))));
  targetChecked.value = new Set();
}
function clearAllSelected() {
  if (!props.selectedIds.length) return;
  if (window.confirm(t('profileModal.clearAddedConfirm', { count: props.selectedIds.length }))) {
    emit('update:selectedIds', []);
    targetChecked.value = new Set();
  }
}
</script>

<template>
  <div :data-testid="testId" class="space-y-3">
    <slot name="filters" />
    <div class="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_44px_minmax(0,1fr)] lg:items-stretch">
      <section class="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-gray-900/70">
        <header class="flex min-h-11 items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/80 px-3 dark:border-white/10 dark:bg-white/[0.03]">
          <label class="flex min-w-0 items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
            <input type="checkbox" :checked="addableSourceItems.length > 0 && addableSourceItems.every(item => sourceChecked.has(item.id))" :disabled="addableSourceItems.length === 0" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-55" @change="toggleAllAvailable">
            <span class="truncate">{{ sourceTitle }}</span>
          </label>
          <span class="shrink-0 text-xs tabular-nums text-gray-500 dark:text-gray-400">{{ sourceChecked.size }}/{{ sourceItems.length }}</span>
        </header>
        <slot name="source-filters" />
        <div class="border-b border-gray-100 p-3 dark:border-white/10">
          <div class="relative">
            <svg class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <input :value="searchTerm" type="search" :placeholder="searchPlaceholder" class="min-h-10 w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 outline-2 outline-transparent transition focus:border-indigo-500 focus:outline-indigo-500/30 dark:border-white/10 dark:bg-white/[0.04] dark:text-white" @input="emit('update:searchTerm', $event.target.value)">
          </div>
        </div>
        <div class="h-72 overflow-y-auto p-2">
          <label v-for="item in sourceItems" :key="item.id" class="flex min-h-10 items-center gap-3 rounded-lg px-2.5 py-2 transition-colors" :class="selectedIdSet.has(item.id) ? 'bg-indigo-50/60 dark:bg-indigo-500/10' : 'cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-500/10'">
            <input type="checkbox" :checked="selectedIdSet.has(item.id) || sourceChecked.has(item.id)" :disabled="selectedIdSet.has(item.id)" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-70" @change="toggleSourceChecked(item.id)">
            <span class="min-w-0 flex-1 truncate text-sm text-gray-800 dark:text-gray-200" :title="item.name">{{ item.name || itemFallback }}</span>
            <span v-if="selectedIdSet.has(item.id)" class="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">{{ t('profileModal.alreadyAdded') }}</span>
          </label>
          <div v-if="sourceItems.length === 0" class="flex h-full min-h-48 items-center justify-center px-5 text-center text-sm text-gray-400">{{ t('profileModal.noAvailableToAdd') }}</div>
        </div>
      </section>

      <div class="flex items-center justify-center gap-2 lg:flex-col">
        <button type="button" :disabled="sourceChecked.size === 0" class="flex h-10 min-w-10 items-center justify-center rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-55 lg:w-10 lg:px-0" :title="t('profileModal.addSelected')" @click="moveRight"><span class="lg:hidden">{{ t('profileModal.addSelected') }}</span><span class="hidden lg:inline">›</span></button>
        <button type="button" :disabled="targetChecked.size === 0" class="flex h-10 min-w-10 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-55 dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-200 dark:hover:bg-white/[0.08] lg:w-10 lg:px-0" :title="t('profileModal.removeSelected')" @click="moveLeft"><span class="lg:hidden">{{ t('profileModal.removeSelected') }}</span><span class="hidden lg:inline">‹</span></button>
      </div>

      <section class="min-w-0 overflow-hidden rounded-xl border border-indigo-200 bg-white dark:border-indigo-500/30 dark:bg-gray-900/70">
        <header class="flex min-h-11 items-center justify-between gap-3 border-b border-indigo-100 bg-indigo-50/70 px-3 dark:border-indigo-500/20 dark:bg-indigo-500/10">
          <label class="flex min-w-0 items-center gap-2 text-sm font-semibold text-indigo-800 dark:text-indigo-200">
            <input type="checkbox" :checked="displayedSelectedItems.length > 0 && displayedSelectedItems.every(item => targetChecked.has(item.id))" :disabled="displayedSelectedItems.length === 0" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-55" @change="toggleAllSelected">
            <span class="truncate">{{ t('profileModal.selectedItems') }}</span>
          </label>
          <span class="shrink-0 text-xs tabular-nums text-indigo-600 dark:text-indigo-300">{{ targetChecked.size }}/{{ displayedSelectedItems.length }} · {{ orderedSelectedItems.length }}</span>
        </header>
        <div class="space-y-2 border-b border-indigo-100 p-2.5 dark:border-indigo-500/20">
          <slot name="target-filters" />
          <div class="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <button type="button" :disabled="displayedSelectedItems.length === 0" class="rounded-md px-2.5 py-1.5 text-indigo-600 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-45 dark:text-indigo-300 dark:hover:bg-indigo-500/10" @click="targetChecked = new Set(displayedSelectedItems.map(item => item.id))">{{ t('profileModal.selectAllAdded') }}</button>
            <button type="button" :disabled="targetChecked.size === 0" class="rounded-md px-2.5 py-1.5 text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-45 dark:text-gray-300 dark:hover:bg-white/5" @click="targetChecked = new Set()">{{ t('profileModal.clearSelection') }}</button>
            <button type="button" :disabled="orderedSelectedItems.length === 0" class="ml-auto rounded-md px-2.5 py-1.5 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-45 dark:hover:bg-red-500/10" @click="clearAllSelected">{{ t('profileModal.clearAllAdded') }}</button>
          </div>
        </div>
        <draggable v-model="displayedSelectedItems" item-key="id" handle=".drag-handle" ghost-class="opacity-40" class="h-72 space-y-1 overflow-y-auto p-2">
          <template #item="{ element, index }">
            <div class="group flex min-h-10 items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 transition-colors hover:border-indigo-100 hover:bg-indigo-50/70 dark:hover:border-indigo-500/20 dark:hover:bg-indigo-500/10">
              <input type="checkbox" :checked="targetChecked.has(element.id)" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" @change="toggleTargetChecked(element.id)">
              <button type="button" class="drag-handle cursor-grab text-gray-400 active:cursor-grabbing" :aria-label="t('profileModal.dragToSort')"><svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 7h8M8 12h8M8 17h8" /></svg></button>
              <span class="w-6 shrink-0 text-right text-xs font-semibold tabular-nums text-indigo-500">{{ index + 1 }}</span>
              <span class="min-w-0 flex-1 truncate text-sm text-gray-800 dark:text-gray-200" :title="element.name">{{ element.name || itemFallback }}</span>
              <button type="button" class="rounded p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10" :title="t('profileModal.remove')" @click="emit('update:selectedIds', selectedIds.filter(entry => entryId(entry) !== element.id))"><svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
            </div>
          </template>
          <template #footer><div v-if="displayedSelectedItems.length === 0" class="flex min-h-64 items-center justify-center px-5 text-center text-sm text-gray-400">{{ orderedSelectedItems.length ? t('profileModal.selectedGroupEmpty') : t('profileModal.selectedEmpty') }}</div></template>
        </draggable>
      </section>
    </div>
  </div>
</template>
