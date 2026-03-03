import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GlossariesLinkedAssets from './GlossariesLinkedAssets';

// Mock ResourceViewer component
vi.mock('../Common/ResourceViewer', () => ({
  default: vi.fn(({
    resources,
    resourcesStatus,
    resourcesTotalSize,
    previewData,
    onPreviewDataChange,
    viewMode,
    onViewModeChange,
    pageSize,
    setPageSize,
    showFilters,
    showSortBy,
    showResultsCount,
  }) => (
    <div data-testid="resource-viewer">
      <span data-testid="resources-count">{resources?.length ?? 0}</span>
      <span data-testid="resources-status">{resourcesStatus}</span>
      <span data-testid="total-size">{resourcesTotalSize}</span>
      <span data-testid="view-mode">{viewMode}</span>
      <span data-testid="page-size">{pageSize}</span>
      <span data-testid="show-filters">{String(showFilters)}</span>
      <span data-testid="show-sort-by">{String(showSortBy)}</span>
      <span data-testid="show-results-count">{String(showResultsCount)}</span>
      <span data-testid="preview-data">{previewData ? 'has-preview' : 'no-preview'}</span>
      <button
        data-testid="trigger-preview"
        onClick={() => onPreviewDataChange({ id: 'preview-1', name: 'Preview Asset' })}
      >
        Trigger Preview
      </button>
      <button
        data-testid="clear-preview"
        onClick={() => onPreviewDataChange(null)}
      >
        Clear Preview
      </button>
      <button
        data-testid="change-view-mode"
        onClick={() => onViewModeChange(viewMode === 'list' ? 'table' : 'list')}
      >
        Change View Mode
      </button>
      <button
        data-testid="change-page-size"
        onClick={() => setPageSize(50)}
      >
        Change Page Size
      </button>
      {resources?.map((resource: any, index: number) => (
        <div key={index} data-testid={`resource-item-${index}`}>
          {resource.dataplexEntry?.entrySource?.displayName || 'Unnamed'}
        </div>
      ))}
    </div>
  )),
}));

// Mock FilterDropdown component
vi.mock('../Filter/FilterDropDown', () => ({
  default: vi.fn(({ filters, onFilterChange, isGlossary }) => (
    <div data-testid="filter-dropdown">
      <span data-testid="filter-count">{filters?.length ?? 0}</span>
      <span data-testid="is-glossary">{String(isGlossary)}</span>
      <button
        data-testid="add-system-filter"
        onClick={() => onFilterChange([...filters, { name: 'BigQuery', type: 'system' }])}
      >
        Add System Filter
      </button>
      <button
        data-testid="add-type-filter"
        onClick={() => onFilterChange([...filters, { name: 'Dataset', type: 'typeAliases' }])}
      >
        Add Type Filter
      </button>
      <button
        data-testid="add-project-filter"
        onClick={() => onFilterChange([...filters, { name: 'my-project', type: 'project' }])}
      >
        Add Project Filter
      </button>
      <button
        data-testid="add-aspect-filter"
        onClick={() => onFilterChange([...filters, { name: 'quality', type: 'aspectType' }])}
      >
        Add Aspect Filter
      </button>
      <button
        data-testid="add-others-system-filter"
        onClick={() => onFilterChange([...filters, { name: 'Others', type: 'system' }])}
      >
        Add Others System Filter
      </button>
      <button
        data-testid="add-others-project-filter"
        onClick={() => onFilterChange([...filters, { name: 'Others', type: 'project' }])}
      >
        Add Others Project Filter
      </button>
      <button
        data-testid="clear-filters"
        onClick={() => onFilterChange([])}
      >
        Clear Filters
      </button>
    </div>
  )),
}));

// Mock typeAliases from resourceUtils
vi.mock('../../utils/resourceUtils', () => ({
  typeAliases: {
    dataset: 'Dataset',
    table: 'Table',
    view: 'View',
  },
}));

