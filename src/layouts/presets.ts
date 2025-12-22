/**
 * Predefined layout templates
 */

import type { LayoutTemplate, PaperSize } from '../core/types';

/**
 * Preset layout templates
 */
export const PRESET_LAYOUTS: LayoutTemplate[] = [
  {
    id: 'full',
    name: 'Full Page',
    description: 'Single image filling the entire page',
    grid: { cols: 1, rows: 1 },
    aspectRatio: undefined, // Use paper aspect ratio
    gap: 0,
    orientation: 'auto'
  },
  {
    id: '2x1',
    name: '2-up Horizontal',
    description: 'Two images side by side',
    grid: { cols: 2, rows: 1 },
    aspectRatio: 1.5, // 3:2 landscape
    gap: 5,
    orientation: 'landscape'
  },
  {
    id: '1x2',
    name: '2-up Vertical',
    description: 'Two images stacked vertically',
    grid: { cols: 1, rows: 2 },
    aspectRatio: 0.667, // 2:3 portrait
    gap: 5,
    orientation: 'portrait'
  },
  {
    id: '2x2',
    name: '4-up Grid',
    description: 'Four images in a 2x2 grid',
    grid: { cols: 2, rows: 2 },
    aspectRatio: 1, // Square
    gap: 5,
    orientation: 'auto'
  },
  {
    id: '2x3',
    name: '6-up Vertical',
    description: 'Six images in a 2x3 grid',
    grid: { cols: 2, rows: 3 },
    aspectRatio: 1,
    gap: 4,
    orientation: 'portrait'
  },
  {
    id: '3x2',
    name: '6-up Horizontal',
    description: 'Six images in a 3x2 grid',
    grid: { cols: 3, rows: 2 },
    aspectRatio: 1,
    gap: 4,
    orientation: 'landscape'
  },
  {
    id: '3x3',
    name: '9-up Grid',
    description: 'Nine images in a 3x3 grid (index print)',
    grid: { cols: 3, rows: 3 },
    aspectRatio: 1,
    gap: 3,
    orientation: 'auto'
  },
  {
    id: '4x4',
    name: '16-up Grid',
    description: 'Sixteen images in a 4x4 grid (thumbnails)',
    grid: { cols: 4, rows: 4 },
    aspectRatio: 1,
    gap: 2,
    orientation: 'auto'
  },
  {
    id: '4x5',
    name: '20-up Contact Sheet',
    description: 'Twenty images in a 4x5 grid (contact sheet)',
    grid: { cols: 4, rows: 5 },
    aspectRatio: 1.5,
    gap: 2,
    orientation: 'portrait'
  },
  {
    id: 'wallet',
    name: 'Wallet Size',
    description: 'Eight wallet-sized photos',
    grid: { cols: 4, rows: 2 },
    aspectRatio: 0.667,
    gap: 3,
    orientation: 'landscape'
  },
  {
    id: '3.5x5',
    name: '3.5x5 inch',
    description: 'Standard 3.5x5 inch photo size',
    grid: { cols: 2, rows: 2 },
    aspectRatio: 0.7, // 3.5:5
    gap: 5,
    orientation: 'portrait'
  },
  {
    id: '4x6',
    name: '4x6 inch',
    description: 'Standard 4x6 inch photo size',
    grid: { cols: 2, rows: 2 },
    aspectRatio: 0.667, // 4:6
    gap: 5,
    orientation: 'portrait'
  },
  {
    id: '5x7',
    name: '5x7 inch',
    description: 'Medium 5x7 inch photo size',
    grid: { cols: 1, rows: 2 },
    aspectRatio: 0.714, // 5:7
    gap: 5,
    orientation: 'portrait'
  }
];

/**
 * Preset paper sizes (in mm)
 */
export const PRESET_PAPER_SIZES: PaperSize[] = [
  { id: 'a4', name: 'A4', width: 210, height: 297 },
  { id: 'a5', name: 'A5', width: 148, height: 210 },
  { id: 'a3', name: 'A3', width: 297, height: 420 },
  { id: 'letter', name: 'Letter', width: 216, height: 279 },
  { id: 'legal', name: 'Legal', width: 216, height: 356 },
  { id: '4x6', name: '4x6 inch', width: 102, height: 152 },
  { id: '5x7', name: '5x7 inch', width: 127, height: 178 }
];

/**
 * Get layout by ID
 */
export function getLayoutById(id: string): LayoutTemplate | undefined {
  return PRESET_LAYOUTS.find(layout => layout.id === id);
}

/**
 * Get paper size by ID
 */
export function getPaperSizeById(id: string): PaperSize | undefined {
  return PRESET_PAPER_SIZES.find(size => size.id === id);
}

/**
 * Default layout
 */
export const DEFAULT_LAYOUT: LayoutTemplate = PRESET_LAYOUTS.find(l => l.id === '2x2')!;

/**
 * Default paper size
 */
export const DEFAULT_PAPER_SIZE: PaperSize = PRESET_PAPER_SIZES.find(p => p.id === 'a4')!;

/**
 * Default margins (mm)
 */
export const DEFAULT_MARGINS = {
  top: 10,
  right: 10,
  bottom: 10,
  left: 10
};

/**
 * Default image settings
 */
export const DEFAULT_IMAGE_SETTINGS = {
  fit: 'cover' as const,
  position: {
    horizontal: 'center' as const,
    vertical: 'center' as const
  },
  rotation: 0
};
