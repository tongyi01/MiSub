function stableSort(items, compare) {
  return [...(items || [])]
    .map((item, index) => ({ item, index }))
    .sort((a, b) => compare(a.item, b.item) || a.index - b.index)
    .map(({ item }) => item);
}

const compareNames = (a, b) => String(a?.name || '').localeCompare(
  String(b?.name || ''),
  'zh-CN',
  { numeric: true, sensitivity: 'base' }
);

export function sortCollection(items, mode = 'name') {
  if (mode === 'enabled-first') {
    return stableSort(items, (a, b) => Number(Boolean(b?.enabled)) - Number(Boolean(a?.enabled)));
  }

  return stableSort(items, compareNames);
}
