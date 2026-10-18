import { ShieldCheck, ArrowUpRight, Layers3 } from 'lucide-react';
const source = 'https://github.com/LakshmiNarayanan2003/merge-pdfs';
const faq = [
  [
    'Does PDFMerge upload my files?',
    'No. Your PDFs never leave your device. Files are read and processed in browser memory. There is no upload endpoint, account, analytics or conversion server. The static host sees normal requests for website assets.',
  ],
  [
    'Can I change PDF order?',
    'Yes. Drag documents or use Move Up and Move Down. Moving a document groups its remaining pages in their current order.',
  ],
  [
    'Can I rearrange individual pages?',
    'Yes. Page View shows the exact output order, including pages interleaved across different documents. Use dragging or the accessible arrow, beginning and end controls.',
  ],
  [
    'Can I delete pages?',
    'Yes. Remove individual pages or select several and delete them together. Undo the last page edit, or restore removed pages before merging. Your original files are unchanged.',
  ],
  [
    'Can I rotate pages?',
    'Yes. Rotate left or right in 90° steps, individually or as a selection. Existing source rotation is preserved and your rotation is added.',
  ],
  [
    'Are my PDFs compressed?',
    'No intentional content recompression or rasterization is performed. pdf-lib copies page content and rewrites internal PDF structures. This is not byte-for-byte preservation or a compression tool.',
  ],
  [
    'Can I merge password-protected PDFs?',
    'Encrypted PDFs are not supported in v0.1.0. PDF.js can unlock them for rendering, but our copying library cannot reliably decrypt them. Export an unencrypted copy using a trusted local editor first. There is no server fallback.',
  ],
  [
    'Does it work on Mac?',
    'Yes, in a current supported browser. Processing runs in the browser rather than an operating-system application.',
  ],
  [
    'Does it work on Windows?',
    'Yes. Use an up-to-date Chromium, Firefox or Safari-family browser on a supported operating system.',
  ],
  [
    'Does it work on mobile?',
    'The responsive workspace includes touch-friendly buttons for choosing, ordering, rotating and removing pages. Smaller files are recommended because mobile browser memory is limited. Downloads follow your browser’s normal behavior.',
  ],
  [
    'Is PDFMerge free?',
    'Yes. PDFMerge is free and MIT licensed. The safeguards of 20 PDFs, 100 MB each, 500 MB combined and 1000 total pages protect browser resources; they are not paid-plan limits.',
  ],
  [
    'What happens to forms, links and signatures?',
    'Interactive annotations, links and form widgets are removed. Bookmarks, attachments and document actions are not imported. Digital signatures are not preserved and editing or merging signed PDFs invalidates them. Keep your originals.',
  ],
];
export function Info() {
  return (
    <>
      <section id="how-it-works" className="how section">
        <div className="section-heading">
          <div>
            <span className="section-label">LESS FRICTION. ONE DOCUMENT.</span>
            <h2>A little order. A lot less effort.</h2>
          </div>
          <p>Three steps. Everything stays with you.</p>
        </div>
        <div className="steps">
          {[
            [
              '01',
              'Add your PDFs',
              'Choose one document or bring a collection together.',
            ],
            [
              '02',
              'Arrange your pages',
              'Reorder, rotate and remove. Make every page count.',
            ],
            [
              '03',
              'Download one PDF',
              'Get one real PDF, with text and vectors kept sharp.',
            ],
          ].map(([n, h, p]) => (
            <article key={n}>
              <span className="step-number">{n}</span>
              <h3>{h}</h3>
              <p>{p}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="privacy-panel section" id="privacy">
        <ShieldCheck className="privacy-icon" size={42} />
        <div>
          <span className="section-label">YOUR FILES. YOUR BUSINESS.</span>
          <h2>Merge PDFs. Keep them private.</h2>
          <p>
            Your browser does the work. Your files stay in memory on your
            device. No upload, no account, no telemetry. Refresh or close the
            tab to clear the session.
          </p>
          <a href={`${source}/blob/master/PRIVACY.md`}>
            Read the privacy architecture
            <ArrowUpRight size={15} />
          </a>
        </div>
        <div className="privacy-points">
          <span>
            <ShieldCheck size={18} />
            No conversion server
          </span>
          <span>
            <Layers3 size={18} />
            No document history
          </span>
          <span>
            <ShieldCheck size={18} />
            Open for inspection
          </span>
        </div>
      </section>
      <section className="section features">
        <span className="section-label">SMALL TOOL. USEFUL DETAILS.</span>
        <h2>One workspace, every page.</h2>
        <div>
          {[
            'Merge PDFs',
            'Reorder documents',
            'Rearrange pages',
            'Remove & restore pages',
            'Rotate pages',
            'Import page ranges',
            'No upload',
            'Open source',
          ].map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </section>
      <section id="faq" className="faq section">
        <div>
          <span className="section-label">A FEW THINGS TO KNOW</span>
          <h2>
            Good questions.
            <br />
            Clear answers.
          </h2>
          <p>
            Useful by design.
            <br />
            Honest about the details.
          </p>
          <a href={`${source}/issues`}>
            Something else? Open an issue
            <ArrowUpRight size={14} />
          </a>
        </div>
        <div className="faq-list">
          {faq.map(([q, a]) => (
            <details key={q}>
              <summary>
                {q}
                <span aria-hidden="true">+</span>
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="more-tools">
        <span className="section-label">MORE LOCAL TOOLS</span>
        <a href="https://lakshminarayanan2003.github.io/pdf-to-image/">
          <strong>PDF2Pix</strong>
          <span>PDF → image</span>
          <ArrowUpRight size={17} />
        </a>
      </section>
      <footer>
        <a href="#" className="wordmark">
          <img
            src={`${import.meta.env.BASE_URL}favicon.svg`}
            width="28"
            height="28"
            alt=""
          />
          PDFMerge
        </a>
        <span>Made for your files. Designed for your privacy.</span>
        <nav aria-label="Footer">
          <a href={source}>GitHub</a>
          <a href={`${source}/blob/master/LICENSE`}>MIT License</a>
          <a href={`${source}/blob/master/PRIVACY.md`}>Privacy</a>
          <a href={`${source}#readme`}>Docs</a>
        </nav>
        <small>
          v0.1.0 · Free & open source · By Lakshmi Narayanan Sridharan
        </small>
      </footer>
    </>
  );
}
