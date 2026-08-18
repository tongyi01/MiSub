<script setup>
import { useI18n } from '@/i18n/index.js';

const { t } = useI18n();
const props = defineProps({
  isSelectionMode: {
    type: Boolean,
    default: false
  },
  isAllSelected: {
    type: Boolean,
    default: false
  },
  isAllFilteredSelected: {
    type: Boolean,
    default: false
  },
  selectedCount: {
    type: Number,
    default: 0
  },
  filteredCount: {
    type: Number,
    default: 0
  },
  groups: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits([
  'toggle-select-all', 'toggle-select-all-filtered', 'invert-current-page', 'clear-selection',
  'batch-group', 'batch-set-enabled', 'ping-selected', 'batch-reorder', 'batch-delete', 'exit'
]);

const handleMoveToGroup = () => {
  emit('batch-group');
};
</script>

<template>
  <Transition name="slide-fade-sm">
    <div
      v-if="isSelectionMode"
      class="fixed bottom-4 left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-5xl -translate-x-1/2 rounded-xl border border-gray-200 bg-white/95 p-3 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-gray-900/95"
    >
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex min-w-0 flex-wrap items-center gap-1.5">
          <span class="mr-1 whitespace-nowrap text-sm font-bold text-gray-800 dark:text-gray-100">{{ t('manualNodes.selectedCount', { count: selectedCount }) }}</span>
          <span v-if="selectedCount > 1" class="mr-1 text-[11px] font-medium text-gray-400">{{ t('manualNodes.multiDragHint') }}</span>
          <button type="button" class="rounded-md px-2.5 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-500/10" @click="emit('toggle-select-all')">{{ isAllSelected ? t('actions.deselectAll') : t('actions.selectAllPage') }}</button>
          <button type="button" :disabled="filteredCount === 0" class="rounded-md px-2.5 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 disabled:opacity-45 dark:text-indigo-300 dark:hover:bg-indigo-500/10" @click="emit('toggle-select-all-filtered')">{{ isAllFilteredSelected ? t('manualNodes.deselectFiltered') : t('manualNodes.selectFiltered', { count: filteredCount }) }}</button>
          <button type="button" class="rounded-md px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5" @click="emit('invert-current-page')">{{ t('manualNodes.invertPage') }}</button>
          <button type="button" :disabled="selectedCount === 0" class="rounded-md px-2.5 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-100 disabled:opacity-45 dark:text-gray-300 dark:hover:bg-white/5" @click="emit('clear-selection')">{{ t('manualNodes.clearSelection') }}</button>
        </div>

        <div class="flex min-w-0 flex-wrap items-center gap-1.5 border-t border-gray-100 pt-2 lg:border-l lg:border-t-0 lg:pl-3 lg:pt-0 dark:border-white/10">
          <button type="button" :disabled="selectedCount === 0" class="rounded-md bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-45 dark:bg-indigo-500/10 dark:text-indigo-300" @click="handleMoveToGroup">{{ t('manualNodes.moveToGroup') }}</button>
          <button type="button" :disabled="selectedCount === 0" class="rounded-md px-2.5 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 disabled:opacity-45 dark:text-emerald-400 dark:hover:bg-emerald-500/10" @click="emit('batch-set-enabled', true)">{{ t('manualNodes.enableSelected') }}</button>
          <button type="button" :disabled="selectedCount === 0" class="rounded-md px-2.5 py-1.5 text-xs font-semibold text-amber-600 hover:bg-amber-50 disabled:opacity-45 dark:text-amber-400 dark:hover:bg-amber-500/10" @click="emit('batch-set-enabled', false)">{{ t('manualNodes.disableSelected') }}</button>
          <button type="button" :disabled="selectedCount === 0" class="rounded-md px-2.5 py-1.5 text-xs font-semibold text-sky-600 hover:bg-sky-50 disabled:opacity-45 dark:text-sky-400 dark:hover:bg-sky-500/10" @click="emit('ping-selected')">{{ t('manualNodes.pingSelected') }}</button>
          <button type="button" :disabled="selectedCount === 0" class="rounded-md px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-45 dark:text-gray-300 dark:hover:bg-white/5" @click="emit('batch-reorder', 'top')">{{ t('manualNodes.moveTop') }}</button>
          <button type="button" :disabled="selectedCount === 0" class="rounded-md px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-45 dark:text-gray-300 dark:hover:bg-white/5" @click="emit('batch-reorder', 'bottom')">{{ t('manualNodes.moveBottom') }}</button>
          <button type="button" :disabled="selectedCount === 0" class="rounded-md px-2.5 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 disabled:opacity-45 dark:hover:bg-red-500/10" @click="emit('batch-delete')">{{ t('actions.delete') }}</button>
          <button type="button" class="ml-auto rounded-md px-2.5 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5" @click="emit('exit')">{{ t('actions.exit') }}</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.slide-fade-sm-enter-active,
.slide-fade-sm-leave-active {
  transition: all 0.2s ease-out;
}
.slide-fade-sm-enter-from,
.slide-fade-sm-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
</style>
