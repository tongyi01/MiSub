<script setup>
import { computed } from 'vue';
import TransferList from './TransferList.vue';
import { useI18n } from '@/i18n/index.js';

const { t } = useI18n();
const props = defineProps({
  subscriptions: { type: Array, default: () => [] },
  filteredSubscriptions: { type: Array, default: () => [] },
  searchTerm: { type: String, default: '' },
  selectedIds: { type: Array, default: () => [] }
});
const emit = defineEmits(['update:searchTerm', 'update:selectedIds']);
const validSubscriptions = computed(() => props.subscriptions);
</script>

<template>
  <TransferList
    :items="validSubscriptions"
    :filtered-items="filteredSubscriptions"
    :selected-ids="selectedIds"
    :search-term="searchTerm"
    :search-placeholder="t('subscriptions.searchPlaceholder')"
    :item-fallback="t('subscriptions.unnamed')"
    :source-title="t('profileModal.availableSubscriptions')"
    :show-selected-in-source="true"
    test-id="subscription-transfer"
    @update:search-term="emit('update:searchTerm', $event)"
    @update:selected-ids="emit('update:selectedIds', $event)"
  />
</template>
