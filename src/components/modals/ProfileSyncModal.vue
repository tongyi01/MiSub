<script setup>
import { computed, ref, watch } from 'vue';
import Modal from '../forms/Modal.vue';
import { useI18n } from '@/i18n/index.js';
import { previewProfileSync } from '../../utils/profile-sync.js';

const { t } = useI18n();
const props = defineProps({
  show: Boolean,
  profiles: { type: Array, default: () => [] },
  subscriptions: { type: Array, default: () => [] },
  manualNodes: { type: Array, default: () => [] },
  groups: { type: Array, default: () => [] },
  initialTargetIds: { type: Array, default: () => [] }
});
const emit = defineEmits(['update:show', 'apply']);

const step = ref('configure');
const targetIds = ref([]);
const profileSearch = ref('');
const syncMode = ref('once');
const settings = ref(createDefaultSettings());

function createDefaultSettings() {
  return {
    strategy: 'incremental',
    subscriptions: { enabled: true, includeNew: false },
    manualNodes: { enabled: true, includeNew: true, groups: [] }
  };
}

watch(() => props.show, (show) => {
  if (!show) return;
  step.value = 'configure';
  profileSearch.value = '';
  syncMode.value = 'once';
  settings.value = createDefaultSettings();
  targetIds.value = props.initialTargetIds.filter(id => props.profiles.some(profile => profile.id === id));
});

const filteredProfiles = computed(() => {
  const query = profileSearch.value.trim().toLowerCase();
  if (!query) return props.profiles;
  return props.profiles.filter(profile => [profile.name, profile.customId, profile.description].some(value => String(value || '').toLowerCase().includes(query)));
});
const sources = computed(() => ({ subscriptions: props.subscriptions, manualNodes: props.manualNodes }));
const preview = computed(() => previewProfileSync(props.profiles, targetIds.value, sources.value, settings.value));
const hasContent = computed(() => settings.value.subscriptions.enabled || settings.value.manualNodes.enabled);
const canPreview = computed(() => targetIds.value.length > 0 && hasContent.value);

function toggleTarget(id) {
  const next = new Set(targetIds.value);
  if (next.has(id)) next.delete(id); else next.add(id);
  targetIds.value = [...next];
}
function toggleAllTargets() {
  targetIds.value = targetIds.value.length === props.profiles.length ? [] : props.profiles.map(profile => profile.id);
}
function toggleNodeGroup(group) {
  const next = new Set(settings.value.manualNodes.groups);
  if (next.has(group)) next.delete(group); else next.add(group);
  settings.value.manualNodes.groups = [...next];
}
function applySync() {
  emit('apply', {
    targetIds: targetIds.value,
    mode: syncMode.value,
    settings: JSON.parse(JSON.stringify(settings.value))
  });
  emit('update:show', false);
}
</script>

