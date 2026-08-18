const itemId = item => typeof item === 'object' && item !== null ? item.id : item;

export function moveSelectedAsBlock(originalItems, reorderedItems, selectedIds, draggedId) {
  const original = [...(originalItems || [])];
  const reordered = [...(reorderedItems || [])];
  const selected = new Set(selectedIds || []);
  const visibleIds = new Set(reordered.map(itemId));
  const selectedBlock = original.filter(item => selected.has(itemId(item)) && visibleIds.has(itemId(item)));

  if (!selected.has(draggedId) || selectedBlock.length < 2) return reordered;

  const draggedIndex = reordered.findIndex(item => itemId(item) === draggedId);
  if (draggedIndex < 0) return reordered;

  const insertionIndex = reordered
    .slice(0, draggedIndex)
    .filter(item => !selected.has(itemId(item)))
    .length;
  const remaining = reordered.filter(item => !selected.has(itemId(item)));
  remaining.splice(insertionIndex, 0, ...selectedBlock);
  return remaining;
}

export function moveSelectedToBoundary(items, selectedIds, position) {
  const source = [...(items || [])];
  const selected = new Set(selectedIds || []);
  const block = source.filter(item => selected.has(itemId(item)));
  const remaining = source.filter(item => !selected.has(itemId(item)));
  return position === 'bottom' ? [...remaining, ...block] : [...block, ...remaining];
}
