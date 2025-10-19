import { describe, it, expect } from 'vitest';
import mergeStaticDesigns from '../staticMerge';

describe('mergeStaticDesigns', () => {
  it('returns server when server has items', () => {
    const server = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }];
    const local = [{ id: 'c', name: 'C' }];
    const out = mergeStaticDesigns(server, local);
    expect(out.map(x => x.id)).toEqual(['a','b','c']);
  });

  it('prefers local when server empty', () => {
    const server = [];
    const local = [{ id: 'l1', name: 'L1' }];
    const out = mergeStaticDesigns(server, local);
    expect(out.map(x => x.id)).toEqual(['l1']);
  });

  it('returns local when server is null', () => {
    const server = null;
    const local = [{ id: 'only', name: 'Only' }];
    const out = mergeStaticDesigns(server, local);
    expect(out.map(x => x.id)).toEqual(['only']);
  });

  it('dedupes by id preferring server', () => {
    const server = [{ id: 'x', name: 'ServerX' }];
    const local = [{ id: 'x', name: 'LocalX' }, { id: 'y', name: 'Y' }];
    const out = mergeStaticDesigns(server, local);
    expect(out.find(i => i.id === 'x').name).toBe('ServerX');
    expect(out.map(i => i.id)).toEqual(['x','y']);
  });
});
