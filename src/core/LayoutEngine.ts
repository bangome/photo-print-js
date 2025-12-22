/**
 * Layout Engine - Calculates cell positions and sizes for layouts
 */

import type {
  LayoutTemplate,
  LayoutCell,
  CalculatedCell,
  ResolvedPaperSettings,
  ImageInfo,
  PageInfo
} from './types';

export interface LayoutCalculationOptions {
  layout: LayoutTemplate;
  paper: ResolvedPaperSettings;
  dpi?: number;
}

export class LayoutEngine {
  private customLayouts: Map<string, LayoutTemplate> = new Map();

  /**
   * Calculate cell positions and dimensions for a layout
   */
  calculateCells(options: LayoutCalculationOptions): CalculatedCell[] {
    const { layout, paper } = options;

    // Calculate printable area
    const printableWidth = paper.width - paper.margins.left - paper.margins.right;
    const printableHeight = paper.height - paper.margins.top - paper.margins.bottom;

    // If custom cells are defined, use them
    if (layout.cells && layout.cells.length > 0) {
      return this.calculateCustomCells(layout.cells, layout, printableWidth, printableHeight, paper.margins);
    }

    // Otherwise use grid layout
    return this.calculateGridCells(layout, printableWidth, printableHeight, paper.margins);
  }