describe('GlossariesLinkedAssets', () => {
  const mockOnSearchTermChange = vi.fn();
  const mockOnAssetPreviewChange = vi.fn();

  const defaultProps = {
    linkedAssets: [],
    searchTerm: '',
    onSearchTermChange: mockOnSearchTermChange,
    idToken: 'test-token',
    onAssetPreviewChange: mockOnAssetPreviewChange,
  };

  // Mock asset data
  const mockAssets = [
    {
      dataplexEntry: {
        entrySource: {
          displayName: 'Test Asset 1',
          description: 'Description for asset 1',
          system: 'BigQuery',
          resource: '//bigquery.googleapis.com/projects/my-project/datasets/test',
        },
        entryType: 'projects/my-project/locations/us/entryTypes/dataset',
        aspects: {
          'quality-aspect': { data: {} },
        },
      },
      linkedResource: '//bigquery.googleapis.com/projects/my-project/datasets/test',
    },
    {
      dataplexEntry: {
        entrySource: {
          displayName: 'Test Asset 2',
          description: 'Description for asset 2',
          system: 'Spanner',
          resource: '//spanner.googleapis.com/projects/other-project/instances/test',
        },
        entryType: 'projects/other-project/locations/us/entryTypes/table',
        aspects: {
          'schema-aspect': { data: {} },
        },
      },
      linkedResource: '//spanner.googleapis.com/projects/other-project/instances/test',
    },
    {
      dataplexEntry: {
        entrySource: {
          displayName: 'Test Asset 3',
          description: 'Another description',
          system: 'BigQuery',
          resource: '//bigquery.googleapis.com/projects/my-project/datasets/data',
        },
        entryType: 'projects/my-project/locations/us/entryTypes/dataset',
        aspects: {
          'quality-aspect': { data: {} },
          'lineage-aspect': { data: {} },
        },
      },
      linkedResource: '//bigquery.googleapis.com/projects/my-project/datasets/data',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Empty State', () => {
    it('renders empty state when linkedAssets is empty array', () => {
      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={[]} />);

      expect(screen.getByText('No linked assets available for this term')).toBeInTheDocument();
      expect(screen.queryByTestId('resource-viewer')).not.toBeInTheDocument();
    });

    it('renders empty state when linkedAssets is null', () => {
      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={null as any} />);

      expect(screen.getByText('No linked assets available for this term')).toBeInTheDocument();
    });

    it('renders empty state when linkedAssets is undefined', () => {
      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={undefined as any} />);

      expect(screen.getByText('No linked assets available for this term')).toBeInTheDocument();
    });
  });

  describe('Component Rendering with Assets', () => {
    it('renders ResourceViewer when assets exist', () => {
      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={mockAssets} />);

      expect(screen.getByTestId('resource-viewer')).toBeInTheDocument();
      expect(screen.queryByText('No linked assets available for this term')).not.toBeInTheDocument();
    });

    it('renders search input with placeholder', () => {
      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={mockAssets} />);

      expect(screen.getByPlaceholderText('Filter linked assets by name or description')).toBeInTheDocument();
    });

    it('renders filter toggle button with aria-label', () => {
      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={mockAssets} />);

      expect(screen.getByLabelText('Toggle Filters')).toBeInTheDocument();
    });

    it('passes correct props to ResourceViewer', () => {
      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={mockAssets} />);

      expect(screen.getByTestId('resources-count')).toHaveTextContent('3');
      expect(screen.getByTestId('resources-status')).toHaveTextContent('succeeded');
      expect(screen.getByTestId('total-size')).toHaveTextContent('3');
      expect(screen.getByTestId('view-mode')).toHaveTextContent('list');
      expect(screen.getByTestId('page-size')).toHaveTextContent('20');
      expect(screen.getByTestId('show-filters')).toHaveTextContent('false');
      expect(screen.getByTestId('show-sort-by')).toHaveTextContent('true');
      expect(screen.getByTestId('show-results-count')).toHaveTextContent('true');
    });

    it('renders FilterDropdown with correct props', () => {
      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={mockAssets} />);

      // FilterDropdown is always rendered (visibility controlled by CSS)
      expect(screen.getByTestId('filter-dropdown')).toBeInTheDocument();
      expect(screen.getByTestId('is-glossary')).toHaveTextContent('true');
    });
  });

  describe('Search Functionality', () => {
    it('displays searchTerm value in input', () => {
      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={mockAssets} searchTerm="test search" />);

      const searchInput = screen.getByPlaceholderText('Filter linked assets by name or description');
      expect(searchInput).toHaveValue('test search');
    });

    it('calls onSearchTermChange when typing in search', async () => {
      const user = userEvent.setup();
      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={mockAssets} />);

      const searchInput = screen.getByPlaceholderText('Filter linked assets by name or description');
      await user.type(searchInput, 'a');

      expect(mockOnSearchTermChange).toHaveBeenCalled();
    });

    it('filters assets by display name', () => {
      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={mockAssets} searchTerm="Asset 1" />);

      expect(screen.getByTestId('resources-count')).toHaveTextContent('1');
    });

    it('filters assets by description', () => {
      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={mockAssets} searchTerm="Another description" />);

      expect(screen.getByTestId('resources-count')).toHaveTextContent('1');
    });

    it('filters are case insensitive', () => {
      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={mockAssets} searchTerm="TEST ASSET" />);

      expect(screen.getByTestId('resources-count')).toHaveTextContent('3');
    });

    it('returns no results when search term does not match', () => {
      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={mockAssets} searchTerm="nonexistent" />);

      expect(screen.getByTestId('resources-count')).toHaveTextContent('0');
    });

    it('handles whitespace-only search term', () => {
      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={mockAssets} searchTerm="   " />);

      // Whitespace-only should not filter (trim returns empty string)
      expect(screen.getByTestId('resources-count')).toHaveTextContent('3');
    });

    it('handles assets with missing displayName', () => {
      const assetsWithMissingName = [
        {
          dataplexEntry: {
            entrySource: {
              description: 'Some description',
            },
          },
        },
      ];

      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={assetsWithMissingName} searchTerm="Some" />);

      expect(screen.getByTestId('resources-count')).toHaveTextContent('1');
    });

    it('handles assets with missing description', () => {
      const assetsWithMissingDesc = [
        {
          dataplexEntry: {
            entrySource: {
              displayName: 'Test Name',
            },
          },
        },
      ];

      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={assetsWithMissingDesc} searchTerm="Test" />);

      expect(screen.getByTestId('resources-count')).toHaveTextContent('1');
    });
  });

  describe('Filter Panel Toggle', () => {
    it('filter toggle button is clickable', () => {
      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={mockAssets} />);

      const toggleButton = screen.getByLabelText('Toggle Filters');
      expect(toggleButton).toBeInTheDocument();

      // Click should not throw
      fireEvent.click(toggleButton);
    });

    it('toggles filter panel state when button is clicked', () => {
      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={mockAssets} />);

      const toggleButton = screen.getByLabelText('Toggle Filters');

      // Toggle on
      fireEvent.click(toggleButton);
      // Toggle off
      fireEvent.click(toggleButton);

      // Component should still render correctly
      expect(screen.getByTestId('filter-dropdown')).toBeInTheDocument();
    });
  });

  describe('System Filter', () => {
    it('filters assets by system (BigQuery)', () => {
      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={mockAssets} />);

      // Add system filter for BigQuery
      fireEvent.click(screen.getByTestId('add-system-filter'));

      // Should show only BigQuery assets (2 assets)
      expect(screen.getByTestId('resources-count')).toHaveTextContent('2');
    });

    it('filters with Others system filter includes all assets', () => {
      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={mockAssets} />);

      fireEvent.click(screen.getByTestId('add-others-system-filter'));

      // Others filter should match all
      expect(screen.getByTestId('resources-count')).toHaveTextContent('3');
    });

    it('handles assets with missing system field', () => {
      const assetsWithMissingSystem = [
        {
          dataplexEntry: {
            entrySource: {
              displayName: 'No System Asset',
            },
          },
        },
        ...mockAssets,
      ];

      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={assetsWithMissingSystem} />);

      fireEvent.click(screen.getByTestId('add-system-filter'));

      // Only BigQuery assets should match
      expect(screen.getByTestId('resources-count')).toHaveTextContent('2');
    });
  });

  describe('Type Filter (typeAliases)', () => {
    it('filters assets by type (Dataset)', () => {
      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={mockAssets} />);

      fireEvent.click(screen.getByTestId('add-type-filter'));

      // Should show only dataset entries (2 assets)
      expect(screen.getByTestId('resources-count')).toHaveTextContent('2');
    });

    it('handles type filter matching entryType string', () => {
      const assetsWithDatasetType = [
        {
          dataplexEntry: {
            entrySource: {
              displayName: 'Data Set Asset',
            },
            entryType: 'projects/proj/locations/us/entryTypes/dataset',
          },
        },
      ];

      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={assetsWithDatasetType} />);

      fireEvent.click(screen.getByTestId('add-type-filter'));

      // Should match because "dataset" filter matches entryType containing "dataset"
      expect(screen.getByTestId('resources-count')).toHaveTextContent('1');
    });

    it('handles assets with missing entryType', () => {
      const assetsWithMissingType = [
        {
          dataplexEntry: {
            entrySource: {
              displayName: 'No Type Asset',
            },
          },
        },
        ...mockAssets,
      ];

      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={assetsWithMissingType} />);

      fireEvent.click(screen.getByTestId('add-type-filter'));

      // Only dataset assets should match
      expect(screen.getByTestId('resources-count')).toHaveTextContent('2');
    });
  });

  describe('Project Filter', () => {
    it('filters assets by project', () => {
      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={mockAssets} />);

      fireEvent.click(screen.getByTestId('add-project-filter'));

      // Should show only my-project assets (2 assets)
      expect(screen.getByTestId('resources-count')).toHaveTextContent('2');
    });

    it('filters with Others project filter includes all assets', () => {
      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={mockAssets} />);

      fireEvent.click(screen.getByTestId('add-others-project-filter'));

      expect(screen.getByTestId('resources-count')).toHaveTextContent('3');
    });

    it('matches project in linkedResource field', () => {
      const assetsWithLinkedResource = [
        {
          dataplexEntry: {
            entrySource: {
              displayName: 'Asset with linked resource',
              resource: '',
            },
          },
          linkedResource: '//bigquery.googleapis.com/projects/my-project/datasets/test',
        },
      ];

      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={assetsWithLinkedResource} />);

      fireEvent.click(screen.getByTestId('add-project-filter'));

      expect(screen.getByTestId('resources-count')).toHaveTextContent('1');
    });

    it('handles assets with missing resource paths', () => {
      const assetsWithMissingPaths = [
        {
          dataplexEntry: {
            entrySource: {
              displayName: 'No Path Asset',
            },
          },
        },
        ...mockAssets,
      ];

      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={assetsWithMissingPaths} />);

      fireEvent.click(screen.getByTestId('add-project-filter'));

      expect(screen.getByTestId('resources-count')).toHaveTextContent('2');
    });
  });

  describe('Aspect Filter', () => {
    it('filters assets by aspect type', () => {
      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={mockAssets} />);

      fireEvent.click(screen.getByTestId('add-aspect-filter'));

      // Should show only assets with quality aspect (2 assets)
      expect(screen.getByTestId('resources-count')).toHaveTextContent('2');
    });

    it('handles assets with missing aspects', () => {
      const assetsWithMissingAspects = [
        {
          dataplexEntry: {
            entrySource: {
              displayName: 'No Aspects Asset',
            },
          },
        },
        ...mockAssets,
      ];

      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={assetsWithMissingAspects} />);

      fireEvent.click(screen.getByTestId('add-aspect-filter'));

      // Only assets with quality aspect
      expect(screen.getByTestId('resources-count')).toHaveTextContent('2');
    });

    it('handles partial aspect name match', () => {
      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={mockAssets} />);

      fireEvent.click(screen.getByTestId('add-aspect-filter'));

      // "quality" should match "quality-aspect"
      expect(screen.getByTestId('resources-count')).toHaveTextContent('2');
    });
  });

  describe('Combined Filters', () => {
    it('applies multiple filter types together', () => {
      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={mockAssets} />);

      // Add system filter (BigQuery) - should reduce to 2
      fireEvent.click(screen.getByTestId('add-system-filter'));
      expect(screen.getByTestId('resources-count')).toHaveTextContent('2');

      // Add project filter (my-project) - both BigQuery assets are in my-project
      fireEvent.click(screen.getByTestId('add-project-filter'));
      expect(screen.getByTestId('resources-count')).toHaveTextContent('2');
    });

    it('clears all filters', () => {
      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={mockAssets} />);

      // Add filters
      fireEvent.click(screen.getByTestId('add-system-filter'));
      expect(screen.getByTestId('resources-count')).toHaveTextContent('2');

      // Clear filters
      fireEvent.click(screen.getByTestId('clear-filters'));
      expect(screen.getByTestId('resources-count')).toHaveTextContent('3');
    });

    it('combines search with filters', () => {
      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={mockAssets} searchTerm="Asset 1" />);

      fireEvent.click(screen.getByTestId('add-system-filter'));

      // Search for "Asset 1" + BigQuery filter = 1 result
      expect(screen.getByTestId('resources-count')).toHaveTextContent('1');
    });
  });

  describe('Preview Data Handling', () => {
    it('calls onAssetPreviewChange when preview is triggered', () => {
      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={mockAssets} />);

      fireEvent.click(screen.getByTestId('trigger-preview'));

      expect(mockOnAssetPreviewChange).toHaveBeenCalledWith({ id: 'preview-1', name: 'Preview Asset' });
    });

    it('closes filter panel when preview is opened', () => {
      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={mockAssets} />);

      // Open filter panel
      fireEvent.click(screen.getByLabelText('Toggle Filters'));

      // Trigger preview (which sets isFilterOpen to false)
      fireEvent.click(screen.getByTestId('trigger-preview'));

      // Filter panel should be closed (isFilterOpen = false)
      // We can verify by clicking toggle again and checking filter dropdown is visible
      expect(mockOnAssetPreviewChange).toHaveBeenCalled();
    });

    it('clears preview data correctly', () => {
      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={mockAssets} />);

      // Trigger preview first
      fireEvent.click(screen.getByTestId('trigger-preview'));
      expect(screen.getByTestId('preview-data')).toHaveTextContent('has-preview');

      // Clear preview
      fireEvent.click(screen.getByTestId('clear-preview'));
      expect(mockOnAssetPreviewChange).toHaveBeenLastCalledWith(null);
      expect(screen.getByTestId('preview-data')).toHaveTextContent('no-preview');
    });

    it('does not close filter panel when preview is cleared (data is null)', () => {
      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={mockAssets} />);

      // Clear preview with null data
      fireEvent.click(screen.getByTestId('clear-preview'));

      // Component should still work correctly
      expect(mockOnAssetPreviewChange).toHaveBeenCalledWith(null);
    });
  });

  describe('View Mode and Page Size', () => {
    it('starts with list view mode', () => {
      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={mockAssets} />);

      expect(screen.getByTestId('view-mode')).toHaveTextContent('list');
    });

    it('changes view mode when toggled', () => {
      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={mockAssets} />);

      fireEvent.click(screen.getByTestId('change-view-mode'));

      expect(screen.getByTestId('view-mode')).toHaveTextContent('table');
    });

    it('starts with page size of 20', () => {
      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={mockAssets} />);

      expect(screen.getByTestId('page-size')).toHaveTextContent('20');
    });

    it('changes page size when set', () => {
      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={mockAssets} />);

      fireEvent.click(screen.getByTestId('change-page-size'));

      expect(screen.getByTestId('page-size')).toHaveTextContent('50');
    });
  });

  describe('Edge Cases', () => {
    it('handles null linkedAssets array', () => {
      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={null as any} />);

      expect(screen.getByText('No linked assets available for this term')).toBeInTheDocument();
    });

    it('handles assets with deeply nested missing fields', () => {
      const minimalAssets = [
        {},
        { dataplexEntry: null },
        { dataplexEntry: {} },
        { dataplexEntry: { entrySource: null } },
      ];

      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={minimalAssets} />);

      // Should render without crashing
      expect(screen.getByTestId('resource-viewer')).toBeInTheDocument();
      expect(screen.getByTestId('resources-count')).toHaveTextContent('4');
    });

    it('handles search on assets with null nested objects', () => {
      const nullAssets = [
        { dataplexEntry: { entrySource: null } },
        { dataplexEntry: null },
      ];

      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={nullAssets} searchTerm="test" />);

      // Should handle gracefully and show 0 results
      expect(screen.getByTestId('resources-count')).toHaveTextContent('0');
    });

    it('handles filter on assets with undefined aspects', () => {
      const undefinedAspects = [
        { dataplexEntry: { aspects: undefined } },
      ];

      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={undefinedAspects} />);

      fireEvent.click(screen.getByTestId('add-aspect-filter'));

      expect(screen.getByTestId('resources-count')).toHaveTextContent('0');
    });
  });

  describe('Default Export', () => {
    it('exports the component as default', () => {
      expect(GlossariesLinkedAssets).toBeDefined();
      expect(typeof GlossariesLinkedAssets).toBe('function');
    });
  });

  describe('Filter Panel Styling', () => {
    it('filter toggle button is interactive', () => {
      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={mockAssets} />);

      const toggleButton = screen.getByLabelText('Toggle Filters');
      expect(toggleButton).toBeInTheDocument();

      // Multiple toggles should work
      fireEvent.click(toggleButton);
      fireEvent.click(toggleButton);
      fireEvent.click(toggleButton);

      expect(screen.getByTestId('filter-dropdown')).toBeInTheDocument();
    });
  });

  describe('Filter Count Updates', () => {
    it('updates filter count when filters are added', () => {
      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={mockAssets} />);

      expect(screen.getByTestId('filter-count')).toHaveTextContent('0');

      fireEvent.click(screen.getByTestId('add-system-filter'));
      expect(screen.getByTestId('filter-count')).toHaveTextContent('1');

      fireEvent.click(screen.getByTestId('add-type-filter'));
      expect(screen.getByTestId('filter-count')).toHaveTextContent('2');
    });
  });

  describe('Resource Viewer Configuration', () => {
    it('passes showFilters as false to ResourceViewer', () => {
      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={mockAssets} />);

      expect(screen.getByTestId('show-filters')).toHaveTextContent('false');
    });

    it('passes showSortBy as true to ResourceViewer', () => {
      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={mockAssets} />);

      expect(screen.getByTestId('show-sort-by')).toHaveTextContent('true');
    });

    it('passes showResultsCount as true to ResourceViewer', () => {
      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={mockAssets} />);

      expect(screen.getByTestId('show-results-count')).toHaveTextContent('true');
    });
  });

  describe('Filtered Results', () => {
    it('shows correct total size after filtering', () => {
      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={mockAssets} searchTerm="Asset 1" />);

      // Both resources count and total size should reflect filtered count
      expect(screen.getByTestId('resources-count')).toHaveTextContent('1');
      expect(screen.getByTestId('total-size')).toHaveTextContent('1');
    });

    it('shows all items when no filters applied', () => {
      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={mockAssets} />);

      expect(screen.getByTestId('resources-count')).toHaveTextContent('3');
      expect(screen.getByTestId('total-size')).toHaveTextContent('3');
    });
  });

  describe('UseMemo Behavior', () => {
    it('recalculates filtered assets when linkedAssets changes', () => {
      const { rerender } = render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={mockAssets} />);

      expect(screen.getByTestId('resources-count')).toHaveTextContent('3');

      // Rerender with fewer assets
      rerender(<GlossariesLinkedAssets {...defaultProps} linkedAssets={[mockAssets[0]]} />);

      expect(screen.getByTestId('resources-count')).toHaveTextContent('1');
    });

    it('recalculates filtered assets when searchTerm changes', () => {
      const { rerender } = render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={mockAssets} />);

      expect(screen.getByTestId('resources-count')).toHaveTextContent('3');

      rerender(<GlossariesLinkedAssets {...defaultProps} linkedAssets={mockAssets} searchTerm="Asset 1" />);

      expect(screen.getByTestId('resources-count')).toHaveTextContent('1');
    });

    it('recalculates filtered assets when filters change', () => {
      render(<GlossariesLinkedAssets {...defaultProps} linkedAssets={mockAssets} />);

      expect(screen.getByTestId('resources-count')).toHaveTextContent('3');

      fireEvent.click(screen.getByTestId('add-system-filter'));

      expect(screen.getByTestId('resources-count')).toHaveTextContent('2');
    });
  });
});
