import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useColumnResize } from './useColumnResize';

describe('useColumnResize', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  });

  const defaultColumns = [
    { key: 'name', initialWidth: 200, minWidth: 80 },
    { key: 'type', initialWidth: 150, minWidth: 60 },
    { key: 'mode', initialWidth: 150, minWidth: 60 },
  ];

  describe('Initial State', () => {
    it('initializes column widths from config', () => {
      const { result } = renderHook(() =>
        useColumnResize({ columns: defaultColumns, mode: 'coupled' })
      );

      expect(result.current.columnWidths).toEqual([200, 150, 150]);
    });

    it('initializes activeIndex as null', () => {
      const { result } = renderHook(() =>
        useColumnResize({ columns: defaultColumns, mode: 'coupled' })
      );

      expect(result.current.activeIndex).toBeNull();
    });

    it('uses default minWidth of 50 when not specified', () => {
      const columns = [
        { key: 'a', initialWidth: 100 },
        { key: 'b', initialWidth: 100 },
      ];
      const { result } = renderHook(() =>
        useColumnResize({ columns, mode: 'coupled' })
      );

      expect(result.current.columnWidths).toEqual([100, 100]);
    });
  });

  describe('Coupled Mode', () => {
    it('sets activeIndex on mousedown', () => {
      const { result } = renderHook(() =>
        useColumnResize({ columns: defaultColumns, mode: 'coupled' })
      );

      act(() => {
        result.current.handleMouseDown(0, {
          clientX: 200,
          preventDefault: vi.fn(),
        } as any);
      });

      expect(result.current.activeIndex).toBe(0);
    });

    it('adjusts adjacent column inversely on drag', () => {
      const { result } = renderHook(() =>
        useColumnResize({ columns: defaultColumns, mode: 'coupled' })
      );

      // Start drag on column 0
      act(() => {
        result.current.handleMouseDown(0, {
          clientX: 200,
          preventDefault: vi.fn(),
        } as any);
      });

      // Move mouse 50px to the right
      act(() => {
        document.dispatchEvent(new MouseEvent('mousemove', { clientX: 250 }));
      });

      expect(result.current.columnWidths[0]).toBe(250); // 200 + 50
      expect(result.current.columnWidths[1]).toBe(100); // 150 - 50
      expect(result.current.columnWidths[2]).toBe(150); // unchanged
    });

    it('enforces minimum width on dragged column', () => {
      const { result } = renderHook(() =>
        useColumnResize({ columns: defaultColumns, mode: 'coupled' })
      );

      act(() => {
        result.current.handleMouseDown(0, {
          clientX: 200,
          preventDefault: vi.fn(),
        } as any);
      });

      // Drag far to the left (try to shrink below minWidth of 80)
      act(() => {
        document.dispatchEvent(new MouseEvent('mousemove', { clientX: 0 }));
      });

      expect(result.current.columnWidths[0]).toBe(80); // clamped to minWidth
      expect(result.current.columnWidths[1]).toBe(270); // absorbs the difference
    });

    it('enforces minimum width on adjacent column', () => {
      const { result } = renderHook(() =>
        useColumnResize({ columns: defaultColumns, mode: 'coupled' })
      );

      act(() => {
        result.current.handleMouseDown(0, {
          clientX: 200,
          preventDefault: vi.fn(),
        } as any);
      });

      // Drag far to the right (try to shrink adjacent below minWidth of 60)
      act(() => {
        document.dispatchEvent(new MouseEvent('mousemove', { clientX: 400 }));
      });

      expect(result.current.columnWidths[0]).toBe(290); // 200 + (150-60)
      expect(result.current.columnWidths[1]).toBe(60); // clamped to minWidth
    });

    it('clears activeIndex on mouseup', () => {
      const { result } = renderHook(() =>
        useColumnResize({ columns: defaultColumns, mode: 'coupled' })
      );

      act(() => {
        result.current.handleMouseDown(0, {
          clientX: 200,
          preventDefault: vi.fn(),
        } as any);
      });

      expect(result.current.activeIndex).toBe(0);

      act(() => {
        document.dispatchEvent(new MouseEvent('mouseup'));
      });

      expect(result.current.activeIndex).toBeNull();
    });

    it('sets userSelect none during drag and restores on mouseup', () => {
      const { result } = renderHook(() =>
        useColumnResize({ columns: defaultColumns, mode: 'coupled' })
      );

      act(() => {
        result.current.handleMouseDown(0, {
          clientX: 200,
          preventDefault: vi.fn(),
        } as any);
      });

      expect(document.body.style.userSelect).toBe('none');
      expect(document.body.style.cursor).toBe('col-resize');

      act(() => {
        document.dispatchEvent(new MouseEvent('mouseup'));
      });

      expect(document.body.style.userSelect).toBe('');
      expect(document.body.style.cursor).toBe('');
    });
  });

  describe('Flex Mode', () => {
    it('only changes the dragged column width', () => {
      const { result } = renderHook(() =>
        useColumnResize({ columns: defaultColumns, mode: 'flex' })
      );

      act(() => {
        result.current.handleMouseDown(0, {
          clientX: 200,
          preventDefault: vi.fn(),
        } as any);
      });

      act(() => {
        document.dispatchEvent(new MouseEvent('mousemove', { clientX: 250 }));
      });

      expect(result.current.columnWidths[0]).toBe(250); // 200 + 50
      expect(result.current.columnWidths[1]).toBe(150); // unchanged
      expect(result.current.columnWidths[2]).toBe(150); // unchanged
    });

    it('enforces minimum width in flex mode', () => {
      const { result } = renderHook(() =>
        useColumnResize({ columns: defaultColumns, mode: 'flex' })
      );

      act(() => {
        result.current.handleMouseDown(0, {
          clientX: 200,
          preventDefault: vi.fn(),
        } as any);
      });

      act(() => {
        document.dispatchEvent(new MouseEvent('mousemove', { clientX: 0 }));
      });

      expect(result.current.columnWidths[0]).toBe(80); // clamped to minWidth
    });
  });

  describe('setColumnWidths', () => {
    it('allows external width updates', () => {
      const { result } = renderHook(() =>
        useColumnResize({ columns: defaultColumns, mode: 'coupled' })
      );

      act(() => {
        result.current.setColumnWidths([300, 200, 100]);
      });

      expect(result.current.columnWidths).toEqual([300, 200, 100]);
    });
  });
});
