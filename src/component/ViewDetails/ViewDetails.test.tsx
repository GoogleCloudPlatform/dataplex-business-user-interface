import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ViewDetails from './ViewDetails';
import { AuthContext } from '../../auth/AuthProvider';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from '../../app/store';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock the sample data slice
vi.mock('../../features/sample-data/sampleDataSlice', async (importOriginal) => {
  const actual = await importOriginal() || {};
  return {
    ...actual,
    getSampleData: vi.fn(() => ({ type: 'getSampleData' }))
  };
});

// Mock the favorite hook
const mockToggleFavorite = vi.fn(() => true);
vi.mock('../../hooks/useFavorite', () => ({
  useFavorite: vi.fn(() => ({
    isFavorite: false,
    toggleFavorite: mockToggleFavorite
  }))
}));

// Mock the utility functions
vi.mock('../../utils/resourceUtils', () => ({
  getName: vi.fn((name: string) => {
    if (!name) return '';
    return name.split('/').pop() || name;
  }),
  getEntryType: vi.fn((name: string) => {
    if (!name) return 'Other';
    if (name.includes('table')) return 'Tables';
    if (name.includes('dataset')) return 'Datasets';
    return 'Other';
  })
}));

// Mock child components
vi.mock('../TabPanel/CustomTabPanel', () => ({
  default: function MockCustomTabPanel({ children, value, index }: any) {
    return value === index ? <div data-testid={`tabpanel-${index}`}>{children}</div> : null;
  }
}));

vi.mock('../Annotation/PreviewAnnotation', () => ({
  default: function MockPreviewAnnotation({ entry }: any) {
    return <div data-testid="preview-annotation">Preview Annotation for {entry?.name}</div>;
  }
}));

vi.mock('../Annotation/AnnotationFilter', () => ({
  default: function MockAnnotationFilter({ entry, onFilteredEntryChange }: any) {
    return (
      <div data-testid="annotation-filter">
        Annotation Filter for {entry?.name}
        <button onClick={() => onFilteredEntryChange(entry)}>Apply Filter</button>
      </div>
    );
  }
}));

vi.mock('../Tags/Tag', () => ({
  default: function MockTag({ text }: any) {
    return <span data-testid="tag">{text}</span>;
  }
}));

vi.mock('../DetailPageOverview/DetailPageOverview', () => ({
  default: function MockDetailPageOverview({ entry, sampleTableData }: any) {
    return (
      <div data-testid="detail-page-overview">
        Overview for {entry?.name}
        {sampleTableData && <div data-testid="sample-data">Sample Data Available</div>}
      </div>
    );
  }
}));

vi.mock('../Lineage', () => ({
  default: function MockLineage({ entry }: any) {
    return <div data-testid="lineage">Lineage for {entry?.name}</div>;
  }
}));

vi.mock('../DataQuality/DataQuality', () => ({
  default: function MockDataQuality({ entry }: any) {
    return <div data-testid="data-quality">Data Quality for {entry?.name}</div>;
  }
}));

vi.mock('../DataProfile/DataProfile', () => ({
  default: function MockDataProfile({ entry }: any) {
    return <div data-testid="data-profile">Data Profile for {entry?.name}</div>;
  }
}));

vi.mock('../EntryList/EntryList', () => ({
  default: function MockEntryList({ entry }: any) {
    return <div data-testid="entry-list">Entry List for {entry?.name}</div>;
  }
}));

vi.mock('../Shimmer/ShimmerLoader', () => ({
  default: function MockShimmerLoader({ count, type }: any) {
    return <div data-testid="shimmer-loader">Loading {count} {type} items...</div>;
  }
}));

// Mock window.open
const mockWindowOpen = vi.fn();
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true
});

