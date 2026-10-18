import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import App from '../App';
import { UserError } from '../lib/validation/pdf';
const mocks = vi.hoisted(() => ({
  destroy: vi.fn(),
  merge: vi.fn(),
  validate: vi.fn(),
}));
vi.mock('../lib/pdf/load', () => ({
  loadPdf: async (file: File) => {
    if (file.name === 'bad.pdf') throw new UserError('Invalid PDF signature.');
    if (file.name === 'encrypted.pdf')
      throw new UserError('Password-protected PDFs are not supported.');
    return {
      id: crypto.randomUUID(),
      file,
      pdf: { numPages: 2 },
      previewCache: new Map(),
    };
  },
  disposeDocument: mocks.destroy,
  validateOutput: mocks.validate,
}));
vi.mock('../lib/pdf/run', () => ({ runMerge: mocks.merge }));
vi.mock('./PageThumbnail', () => ({
  PageThumbnail: () => <div>Local preview</div>,
}));
beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    value: () => ({ matches: false }),
    configurable: true,
  });
  Object.defineProperty(URL, 'createObjectURL', {
    value: vi.fn(() => 'blob:local-test'),
    configurable: true,
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    value: vi.fn(),
    configurable: true,
  });
  mocks.merge.mockReset();
  mocks.merge.mockResolvedValue(new Uint8Array([37, 80, 68, 70, 45]));
});
async function load(names = ['a.pdf', 'b.pdf']) {
  const user = userEvent.setup();
  await user.upload(
    screen.getByLabelText('PDF file picker'),
    names.map((n) => new File(['%PDF-1.7'], n, { type: 'application/pdf' })),
  );
  await screen.findByRole('heading', { name: /Your PDFs/ });
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: /Merge \d+ pages?/ }),
    ).toBeEnabled(),
  );
  return user;
}
it('renders empty state, privacy copy and disabled merge', () => {
  render(<App />);
  expect(
    screen.getByRole('button', { name: 'Choose PDF files' }),
  ).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Merge PDFs' })).toBeDisabled();
  expect(screen.getByText('Bring your PDFs together.')).toBeVisible();
});
it('loads multiple PDFs and permits document reorder', async () => {
  render(<App />);
  const user = await load();
  await user.click(screen.getByRole('button', { name: 'Move b.pdf up' }));
  expect(
    Array.from(document.querySelectorAll('[data-document]')).map((e) =>
      e.getAttribute('data-document'),
    ),
  ).toEqual(['b.pdf', 'a.pdf']);
});
it('removes a document and releases resources', async () => {
  render(<App />);
  const user = await load();
  await user.click(screen.getByRole('button', { name: 'Remove a.pdf' }));
  expect(document.querySelectorAll('[data-document]')).toHaveLength(1);
  expect(mocks.destroy).toHaveBeenCalled();
});
it('clears all files', async () => {
  render(<App />);
  const user = await load();
  await user.click(screen.getByRole('button', { name: 'Clear all files' }));
  expect(screen.getByText('Bring your PDFs together.')).toBeVisible();
});
it('expands pages and reorders them with buttons', async () => {
  render(<App />);
  const user = await load();
  await user.click(screen.getAllByRole('button', { name: 'Edit pages' })[0]);
  await user.click(
    screen.getByRole('button', { name: 'Move b.pdf page 2 to beginning' }),
  );
  expect(document.querySelector('[data-page-label]')).toHaveAttribute(
    'data-page-label',
    'b.pdf page 2',
  );
});
it('rotates, removes, undoes and restores pages', async () => {
  render(<App />);
  const user = await load();
  await user.click(screen.getByRole('button', { name: 'Page View' }));
  await user.click(
    screen.getByRole('button', { name: 'Rotate a.pdf page 1 right' }),
  );
  expect(screen.getByText('Page 1 · +90°')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Remove a.pdf page 1' }));
  expect(document.querySelectorAll('[data-page-label]')).toHaveLength(3);
  await user.click(screen.getByRole('button', { name: 'Undo' }));
  expect(document.querySelectorAll('[data-page-label]')).toHaveLength(4);
  await user.click(screen.getByRole('button', { name: 'Remove a.pdf page 1' }));
  await user.click(
    screen.getByRole('button', { name: 'Restore removed pages' }),
  );
  expect(document.querySelectorAll('[data-page-label]')).toHaveLength(4);
});
it('selects pages and rotates/removes a group', async () => {
  render(<App />);
  const user = await load();
  await user.click(screen.getByRole('button', { name: 'Page View' }));
  await user.click(screen.getByRole('button', { name: 'Select all' }));
  expect(screen.getByText('4 selected')).toBeVisible();
  await user.click(
    screen.getByRole('button', { name: 'Rotate selected right' }),
  );
  expect(screen.getAllByText(/\+90°/)).toHaveLength(4);
  await user.click(
    screen.getByRole('button', { name: 'Delete selected pages' }),
  );
  expect(screen.getByText(/All pages removed/)).toBeVisible();
  await user.click(
    screen.getByRole('button', { name: 'Restore removed pages' }),
  );
  expect(document.querySelectorAll('[data-page-label]')).toHaveLength(4);
});
it('applies page ranges and reports invalid ranges', async () => {
  render(<App />);
  const user = await load(['a.pdf']);
  await user.click(screen.getByText('Choose page range'));
  const input = screen.getByLabelText('Pages from a.pdf');
  await user.type(input, '9');
  await user.click(screen.getByRole('button', { name: 'Apply range' }));
  expect(screen.getByRole('alert')).toHaveTextContent('between 1 and 2');
  await user.clear(input);
  await user.type(input, '2');
  await user.click(screen.getByRole('button', { name: 'Apply range' }));
  expect(screen.getByRole('button', { name: 'Merge 1 page' })).toBeEnabled();
});
it('shows encrypted input as unsupported without a misleading password dialog', async () => {
  render(<App />);
  const user = userEvent.setup();
  await user.upload(
    screen.getByLabelText('PDF file picker'),
    new File(['pdf'], 'encrypted.pdf', { type: 'application/pdf' }),
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Password-protected',
  );
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
it('keeps valid files in a mixed invalid batch', async () => {
  render(<App />);
  await load(['bad.pdf', 'a.pdf']);
  expect(screen.getByRole('alert')).toHaveTextContent('bad.pdf');
  expect(document.querySelectorAll('[data-document]')).toHaveLength(1);
});
it('merges current order, sanitizes output name and provides downloads', async () => {
  render(<App />);
  const user = await load();
  await user.click(screen.getByRole('button', { name: 'Move b.pdf up' }));
  await user.clear(screen.getByLabelText('Output filename'));
  await user.type(screen.getByLabelText('Output filename'), 'final.pdf.pdf');
  await user.click(screen.getByRole('button', { name: 'Merge 4 pages' }));
  const result = await screen.findByRole('region', {
    name: 'Merged PDF result',
  });
  expect(
    within(result).getByRole('link', { name: 'Download PDF' }),
  ).toHaveAttribute('download', 'final.pdf');
  expect(mocks.merge.mock.calls[0][1]).toHaveLength(4);
  expect(mocks.validate).toHaveBeenCalled();
});
it('reports merge failure instead of success', async () => {
  mocks.merge.mockRejectedValue(new Error('PRIVATE DATA'));
  render(<App />);
  const user = await load();
  await user.click(screen.getByRole('button', { name: 'Merge 4 pages' }));
  expect(await screen.findByRole('alert')).not.toHaveTextContent(
    'PRIVATE DATA',
  );
  expect(
    screen.queryByRole('region', { name: 'Merged PDF result' }),
  ).not.toBeInTheDocument();
});
it('shows progress and supports cancellation', async () => {
  mocks.merge.mockImplementation(
    (_d, _p, _n, signal, onProgress) =>
      new Promise((_resolve, reject) => {
        onProgress({ completed: 1, total: 4, stage: 'Copying page 1 of 4…' });
        signal.addEventListener('abort', () =>
          reject(new DOMException('Cancelled', 'AbortError')),
        );
      }),
  );
  render(<App />);
  const user = await load();
  await user.click(screen.getByRole('button', { name: 'Merge 4 pages' }));
  expect(await screen.findByRole('progressbar')).toHaveAttribute('value', '1');
  await user.click(screen.getByRole('button', { name: 'Cancel processing' }));
  expect(
    await screen.findByText('Merge cancelled. Your pages are unchanged.'),
  ).toBeVisible();
});
it('toggles theme using a labeled control', async () => {
  render(<App />);
  await userEvent.click(
    screen.getByRole('button', { name: 'Switch to dark mode' }),
  );
  expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  expect(
    screen.getByRole('button', { name: 'Switch to light mode' }),
  ).toBeVisible();
});
it('invalidates and revokes previous result on editing', async () => {
  render(<App />);
  const user = await load();
  await user.click(screen.getByRole('button', { name: 'Merge 4 pages' }));
  await screen.findByRole('region', { name: 'Merged PDF result' });
  await user.click(screen.getByRole('button', { name: 'Move b.pdf up' }));
  expect(
    screen.queryByRole('region', { name: 'Merged PDF result' }),
  ).not.toBeInTheDocument();
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:local-test');
});
it('undo restores document order together with the page model', async () => {
  render(<App />);
  const user = await load();
  await user.click(screen.getByRole('button', { name: 'Move b.pdf up' }));
  await user.click(screen.getByRole('button', { name: 'Undo' }));
  expect(
    Array.from(document.querySelectorAll('[data-document]')).map((e) =>
      e.getAttribute('data-document'),
    ),
  ).toEqual(['a.pdf', 'b.pdf']);
  await user.click(screen.getByRole('button', { name: 'Page View' }));
  expect(document.querySelector('[data-page-label]')).toHaveAttribute(
    'data-page-label',
    'a.pdf page 1',
  );
});
