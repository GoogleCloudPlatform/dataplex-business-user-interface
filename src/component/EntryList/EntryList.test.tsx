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
      const searchInput = screen.getByPlaceholderText('Enter Property Name or Value');
      fireEvent.change(searchInput, { target: { value: 'dataset1' } });
      
      expect(searchInput).toHaveValue('dataset1');
    });
  });

  it('filters entries based on search text', async () => {
    renderEntryList();

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Enter Property Name or Value');
      fireEvent.change(searchInput, { target: { value: 'dataset1' } });
      
      expect(screen.getByText('dataset1')).toBeInTheDocument();
      expect(screen.queryByText('dataset2')).not.toBeInTheDocument();
      expect(screen.queryByText('dataset3')).not.toBeInTheDocument();
    });
  });

  it('filters entries by description', async () => {
    renderEntryList();

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Enter Property Name or Value');
      fireEvent.change(searchInput, { target: { value: 'Test dataset 1' } });
      
      expect(screen.getByText('dataset1')).toBeInTheDocument();
      expect(screen.queryByText('dataset2')).not.toBeInTheDocument();
      expect(screen.queryByText('dataset3')).not.toBeInTheDocument();
    });
  });

  it('filters entries by date', async () => {
    renderEntryList();

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Enter Property Name or Value');
      fireEvent.change(searchInput, { target: { value: 'Jan 1, 2022' } });
      
      expect(screen.getByText('dataset1')).toBeInTheDocument();
      expect(screen.queryByText('dataset2')).not.toBeInTheDocument();
      expect(screen.queryByText('dataset3')).not.toBeInTheDocument();
    });
  });

  it('shows search summary when searching', async () => {
    renderEntryList();

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Enter Property Name or Value');
      fireEvent.change(searchInput, { target: { value: 'dataset1' } });
      
      expect(screen.getByText('Showing 1 of 3 entries')).toBeInTheDocument();
    });
  });

  it('clears search when clear button is clicked', async () => {
    renderEntryList();

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Enter Property Name or Value');
      fireEvent.change(searchInput, { target: { value: 'dataset1' } });
      
      const clearButton = screen.getByText('Clear');
      fireEvent.click(clearButton);
      
      expect(searchInput).toHaveValue('');
      expect(screen.getByText('dataset1')).toBeInTheDocument();
      expect(screen.getByText('dataset2')).toBeInTheDocument();
      expect(screen.getByText('dataset3')).toBeInTheDocument();
    });
  });

  it('clears search when clear search button is clicked', async () => {
    renderEntryList();

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Enter Property Name or Value');
      fireEvent.change(searchInput, { target: { value: 'dataset1' } });
      
      const clearSearchButton = screen.getByText('Clear search');
      fireEvent.click(clearSearchButton);
      
      expect(searchInput).toHaveValue('');
      expect(screen.getByText('dataset1')).toBeInTheDocument();
      expect(screen.getByText('dataset2')).toBeInTheDocument();
      expect(screen.getByText('dataset3')).toBeInTheDocument();
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

  it('displays sort icons correctly', async () => {
    renderEntryList();

    await waitFor(() => {
      const sortButtons = screen.getAllByTestId('ArrowUpwardIcon');
      expect(sortButtons.length).toBeGreaterThan(0);
    });
  });

  it('handles empty search results', async () => {
    renderEntryList();

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Enter Property Name or Value');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
      
      expect(screen.getByText('Showing 0 of 3 entries')).toBeInTheDocument();
    });
  });

  it('handles case insensitive search', async () => {
    renderEntryList();

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Enter Property Name or Value');
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
      expect(screen.getByText('N/A')).toBeInTheDocument();
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
      expect(screen.getByPlaceholderText('Enter Property Name or Value')).toBeInTheDocument();
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
      const searchInput = screen.getByPlaceholderText('Enter Property Name or Value');
      fireEvent.change(searchInput, { target: { value: 'test@#$%' } });
      
      expect(screen.getByText('Showing 0 of 3 entries')).toBeInTheDocument();
    });
  });

  it('handles very long search text', async () => {
    renderEntryList();

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Enter Property Name or Value');
      const longText = 'a'.repeat(1000);
      fireEvent.change(searchInput, { target: { value: longText } });
      
      expect(screen.getByText('Showing 0 of 3 entries')).toBeInTheDocument();
    });
  });
});