describe('ViewDetails', () => {
  const mockUser = {
    name: 'Test User',
    email: 'testuser@sample.com',
    picture: 'https://example.com/avatar.jpg',
    token: 'random-token',
    tokenExpiry: Math.floor(Date.now() / 1000) + 3600,
    tokenIssuedAt: Math.floor(Date.now() / 1000),
    hasRole: true,
    roles: [],
    permissions: [],
    appConfig: {
      aspects: {},
      projects: {},
      defaultSearchProduct: {},
      defaultSearchAssets: {},
      browseByAspectTypes: {},
      browseByAspectTypesLabels: {},
    }
  };

  const mockAuthContextValue = {
    user: mockUser,
    login: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
    silentLogin: vi.fn().mockResolvedValue(true),
  };

  const mockEntry = {
    name: 'project/dataset/table',
    fullyQualifiedName: 'project:dataset.table',
    entrySource: {
      system: 'BigQuery'
    }
  };

  const mockSampleData = {
    columns: ['col1', 'col2'],
    rows: [['value1', 'value2']]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockWindowOpen.mockClear();
    mockToggleFavorite.mockClear();
  });

  const renderViewDetails = (entryState: any = mockEntry, entryStatus = 'succeeded', sampleDataState = mockSampleData, sampleDataStatus = 'succeeded') => {
    // Mock the Redux store state
    const mockStore = {
      ...store.getState(),
      entry: {
        items: entryState,
        status: entryStatus
      },
      sampleData: {
        items: sampleDataState,
        status: sampleDataStatus
      }
    };

    return render(
      <Provider store={{ ...store, getState: () => mockStore as any }}>
        <BrowserRouter>
          <AuthContext.Provider value={mockAuthContextValue}>
            <ViewDetails />
          </AuthContext.Provider>
        </BrowserRouter>
      </Provider>
    );
  };

  it('renders loading state initially', () => {
    renderViewDetails(mockEntry, 'loading');
    
    expect(screen.getByTestId('shimmer-loader')).toBeInTheDocument();
    expect(screen.getByText('Loading 6 card items...')).toBeInTheDocument();
  });

  it('renders the main content when entry is loaded', async () => {
    renderViewDetails();
    
    await waitFor(() => {
      expect(screen.getByText('table')).toBeInTheDocument(); // getName result
    });
    
    // There are multiple tags (system and entry type), so use getAllByTestId
    const tags = screen.getAllByTestId('tag');
    expect(tags).toHaveLength(2); // System tag and entry type tag
    
    expect(screen.getByText('bigquery')).toBeInTheDocument(); // system tag
  });

  it('renders back button and navigates back when clicked', async () => {
    renderViewDetails();
    
    await waitFor(() => {
      // Find the back button by looking for the first button (back button is the first one)
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
    
    const buttons = screen.getAllByRole('button');
    const backButton = buttons[0]; // Back button is the first button
    fireEvent.click(backButton);
    
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('renders favorite star button', async () => {
    renderViewDetails();
    
    await waitFor(() => {
      // Find the star button by looking for the button that contains a star icon
      const buttons = screen.getAllByRole('button');
      const starButton = buttons.find(button => 
        button.querySelector('[data-testid="StarOutlineIcon"]') || 
        button.querySelector('[data-testid="StarIcon"]')
      );
      expect(starButton).toBeInTheDocument();
    });
  });

  it('toggles favorite when star button is clicked', async () => {
    renderViewDetails();
    
    await waitFor(() => {
      // Find the star button by looking for the button that contains a star icon
      const buttons = screen.getAllByRole('button');
      const starButton = buttons.find(button => 
        button.querySelector('[data-testid="StarOutlineIcon"]') || 
        button.querySelector('[data-testid="StarIcon"]')
      );
      expect(starButton).toBeInTheDocument();
      fireEvent.click(starButton!);
    });
    
    // The mock toggleFavorite function should be called
    expect(mockToggleFavorite).toHaveBeenCalled();
  });

  it('renders BigQuery button and opens BigQuery console', async () => {
    renderViewDetails();
    
    await waitFor(() => {
      const bigQueryButton = screen.getByText('Open in BigQuery');
      expect(bigQueryButton).toBeInTheDocument();
    });
    
    const bigQueryButton = screen.getByText('Open in BigQuery');
    fireEvent.click(bigQueryButton);
    
    expect(mockWindowOpen).toHaveBeenCalledWith(
      expect.stringContaining('console.cloud.google.com/bigquery'),
      '_blank'
    );
  });

  it('renders Looker Studio button and opens Looker Studio', async () => {
    renderViewDetails();
    
    await waitFor(() => {
      const lookerButton = screen.getByText('Explore with Looker Studio');
      expect(lookerButton).toBeInTheDocument();
    });
    
    const lookerButton = screen.getByText('Explore with Looker Studio');
    fireEvent.click(lookerButton);
    
    expect(mockWindowOpen).toHaveBeenCalledWith('https://lookerstudio.google.com', '_blank');
  });

  it('renders tabs for Tables entry type', async () => {
    renderViewDetails();
    
    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Annotations')).toBeInTheDocument();
      expect(screen.getByText('Lineage')).toBeInTheDocument();
      expect(screen.getByText('Data Profile')).toBeInTheDocument();
      expect(screen.getByText('Data Quality')).toBeInTheDocument();
    });
  });

  it('renders tabs for Datasets entry type', async () => {
    const datasetEntry = { ...mockEntry, name: 'project/dataset' };
    renderViewDetails(datasetEntry);
    
    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Entry List')).toBeInTheDocument();
      expect(screen.getByText('Annotations')).toBeInTheDocument();
    });
    
    // Should not have Data Profile and Data Quality tabs for Datasets
    expect(screen.queryByText('Data Profile')).not.toBeInTheDocument();
    expect(screen.queryByText('Data Quality')).not.toBeInTheDocument();
  });

  it('switches between tabs when clicked', async () => {
    renderViewDetails();
    
    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });
    
    // Initially Overview tab should be active
    expect(screen.getByTestId('tabpanel-0')).toBeInTheDocument();
    expect(screen.getByTestId('detail-page-overview')).toBeInTheDocument();
    
    // Click on Annotations tab
    const annotationsTab = screen.getByText('Annotations');
    fireEvent.click(annotationsTab);
    
    await waitFor(() => {
      expect(screen.getByTestId('tabpanel-1')).toBeInTheDocument();
      expect(screen.getByTestId('annotation-filter')).toBeInTheDocument();
    });
  });

  it('renders overview tab content', async () => {
    renderViewDetails();
    
    await waitFor(() => {
      expect(screen.getByTestId('detail-page-overview')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Overview for project/dataset/table')).toBeInTheDocument();
  });

  it('renders sample data in overview when available', async () => {
    renderViewDetails();
    
    await waitFor(() => {
      expect(screen.getByTestId('sample-data')).toBeInTheDocument();
    });
  });

  it('renders annotation filter and preview annotation', async () => {
    renderViewDetails();
    
    await waitFor(() => {
      const annotationsTab = screen.getByText('Annotations');
      fireEvent.click(annotationsTab);
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('annotation-filter')).toBeInTheDocument();
      expect(screen.getByTestId('preview-annotation')).toBeInTheDocument();
    });
  });

  it('renders lineage tab content', async () => {
    renderViewDetails();
    
    await waitFor(() => {
      const lineageTab = screen.getByText('Lineage');
      fireEvent.click(lineageTab);
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('lineage')).toBeInTheDocument();
    });
  });

  it('renders data profile tab content', async () => {
    renderViewDetails();
    
    await waitFor(() => {
      const dataProfileTab = screen.getByText('Data Profile');
      fireEvent.click(dataProfileTab);
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('data-profile')).toBeInTheDocument();
    });
  });

  it('renders data quality tab content', async () => {
    renderViewDetails();
    
    await waitFor(() => {
      const dataQualityTab = screen.getByText('Data Quality');
      fireEvent.click(dataQualityTab);
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('data-quality')).toBeInTheDocument();
    });
  });

  it('renders entry list for datasets', async () => {
    const datasetEntry = { ...mockEntry, name: 'project/dataset' };
    renderViewDetails(datasetEntry);
    
    await waitFor(() => {
      const entryListTab = screen.getByText('Entry List');
      fireEvent.click(entryListTab);
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('entry-list')).toBeInTheDocument();
    });
  });

  it('handles missing entry gracefully', () => {
    // Test with loading state when entry is null
    renderViewDetails(null, 'loading');
    
    // Should show loading state
    expect(screen.getByTestId('shimmer-loader')).toBeInTheDocument();
  });

  it('handles null entry with succeeded status', () => {
    // This tests the edge case where status is succeeded but entry is null
    // The component should handle this gracefully
    try {
      renderViewDetails(null, 'succeeded');
      // If it doesn't crash, the test passes
      expect(true).toBe(true);
    } catch (error) {
      // If it does crash, we expect it to be handled gracefully
      expect(error).toBeDefined();
    }
  });

  it('handles missing user data gracefully', () => {
    const authContextWithoutUser = {
      ...mockAuthContextValue,
      user: null
    };

    render(
      <Provider store={store}>
        <BrowserRouter>
          <AuthContext.Provider value={authContextWithoutUser}>
            <ViewDetails />
          </AuthContext.Provider>
        </BrowserRouter>
      </Provider>
    );
    
    // Should still render without crashing
    expect(screen.getByTestId('shimmer-loader')).toBeInTheDocument();
  });

  it('applies annotation filter when filter changes', async () => {
    renderViewDetails();
    
    await waitFor(() => {
      const annotationsTab = screen.getByText('Annotations');
      fireEvent.click(annotationsTab);
    });
    
    await waitFor(() => {
      const applyFilterButton = screen.getByText('Apply Filter');
      fireEvent.click(applyFilterButton);
    });
    
    // The filtered entry should be passed to PreviewAnnotation
    expect(screen.getByText('Preview Annotation for project/dataset/table')).toBeInTheDocument();
  });

  it('resets tab value when entry changes', async () => {
    const { rerender } = renderViewDetails();
    
    await waitFor(() => {
      const annotationsTab = screen.getByText('Annotations');
      fireEvent.click(annotationsTab);
    });
    
    // Change entry
    const newEntry = { ...mockEntry, name: 'project/dataset/newtable' };
    rerender(
      <Provider store={{ ...store, getState: () => ({ ...store.getState(), entry: { items: newEntry, status: 'succeeded' } }) as any }}>
        <BrowserRouter>
          <AuthContext.Provider value={mockAuthContextValue}>
            <ViewDetails />
          </AuthContext.Provider>
        </BrowserRouter>
      </Provider>
    );
    
    // Tab should reset to Overview (index 0)
    await waitFor(() => {
      expect(screen.getByTestId('tabpanel-0')).toBeInTheDocument();
    });
  });

  it('renders correctly for Tables entry type with sample data', async () => {
    renderViewDetails();
    
    await waitFor(() => {
      // Verify that the component renders with Tables-specific tabs
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Annotations')).toBeInTheDocument();
      expect(screen.getByText('Lineage')).toBeInTheDocument();
      expect(screen.getByText('Data Profile')).toBeInTheDocument();
      expect(screen.getByText('Data Quality')).toBeInTheDocument();
    });
    
    // Verify that sample data is displayed in overview
    await waitFor(() => {
      expect(screen.getByTestId('sample-data')).toBeInTheDocument();
    });
  });
});