  /**
   * Calculate grid-based cell positions
   */
  private calculateGridCells(
    layout: LayoutTemplate,
    printableWidth: number,
    printableHeight: number,
    margins: { left: number; top: number }
  ): CalculatedCell[] {
    const { cols, rows } = layout.grid;
    const gap = layout.gap || 0;

    // Calculate total gap space
    const totalGapX = gap * (cols - 1);
    const totalGapY = gap * (rows - 1);

    // Calculate available space for cells
    const availableWidth = printableWidth - totalGapX;
    const availableHeight = printableHeight - totalGapY;

    // Calculate base cell size
    let cellWidth = availableWidth / cols;
    let cellHeight = availableHeight / rows;

    // Apply aspect ratio if specified
    if (layout.aspectRatio) {
      const currentAspectRatio = cellWidth / cellHeight;

      if (currentAspectRatio > layout.aspectRatio) {
        // Cell is wider than desired - reduce width
        cellWidth = cellHeight * layout.aspectRatio;
      } else {
        // Cell is taller than desired - reduce height
        cellHeight = cellWidth / layout.aspectRatio;
      }
    }

    // Calculate centering offset if cells don't fill entire area
    const actualTotalWidth = cellWidth * cols + totalGapX;
    const actualTotalHeight = cellHeight * rows + totalGapY;
    const offsetX = (printableWidth - actualTotalWidth) / 2;
    const offsetY = (printableHeight - actualTotalHeight) / 2;

    const cells: CalculatedCell[] = [];
    let index = 0;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = margins.left + offsetX + col * (cellWidth + gap);
        const y = margins.top + offsetY + row * (cellHeight + gap);

        cells.push({
          index,
          x,
          y,
          width: cellWidth,
          height: cellHeight
        });

        index++;
      }
    }

    return cells;
  }

  /**
   * Calculate custom cell positions (for complex layouts)
   */
  private calculateCustomCells(
    cellDefs: LayoutCell[],
    layout: LayoutTemplate,
    printableWidth: number,
    printableHeight: number,
    margins: { left: number; top: number }
  ): CalculatedCell[] {
    const { cols, rows } = layout.grid;
    const gap = layout.gap || 0;

    // Calculate unit size (size of single grid cell)
    const totalGapX = gap * (cols - 1);
    const totalGapY = gap * (rows - 1);
    const unitWidth = (printableWidth - totalGapX) / cols;
    const unitHeight = (printableHeight - totalGapY) / rows;

    return cellDefs.map((cell, index) => {
      const colSpan = cell.colSpan || 1;
      const rowSpan = cell.rowSpan || 1;

      const x = margins.left + cell.x * (unitWidth + gap);
      const y = margins.top + cell.y * (unitHeight + gap);
      const width = unitWidth * colSpan + gap * (colSpan - 1);
      const height = unitHeight * rowSpan + gap * (rowSpan - 1);

      return {
        index,
        x,
        y,
        width,
        height
      };
    });
  }

  /**
   * Calculate pages based on images and layout
   */
  calculatePages(images: ImageInfo[], layout: LayoutTemplate, paper: ResolvedPaperSettings): PageInfo[] {
    const cells = this.calculateCells({ layout, paper });
    const cellsPerPage = cells.length;
    const pages: PageInfo[] = [];

    if (images.length === 0) {
      // Return single empty page with cells
      return [{
        index: 0,
        imageCount: 0,
        cells,
        images: []
      }];
    }

    const pageCount = Math.ceil(images.length / cellsPerPage);

    for (let i = 0; i < pageCount; i++) {
      const startIdx = i * cellsPerPage;
      const endIdx = Math.min(startIdx + cellsPerPage, images.length);
      const pageImages = images.slice(startIdx, endIdx);

      // Assign images to cells
      const pageCells = cells.map((cell, idx) => ({
        ...cell,
        imageId: pageImages[idx]?.id
      }));

      pages.push({
        index: i,
        imageCount: pageImages.length,
        cells: pageCells,
        images: pageImages
      });
    }

    return pages;
  }

  /**
   * Register a custom layout
   */
  registerLayout(template: LayoutTemplate): void {
    this.customLayouts.set(template.id, template);
  }

  /**
   * Get a custom layout by ID
   */
  getCustomLayout(id: string): LayoutTemplate | undefined {
    return this.customLayouts.get(id);
  }

  /**
   * Get all custom layouts
   */
  getCustomLayouts(): LayoutTemplate[] {
    return Array.from(this.customLayouts.values());
  }

  /**
   * Remove a custom layout
   */
  removeCustomLayout(id: string): boolean {
    return this.customLayouts.delete(id);
  }

  /**
   * Calculate image position and size within a cell based on fit mode
   */
  calculateImageFit(
    image: ImageInfo,
    cell: CalculatedCell,
    fit: 'contain' | 'cover' | 'fill' | 'none',
    position: { horizontal: 'left' | 'center' | 'right'; vertical: 'top' | 'center' | 'bottom' }
  ): { x: number; y: number; width: number; height: number } {
    const imageAspect = image.aspectRatio;
    const cellAspect = cell.width / cell.height;

    let width: number;
    let height: number;

    switch (fit) {
      case 'contain':
        // Fit image entirely within cell, maintaining aspect ratio
        if (imageAspect > cellAspect) {
          width = cell.width;
          height = cell.width / imageAspect;
        } else {
          height = cell.height;
          width = cell.height * imageAspect;
        }
        break;

      case 'cover':
        // Cover entire cell, maintaining aspect ratio (may crop)
        if (imageAspect > cellAspect) {
          height = cell.height;
          width = cell.height * imageAspect;
        } else {
          width = cell.width;
          height = cell.width / imageAspect;
        }
        break;

      case 'fill':
        // Stretch to fill cell (ignore aspect ratio)
        width = cell.width;
        height = cell.height;
        break;

      case 'none':
      default:
        // Original size
        width = image.width;
        height = image.height;
        break;
    }

    // Calculate position based on alignment
    let x = cell.x;
    let y = cell.y;

    switch (position.horizontal) {
      case 'left':
        x = cell.x;
        break;
      case 'center':
        x = cell.x + (cell.width - width) / 2;
        break;
      case 'right':
        x = cell.x + cell.width - width;
        break;
    }

    switch (position.vertical) {
      case 'top':
        y = cell.y;
        break;
      case 'center':
        y = cell.y + (cell.height - height) / 2;
        break;
      case 'bottom':
        y = cell.y + cell.height - height;
        break;
    }

    return { x, y, width, height };
  }

  /**
   * Determine optimal paper orientation for a layout
   */
  determineOrientation(
    layout: LayoutTemplate,
    _paperWidth: number,
    _paperHeight: number
  ): 'portrait' | 'landscape' {
    if (layout.orientation && layout.orientation !== 'auto') {
      return layout.orientation;
    }

    // For auto orientation, use grid dimensions
    const { cols, rows } = layout.grid;

    if (cols > rows) {
      return 'landscape';
    } else if (rows > cols) {
      return 'portrait';
    }

    // For square grids, prefer portrait
    return 'portrait';
  }
}
