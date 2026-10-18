import { describe, expect, it } from 'vitest';
import {
  applyRange,
  createPages,
  editPages,
  mergePlan,
  move,
  moveDocument,
  movePage,
  parseRange,
  rotation,
  selectPages,
} from './ordering';
import { outputName } from '../files/naming';
import {
  checkLimits,
  friendlyError,
  signature,
  UserError,
  validateFile,
  LIMITS,
} from '../validation/pdf';
import type { PageItem, SourceDocument } from '../types';
const doc = (id: string, count = 3) =>
  ({ id, file: { size: 1024 }, pdf: { numPages: count } }) as SourceDocument;
const pages = (): PageItem[] =>
  ['a', 'b', 'c'].map((id, i) => ({
    id,
    documentId: i === 2 ? 'B' : 'A',
    sourcePageIndex: i === 2 ? 0 : i,
    rotation: 0,
    removed: false,
    selected: false,
  }));
describe('filename', () => {
  it.each([
    ['', 'merged.pdf'],
    ['.pdf', 'merged.pdf'],
    ['report.PDF.pdf', 'report.pdf'],
    ['../a<b>:c.pdf', 'a-b--c.pdf'],
    ['CON', 'merged.pdf'],
    ['résumé 日本語.pdf', 'résumé 日本語.pdf'],
    ['a\u0000b', 'a-b.pdf'],
  ])('sanitizes %s', (input, expected) =>
    expect(outputName(input)).toBe(expected),
  );
  it('bounds filename length', () =>
    expect(outputName('x'.repeat(400)).length).toBe(124));
});
describe('ranges', () => {
  it('respects listed order and deduplicates', () =>
    expect(parseRange('3,1-2,3', 3)).toEqual([2, 0, 1]));
  it('empty means all', () => expect(parseRange('', 3)).toEqual([0, 1, 2]));
  it.each([
    '0',
    '4',
    '1,,2',
    '2-1',
    '1-999999999',
    '1.5',
    'NaN',
    '-1',
    '9007199254740992',
    'a',
    '1;2',
  ])('rejects %s', (v) => expect(() => parseRange(v, 3)).toThrow());
  it('rejects huge allocation', () =>
    expect(() => parseRange('1-1000000000', 1000000000)).toThrow('1000'));
  it('applies range and keeps original page identities', () => {
    const source = pages();
    const next = applyRange(source, 'A', [1]);
    expect(next.filter((p) => !p.removed).map((p) => p.id)).toEqual(['b', 'c']);
    expect(next.find((p) => p.id === 'a')?.removed).toBe(true);
  });
});
describe('stable page state', () => {
  it('generates unique identities independent of index', () => {
    const a = createPages(doc('a'));
    const b = createPages(doc('b'));
    expect(new Set([...a, ...b].map((p) => p.id)).size).toBe(6);
    expect(a.map((p) => p.sourcePageIndex)).toEqual([0, 1, 2]);
  });
  it('rejects too many pages before allocating', () =>
    expect(() => createPages(doc('a', 1e9))).toThrow('1000'));
  it('moves without mutating', () => {
    const p = pages();
    expect(movePage(p, 'c', 0).map((p) => p.id)).toEqual(['c', 'a', 'b']);
    expect(p[0].id).toBe('a');
  });
  it('moves across removed entries', () => {
    const p = editPages(pages(), ['b'], 'remove');
    expect(
      movePage(p, 'c', 0)
        .filter((p) => !p.removed)
        .map((p) => p.id),
    ).toEqual(['c', 'a']);
  });
  it('groups documents in current page order', () => {
    const p = movePage(pages(), 'b', 0);
    const next = moveDocument(
      { documents: [doc('A'), doc('B')], pages: p },
      'B',
      0,
    );
    expect(next.pages.map((p) => p.id)).toEqual(['c', 'b', 'a']);
  });
  it('invalid move is a no-op', () =>
    expect(move([1, 2], -1, 3)).toEqual([1, 2]));
  it.each([
    [-90, 270],
    [450, 90],
    [720, 0],
    [180, 180],
  ])('normalizes %i', (input, expected) =>
    expect(rotation(input)).toBe(expected),
  );
  it('rotates without affecting originals', () => {
    const original = pages();
    expect(editPages(original, ['a'], 'left')[0].rotation).toBe(270);
    expect(original[0].rotation).toBe(0);
  });
  it('supports select, invert and deselect', () => {
    const all = selectPages(pages(), 'all');
    expect(all.every((p) => p.selected)).toBe(true);
    expect(selectPages(all, 'invert').some((p) => p.selected)).toBe(false);
    expect(selectPages(all, 'none').some((p) => p.selected)).toBe(false);
  });
  it('deletes and restores pages', () => {
    const removed = editPages(selectPages(pages(), 'all'), ['a'], 'remove');
    expect(removed[0]).toMatchObject({ removed: true, selected: false });
    expect(editPages(removed, ['a'], 'restore')[0].removed).toBe(false);
  });
  it('plan follows current page order, omits removals', () =>
    expect(
      mergePlan(editPages(movePage(pages(), 'c', 0), ['a'], 'remove')).map(
        (p) => p.id,
      ),
    ).toEqual(['c', 'b']));
  it('rejects duplicate IDs', () =>
    expect(() => mergePlan([pages()[0], pages()[0]])).toThrow('Duplicate'));
  it('rejects empty output', () =>
    expect(() => mergePlan([])).toThrow('at least one'));
  it('rejects invalid plan rotation', () =>
    expect(() => mergePlan([{ ...pages()[0], rotation: 45 }])).toThrow(
      'Invalid',
    ));
});
describe('validation', () => {
  it.each([
    [21, 0, 0],
    [0, LIMITS.total + 1, 0],
    [0, 0, 1001],
  ])('rejects caps', (...args) =>
    expect(() => checkLimits(...(args as [number, number, number]))).toThrow(),
  );
  it('accepts exact caps', () =>
    expect(() => checkLimits(20, LIMITS.total, 1000)).not.toThrow());
  it('validates signature', () => {
    expect(signature(new TextEncoder().encode('%PDF-1.7'))).toBe(true);
    expect(signature(new TextEncoder().encode('fake.pdf'))).toBe(false);
  });
  it('rejects empty file', async () =>
    await expect(validateFile(new File([], 'empty.pdf'))).rejects.toThrow(
      'empty',
    ));
  it('rejects extension', async () =>
    await expect(validateFile(new File(['x'], 'file.txt'))).rejects.toThrow(
      '.pdf',
    ));
  it('never leaks parser content', () =>
    expect(friendlyError(new Error('PRIVATE-SENTINEL'))).not.toContain(
      'PRIVATE-SENTINEL',
    ));
  it('keeps safe errors useful', () =>
    expect(friendlyError(new UserError('Choose fewer PDFs'))).toBe(
      'Choose fewer PDFs',
    ));
});
