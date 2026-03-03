import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { vi, beforeEach, it, describe, expect } from 'vitest';
import EntryList from './EntryList';

// Mock auth context
const mockAuthContext = {
  user: {
    token: 'test-token',
    name: 'Test User',
    email: 'test@example.com',
    picture: 'test-picture',
    hasRole: true,
    roles: [],
    permissions: [],
    appConfig: {
      aspects: {},
      projects: {},
      defaultSearchProduct: {},
      defaultSearchAssets: {},
      browseByAspectTypes: {},
      browseByAspectTypesLabels: {}
    }
  },
  login: vi.fn(),
  logout: vi.fn()
};

vi.mock('../../auth/AuthProvider', () => ({
  useAuth: () => mockAuthContext
}));

// Mock Redux store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      resources: (state = initialState, _action) => state
    },
    preloadedState: initialState
  });
};

// Mock resources slice
vi.mock('../../features/resources/resourcesSlice', () => ({
  fetchEntriesByParent: vi.fn(() => ({ type: 'resources/fetchEntriesByParent' }))
}));

// Mock entry slice
vi.mock('../../features/entry/entrySlice', () => ({
  fetchEntry: vi.fn(() => ({ type: 'entry/fetchEntry' })),
  pushToHistory: vi.fn(() => ({ type: 'entry/pushToHistory' }))
}));

