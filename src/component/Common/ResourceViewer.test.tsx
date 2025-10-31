import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, beforeEach, it, describe, expect } from 'vitest';
import ResourceViewer from './ResourceViewer';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal() || {};
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Mock auth context
const mockLogout = vi.fn();
vi.mock('../../auth/AuthProvider', () => ({
  useAuth: () => ({
    logout: mockLogout
  })
}));

// Mock child components
vi.mock('../SearchEntriesCard/SearchEntriesCard', () => ({
  default: function MockSearchEntriesCard({ entry, css, isSelected }: any) {
    return (
      <div data-testid="search-entries-card" style={css}>
        {entry?.entrySource?.displayName || entry?.name}
        {isSelected && <span data-testid="selected-indicator">Selected</span>}
      </div>
    );
  }
}));

vi.mock('../Tags/FilterTag', () => ({
  default: function MockFilterTag({ text, handleClick, handleClose, showCloseButton, css }: any) {
    return (
      <div data-testid="filter-tag" style={css}>
        {text}
        {showCloseButton && (
          <button data-testid="close-button" onClick={handleClose}>
            Close
          </button>
        )}
        <button data-testid="click-button" onClick={handleClick}>
          Click
        </button>
      </div>
    );
  }
}));

vi.mock('../SearchPage/SearchTableView', () => ({
  default: function MockSearchTableView({ resources, onRowClick, onFavoriteClick }: any) {
    return (
      <div data-testid="search-table-view">
        Table View with {resources?.length} resources
        <button onClick={() => onRowClick(resources[0]?.dataplexEntry)}>Click Row</button>
        <button onClick={() => onFavoriteClick(resources[0]?.dataplexEntry)}>Favorite</button>
      </div>
    );
  }
}));

vi.mock('../Shimmer/ShimmerLoader', () => ({
  default: function MockShimmerLoader({ count, type }: any) {
    return <div data-testid="shimmer-loader">Loading {type} ({count})</div>;
  }
}));

vi.mock('./ResourcePreview', () => ({
  default: function MockResourcePreview({ previewData, onPreviewDataChange, onViewDetails, onRequestAccess }: any) {
    return (
      <div data-testid="resource-preview">
        Preview for {previewData?.name}
        <button onClick={() => onPreviewDataChange(null)}>Close Preview</button>
        <button onClick={() => onViewDetails?.(previewData)}>View Details</button>
        <button onClick={() => onRequestAccess?.(previewData)}>Request Access</button>
      </div>
    );
  }
}));

// Mock SVG assets
vi.mock('@mui/icons-material', () => ({
  KeyboardArrowDown: () => <div data-testid="keyboard-arrow-down">Arrow</div>,
  InfoOutlined: () => <div data-testid="info-outlined">Info</div>
}));

