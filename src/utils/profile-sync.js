import { normalizeManualNodeGroupName } from '../composables/manual-nodes/groups.js';

export const DEFAULT_PROFILE_SYNC_SETTINGS = Object.freeze({
  mode: 'manual',
  strategy: 'incremental',
  subscriptions: {
    enabled: true,
    includeNew: false
  },
  manualNodes: {
    enabled: true,
    includeNew: true,
    groups: [],
    groupOrder: []
  }
});

export function getProfileEntryId(entry) {
  return typeof entry === 'object' && entry !== null ? entry.id : entry;
}

export function normalizeProfileSyncSettings(settings = {}) {
  const subscriptionSettings = settings.subscriptions || {};
  const manualNodeSettings = settings.manualNodes || {};

  return {
    mode: settings.mode === 'continuous' ? 'continuous' : 'manual',
    strategy: settings.strategy === 'exact' ? 'exact' : 'incremental',
    subscriptions: {
      enabled: subscriptionSettings.enabled !== false,
      includeNew: subscriptionSettings.includeNew === true
    },
    manualNodes: {
      enabled: manualNodeSettings.enabled !== false,
      includeNew: manualNodeSettings.includeNew !== false,
      groups: Array.from(new Set(
        (manualNodeSettings.groups || [])
          .filter(group => typeof group === 'string')
          .map(group => group === '__ungrouped__' ? group : normalizeManualNodeGroupName(group))
          .filter(Boolean)
      )),
      groupOrder: Array.from(new Set(
        (manualNodeSettings.groupOrder || [])
          .filter(group => typeof group === 'string')
          .map(group => group === '__ungrouped__' ? group : normalizeManualNodeGroupName(group))
          .filter(Boolean)
      ))
    }
  };
}

function uniqueEntries(entries = []) {
  const seen = new Set();
  return entries.filter((entry) => {
    const id = getProfileEntryId(entry);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function syncOrderedEntries(currentEntries, sourceItems, { includeNew, strategy }) {
  const current = uniqueEntries(currentEntries);
  const currentById = new Map(current.map(entry => [getProfileEntryId(entry), entry]));
  const sourceIds = sourceItems.map(item => item.id).filter(Boolean);
  const sourceIdSet = new Set(sourceIds);

  const ordered = sourceIds
    .filter(id => currentById.has(id) || includeNew)
    .map(id => currentById.get(id) ?? id);

  if (strategy === 'incremental') {
    current.forEach((entry) => {
      if (!sourceIdSet.has(getProfileEntryId(entry))) ordered.push(entry);
    });
  }

  return uniqueEntries(ordered);
}

function selectManualNodeSource(manualNodes, groups) {
  if (!groups.length) return manualNodes;
  const selectedGroups = new Set(groups);
  return manualNodes.filter((node) => {
    const group = normalizeManualNodeGroupName(node.group);
    return selectedGroups.has(group || '__ungrouped__');
  });
}

function sortManualNodesByGroupOrder(manualNodes, groupOrder) {
  if (!groupOrder.length) return manualNodes;

  const rankByGroup = new Map(groupOrder.map((group, index) => [group, index]));
  return manualNodes
    .map((node, index) => ({ node, index }))
    .sort((left, right) => {
      const leftGroup = normalizeManualNodeGroupName(left.node.group) || '__ungrouped__';
      const rightGroup = normalizeManualNodeGroupName(right.node.group) || '__ungrouped__';
      const leftRank = rankByGroup.get(leftGroup) ?? Number.MAX_SAFE_INTEGER;
      const rightRank = rankByGroup.get(rightGroup) ?? Number.MAX_SAFE_INTEGER;
      return leftRank - rightRank || left.index - right.index;
    })
    .map(entry => entry.node);
}

function buildManualNodeSyncSource(manualNodes, currentEntries, settings) {
  const orderedNodes = sortManualNodesByGroupOrder(manualNodes, settings.groupOrder);
  const scopedNodes = selectManualNodeSource(orderedNodes, settings.groups);

  if (settings.strategy === 'exact' || !settings.groups.length) return scopedNodes;

  const currentIds = new Set(uniqueEntries(currentEntries).map(getProfileEntryId));
  const scopedIds = new Set(scopedNodes.map(node => node.id));
  return orderedNodes.filter(node => currentIds.has(node.id) || scopedIds.has(node.id));
}

function buildDiff(before, after) {
  const beforeIds = uniqueEntries(before).map(getProfileEntryId);
  const afterIds = uniqueEntries(after).map(getProfileEntryId);
  const beforeSet = new Set(beforeIds);
  const afterSet = new Set(afterIds);

  return {
    added: afterIds.filter(id => !beforeSet.has(id)).length,
    removed: beforeIds.filter(id => !afterSet.has(id)).length,
    reordered: beforeIds.length === afterIds.length && beforeIds.some((id, index) => afterIds[index] !== id),
    changed: beforeIds.length !== afterIds.length || beforeIds.some((id, index) => afterIds[index] !== id)
  };
}

export function applyProfileSync(profile, sources, rawSettings) {
  const settings = normalizeProfileSyncSettings(rawSettings);
  const subscriptions = (sources.subscriptions || []).filter(item => item?.id);
  const manualNodes = buildManualNodeSyncSource(
    (sources.manualNodes || []).filter(item => item?.id),
    profile.manualNodes || [],
    {
      ...settings.manualNodes,
      strategy: settings.strategy
    }
  );
  const nextProfile = { ...profile };

  if (settings.subscriptions.enabled) {
    nextProfile.subscriptions = syncOrderedEntries(
      profile.subscriptions || [],
      subscriptions,
      {
        includeNew: settings.subscriptions.includeNew,
        strategy: settings.strategy
      }
    );
  }

  if (settings.manualNodes.enabled) {
    nextProfile.manualNodes = syncOrderedEntries(
      profile.manualNodes || [],
      manualNodes,
      {
        includeNew: settings.manualNodes.includeNew,
        strategy: settings.strategy
      }
    );
  }

  const subscriptionDiff = buildDiff(profile.subscriptions || [], nextProfile.subscriptions || []);
  const manualNodeDiff = buildDiff(profile.manualNodes || [], nextProfile.manualNodes || []);

  return {
    profile: nextProfile,
    diff: {
      subscriptions: subscriptionDiff,
      manualNodes: manualNodeDiff,
      changed: subscriptionDiff.changed || manualNodeDiff.changed
    }
  };
}

export function applyContinuousProfileSync(profiles, sources) {
  let changed = false;
  const nextProfiles = (profiles || []).map((profile) => {
    const settings = normalizeProfileSyncSettings(profile.syncSettings);
    if (settings.mode !== 'continuous') return profile;

    const result = applyProfileSync(profile, sources, settings);
    if (!result.diff.changed) return profile;
    changed = true;
    return result.profile;
  });

  return { profiles: changed ? nextProfiles : profiles, changed };
}

export function previewProfileSync(profiles, targetIds, sources, settings) {
  const targets = new Set(targetIds || []);
  return (profiles || [])
    .filter(profile => targets.has(profile.id))
    .map((profile) => {
      const result = applyProfileSync(profile, sources, settings);
      return {
        profileId: profile.id,
        profileName: profile.name,
        ...result.diff
      };
    });
}
