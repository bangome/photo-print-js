/**
 * PhotoPrintLayout - Main class for the photo print layout library
 */

import type {
  PhotoPrintOptions,
  ImageSource,
  ImageInfo,
  ImageSettings,
  LayoutTemplate,
  PaperSettings,
  ResolvedPaperSettings,
  PaperMargins,
  PreviewOptions,
  PageInfo,
  EventType,
  EventCallback,
  PhotoPrintEvent,
  PaperSize
} from './types';

import { ImageProcessor } from './ImageProcessor';
import { LayoutEngine } from './LayoutEngine';
import { DOMRenderer } from '../renderers/DOMRenderer';
import {
  PRESET_LAYOUTS,
  PRESET_PAPER_SIZES,
  DEFAULT_LAYOUT,
  DEFAULT_PAPER_SIZE,
  DEFAULT_MARGINS,
  DEFAULT_IMAGE_SETTINGS,
  getLayoutById,
  getPaperSizeById
} from '../layouts/presets';
import { deepMerge, getElement } from '../utils/helpers';

export class PhotoPrintLayout {
  private imageProcessor: ImageProcessor;
  private layoutEngine: LayoutEngine;
  private domRenderer: DOMRenderer;

  private currentLayout: LayoutTemplate;
  private paperSettings: ResolvedPaperSettings;
  private imageSettings: ImageSettings;

  private previewContainer: HTMLElement | null = null;
  private previewOptions: PreviewOptions | null = null;

  private eventListeners: Map<EventType, Set<EventCallback>> = new Map();

  private debug: boolean;

  constructor(options: PhotoPrintOptions = {}) {
    this.debug = options.debug || false;

    // Initialize processors
    this.imageProcessor = new ImageProcessor();
    this.layoutEngine = new LayoutEngine();
    this.domRenderer = new DOMRenderer();

    // Set default layout
    this.currentLayout = this.resolveLayout(options.layout) || DEFAULT_LAYOUT;

    // Set paper settings
    this.paperSettings = this.resolvePaperSettings(options.paper);

    // Set image settings
    this.imageSettings = {
      ...DEFAULT_IMAGE_SETTINGS,
      ...options.imageSettings
    };

    // Load initial images if provided
    if (options.images && options.images.length > 0) {
      this.addImages(options.images);
    }

    // Setup preview if configured
    if (options.preview) {
      this.renderPreview(options.preview);
    }
  }

  // ============================================
  // Image Management
  // ============================================

  /**
   * Add a single image
   */
  async addImage(source: ImageSource | string): Promise<string> {
    try {
      const imageInfo = await this.imageProcessor.loadImage(source);
      this.emit('imageAdded', { image: imageInfo });
      this.updatePreviewIfNeeded();
      return imageInfo.id;
    } catch (error) {
      this.emit('error', { error, source });
      throw error;
    }
  }

  /**
   * Add multiple images
   */
  async addImages(sources: (ImageSource | string)[]): Promise<string[]> {
    const ids: string[] = [];

    for (const source of sources) {
      try {
        const id = await this.addImage(source);
        ids.push(id);
      } catch (error) {
        this.log('Failed to add image:', error);
      }
    }

    return ids;
  }

  /**
   * Remove an image by ID
   */
  removeImage(id: string): void {
    const image = this.imageProcessor.getImage(id);
    if (image) {
      this.imageProcessor.removeImage(id);
      this.emit('imageRemoved', { id, image });
      this.updatePreviewIfNeeded();
    }
  }

  /**
   * Reorder images
   */
  reorderImages(fromIndex: number, toIndex: number): void {
    this.imageProcessor.reorderImages(fromIndex, toIndex);
    this.emit('imagesReordered', { fromIndex, toIndex });
    this.updatePreviewIfNeeded();
  }

  /**
   * Clear all images
   */
  clearImages(): void {
    this.imageProcessor.clearImages();
    this.updatePreviewIfNeeded();
  }

  /**
   * Get all images
   */
  getImages(): ImageInfo[] {
    return this.imageProcessor.getAllImages();
  }

  // ============================================
  // Layout Management
  // ============================================

  /**
   * Set layout by ID or template
   */
  setLayout(layout: string | LayoutTemplate): void {
    const resolvedLayout = this.resolveLayout(layout);
    if (!resolvedLayout) {
      throw new Error(`Layout not found: ${layout}`);
    }

    this.currentLayout = resolvedLayout;
    this.emit('layoutChanged', { layout: this.currentLayout });
    this.updatePreviewIfNeeded();
  }

  /**
   * Get current layout
   */
  getLayout(): LayoutTemplate {
    return { ...this.currentLayout };
  }

