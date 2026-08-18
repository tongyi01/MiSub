import { describe, expect, it } from 'vitest';
import { moveSelectedAsBlock, moveSelectedToBoundary } from '../../src/utils/manual-node-bulk-order.js';

const nodes = ['a', 'b', 'c', 'd', 'e'].map(id => ({ id }));
const ids = items => items.map(item => item.id);

describe('manual node bulk ordering', () => {
  it('moves non-contiguous selected nodes as one stable block', () => {
    const rawDragResult = [nodes[0], nodes[2], nodes[3], nodes[4], nodes[1]];
    const result = moveSelectedAsBlock(nodes, rawDragResult, new Set(['b', 'd']), 'b');

    expect(ids(result)).toEqual(['a', 'c', 'e', 'b', 'd']);
  });

  it('keeps normal single-item dragging when the dragged node is not selected', () => {
    const rawDragResult = [nodes[1], nodes[0], nodes[2], nodes[3], nodes[4]];
    const result = moveSelectedAsBlock(nodes, rawDragResult, new Set(['c', 'd']), 'b');

    expect(ids(result)).toEqual(['b', 'a', 'c', 'd', 'e']);
  });

  it('ignores selected ids that are hidden from the active draggable list', () => {
    const visible = nodes.slice(0, 3);
    const rawDragResult = [nodes[0], nodes[2], nodes[1]];
    const result = moveSelectedAsBlock(visible, rawDragResult, new Set(['b', 'hidden']), 'b');

    expect(ids(result)).toEqual(['a', 'c', 'b']);
  });

  it('moves selected nodes to top or bottom without changing their internal order', () => {
    expect(ids(moveSelectedToBoundary(nodes, ['b', 'd'], 'top'))).toEqual(['b', 'd', 'a', 'c', 'e']);
    expect(ids(moveSelectedToBoundary(nodes, ['b', 'd'], 'bottom'))).toEqual(['a', 'c', 'e', 'b', 'd']);
  });
});
