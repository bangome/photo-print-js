/**
 * Image Processor - Handles loading and processing of various image formats
 */

import type { ImageSource, ImageInfo, ImageSettings } from './types';
import { generateId } from '../utils/helpers';

export class ImageProcessor {
  private images: Map<string, ImageInfo> = new Map();

  /**
   * Load an image from various sources
   */
  async loadImage(source: ImageSource | string): Promise<ImageInfo> {
    const normalizedSource = this.normalizeSource(source);
    const id = normalizedSource.id || generateId();

    const element = await this.createImageElement(normalizedSource);

    const imageInfo: ImageInfo = {
      id,
      source: normalizedSource,
      element,
      width: element.naturalWidth,
      height: element.naturalHeight,
      aspectRatio: element.naturalWidth / element.naturalHeight,
      caption: normalizedSource.caption
    };

    this.images.set(id, imageInfo);
    return imageInfo;
  }

  /**
   * Load multiple images
   */
  async loadImages(sources: (ImageSource | string)[]): Promise<ImageInfo[]> {
    const results = await Promise.all(
      sources.map(source => this.loadImage(source))
    );
    return results;
  }

  /**
   * Get image by ID
   */
  getImage(id: string): ImageInfo | undefined {
    return this.images.get(id);
  }

  /**
   * Get all images
   */
  getAllImages(): ImageInfo[] {
    return Array.from(this.images.values());
  }

  /**
   * Remove image by ID
   */
  removeImage(id: string): boolean {
    const image = this.images.get(id);
    if (image) {
      // Clean up the image element
      image.element.src = '';
      this.images.delete(id);
      return true;
    }
    return false;
  }

  /**
   * Clear all images
   */
  clearImages(): void {
    this.images.forEach(image => {
      image.element.src = '';
    });
    this.images.clear();
  }

  /**
   * Reorder images
   */
  reorderImages(fromIndex: number, toIndex: number): void {
    const imagesArray = this.getAllImages();

    if (fromIndex < 0 || fromIndex >= imagesArray.length ||
        toIndex < 0 || toIndex >= imagesArray.length) {
      throw new Error('Invalid index for reordering');
    }

    const [movedImage] = imagesArray.splice(fromIndex, 1);
    imagesArray.splice(toIndex, 0, movedImage);

    // Rebuild the map in new order
    this.images.clear();
    imagesArray.forEach(img => {
      this.images.set(img.id, img);
    });
  }

  /**
   * Update image settings
   */
  updateImageSettings(id: string, settings: Partial<ImageSettings>): void {
    const image = this.images.get(id);
    if (image) {
      image.settings = {
        ...image.settings,
        ...settings
      };
    }
  }

  /**
   * Get image count
   */
  get count(): number {
    return this.images.size;
  }

  /**
   * Normalize source to ImageSource object
   */
  private normalizeSource(source: ImageSource | string): ImageSource {
    if (typeof source === 'string') {
      // Detect source type from string
      if (source.startsWith('data:')) {
        return { type: 'base64', data: source };
      }
      return { type: 'url', data: source };
    }
    return source;
  }

  /**
   * Create HTMLImageElement from source
   */
  private async createImageElement(source: ImageSource): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${this.getSourceDescription(source)}`));

      // Handle different source types
      switch (source.type) {
        case 'url':
          img.crossOrigin = 'anonymous';
          img.src = source.data as string;
          break;

        case 'base64':
          img.src = source.data as string;
          break;

        case 'file':
          this.loadFromFile(source.data as File)
            .then(dataUrl => {
              img.src = dataUrl;
            })
            .catch(reject);
          break;

        case 'blob':
          this.loadFromBlob(source.data as Blob)
            .then(dataUrl => {
              img.src = dataUrl;
            })
            .catch(reject);
          break;

        case 'element':
          const srcElement = source.data as HTMLImageElement;
          if (srcElement.complete && srcElement.naturalWidth > 0) {
            // Clone the element
            img.src = srcElement.src;
          } else {
            // Wait for the source element to load
            srcElement.onload = () => {
              img.src = srcElement.src;
            };
            srcElement.onerror = () => reject(new Error('Source image element failed to load'));
          }
          break;

        default:
          reject(new Error(`Unsupported image source type: ${source.type}`));
      }
    });
  }

  /**
   * Load image from File object
   */
  private loadFromFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Load image from Blob object
   */
  private loadFromBlob(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read blob'));
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Get description of source for error messages
   */
  private getSourceDescription(source: ImageSource): string {
    switch (source.type) {
      case 'url':
        return source.data as string;
      case 'file':
        return (source.data as File).name;
      case 'base64':
        return 'base64 data';
      case 'blob':
        return 'blob data';
      case 'element':
        return 'HTMLImageElement';
      default:
        return 'unknown source';
    }
  }

  /**
   * Create a resized version of an image
   */
  async resizeImage(
    image: ImageInfo,
    maxWidth: number,
    maxHeight: number
  ): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    let { width, height } = image;

    // Calculate scale to fit within max dimensions
    const scale = Math.min(maxWidth / width, maxHeight / height, 1);

    width = Math.round(width * scale);
    height = Math.round(height * scale);

    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(image.element, 0, 0, width, height);

    return canvas;
  }

  /**
   * Get image as data URL
   */
  async getImageAsDataURL(
    image: ImageInfo,
    format: 'image/png' | 'image/jpeg' = 'image/png',
    quality = 0.92
  ): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image.element, 0, 0);

    return canvas.toDataURL(format, quality);
  }
}
