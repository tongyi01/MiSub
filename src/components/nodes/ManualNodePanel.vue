<script setup>
import { ref, computed, nextTick } from 'vue';
import BulkOperations from './ManualNodePanel/BulkOperations.vue';
import NodeActions from './ManualNodePanel/NodeActions.vue';
import NodeTable from './ManualNodePanel/NodeTable.vue';
import { useManualNodeSearchPagination } from '@/composables/manual-nodes/useManualNodeSearchPagination.js';
import { normalizeManualNodeGroupName } from '@/composables/manual-nodes/groups.js';
import { moveSelectedToBoundary } from '@/utils/manual-node-bulk-order.js';

const props = defineProps({
  manualNodes: { type: Array, default: () => [] },
  paginatedManualNodes: Array,
  currentPage: Number,
  totalPages: Number,
  isSorting: Boolean,
  searchTerm: String,
  viewMode: String,
  groups: { type: Array, default: () => [] },
  activeGroupFilter: { type: String, default: null }, // New
  itemsPerPage: { type: Number, default: 24 }, // Added
  pingResults: { type: Object, default: () => ({}) },
  pingingNodes: { type: Object, default: () => new Set() },
  compactGrid: { type: Boolean, default: false }
});

const emit = defineEmits([
  'add', 'delete', 'edit', 'changePage', 'update:searchTerm', 'update:viewMode',
  'toggleSort', 'markDirty', 'autoSort', 'deduplicate', 'import', 'deleteAll', 'reorder',
  'rename-group', 'delete-group',
  'update:itemsPerPage', // Added
  'open-batch-group-modal', // Added
  'batch-delete-nodes',
  'batch-set-enabled',
  'ping-selected',
  'ping',
  'ping-all',
  'manage-groups'
]);

const isSelectionMode = ref(false);
const selectedNodeIds = ref(new Set());

const {
  localSearchTerm,
  filteredNodes,
  paginatedNodes,
  currentSearchPage,
  totalSearchPages,
  handlePageChange
} = useManualNodeSearchPagination({
  manualNodes: computed(() => props.manualNodes),
  paginatedManualNodes: computed(() => props.paginatedManualNodes || []),
  initialSearchTerm: computed(() => props.searchTerm || ''),
  activeGroupFilter: computed(() => props.activeGroupFilter),
  onBasePageChange: (page) => emit('changePage', page),
  onSearchTermChange: (value) => emit('update:searchTerm', value)
});

const toggleSelectionMode = () => {
    isSelectionMode.value = !isSelectionMode.value;
    selectedNodeIds.value.clear();
};

const toggleNodeSelection = (nodeId) => {
    if (selectedNodeIds.value.has(nodeId)) {
        selectedNodeIds.value.delete(nodeId);
    } else {
        selectedNodeIds.value.add(nodeId);
    }
};

const isAllSelected = computed(() => {
    if (paginatedNodes.value.length === 0) return false;
    return paginatedNodes.value.every(node => selectedNodeIds.value.has(node.id));
});

const selectedCount = computed(() => selectedNodeIds.value.size);
const isAllFilteredSelected = computed(() => {
  if (sortableManualNodes.value.length === 0) return false;
  return sortableManualNodes.value.every(node => selectedNodeIds.value.has(node.id));
});

const toggleSelectAll = () => {
    if (isAllSelected.value) {
        // Deselect all on current page
        paginatedNodes.value.forEach(node => selectedNodeIds.value.delete(node.id));
    } else {
        // Select all on current page
        paginatedNodes.value.forEach(node => selectedNodeIds.value.add(node.id));
    }
};

const toggleSelectAllFiltered = () => {
  if (isAllFilteredSelected.value) {
    sortableManualNodes.value.forEach(node => selectedNodeIds.value.delete(node.id));
  } else {
    sortableManualNodes.value.forEach(node => selectedNodeIds.value.add(node.id));
  }
};

const invertCurrentPage = () => {
  paginatedNodes.value.forEach(node => toggleNodeSelection(node.id));
};

const clearSelection = () => {
  selectedNodeIds.value.clear();
};

const handleBatchGroup = () => {
    emit('open-batch-group-modal', Array.from(selectedNodeIds.value));
    // Do not clear selection yet, wait for action to complete?
    // Or clear it now? If user cancels modal, selection is lost.
    // Better to keep selection until action confirms.
    // But if we clear here, we can't re-select easily.
    // Let's NOT clear here. The parent can handle it or we clear on success?
    // Actually, usually we clear after the operation is DONE.
    // Since operation is async/handled by parent, we might need a way to clear selection.
    // For now, let's keep selection.
};

const handleBatchDelete = () => {
    emit('batch-delete-nodes', Array.from(selectedNodeIds.value));
    selectedNodeIds.value.clear();
    isSelectionMode.value = false;
};

const handleBatchSetEnabled = (enabled) => {
  emit('batch-set-enabled', Array.from(selectedNodeIds.value), enabled);
};

