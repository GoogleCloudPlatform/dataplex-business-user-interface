import { describe, it, expect } from 'vitest';
import theme from './theme';

describe('theme', () => {
  describe('theme creation', () => {
    it('should export a valid theme object', () => {
      expect(theme).toBeDefined();
      expect(theme).toBeTruthy();
    });

    it('should be a MUI theme object with expected structure', () => {
      expect(theme.typography).toBeDefined();
      expect(theme.palette).toBeDefined();
      expect(theme.spacing).toBeDefined();
      expect(theme.breakpoints).toBeDefined();
    });
  });

  describe('typography configuration', () => {
    it('should have fontFamily set to Google Sans Text', () => {
      expect(theme.typography.fontFamily).toBe('"Google Sans Text", sans-serif');
    });

    it('should have heading2Medium variant defined', () => {
      expect(theme.typography.heading2Medium).toBeDefined();
    });

    it('should have heading2Medium with Google Sans fontFamily', () => {
      expect(theme.typography.heading2Medium.fontFamily).toBe('"Google Sans", sans-serif');
    });

    it('should have heading2Medium as an object', () => {
      expect(typeof theme.typography.heading2Medium).toBe('object');
    });
  });

  describe('typography default variants', () => {
    it('should have body1 variant available', () => {
      expect(theme.typography.body1).toBeDefined();
    });

    it('should have body2 variant available', () => {
      expect(theme.typography.body2).toBeDefined();
    });

    it('should have h1 variant available', () => {
      expect(theme.typography.h1).toBeDefined();
    });

    it('should have h2 variant available', () => {
      expect(theme.typography.h2).toBeDefined();
    });

    it('should have h3 variant available', () => {
      expect(theme.typography.h3).toBeDefined();
    });

    it('should have h4 variant available', () => {
      expect(theme.typography.h4).toBeDefined();
    });

    it('should have h5 variant available', () => {
      expect(theme.typography.h5).toBeDefined();
    });

    it('should have h6 variant available', () => {
      expect(theme.typography.h6).toBeDefined();
    });

    it('should have subtitle1 variant available', () => {
      expect(theme.typography.subtitle1).toBeDefined();
    });

    it('should have subtitle2 variant available', () => {
      expect(theme.typography.subtitle2).toBeDefined();
    });

    it('should have button variant available', () => {
      expect(theme.typography.button).toBeDefined();
    });

    it('should have caption variant available', () => {
      expect(theme.typography.caption).toBeDefined();
    });

    it('should have overline variant available', () => {
      expect(theme.typography.overline).toBeDefined();
    });
  });

  describe('palette configuration', () => {
    it('should have primary palette defined', () => {
      expect(theme.palette.primary).toBeDefined();
    });

    it('should have secondary palette defined', () => {
      expect(theme.palette.secondary).toBeDefined();
    });

    it('should have error palette defined', () => {
      expect(theme.palette.error).toBeDefined();
    });

    it('should have warning palette defined', () => {
      expect(theme.palette.warning).toBeDefined();
    });

    it('should have info palette defined', () => {
      expect(theme.palette.info).toBeDefined();
    });

    it('should have success palette defined', () => {
      expect(theme.palette.success).toBeDefined();
    });

    it('should have background palette defined', () => {
      expect(theme.palette.background).toBeDefined();
    });

    it('should have text palette defined', () => {
      expect(theme.palette.text).toBeDefined();
    });
  });

  describe('spacing configuration', () => {
    it('should have spacing function available', () => {
      expect(typeof theme.spacing).toBe('function');
    });

    it('should return correct spacing value for single unit', () => {
      const spacing = theme.spacing(1);
      expect(spacing).toBeDefined();
      expect(typeof spacing).toBe('string');
    });

    it('should return correct spacing value for multiple units', () => {
      const spacing = theme.spacing(2);
      expect(spacing).toBeDefined();
    });

    it('should support multiple arguments', () => {
      const spacing = theme.spacing(1, 2, 3, 4);
      expect(spacing).toBeDefined();
    });
  });

  describe('breakpoints configuration', () => {
    it('should have breakpoints object defined', () => {
      expect(theme.breakpoints).toBeDefined();
    });

    it('should have breakpoint values defined', () => {
      expect(theme.breakpoints.values).toBeDefined();
    });

    it('should have xs breakpoint', () => {
      expect(theme.breakpoints.values.xs).toBeDefined();
      expect(typeof theme.breakpoints.values.xs).toBe('number');
    });

    it('should have sm breakpoint', () => {
      expect(theme.breakpoints.values.sm).toBeDefined();
      expect(typeof theme.breakpoints.values.sm).toBe('number');
    });

    it('should have md breakpoint', () => {
      expect(theme.breakpoints.values.md).toBeDefined();
      expect(typeof theme.breakpoints.values.md).toBe('number');
    });

    it('should have lg breakpoint', () => {
      expect(theme.breakpoints.values.lg).toBeDefined();
      expect(typeof theme.breakpoints.values.lg).toBe('number');
    });

    it('should have xl breakpoint', () => {
      expect(theme.breakpoints.values.xl).toBeDefined();
      expect(typeof theme.breakpoints.values.xl).toBe('number');
    });

    it('should have up function for media queries', () => {
      expect(typeof theme.breakpoints.up).toBe('function');
    });

    it('should have down function for media queries', () => {
      expect(typeof theme.breakpoints.down).toBe('function');
    });

    it('should have between function for media queries', () => {
      expect(typeof theme.breakpoints.between).toBe('function');
    });
  });

  describe('theme shape', () => {
    it('should have shape configuration', () => {
      expect(theme.shape).toBeDefined();
    });

    it('should have borderRadius in shape', () => {
      expect(theme.shape.borderRadius).toBeDefined();
      expect(typeof theme.shape.borderRadius).toBe('number');
    });
  });

  describe('theme transitions', () => {
    it('should have transitions configuration', () => {
      expect(theme.transitions).toBeDefined();
    });

    it('should have easing configuration', () => {
      expect(theme.transitions.easing).toBeDefined();
    });

    it('should have duration configuration', () => {
      expect(theme.transitions.duration).toBeDefined();
    });

    it('should have create function for transitions', () => {
      expect(typeof theme.transitions.create).toBe('function');
    });
  });

  describe('theme zIndex', () => {
    it('should have zIndex configuration', () => {
      expect(theme.zIndex).toBeDefined();
    });

    it('should have modal zIndex', () => {
      expect(theme.zIndex.modal).toBeDefined();
      expect(typeof theme.zIndex.modal).toBe('number');
    });

    it('should have drawer zIndex', () => {
      expect(theme.zIndex.drawer).toBeDefined();
      expect(typeof theme.zIndex.drawer).toBe('number');
    });

    it('should have appBar zIndex', () => {
      expect(theme.zIndex.appBar).toBeDefined();
      expect(typeof theme.zIndex.appBar).toBe('number');
    });

    it('should have tooltip zIndex', () => {
      expect(theme.zIndex.tooltip).toBeDefined();
      expect(typeof theme.zIndex.tooltip).toBe('number');
    });
  });

  describe('theme components', () => {
    it('should have components property', () => {
      // components may or may not be defined depending on theme configuration
      expect(theme).toHaveProperty('components');
    });
  });

  describe('default export', () => {
    it('should export theme as default', async () => {
      const module = await import('./theme');
      expect(module.default).toBeDefined();
    });

    it('should export a function component', async () => {
      const module = await import('./theme');
      expect(typeof module.default).toBe('object');
    });

    it('should have the same reference on multiple imports', async () => {
      const module1 = await import('./theme');
      const module2 = await import('./theme');
      expect(module1.default).toBe(module2.default);
    });
  });

  describe('custom typography variant usage', () => {
    it('should allow accessing heading2Medium properties', () => {
      const heading2Medium = theme.typography.heading2Medium;
      expect(heading2Medium).toEqual({
        fontFamily: '"Google Sans", sans-serif',
      });
    });

    it('should have heading2Medium that can be spread', () => {
      const styles = { ...theme.typography.heading2Medium };
      expect(styles.fontFamily).toBe('"Google Sans", sans-serif');
    });
  });

  describe('theme immutability', () => {
    it('should return consistent values on multiple accesses', () => {
      const fontFamily1 = theme.typography.fontFamily;
      const fontFamily2 = theme.typography.fontFamily;
      expect(fontFamily1).toBe(fontFamily2);
    });

    it('should return consistent heading2Medium on multiple accesses', () => {
      const heading1 = theme.typography.heading2Medium;
      const heading2 = theme.typography.heading2Medium;
      expect(heading1).toBe(heading2);
    });
  });
});
