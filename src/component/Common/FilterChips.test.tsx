import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterChips from './FilterChips';

// Mock the FilterTag component
vi.mock('../Tags/FilterTag', () => ({
  default: vi.fn(({ text, handleClose, handleClick, showCloseButton, css: _css }) => (
    <div data-testid="filter-tag" data-text={text}>
      <span>{text}</span>
      {showCloseButton && (
        <button
          data-testid="close-button"
          onClick={() => {
            handleClose();
            handleClick();
          }}
        >
          Close
        </button>
      )}
    </div>
  )),
}));

describe('FilterChips', () => {
  const mockGetCount = vi.fn();
  const mockHandleRemoveFilterTag = vi.fn();
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  const defaultProps = {
    selectedFilters: [],
    getCount: mockGetCount,
    handleRemoveFilterTag: mockHandleRemoveFilterTag,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCount.mockReturnValue(undefined);
    // Setup console spy fresh for each test
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('Rendering', () => {
    it('renders without crashing with empty filters', () => {
      render(<FilterChips {...defaultProps} selectedFilters={[]} />);

      expect(screen.queryByTestId('filter-tag')).not.toBeInTheDocument();
    });

    it('renders FilterTag for typeAliases type filter', () => {
      const filters = [
        { name: 'BigQuery', type: 'typeAliases' }
      ];

      render(<FilterChips {...defaultProps} selectedFilters={filters} />);

      expect(screen.getByTestId('filter-tag')).toBeInTheDocument();
      expect(screen.getByText('BigQuery')).toBeInTheDocument();
    });

    it('renders FilterTag for system type filter', () => {
      const filters = [
        { name: 'System Filter', type: 'system' }
      ];

      render(<FilterChips {...defaultProps} selectedFilters={filters} />);

      expect(screen.getByTestId('filter-tag')).toBeInTheDocument();
      expect(screen.getByText('System Filter')).toBeInTheDocument();
    });

    it('does not render FilterTag for other filter types', () => {
      const filters = [
        { name: 'Custom Filter', type: 'custom' }
      ];

      render(<FilterChips {...defaultProps} selectedFilters={filters} />);

      expect(screen.queryByTestId('filter-tag')).not.toBeInTheDocument();
    });

    it('renders multiple FilterTags for valid filter types', () => {
      const filters = [
        { name: 'BigQuery', type: 'typeAliases' },
        { name: 'System A', type: 'system' },
        { name: 'System B', type: 'system' }
      ];

      render(<FilterChips {...defaultProps} selectedFilters={filters} />);

      expect(screen.getAllByTestId('filter-tag')).toHaveLength(3);
    });

    it('renders only valid filter types from mixed array', () => {
      const filters = [
        { name: 'BigQuery', type: 'typeAliases' },
        { name: 'Custom', type: 'custom' },
        { name: 'System', type: 'system' },
        { name: 'Other', type: 'other' }
      ];

      render(<FilterChips {...defaultProps} selectedFilters={filters} />);

      expect(screen.getAllByTestId('filter-tag')).toHaveLength(2);
    });
  });

  describe('Label with Count', () => {
    it('renders label with count when getCount returns a value', () => {
      const filters = [
        { name: 'BigQuery', type: 'typeAliases' }
      ];
      mockGetCount.mockReturnValue('5');

      render(<FilterChips {...defaultProps} selectedFilters={filters} />);

      expect(screen.getByText('BigQuery (5)')).toBeInTheDocument();
    });

    it('renders label without count when getCount returns undefined', () => {
      const filters = [
        { name: 'BigQuery', type: 'typeAliases' }
      ];
      mockGetCount.mockReturnValue(undefined);

      render(<FilterChips {...defaultProps} selectedFilters={filters} />);

      expect(screen.getByText('BigQuery')).toBeInTheDocument();
    });

    it('renders label with zero count', () => {
      const filters = [
        { name: 'BigQuery', type: 'typeAliases' }
      ];
      mockGetCount.mockReturnValue('0');

      render(<FilterChips {...defaultProps} selectedFilters={filters} />);

      expect(screen.getByText('BigQuery (0)')).toBeInTheDocument();
    });

    it('calls getCount for each filter', () => {
      const filters = [
        { name: 'BigQuery', type: 'typeAliases' },
        { name: 'System', type: 'system' }
      ];

      render(<FilterChips {...defaultProps} selectedFilters={filters} />);

      expect(mockGetCount).toHaveBeenCalledTimes(2);
      expect(mockGetCount).toHaveBeenCalledWith(filters[0]);
      expect(mockGetCount).toHaveBeenCalledWith(filters[1]);
    });

    it('renders different counts for different filters', () => {
      const filters = [
        { name: 'BigQuery', type: 'typeAliases' },
        { name: 'System', type: 'system' }
      ];
      mockGetCount.mockImplementation((filter) => {
        if (filter.name === 'BigQuery') return '10';
        if (filter.name === 'System') return '20';
        return undefined;
      });

      render(<FilterChips {...defaultProps} selectedFilters={filters} />);

      expect(screen.getByText('BigQuery (10)')).toBeInTheDocument();
      expect(screen.getByText('System (20)')).toBeInTheDocument();
    });

    it('handles string count values correctly', () => {
      const filters = [
        { name: 'Filter', type: 'typeAliases' }
      ];
      mockGetCount.mockReturnValue('1,234');

      render(<FilterChips {...defaultProps} selectedFilters={filters} />);

      expect(screen.getByText('Filter (1,234)')).toBeInTheDocument();
    });
  });

  describe('Close Button Interaction', () => {
    it('calls handleRemoveFilterTag when close button is clicked', async () => {
      const user = userEvent.setup();
      const filters = [
        { name: 'BigQuery', type: 'typeAliases' }
      ];

      render(<FilterChips {...defaultProps} selectedFilters={filters} />);

      await user.click(screen.getByTestId('close-button'));

      expect(mockHandleRemoveFilterTag).toHaveBeenCalledTimes(1);
      expect(mockHandleRemoveFilterTag).toHaveBeenCalledWith(filters[0]);
    });

    it('calls handleRemoveFilterTag with correct filter when multiple filters exist', async () => {
      const user = userEvent.setup();
      const filters = [
        { name: 'BigQuery', type: 'typeAliases' },
        { name: 'System', type: 'system' }
      ];

      render(<FilterChips {...defaultProps} selectedFilters={filters} />);

      const closeButtons = screen.getAllByTestId('close-button');
      await user.click(closeButtons[1]); // Click second close button

      expect(mockHandleRemoveFilterTag).toHaveBeenCalledWith(filters[1]);
    });

    it('handles multiple close button clicks', async () => {
      const user = userEvent.setup();
      const filters = [
        { name: 'Filter1', type: 'typeAliases' },
        { name: 'Filter2', type: 'system' }
      ];

      render(<FilterChips {...defaultProps} selectedFilters={filters} />);

      const closeButtons = screen.getAllByTestId('close-button');
      await user.click(closeButtons[0]);
      await user.click(closeButtons[1]);

      expect(mockHandleRemoveFilterTag).toHaveBeenCalledTimes(2);
    });

    it('works with fireEvent.click', () => {
      const filters = [
        { name: 'BigQuery', type: 'typeAliases' }
      ];

      render(<FilterChips {...defaultProps} selectedFilters={filters} />);

      fireEvent.click(screen.getByTestId('close-button'));

      expect(mockHandleRemoveFilterTag).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('handles null selectedFilters gracefully', () => {
      // The component uses selectedFilters && selectedFilters.length > 0
      // so null should be handled
      render(<FilterChips {...defaultProps} selectedFilters={null as any} />);

      expect(screen.queryByTestId('filter-tag')).not.toBeInTheDocument();
    });

    it('handles undefined selectedFilters gracefully', () => {
      render(<FilterChips {...defaultProps} selectedFilters={undefined as any} />);

      expect(screen.queryByTestId('filter-tag')).not.toBeInTheDocument();
    });

    it('handles filter with empty name', () => {
      const filters = [
        { name: '', type: 'typeAliases' }
      ];
      mockGetCount.mockReturnValue('5');

      render(<FilterChips {...defaultProps} selectedFilters={filters} />);

      expect(screen.getByTestId('filter-tag')).toBeInTheDocument();
      expect(screen.getByText('(5)')).toBeInTheDocument();
    });

    it('handles filter with special characters in name', () => {
      const filters = [
        { name: 'BigQuery & Spanner', type: 'typeAliases' }
      ];

      render(<FilterChips {...defaultProps} selectedFilters={filters} />);

      expect(screen.getByText('BigQuery & Spanner')).toBeInTheDocument();
    });

    it('handles filter with unicode characters in name', () => {
      const filters = [
        { name: '数据库', type: 'system' }
      ];

      render(<FilterChips {...defaultProps} selectedFilters={filters} />);

      expect(screen.getByText('数据库')).toBeInTheDocument();
    });

    it('handles very long filter names', () => {
      const longName = 'A'.repeat(100);
      const filters = [
        { name: longName, type: 'typeAliases' }
      ];

      render(<FilterChips {...defaultProps} selectedFilters={filters} />);

      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it('handles filters with additional properties', () => {
      const filters = [
        { name: 'BigQuery', type: 'typeAliases', id: 123, extra: 'data' }
      ];

      render(<FilterChips {...defaultProps} selectedFilters={filters} />);

      expect(screen.getByTestId('filter-tag')).toBeInTheDocument();
    });
  });

  describe('Filter Type Variations', () => {
    it('renders typeAliases filter', () => {
      const filters = [{ name: 'Test', type: 'typeAliases' }];

      render(<FilterChips {...defaultProps} selectedFilters={filters} />);

      expect(screen.getByTestId('filter-tag')).toBeInTheDocument();
    });

    it('renders system filter', () => {
      const filters = [{ name: 'Test', type: 'system' }];

      render(<FilterChips {...defaultProps} selectedFilters={filters} />);

      expect(screen.getByTestId('filter-tag')).toBeInTheDocument();
    });

    it('does not render custom filter', () => {
      const filters = [{ name: 'Test', type: 'custom' }];

      render(<FilterChips {...defaultProps} selectedFilters={filters} />);

      expect(screen.queryByTestId('filter-tag')).not.toBeInTheDocument();
    });

    it('does not render annotation filter', () => {
      const filters = [{ name: 'Test', type: 'annotation' }];

      render(<FilterChips {...defaultProps} selectedFilters={filters} />);

      expect(screen.queryByTestId('filter-tag')).not.toBeInTheDocument();
    });

    it('does not render filter with empty type', () => {
      const filters = [{ name: 'Test', type: '' }];

      render(<FilterChips {...defaultProps} selectedFilters={filters} />);

      expect(screen.queryByTestId('filter-tag')).not.toBeInTheDocument();
    });

    it('does not render filter with undefined type', () => {
      const filters = [{ name: 'Test', type: undefined }];

      render(<FilterChips {...defaultProps} selectedFilters={filters} />);

      expect(screen.queryByTestId('filter-tag')).not.toBeInTheDocument();
    });

    it('does not render filter with null type', () => {
      const filters = [{ name: 'Test', type: null }];

      render(<FilterChips {...defaultProps} selectedFilters={filters} />);

      expect(screen.queryByTestId('filter-tag')).not.toBeInTheDocument();
    });

    it('handles case-sensitive type matching', () => {
      const filters = [
        { name: 'Test1', type: 'TypeAliases' }, // Wrong case
        { name: 'Test2', type: 'SYSTEM' }, // Wrong case
        { name: 'Test3', type: 'typeAliases' }, // Correct
        { name: 'Test4', type: 'system' } // Correct
      ];

      render(<FilterChips {...defaultProps} selectedFilters={filters} />);

      // Only correctly cased types should render
      expect(screen.getAllByTestId('filter-tag')).toHaveLength(2);
    });
  });

  describe('Console Logging', () => {
    it('logs each filter to console', () => {
      const filters = [
        { name: 'BigQuery', type: 'typeAliases' },
        { name: 'System', type: 'system' }
      ];

      render(<FilterChips {...defaultProps} selectedFilters={filters} />);

      expect(consoleSpy).toHaveBeenCalledTimes(2);
      expect(consoleSpy).toHaveBeenCalledWith(filters[0]);
      expect(consoleSpy).toHaveBeenCalledWith(filters[1]);
    });

    it('logs filters even if they are not rendered', () => {
      const filters = [
        { name: 'Custom', type: 'custom' }
      ];

      render(<FilterChips {...defaultProps} selectedFilters={filters} />);

      expect(consoleSpy).toHaveBeenCalledWith(filters[0]);
    });
  });

  describe('FilterTag Props', () => {
    it('passes showCloseButton=true to FilterTag', () => {
      const filters = [
        { name: 'BigQuery', type: 'typeAliases' }
      ];

      render(<FilterChips {...defaultProps} selectedFilters={filters} />);

      // Our mock renders close button when showCloseButton is true
      expect(screen.getByTestId('close-button')).toBeInTheDocument();
    });

    it('passes correct text to FilterTag', () => {
      const filters = [
        { name: 'BigQuery', type: 'typeAliases' }
      ];
      mockGetCount.mockReturnValue('5');

      render(<FilterChips {...defaultProps} selectedFilters={filters} />);

      const filterTag = screen.getByTestId('filter-tag');
      expect(filterTag).toHaveAttribute('data-text', 'BigQuery (5)');
    });

    it('passes handleClick as empty function to FilterTag', async () => {
      const user = userEvent.setup();
      const filters = [
        { name: 'BigQuery', type: 'typeAliases' }
      ];

      render(<FilterChips {...defaultProps} selectedFilters={filters} />);

      // The handleClick is () => {} which should not throw
      await expect(user.click(screen.getByTestId('close-button'))).resolves.not.toThrow();
    });
  });

  describe('Key Generation', () => {
    it('generates unique keys for filters', () => {
      const filters = [
        { name: 'Filter1', type: 'typeAliases' },
        { name: 'Filter2', type: 'typeAliases' },
        { name: 'Filter3', type: 'system' }
      ];

      render(<FilterChips {...defaultProps} selectedFilters={filters} />);

      // All filters should render (keys are unique based on type and name)
      expect(screen.getAllByTestId('filter-tag')).toHaveLength(3);
    });

    it('handles filters with same name but different types', () => {
      const filters = [
        { name: 'SameName', type: 'typeAliases' },
        { name: 'SameName', type: 'system' }
      ];

      render(<FilterChips {...defaultProps} selectedFilters={filters} />);

      // Both should render (different keys due to different types)
      expect(screen.getAllByTestId('filter-tag')).toHaveLength(2);
    });
  });

  describe('Re-render Behavior', () => {
    it('updates when selectedFilters changes', () => {
      const initialFilters = [{ name: 'Initial', type: 'typeAliases' }];
      const { rerender } = render(
        <FilterChips {...defaultProps} selectedFilters={initialFilters} />
      );

      expect(screen.getByText('Initial')).toBeInTheDocument();

      const updatedFilters = [{ name: 'Updated', type: 'system' }];
      rerender(<FilterChips {...defaultProps} selectedFilters={updatedFilters} />);

      expect(screen.getByText('Updated')).toBeInTheDocument();
      expect(screen.queryByText('Initial')).not.toBeInTheDocument();
    });

    it('updates when getCount return value changes', () => {
      const filters = [{ name: 'BigQuery', type: 'typeAliases' }];
      mockGetCount.mockReturnValue('5');

      const { rerender } = render(
        <FilterChips {...defaultProps} selectedFilters={filters} />
      );

      expect(screen.getByText('BigQuery (5)')).toBeInTheDocument();

      mockGetCount.mockReturnValue('10');
      rerender(<FilterChips {...defaultProps} selectedFilters={filters} />);

      expect(screen.getByText('BigQuery (10)')).toBeInTheDocument();
    });

    it('removes filters when array becomes empty', () => {
      const filters = [{ name: 'BigQuery', type: 'typeAliases' }];

      const { rerender } = render(
        <FilterChips {...defaultProps} selectedFilters={filters} />
      );

      expect(screen.getByTestId('filter-tag')).toBeInTheDocument();

      rerender(<FilterChips {...defaultProps} selectedFilters={[]} />);

      expect(screen.queryByTestId('filter-tag')).not.toBeInTheDocument();
    });

    it('adds new filters when array grows', () => {
      const initialFilters = [{ name: 'Filter1', type: 'typeAliases' }];

      const { rerender } = render(
        <FilterChips {...defaultProps} selectedFilters={initialFilters} />
      );

      expect(screen.getAllByTestId('filter-tag')).toHaveLength(1);

      const expandedFilters = [
        { name: 'Filter1', type: 'typeAliases' },
        { name: 'Filter2', type: 'system' }
      ];
      rerender(<FilterChips {...defaultProps} selectedFilters={expandedFilters} />);

      expect(screen.getAllByTestId('filter-tag')).toHaveLength(2);
    });
  });

  describe('Callback References', () => {
    it('uses latest handleRemoveFilterTag callback', async () => {
      const user = userEvent.setup();
      const filters = [{ name: 'BigQuery', type: 'typeAliases' }];
      const firstCallback = vi.fn();
      const secondCallback = vi.fn();

      const { rerender } = render(
        <FilterChips
          selectedFilters={filters}
          getCount={mockGetCount}
          handleRemoveFilterTag={firstCallback}
        />
      );

      rerender(
        <FilterChips
          selectedFilters={filters}
          getCount={mockGetCount}
          handleRemoveFilterTag={secondCallback}
        />
      );

      await user.click(screen.getByTestId('close-button'));

      expect(secondCallback).toHaveBeenCalled();
      expect(firstCallback).not.toHaveBeenCalled();
    });

    it('uses latest getCount callback', () => {
      const filters = [{ name: 'BigQuery', type: 'typeAliases' }];
      const firstGetCount = vi.fn().mockReturnValue('5');
      const secondGetCount = vi.fn().mockReturnValue('10');

      const { rerender } = render(
        <FilterChips
          selectedFilters={filters}
          getCount={firstGetCount}
          handleRemoveFilterTag={mockHandleRemoveFilterTag}
        />
      );

      expect(screen.getByText('BigQuery (5)')).toBeInTheDocument();

      rerender(
        <FilterChips
          selectedFilters={filters}
          getCount={secondGetCount}
          handleRemoveFilterTag={mockHandleRemoveFilterTag}
        />
      );

      expect(screen.getByText('BigQuery (10)')).toBeInTheDocument();
    });
  });

  describe('Complex Filter Scenarios', () => {
    it('handles large number of filters', () => {
      const filters = Array.from({ length: 50 }, (_, i) => ({
        name: `Filter${i}`,
        type: i % 2 === 0 ? 'typeAliases' : 'system'
      }));

      render(<FilterChips {...defaultProps} selectedFilters={filters} />);

      expect(screen.getAllByTestId('filter-tag')).toHaveLength(50);
    });

    it('handles filters with numeric names', () => {
      const filters = [
        { name: '123', type: 'typeAliases' }
      ];

      render(<FilterChips {...defaultProps} selectedFilters={filters} />);

      expect(screen.getByText('123')).toBeInTheDocument();
    });

    it('handles filters with whitespace in name', () => {
      const filters = [
        { name: '  Spaced Name  ', type: 'typeAliases' }
      ];

      render(<FilterChips {...defaultProps} selectedFilters={filters} />);

      // Use a custom matcher since screen.getByText normalizes whitespace
      const filterTag = screen.getByTestId('filter-tag');
      expect(filterTag).toHaveAttribute('data-text', '  Spaced Name  ');
    });

    it('handles all filters being invalid type', () => {
      const filters = [
        { name: 'Custom1', type: 'custom' },
        { name: 'Custom2', type: 'annotation' },
        { name: 'Custom3', type: 'other' }
      ];

      render(<FilterChips {...defaultProps} selectedFilters={filters} />);

      expect(screen.queryByTestId('filter-tag')).not.toBeInTheDocument();
    });
  });

  describe('Fragment Rendering', () => {
    it('renders empty fragment for non-matching filters', () => {
      const filters = [
        { name: 'Custom', type: 'custom' }
      ];

      const { container } = render(
        <FilterChips {...defaultProps} selectedFilters={filters} />
      );

      // Should render an empty fragment, no filter tags
      expect(container.childNodes).toHaveLength(0);
    });

    it('renders mixed content correctly', () => {
      const filters = [
        { name: 'Valid1', type: 'typeAliases' },
        { name: 'Invalid', type: 'custom' },
        { name: 'Valid2', type: 'system' }
      ];

      render(<FilterChips {...defaultProps} selectedFilters={filters} />);

      // Only valid filters should be visible
      expect(screen.getByText('Valid1')).toBeInTheDocument();
      expect(screen.getByText('Valid2')).toBeInTheDocument();
      expect(screen.queryByText('Invalid')).not.toBeInTheDocument();
    });
  });
});
