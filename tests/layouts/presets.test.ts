/**
 * Layout Presets Tests
 */

import { describe, it, expect } from 'vitest';
import {
  PRESET_LAYOUTS,
  PRESET_PAPER_SIZES,
  DEFAULT_LAYOUT,
  DEFAULT_PAPER_SIZE,
  DEFAULT_MARGINS,
  DEFAULT_IMAGE_SETTINGS,
  getLayoutById,
  getPaperSizeById
} from '../../src/layouts/presets';

describe('presets', () => {
  describe('PRESET_LAYOUTS', () => {
    it('should have all required layouts', () => {
      const requiredIds = ['full', '2x1', '1x2', '2x2', '3x3', '4x4', '4x5', 'wallet', '3.5x5', '4x6', '5x7'];

      requiredIds.forEach(id => {
        const layout = PRESET_LAYOUTS.find(l => l.id === id);
        expect(layout).toBeDefined();
        expect(layout?.id).toBe(id);
      });
    });

    it('should have valid grid configurations', () => {
      PRESET_LAYOUTS.forEach(layout => {
        expect(layout.grid.cols).toBeGreaterThan(0);
        expect(layout.grid.rows).toBeGreaterThan(0);
      });
    });

    it('should have name and id for each layout', () => {
      PRESET_LAYOUTS.forEach(layout => {
        expect(layout.id).toBeTruthy();
        expect(layout.name).toBeTruthy();
      });
    });
  });

  describe('PRESET_PAPER_SIZES', () => {
    it('should have all required paper sizes', () => {
      const requiredIds = ['a4', 'a5', 'a3', 'letter', 'legal', '4x6', '5x7'];

      requiredIds.forEach(id => {
        const paper = PRESET_PAPER_SIZES.find(p => p.id === id);
        expect(paper).toBeDefined();
        expect(paper?.id).toBe(id);
      });
    });

    it('should have valid dimensions', () => {
      PRESET_PAPER_SIZES.forEach(paper => {
        expect(paper.width).toBeGreaterThan(0);
        expect(paper.height).toBeGreaterThan(0);
      });
    });

    it('should have A4 as standard size (210x297mm)', () => {
      const a4 = PRESET_PAPER_SIZES.find(p => p.id === 'a4');
      expect(a4?.width).toBe(210);
      expect(a4?.height).toBe(297);
    });

    it('should have Letter as US standard (216x279mm)', () => {
      const letter = PRESET_PAPER_SIZES.find(p => p.id === 'letter');
      expect(letter?.width).toBe(216);
      expect(letter?.height).toBe(279);
    });
  });

  describe('DEFAULT_LAYOUT', () => {
    it('should be 2x2 layout', () => {
      expect(DEFAULT_LAYOUT.id).toBe('2x2');
      expect(DEFAULT_LAYOUT.grid.cols).toBe(2);
      expect(DEFAULT_LAYOUT.grid.rows).toBe(2);
    });
  });

  describe('DEFAULT_PAPER_SIZE', () => {
    it('should be A4', () => {
      expect(DEFAULT_PAPER_SIZE.id).toBe('a4');
      expect(DEFAULT_PAPER_SIZE.width).toBe(210);
      expect(DEFAULT_PAPER_SIZE.height).toBe(297);
    });
  });

  describe('DEFAULT_MARGINS', () => {
    it('should have 10mm margins all around', () => {
      expect(DEFAULT_MARGINS.top).toBe(10);
      expect(DEFAULT_MARGINS.right).toBe(10);
      expect(DEFAULT_MARGINS.bottom).toBe(10);
      expect(DEFAULT_MARGINS.left).toBe(10);
    });
  });

  describe('DEFAULT_IMAGE_SETTINGS', () => {
    it('should have cover fit mode', () => {
      expect(DEFAULT_IMAGE_SETTINGS.fit).toBe('cover');
    });

    it('should have centered position', () => {
      expect(DEFAULT_IMAGE_SETTINGS.position.horizontal).toBe('center');
      expect(DEFAULT_IMAGE_SETTINGS.position.vertical).toBe('center');
    });

    it('should have zero rotation', () => {
      expect(DEFAULT_IMAGE_SETTINGS.rotation).toBe(0);
    });
  });

  describe('getLayoutById', () => {
    it('should return layout for valid ID', () => {
      const layout = getLayoutById('2x2');
      expect(layout).toBeDefined();
      expect(layout?.id).toBe('2x2');
    });

    it('should return undefined for invalid ID', () => {
      const layout = getLayoutById('non-existent');
      expect(layout).toBeUndefined();
    });
  });

  describe('getPaperSizeById', () => {
    it('should return paper size for valid ID', () => {
      const paper = getPaperSizeById('a4');
      expect(paper).toBeDefined();
      expect(paper?.id).toBe('a4');
    });

    it('should return undefined for invalid ID', () => {
      const paper = getPaperSizeById('non-existent');
      expect(paper).toBeUndefined();
    });
  });
});
