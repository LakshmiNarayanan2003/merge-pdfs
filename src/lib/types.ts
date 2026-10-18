import type { PDFDocumentProxy } from 'pdfjs-dist';
export interface SourceDocument {
  id: string;
  file: File;
  pdf: PDFDocumentProxy;
  previewCache: Map<string, Blob>;
  warning?: string;
}
export interface PageItem {
  id: string;
  documentId: string;
  sourcePageIndex: number;
  rotation: number;
  selected: boolean;
  removed: boolean;
}
export interface Session {
  documents: SourceDocument[];
  pages: PageItem[];
}
export interface MergeSource {
  id: string;
  bytes: Uint8Array;
}
export interface MergePage {
  id: string;
  documentId: string;
  sourcePageIndex: number;
  rotation: number;
}
export interface Progress {
  completed: number;
  total: number;
  stage: string;
}
export interface Output {
  url: string;
  blob: Blob;
  name: string;
  count: number;
}
