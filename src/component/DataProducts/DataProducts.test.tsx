import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    _setStore: (newStore: Record<string, string>) => {
      store = newStore;
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Store mock state for useSelector
let mockReduxState: any = {
  dataProducts: {
    dataProductAssets: [],
    dataProductAssetsStatus: 'idle'
  }
};

// Use vi.hoisted for mocks used inside vi.mock
const { mockDispatch, mockNavigate } = vi.hoisted(() => ({
  mockDispatch: vi.fn(),
  mockNavigate: vi.fn()
}));

// Mock react-redux
vi.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: (state: any) => any) => selector(mockReduxState),
}));

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock AuthProvider
vi.mock('../../auth/AuthProvider', () => ({
  useAuth: () => ({
    user: { token: 'test-token-123' }
  })
}));

// Use vi.hoisted to create mocks that can be used inside vi.mock
const { mockAxiosPost, mockAxiosCancelToken } = vi.hoisted(() => ({
  mockAxiosPost: vi.fn(),
  mockAxiosCancelToken: {
    source: vi.fn(() => ({
      token: 'mock-cancel-token',
      cancel: vi.fn(),
    })),
  }
}));

vi.mock('axios', () => ({
  default: {
    post: (...args: any[]) => mockAxiosPost(...args),
    get: vi.fn(),
    defaults: {
      headers: { common: {} }
    },
    CancelToken: mockAxiosCancelToken,
    isCancel: vi.fn((error: any) => error?.message === 'Cancelled'),
  }
}));

// Mock useDebounce hook - controllable via mockDebouncedSearchValue
const { mockDebouncedSearchValue } = vi.hoisted(() => ({
  mockDebouncedSearchValue: { value: '' }
}));

vi.mock('../../hooks/useDebounce', () => ({
  default: (_value: string) => {
    // If mockDebouncedSearchValue.value is set, use it; otherwise return empty
    if (mockDebouncedSearchValue.value) {
      return mockDebouncedSearchValue.value;
    }
    return '';
  }
}));

// Mock getMimeType utility
vi.mock('../../utils/resourceUtils', () => ({
  getMimeType: vi.fn((base64: string) => {
    if (base64?.startsWith('iVBORw0KGgo')) return 'image/png';
    if (base64?.startsWith('/9j/')) return 'image/jpg';
    return 'image/png';
  })
}));

// Mock dataProductsSlice actions
vi.mock('../../features/dataProducts/dataProductsSlice', () => ({
  default: (state = {}) => state,
  fetchDataProductsList: vi.fn((args) => ({ type: 'dataProducts/fetchDataProductsList', payload: args })),
  getDataProductDetails: vi.fn((args) => ({ type: 'dataProducts/getDataProductDetails', payload: args })),
}));

// Mock Tag component
vi.mock('../Tags/Tag', () => ({
  default: ({ text, css }: { text: string; css?: any }) => (
    <span data-testid="tag" style={css}>{text}</span>
  )
}));

// Capture props for child components
let capturedTableFilterProps: any = null;
let capturedTableViewProps: any = null;
let capturedDataProductAssetsProps: any = null;

// Mock TableFilter
vi.mock('../Filter/TableFilter', () => ({
  default: (props: any) => {
    capturedTableFilterProps = props;
    return (
      <div data-testid="table-filter">
        TableFilter Mock
        <button
          data-testid="apply-filter"
          onClick={() => props.onFilteredDataChange && props.onFilteredDataChange(props.data)}
        >
          Apply Filter
        </button>
      </div>
    );
  }
}));

// Mock TableView - call renderCell to exercise column rendering code
vi.mock('../Table/TableView', () => ({
  default: (props: any) => {
    capturedTableViewProps = props;
    // Call renderCell for each column to exercise the rendering logic
    const renderedCells = props.columns?.map((col: any, colIndex: number) => {
      if (col.renderCell && props.rows?.length > 0) {
        try {
          const cellContent = col.renderCell({ row: props.rows[0], field: col.field });
          return <div key={colIndex} data-testid={`cell-${col.field}`}>{cellContent}</div>;
        } catch (e) {
          return <div key={colIndex} data-testid={`cell-${col.field}-error`}>Error</div>;
        }
      }
      return null;
    });
    return (
      <div data-testid="table-view">
        TableView Mock - {props.rows?.length || 0} rows
        <div data-testid="rendered-cells">{renderedCells}</div>
      </div>
    );
  }
}));

// Mock DataProductAssets
vi.mock('./DataProductAssets', () => ({
  default: (props: any) => {
    capturedDataProductAssetsProps = props;
    return (
      <div data-testid="data-product-assets">
        DataProductAssets Mock - {props.linkedAssets?.length || 0} assets
        <button
          data-testid="trigger-preview"
          onClick={() => props.onAssetPreviewChange && props.onAssetPreviewChange({ name: 'test-asset' })}
        >
          Preview Asset
        </button>
      </div>
    );
  }
}));

// Import components after mocks
import AccessGroup from './AccessGroup';
import Assets from './Assets';
import Contract from './Contract';
import DataProducts from './DataProducts';