  /**
   * Get available layouts (presets + custom)
   */
  getAvailableLayouts(): LayoutTemplate[] {
    return [...PRESET_LAYOUTS, ...this.layoutEngine.getCustomLayouts()];
  }

  /**
   * Register a custom layout
   */
  registerLayout(template: LayoutTemplate): void {
    this.layoutEngine.registerLayout(template);
  }

  // ============================================
  // Paper Settings
  // ============================================

  /**
   * Set paper settings
   */
  setPaper(settings: Partial<PaperSettings>): void {
    const currentSettings: PaperSettings = {
      size: this.paperSettings.width + 'x' + this.paperSettings.height,
      orientation: this.paperSettings.orientation,
      margins: this.paperSettings.margins,
      unit: this.paperSettings.unit
    };

    const merged = deepMerge({ ...currentSettings }, settings);
    this.paperSettings = this.resolvePaperSettings(merged);

    this.emit('paperChanged', { paper: this.paperSettings });
    this.updatePreviewIfNeeded();
  }

  /**
   * Get paper settings
   */
  getPaper(): ResolvedPaperSettings {
    return { ...this.paperSettings };
  }

  /**
   * Set paper size
   */
  setPaperSize(size: string | { width: number; height: number }): void {
    this.setPaper({ size });
  }

  /**
   * Set margins
   */
  setMargins(margins: number | Partial<PaperMargins>): void {
    if (typeof margins === 'number') {
      this.setPaper({
        margins: {
          top: margins,
          right: margins,
          bottom: margins,
          left: margins
        }
      });
    } else {
      this.setPaper({
        margins: {
          ...this.paperSettings.margins,
          ...margins
        }
      });
    }
  }

  // ============================================
  // Image Settings
  // ============================================

  /**
   * Set global image settings or settings for a specific image
   */
  setImageSettings(settingsOrId: Partial<ImageSettings> | string, settings?: Partial<ImageSettings>): void {
    if (typeof settingsOrId === 'string' && settings) {
      // Set individual image settings
      this.imageProcessor.updateImageSettings(settingsOrId, settings);
    } else if (typeof settingsOrId === 'object') {
      // Set global settings
      this.imageSettings = {
        ...this.imageSettings,
        ...settingsOrId as Partial<ImageSettings>
      };
    }

    this.emit('settingsChanged', { imageSettings: this.imageSettings });
    this.updatePreviewIfNeeded();
  }

  /**
   * Get image settings
   */
  getImageSettings(imageId?: string): ImageSettings {
    if (imageId) {
      const image = this.imageProcessor.getImage(imageId);
      if (image && image.settings) {
        return { ...this.imageSettings, ...image.settings };
      }
    }
    return { ...this.imageSettings };
  }

  // ============================================
  // Preview
  // ============================================

  /**
   * Render preview
   */
  renderPreview(options: PreviewOptions): void {
    const container = getElement(options.container);
    if (!container) {
      throw new Error('Preview container not found');
    }

    this.previewContainer = container;
    this.previewOptions = options;

    this.updatePreview();
  }

  /**
   * Update preview
   */
  updatePreview(): void {
    if (!this.previewContainer || !this.previewOptions) {
      return;
    }

    // Clear container
    this.previewContainer.innerHTML = '';

    // Get pages
    const pages = this.getPages();

    // Calculate scale to fit container
    const containerWidth = this.previewContainer.clientWidth || 400;
    const containerHeight = this.previewContainer.clientHeight || 600;

    const pageAspect = this.paperSettings.width / this.paperSettings.height;
    const containerAspect = containerWidth / containerHeight;

    let scale: number;
    if (pageAspect > containerAspect) {
      scale = (containerWidth - 40) / (this.paperSettings.width * 3.78); // mm to px approx
    } else {
      scale = (containerHeight - 40) / (this.paperSettings.height * 3.78);
    }

    scale = Math.min(scale, 1);

    // Render
    const theme = this.previewOptions.theme === 'auto' ? 'light' : this.previewOptions.theme;
    const rendered = this.domRenderer.render(pages, this.getRenderSettings(), {
      container: this.previewContainer,
      scale,
      showPageBorder: true,
      showCellBorder: false,
      theme
    });

    this.previewContainer.appendChild(rendered);

    // Add navigation if enabled
    if (this.previewOptions.showNavigation && pages.length > 1) {
      this.addPageNavigation(pages.length);
    }

    // Add page numbers if enabled
    if (this.previewOptions.showPageNumber) {
      this.addPageNumbers(pages.length);
    }
  }

  /**
   * Destroy preview
   */
  destroyPreview(): void {
    if (this.previewContainer) {
      this.previewContainer.innerHTML = '';
      this.previewContainer = null;
      this.previewOptions = null;
    }
  }

