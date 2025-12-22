/**
 * Helper Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import {
  generateId,
  mmToPx,
  pxToMm,
  inchToPx,
  pxToInch,
  mmToInch,
  inchToMm,
  clamp,
  deepMerge
} from '../../src/utils/helpers';

describe('helpers', () => {
  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it('should use custom prefix', () => {
      const id = generateId('custom');
      expect(id.startsWith('custom_')).toBe(true);
    });

    it('should use default prefix', () => {
      const id = generateId();
      expect(id.startsWith('img_')).toBe(true);
    });
  });

  describe('unit conversions', () => {
    it('should convert mm to px correctly', () => {
      expect(mmToPx(25.4, 96)).toBeCloseTo(96, 1);
      expect(mmToPx(50.8, 96)).toBeCloseTo(192, 1);
    });

    it('should convert px to mm correctly', () => {
      expect(pxToMm(96, 96)).toBeCloseTo(25.4, 1);
      expect(pxToMm(192, 96)).toBeCloseTo(50.8, 1);
    });

    it('should convert inch to px correctly', () => {
      expect(inchToPx(1, 96)).toBe(96);
      expect(inchToPx(2, 96)).toBe(192);
    });

    it('should convert px to inch correctly', () => {
      expect(pxToInch(96, 96)).toBe(1);
      expect(pxToInch(192, 96)).toBe(2);
    });

    it('should convert mm to inch correctly', () => {
      expect(mmToInch(25.4)).toBeCloseTo(1, 2);
      expect(mmToInch(50.8)).toBeCloseTo(2, 2);
    });

    it('should convert inch to mm correctly', () => {
      expect(inchToMm(1)).toBeCloseTo(25.4, 2);
      expect(inchToMm(2)).toBeCloseTo(50.8, 2);
    });

    it('should handle different DPI values', () => {
      expect(mmToPx(25.4, 72)).toBeCloseTo(72, 1);
      expect(mmToPx(25.4, 150)).toBeCloseTo(150, 1);
      expect(mmToPx(25.4, 300)).toBeCloseTo(300, 1);
    });
  });

  describe('clamp', () => {
    it('should clamp value within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('should handle edge cases', () => {
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
    });

    it('should handle negative ranges', () => {
      expect(clamp(-5, -10, 0)).toBe(-5);
      expect(clamp(-15, -10, 0)).toBe(-10);
    });
  });

  describe('deepMerge', () => {
    it('should merge simple objects', () => {
      const target = { a: 1, b: 2 };
      const source = { b: 3, c: 4 };
      const result = deepMerge(target, source);

      expect(result).toEqual({ a: 1, b: 3, c: 4 });
    });

    it('should merge nested objects', () => {
      const target = {
        level1: {
          a: 1,
          b: 2
        }
      };
      const source = {
        level1: {
          b: 3,
          c: 4
        }
      };
      const result = deepMerge(target, source);

      expect(result).toEqual({
        level1: {
          a: 1,
          b: 3,
          c: 4
        }
      });
    });

    it('should handle multiple sources', () => {
      const target = { a: 1 };
      const source1 = { b: 2 };
      const source2 = { c: 3 };
      const result = deepMerge(target, source1, source2);

      expect(result).toEqual({ a: 1, b: 2, c: 3 });
    });

    it('should not merge arrays', () => {
      const target = { arr: [1, 2, 3] };
      const source = { arr: [4, 5] };
      const result = deepMerge(target, source);

      expect(result.arr).toEqual([4, 5]);
    });

    it('should handle null and undefined', () => {
      const target = { a: 1, b: 2 };
      const source = { b: undefined, c: null };
      const result = deepMerge(target, source);

      expect(result.b).toBeUndefined();
      expect(result.c).toBeNull();
    });
  });
});
