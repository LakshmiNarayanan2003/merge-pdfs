import { useEffect, useRef, useState } from 'react';
import type { SourceDocument } from '../lib/types';
export function PageThumbnail({
  doc,
  index = 0,
  rotation = 0,
}: {
  doc: SourceDocument;
  index?: number;
  rotation?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState<{ key: string; url: string } | null>(null);
  const [error, setError] = useState('');
  const key = `${doc.id}:${index}:${rotation}`;
  useEffect(() => {
    const controller = new AbortController();
    let url = '';
    let started = false;
    const start = async () => {
      if (started || controller.signal.aborted) return;
      started = true;
      try {
        const { thumbnail } = await import('../lib/pdf/preview');
        const blob = await thumbnail(doc, index, rotation, controller.signal);
        if (!controller.signal.aborted) {
          url = URL.createObjectURL(blob);
          setImage({ key, url });
        }
      } catch {
        if (!controller.signal.aborted) setError('Preview unavailable');
      }
    };
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) void start();
      },
      { rootMargin: '100px' },
    );
    if (ref.current) observer.observe(ref.current);
    return () => {
      controller.abort();
      observer.disconnect();
      if (url) URL.revokeObjectURL(url);
    };
  }, [doc, index, rotation, key]);
  return (
    <div className="page-thumbnail" ref={ref}>
      {image?.key === key ? (
        <img
          src={image.url}
          alt={`Preview of ${doc.file.name}, page ${index + 1}`}
        />
      ) : (
        <span>{error || 'Preview…'}</span>
      )}
    </div>
  );
}
