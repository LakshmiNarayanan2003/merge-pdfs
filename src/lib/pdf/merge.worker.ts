import { mergePdf } from './merge';
import type { MergePage, Progress } from '../types';
import { friendlyError } from '../validation/pdf';
self.onmessage = async (
  event: MessageEvent<{
    sources: { id: string; file: File }[];
    plan: MergePage[];
    name: string;
  }>,
) => {
  try {
    const sources = [];
    for (const source of event.data.sources)
      sources.push({
        id: source.id,
        bytes: new Uint8Array(await source.file.arrayBuffer()),
      });
    const bytes = await mergePdf(
      sources,
      event.data.plan,
      event.data.name,
      (progress: Progress) => self.postMessage({ progress }),
    );
    self.postMessage({ bytes }, { transfer: [bytes.buffer] });
  } catch (error) {
    self.postMessage({ error: friendlyError(error) });
  }
};
