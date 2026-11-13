import { describe, it, expect } from 'vitest';
import {
  getButtonClasses,
  getInputClasses,
  getSwitchClasses,
  getCalloutClasses,
  getStatCardClasses,
} from './uiVariants';

describe('UI Variants & Class Generators', () => {
  describe('getButtonClasses', () => {
    it('returns primary variant by default with base classes', () => {
      const cls = getButtonClasses({});
      expect(cls).toContain('bg-blue-600');
      expect(cls).toContain('text-white');
      expect(cls).toContain('rounded-xl');
      expect(cls).toContain('cursor-pointer');
    });

    it('returns secondary and danger variants correctly', () => {
      const secondary = getButtonClasses({ variant: 'secondary' });
      expect(secondary).toContain('bg-gray-100');
      expect(secondary).toContain('dark:bg-gray-800');

      const danger = getButtonClasses({ variant: 'danger' });
      expect(danger).toContain('bg-red-500');
    });

    it('handles size classes correctly', () => {
      const sm = getButtonClasses({ size: 'sm' });
      expect(sm).toContain('text-xs');
      expect(sm).toContain('px-2.5');

      const lg = getButtonClasses({ size: 'lg' });
      expect(lg).toContain('text-sm');
      expect(lg).toContain('px-4');
    });

    it('adds disabled and loading styling when appropriate', () => {
      const disabled = getButtonClasses({ disabled: true });
      expect(disabled).toContain('disabled:opacity-40');
      expect(disabled).toContain('disabled:cursor-not-allowed');

      const fullWidth = getButtonClasses({ fullWidth: true });
      expect(fullWidth).toContain('w-full');
    });
  });

  describe('getInputClasses', () => {
    it('generates standard input styling with focus ring', () => {
      const cls = getInputClasses({});
      expect(cls).toContain('rounded-xl');
      expect(cls).toContain('border-gray-200');
      expect(cls).toContain('focus:ring-blue-500');
    });

    it('adjusts padding for leftIcon and rightElement', () => {
      const withLeft = getInputClasses({ hasLeftIcon: true });
      expect(withLeft).toContain('pl-9');

      const withRight = getInputClasses({ hasRightElement: true });
      expect(withRight).toContain('pr-8');
    });

    it('applies error styling when hasError is true', () => {
      const err = getInputClasses({ hasError: true });
      expect(err).toContain('border-red-500');
      expect(err).toContain('focus:ring-red-500');
    });
  });

  describe('getSwitchClasses', () => {
    it('generates track and thumb classes based on checked state', () => {
      const off = getSwitchClasses({ checked: false });
      expect(off.track).toContain('bg-gray-200');
      expect(off.thumb).toContain('translate-x-0.5');

      const on = getSwitchClasses({ checked: true });
      expect(on.track).toContain('bg-blue-600');
      expect(on.thumb).toContain('translate-x-[1.125rem]');
    });
  });

  describe('getCalloutClasses', () => {
    it('applies correct background, border and text styles per variant', () => {
      const info = getCalloutClasses({ variant: 'info' });
      expect(info.container).toContain('bg-blue-50');

      const warning = getCalloutClasses({ variant: 'warning' });
      expect(warning.container).toContain('bg-amber-50');

      const error = getCalloutClasses({ variant: 'error' });
      expect(error.container).toContain('bg-red-50');

      const success = getCalloutClasses({ variant: 'success' });
      expect(success.container).toContain('bg-emerald-50');
    });
  });

  describe('getStatCardClasses', () => {
    it('applies color theme classes to stat cards', () => {
      const emerald = getStatCardClasses({ color: 'emerald' });
      expect(emerald.container).toContain('bg-emerald-50');
      expect(emerald.value).toContain('text-emerald-600');

      const rose = getStatCardClasses({ color: 'rose' });
      expect(rose.container).toContain('bg-rose-50');
      expect(rose.value).toContain('text-rose-600');
    });
  });
});
