import type { PageItem, Session, SourceDocument } from '../types';
import { checkLimits, UserError } from '../validation/pdf';
export const rotation = (angle: number) => ((angle % 360) + 360) % 360;
export function createPages(doc: SourceDocument): PageItem[] {
  checkLimits(1, doc.file.size, doc.pdf.numPages);
  return Array.from({ length: doc.pdf.numPages }, (_, i) => ({
    id: crypto.randomUUID(),
    documentId: doc.id,
    sourcePageIndex: i,
    rotation: 0,
    selected: false,
    removed: false,
  }));
}
export function move<T>(items: T[], from: number, to: number): T[] {
  if (
    from < 0 ||
    from >= items.length ||
    to < 0 ||
    to >= items.length ||
    from === to
  )
    return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
export function movePage(pages: PageItem[], id: string, target: number) {
  const visible = pages.filter((p) => !p.removed);
  const next = move(
    visible,
    visible.findIndex((p) => p.id === id),
    target,
  );
  let index = 0;
  return pages.map((p) => (p.removed ? p : next[index++]));
}
export function moveDocument(
  session: Session,
  id: string,
  target: number,
): Session {
  const documents = move(
    session.documents,
    session.documents.findIndex((d) => d.id === id),
    target,
  );
  return {
    documents,
    pages: documents.flatMap((d) =>
      session.pages.filter((p) => p.documentId === d.id),
    ),
  };
}
export function selectPages(
  pages: PageItem[],
  mode: 'all' | 'none' | 'invert',
) {
  return pages.map((p) => ({
    ...p,
    selected: p.removed
      ? false
      : mode === 'all'
        ? true
        : mode === 'none'
          ? false
          : !p.selected,
  }));
}
export function editPages(
  pages: PageItem[],
  ids: string[],
  action: 'remove' | 'left' | 'right' | 'restore',
) {
  const set = new Set(ids);
  return pages.map((p) =>
    set.has(p.id)
      ? {
          ...p,
          removed:
            action === 'remove'
              ? true
              : action === 'restore'
                ? false
                : p.removed,
          selected: action === 'remove' ? false : p.selected,
          rotation: rotation(
            p.rotation +
              (action === 'left' ? -90 : action === 'right' ? 90 : 0),
          ),
        }
      : p,
  );
}
export function parseRange(text: string, total: number): number[] {
  if (!text.trim())
    return Array.from({ length: Math.min(total, 1000) }, (_, i) => i);
  const pages = new Set<number>();
  for (const raw of text.split(',')) {
    const match = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(raw.trim());
    if (!match) throw new UserError('Use page ranges such as 1-3,5.');
    const start = Number(match[1]),
      end = Number(match[2] ?? match[1]);
    if (
      !Number.isSafeInteger(start) ||
      !Number.isSafeInteger(end) ||
      start < 1 ||
      end < start ||
      end > total
    )
      throw new UserError(`Pages must be between 1 and ${total}.`);
    if (end - start + 1 > 1000)
      throw new UserError('Choose at most 1000 pages.');
    for (let i = start; i <= end; i++) {
      pages.add(i - 1);
      if (pages.size > 1000) throw new UserError('Choose at most 1000 pages.');
    }
  }
  return [...pages];
}
export function applyRange(pages: PageItem[], docId: string, range: number[]) {
  const own = pages.filter((p) => p.documentId === docId);
  const byIndex = new Map(own.map((p) => [p.sourcePageIndex, p]));
  const included = range.map((i) => {
    const p = byIndex.get(i);
    if (!p) throw new UserError('Page range is unavailable.');
    return { ...p, removed: false };
  });
  const excluded = own
    .filter((p) => !range.includes(p.sourcePageIndex))
    .map((p) => ({ ...p, removed: true, selected: false }));
  const first = pages.findIndex((p) => p.documentId === docId);
  const other = pages.filter((p) => p.documentId !== docId);
  other.splice(
    first < 0 ? other.length : Math.min(first, other.length),
    0,
    ...included,
    ...excluded,
  );
  return other;
}
export function mergePlan(pages: PageItem[]) {
  const plan = pages.filter((p) => !p.removed);
  checkLimits(0, 0, plan.length);
  if (!plan.length) throw new UserError('Keep at least one page to merge.');
  if (new Set(pages.map((p) => p.id)).size !== pages.length)
    throw new UserError('Duplicate page identity. Reset the session.');
  for (const p of plan)
    if (
      !Number.isInteger(p.sourcePageIndex) ||
      p.sourcePageIndex < 0 ||
      ![0, 90, 180, 270].includes(p.rotation)
    )
      throw new UserError('Invalid page plan.');
  return plan.map(({ id, documentId, sourcePageIndex, rotation }) => ({
    id,
    documentId,
    sourcePageIndex,
    rotation,
  }));
}
