import { normalizeManualNodeGroupName } from './groups.js';

const REGION_KEYWORDS = {
  HK: [/香港/, /HK/, /Hong Kong/i],
  TW: [/台湾/, /TW/, /Taiwan/i],
  SG: [/新加坡/, /SG/, /狮城/, /Singapore/i],
  JP: [/日本/, /JP/, /Japan/i],
  US: [/美国/, /US/, /United States/i],
  KR: [/韩国/, /KR/, /Korea/i],
  GB: [/英国/, /GB/, /UK/, /United Kingdom/i],
  DE: [/德国/, /DE/, /Germany/i],
  FR: [/法国/, /FR/, /France/i],
  CA: [/加拿大/, /CA/, /Canada/i],
  AU: [/澳大利亚/, /AU/, /Australia/i]
};

const REGION_ORDER = ['HK', 'TW', 'SG', 'JP', 'US', 'KR', 'GB', 'DE', 'FR', 'CA', 'AU'];

const compareNames = (a, b) => String(a?.name || '').localeCompare(
  String(b?.name || ''),
  'zh-CN',
  { numeric: true, sensitivity: 'base' }
);

function stableSort(items, compare) {
  return [...items]
    .map((item, index) => ({ item, index }))
    .sort((a, b) => compare(a.item, b.item) || a.index - b.index)
    .map(({ item }) => item);
}

function getRegionRank(name) {
  for (const [code, keywords] of Object.entries(REGION_KEYWORDS)) {
    if (keywords.some(keyword => keyword.test(String(name || '')))) {
      return REGION_ORDER.indexOf(code);
    }
  }
  return Number.POSITIVE_INFINITY;
}

function buildGroupRanks(nodes, groupOrder) {
  const ranks = new Map();
  const normalizedOrder = Array.from(new Set(
    (groupOrder || []).map(normalizeManualNodeGroupName).filter(Boolean)
  ));

  normalizedOrder.forEach((group, index) => ranks.set(group, index));

  nodes.forEach((node) => {
    const group = normalizeManualNodeGroupName(node.group);
    if (group && !ranks.has(group)) {
      ranks.set(group, ranks.size);
    }
  });

  return ranks;
}

export function sortManualNodes(nodes, { mode = 'region', groupOrder = [] } = {}) {
  const source = Array.isArray(nodes) ? nodes : [];

  if (mode === 'group-order') {
    const groupRanks = buildGroupRanks(source, groupOrder);
    return stableSort(source, (a, b) => {
      const groupA = normalizeManualNodeGroupName(a.group);
      const groupB = normalizeManualNodeGroupName(b.group);
      const rankA = groupA ? (groupRanks.get(groupA) ?? groupRanks.size) : Number.POSITIVE_INFINITY;
      const rankB = groupB ? (groupRanks.get(groupB) ?? groupRanks.size) : Number.POSITIVE_INFINITY;
      return rankA - rankB;
    });
  }

  if (mode === 'name') {
    return stableSort(source, compareNames);
  }

  return stableSort(source, (a, b) => {
    const regionDiff = getRegionRank(a.name) - getRegionRank(b.name);
    return Number.isNaN(regionDiff) ? compareNames(a, b) : (regionDiff || compareNames(a, b));
  });
}

export function buildAutoSortedSubscriptions(allSubscriptions, manualNodes, options = {}) {
  const subs = (allSubscriptions || []).filter(s => s.url && /^https?:\/\//.test(s.url));
  const nodes = sortManualNodes(manualNodes, options);
  return [...nodes, ...subs];
}
