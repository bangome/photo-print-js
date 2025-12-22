/**
 * Common helper utilities
 */

/**
 * Generate a unique ID
 */
export function generateId(prefix = 'img'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Convert millimeters to pixels
 */
export function mmToPx(mm: number, dpi = 96): number {
  return (mm / 25.4) * dpi;
}

/**
 * Convert pixels to millimeters
 */
export function pxToMm(px: number, dpi = 96): number {
  return (px / dpi) * 25.4;
}

/**
 * Convert inches to pixels
 */
export function inchToPx(inch: number, dpi = 96): number {
  return inch * dpi;
}

/**
 * Convert pixels to inches
 */
export function pxToInch(px: number, dpi = 96): number {
  return px / dpi;
}

/**
 * Convert millimeters to inches
 */
export function mmToInch(mm: number): number {
  return mm / 25.4;
}

/**
 * Convert inches to millimeters
 */
export function inchToMm(inch: number): number {
  return inch * 25.4;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Deep merge objects
 */
export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  ...sources: Partial<T>[]
): T {
  if (!sources.length) return target;

  const source = sources.shift();
  if (source === undefined) return target;

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const sourceValue = source[key];
        if (isObject(sourceValue)) {
          if (!target[key]) {
            Object.assign(target, { [key]: {} });
          }
          deepMerge(
            target[key] as Record<string, unknown>,
            sourceValue as Record<string, unknown>
          );
        } else {
          Object.assign(target, { [key]: sourceValue });
        }
      }
    }
  }

  return deepMerge(target, ...sources);
}

/**
 * Check if value is a plain object
 */
function isObject(item: unknown): item is Record<string, unknown> {
  return item !== null && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Check if running in browser
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Get element from selector or element
 */
export function getElement(target: HTMLElement | string): HTMLElement | null {
  if (typeof target === 'string') {
    return document.querySelector(target);
  }
  return target;
}

/**
 * Create element with attributes
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes?: Record<string, string>,
  styles?: Partial<CSSStyleDeclaration>
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);

  if (attributes) {
    for (const [key, value] of Object.entries(attributes)) {
      element.setAttribute(key, value);
    }
  }

  if (styles) {
    Object.assign(element.style, styles);
  }

  return element;
}
