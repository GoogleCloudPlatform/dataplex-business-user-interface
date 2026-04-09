import { useState, useRef, useCallback, useEffect } from 'react';

export interface ColumnConfig {
  key: string;
  initialWidth: number;
  minWidth?: number;
}

export interface UseColumnResizeOptions {
  columns: ColumnConfig[];
  mode: 'coupled' | 'flex';
}

export interface UseColumnResizeReturn {
  columnWidths: number[];
  activeIndex: number | null;
  handleMouseDown: (index: number, e: React.MouseEvent) => void;
  setColumnWidths: React.Dispatch<React.SetStateAction<number[]>>;
}

const DEFAULT_MIN_WIDTH = 50;

export function useColumnResize({ columns, mode }: UseColumnResizeOptions): UseColumnResizeReturn {
  const [columnWidths, setColumnWidths] = useState<number[]>(
    () => columns.map(c => c.initialWidth)
  );

  useEffect(() => {
    setColumnWidths(columns.map(c => c.initialWidth));
  }, [columns.length]);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const startXRef = useRef(0);
  const startWidthsRef = useRef<number[]>([]);
  const activeIndexRef = useRef<number | null>(null);
  const columnsRef = useRef(columns);
  columnsRef.current = columns;

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const index = activeIndexRef.current;
    if (index === null) return;

    const delta = e.clientX - startXRef.current;
    const startWidths = startWidthsRef.current;
    const cols = columnsRef.current;

    if (mode === 'coupled') {
      const nextIndex = index + 1;
      if (nextIndex >= startWidths.length) return;

      const minCurrent = cols[index]?.minWidth ?? DEFAULT_MIN_WIDTH;
      const minNext = cols[nextIndex]?.minWidth ?? DEFAULT_MIN_WIDTH;

      const maxGrow = startWidths[nextIndex] - minNext;
      const maxShrink = startWidths[index] - minCurrent;

      const clampedDelta = Math.max(-maxShrink, Math.min(maxGrow, delta));

      setColumnWidths(() => {
        const next = [...startWidths];
        next[index] = startWidths[index] + clampedDelta;
        next[nextIndex] = startWidths[nextIndex] - clampedDelta;
        return next;
      });
    } else {
      // flex mode
      const minCurrent = cols[index]?.minWidth ?? DEFAULT_MIN_WIDTH;
      const newWidth = Math.max(minCurrent, startWidths[index] + delta);

      setColumnWidths(() => {
        const next = [...startWidths];
        next[index] = newWidth;
        return next;
      });
    }
  }, [mode]);

  const handleMouseUp = useCallback(() => {
    activeIndexRef.current = null;
    setActiveIndex(null);
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  const handleMouseDown = useCallback((index: number, e: React.MouseEvent) => {
    e.preventDefault();
    startXRef.current = e.clientX;
    startWidthsRef.current = [...columnWidths];
    activeIndexRef.current = index;
    setActiveIndex(index);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [columnWidths, handleMouseMove, handleMouseUp]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [handleMouseMove, handleMouseUp]);

  return { columnWidths, activeIndex, handleMouseDown, setColumnWidths };
}
