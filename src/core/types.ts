/**
 * Photo Print JS - Type Definitions
 */

// ============================================
// Image Types
// ============================================

export type ImageSourceType = 'url' | 'file' | 'blob' | 'base64' | 'element';

export interface ImageSource {
  type: ImageSourceType;
  data: string | File | Blob | HTMLImageElement;
  id?: string;
  caption?: string;
}

export interface ImageInfo {
  id: string;
  source: ImageSource;
  element: HTMLImageElement;
  width: number;
  height: number;
  aspectRatio: number;
  caption?: string;
  settings?: Partial<ImageSettings>;
}

export type ImageFitMode = 'contain' | 'cover' | 'fill' | 'none';

export interface ImagePosition {
  horizontal: 'left' | 'center' | 'right';
  vertical: 'top' | 'center' | 'bottom';
}

export interface ImageSettings {
  fit: ImageFitMode;
  position: ImagePosition;
  rotation?: number;
  filter?: string;
}

// ============================================
// Layout Types
// ============================================

export interface LayoutGrid {
  cols: number;
  rows: number;
}

export interface LayoutCell {
  x: number;
  y: number;
  colSpan?: number;
  rowSpan?: number;
  aspectRatio?: number;
}

export interface LayoutTemplate {
  id: string;
  name: string;
  description?: string;
  grid: LayoutGrid;
  cells?: LayoutCell[];
  aspectRatio?: number;
  gap?: number;
  orientation?: 'portrait' | 'landscape' | 'auto';
}

export interface CalculatedCell {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  imageId?: string;
}

// ============================================
// Paper Types
// ============================================

export interface PaperMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface PaperSize {
  id: string;
  name: string;
  width: number;
  height: number;
}

export interface PaperSettings {
  size: string | { width: number; height: number };
  orientation: 'portrait' | 'landscape' | 'auto';
  margins: PaperMargins;
  unit?: 'mm' | 'inch' | 'px';
}

export interface ResolvedPaperSettings {
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  margins: PaperMargins;
  unit: 'mm' | 'inch' | 'px';
}

// ============================================
// Output Types
// ============================================

export type OutputType = 'print' | 'pdf' | 'canvas' | 'blob' | 'dataurl';

export interface OutputOptions {
  type: OutputType;
  quality?: number;
  filename?: string;
  autoPrint?: boolean;
  scale?: number;
}

// ============================================
// Preview Types
// ============================================

export interface PreviewOptions {
  container: HTMLElement | string;
  width?: number | string;
  height?: number | string;
  showPageNumber?: boolean;
  showNavigation?: boolean;
  interactive?: boolean;
  theme?: 'light' | 'dark' | 'auto';
}

// ============================================
// Event Types
// ============================================

export type EventType =
  | 'imageAdded'
  | 'imageRemoved'
  | 'imagesReordered'
  | 'layoutChanged'
  | 'paperChanged'
  | 'settingsChanged'
  | 'beforePrint'
  | 'afterPrint'
  | 'error';

export interface PhotoPrintEvent<T = unknown> {
  type: EventType;
  data?: T;
  timestamp: number;
}

export type EventCallback<T = unknown> = (event: PhotoPrintEvent<T>) => void;

// ============================================
// Page Types
// ============================================

export interface PageInfo {
  index: number;
  imageCount: number;
  cells: CalculatedCell[];
  images: ImageInfo[];
}

// ============================================
// Main Options
// ============================================

export interface PhotoPrintOptions {
  images?: (ImageSource | string)[];
  layout?: string | LayoutTemplate;
  paper?: Partial<PaperSettings>;
  imageSettings?: Partial<ImageSettings>;
  preview?: PreviewOptions | false;
  pdfRenderer?: unknown | (() => Promise<unknown>);
  locale?: string;
  debug?: boolean;
}

// ============================================
// Renderer Types
// ============================================

export interface Renderer {
  render(pages: PageInfo[], settings: RenderSettings): Promise<void>;
  destroy(): void;
}

export interface RenderSettings {
  paper: ResolvedPaperSettings;
  layout: LayoutTemplate;
  imageSettings: ImageSettings;
  dpi?: number;
}

// ============================================
// Utility Types
// ============================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