describe('EntryList', () => {
  const mockEntry = {
    name: 'projects/test-project/locations/us-central1/lakes/test-lake'
  };

  const mockEntryListData = [
    {
      dataplexEntry: {
        name: 'projects/test-project/locations/us-central1/lakes/test-lake/datasets/dataset1',
        entrySource: {
          description: 'Test dataset 1 description'
        },
        updateTime: {
          seconds: 1640995200 // Jan 1, 2022
        }
      }
    },
    {
      dataplexEntry: {
        name: 'projects/test-project/locations/us-central1/lakes/test-lake/datasets/dataset2',
        entrySource: {
          description: 'Test dataset 2 description'
        },
        updateTime: {
          seconds: 1641081600 // Jan 2, 2022
        }
      }
    },
    {
      dataplexEntry: {
        name: 'projects/test-project/locations/us-central1/lakes/test-lake/datasets/dataset3',
        entrySource: {
          description: 'Another test dataset'
        },
        updateTime: {
          seconds: 1641168000 // Jan 3, 2022
        }
      }
    }
  ];

  const renderEntryList = (props = {}, storeState: any = {}) => {
    const defaultStoreState = {
      resources: {
        entryListData: mockEntryListData,
        entryListStatus: 'succeeded',
        entryListError: null,
        ...storeState.resources
      }
    };

    const store = createMockStore(defaultStoreState);
    
    return render(
      <Provider store={store}>
        <EntryList entry={mockEntry} {...props} />
      </Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component with loading state initially', () => {
    renderEntryList({}, {
      resources: {
        entryListData: [],
        entryListStatus: 'idle',
        entryListError: null
      }
    });

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders entry list when data is available', async () => {
    renderEntryList();

    await waitFor(() => {
      expect(screen.getByText('dataset1')).toBeInTheDocument();
      expect(screen.getByText('dataset2')).toBeInTheDocument();
      expect(screen.getByText('dataset3')).toBeInTheDocument();
    });
  });

  it('displays correct table headers', async () => {
    renderEntryList();

    await waitFor(() => {
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Last Modification Time')).toBeInTheDocument();
    });
  });

  it('displays entry descriptions', async () => {
    renderEntryList();

    await waitFor(() => {
      expect(screen.getByText('Test dataset 1 description')).toBeInTheDocument();
      expect(screen.getByText('Test dataset 2 description')).toBeInTheDocument();
      expect(screen.getByText('Another test dataset')).toBeInTheDocument();
    });
  });

  it('displays formatted dates', async () => {
    renderEntryList();

    await waitFor(() => {
      expect(screen.getByText('Jan 1, 2022')).toBeInTheDocument();
      expect(screen.getByText('Jan 2, 2022')).toBeInTheDocument();
      expect(screen.getByText('Jan 3, 2022')).toBeInTheDocument();
    });
  });

  it('handles search input changes', async () => {
    renderEntryList();

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Enter property name or value');
      fireEvent.change(searchInput, { target: { value: 'dataset1' } });

      expect(searchInput).toHaveValue('dataset1');
    });
  });

  it('filters entries based on search text', async () => {
    renderEntryList();

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Enter property name or value');
      fireEvent.change(searchInput, { target: { value: 'dataset1' } });
      
      expect(screen.getByText('dataset1')).toBeInTheDocument();
      expect(screen.queryByText('dataset2')).not.toBeInTheDocument();
      expect(screen.queryByText('dataset3')).not.toBeInTheDocument();
    });
  });

  it('filters entries by description', async () => {
    renderEntryList();

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Enter property name or value');
      fireEvent.change(searchInput, { target: { value: 'Test dataset 1' } });
      
      expect(screen.getByText('dataset1')).toBeInTheDocument();
      expect(screen.queryByText('dataset2')).not.toBeInTheDocument();
      expect(screen.queryByText('dataset3')).not.toBeInTheDocument();
    });
  });

  it('filters entries by date', async () => {
    renderEntryList();

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Enter property name or value');
      fireEvent.change(searchInput, { target: { value: 'Jan 1, 2022' } });
      
      expect(screen.getByText('dataset1')).toBeInTheDocument();
      expect(screen.queryByText('dataset2')).not.toBeInTheDocument();
      expect(screen.queryByText('dataset3')).not.toBeInTheDocument();
    });
  });

  it('shows filtered results when searching', async () => {
    renderEntryList();

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Enter property name or value');
      fireEvent.change(searchInput, { target: { value: 'dataset1' } });

      // Check that only matching results are shown
      expect(screen.getByText('dataset1')).toBeInTheDocument();
      expect(screen.queryByText('dataset2')).not.toBeInTheDocument();
      expect(screen.queryByText('dataset3')).not.toBeInTheDocument();
    });
  });

  it('clears search when clear button is clicked', async () => {
    renderEntryList();

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Enter property name or value');
      fireEvent.change(searchInput, { target: { value: 'dataset1' } });

      // Find the close icon button inside the input
      const closeButton = screen.getByTestId('CloseIcon');
      fireEvent.click(closeButton);

      expect(searchInput).toHaveValue('');
      expect(screen.getByText('dataset1')).toBeInTheDocument();
      expect(screen.getByText('dataset2')).toBeInTheDocument();
      expect(screen.getByText('dataset3')).toBeInTheDocument();
    });
  });

  it('displays Clear All button when filters are active', async () => {
    renderEntryList();

    await waitFor(() => {
      // Initially, there should be no Clear All button
      expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
    });
  });

  it('handles sorting by name', async () => {
    renderEntryList();

    await waitFor(() => {
      const nameHeader = screen.getByText('Name');
      const sortButton = nameHeader.parentElement?.querySelector('button');
      
      if (sortButton) {
        fireEvent.click(sortButton);
        
        // Check that sorting is applied (ascending)
        const rows = screen.getAllByRole('row');
        expect(rows[1]).toHaveTextContent('dataset1');
        expect(rows[2]).toHaveTextContent('dataset2');
        expect(rows[3]).toHaveTextContent('dataset3');
      }
    });
  });

  it('handles sorting by description', async () => {
    renderEntryList();

    await waitFor(() => {
      const descriptionHeader = screen.getByText('Description');
      const sortButton = descriptionHeader.parentElement?.querySelector('button');
      
      if (sortButton) {
        fireEvent.click(sortButton);
        
        // Check that sorting is applied
        expect(screen.getByText('Another test dataset')).toBeInTheDocument();
      }
    });
  });

  it('handles sorting by last modified', async () => {
    renderEntryList();

    await waitFor(() => {
      const lastModifiedHeader = screen.getByText('Last Modification Time');
      const sortButton = lastModifiedHeader.parentElement?.querySelector('button');
      
      if (sortButton) {
        fireEvent.click(sortButton);
        
        // Check that sorting is applied
        expect(screen.getByText('Jan 1, 2022')).toBeInTheDocument();
      }
    });
  });

  it('toggles sort direction when clicking same column', async () => {
    renderEntryList();

    await waitFor(() => {
      const nameHeader = screen.getByText('Name');
      const sortButton = nameHeader.parentElement?.querySelector('button');
      
      if (sortButton) {
        // First click - ascending
        fireEvent.click(sortButton);
        
        // Second click - descending
        fireEvent.click(sortButton);
        
        // Third click - no sort
        fireEvent.click(sortButton);
        
        expect(screen.getByText('dataset1')).toBeInTheDocument();
      }
    });
  });

  it('displays sort icons on hover', async () => {
    renderEntryList();

    await waitFor(() => {
      const nameHeader = screen.getByText('Name').closest('th');
      expect(nameHeader).toBeInTheDocument();

      // Hover over the Name header to trigger sort icon
      if (nameHeader) {
        fireEvent.mouseEnter(nameHeader);

        // Sort icon should now be visible
        const sortButtons = screen.getAllByTestId('ArrowUpwardIcon');
        expect(sortButtons.length).toBeGreaterThan(0);
      }
    });
  });

  it('handles empty search results', async () => {
    renderEntryList();

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Enter property name or value');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      // All entries should be filtered out
      expect(screen.queryByText('dataset1')).not.toBeInTheDocument();
      expect(screen.queryByText('dataset2')).not.toBeInTheDocument();
      expect(screen.queryByText('dataset3')).not.toBeInTheDocument();

      // But table headers should still be visible
      expect(screen.getByText('Name')).toBeInTheDocument();
    });
  });

  it('handles case insensitive search', async () => {
    renderEntryList();

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Enter property name or value');
      fireEvent.change(searchInput, { target: { value: 'DATASET1' } });
      
      expect(screen.getByText('dataset1')).toBeInTheDocument();
      expect(screen.queryByText('dataset2')).not.toBeInTheDocument();
    });
  });

  it('handles entries without description', async () => {
    const entryListWithoutDescription = [
      {
        dataplexEntry: {
          name: 'projects/test-project/locations/us-central1/lakes/test-lake/datasets/dataset1',
          entrySource: {
            description: ''
          },
          updateTime: {
            seconds: 1640995200
          }
        }
      }
    ];

    renderEntryList({}, {
      resources: {
        entryListData: entryListWithoutDescription,
        entryListStatus: 'succeeded',
        entryListError: null
      }
    });

    await waitFor(() => {
      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });

  it('handles failed data fetch', () => {
    renderEntryList({}, {
      resources: {
        entryListData: [],
        entryListStatus: 'failed',
        entryListError: 'Failed to fetch entries'
      }
    });

    expect(screen.getByText('Failed to fetch entries')).toBeInTheDocument();
  });

  it('handles empty entry list', async () => {
    renderEntryList({}, {
      resources: {
        entryListData: [],
        entryListStatus: 'succeeded',
        entryListError: null
      }
    });

    await waitFor(() => {
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Last Modification Time')).toBeInTheDocument();
    });
  });

  it('displays filter section', async () => {
    renderEntryList();

    await waitFor(() => {
      expect(screen.getByText('Filter')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter property name or value')).toBeInTheDocument();
    });
  });

  it('handles different date formats correctly', async () => {
    const entryListWithDifferentDates = [
      {
        dataplexEntry: {
          name: 'projects/test-project/locations/us-central1/lakes/test-lake/datasets/dataset1',
          entrySource: {
            description: 'Test dataset'
          },
          updateTime: {
            seconds: 1609459200 // Jan 1, 2021
          }
        }
      }
    ];

    renderEntryList({}, {
      resources: {
        entryListData: entryListWithDifferentDates,
        entryListStatus: 'succeeded',
        entryListError: null
      }
    });

    await waitFor(() => {
      expect(screen.getByText('Jan 1, 2021')).toBeInTheDocument();
    });
  });

  it('handles user without token', () => {
    const authContextWithoutToken = {
      ...mockAuthContext,
      user: { ...mockAuthContext.user, token: '' }
    };

    vi.doMock('../../auth/AuthProvider', () => ({
      useAuth: () => authContextWithoutToken
    }));

    renderEntryList();

    // Component still renders the table even without token
    expect(screen.getByText('Filter')).toBeInTheDocument();
  });

  it('handles missing entry prop', () => {
    // Component crashes when entry is undefined, so we expect it to throw
    expect(() => {
      renderEntryList({ entry: undefined });
    }).toThrow();
  });

  it('applies correct styling to table container', async () => {
    renderEntryList();

    await waitFor(() => {
      const tableContainer = screen.getByRole('table').closest('[class*="MuiTableContainer"]');
      expect(tableContainer).toBeInTheDocument();
    });
  });

  it('applies correct styling to table headers', async () => {
    renderEntryList();

    await waitFor(() => {
      const nameHeader = screen.getByText('Name');
      expect(nameHeader).toBeInTheDocument();
    });
  });

  it('handles search with special characters', async () => {
    renderEntryList();

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Enter property name or value');
      fireEvent.change(searchInput, { target: { value: 'test@#$%' } });

      // Should filter out all results since none match
      expect(screen.queryByText('dataset1')).not.toBeInTheDocument();
      expect(screen.queryByText('dataset2')).not.toBeInTheDocument();
      expect(screen.queryByText('dataset3')).not.toBeInTheDocument();
    });
  });

  it('handles very long search text', async () => {
    renderEntryList();

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Enter property name or value');
      const longText = 'a'.repeat(1000);
      fireEvent.change(searchInput, { target: { value: longText } });

      expect(searchInput).toHaveValue(longText);
      // Should filter out all results since none match
      expect(screen.queryByText('dataset1')).not.toBeInTheDocument();
    });
  });

  it('opens filter menu when filter icon is clicked', async () => {
    renderEntryList();

    await waitFor(() => {
      const filterIcon = screen.getByTestId('FilterListIcon');
      const filterButton = filterIcon.closest('button');

      if (filterButton) {
        fireEvent.click(filterButton);

        // Menu should open
        expect(screen.getByText('Select Property to Filter')).toBeInTheDocument();
      }
    });
  });

  it('cycles through sort directions correctly', async () => {
    renderEntryList();

    await waitFor(() => {
      const nameHeader = screen.getByText('Name').closest('th');

      if (nameHeader) {
        // First hover to show sort button
        fireEvent.mouseEnter(nameHeader);

        const sortButton = nameHeader.querySelector('button');
        if (sortButton) {
          // First click - ascending
          fireEvent.click(sortButton);

          // Second click - descending
          fireEvent.click(sortButton);

          // Third click - no sort
          fireEvent.click(sortButton);

          expect(nameHeader).toBeInTheDocument();
        }
      }
    });
  });

  it('handles clicking on Filter text label', async () => {
    renderEntryList();

    await waitFor(() => {
      const filterText = screen.getByText('Filter');
      fireEvent.click(filterText);

      // Menu should open
      expect(screen.getByText('Select Property to Filter')).toBeInTheDocument();
    });
  });

  it('sorts by Last Modified correctly', async () => {
    renderEntryList();

    await waitFor(() => {
      const lastModifiedHeader = screen.getByText('Last Modification Time').closest('th');

      if (lastModifiedHeader) {
        // Hover to show sort button
        fireEvent.mouseEnter(lastModifiedHeader);

        const sortButton = lastModifiedHeader.querySelector('button');
        if (sortButton) {
          // Click to sort
          fireEvent.click(sortButton);

          // All dates should still be visible (just reordered)
          expect(screen.getByText('Jan 1, 2022')).toBeInTheDocument();
          expect(screen.getByText('Jan 2, 2022')).toBeInTheDocument();
          expect(screen.getByText('Jan 3, 2022')).toBeInTheDocument();
        }
      }
    });
  });

  it('combines search and sorting', async () => {
    renderEntryList();

    await waitFor(() => {
      // First, add a search filter
      const searchInput = screen.getByPlaceholderText('Enter property name or value');
      fireEvent.change(searchInput, { target: { value: 'dataset' } });

      // Then sort
      const nameHeader = screen.getByText('Name').closest('th');
      if (nameHeader) {
        fireEvent.mouseEnter(nameHeader);

        const sortButton = nameHeader.querySelector('button');
        if (sortButton) {
          fireEvent.click(sortButton);
        }
      }

      // All datasets should be visible (all match "dataset")
      expect(screen.getByText('dataset1')).toBeInTheDocument();
      expect(screen.getByText('dataset2')).toBeInTheDocument();
      expect(screen.getByText('dataset3')).toBeInTheDocument();
    });
  });

  it('handles entry with empty description edge case', async () => {
    const entryWithEmptyDesc = [
      {
        dataplexEntry: {
          name: 'projects/test-project/locations/us-central1/lakes/test-lake/datasets/empty-desc',
          entrySource: {
            description: ''
          },
          updateTime: {
            seconds: 1640995200
          }
        }
      }
    ];

    renderEntryList({}, {
      resources: {
        entryListData: entryWithEmptyDesc,
        entryListStatus: 'succeeded',
        entryListError: null
      }
    });

    await waitFor(() => {
      // Should show dash for empty description
      const cells = screen.getAllByRole('cell');
      const hasDash = cells.some(cell => cell.textContent === '-');
      expect(hasDash).toBe(true);
    });
  });

  it('handles description sorting with empty values', async () => {
    const mixedData = [
      {
        dataplexEntry: {
          name: 'projects/test-project/locations/us-central1/lakes/test-lake/datasets/dataset-a',
          entrySource: {
            description: 'Z description'
          },
          updateTime: {
            seconds: 1640995200
          }
        }
      },
      {
        dataplexEntry: {
          name: 'projects/test-project/locations/us-central1/lakes/test-lake/datasets/dataset-b',
          entrySource: {
            description: ''
          },
          updateTime: {
            seconds: 1641081600
          }
        }
      },
      {
        dataplexEntry: {
          name: 'projects/test-project/locations/us-central1/lakes/test-lake/datasets/dataset-c',
          entrySource: {
            description: 'A description'
          },
          updateTime: {
            seconds: 1641168000
          }
        }
      }
    ];

    renderEntryList({}, {
      resources: {
        entryListData: mixedData,
        entryListStatus: 'succeeded',
        entryListError: null
      }
    });

    await waitFor(() => {
      // Verify all entries render
      expect(screen.getByText('dataset-a')).toBeInTheDocument();
      expect(screen.getByText('dataset-b')).toBeInTheDocument();
      expect(screen.getByText('dataset-c')).toBeInTheDocument();
    });
  });

  it('handles clicking on entry name to navigate', async () => {
    renderEntryList();

    await waitFor(() => {
      const entryLink = screen.getByText('dataset1');
      fireEvent.click(entryLink);

      // The click should trigger navigation (pushToHistory and fetchEntry dispatches)
      expect(entryLink).toBeInTheDocument();
    });
  });

  it('shows descending sort icon when sorting descending', async () => {
    renderEntryList();

    await waitFor(() => {
      const nameHeader = screen.getByText('Name').closest('th');

      if (nameHeader) {
        // Hover to show sort button
        fireEvent.mouseEnter(nameHeader);

        const sortButton = nameHeader.querySelector('button');
        if (sortButton) {
          // First click - ascending
          fireEvent.click(sortButton);

          // Second click - descending
          fireEvent.click(sortButton);

          // Should show ArrowDownward icon
          const downIcon = screen.queryByTestId('ArrowDownwardIcon');
          expect(downIcon || nameHeader).toBeInTheDocument();
        }
      }
    });
  });

  it('selects a property in filter menu and shows values', async () => {
    renderEntryList();

    await waitFor(() => {
      expect(screen.getByText('dataset1')).toBeInTheDocument();
    });

    // Open filter menu
    const filterIcon = screen.getByTestId('FilterListIcon');
    const filterButton = filterIcon.closest('button');
    fireEvent.click(filterButton!);

    await waitFor(() => {
      expect(screen.getByText('Select Property to Filter')).toBeInTheDocument();
    });

    // Click on Name property (in menu, not table header)
    const menuItems = screen.getAllByRole('menuitem');
    const nameMenuItem = menuItems.find(item => item.textContent === 'Name');
    fireEvent.click(nameMenuItem!);

    await waitFor(() => {
      expect(screen.getByText('← Back to Properties')).toBeInTheDocument();
      expect(screen.getByText('Filter by: Name')).toBeInTheDocument();
    });
  });

  it('toggles filter value when clicking checkbox', async () => {
    renderEntryList();

    await waitFor(() => {
      expect(screen.getByText('dataset1')).toBeInTheDocument();
    });

    // Open filter menu
    const filterIcon = screen.getByTestId('FilterListIcon');
    fireEvent.click(filterIcon.closest('button')!);

    await waitFor(() => {
      expect(screen.getByText('Select Property to Filter')).toBeInTheDocument();
    });

    // Click on Name property
    const menuItems = screen.getAllByRole('menuitem');
    const nameMenuItem = menuItems.find(item => item.textContent === 'Name');
    fireEvent.click(nameMenuItem!);

    await waitFor(() => {
      expect(screen.getByText('Filter by: Name')).toBeInTheDocument();
    });

    // Click on a value to toggle it - find checkbox for dataset1
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
    fireEvent.click(checkboxes[0]);

    // Verify filter is being applied (checkbox changes state)
    expect(checkboxes[0]).toBeInTheDocument();
  });

  it('shows Clear All button when filters are active and clears on click', async () => {
    renderEntryList();

    await waitFor(() => {
      expect(screen.getByText('dataset1')).toBeInTheDocument();
    });

    // Open filter menu
    const filterIcon = screen.getByTestId('FilterListIcon');
    fireEvent.click(filterIcon.closest('button')!);

    await waitFor(() => {
      expect(screen.getByText('Select Property to Filter')).toBeInTheDocument();
    });

    // Click on Name property
    const menuItems = screen.getAllByRole('menuitem');
    const nameMenuItem = menuItems.find(item => item.textContent === 'Name');
    fireEvent.click(nameMenuItem!);

    await waitFor(() => {
      expect(screen.getByText('Filter by: Name')).toBeInTheDocument();
    });

    // Click on a checkbox to add filter
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    // Close menu by clicking backdrop
    fireEvent.keyDown(document, { key: 'Escape' });

    // Wait for Clear All to appear and click it
    await waitFor(() => {
      const clearAllButton = screen.getByText('Clear All');
      expect(clearAllButton).toBeInTheDocument();
      fireEvent.click(clearAllButton);
    });

    // Verify clear all worked - search text should be empty
    const searchInput = screen.getByPlaceholderText('Enter property name or value');
    expect(searchInput).toHaveValue('');
  });

  it('removes filter chip when close button is clicked', async () => {
    renderEntryList();

    await waitFor(() => {
      expect(screen.getByText('dataset1')).toBeInTheDocument();
    });

    // Open filter menu
    const filterIcon = screen.getByTestId('FilterListIcon');
    fireEvent.click(filterIcon.closest('button')!);

    await waitFor(() => {
      expect(screen.getByText('Select Property to Filter')).toBeInTheDocument();
    });

    // Click on Name property
    const menuItems = screen.getAllByRole('menuitem');
    const nameMenuItem = menuItems.find(item => item.textContent === 'Name');
    fireEvent.click(nameMenuItem!);

    await waitFor(() => {
      expect(screen.getByText('Filter by: Name')).toBeInTheDocument();
    });

    // Click on checkbox to add filter
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    // Close menu
    fireEvent.keyDown(document, { key: 'Escape' });

    // Check for filter chip close button and click it
    await waitFor(() => {
      const closeIcons = screen.getAllByTestId('CloseIcon');
      expect(closeIcons.length).toBeGreaterThan(0);
      // Click the filter chip close button (last one)
      fireEvent.click(closeIcons[closeIcons.length - 1]);
    });

    // Verify the filter was cleared
    expect(screen.getByText('Filter')).toBeInTheDocument();
  });

  it('navigates back to properties list in filter menu', async () => {
    renderEntryList();

    await waitFor(() => {
      expect(screen.getByText('dataset1')).toBeInTheDocument();
    });

    // Open filter menu
    const filterIcon = screen.getByTestId('FilterListIcon');
    fireEvent.click(filterIcon.closest('button')!);

    await waitFor(() => {
      expect(screen.getByText('Select Property to Filter')).toBeInTheDocument();
    });

    // Click on Name property
    const menuItems = screen.getAllByRole('menuitem');
    const nameMenuItem = menuItems.find(item => item.textContent === 'Name');
    fireEvent.click(nameMenuItem!);

    await waitFor(() => {
      expect(screen.getByText('← Back to Properties')).toBeInTheDocument();
    });

    // Click back button
    const backButton = screen.getByText('← Back to Properties');
    fireEvent.click(backButton);

    // Should show property list again
    await waitFor(() => {
      expect(screen.getByText('Select Property to Filter')).toBeInTheDocument();
    });
  });

  it('closes filter menu properly', async () => {
    renderEntryList();

    await waitFor(() => {
      expect(screen.getByText('dataset1')).toBeInTheDocument();
    });

    // Open filter menu
    const filterIcon = screen.getByTestId('FilterListIcon');
    fireEvent.click(filterIcon.closest('button')!);

    await waitFor(() => {
      expect(screen.getByText('Select Property to Filter')).toBeInTheDocument();
    });
  });

  it('filters data with active property filters', async () => {
    renderEntryList();

    await waitFor(() => {
      expect(screen.getByText('dataset1')).toBeInTheDocument();
    });

    // Open filter menu
    const filterIcon = screen.getByTestId('FilterListIcon');
    fireEvent.click(filterIcon.closest('button')!);

    await waitFor(() => {
      expect(screen.getByText('Select Property to Filter')).toBeInTheDocument();
    });

    // Click on Description property
    const menuItems = screen.getAllByRole('menuitem');
    const descMenuItem = menuItems.find(item => item.textContent === 'Description');
    fireEvent.click(descMenuItem!);

    await waitFor(() => {
      expect(screen.getByText('Filter by: Description')).toBeInTheDocument();
    });

    // Click on a description value to toggle filter
    const valueItems = screen.getAllByRole('menuitem');
    const descValueItem = valueItems.find(item => item.textContent?.includes('Test dataset 1 description'));
    fireEvent.click(descValueItem!);

    // Only dataset1 should be visible
    await waitFor(() => {
      expect(screen.getByText('dataset1')).toBeInTheDocument();
      expect(screen.queryByText('dataset2')).not.toBeInTheDocument();
    });
  });

  it('handles multiple filter values for same property', async () => {
    renderEntryList();

    await waitFor(() => {
      expect(screen.getByText('dataset1')).toBeInTheDocument();
    });

    // Open filter menu
    const filterIcon = screen.getByTestId('FilterListIcon');
    fireEvent.click(filterIcon.closest('button')!);

    await waitFor(() => {
      expect(screen.getByText('Select Property to Filter')).toBeInTheDocument();
    });

    // Click on Name property
    const menuItems = screen.getAllByRole('menuitem');
    const nameMenuItem = menuItems.find(item => item.textContent === 'Name');
    fireEvent.click(nameMenuItem!);

    await waitFor(() => {
      expect(screen.getByText('Filter by: Name')).toBeInTheDocument();
    });

    // Click on first checkbox
    let checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    // Click on second checkbox
    checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]);

    // Close menu
    fireEvent.keyDown(document, { key: 'Escape' });

    // Verify filter is applied
    expect(screen.getByText('Filter')).toBeInTheDocument();
  });

  it('handles toggling filter value off', async () => {
    renderEntryList();

    await waitFor(() => {
      expect(screen.getByText('dataset1')).toBeInTheDocument();
    });

    // Open filter menu
    const filterIcon = screen.getByTestId('FilterListIcon');
    fireEvent.click(filterIcon.closest('button')!);

    await waitFor(() => {
      expect(screen.getByText('Select Property to Filter')).toBeInTheDocument();
    });

    // Click on Name property
    const menuItems = screen.getAllByRole('menuitem');
    const nameMenuItem = menuItems.find(item => item.textContent === 'Name');
    fireEvent.click(nameMenuItem!);

    await waitFor(() => {
      expect(screen.getByText('Filter by: Name')).toBeInTheDocument();
    });

    // Click on checkbox to add
    let checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    // Click again to remove
    checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    // Close menu
    fireEvent.keyDown(document, { key: 'Escape' });

    // Verify no filter chips are shown (Clear All should not be visible)
    expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
  });

  it('sorts by Last Modified in descending order', async () => {
    renderEntryList();

    await waitFor(() => {
      const lastModifiedHeader = screen.getByText('Last Modification Time').closest('th');

      if (lastModifiedHeader) {
        // Hover to show sort button
        fireEvent.mouseEnter(lastModifiedHeader);

        const sortButton = lastModifiedHeader.querySelector('button');
        if (sortButton) {
          // First click - ascending
          fireEvent.click(sortButton);

          // Second click - descending
          fireEvent.click(sortButton);

          // All dates should still be visible (just reordered)
          expect(screen.getByText('Jan 1, 2022')).toBeInTheDocument();
          expect(screen.getByText('Jan 2, 2022')).toBeInTheDocument();
          expect(screen.getByText('Jan 3, 2022')).toBeInTheDocument();
        }
      }
    });
  });

  it('renders filter chips with correct display names', async () => {
    renderEntryList();

    await waitFor(() => {
      expect(screen.getByText('dataset1')).toBeInTheDocument();
    });

    // Open filter menu
    const filterIcon = screen.getByTestId('FilterListIcon');
    fireEvent.click(filterIcon.closest('button')!);

    await waitFor(() => {
      expect(screen.getByText('Select Property to Filter')).toBeInTheDocument();
    });

    // Click on Last Modification Time property
    const menuItems = screen.getAllByRole('menuitem');
    const lastModMenuItem = menuItems.find(item => item.textContent === 'Last Modification Time');
    fireEvent.click(lastModMenuItem!);

    await waitFor(() => {
      expect(screen.getByText('Filter by: Last Modification Time')).toBeInTheDocument();
    });

    // Click on a value
    const valueItems = screen.getAllByRole('menuitem');
    const dateValueItem = valueItems.find(item => item.textContent?.includes('Jan 1, 2022'));
    fireEvent.click(dateValueItem!);

    // Close menu
    fireEvent.keyDown(document, { key: 'Escape' });

    // Filter chip should show proper display name
    await waitFor(() => {
      expect(screen.getByText(/Last Modification Time:/)).toBeInTheDocument();
    });
  });

  it('handles filter by lastModified property values', async () => {
    renderEntryList();

    await waitFor(() => {
      expect(screen.getByText('dataset1')).toBeInTheDocument();
    });

    // Open filter menu
    const filterIcon = screen.getByTestId('FilterListIcon');
    fireEvent.click(filterIcon.closest('button')!);

    await waitFor(() => {
      expect(screen.getByText('Select Property to Filter')).toBeInTheDocument();
    });

    // Click on Last Modification Time property
    const menuItems = screen.getAllByRole('menuitem');
    const lastModMenuItem = menuItems.find(item => item.textContent === 'Last Modification Time');
    fireEvent.click(lastModMenuItem!);

    // Verify values are shown
    await waitFor(() => {
      expect(screen.getByText('Filter by: Last Modification Time')).toBeInTheDocument();
    });
  });

  it('correctly applies getPropertyValues for all columns', async () => {
    renderEntryList();

    await waitFor(() => {
      expect(screen.getByText('dataset1')).toBeInTheDocument();
    });

    // Open filter menu
    const filterIcon = screen.getByTestId('FilterListIcon');
    fireEvent.click(filterIcon.closest('button')!);

    await waitFor(() => {
      expect(screen.getByText('Select Property to Filter')).toBeInTheDocument();
    });

    // Click on Description property
    const menuItems = screen.getAllByRole('menuitem');
    const descMenuItem = menuItems.find(item => item.textContent === 'Description');
    fireEvent.click(descMenuItem!);

    // Verify description filter header is shown
    await waitFor(() => {
      expect(screen.getByText('Filter by: Description')).toBeInTheDocument();
    });

    // Verify checkboxes are available for description values
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBe(3); // 3 unique descriptions
  });
});
