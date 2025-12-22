/**
 * DOM Renderer - Renders layouts using HTML/CSS for preview and printing
 */

import type {
  PageInfo,
  RenderSettings,
  ImageSettings,
  CalculatedCell,
  ImageInfo
} from '../core/types';
import { LayoutEngine } from '../core/LayoutEngine';
import { mmToPx } from '../utils/helpers';

export interface DOMRenderOptions {
  container?: HTMLElement;
  scale?: number;
  showPageBorder?: boolean;
  showCellBorder?: boolean;
  theme?: 'light' | 'dark';
}

export class DOMRenderer {
  private layoutEngine: LayoutEngine;
  private container: HTMLElement | null = null;
  private printStyleElement: HTMLStyleElement | null = null;

  constructor() {
    this.layoutEngine = new LayoutEngine();
  }

  /**
   * Render pages to a container element
   */
  render(
    pages: PageInfo[],
    settings: RenderSettings,
    options: DOMRenderOptions = {}
  ): HTMLElement {
    const {
      scale = 1,
      showPageBorder = true,
      showCellBorder = false,
      theme = 'light'
    } = options;

    const container = document.createElement('div');
    container.className = 'photo-print-container';
    container.setAttribute('data-theme', theme);

    // Calculate page dimensions in pixels
    const dpi = settings.dpi || 96;
    const pageWidthPx = mmToPx(settings.paper.width, dpi) * scale;
    const pageHeightPx = mmToPx(settings.paper.height, dpi) * scale;

    // Container styles
    Object.assign(container.style, {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '20px',
      padding: '20px',
      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f5f5f5'
    });

    // Render each page
    pages.forEach((page, pageIndex) => {
      const pageElement = this.renderPage(page, settings, {
        scale,
        showPageBorder,
        showCellBorder,
        pageWidthPx,
        pageHeightPx,
        dpi
      });
      pageElement.setAttribute('data-page-index', String(pageIndex));
      container.appendChild(pageElement);
    });

    this.container = container;
    return container;
  }

  /**
   * Render a single page
   */
  private renderPage(
    page: PageInfo,
    settings: RenderSettings,
    options: {
      scale: number;
      showPageBorder: boolean;
      showCellBorder: boolean;
      pageWidthPx: number;
      pageHeightPx: number;
      dpi: number;
    }
  ): HTMLElement {
    const pageElement = document.createElement('div');
    pageElement.className = 'photo-print-page';

    Object.assign(pageElement.style, {
      width: `${options.pageWidthPx}px`,
      height: `${options.pageHeightPx}px`,
      backgroundColor: '#ffffff',
      position: 'relative',
      boxShadow: options.showPageBorder ? '0 2px 10px rgba(0,0,0,0.2)' : 'none',
      overflow: 'hidden'
    });

    // Render each cell
    page.cells.forEach((cell, cellIndex) => {
      const image = page.images[cellIndex];
      const cellElement = this.renderCell(
        cell,
        image,
        settings.imageSettings,
        options
      );
      pageElement.appendChild(cellElement);
    });

    return pageElement;
  }

  /**
   * Render a single cell with its image
   */
  private renderCell(
    cell: CalculatedCell,
    image: ImageInfo | undefined,
    imageSettings: ImageSettings,
    options: {
      scale: number;
      showCellBorder: boolean;
      dpi: number;
    }
  ): HTMLElement {
    const { scale, showCellBorder, dpi } = options;

    const cellElement = document.createElement('div');
    cellElement.className = 'photo-print-cell';

    // Convert mm to px
    const x = mmToPx(cell.x, dpi) * scale;
    const y = mmToPx(cell.y, dpi) * scale;
    const width = mmToPx(cell.width, dpi) * scale;
    const height = mmToPx(cell.height, dpi) * scale;

    Object.assign(cellElement.style, {
      position: 'absolute',
      left: `${x}px`,
      top: `${y}px`,
      width: `${width}px`,
      height: `${height}px`,
      overflow: 'hidden',
      border: showCellBorder ? '1px dashed #ccc' : 'none',
      boxSizing: 'border-box'
    });

    if (image) {
      const imgElement = this.renderImage(image, cell, imageSettings, { scale, dpi });
      cellElement.appendChild(imgElement);
    }

    return cellElement;
  }