<template>
  <Modal :show="show" size="5xl" :close-on-confirm="false" @update:show="emit('update:show', $event)">
    <template #title>
      <div>
        <div class="flex items-center gap-2"><span class="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">⇄</span><h3 class="text-lg font-bold text-gray-900 dark:text-white">{{ t('profileSync.modalTitle') }}</h3></div>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">{{ t('profileSync.modalDesc') }}</p>
      </div>
    </template>

    <template #body>
      <div v-if="step === 'configure'" class="space-y-5">
        <section class="space-y-3">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><h4 class="text-sm font-semibold text-gray-900 dark:text-white">1. {{ t('profileSync.selectTargets') }}</h4><p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ t('profileSync.selectTargetsDesc') }}</p></div>
            <button type="button" class="min-h-9 whitespace-nowrap rounded-lg border border-gray-200 px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5" @click="toggleAllTargets">{{ targetIds.length === profiles.length ? t('profileSync.clearTargets') : t('profileSync.selectAllProfiles') }}</button>
          </div>
          <input v-model="profileSearch" type="search" :placeholder="t('profileSync.searchProfiles')" class="min-h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-2 outline-transparent focus:border-indigo-500 focus:outline-indigo-500/30 dark:border-white/10 dark:bg-white/[0.04] dark:text-white">
          <div class="grid max-h-44 grid-cols-1 gap-2 overflow-y-auto rounded-xl border border-gray-200 p-2 dark:border-white/10 sm:grid-cols-2 lg:grid-cols-3">
            <label v-for="profile in filteredProfiles" :key="profile.id" class="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-indigo-50 dark:hover:bg-indigo-500/10">
              <input type="checkbox" :checked="targetIds.includes(profile.id)" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" @change="toggleTarget(profile.id)">
              <span class="min-w-0"><strong class="block truncate text-sm text-gray-800 dark:text-gray-200">{{ profile.name }}</strong><span class="block truncate text-xs text-gray-400">{{ profile.subscriptions?.length || 0 }} + {{ profile.manualNodes?.length || 0 }}</span></span>
            </label>
          </div>
        </section>

        <section class="space-y-3 border-t border-gray-100 pt-5 dark:border-white/10">
          <h4 class="text-sm font-semibold text-gray-900 dark:text-white">2. {{ t('profileSync.syncModeTitle') }}</h4>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label class="cursor-pointer rounded-xl border p-4 transition" :class="syncMode === 'once' ? 'border-indigo-300 bg-indigo-50/70 dark:border-indigo-500/40 dark:bg-indigo-500/10' : 'border-gray-200 dark:border-white/10'">
              <div class="flex items-start gap-3"><input v-model="syncMode" type="radio" value="once" class="mt-1 h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"><span><strong class="block text-sm text-gray-900 dark:text-white">{{ t('profileSync.onceMode') }}</strong><span class="mt-1 block text-xs text-gray-500 dark:text-gray-400">{{ t('profileSync.onceModeDesc') }}</span></span></div>
            </label>
            <label class="cursor-pointer rounded-xl border p-4 transition" :class="syncMode === 'continuous' ? 'border-indigo-300 bg-indigo-50/70 dark:border-indigo-500/40 dark:bg-indigo-500/10' : 'border-gray-200 dark:border-white/10'">
              <div class="flex items-start gap-3"><input v-model="syncMode" type="radio" value="continuous" class="mt-1 h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"><span><strong class="block text-sm text-gray-900 dark:text-white">{{ t('profileSync.continuousMode') }}</strong><span class="mt-1 block text-xs text-gray-500 dark:text-gray-400">{{ t('profileSync.continuousModeDesc') }}</span></span></div>
            </label>
          </div>
        </section>

        <section class="space-y-4 border-t border-gray-100 pt-5 dark:border-white/10">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><h4 class="text-sm font-semibold text-gray-900 dark:text-white">3. {{ t('profileSync.syncContent') }}</h4><select v-model="settings.strategy" class="min-h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-800 focus:border-indigo-500 focus:outline-2 focus:outline-indigo-500/30 dark:border-white/10 dark:bg-gray-800 dark:text-white"><option value="incremental">{{ t('profileSync.incremental') }}</option><option value="exact">{{ t('profileSync.exact') }}</option></select></div>
          <div v-if="settings.strategy === 'exact'" class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">{{ t('profileSync.exactWarning') }}</div>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div class="rounded-xl border border-gray-200 p-4 dark:border-white/10">
              <label class="flex items-center gap-2 font-semibold text-gray-900 dark:text-white"><input v-model="settings.subscriptions.enabled" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500">{{ t('profileSync.syncSubscriptions') }}</label>
              <label class="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"><input v-model="settings.subscriptions.includeNew" type="checkbox" :disabled="!settings.subscriptions.enabled" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-55">{{ t('profileSync.includeNewSubscriptions') }}</label>
            </div>
            <div class="rounded-xl border border-gray-200 p-4 dark:border-white/10">
              <label class="flex items-center gap-2 font-semibold text-gray-900 dark:text-white"><input v-model="settings.manualNodes.enabled" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500">{{ t('profileSync.syncManualNodes') }}</label>
              <label class="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"><input v-model="settings.manualNodes.includeNew" type="checkbox" :disabled="!settings.manualNodes.enabled" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-55">{{ t('profileSync.includeNewNodes') }}</label>
            </div>
          </div>
          <div v-if="settings.manualNodes.enabled" class="rounded-xl border border-gray-200 p-4 dark:border-white/10">
            <div class="flex items-center justify-between gap-3"><div><h5 class="text-sm font-semibold text-gray-900 dark:text-white">{{ t('profileSync.nodeGroupScope') }}</h5><p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ t('profileSync.nodeGroupScopeDesc') }}</p></div><button type="button" class="min-h-9 whitespace-nowrap text-sm font-semibold text-indigo-600 dark:text-indigo-400" @click="settings.manualNodes.groups = []">{{ t('profileSync.allNodeGroups') }}</button></div>
            <div class="mt-3 flex flex-wrap gap-2"><button type="button" class="rounded-full border px-3 py-1.5 text-xs font-semibold" :class="settings.manualNodes.groups.includes('__ungrouped__') ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300' : 'border-gray-200 text-gray-600 dark:border-white/10 dark:text-gray-300'" @click="toggleNodeGroup('__ungrouped__')">{{ t('manualNodes.ungrouped') }}</button><button v-for="group in groups" :key="group" type="button" class="rounded-full border px-3 py-1.5 text-xs font-semibold" :class="settings.manualNodes.groups.includes(group) ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300' : 'border-gray-200 text-gray-600 dark:border-white/10 dark:text-gray-300'" @click="toggleNodeGroup(group)">{{ group }}</button></div>
          </div>
        </section>
      </div>

      <div v-else class="space-y-4">
        <div class="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 dark:border-indigo-500/25 dark:bg-indigo-500/10"><h4 class="font-semibold text-gray-900 dark:text-white">{{ t('profileSync.previewTitle') }}</h4><p class="mt-1 text-sm text-gray-600 dark:text-gray-300">{{ t('profileSync.previewDesc', { count: preview.length }) }}</p></div>
        <div class="space-y-2">
          <div v-for="item in preview" :key="item.profileId" class="rounded-xl border border-gray-200 p-4 dark:border-white/10">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><strong class="text-gray-900 dark:text-white">{{ item.profileName }}</strong><span class="text-xs font-semibold" :class="item.changed ? 'text-indigo-600 dark:text-indigo-300' : 'text-gray-400'">{{ item.changed ? t('profileSync.willChange') : t('profileSync.noChange') }}</span></div>
            <div class="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2"><div class="rounded-lg bg-gray-50 px-3 py-2 text-gray-600 dark:bg-white/[0.04] dark:text-gray-300">{{ t('profileSync.subscriptionsChange', { added: item.subscriptions.added, removed: item.subscriptions.removed, reordered: item.subscriptions.reordered ? 1 : 0 }) }}</div><div class="rounded-lg bg-gray-50 px-3 py-2 text-gray-600 dark:bg-white/[0.04] dark:text-gray-300">{{ t('profileSync.nodesChange', { added: item.manualNodes.added, removed: item.manualNodes.removed, reordered: item.manualNodes.reordered ? 1 : 0 }) }}</div></div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <button type="button" class="min-h-10 rounded-lg bg-gray-200 px-4 text-sm font-semibold text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600" @click="step === 'preview' ? step = 'configure' : emit('update:show', false)">{{ step === 'preview' ? t('actions.back') : t('actions.cancel') }}</button>
      <button v-if="step === 'configure'" type="button" :disabled="!canPreview" class="min-h-10 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-55" @click="step = 'preview'">{{ t('profileSync.previewAction') }}</button>
      <button v-else type="button" class="min-h-10 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700" @click="applySync">{{ syncMode === 'continuous' ? t('profileSync.enableAndSync') : t('profileSync.confirmSync') }}</button>
    </template>
  </Modal>
</template>
