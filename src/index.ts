/**
 * Photo Print JS - Main Entry Point
 *
 * A JavaScript library for photo print layouts, similar to Windows Photo Printing Wizard.
 * Supports multiple layout templates, various image sources, and flexible output options.
 */

// Main class
export { PhotoPrintLayout } from './core/PhotoPrintLayout';

// Core classes
export { ImageProcessor } from './core/ImageProcessor';
export { LayoutEngine } from './core/LayoutEngine';

// Renderers
export { DOMRenderer } from './renderers/DOMRenderer';
export type { DOMRenderOptions } from './renderers/DOMRenderer';

// Presets
export {
  PRESET_LAYOUTS,
  PRESET_PAPER_SIZES,
  DEFAULT_LAYOUT,
  DEFAULT_PAPER_SIZE,
  DEFAULT_MARGINS,
  DEFAULT_IMAGE_SETTINGS,
  getLayoutById,
  getPaperSizeById
} from './layouts/presets';

// Types
export type {
  // Image types
  ImageSourceType,
  ImageSource,
  ImageInfo,
  ImageFitMode,
  ImagePosition,
  ImageSettings,

  // Layout types
  LayoutGrid,
  LayoutCell,
  LayoutTemplate,
  CalculatedCell,

  // Paper types
  PaperMargins,
  PaperSize,
  PaperSettings,
  ResolvedPaperSettings,

  // Output types
  OutputType,
  OutputOptions,

  // Preview types
  PreviewOptions,

  // Event types
  EventType,
  PhotoPrintEvent,
  EventCallback,

  // Page types
  PageInfo,

  // Main options
  PhotoPrintOptions,

  // Renderer types
  Renderer,
  RenderSettings,

  // Utility types
  DeepPartial
} from './core/types';

// Utilities
export {
  generateId,
  mmToPx,
  pxToMm,
  inchToPx,
  pxToInch,
  mmToInch,
  inchToMm,
  clamp,
  deepMerge,
  debounce,
  throttle,
  isBrowser,
  getElement,
  createElement
} from './utils/helpers';