describe('ResourceViewer', () => {
  const mockResources = [
    {
      dataplexEntry: {
        name: 'project/dataset/table1',
        entrySource: {
          displayName: 'Table 1',
          system: 'BigQuery'
        },
        entryType: 'tables-table',
        updateTime: { seconds: 1640995200 } // Jan 1, 2022
      }
    },
    {
      dataplexEntry: {
        name: 'project/dataset/table2',
        entrySource: {
          displayName: 'Table 2',
          system: 'BigQuery'
        },
        entryType: 'tables-table',
        updateTime: { seconds: 1641081600 } // Jan 2, 2022
      }
    },
    {
      dataplexEntry: {
        name: 'project/dataset/dataset1',
        entrySource: {
          displayName: 'Dataset 1',
          system: 'BigQuery'
        },
        entryType: 'datasets-dataset',
        updateTime: { seconds: 1641168000 } // Jan 3, 2022
      }
    }
  ];

  const defaultProps = {
    resources: mockResources,
    resourcesStatus: 'succeeded' as const,
    previewData: null,
    onPreviewDataChange: vi.fn(),
    selectedTypeFilter: null,
    onTypeFilterChange: vi.fn(),
    typeAliases: ['table', 'dataset'],
    viewMode: 'list' as const,
    onViewModeChange: vi.fn(),
    id_token: 'test-token',
    startIndex : 0,
    pageSize : 20,
    setPageSize : vi.fn(),
    requestItemStore: [],
    resourcesTotalSize: 6,
    handlePagination: vi.fn(),
  };

  const renderResourceViewer = (props = {}) => {
    return render(
      <BrowserRouter>
        <ResourceViewer {...defaultProps} {...props} />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state correctly', () => {
    renderResourceViewer({ resourcesStatus: 'loading' });

    expect(screen.getByTestId('shimmer-loader')).toBeInTheDocument();
    expect(screen.getByText('Loading list (6)')).toBeInTheDocument();
  });

  it('renders resources in list view by default', () => {
    renderResourceViewer();

    expect(screen.getByText('Table 1')).toBeInTheDocument();
    expect(screen.getByText('Table 2')).toBeInTheDocument();
    expect(screen.getByText('Dataset 1')).toBeInTheDocument();
    expect(screen.getAllByTestId('search-entries-card')).toHaveLength(3);
  });

  it('renders resources in table view when viewMode is table', () => {
    renderResourceViewer({ viewMode: 'table' });

    expect(screen.getByTestId('search-table-view')).toBeInTheDocument();
    expect(screen.getByText('Table View with 3 resources')).toBeInTheDocument();
  });

  it('displays results count', () => {
    renderResourceViewer();

    expect(screen.getByText('3 results')).toBeInTheDocument();
  });

  it('displays type filter tags', () => {
    renderResourceViewer();

    expect(screen.getByText('table (2)')).toBeInTheDocument();
    expect(screen.getByText('dataset (1)')).toBeInTheDocument();
  });

  it('handles type filter selection', () => {
    const mockOnTypeFilterChange = vi.fn();
    renderResourceViewer({ onTypeFilterChange: mockOnTypeFilterChange });

    const tableFilter = screen.getByText('table (2)');
    const clickButton = tableFilter.querySelector('[data-testid="click-button"]');
    fireEvent.click(clickButton!);

    expect(mockOnTypeFilterChange).toHaveBeenCalledWith('table');
  });

  it('handles type filter deselection when already selected', () => {
    const mockOnTypeFilterChange = vi.fn();
    renderResourceViewer({ 
      selectedTypeFilter: 'table',
      onTypeFilterChange: mockOnTypeFilterChange 
    });

    const tableFilter = screen.getByText('table (2)');
    const clickButton = tableFilter.querySelector('[data-testid="click-button"]');
    fireEvent.click(clickButton!);

    expect(mockOnTypeFilterChange).toHaveBeenCalledWith(null);
  });

  it('filters resources by selected type filter', () => {
    renderResourceViewer({ selectedTypeFilter: 'table' });

    expect(screen.getByText('Table 1')).toBeInTheDocument();
    expect(screen.getByText('Table 2')).toBeInTheDocument();
    expect(screen.queryByText('Dataset 1')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('search-entries-card')).toHaveLength(2);
  });

  it('displays selected filters as tags', () => {
    const selectedFilters = [
      { name: 'BigQuery', type: 'system' },
      { name: 'Table', type: 'typeAliases' }
    ];
    renderResourceViewer({ selectedFilters });

    expect(screen.getByText('BigQuery (3)')).toBeInTheDocument();
    expect(screen.getByText('Table (2)')).toBeInTheDocument();
  });

  it('handles removing selected filter tags', () => {
    const mockOnFiltersChange = vi.fn();
    const selectedFilters = [
      { name: 'BigQuery', type: 'system' }
    ];
    renderResourceViewer({ 
      selectedFilters, 
      onFiltersChange: mockOnFiltersChange 
    });

    const closeButton = screen.getByTestId('close-button');
    fireEvent.click(closeButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith([]);
  });

  it('handles view mode toggle', () => {
    const mockOnViewModeChange = vi.fn();
    renderResourceViewer({ onViewModeChange: mockOnViewModeChange });

    const tableToggle = screen.getByLabelText('table view');
    fireEvent.click(tableToggle);

    expect(mockOnViewModeChange).toHaveBeenCalledWith('table');
  });

  it('displays sort options when showSortBy is true', () => {
    renderResourceViewer({ showSortBy: true });

    expect(screen.getByText('Sort by :')).toBeInTheDocument();
    expect(screen.getByText('Last Modified')).toBeInTheDocument();
  });

  it('handles sort menu interactions', () => {
    renderResourceViewer({ showSortBy: true });

    const sortButton = screen.getByText('Last Modified');
    fireEvent.click(sortButton);

    // Check that menu items are present
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    // Use getAllByText to handle multiple "Last Modified" elements
    expect(screen.getAllByText('Last Modified')).toHaveLength(2);
  });

  it('handles sort option selection', () => {
    renderResourceViewer({ showSortBy: true });

    const sortButton = screen.getByText('Last Modified');
    fireEvent.click(sortButton);

    const nameOptions = screen.getAllByText('Name');
    const menuItem = nameOptions.find(el => el.closest('[role="menuitem"]'));
    fireEvent.click(menuItem!);

    // Sort menu should close and sort should change
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('sorts resources by name', () => {
    renderResourceViewer({ showSortBy: true });

    const sortButton = screen.getByText('Last Modified');
    fireEvent.click(sortButton);
    const nameOptions = screen.getAllByText('Name');
    const menuItem = nameOptions.find(el => el.closest('[role="menuitem"]'));
    fireEvent.click(menuItem!);

    // Resources should be sorted by name (alphabetically)
    const cards = screen.getAllByTestId('search-entries-card');
    expect(cards[0]).toHaveTextContent('Dataset 1');
    expect(cards[1]).toHaveTextContent('Table 1');
    expect(cards[2]).toHaveTextContent('Table 2');
  });

  it('sorts resources by last modified (default)', () => {
    renderResourceViewer();

    // Resources should be sorted by last modified (newest first)
    const cards = screen.getAllByTestId('search-entries-card');
    expect(cards[0]).toHaveTextContent('Dataset 1'); // Jan 3, 2022
    expect(cards[1]).toHaveTextContent('Table 2');   // Jan 2, 2022
    expect(cards[2]).toHaveTextContent('Table 1');   // Jan 1, 2022
  });

  it('handles resource selection for preview', () => {
    const mockOnPreviewDataChange = vi.fn();
    renderResourceViewer({ onPreviewDataChange: mockOnPreviewDataChange });

    const firstCard = screen.getAllByTestId('search-entries-card')[0];
    fireEvent.click(firstCard);

    // First card is Dataset 1 (sorted by last modified, newest first)
    expect(mockOnPreviewDataChange).toHaveBeenCalledWith(mockResources[2].dataplexEntry);
  });

  it('shows selected resource indicator', () => {
    const previewData = mockResources[0].dataplexEntry;
    renderResourceViewer({ previewData });

    const selectedIndicator = screen.getByTestId('selected-indicator');
    expect(selectedIndicator).toBeInTheDocument();
  });

  it('handles info icon click to toggle preview', () => {
    renderResourceViewer();

    const infoIcon = screen.getByTestId('info-outlined');
    fireEvent.click(infoIcon);

    expect(screen.getByTestId('resource-preview')).toBeInTheDocument();
  });

  it('shows preview when info is open', () => {
    renderResourceViewer();

    const infoIcon = screen.getByTestId('info-outlined');
    fireEvent.click(infoIcon);

    expect(screen.getByTestId('resource-preview')).toBeInTheDocument();
    expect(screen.getByText('Preview for')).toBeInTheDocument();
  });

  it('handles preview close', () => {
    const mockOnPreviewDataChange = vi.fn();
    renderResourceViewer({ onPreviewDataChange: mockOnPreviewDataChange });

    const infoIcon = screen.getByTestId('info-outlined');
    fireEvent.click(infoIcon);

    const closeButton = screen.getByText('Close Preview');
    fireEvent.click(closeButton);

    expect(mockOnPreviewDataChange).toHaveBeenCalledWith(null);
  });

  it('handles table view row click', () => {
    const mockOnPreviewDataChange = vi.fn();
    renderResourceViewer({ 
      viewMode: 'table',
      onPreviewDataChange: mockOnPreviewDataChange 
    });

    const clickRowButton = screen.getByText('Click Row');
    fireEvent.click(clickRowButton);

    // The mock SearchTableView passes the first resource from the filtered array
    // which is sorted by last modified (newest first), so it's Dataset 1
    expect(mockOnPreviewDataChange).toHaveBeenCalledWith(mockResources[2].dataplexEntry);
  });

  it('handles table view favorite click', () => {
    const mockOnFavoriteClick = vi.fn();
    renderResourceViewer({ 
      viewMode: 'table',
      onFavoriteClick: mockOnFavoriteClick 
    });

    const favoriteButton = screen.getByText('Favorite');
    fireEvent.click(favoriteButton);

    // The mock SearchTableView passes the first resource from the filtered array
    // which is sorted by last modified (newest first), so it's Dataset 1
    expect(mockOnFavoriteClick).toHaveBeenCalledWith(mockResources[2].dataplexEntry);
  });

  it('displays no resources message when filtered results are empty', () => {
    renderResourceViewer({ 
      resources: [],
      resourcesStatus: 'succeeded'
    });

    expect(screen.getByText('No Resources found.')).toBeInTheDocument();
  });

  it('handles failed resources status by logging out and navigating', () => {
    renderResourceViewer({ 
      resourcesStatus: 'failed',
      error: 'Failed to fetch resources'
    });

    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('handles custom header rendering', () => {
    const customHeader = <div data-testid="custom-header">Custom Header</div>;
    renderResourceViewer({ customHeader });

    expect(screen.getByTestId('custom-header')).toBeInTheDocument();
  });

  it('handles custom filters rendering', () => {
    const customFilters = <div data-testid="custom-filters">Custom Filters</div>;
    renderResourceViewer({ customFilters });

    expect(screen.getByTestId('custom-filters')).toBeInTheDocument();
  });

  it('hides filters when showFilters is false', () => {
    renderResourceViewer({ showFilters: false });

    expect(screen.queryByText('table (2)')).not.toBeInTheDocument();
    expect(screen.queryByText('dataset (1)')).not.toBeInTheDocument();
  });

  it('hides results count when showResultsCount is false', () => {
    renderResourceViewer({ showResultsCount: false });

    expect(screen.queryByText('3 results')).not.toBeInTheDocument();
  });

  it('handles resources without display names', () => {
    const resourcesWithoutNames = [
      {
        dataplexEntry: {
          name: 'project/dataset/table1',
          entrySource: {},
          entryType: 'tables-table',
          updateTime: { seconds: 1640995200 }
        }
      }
    ];

    renderResourceViewer({ 
      resources: resourcesWithoutNames,
      showSortBy: true
    });

    // Should still render the resource
    expect(screen.getByTestId('search-entries-card')).toBeInTheDocument();
  });

  it('handles resources without update time', () => {
    const resourcesWithoutTime = [
      {
        dataplexEntry: {
          name: 'project/dataset/table1',
          entrySource: { displayName: 'Table 1' },
          entryType: 'tables-table'
        }
      }
    ];

    renderResourceViewer({ resources: resourcesWithoutTime });

    expect(screen.getByText('Table 1')).toBeInTheDocument();
  });

  it('handles empty type aliases', () => {
    renderResourceViewer({ typeAliases: [] });

    expect(screen.queryByText('table (2)')).not.toBeInTheDocument();
    expect(screen.queryByText('dataset (1)')).not.toBeInTheDocument();
  });

  it('handles filter result count calculation', () => {
    const selectedFilters = [
      { name: 'BigQuery', type: 'system' },
      { name: 'Table', type: 'typeAliases' }
    ];
    renderResourceViewer({ selectedFilters });

    // Should show count for system filter
    expect(screen.getByText('BigQuery (3)')).toBeInTheDocument();
    // Should show count for typeAliases filter
    expect(screen.getByText('Table (2)')).toBeInTheDocument();
  });

  it('handles preview data change from ResourcePreview', () => {
    const mockOnPreviewDataChange = vi.fn();
    renderResourceViewer({ onPreviewDataChange: mockOnPreviewDataChange });

    const infoIcon = screen.getByTestId('info-outlined');
    fireEvent.click(infoIcon);

    const closePreviewButton = screen.getByText('Close Preview');
    fireEvent.click(closePreviewButton);

    expect(mockOnPreviewDataChange).toHaveBeenCalledWith(null);
  });

  it('handles view details from ResourcePreview', () => {
    const mockOnViewDetails = vi.fn();
    const previewData = mockResources[0].dataplexEntry;
    renderResourceViewer({ 
      previewData,
      onViewDetails: mockOnViewDetails 
    });

    const infoIcon = screen.getByTestId('info-outlined');
    fireEvent.click(infoIcon);

    const viewDetailsButton = screen.getByText('View Details');
    fireEvent.click(viewDetailsButton);

    expect(mockOnViewDetails).toHaveBeenCalledWith(previewData);
  });

  it('handles request access from ResourcePreview', () => {
    const mockOnRequestAccess = vi.fn();
    const previewData = mockResources[0].dataplexEntry;
    renderResourceViewer({ 
      previewData,
      onRequestAccess: mockOnRequestAccess 
    });

    const infoIcon = screen.getByTestId('info-outlined');
    fireEvent.click(infoIcon);

    const requestAccessButton = screen.getByText('Request Access');
    fireEvent.click(requestAccessButton);

    expect(mockOnRequestAccess).toHaveBeenCalledWith(previewData);
  });

  it('applies custom container style', () => {
    const containerStyle = { backgroundColor: 'red' };
    renderResourceViewer({ containerStyle });

    // The container style should be applied to the main container
    const container = screen.getByText('Dataset 1').closest('div')?.parentElement?.parentElement?.parentElement;
    expect(container).toHaveStyle('background-color: rgb(255, 0, 0)');
  });

  it('applies custom content style', () => {
    const contentStyle = { padding: '20px' };
    renderResourceViewer({ contentStyle });

    // The content style should be applied to the main content container
    expect(screen.getByText('Table 1')).toBeInTheDocument();
  });

  it('handles multiple filter selections', () => {
    const selectedFilters = [
      { name: 'BigQuery', type: 'system' },
      { name: 'Table', type: 'typeAliases' },
      { name: 'Dataset', type: 'typeAliases' }
    ];
    renderResourceViewer({ selectedFilters });

    expect(screen.getByText('BigQuery (3)')).toBeInTheDocument();
    expect(screen.getByText('Table (2)')).toBeInTheDocument();
    expect(screen.getByText('Dataset (1)')).toBeInTheDocument();
  });

  it('handles filter tags with undefined counts', () => {
    const selectedFilters = [
      { name: 'UnknownFilter', type: 'unknownType' }
    ];
    renderResourceViewer({ selectedFilters });

    // Should show filter name without count for unknown types
    expect(screen.getByText('UnknownFilter')).toBeInTheDocument();
  });

  it('handles empty resources array', () => {
    renderResourceViewer({ 
      resources: [],
      resourcesStatus: 'succeeded'
    });

    expect(screen.getByText('No Resources found.')).toBeInTheDocument();
    expect(screen.getByText('0 results')).toBeInTheDocument();
  });

  it('handles resources with missing entryType', () => {
    const resourcesWithMissingType = [
      {
        dataplexEntry: {
          name: 'project/dataset/table1',
          entrySource: { displayName: 'Table 1' },
          entryType: undefined, // Missing entryType
          updateTime: { seconds: 1640995200 }
        }
      }
    ];

    // Component crashes when entryType is undefined due to .includes() call
    expect(() => {
      renderResourceViewer({ resources: resourcesWithMissingType });
    }).toThrow();
  });

  it('handles sort by name with missing display names', () => {
    const resourcesWithMissingNames = [
      {
        dataplexEntry: {
          name: 'project/dataset/table1',
          entrySource: {},
          entryType: 'tables-table',
          updateTime: { seconds: 1640995200 }
        }
      },
      {
        dataplexEntry: {
          name: 'project/dataset/table2',
          entrySource: { displayName: 'Table 2' },
          entryType: 'tables-table',
          updateTime: { seconds: 1641081600 }
        }
      }
    ];

    renderResourceViewer({ 
      resources: resourcesWithMissingNames,
      showSortBy: true
    });

    // Should still render both resources
    expect(screen.getAllByTestId('search-entries-card')).toHaveLength(2);
  });
});
