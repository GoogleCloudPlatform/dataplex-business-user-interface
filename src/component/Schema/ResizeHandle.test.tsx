import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ResizeHandle from './ResizeHandle';

describe('ResizeHandle', () => {
  it('renders with col-resize cursor', () => {
    render(
      <ResizeHandle onMouseDown={vi.fn()} isActive={false} darkMode={false} />
    );

    const handle = screen.getByTestId('resize-handle');
    expect(handle).toBeInTheDocument();
    expect(handle.style.cursor).toBe('col-resize');
  });

  it('calls onMouseDown when clicked', () => {
    const onMouseDown = vi.fn();
    render(
      <ResizeHandle onMouseDown={onMouseDown} isActive={false} darkMode={false} />
    );

    fireEvent.mouseDown(screen.getByTestId('resize-handle'));
    expect(onMouseDown).toHaveBeenCalledTimes(1);
  });

  it('renders in active state without crashing', () => {
    render(
      <ResizeHandle onMouseDown={vi.fn()} isActive={true} darkMode={false} />
    );

    expect(screen.getByTestId('resize-handle')).toBeInTheDocument();
  });

  it('renders in dark mode without crashing', () => {
    render(
      <ResizeHandle onMouseDown={vi.fn()} isActive={false} darkMode={true} />
    );

    expect(screen.getByTestId('resize-handle')).toBeInTheDocument();
  });

  it('renders active dark mode without crashing', () => {
    render(
      <ResizeHandle onMouseDown={vi.fn()} isActive={true} darkMode={true} />
    );

    expect(screen.getByTestId('resize-handle')).toBeInTheDocument();
  });
});