  /**
   * Update preview if needed
   */
  private updatePreviewIfNeeded(): void {
    if (this.previewContainer && this.previewOptions) {
      this.updatePreview();
    }
  }

  /**
   * Add page navigation
   */
  private addPageNavigation(pageCount: number): void {
    if (!this.previewContainer) return;

    const nav = document.createElement('div');
    nav.className = 'photo-print-navigation';
    nav.style.cssText = 'display: flex; justify-content: center; gap: 10px; margin-top: 10px;';

    const prevBtn = document.createElement('button');
    prevBtn.textContent = '<';
    prevBtn.className = 'photo-print-nav-btn';

    const pageInfo = document.createElement('span');
    pageInfo.textContent = `1 / ${pageCount}`;
    pageInfo.className = 'photo-print-page-info';

    const nextBtn = document.createElement('button');
    nextBtn.textContent = '>';
    nextBtn.className = 'photo-print-nav-btn';

    let currentPage = 0;
    const pages = this.previewContainer.querySelectorAll('.photo-print-page');

    const updateVisibility = () => {
      pages.forEach((page, index) => {
        (page as HTMLElement).style.display = index === currentPage ? 'block' : 'none';
      });
      pageInfo.textContent = `${currentPage + 1} / ${pageCount}`;
    };

    prevBtn.onclick = () => {
      currentPage = Math.max(0, currentPage - 1);
      updateVisibility();
    };

    nextBtn.onclick = () => {
      currentPage = Math.min(pageCount - 1, currentPage + 1);
      updateVisibility();
    };

    nav.appendChild(prevBtn);
    nav.appendChild(pageInfo);
    nav.appendChild(nextBtn);

    this.previewContainer.appendChild(nav);

    // Show only first page initially
    updateVisibility();
  }

  /**
   * Add page numbers
   */
  private addPageNumbers(pageCount: number): void {
    if (!this.previewContainer) return;

    const pages = this.previewContainer.querySelectorAll('.photo-print-page');
    pages.forEach((page, index) => {
      const pageNum = document.createElement('div');
      pageNum.className = 'photo-print-page-number';
      pageNum.textContent = `${index + 1} / ${pageCount}`;
      pageNum.style.cssText = 'position: absolute; bottom: 5px; right: 10px; font-size: 12px; color: #666;';
      page.appendChild(pageNum);
    });
  }

  // ============================================
  // Output
  // ============================================

  /**
   * Print
   */
  async print(): Promise<void> {
    this.emit('beforePrint', {});

    try {
      const pages = this.getPages();
      await this.domRenderer.print(pages, this.getRenderSettings());
      this.emit('afterPrint', { success: true });
    } catch (error) {
      this.emit('afterPrint', { success: false, error });
      throw error;
    }
  }

  /**
   * Get canvas for a page
   */
  async toCanvas(pageIndex = 0): Promise<HTMLCanvasElement> {
    const pages = this.getPages();
    const page = pages[pageIndex];

    if (!page) {
      throw new Error(`Page ${pageIndex} not found`);
    }

    const settings = this.getRenderSettings();
    const dpi = settings.dpi || 96;

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(this.paperSettings.width * (dpi / 25.4));
    canvas.height = Math.round(this.paperSettings.height * (dpi / 25.4));

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Fill with white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw each image in the page
    for (let i = 0; i < page.cells.length; i++) {
      const cell = page.cells[i];
      const image = page.images[i];

      if (!image) continue;

      const imageSettings = this.getImageSettings(image.id);
      const fit = this.layoutEngine.calculateImageFit(
        image,
        cell,
        imageSettings.fit,
        imageSettings.position
      );

      // Convert mm to pixels
      const x = fit.x * (dpi / 25.4);
      const y = fit.y * (dpi / 25.4);
      const width = fit.width * (dpi / 25.4);
      const height = fit.height * (dpi / 25.4);

      // Handle rotation
      if (imageSettings.rotation) {
        ctx.save();
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate((imageSettings.rotation * Math.PI) / 180);
        ctx.drawImage(image.element, -width / 2, -height / 2, width, height);
        ctx.restore();
      } else {
        ctx.drawImage(image.element, x, y, width, height);
      }
    }

    return canvas;
  }

  /**
   * Get data URL for a page
   */
  async toDataURL(pageIndex = 0, format: 'png' | 'jpeg' = 'png'): Promise<string> {
    const canvas = await this.toCanvas(pageIndex);
    return canvas.toDataURL(`image/${format}`, 0.92);
  }