const handlePingSelected = () => {
  emit('ping-selected', Array.from(selectedNodeIds.value));
};

const handleBatchReorder = (position) => {
  emit('reorder', moveSelectedToBoundary(props.manualNodes, selectedNodeIds.value, position));
};

const sortableManualNodes = computed(() => {
  const activeGroup = props.activeGroupFilter;
  let nodes = filteredNodes.value;

  if (activeGroup) {
    const normalizedActiveGroup = activeGroup === '默认' ? '' : normalizeManualNodeGroupName(activeGroup);
    nodes = nodes.filter((node) => normalizeManualNodeGroupName(node.group) === normalizedActiveGroup);
  }

  return nodes;
});

const draggableManualNodes = computed({
  get: () => (props.isSorting ? [...sortableManualNodes.value] : [...props.manualNodes]),
  set: (val) => emit('reorder', val)
});

const handleDelete = (id) => emit('delete', id);
const handleEdit = (id) => emit('edit', id);
const handleAdd = () => emit('add');
const handleChangePage = (page) => handlePageChange(page);
const handleSetViewMode = (mode) => emit('update:viewMode', mode);
const handleSearchTermUpdate = (value) => {
  localSearchTerm.value = value || '';
};
const handleToggleSort = () => {
  emit('toggleSort');

  // 使用 nextTick 等待状态更新完成后重置分页
  nextTick(() => {
    // 如果已经退出排序模式且没有搜索，重置到第一页
    if (!props.isSorting && !props.searchTerm) {
      emit('changePage', 1);
    }
  });
};
const handleSortEnd = () => {
  emit('markDirty');
  // 手动排序完成后重置到第一页
  if (!props.searchTerm) {
    emit('changePage', 1);
  }
};
const handleAutoSort = (mode) => {
  emit('autoSort', mode);
};
const handleDeduplicate = () => {
  emit('deduplicate');
};
const handleImport = () => {
  emit('import');
};
const handleDeleteAll = () => {
  emit('deleteAll');
};
</script>

<template>
  <div>
    <NodeActions
      :manual-nodes-count="manualNodes.length"
      :filtered-nodes-count="filteredNodes.length"
      :search-term="localSearchTerm"
      :active-group-filter="activeGroupFilter"
      :manual-node-groups="groups"
      :view-mode="viewMode"
      :is-sorting="isSorting"
      :is-selection-mode="isSelectionMode"
      @update:search-term="handleSearchTermUpdate"
      @update:view-mode="handleSetViewMode"
      @set-group-filter="emit('set-group-filter', $event)"
      @add="handleAdd"
      @import="handleImport"
      @auto-sort="handleAutoSort"
      @deduplicate="handleDeduplicate"
      @toggle-sort="handleToggleSort"
      @delete-all="handleDeleteAll"
      @toggle-selection-mode="toggleSelectionMode"
      @ping-all="emit('ping-all')"
      @manage-groups="emit('manage-groups')"
    />

    <BulkOperations
      :is-selection-mode="isSelectionMode"
      :is-all-selected="isAllSelected"
      :is-all-filtered-selected="isAllFilteredSelected"
      :selected-count="selectedCount"
      :filtered-count="sortableManualNodes.length"
      :groups="groups"
      @toggle-select-all="toggleSelectAll"
      @toggle-select-all-filtered="toggleSelectAllFiltered"
      @invert-current-page="invertCurrentPage"
      @clear-selection="clearSelection"
      @batch-group="handleBatchGroup"
      @batch-set-enabled="handleBatchSetEnabled"
      @ping-selected="handlePingSelected"
      @batch-reorder="handleBatchReorder"
      @batch-delete="handleBatchDelete"
      @exit="() => { selectedNodeIds.clear(); isSelectionMode = false; }"
    />

    <NodeTable
      v-model:draggable-manual-nodes="draggableManualNodes"
      :manual-nodes="manualNodes"
      :paginated-nodes="paginatedNodes"
      :filtered-nodes="filteredNodes"
      :local-search-term="localSearchTerm"
      :is-sorting="isSorting"
      :view-mode="viewMode"
      :is-selection-mode="isSelectionMode"
      :selected-node-ids="selectedNodeIds"
      :search-page="currentSearchPage"
      :search-total-pages="totalSearchPages"
      :base-page="props.currentPage"
      :base-total-pages="props.totalPages"
      :items-per-page="itemsPerPage"
      @update:items-per-page="emit('update:itemsPerPage', $event)"
      @toggle-select="toggleNodeSelection"
      @edit="handleEdit"
      @delete="handleDelete"
      @sort-end="handleSortEnd"
      @change-page="handleChangePage"
      @set-group-filter="emit('set-group-filter', $event)"
      :ping-results="pingResults"
      :pinging-nodes="pingingNodes"
      :compact-grid="compactGrid"
      @ping="emit('ping', $event)"
    />
  </div>
</template>
