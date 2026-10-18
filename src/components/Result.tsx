import { CheckCircle2, Download } from 'lucide-react';
import type { Output } from '../lib/types';
import { formatBytes } from '../lib/files/naming';
export function Result({
  result,
  onClear,
}: {
  result: Output;
  onClear: () => void;
}) {
  return (
    <section className="result-panel" aria-label="Merged PDF result">
      <CheckCircle2 size={26} />
      <div>
        <h2>Merged successfully</h2>
        <p className="break-name">
          {result.name} · {result.count} pages · {formatBytes(result.blob.size)}
        </p>
        <small>Validated and ready. Your originals are unchanged.</small>
      </div>
      <div className="result-actions">
        <a className="button primary" href={result.url} download={result.name}>
          <Download size={16} />
          Download PDF
        </a>
        <a className="text-button" href={result.url} download={result.name}>
          Download again
        </a>
        <button className="text-button" onClick={onClear}>
          Start over
        </button>
      </div>
    </section>
  );
}