  /**
   * Get blob for a page
   */
  async toBlob(pageIndex = 0, format: 'png' | 'jpeg' = 'png'): Promise<Blob> {
    const canvas = await this.toCanvas(pageIndex);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        `image/${format}`,
        0.92
      );
    });
  }

  // ============================================
  // Page Information
  // ============================================

  /**
   * Get page count
   */
  getPageCount(): number {
    return this.getPages().length;
  }

  /**
   * Get page info
   */
  getPageInfo(pageIndex: number): PageInfo | undefined {
    const pages = this.getPages();
    return pages[pageIndex];
  }

  /**
   * Get all pages
   */
  private getPages(): PageInfo[] {
    const images = this.imageProcessor.getAllImages();
    return this.layoutEngine.calculatePages(images, this.currentLayout, this.paperSettings);
  }

  /**
   * Get render settings
   */
  private getRenderSettings() {
    return {
      paper: this.paperSettings,
      layout: this.currentLayout,
      imageSettings: this.imageSettings,
      dpi: 96
    };
  }

  // ============================================
  // Events
  // ============================================

  /**
   * Add event listener
   */
  on<T = unknown>(event: EventType, callback: EventCallback<T>): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback as EventCallback);
  }

  /**
   * Remove event listener
   */
  off(event: EventType, callback?: EventCallback): void {
    if (callback) {
      this.eventListeners.get(event)?.delete(callback);
    } else {
      this.eventListeners.delete(event);
    }
  }

  /**
   * Add one-time event listener
   */
  once<T = unknown>(event: EventType, callback: EventCallback<T>): void {
    const wrapper: EventCallback<T> = (e) => {
      this.off(event, wrapper as EventCallback);
      callback(e);
    };
    this.on(event, wrapper);
  }

  /**
   * Emit event
   */
  private emit<T = unknown>(type: EventType, data?: T): void {
    const event: PhotoPrintEvent<T> = {
      type,
      data,
      timestamp: Date.now()
    };

    this.eventListeners.get(type)?.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        this.log('Event callback error:', error);
      }
    });
  }

  // ============================================
  // Utilities
  // ============================================

  /**
   * Reset to defaults
   */
  reset(): void {
    this.clearImages();
    this.currentLayout = DEFAULT_LAYOUT;
    this.paperSettings = this.resolvePaperSettings({});
    this.imageSettings = { ...DEFAULT_IMAGE_SETTINGS };
    this.updatePreviewIfNeeded();
  }

  /**
   * Destroy instance
   */
  destroy(): void {
    this.destroyPreview();
    this.clearImages();
    this.domRenderer.destroy();
    this.eventListeners.clear();
  }

  /**
   * Resolve layout from ID or template
   */
  private resolveLayout(layout?: string | LayoutTemplate): LayoutTemplate | null {
    if (!layout) {
      return null;
    }

    if (typeof layout === 'string') {
      return getLayoutById(layout) || this.layoutEngine.getCustomLayout(layout) || null;
    }

    return layout;
  }

  /**
   * Resolve paper settings
   */
  private resolvePaperSettings(settings?: Partial<PaperSettings>): ResolvedPaperSettings {
    let width = DEFAULT_PAPER_SIZE.width;
    let height = DEFAULT_PAPER_SIZE.height;

    if (settings?.size) {
      if (typeof settings.size === 'string') {
        const preset = getPaperSizeById(settings.size);
        if (preset) {
          width = preset.width;
          height = preset.height;
        }
      } else {
        width = settings.size.width;
        height = settings.size.height;
      }
    }

    const orientation = settings?.orientation || 'portrait';
    const unit = settings?.unit || 'mm';

    // Swap dimensions for landscape
    if (orientation === 'landscape' && width < height) {
      [width, height] = [height, width];
    } else if (orientation === 'portrait' && width > height) {
      [width, height] = [height, width];
    }

    const margins: PaperMargins = {
      ...DEFAULT_MARGINS,
      ...settings?.margins
    };

    return {
      width,
      height,
      orientation: orientation === 'auto' ? 'portrait' : orientation,
      margins,
      unit
    };
  }

  /**
   * Log debug message
   */
  private log(...args: unknown[]): void {
    if (this.debug) {
      console.log('[PhotoPrintLayout]', ...args);
    }
  }

  // ============================================
  // Static Methods
  // ============================================

  /**
   * Create instance from images
   */
  static fromImages(images: string[], layout = '2x2'): PhotoPrintLayout {
    return new PhotoPrintLayout({
      images,
      layout
    });
  }

  /**
   * Get preset layouts
   */
  static getPresetLayouts(): LayoutTemplate[] {
    return [...PRESET_LAYOUTS];
  }

  /**
   * Get paper sizes
   */
  static getPaperSizes(): PaperSize[] {
    return [...PRESET_PAPER_SIZES];
  }
}
