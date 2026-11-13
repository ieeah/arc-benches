import { describe, it, expect } from 'vitest';
import {
  computeScrollableState,
  computeFadeMask,
} from '@/lib/scrollableFade';

describe('ScrollableFadeContainer logic', () => {
  describe('computeScrollableState', () => {
    it('returns not scrollable when content fits container width', () => {
      const state = computeScrollableState({
        scrollLeft: 0,
        scrollWidth: 300,
        clientWidth: 300,
      });

      expect(state.isScrollable).toBe(false);
      expect(state.showLeftFade).toBe(false);
      expect(state.showRightFade).toBe(false);
    });

    it('returns not scrollable when content is smaller than container width', () => {
      const state = computeScrollableState({
        scrollLeft: 0,
        scrollWidth: 200,
        clientWidth: 350,
      });

      expect(state.isScrollable).toBe(false);
      expect(state.showLeftFade).toBe(false);
      expect(state.showRightFade).toBe(false);
    });

    it('detects overflow to the right at scroll start', () => {
      const state = computeScrollableState({
        scrollLeft: 0,
        scrollWidth: 800,
        clientWidth: 300,
      });

      expect(state.isScrollable).toBe(true);
      expect(state.showLeftFade).toBe(false);
      expect(state.showRightFade).toBe(true);
    });

    it('detects overflow to both sides when scrolled in the middle', () => {
      const state = computeScrollableState({
        scrollLeft: 200,
        scrollWidth: 800,
        clientWidth: 300,
      });

      expect(state.isScrollable).toBe(true);
      expect(state.showLeftFade).toBe(true);
      expect(state.showRightFade).toBe(true);
    });

    it('detects overflow only to the left when reached the end', () => {
      // scrollWidth (800) - clientWidth (300) = 500 max scrollLeft
      const state = computeScrollableState({
        scrollLeft: 500,
        scrollWidth: 800,
        clientWidth: 300,
      });

      expect(state.isScrollable).toBe(true);
      expect(state.showLeftFade).toBe(true);
      expect(state.showRightFade).toBe(false);
    });

    it('tolerates sub-pixel differences within threshold', () => {
      // scrollLeft is 1px (> 0 but <= threshold 2)
      const stateStart = computeScrollableState(
        { scrollLeft: 1.5, scrollWidth: 800, clientWidth: 300 },
        2,
      );
      expect(stateStart.showLeftFade).toBe(false);

      // scrollLeft is 499px (500 - 499 = 1px, <= threshold 2)
      const stateEnd = computeScrollableState(
        { scrollLeft: 499, scrollWidth: 800, clientWidth: 300 },
        2,
      );
      expect(stateEnd.showRightFade).toBe(false);
    });
  });

  describe('computeFadeMask', () => {
    it('returns empty style when not scrollable', () => {
      const style = computeFadeMask({
        isScrollable: false,
        showLeftFade: false,
        showRightFade: false,
        fadeWidth: 24,
      });

      expect(style).toEqual({});
    });

    it('returns empty style when scrollable but neither fade is active', () => {
      const style = computeFadeMask({
        isScrollable: true,
        showLeftFade: false,
        showRightFade: false,
        fadeWidth: 24,
      });

      expect(style).toEqual({});
    });

    it('returns right fade mask when content overflows to the right', () => {
      const style = computeFadeMask({
        isScrollable: true,
        showLeftFade: false,
        showRightFade: true,
        fadeWidth: 24,
      });

      expect(style.maskImage).toBe(
        'linear-gradient(to right, black 0px, black calc(100% - 24px), transparent 100%)',
      );
      expect(style.WebkitMaskImage).toBe(
        'linear-gradient(to right, black 0px, black calc(100% - 24px), transparent 100%)',
      );
    });

    it('returns left fade mask when content overflows to the left', () => {
      const style = computeFadeMask({
        isScrollable: true,
        showLeftFade: true,
        showRightFade: false,
        fadeWidth: 30,
      });

      expect(style.maskImage).toBe(
        'linear-gradient(to right, transparent 0px, black 30px, black 100%)',
      );
      expect(style.WebkitMaskImage).toBe(
        'linear-gradient(to right, transparent 0px, black 30px, black 100%)',
      );
    });

    it('returns dual fade mask when content overflows both sides', () => {
      const style = computeFadeMask({
        isScrollable: true,
        showLeftFade: true,
        showRightFade: true,
        fadeWidth: 20,
      });

      expect(style.maskImage).toBe(
        'linear-gradient(to right, transparent 0px, black 20px, black calc(100% - 20px), transparent 100%)',
      );
      expect(style.WebkitMaskImage).toBe(
        'linear-gradient(to right, transparent 0px, black 20px, black calc(100% - 20px), transparent 100%)',
      );
    });
  });
});
