import {
  Code2,
  Sun,
  Moon,
  ArrowUpRight,
  ShieldCheck,
  LockKeyhole,
  Combine,
} from 'lucide-react';
export function Header({
  dark,
  onToggle,
}: {
  dark: boolean;
  onToggle: () => void;
}) {
  return (
    <header className="site-header">
      <a className="wordmark" href="#">
        <img
          src={`${import.meta.env.BASE_URL}favicon.svg`}
          alt=""
          width="32"
          height="32"
        />
        PDFMerge<span className="open-badge">OPEN SOURCE</span>
      </a>
      <nav aria-label="Main">
        <a href="#merger">Merge</a>
        <a href="#how-it-works">How it works</a>
        <a href="#privacy">Privacy</a>
      </nav>
      <div className="header-actions">
        <a
          className="github-link"
          href="https://github.com/LakshmiNarayanan2003/merge-pdfs"
          aria-label="PDFMerge on GitHub"
        >
          <Code2 size={18} />
          GitHub
          <ArrowUpRight size={13} />
        </a>
        <button
          className="icon-button theme-toggle"
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={onToggle}
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
export function Hero() {
  return (
    <section className="hero">
      <div className="eyebrow">
        <span /> THE LOCAL PDF MERGER
      </div>
      <h1>
        PDFs in. <em>One PDF out.</em>
      </h1>
      <p>
        Combine, reorder and clean up PDFs directly in your browser.
        <br />
        Nothing is uploaded. Your files stay on your device.
      </p>
      <div className="trust-points">
        <span>
          <ShieldCheck size={15} />
          Your PDFs never leave your device
        </span>
        <span>
          <LockKeyhole size={14} />
          No account. No tracking.
        </span>
        <span>
          <Combine size={15} />
          Free & open source
        </span>
      </div>
    </section>
  );
}
