/**
 * LayoutEngine Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LayoutEngine } from '../../src/core/LayoutEngine';
import type { LayoutTemplate, ResolvedPaperSettings } from '../../src/core/types';

describe('LayoutEngine', () => {
  let engine: LayoutEngine;
  let defaultPaper: ResolvedPaperSettings;

  beforeEach(() => {
    engine = new LayoutEngine();
    defaultPaper = {
      width: 210,
      height: 297,
      orientation: 'portrait',
      margins: { top: 10, right: 10, bottom: 10, left: 10 },
      unit: 'mm'
    };
  });

  describe('calculateCells', () => {
    it('should calculate correct cell positions for 2x2 layout', () => {
      const layout: LayoutTemplate = {
        id: '2x2',
        name: '2x2 Grid',
        grid: { cols: 2, rows: 2 },
        gap: 0
      };

      const cells = engine.calculateCells({ layout, paper: defaultPaper });

      expect(cells).toHaveLength(4);

      // Check first cell (top-left)
      expect(cells[0].index).toBe(0);
      expect(cells[0].x).toBeGreaterThanOrEqual(10);
      expect(cells[0].y).toBeGreaterThanOrEqual(10);
    });

    it('should calculate correct cell positions for 1x1 (full page) layout', () => {
      const layout: LayoutTemplate = {
        id: 'full',
        name: 'Full Page',
        grid: { cols: 1, rows: 1 },
        gap: 0
      };

      const cells = engine.calculateCells({ layout, paper: defaultPaper });

      expect(cells).toHaveLength(1);
      expect(cells[0].x).toBe(10); // Left margin
      expect(cells[0].y).toBe(10); // Top margin
      expect(cells[0].width).toBe(190); // 210 - 10 - 10
      expect(cells[0].height).toBe(277); // 297 - 10 - 10
    });

    it('should handle gap settings', () => {
      const layout: LayoutTemplate = {
        id: '2x2',
        name: '2x2 Grid',
        grid: { cols: 2, rows: 2 },
        gap: 5
      };

      const cells = engine.calculateCells({ layout, paper: defaultPaper });

      expect(cells).toHaveLength(4);

      // Second cell should be offset by cell width + gap
      const cellWidth = cells[0].width;
      expect(cells[1].x).toBeCloseTo(cells[0].x + cellWidth + 5, 1);
    });

    it('should handle aspect ratio', () => {
      const layout: LayoutTemplate = {
        id: 'square',
        name: 'Square Grid',
        grid: { cols: 2, rows: 2 },
        gap: 0,
        aspectRatio: 1 // Square
      };

      const cells = engine.calculateCells({ layout, paper: defaultPaper });

      // All cells should be square
      cells.forEach(cell => {
        expect(cell.width).toBeCloseTo(cell.height, 1);
      });
    });

    it('should handle 3x3 layout', () => {
      const layout: LayoutTemplate = {
        id: '3x3',
        name: '3x3 Grid',
        grid: { cols: 3, rows: 3 },
        gap: 2
      };

      const cells = engine.calculateCells({ layout, paper: defaultPaper });

      expect(cells).toHaveLength(9);

      // Check cell ordering (row by row)
      expect(cells[0].index).toBe(0);
      expect(cells[1].index).toBe(1);
      expect(cells[2].index).toBe(2);
      expect(cells[3].index).toBe(3);
    });
  });

  describe('calculateCustomCells', () => {
    it('should calculate positions for custom cell layout', () => {
      const layout: LayoutTemplate = {
        id: 'custom',
        name: 'Custom Layout',
        grid: { cols: 3, rows: 3 },
        gap: 0,
        cells: [
          { x: 0, y: 0, colSpan: 2, rowSpan: 2 }, // Large cell
          { x: 2, y: 0 }, // Small cell
          { x: 2, y: 1 }, // Small cell
          { x: 0, y: 2 }, // Small cell
          { x: 1, y: 2 }, // Small cell
          { x: 2, y: 2 }  // Small cell
        ]
      };

      const cells = engine.calculateCells({ layout, paper: defaultPaper });

      expect(cells).toHaveLength(6);

      // First cell should be larger (2x2)
      expect(cells[0].width).toBeGreaterThan(cells[1].width);
      expect(cells[0].height).toBeGreaterThan(cells[1].height);
    });
  });

  describe('calculatePages', () => {
    it('should calculate correct number of pages', () => {
      const layout: LayoutTemplate = {
        id: '2x2',
        name: '2x2 Grid',
        grid: { cols: 2, rows: 2 },
        gap: 0
      };

      // Mock images
      const images = [
        createMockImage('1'),
        createMockImage('2'),
        createMockImage('3'),
        createMockImage('4'),
        createMockImage('5'),
        createMockImage('6')
      ];

      const pages = engine.calculatePages(images, layout, defaultPaper);

      // 6 images with 4 per page = 2 pages
      expect(pages).toHaveLength(2);
      expect(pages[0].imageCount).toBe(4);
      expect(pages[1].imageCount).toBe(2);
    });

    it('should return empty page when no images', () => {
      const layout: LayoutTemplate = {
        id: '2x2',
        name: '2x2 Grid',
        grid: { cols: 2, rows: 2 },
        gap: 0
      };

      const pages = engine.calculatePages([], layout, defaultPaper);

      expect(pages).toHaveLength(1);
      expect(pages[0].imageCount).toBe(0);
      expect(pages[0].cells).toHaveLength(4);
    });
  });

  describe('calculateImageFit', () => {
    const cell = { index: 0, x: 10, y: 10, width: 100, height: 100 };
    const landscapeImage = createMockImage('1', 200, 100); // 2:1 aspect
    const portraitImage = createMockImage('2', 100, 200); // 1:2 aspect

    it('should calculate contain fit correctly', () => {
      const position = { horizontal: 'center' as const, vertical: 'center' as const };

      // Landscape image in square cell
      const result = engine.calculateImageFit(landscapeImage, cell, 'contain', position);

      expect(result.width).toBe(100); // Full width
      expect(result.height).toBe(50); // Half height (maintaining 2:1)
      expect(result.y).toBe(35); // Centered vertically
    });

    it('should calculate cover fit correctly', () => {
      const position = { horizontal: 'center' as const, vertical: 'center' as const };

      // Landscape image in square cell
      const result = engine.calculateImageFit(landscapeImage, cell, 'cover', position);

      expect(result.height).toBe(100); // Full height
      expect(result.width).toBe(200); // Extended width (maintaining 2:1)
    });

    it('should calculate fill fit correctly', () => {
      const position = { horizontal: 'center' as const, vertical: 'center' as const };

      const result = engine.calculateImageFit(landscapeImage, cell, 'fill', position);

      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
    });

    it('should respect position settings', () => {
      const topLeft = { horizontal: 'left' as const, vertical: 'top' as const };
      const bottomRight = { horizontal: 'right' as const, vertical: 'bottom' as const };

      const result1 = engine.calculateImageFit(landscapeImage, cell, 'contain', topLeft);
      expect(result1.x).toBe(10);
      expect(result1.y).toBe(10);

      const result2 = engine.calculateImageFit(landscapeImage, cell, 'contain', bottomRight);
      expect(result2.x).toBe(10); // Image width equals cell width
      expect(result2.y).toBe(60); // 10 + 100 - 50
    });
  });

  describe('custom layout registration', () => {
    it('should register and retrieve custom layouts', () => {
      const customLayout: LayoutTemplate = {
        id: 'my-custom',
        name: 'My Custom Layout',
        grid: { cols: 5, rows: 4 }
      };

      engine.registerLayout(customLayout);

      const retrieved = engine.getCustomLayout('my-custom');
      expect(retrieved).toEqual(customLayout);
    });

    it('should return undefined for non-existent layout', () => {
      const result = engine.getCustomLayout('non-existent');
      expect(result).toBeUndefined();
    });

    it('should remove custom layout', () => {
      const customLayout: LayoutTemplate = {
        id: 'to-remove',
        name: 'To Remove',
        grid: { cols: 2, rows: 2 }
      };

      engine.registerLayout(customLayout);
      expect(engine.getCustomLayout('to-remove')).toBeDefined();

      const removed = engine.removeCustomLayout('to-remove');
      expect(removed).toBe(true);
      expect(engine.getCustomLayout('to-remove')).toBeUndefined();
    });
  });

  describe('determineOrientation', () => {
    it('should respect explicit orientation', () => {
      const layout: LayoutTemplate = {
        id: 'test',
        name: 'Test',
        grid: { cols: 2, rows: 2 },
        orientation: 'landscape'
      };

      expect(engine.determineOrientation(layout, 210, 297)).toBe('landscape');
    });

    it('should determine orientation from grid for auto', () => {
      const wideLayout: LayoutTemplate = {
        id: 'wide',
        name: 'Wide',
        grid: { cols: 4, rows: 2 },
        orientation: 'auto'
      };

      const tallLayout: LayoutTemplate = {
        id: 'tall',
        name: 'Tall',
        grid: { cols: 2, rows: 4 },
        orientation: 'auto'
      };

      expect(engine.determineOrientation(wideLayout, 210, 297)).toBe('landscape');
      expect(engine.determineOrientation(tallLayout, 210, 297)).toBe('portrait');
    });

    it('should default to portrait for square grids', () => {
      const squareLayout: LayoutTemplate = {
        id: 'square',
        name: 'Square',
        grid: { cols: 3, rows: 3 },
        orientation: 'auto'
      };

      expect(engine.determineOrientation(squareLayout, 210, 297)).toBe('portrait');
    });
  });
});

// Helper function to create mock image info
function createMockImage(id: string, width = 100, height = 100) {
  return {
    id,
    source: { type: 'url' as const, data: `http://example.com/${id}.jpg` },
    element: {} as HTMLImageElement,
    width,
    height,
    aspectRatio: width / height
  };
}
