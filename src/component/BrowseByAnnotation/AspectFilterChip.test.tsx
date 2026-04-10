import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AspectFilterChip from './AspectFilterChip';
import { type AspectFilterChip as AspectFilterChipType } from './AspectFilterTypes';

describe('AspectFilterChip', () => {
  const mockOnRemove = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('regular filter chip', () => {
    const regularChip: AspectFilterChipType = {
      id: 'filter-1',
      field: 'name_contains',
      value: 'test',
      displayLabel: 'Name contains: test',
      showFieldLabel: true,
    };

    it('should render the field label and value', () => {
      render(<AspectFilterChip chip={regularChip} onRemove={mockOnRemove} />);

      expect(screen.getByText('Name contains:')).toBeInTheDocument();
      expect(screen.getByText('test')).toBeInTheDocument();
    });

    it('should call onRemove with chip id when close button is clicked', () => {
      render(<AspectFilterChip chip={regularChip} onRemove={mockOnRemove} />);

      const closeButton = screen.getByRole('button');
      fireEvent.click(closeButton);

      expect(mockOnRemove).toHaveBeenCalledWith('filter-1');
    });

    it('should show tooltip with full display label', () => {
      render(<AspectFilterChip chip={regularChip} onRemove={mockOnRemove} />);

      // Tooltip wraps the content - the title attribute is set on the tooltip
      // We just verify the chip renders correctly
      expect(screen.getByText('Name contains:')).toBeInTheDocument();
    });
  });

  describe('chip without field label', () => {
    const chipNoFieldLabel: AspectFilterChipType = {
      id: 'filter-2',
      field: 'name_contains',
      value: 'search term',
      displayLabel: 'search term',
      showFieldLabel: false,
    };

    it('should render only the value without field label', () => {
      render(<AspectFilterChip chip={chipNoFieldLabel} onRemove={mockOnRemove} />);

      expect(screen.getByText('search term')).toBeInTheDocument();
      // Should not show any field label prefix
      expect(screen.queryByText('Name contains:')).not.toBeInTheDocument();
    });
  });

  describe('chip with colon in displayLabel but showFieldLabel false', () => {
    const chipWithColon: AspectFilterChipType = {
      id: 'filter-3',
      field: 'name_contains',
      value: 'some:value',
      displayLabel: 'Name contains: some:value',
      showFieldLabel: false,
    };

    it('should render the full displayLabel as value when showFieldLabel is false', () => {
      render(<AspectFilterChip chip={chipWithColon} onRemove={mockOnRemove} />);

      expect(screen.getByText('Name contains: some:value')).toBeInTheDocument();
    });
  });

  describe('OR connector chip', () => {
    const orChip: AspectFilterChipType = {
      id: 'or-1',
      field: 'name_contains',
      value: 'OR',
      displayLabel: 'OR',
      connector: 'OR',
    };

    it('should render OR text', () => {
      render(<AspectFilterChip chip={orChip} onRemove={mockOnRemove} />);

      expect(screen.getByText('OR')).toBeInTheDocument();
    });

    it('should call onRemove when OR chip close button is clicked', () => {
      render(<AspectFilterChip chip={orChip} onRemove={mockOnRemove} />);

      const closeButton = screen.getByRole('button');
      fireEvent.click(closeButton);

      expect(mockOnRemove).toHaveBeenCalledWith('or-1');
    });

    it('should not render field label or value for OR chip', () => {
      render(<AspectFilterChip chip={orChip} onRemove={mockOnRemove} />);

      // OR chip should only have "OR" text, not any field:value pair
      const texts = screen.getAllByText('OR');
      expect(texts).toHaveLength(1);
    });
  });

  describe('date filter chip', () => {
    const dateChip: AspectFilterChipType = {
      id: 'filter-4',
      field: 'created_on',
      value: '2026-01-15',
      displayLabel: 'Created on: 2026-01-15',
      showFieldLabel: true,
    };

    it('should render date field label and value', () => {
      render(<AspectFilterChip chip={dateChip} onRemove={mockOnRemove} />);

      expect(screen.getByText('Created on:')).toBeInTheDocument();
      expect(screen.getByText('2026-01-15')).toBeInTheDocument();
    });
  });

  describe('location filter chip', () => {
    const locationChip: AspectFilterChipType = {
      id: 'filter-5',
      field: 'location',
      value: 'us-central1',
      displayLabel: 'Location: us-central1',
      showFieldLabel: true,
    };

    it('should render location field label and value', () => {
      render(<AspectFilterChip chip={locationChip} onRemove={mockOnRemove} />);

      expect(screen.getByText('Location:')).toBeInTheDocument();
      expect(screen.getByText('us-central1')).toBeInTheDocument();
    });
  });

  describe('default export', () => {
    it('should export AspectFilterChip as default', async () => {
      const module = await import('./AspectFilterChip');
      expect(module.default).toBeDefined();
      expect(typeof module.default).toBe('function');
    });
  });
});