  /**
   * Render an image within a cell
   */
  private renderImage(
    image: ImageInfo,
    cell: CalculatedCell,
    settings: ImageSettings,
    options: { scale: number; dpi: number }
  ): HTMLElement {
    const { scale, dpi } = options;
    const mergedSettings = { ...settings, ...image.settings };

    // Calculate image fit (used for custom positioning if needed)
    this.layoutEngine.calculateImageFit(
      image,
      cell,
      mergedSettings.fit,
      mergedSettings.position
    );

    const imgContainer = document.createElement('div');
    imgContainer.className = 'photo-print-image-container';

    // Convert to pixels
    const containerWidth = mmToPx(cell.width, dpi) * scale;
    const containerHeight = mmToPx(cell.height, dpi) * scale;

    Object.assign(imgContainer.style, {
      position: 'absolute',
      left: '0',
      top: '0',
      width: `${containerWidth}px`,
      height: `${containerHeight}px`,
      display: 'flex',
      alignItems: this.getFlexAlign(mergedSettings.position.vertical),
      justifyContent: this.getFlexJustify(mergedSettings.position.horizontal),
      overflow: 'hidden'
    });

    const imgElement = document.createElement('img');
    imgElement.src = image.element.src;
    imgElement.className = 'photo-print-image';
    imgElement.draggable = false;

    // Apply object-fit based on settings
    const objectFitMap: Record<string, string> = {
      contain: 'contain',
      cover: 'cover',
      fill: 'fill',
      none: 'none'
    };

    Object.assign(imgElement.style, {
      display: 'block',
      objectFit: objectFitMap[mergedSettings.fit],
      width: mergedSettings.fit === 'none' ? 'auto' : '100%',
      height: mergedSettings.fit === 'none' ? 'auto' : '100%',
      transform: mergedSettings.rotation ? `rotate(${mergedSettings.rotation}deg)` : 'none',
      filter: mergedSettings.filter || 'none'
    });

    imgContainer.appendChild(imgElement);
    return imgContainer;
  }

  /**
   * Convert vertical position to flex align-items value
   */
  private getFlexAlign(position: 'top' | 'center' | 'bottom'): string {
    const map = { top: 'flex-start', center: 'center', bottom: 'flex-end' };
    return map[position];
  }

  /**
   * Convert horizontal position to flex justify-content value
   */
  private getFlexJustify(position: 'left' | 'center' | 'right'): string {
    const map = { left: 'flex-start', center: 'center', right: 'flex-end' };
    return map[position];
  }

  /**
   * Generate print-specific styles
   */
  private generatePrintStyles(settings: RenderSettings): string {
    const { paper } = settings;

    return `
      @media print {
        @page {
          size: ${paper.width}mm ${paper.height}mm;
          margin: 0;
        }

        body {
          margin: 0;
          padding: 0;
        }

        .photo-print-container {
          padding: 0 !important;
          background: none !important;
          gap: 0 !important;
        }

        .photo-print-page {
          width: ${paper.width}mm !important;
          height: ${paper.height}mm !important;
          page-break-after: always;
          box-shadow: none !important;
          transform: none !important;
        }

        .photo-print-page:last-child {
          page-break-after: auto;
        }

        .photo-print-cell {
          border: none !important;
        }
      }
    `;
  }

  /**
   * Inject print styles into document
   */
  injectPrintStyles(settings: RenderSettings): void {
    this.removePrintStyles();

    this.printStyleElement = document.createElement('style');
    this.printStyleElement.id = 'photo-print-styles';
    this.printStyleElement.textContent = this.generatePrintStyles(settings);
    document.head.appendChild(this.printStyleElement);
  }

  /**
   * Remove print styles from document
   */
  removePrintStyles(): void {
    if (this.printStyleElement) {
      this.printStyleElement.remove();
      this.printStyleElement = null;
    }
  }

  /**
   * Create a print-ready document
   */
  createPrintDocument(pages: PageInfo[], settings: RenderSettings): HTMLElement {
    const container = this.render(pages, settings, {
      scale: 1,
      showPageBorder: false,
      showCellBorder: false
    });

    // Override container styles for printing
    Object.assign(container.style, {
      padding: '0',
      gap: '0',
      backgroundColor: 'transparent'
    });

    return container;
  }

  /**
   * Print the rendered content
   */
  async print(pages: PageInfo[], settings: RenderSettings): Promise<void> {
    // Create a hidden iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';

    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      throw new Error('Failed to access iframe document');
    }

    // Create print content
    const printContainer = this.createPrintDocument(pages, settings);

    // Write to iframe
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Photo Print</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            ${this.generatePrintStyles(settings)}
          </style>
        </head>
        <body>
          ${printContainer.outerHTML}
        </body>
      </html>
    `);
    iframeDoc.close();

    // Wait for images to load
    await this.waitForImagesToLoad(iframeDoc);

    // Print
    return new Promise((resolve, reject) => {
      iframe.contentWindow?.focus();

      try {
        iframe.contentWindow?.print();
        // Clean up after a delay
        setTimeout(() => {
          document.body.removeChild(iframe);
          resolve();
        }, 1000);
      } catch (error) {
        document.body.removeChild(iframe);
        reject(error);
      }
    });
  }

  /**
   * Wait for all images in a document to load
   */
  private waitForImagesToLoad(doc: Document): Promise<void> {
    const images = doc.querySelectorAll('img');
    const promises = Array.from(images).map(img => {
      if (img.complete) {
        return Promise.resolve();
      }
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve(); // Resolve even on error to not block
      });
    });

    return Promise.all(promises).then(() => {});
  }

  /**
   * Destroy the renderer and clean up
   */
  destroy(): void {
    this.removePrintStyles();
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }
}
