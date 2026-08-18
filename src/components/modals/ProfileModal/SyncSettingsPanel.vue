<script setup>
import { computed } from 'vue';
import { useI18n } from '@/i18n/index.js';

const { t } = useI18n();
const props = defineProps({
  modelValue: { type: Object, required: true },
  groups: { type: Array, default: () => [] }
});
const emit = defineEmits(['update:modelValue']);

const settings = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
});

function update(path, value) {
  const next = JSON.parse(JSON.stringify(settings.value));
  let target = next;
  for (let index = 0; index < path.length - 1; index += 1) target = target[path[index]];
  target[path[path.length - 1]] = value;
  settings.value = next;
}

function toggleNodeGroup(group) {
  const current = new Set(settings.value.manualNodes.groups || []);
  if (current.has(group)) current.delete(group); else current.add(group);
  update(['manualNodes', 'groups'], [...current]);
}
</script>

<template>
  <div class="space-y-5" data-testid="profile-sync-settings">
    <div class="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 dark:border-indigo-500/25 dark:bg-indigo-500/10">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 class="font-semibold text-gray-900 dark:text-white">{{ t('profileSync.followModeTitle') }}</h4>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">{{ t('profileSync.followModeDesc') }}</p>
        </div>
        <div class="inline-flex shrink-0 rounded-lg border border-indigo-200 bg-white p-1 dark:border-indigo-500/30 dark:bg-gray-900/70">
          <button type="button" class="min-h-9 whitespace-nowrap rounded-md px-3 text-sm font-semibold transition" :class="settings.mode === 'manual' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5'" @click="update(['mode'], 'manual')">{{ t('profileSync.onceMode') }}</button>
          <button type="button" class="min-h-9 whitespace-nowrap rounded-md px-3 text-sm font-semibold transition" :class="settings.mode === 'continuous' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5'" @click="update(['mode'], 'continuous')">{{ t('profileSync.continuousMode') }}</button>
        </div>
      </div>
    </div>

    <div :class="settings.mode !== 'continuous' ? 'pointer-events-none opacity-55' : ''" class="space-y-4">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <section class="rounded-xl border border-gray-200 p-4 dark:border-white/10">
          <label class="flex items-start gap-3">
            <input type="checkbox" :checked="settings.subscriptions.enabled" class="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" @change="update(['subscriptions', 'enabled'], $event.target.checked)">
            <span><strong class="block text-sm text-gray-900 dark:text-white">{{ t('profileSync.syncSubscriptions') }}</strong><span class="mt-1 block text-xs leading-relaxed text-gray-500 dark:text-gray-400">{{ t('profileSync.syncSubscriptionsDesc') }}</span></span>
          </label>
          <label class="mt-4 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" :checked="settings.subscriptions.includeNew" :disabled="!settings.subscriptions.enabled" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-55" @change="update(['subscriptions', 'includeNew'], $event.target.checked)">
            {{ t('profileSync.includeNewSubscriptions') }}
          </label>
        </section>

        <section class="rounded-xl border border-gray-200 p-4 dark:border-white/10">
          <label class="flex items-start gap-3">
            <input type="checkbox" :checked="settings.manualNodes.enabled" class="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" @change="update(['manualNodes', 'enabled'], $event.target.checked)">
            <span><strong class="block text-sm text-gray-900 dark:text-white">{{ t('profileSync.syncManualNodes') }}</strong><span class="mt-1 block text-xs leading-relaxed text-gray-500 dark:text-gray-400">{{ t('profileSync.syncManualNodesDesc') }}</span></span>
          </label>
          <label class="mt-4 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" :checked="settings.manualNodes.includeNew" :disabled="!settings.manualNodes.enabled" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-55" @change="update(['manualNodes', 'includeNew'], $event.target.checked)">
            {{ t('profileSync.includeNewNodes') }}
          </label>
        </section>
      </div>

      <section class="rounded-xl border border-gray-200 p-4 dark:border-white/10">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div><h4 class="text-sm font-semibold text-gray-900 dark:text-white">{{ t('profileSync.nodeGroupScope') }}</h4><p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ t('profileSync.nodeGroupScopeDesc') }}</p></div>
          <button type="button" class="min-h-9 whitespace-nowrap text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400" @click="update(['manualNodes', 'groups'], [])">{{ t('profileSync.allNodeGroups') }}</button>
        </div>
        <div class="mt-3 flex flex-wrap gap-2">
          <button type="button" class="rounded-full border px-3 py-1.5 text-xs font-semibold transition" :class="settings.manualNodes.groups.includes('__ungrouped__') ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300' : 'border-gray-200 text-gray-600 dark:border-white/10 dark:text-gray-300'" @click="toggleNodeGroup('__ungrouped__')">{{ t('manualNodes.ungrouped') }}</button>
          <button v-for="group in groups" :key="group" type="button" class="rounded-full border px-3 py-1.5 text-xs font-semibold transition" :class="settings.manualNodes.groups.includes(group) ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300' : 'border-gray-200 text-gray-600 dark:border-white/10 dark:text-gray-300'" @click="toggleNodeGroup(group)">{{ group }}</button>
        </div>
        <p v-if="settings.manualNodes.groups.length === 0" class="mt-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">{{ t('profileSync.allGroupsSelectedHint') }}</p>
      </section>

      <label class="flex items-center justify-between gap-4 rounded-xl border border-gray-200 p-4 dark:border-white/10">
        <span><strong class="block text-sm text-gray-900 dark:text-white">{{ t('profileSync.strategyTitle') }}</strong><span class="mt-1 block text-xs text-gray-500 dark:text-gray-400">{{ settings.strategy === 'incremental' ? t('profileSync.incrementalDesc') : t('profileSync.exactDesc') }}</span></span>
        <select :value="settings.strategy" class="min-h-10 shrink-0 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-800 focus:border-indigo-500 focus:outline-2 focus:outline-indigo-500/30 dark:border-white/10 dark:bg-gray-800 dark:text-white" @change="update(['strategy'], $event.target.value)">
          <option value="incremental">{{ t('profileSync.incremental') }}</option>
          <option value="exact">{{ t('profileSync.exact') }}</option>
        </select>
      </label>
    </div>
  </div>
</template>