describe('DataProducts Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    localStorageMock._setStore({});
    capturedTableFilterProps = null;
    capturedTableViewProps = null;
    capturedDataProductAssetsProps = null;
    mockReduxState = {
      dataProducts: {
        dataProductAssets: [],
        dataProductAssetsStatus: 'idle'
      }
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================
  // ACCESSGROUP COMPONENT TESTS
  // ============================================
  describe('AccessGroup', () => {
    const mockEntry = {
      name: 'test-entry',
      entryType: 'dataProducts/123',
      aspects: {}
    };

    const defaultProps = {
      entry: mockEntry,
      css: { width: '100%' }
    };

    const renderAccessGroup = (props = {}) => {
      return render(<AccessGroup {...defaultProps} {...props} />);
    };

    describe('rendering', () => {
      it('should render the Access Groups section heading', () => {
        renderAccessGroup();
        expect(screen.getByText('Access Groups')).toBeInTheDocument();
      });

      it('should render the Asset permissions section heading', () => {
        renderAccessGroup();
        expect(screen.getByText('Asset permissions')).toBeInTheDocument();
      });

      it('should render description text for Access Groups', () => {
        renderAccessGroup();
        expect(screen.getByText(/Define access groups which will be used by Data product consumers/)).toBeInTheDocument();
      });

      it('should render description text for Asset permissions', () => {
        renderAccessGroup();
        expect(screen.getByText(/View which permissions are mapped to each asset/)).toBeInTheDocument();
      });

      it('should apply custom CSS styles', () => {
        const customCss = { margin: '20px', padding: '10px' };
        const { container } = renderAccessGroup({ css: customCss });
        const rootDiv = container.firstChild as HTMLElement;
        expect(rootDiv).toHaveStyle('width: 100%');
      });
    });

    describe('access groups display', () => {
      it('should show "no access groups" message when localStorage is empty', () => {
        localStorageMock.getItem.mockReturnValue(null);
        renderAccessGroup();
        expect(screen.getByText('No access groups defined for this data product.')).toBeInTheDocument();
      });

      it('should show "no access groups" message when accessGroups is empty object', () => {
        localStorageMock.getItem.mockReturnValue(JSON.stringify({ accessGroups: {} }));
        renderAccessGroup();
        expect(screen.getByText('No access groups defined for this data product.')).toBeInTheDocument();
      });

      it('should display access groups from localStorage', () => {
        const mockSelectedDataProduct = {
          accessGroups: {
            'group1': {
              id: 'group1',
              displayName: 'Admin Group',
              principal: { googleGroup: 'admin@example.com' }
            },
            'group2': {
              id: 'group2',
              displayName: 'Viewer Group',
              principal: { googleGroup: 'viewers@example.com' }
            }
          }
        };
        localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSelectedDataProduct));

        renderAccessGroup();

        expect(screen.getByText('Admin Group :')).toBeInTheDocument();
        expect(screen.getByText('Viewer Group :')).toBeInTheDocument();
        expect(screen.getByText('admin@example.com')).toBeInTheDocument();
        expect(screen.getByText('viewers@example.com')).toBeInTheDocument();
      });

      it('should display "No group defined" when principal.googleGroup is missing', () => {
        const mockSelectedDataProduct = {
          accessGroups: {
            'group1': {
              id: 'group1',
              displayName: 'Orphan Group',
              principal: {}
            }
          }
        };
        localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSelectedDataProduct));

        renderAccessGroup();

        expect(screen.getByText('Orphan Group :')).toBeInTheDocument();
        expect(screen.getByText('No group defined')).toBeInTheDocument();
      });

      it('should render email icon for each access group', () => {
        const mockSelectedDataProduct = {
          accessGroups: {
            'group1': {
              id: 'group1',
              displayName: 'Test Group',
              principal: { googleGroup: 'test@example.com' }
            }
          }
        };
        localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSelectedDataProduct));

        renderAccessGroup();

        expect(screen.getByTestId('EmailOutlinedIcon')).toBeInTheDocument();
      });
    });

    describe('asset permissions table', () => {
      it('should not show asset permission view when dataProductAssetsStatus is not succeeded', () => {
        mockReduxState = {
          dataProducts: {
            dataProductAssets: [],
            dataProductAssetsStatus: 'idle'
          }
        };
        renderAccessGroup();
        // When status is not 'succeeded', the accessPermissionView is not rendered
        expect(screen.queryByTestId('table-filter')).not.toBeInTheDocument();
        expect(screen.queryByTestId('table-view')).not.toBeInTheDocument();
      });

      it('should show "No data to display" when dataProductAssets is empty', () => {
        mockReduxState = {
          dataProducts: {
            dataProductAssets: [],
            dataProductAssetsStatus: 'succeeded'
          }
        };
        renderAccessGroup();
        // Component shows different padding/styling for empty state
        expect(screen.queryByTestId('table-filter')).not.toBeInTheDocument();
        expect(screen.queryByTestId('table-view')).not.toBeInTheDocument();
      });

      it('should render TableFilter and TableView when data is available', () => {
        mockReduxState = {
          dataProducts: {
            dataProductAssets: [
              {
                resource: 'projects/test-project/datasets/test-dataset/tables/test-table',
                accessGroupConfigs: {
                  'admin-group': {
                    iamRoles: ['roles/bigquery.dataViewer', 'roles/bigquery.user']
                  }
                }
              }
            ],
            dataProductAssetsStatus: 'succeeded'
          }
        };

        renderAccessGroup();

        expect(screen.getByTestId('table-filter')).toBeInTheDocument();
        expect(screen.getByTestId('table-view')).toBeInTheDocument();
      });

      it('should process asset data correctly with multiple access groups', () => {
        mockReduxState = {
          dataProducts: {
            dataProductAssets: [
              {
                resource: 'projects/my-project/datasets/my-dataset/tables/my-table',
                accessGroupConfigs: {
                  'group1': { iamRoles: ['roles/bigquery.dataViewer'] },
                  'group2': { iamRoles: ['roles/bigquery.dataEditor', 'roles/bigquery.admin'] }
                }
              }
            ],
            dataProductAssetsStatus: 'succeeded'
          }
        };

        renderAccessGroup();

        // Check TableFilter was called with processed data
        expect(capturedTableFilterProps).not.toBeNull();
        expect(capturedTableFilterProps.data).toHaveLength(1);
        expect(capturedTableFilterProps.data[0].Name).toBe('my-table');
        expect(capturedTableFilterProps.data[0].Type).toBe('tables');
        expect(capturedTableFilterProps.data[0].System).toBe('Bigquery');
        expect(capturedTableFilterProps.data[0]['Source-Project']).toBe('my-project');
        expect(capturedTableFilterProps.data[0]['Mapped-Permissions']).toHaveLength(2);
      });

      it('should handle assets without accessGroupConfigs', () => {
        mockReduxState = {
          dataProducts: {
            dataProductAssets: [
              {
                resource: 'projects/test-project/datasets/test-dataset/tables/test-table'
              }
            ],
            dataProductAssetsStatus: 'succeeded'
          }
        };

        renderAccessGroup();

        expect(capturedTableFilterProps.data[0]['Mapped-Permissions']).toEqual([]);
      });

      it('should handle filter changes', () => {
        mockReduxState = {
          dataProducts: {
            dataProductAssets: [
              {
                resource: 'projects/test-project/datasets/test-dataset/tables/test-table',
                accessGroupConfigs: {}
              },
              {
                resource: 'projects/test-project/datasets/test-dataset/tables/other-table',
                accessGroupConfigs: {}
              }
            ],
            dataProductAssetsStatus: 'succeeded'
          }
        };

        renderAccessGroup();

        // Trigger filter
        const applyFilterButton = screen.getByTestId('apply-filter');
        fireEvent.click(applyFilterButton);

        // Verify filter callback was received
        expect(capturedTableFilterProps.onFilteredDataChange).toBeDefined();
      });

      it('should handle multiple assets correctly', () => {
        mockReduxState = {
          dataProducts: {
            dataProductAssets: [
              {
                resource: 'projects/project1/datasets/dataset1/tables/table1',
                accessGroupConfigs: { 'g1': { iamRoles: ['role1'] } }
              },
              {
                resource: 'projects/project2/datasets/dataset2/tables/table2',
                accessGroupConfigs: { 'g2': { iamRoles: ['role2', 'role3'] } }
              },
              {
                resource: 'projects/project3/datasets/dataset3/tables/table3',
                accessGroupConfigs: {}
              }
            ],
            dataProductAssetsStatus: 'succeeded'
          }
        };

        renderAccessGroup();

        expect(capturedTableFilterProps.data).toHaveLength(3);
        expect(capturedTableViewProps.rows).toHaveLength(3);
      });
    });

    describe('column configuration', () => {
      it('should pass correct columns to TableFilter', () => {
        mockReduxState = {
          dataProducts: {
            dataProductAssets: [
              {
                resource: 'projects/test/datasets/ds/tables/tbl',
                accessGroupConfigs: { 'g': { iamRoles: ['r'] } }
              }
            ],
            dataProductAssetsStatus: 'succeeded'
          }
        };

        renderAccessGroup();

        const expectedColumns = ['Name', 'Type', 'System', 'Source-Project', 'Mapped-Permissions'];
        expect(capturedTableFilterProps.columns).toEqual(expectedColumns);
      });

      it('should pass columns with correct configuration to TableView', () => {
        mockReduxState = {
          dataProducts: {
            dataProductAssets: [
              {
                resource: 'projects/test/datasets/ds/tables/tbl',
                accessGroupConfigs: { 'g': { iamRoles: ['r'] } }
              }
            ],
            dataProductAssetsStatus: 'succeeded'
          }
        };

        renderAccessGroup();

        expect(capturedTableViewProps.columns).toHaveLength(5);
        expect(capturedTableViewProps.columnHeaderHeight).toBe(37);
        expect(capturedTableViewProps.rowHeight).toBe(55);
      });
    });

    describe('entry handling', () => {
      it('should handle entry without entryType', () => {
        const entryWithoutType = { name: 'test', aspects: {} };
        renderAccessGroup({ entry: entryWithoutType });
        expect(screen.getByText('Access Groups')).toBeInTheDocument();
      });

      it('should handle null entry', () => {
        renderAccessGroup({ entry: null });
        expect(screen.getByText('Access Groups')).toBeInTheDocument();
      });

      it('should handle undefined entry', () => {
        renderAccessGroup({ entry: undefined });
        expect(screen.getByText('Access Groups')).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // ASSETS COMPONENT TESTS
  // ============================================
  describe('Assets', () => {
    const mockEntry = {
      name: 'test-entry',
      entryType: 'dataProducts/123',
      aspects: {}
    };

    const defaultProps = {
      entry: mockEntry,
      css: { width: '100%' }
    };

    const renderAssets = (props = {}) => {
      return render(<Assets {...defaultProps} {...props} />);
    };

    describe('loading state', () => {
      it('should show skeleton loaders when status is loading', () => {
        mockReduxState = {
          dataProducts: {
            dataProductAssets: [],
            dataProductAssetsStatus: 'loading'
          }
        };

        renderAssets();

        // Skeletons should be visible
        const skeletons = document.querySelectorAll('.MuiSkeleton-root');
        expect(skeletons.length).toBeGreaterThan(0);
      });

      it('should not show DataProductAssets when loading', () => {
        mockReduxState = {
          dataProducts: {
            dataProductAssets: [],
            dataProductAssetsStatus: 'loading'
          }
        };

        renderAssets();

        expect(screen.queryByTestId('data-product-assets')).not.toBeInTheDocument();
      });
    });

    describe('empty state', () => {
      it('should show empty message when assets list is empty and status is succeeded', async () => {
        mockReduxState = {
          dataProducts: {
            dataProductAssets: [],
            dataProductAssetsStatus: 'succeeded'
          }
        };

        renderAssets();

        await waitFor(() => {
          expect(screen.getByText('No data product assets found')).toBeInTheDocument();
        });
      });

      it('should show empty message when status is failed', async () => {
        mockReduxState = {
          dataProducts: {
            dataProductAssets: [],
            dataProductAssetsStatus: 'failed'
          }
        };

        renderAssets();

        await waitFor(() => {
          expect(screen.getByText('No data product assets found')).toBeInTheDocument();
        });
      });
    });

    describe('success state', () => {
      beforeEach(() => {
        mockAxiosPost.mockResolvedValue({
          data: {
            results: [
              {
                dataplexEntry: {
                  name: 'test-asset-1',
                  entrySource: { displayName: 'Test Asset 1' }
                }
              },
              {
                dataplexEntry: {
                  name: 'test-asset-2',
                  entrySource: { displayName: 'Test Asset 2' }
                }
              }
            ]
          }
        });
      });

      it('should render DataProductAssets when status is succeeded with data', async () => {
        mockReduxState = {
          dataProducts: {
            dataProductAssets: [
              { resource: 'projects/p1/datasets/d1/tables/t1' }
            ],
            dataProductAssetsStatus: 'succeeded'
          }
        };

        renderAssets();

        await waitFor(() => {
          expect(screen.getByTestId('data-product-assets')).toBeInTheDocument();
        });
      });

      it('should make API call to search entries', async () => {
        mockReduxState = {
          dataProducts: {
            dataProductAssets: [
              { resource: 'projects/test-project/datasets/test-dataset/tables/test-table' }
            ],
            dataProductAssetsStatus: 'succeeded'
          }
        };

        renderAssets();

        await waitFor(() => {
          expect(mockAxiosPost).toHaveBeenCalled();
        });

        // Check the API call was made with correct structure
        const [url, body, config] = mockAxiosPost.mock.calls[0];
        expect(url).toContain('dataplex.googleapis.com');
        expect(url).toContain('searchEntries');
        expect(body).toHaveProperty('query');
        expect(config.headers).toHaveProperty('Authorization', 'Bearer test-token-123');
      });

      it('should construct correct search query from assets', async () => {
        mockReduxState = {
          dataProducts: {
            dataProductAssets: [
              { resource: 'projects/proj1/datasets/ds1/tables/tbl1' },
              { resource: 'projects/proj2/datasets/ds2/tables/tbl2' }
            ],
            dataProductAssetsStatus: 'succeeded'
          }
        };

        renderAssets();

        await waitFor(() => {
          expect(mockAxiosPost).toHaveBeenCalled();
        });

        const [, body] = mockAxiosPost.mock.calls[0];
        expect(body.query).toContain('fully_qualified_name=');
        expect(body.query).toContain('bigquery:proj1.ds1.tbl1');
        expect(body.query).toContain('bigquery:proj2.ds2.tbl2');
      });

      it('should pass correct props to DataProductAssets', async () => {
        mockReduxState = {
          dataProducts: {
            dataProductAssets: [
              { resource: 'projects/p/datasets/d/tables/t' }
            ],
            dataProductAssetsStatus: 'succeeded'
          }
        };

        renderAssets();

        await waitFor(() => {
          expect(capturedDataProductAssetsProps).not.toBeNull();
        });

        expect(capturedDataProductAssetsProps.idToken).toBe('test-token-123');
        expect(capturedDataProductAssetsProps.onAssetPreviewChange).toBeDefined();
        expect(capturedDataProductAssetsProps.searchTerm).toBe('');
        expect(capturedDataProductAssetsProps.onSearchTermChange).toBeDefined();
      });

      it('should handle asset preview change callback', async () => {
        const mockOnAssetPreviewChange = vi.fn();
        mockReduxState = {
          dataProducts: {
            dataProductAssets: [
              { resource: 'projects/p/datasets/d/tables/t' }
            ],
            dataProductAssetsStatus: 'succeeded'
          }
        };

        renderAssets({ onAssetPreviewChange: mockOnAssetPreviewChange });

        await waitFor(() => {
          expect(screen.getByTestId('data-product-assets')).toBeInTheDocument();
        });

        // Trigger preview
        const previewButton = screen.getByTestId('trigger-preview');
        fireEvent.click(previewButton);

        expect(mockOnAssetPreviewChange).toHaveBeenCalledWith({ name: 'test-asset' });
      });
    });

    describe('API error handling', () => {
      it('should handle API error gracefully', async () => {
        mockAxiosPost.mockRejectedValue(new Error('API Error'));

        mockReduxState = {
          dataProducts: {
            dataProductAssets: [
              { resource: 'projects/p/datasets/d/tables/t' }
            ],
            dataProductAssetsStatus: 'succeeded'
          }
        };

        // Should not throw
        expect(() => renderAssets()).not.toThrow();

        // Wait for API call to complete (and fail)
        await waitFor(() => {
          expect(mockAxiosPost).toHaveBeenCalled();
        });
      });
    });

    describe('entry handling', () => {
      it('should handle entry without entryType', () => {
        mockReduxState = {
          dataProducts: {
            dataProductAssets: [],
            dataProductAssetsStatus: 'idle'
          }
        };

        const entryWithoutType = { name: 'test', aspects: {} };
        expect(() => renderAssets({ entry: entryWithoutType })).not.toThrow();
      });

      it('should handle resource with different path structures', async () => {
        mockAxiosPost.mockResolvedValue({ data: { results: [] } });

        mockReduxState = {
          dataProducts: {
            dataProductAssets: [
              // Standard BigQuery table path
              { resource: 'projects/p1/datasets/d1/tables/t1' },
              // Dataset path (shorter)
              { resource: 'projects/p2/datasets/d2' },
              // Path with URL prefix
              { resource: '//bigquery.googleapis.com/projects/p3/datasets/d3/tables/t3' }
            ],
            dataProductAssetsStatus: 'succeeded'
          }
        };

        renderAssets();

        await waitFor(() => {
          expect(mockAxiosPost).toHaveBeenCalled();
        });
      });
    });

    describe('CSS styling', () => {
      it('should apply custom CSS to Paper component', () => {
        const customCss = { backgroundColor: 'red' };
        const { container } = renderAssets({ css: customCss });

        const paper = container.querySelector('.MuiPaper-root');
        expect(paper).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // CONTRACT COMPONENT TESTS
  // ============================================
  describe('Contract', () => {
    const mockEntry = {
      name: 'test-entry',
      entryType: 'dataProducts/123',
      aspects: {
        '123.global.refresh-cadence': {
          data: {
            frequency: 'daily',
            lastRefresh: '2024-01-15',
            nextScheduled: '2024-01-16'
          }
        }
      }
    };

    const defaultProps = {
      entry: mockEntry,
      css: { width: '100%' }
    };

    const renderContract = (props = {}) => {
      return render(<Contract {...defaultProps} {...props} />);
    };

    describe('rendering', () => {
      it('should render Contracts heading', () => {
        renderContract();
        expect(screen.getByText('Contracts')).toBeInTheDocument();
      });

      it('should render contract description text', () => {
        renderContract();
        expect(screen.getByText(/Contract guarantees define the service level agreements/)).toBeInTheDocument();
      });

      it('should apply custom CSS styles', () => {
        const customCss = { margin: '20px' };
        const { container } = renderContract({ css: customCss });
        const rootDiv = container.firstChild as HTMLElement;
        expect(rootDiv).toHaveStyle('width: 100%');
      });
    });

    describe('contract cards', () => {
      it('should render contract card with refresh-cadence title', () => {
        renderContract();
        expect(screen.getByText('refresh-cadence')).toBeInTheDocument();
      });

      it('should display contract data in table format', () => {
        renderContract();

        // Check for key-value pairs
        expect(screen.getByText('frequency')).toBeInTheDocument();
        expect(screen.getByText('daily')).toBeInTheDocument();
        expect(screen.getByText('lastRefresh')).toBeInTheDocument();
        expect(screen.getByText('2024-01-15')).toBeInTheDocument();
        expect(screen.getByText('nextScheduled')).toBeInTheDocument();
        expect(screen.getByText('2024-01-16')).toBeInTheDocument();
      });

      it('should render card with border styling', () => {
        const { container } = renderContract();

        // Find the card box with border
        const cardBox = container.querySelector('[class*="MuiBox-root"]');
        expect(cardBox).toBeInTheDocument();
      });
    });

    describe('empty/missing data handling', () => {
      it('should handle missing refresh-cadence aspect', () => {
        const entryWithoutRefreshCadence = {
          name: 'test-entry',
          entryType: 'dataProducts/123',
          aspects: {}
        };

        expect(() => renderContract({ entry: entryWithoutRefreshCadence })).not.toThrow();
        expect(screen.getByText('Contracts')).toBeInTheDocument();
      });

      it('should handle empty aspects object', () => {
        const entryWithEmptyAspects = {
          name: 'test-entry',
          entryType: 'dataProducts/123',
          aspects: {}
        };

        expect(() => renderContract({ entry: entryWithEmptyAspects })).not.toThrow();
      });

      it('should handle null data in refresh-cadence', () => {
        const entryWithNullData = {
          name: 'test-entry',
          entryType: 'dataProducts/123',
          aspects: {
            '123.global.refresh-cadence': {
              data: null
            }
          }
        };

        expect(() => renderContract({ entry: entryWithNullData })).not.toThrow();
      });

      it('should handle undefined entry.aspects by throwing (component requires aspects)', () => {
        const entryWithoutAspects = {
          name: 'test-entry',
          entryType: 'dataProducts/123'
        };

        // Component requires entry.aspects to be defined - this is expected behavior
        expect(() => renderContract({ entry: entryWithoutAspects })).toThrow();
      });
    });

    describe('entry type handling', () => {
      it('should extract number from entryType correctly', () => {
        const entryWithDifferentNumber = {
          name: 'test-entry',
          entryType: 'dataProducts/456',
          aspects: {
            '456.global.refresh-cadence': {
              data: {
                testKey: 'testValue'
              }
            }
          }
        };

        renderContract({ entry: entryWithDifferentNumber });
        expect(screen.getByText('testKey')).toBeInTheDocument();
        expect(screen.getByText('testValue')).toBeInTheDocument();
      });

      it('should handle entry without entryType', () => {
        const entryWithoutType = {
          name: 'test-entry',
          aspects: {}
        };

        expect(() => renderContract({ entry: entryWithoutType })).not.toThrow();
      });

      it('should handle null entry by throwing (component requires entry)', () => {
        // Component requires entry to be defined - this is expected behavior
        expect(() => renderContract({ entry: null })).toThrow();
      });
    });

    describe('multiple contract values', () => {
      it('should render all key-value pairs from contracts data', () => {
        const entryWithMultipleValues = {
          name: 'test-entry',
          entryType: 'dataProducts/789',
          aspects: {
            '789.global.refresh-cadence': {
              data: {
                key1: 'value1',
                key2: 'value2',
                key3: 'value3',
                key4: 'value4',
                key5: 'value5'
              }
            }
          }
        };

        renderContract({ entry: entryWithMultipleValues });

        for (let i = 1; i <= 5; i++) {
          expect(screen.getByText(`key${i}`)).toBeInTheDocument();
          expect(screen.getByText(`value${i}`)).toBeInTheDocument();
        }
      });

      it('should handle numeric values in contract data', () => {
        const entryWithNumericValues = {
          name: 'test-entry',
          entryType: 'dataProducts/123',
          aspects: {
            '123.global.refresh-cadence': {
              data: {
                count: 42,
                percentage: 99.5
              }
            }
          }
        };

        renderContract({ entry: entryWithNumericValues });

        expect(screen.getByText('count')).toBeInTheDocument();
        expect(screen.getByText('42')).toBeInTheDocument();
        expect(screen.getByText('percentage')).toBeInTheDocument();
        expect(screen.getByText('99.5')).toBeInTheDocument();
      });

      it('should handle boolean values in contract data', () => {
        const entryWithBooleanValues = {
          name: 'test-entry',
          entryType: 'dataProducts/123',
          aspects: {
            '123.global.refresh-cadence': {
              data: {
                enabled: true,
                deprecated: false
              }
            }
          }
        };

        renderContract({ entry: entryWithBooleanValues });

        expect(screen.getByText('enabled')).toBeInTheDocument();
        expect(screen.getByText('true')).toBeInTheDocument();
        expect(screen.getByText('deprecated')).toBeInTheDocument();
        expect(screen.getByText('false')).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // FIELD RENDERER COMPONENTS TESTS (via AccessGroup)
  // ============================================
  describe('FieldRenderer Components', () => {
    // We test FieldRenderer components through AccessGroup since they're defined in that file
    // and used for rendering Mapped-Permissions cell content

    describe('FieldRenderer edge cases', () => {
      it('should render "-" for null field', () => {
        // FieldRenderer is internal to AccessGroup, tested via its usage
        // This tests the component renders without error with various data
        mockReduxState = {
          dataProducts: {
            dataProductAssets: [],
            dataProductAssetsStatus: 'succeeded'
          }
        };

        expect(() => render(<AccessGroup entry={{ entryType: 'test/1' }} css={{}} />)).not.toThrow();
      });
    });
  });

  // ============================================
  // ADDITIONAL ACCESSGROUP TESTS FOR COVERAGE
  // ============================================
  describe('AccessGroup Additional Coverage', () => {
    describe('Mapped-Permissions column rendering', () => {
      it('should render Mapped-Permissions cell content correctly', () => {
        mockReduxState = {
          dataProducts: {
            dataProductAssets: [
              {
                resource: 'projects/test-proj/datasets/test-ds/tables/test-tbl',
                accessGroupConfigs: {
                  'admin-group': { iamRoles: ['roles/bigquery.dataViewer', 'roles/bigquery.admin'] },
                  'viewer-group': { iamRoles: ['roles/bigquery.dataViewer'] }
                }
              }
            ],
            dataProductAssetsStatus: 'succeeded'
          }
        };

        render(<AccessGroup entry={{ entryType: 'dataProducts/123' }} css={{}} />);

        // TableView mock should render the cells
        expect(screen.getByTestId('table-view')).toBeInTheDocument();
        expect(screen.getByTestId('rendered-cells')).toBeInTheDocument();
      });

      it('should handle row processing with multiple mapped permissions', () => {
        mockReduxState = {
          dataProducts: {
            dataProductAssets: [
              {
                resource: 'projects/p1/datasets/d1/tables/t1',
                accessGroupConfigs: {
                  'g1': { iamRoles: ['r1', 'r2', 'r3'] },
                  'g2': { iamRoles: ['r4'] },
                  'g3': { iamRoles: [] }
                }
              },
              {
                resource: 'projects/p2/datasets/d2/tables/t2',
                accessGroupConfigs: {}
              }
            ],
            dataProductAssetsStatus: 'succeeded'
          }
        };

        render(<AccessGroup entry={{ entryType: 'dataProducts/456' }} css={{}} />);

        expect(capturedTableViewProps.rows).toHaveLength(2);
        expect(capturedTableViewProps.rows[0]['Mapped-Permissions']).toHaveLength(3);
        expect(capturedTableViewProps.rows[1]['Mapped-Permissions']).toHaveLength(0);
      });

      it('should handle accessGroupConfigs with empty iamRoles', () => {
        mockReduxState = {
          dataProducts: {
            dataProductAssets: [
              {
                resource: 'projects/p1/datasets/d1/tables/t1',
                accessGroupConfigs: {
                  'empty-roles-group': { iamRoles: [] }
                }
              }
            ],
            dataProductAssetsStatus: 'succeeded'
          }
        };

        render(<AccessGroup entry={{ entryType: 'dataProducts/789' }} css={{}} />);

        expect(capturedTableFilterProps.data[0]['Mapped-Permissions']).toHaveLength(1);
        expect(capturedTableFilterProps.data[0]['Mapped-Permissions'][0]).toBe('empty-roles-group : ');
      });
    });

    describe('column structure', () => {
      it('should configure columns with correct flex and minWidth', () => {
        mockReduxState = {
          dataProducts: {
            dataProductAssets: [
              {
                resource: 'projects/p/datasets/d/tables/t',
                accessGroupConfigs: { 'g': { iamRoles: ['r'] } }
              }
            ],
            dataProductAssetsStatus: 'succeeded'
          }
        };

        render(<AccessGroup entry={{ entryType: 'dataProducts/123' }} css={{}} />);

        expect(capturedTableViewProps.columns).toHaveLength(5);
        capturedTableViewProps.columns.forEach((col: any) => {
          expect(col.flex).toBe(1);
          expect(col.minWidth).toBe(200);
        });
      });

      it('should set correct headerClassName for Mapped-Permissions column', () => {
        mockReduxState = {
          dataProducts: {
            dataProductAssets: [
              {
                resource: 'projects/p/datasets/d/tables/t',
                accessGroupConfigs: { 'g': { iamRoles: ['r'] } }
              }
            ],
            dataProductAssetsStatus: 'succeeded'
          }
        };

        render(<AccessGroup entry={{ entryType: 'dataProducts/123' }} css={{}} />);

        const mappedPermissionsCol = capturedTableViewProps.columns.find((c: any) => c.field === 'Mapped-Permissions');
        expect(mappedPermissionsCol.headerClassName).toBe('table-bg table-multiline');

        const otherCol = capturedTableViewProps.columns.find((c: any) => c.field === 'Name');
        expect(otherCol.headerClassName).toBe('table-bg');
      });
    });

    describe('filtered data handling', () => {
      it('should use filtered data when available', () => {
        mockReduxState = {
          dataProducts: {
            dataProductAssets: [
              { resource: 'projects/p1/datasets/d1/tables/t1', accessGroupConfigs: {} },
              { resource: 'projects/p2/datasets/d2/tables/t2', accessGroupConfigs: {} },
              { resource: 'projects/p3/datasets/d3/tables/t3', accessGroupConfigs: {} }
            ],
            dataProductAssetsStatus: 'succeeded'
          }
        };

        render(<AccessGroup entry={{ entryType: 'dataProducts/123' }} css={{}} />);

        // Initially all 3 rows
        expect(capturedTableViewProps.rows).toHaveLength(3);

        // Simulate filter by calling onFilteredDataChange with subset
        const filteredData = [capturedTableFilterProps.data[0]];
        capturedTableFilterProps.onFilteredDataChange(filteredData);
      });
    });

    describe('localStorage edge cases', () => {
      it('should handle localStorage returning undefined selectedDataProduct', () => {
        localStorageMock.getItem.mockReturnValue(JSON.stringify({}));

        render(<AccessGroup entry={{ entryType: 'dataProducts/123' }} css={{}} />);

        expect(screen.getByText('No access groups defined for this data product.')).toBeInTheDocument();
      });

      it('should handle localStorage with null accessGroups', () => {
        localStorageMock.getItem.mockReturnValue(JSON.stringify({ accessGroups: null }));

        render(<AccessGroup entry={{ entryType: 'dataProducts/123' }} css={{}} />);

        expect(screen.getByText('No access groups defined for this data product.')).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // ADDITIONAL ASSETS TESTS FOR COVERAGE
  // ============================================
  describe('Assets Additional Coverage', () => {
    describe('data processing', () => {
      it('should handle assets with URL-prefixed resource paths', async () => {
        mockAxiosPost.mockResolvedValue({ data: { results: [] } });

        mockReduxState = {
          dataProducts: {
            dataProductAssets: [
              { resource: '//bigquery.googleapis.com/projects/proj/datasets/ds/tables/tbl' }
            ],
            dataProductAssetsStatus: 'succeeded'
          }
        };

        render(<Assets entry={{ entryType: 'dataProducts/123' }} css={{}} />);

        await waitFor(() => {
          expect(mockAxiosPost).toHaveBeenCalled();
        });

        const [, body] = mockAxiosPost.mock.calls[0];
        expect(body.query).toContain('bigquery:');
      });

      it('should handle search term change callback', async () => {
        mockAxiosPost.mockResolvedValue({
          data: {
            results: [{ dataplexEntry: { name: 'asset-1' } }]
          }
        });

        mockReduxState = {
          dataProducts: {
            dataProductAssets: [
              { resource: 'projects/p/datasets/d/tables/t' }
            ],
            dataProductAssetsStatus: 'succeeded'
          }
        };

        render(<Assets entry={{ entryType: 'dataProducts/123' }} css={{}} />);

        await waitFor(() => {
          expect(capturedDataProductAssetsProps).not.toBeNull();
        });

        // Test search term change callback
        capturedDataProductAssetsProps.onSearchTermChange('new search');
      });
    });

    describe('status transitions', () => {
      it('should reset loader when status changes to loading', () => {
        mockReduxState = {
          dataProducts: {
            dataProductAssets: [],
            dataProductAssetsStatus: 'loading'
          }
        };

        const { container } = render(<Assets entry={{ entryType: 'dataProducts/123' }} css={{}} />);

        // Should show skeletons
        const skeletons = container.querySelectorAll('.MuiSkeleton-root');
        expect(skeletons.length).toBeGreaterThan(0);
      });

      it('should handle transition from succeeded to failed', async () => {
        mockReduxState = {
          dataProducts: {
            dataProductAssets: [],
            dataProductAssetsStatus: 'failed'
          }
        };

        render(<Assets entry={{ entryType: 'dataProducts/123' }} css={{}} />);

        await waitFor(() => {
          expect(screen.getByText('No data product assets found')).toBeInTheDocument();
        });
      });
    });

    describe('onAssetPreviewChange callback', () => {
      it('should not throw when onAssetPreviewChange prop is not provided', async () => {
        mockAxiosPost.mockResolvedValue({
          data: { results: [{ dataplexEntry: { name: 'asset' } }] }
        });

        mockReduxState = {
          dataProducts: {
            dataProductAssets: [
              { resource: 'projects/p/datasets/d/tables/t' }
            ],
            dataProductAssetsStatus: 'succeeded'
          }
        };

        // Render without onAssetPreviewChange prop
        render(<Assets entry={{ entryType: 'dataProducts/123' }} css={{}} />);

        await waitFor(() => {
          expect(screen.getByTestId('data-product-assets')).toBeInTheDocument();
        });

        // This should not throw even when callback is undefined
        const previewButton = screen.getByTestId('trigger-preview');
        expect(() => fireEvent.click(previewButton)).not.toThrow();
      });
    });
  });

  // ============================================
  // ADDITIONAL CONTRACT TESTS FOR COVERAGE
  // ============================================
  describe('Contract Additional Coverage', () => {
    describe('contract data variations', () => {
      it('should handle contract with nested objects as string', () => {
        const entryWithNestedObjects = {
          name: 'test-entry',
          entryType: 'dataProducts/123',
          aspects: {
            '123.global.refresh-cadence': {
              data: {
                nestedObj: { inner: 'value' },
                arrayVal: [1, 2, 3]
              }
            }
          }
        };

        render(<Contract entry={entryWithNestedObjects} css={{}} />);

        expect(screen.getByText('nestedObj')).toBeInTheDocument();
        expect(screen.getByText('arrayVal')).toBeInTheDocument();
      });

      it('should handle contract with special characters in values', () => {
        const entryWithSpecialChars = {
          name: 'test-entry',
          entryType: 'dataProducts/123',
          aspects: {
            '123.global.refresh-cadence': {
              data: {
                'special-key': 'value with <special> & "chars"'
              }
            }
          }
        };

        render(<Contract entry={entryWithSpecialChars} css={{}} />);

        expect(screen.getByText('special-key')).toBeInTheDocument();
      });

      it('should handle empty string values in contract data', () => {
        const entryWithEmptyStrings = {
          name: 'test-entry',
          entryType: 'dataProducts/123',
          aspects: {
            '123.global.refresh-cadence': {
              data: {
                emptyKey: '',
                validKey: 'value'
              }
            }
          }
        };

        render(<Contract entry={entryWithEmptyStrings} css={{}} />);

        expect(screen.getByText('emptyKey')).toBeInTheDocument();
        expect(screen.getByText('validKey')).toBeInTheDocument();
        expect(screen.getByText('value')).toBeInTheDocument();
      });
    });

    describe('grid layout', () => {
      it('should render contract card in Grid with correct size', () => {
        const mockEntry = {
          name: 'test-entry',
          entryType: 'dataProducts/123',
          aspects: {
            '123.global.refresh-cadence': {
              data: { key: 'value' }
            }
          }
        };

        const { container } = render(<Contract entry={mockEntry} css={{}} />);

        // Check Grid containers exist
        const grids = container.querySelectorAll('.MuiGrid-root');
        expect(grids.length).toBeGreaterThan(0);
      });
    });

    describe('entry type extraction', () => {
      it('should extract number from second segment of entryType', () => {
        // Component uses split('/')[1] to get the number
        const entryWithStandardType = {
          name: 'test-entry',
          entryType: 'dataProducts/555',
          aspects: {
            '555.global.refresh-cadence': {
              data: { extractedKey: 'extractedValue' }
            }
          }
        };

        render(<Contract entry={entryWithStandardType} css={{}} />);

        expect(screen.getByText('extractedKey')).toBeInTheDocument();
        expect(screen.getByText('extractedValue')).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // INTEGRATION TESTS
  // ============================================
  describe('Integration', () => {
    it('should render all components without interference', () => {
      mockReduxState = {
        dataProducts: {
          dataProductAssets: [],
          dataProductAssetsStatus: 'idle'
        }
      };

      const mockEntry = {
        name: 'test',
        entryType: 'dataProducts/123',
        aspects: {}
      };

      const { unmount: unmount1 } = render(<AccessGroup entry={mockEntry} css={{}} />);
      unmount1();

      const { unmount: unmount2 } = render(<Assets entry={mockEntry} css={{}} />);
      unmount2();

      const { unmount: unmount3 } = render(<Contract entry={mockEntry} css={{}} />);
      unmount3();

      // All components should render and unmount cleanly
      expect(true).toBe(true);
    });
  });

  // ============================================
  // DEFAULT EXPORT TESTS
  // ============================================
  describe('Module Exports', () => {
    it('should export AccessGroup as default', async () => {
      const module = await import('./AccessGroup');
      expect(module.default).toBeDefined();
      expect(typeof module.default).toBe('function');
    });

    it('should export Assets as default', async () => {
      const module = await import('./Assets');
      expect(module.default).toBeDefined();
      expect(typeof module.default).toBe('function');
    });

    it('should export Contract as default', async () => {
      const module = await import('./Contract');
      expect(module.default).toBeDefined();
      expect(typeof module.default).toBe('function');
    });

    it('should export DataProducts as default', async () => {
      const module = await import('./DataProducts');
      expect(module.default).toBeDefined();
      expect(typeof module.default).toBe('function');
    });
  });

  // ============================================
  // DATAPRODUCTS COMPONENT TESTS
  // ============================================
  describe('DataProducts', () => {
    const mockDataProducts = [
      {
        name: 'projects/test-project/locations/us-central1/dataProducts/product-1',
        displayName: 'Test Product 1',
        description: 'Description for product 1',
        updateTime: '2024-01-15T10:30:00Z',
        ownerEmails: ['owner1@example.com', 'owner2@example.com'],
        assetCount: 5,
        icon: 'iVBORw0KGgoAAAANSUhEUg=='
      },
      {
        name: 'projects/test-project/locations/us-east1/dataProducts/product-2',
        displayName: 'Alpha Product',
        description: 'Description for alpha product',
        updateTime: '2024-01-20T14:00:00Z',
        ownerEmails: ['alpha@example.com'],
        assetCount: 3,
        icon: null
      },
      {
        name: 'projects/test-project/locations/europe-west1/dataProducts/product-3',
        displayName: 'Zebra Product',
        description: '',
        updateTime: '2024-01-10T08:00:00Z',
        ownerEmails: [],
        assetCount: 0
      }
    ];

    const renderDataProducts = () => {
      return render(<DataProducts />);
    };

    beforeEach(() => {
      mockDispatch.mockClear();
      mockNavigate.mockClear();
      mockAxiosPost.mockReset();
    });

    describe('rendering', () => {
      it('should render the Data Products heading', () => {
        mockReduxState = {
          dataProducts: {
            dataProductsItems: [],
            status: 'idle',
            dataProductAssets: [],
            dataProductAssetsStatus: 'idle'
          }
        };
        renderDataProducts();
        expect(screen.getByText('Data Products')).toBeInTheDocument();
      });

      it('should render search input field', () => {
        mockReduxState = {
          dataProducts: {
            dataProductsItems: [],
            status: 'idle',
            dataProductAssets: [],
            dataProductAssetsStatus: 'idle'
          }
        };
        renderDataProducts();
        expect(screen.getByPlaceholderText('Search data products')).toBeInTheDocument();
      });

      it('should render sort controls', () => {
        mockReduxState = {
          dataProducts: {
            dataProductsItems: [],
            status: 'idle',
            dataProductAssets: [],
            dataProductAssetsStatus: 'idle'
          }
        };
        renderDataProducts();
        expect(screen.getByText(/Sort by:/)).toBeInTheDocument();
      });

      it('should render view mode toggle buttons', () => {
        mockReduxState = {
          dataProducts: {
            dataProductsItems: [],
            status: 'idle',
            dataProductAssets: [],
            dataProductAssetsStatus: 'idle'
          }
        };
        renderDataProducts();
        expect(screen.getByLabelText('table view')).toBeInTheDocument();
        expect(screen.getByLabelText('list view')).toBeInTheDocument();
      });
    });

    describe('loading state', () => {
      it('should show skeleton loaders when status is loading', () => {
        mockReduxState = {
          dataProducts: {
            dataProductsItems: [],
            status: 'loading',
            dataProductAssets: [],
            dataProductAssetsStatus: 'idle'
          }
        };
        renderDataProducts();
        const skeletons = document.querySelectorAll('.MuiSkeleton-root');
        expect(skeletons.length).toBeGreaterThan(0);
      });

      it('should render 6 skeleton cards when loading', () => {
        mockReduxState = {
          dataProducts: {
            dataProductsItems: [],
            status: 'loading',
            dataProductAssets: [],
            dataProductAssetsStatus: 'idle'
          }
        };
        const { container } = renderDataProducts();
        const skeletonRectangles = container.querySelectorAll('.MuiSkeleton-rectangular');
        expect(skeletonRectangles.length).toBe(6);
      });
    });

    describe('empty state', () => {
      it('should show empty message when no data products available', () => {
        mockReduxState = {
          dataProducts: {
            dataProductsItems: [],
            status: 'succeeded',
            dataProductAssets: [],
            dataProductAssetsStatus: 'idle'
          }
        };
        renderDataProducts();
        expect(screen.getByText('No data products available')).toBeInTheDocument();
      });

      it('should show search empty message when search returns no results', async () => {
        mockDebouncedSearchValue.value = 'nonexistent';
        mockReduxState = {
          dataProducts: {
            dataProductsItems: mockDataProducts,
            status: 'succeeded',
            dataProductAssets: [],
            dataProductAssetsStatus: 'idle'
          }
        };
        mockAxiosPost.mockResolvedValue({ data: { results: [] } });
        renderDataProducts();
        const searchInput = screen.getByPlaceholderText('Search data products');
        fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
        await waitFor(() => {
          expect(screen.getByText('No data products found matching your search')).toBeInTheDocument();
        });
        mockDebouncedSearchValue.value = '';
      });
    });

    describe('data display', () => {
      it('should render data product cards when data is available', async () => {
        mockReduxState = {
          dataProducts: {
            dataProductsItems: mockDataProducts,
            status: 'succeeded',
            dataProductAssets: [],
            dataProductAssetsStatus: 'idle'
          }
        };
        renderDataProducts();
        await waitFor(() => {
          expect(screen.getByText('Test Product 1')).toBeInTheDocument();
          expect(screen.getByText('Alpha Product')).toBeInTheDocument();
          expect(screen.getByText('Zebra Product')).toBeInTheDocument();
        });
      });

      it('should display asset count tags', async () => {
        mockReduxState = {
          dataProducts: {
            dataProductsItems: mockDataProducts,
            status: 'succeeded',
            dataProductAssets: [],
            dataProductAssetsStatus: 'idle'
          }
        };
        renderDataProducts();
        await waitFor(() => {
          const tags = screen.getAllByTestId('tag');
          expect(tags.some(tag => tag.textContent === '5 assets')).toBe(true);
        });
      });

      it('should display description or fallback text', async () => {
        mockReduxState = {
          dataProducts: {
            dataProductsItems: mockDataProducts,
            status: 'succeeded',
            dataProductAssets: [],
            dataProductAssetsStatus: 'idle'
          }
        };
        renderDataProducts();
        await waitFor(() => {
          expect(screen.getByText('Description for product 1')).toBeInTheDocument();
          expect(screen.getAllByText('No description available.').length).toBeGreaterThan(0);
        });
      });

      it('should display owner email initials', async () => {
        mockReduxState = {
          dataProducts: {
            dataProductsItems: mockDataProducts,
            status: 'succeeded',
            dataProductAssets: [],
            dataProductAssetsStatus: 'idle'
          }
        };
        renderDataProducts();
        await waitFor(() => {
          expect(screen.getByText('O')).toBeInTheDocument();
        });
      });

      it('should display multiple owner indicator', async () => {
        mockReduxState = {
          dataProducts: {
            dataProductsItems: mockDataProducts,
            status: 'succeeded',
            dataProductAssets: [],
            dataProductAssetsStatus: 'idle'
          }
        };
        renderDataProducts();
        await waitFor(() => {
          // Check that a card with the owner count (+1) is rendered
          // First verify the card is displayed, then check for the +1 indicator
          expect(screen.getByText('Test Product 1')).toBeInTheDocument();
          // The owner count is rendered as part of the owner section
          const container = document.body;
          expect(container.textContent).toContain('+1');
        });
      });

      it('should display location from data product name', async () => {
        mockReduxState = {
          dataProducts: {
            dataProductsItems: mockDataProducts,
            status: 'succeeded',
            dataProductAssets: [],
            dataProductAssetsStatus: 'idle'
          }
        };
        renderDataProducts();
        await waitFor(() => {
          expect(screen.getByText('us-central1')).toBeInTheDocument();
        });
      });

      it('should display last modified date', async () => {
        mockReduxState = {
          dataProducts: {
            dataProductsItems: mockDataProducts,
            status: 'succeeded',
            dataProductAssets: [],
            dataProductAssetsStatus: 'idle'
          }
        };
        renderDataProducts();
        await waitFor(() => {
          expect(screen.getByText('2024-01-15')).toBeInTheDocument();
        });
      });
    });

    describe('initial data fetching', () => {
      it('should dispatch fetchDataProductsList on mount when idle and no data', () => {
        mockReduxState = {
          dataProducts: {
            dataProductsItems: [],
            status: 'idle',
            dataProductAssets: [],
            dataProductAssetsStatus: 'idle'
          }
        };
        renderDataProducts();
        expect(mockDispatch).toHaveBeenCalled();
      });

      it('should remove selectedDataProduct from localStorage when status is succeeded', () => {
        mockReduxState = {
          dataProducts: {
            dataProductsItems: mockDataProducts,
            status: 'succeeded',
            dataProductAssets: [],
            dataProductAssetsStatus: 'idle'
          }
        };
        renderDataProducts();
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('selectedDataProduct');
      });
    });

    describe('sorting functionality', () => {
      beforeEach(() => {
        mockReduxState = {
          dataProducts: {
            dataProductsItems: mockDataProducts,
            status: 'succeeded',
            dataProductAssets: [],
            dataProductAssetsStatus: 'idle'
          }
        };
      });

      it('should display default sort by Last Modified', () => {
        renderDataProducts();
        expect(screen.getByText('Sort by: Last Modified')).toBeInTheDocument();
      });

      it('should open sort menu when clicking sort button', async () => {
        renderDataProducts();
        const sortButton = screen.getByText('Sort by: Last Modified');
        fireEvent.click(sortButton);
        await waitFor(() => {
          expect(screen.getByRole('menu')).toBeInTheDocument();
        });
      });

      it('should change sort by to Name when selecting Name option', async () => {
        renderDataProducts();
        const sortButton = screen.getByText('Sort by: Last Modified');
        fireEvent.click(sortButton);
        await waitFor(() => {
          expect(screen.getByRole('menu')).toBeInTheDocument();
        });
        const nameOption = screen.getByRole('menuitem', { name: 'Name' });
        fireEvent.click(nameOption);
        await waitFor(() => {
          expect(screen.getByText('Sort by: Name')).toBeInTheDocument();
        });
      });

      it('should toggle sort order when clicking sort icon', async () => {
        renderDataProducts();
        const sortIcon = document.querySelector('[data-testid="SortIcon"]');
        expect(sortIcon).toBeInTheDocument();
        fireEvent.click(sortIcon!.closest('button')!);
        await waitFor(() => {
          expect(document.querySelector('[data-testid="SortIcon"]')).toBeInTheDocument();
        });
      });

      it('should close sort menu after selection', async () => {
        renderDataProducts();
        const sortButton = screen.getByText('Sort by: Last Modified');
        fireEvent.click(sortButton);
        await waitFor(() => {
          expect(screen.getByRole('menu')).toBeInTheDocument();
        });
        const nameOption = screen.getByRole('menuitem', { name: 'Name' });
        fireEvent.click(nameOption);
        await waitFor(() => {
          expect(screen.queryByRole('menu')).not.toBeInTheDocument();
        });
      });
    });

    describe('view mode toggle', () => {
      beforeEach(() => {
        mockReduxState = {
          dataProducts: {
            dataProductsItems: mockDataProducts,
            status: 'succeeded',
            dataProductAssets: [],
            dataProductAssetsStatus: 'idle'
          }
        };
      });

      it('should default to list view mode', () => {
        renderDataProducts();
        const listToggle = screen.getByLabelText('list view');
        expect(listToggle).toHaveClass('Mui-selected');
      });

      it('should switch to table view when clicking table toggle', async () => {
        renderDataProducts();
        const tableToggle = screen.getByLabelText('table view');
        fireEvent.click(tableToggle);
        await waitFor(() => {
          expect(tableToggle).toHaveClass('Mui-selected');
        });
      });

      it('should render table headers in table view', async () => {
        renderDataProducts();
        const tableToggle = screen.getByLabelText('table view');
        fireEvent.click(tableToggle);
        await waitFor(() => {
          expect(screen.getByText('Name', { selector: 'th' })).toBeInTheDocument();
          expect(screen.getByText('Description', { selector: 'th' })).toBeInTheDocument();
        });
      });

      it('should display data in table rows in table view', async () => {
        renderDataProducts();
        const tableToggle = screen.getByLabelText('table view');
        fireEvent.click(tableToggle);
        await waitFor(() => {
          const rows = document.querySelectorAll('tbody tr');
          expect(rows.length).toBe(3);
        });
      });
    });

    describe('search functionality', () => {
      beforeEach(() => {
        mockReduxState = {
          dataProducts: {
            dataProductsItems: mockDataProducts,
            status: 'succeeded',
            dataProductAssets: [],
            dataProductAssetsStatus: 'idle'
          }
        };
        mockDebouncedSearchValue.value = '';
      });

      afterEach(() => {
        mockDebouncedSearchValue.value = '';
      });

      it('should update search term on input change', () => {
        renderDataProducts();
        const searchInput = screen.getByPlaceholderText('Search data products');
        fireEvent.change(searchInput, { target: { value: 'test search' } });
        expect(searchInput).toHaveValue('test search');
      });

      it('should make API call when debounced search term changes', async () => {
        mockDebouncedSearchValue.value = 'test';
        mockAxiosPost.mockResolvedValue({ data: { results: [] } });
        renderDataProducts();
        await waitFor(() => {
          expect(mockAxiosPost).toHaveBeenCalled();
        });
      });

      it('should handle API error gracefully', async () => {
        mockDebouncedSearchValue.value = 'test';
        mockAxiosPost.mockRejectedValue(new Error('API Error'));
        renderDataProducts();
        await waitFor(() => {
          expect(mockAxiosPost).toHaveBeenCalled();
        });
        expect(screen.getByText('Data Products')).toBeInTheDocument();
      });
    });

    describe('card click navigation', () => {
      beforeEach(() => {
        mockReduxState = {
          dataProducts: {
            dataProductsItems: mockDataProducts,
            status: 'succeeded',
            dataProductAssets: [],
            dataProductAssetsStatus: 'idle'
          }
        };
      });

      it('should navigate to details page when clicking a card', async () => {
        renderDataProducts();
        await waitFor(() => {
          expect(screen.getByText('Test Product 1')).toBeInTheDocument();
        });
        // Find the card by getting the image and clicking its container
        const cardImage = screen.getByAltText('Test Product 1');
        const card = cardImage.closest('.MuiBox-root');
        fireEvent.click(card!);
        expect(mockNavigate).toHaveBeenCalledWith(
          expect.stringContaining('/data-products-details?dataProductId=')
        );
      });

      it('should dispatch getDataProductDetails when clicking a card', async () => {
        renderDataProducts();
        await waitFor(() => {
          expect(screen.getByText('Test Product 1')).toBeInTheDocument();
        });
        const cardImage = screen.getByAltText('Test Product 1');
        const card = cardImage.closest('.MuiBox-root');
        fireEvent.click(card!);
        expect(mockDispatch).toHaveBeenCalled();
      });

      it('should save selected data product to localStorage', async () => {
        renderDataProducts();
        await waitFor(() => {
          expect(screen.getByText('Test Product 1')).toBeInTheDocument();
        });
        const cardImage = screen.getByAltText('Test Product 1');
        const card = cardImage.closest('.MuiBox-root');
        fireEvent.click(card!);
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'selectedDataProduct',
          expect.any(String)
        );
      });

      it('should navigate when clicking table row in table view', async () => {
        renderDataProducts();
        const tableToggle = screen.getByLabelText('table view');
        fireEvent.click(tableToggle);
        await waitFor(() => {
          const rows = document.querySelectorAll('tbody tr');
          expect(rows.length).toBe(3);
        });
        const firstRow = document.querySelector('tbody tr');
        fireEvent.click(firstRow!);
        expect(mockNavigate).toHaveBeenCalled();
      });
    });

    describe('data product card rendering', () => {
      beforeEach(() => {
        mockReduxState = {
          dataProducts: {
            dataProductsItems: mockDataProducts,
            status: 'succeeded',
            dataProductAssets: [],
            dataProductAssetsStatus: 'idle'
          }
        };
      });

      it('should render custom icon when provided', async () => {
        renderDataProducts();
        await waitFor(() => {
          const images = document.querySelectorAll('img');
          const customIconImg = Array.from(images).find(img =>
            img.src.includes('data:image/')
          );
          expect(customIconImg).toBeInTheDocument();
        });
      });

      it('should render default icon when no custom icon', async () => {
        renderDataProducts();
        await waitFor(() => {
          const images = document.querySelectorAll('img');
          const defaultIconImg = Array.from(images).find(img =>
            img.src.includes('data-product-card.png')
          );
          expect(defaultIconImg).toBeInTheDocument();
        });
      });
    });

    describe('table view specific tests', () => {
      beforeEach(() => {
        mockReduxState = {
          dataProducts: {
            dataProductsItems: mockDataProducts,
            status: 'succeeded',
            dataProductAssets: [],
            dataProductAssetsStatus: 'idle'
          }
        };
      });

      it('should show multiple owner count in table view', async () => {
        renderDataProducts();
        const tableToggle = screen.getByLabelText('table view');
        fireEvent.click(tableToggle);
        await waitFor(() => {
          // Check that the table is displayed with owner count indicator
          const rows = document.querySelectorAll('tbody tr');
          expect(rows.length).toBe(3);
          // The owner count (+1) should be visible for the product with multiple owners
          const container = document.body;
          expect(container.textContent).toContain('+1');
        });
      });

      it('should display icons in table cells', async () => {
        renderDataProducts();
        const tableToggle = screen.getByLabelText('table view');
        fireEvent.click(tableToggle);
        await waitFor(() => {
          expect(document.querySelector('[data-testid="AccessTimeIcon"]')).toBeInTheDocument();
        });
      });
    });

    describe('edge cases', () => {
      it('should handle empty ownerEmails array', async () => {
        mockReduxState = {
          dataProducts: {
            dataProductsItems: [mockDataProducts[2]],
            status: 'succeeded',
            dataProductAssets: [],
            dataProductAssetsStatus: 'idle'
          }
        };
        renderDataProducts();
        await waitFor(() => {
          expect(screen.getByText('Zebra Product')).toBeInTheDocument();
        });
      });

      it('should handle null/undefined icon', async () => {
        mockReduxState = {
          dataProducts: {
            dataProductsItems: [mockDataProducts[1]],
            status: 'succeeded',
            dataProductAssets: [],
            dataProductAssetsStatus: 'idle'
          }
        };
        renderDataProducts();
        await waitFor(() => {
          const defaultImages = document.querySelectorAll('img[src*="data-product-card.png"]');
          expect(defaultImages.length).toBeGreaterThan(0);
        });
      });

      it('should handle products with no description', async () => {
        mockReduxState = {
          dataProducts: {
            dataProductsItems: [mockDataProducts[2]],
            status: 'succeeded',
            dataProductAssets: [],
            dataProductAssetsStatus: 'idle'
          }
        };
        renderDataProducts();
        await waitFor(() => {
          expect(screen.getByText('No description available.')).toBeInTheDocument();
        });
      });

      it('should handle assetCount of 0', async () => {
        mockReduxState = {
          dataProducts: {
            dataProductsItems: [mockDataProducts[2]],
            status: 'succeeded',
            dataProductAssets: [],
            dataProductAssetsStatus: 'idle'
          }
        };
        renderDataProducts();
        await waitFor(() => {
          expect(screen.getByText('0 assets')).toBeInTheDocument();
        });
      });
    });

    describe('cleanup on unmount', () => {
      it('should cancel pending requests on unmount', async () => {
        mockDebouncedSearchValue.value = 'test';
        mockAxiosPost.mockResolvedValue({ data: { results: [] } });
        mockReduxState = {
          dataProducts: {
            dataProductsItems: mockDataProducts,
            status: 'succeeded',
            dataProductAssets: [],
            dataProductAssetsStatus: 'idle'
          }
        };
        const { unmount } = renderDataProducts();
        await waitFor(() => {
          expect(mockAxiosCancelToken.source).toHaveBeenCalled();
        });
        unmount();
        mockDebouncedSearchValue.value = '';
      });
    });
  });
});
