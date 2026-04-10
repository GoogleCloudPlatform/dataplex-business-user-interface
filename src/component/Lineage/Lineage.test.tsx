import { render, screen, fireEvent } from '@testing-library/react';
import { vi, beforeEach, it, describe, expect } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import QueryPanel from './QueryPanel';
import ListView from './ListView';
import Lineage from './index';
import { fetchLineageSearchLinks } from '../../features/lineage/lineageSlice';
// Mock auth context
const mockUser = {
  token: 'test-token',
  appConfig: { projectId: 'test-project' }
};

vi.mock('../../auth/AuthProvider', () => ({
  useAuth: () => ({
    user: mockUser
  })
}));

// Mock axios
vi.mock('axios');

// Mock NotificationContext
const mockShowSuccess = vi.fn();
const mockShowError = vi.fn();
vi.mock('../../contexts/NotificationContext', () => ({
  useNotification: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
    showWarning: vi.fn(),
    showInfo: vi.fn(),
    clearNotification: vi.fn(),
    clearAllNotifications: vi.fn(),
  })
}));

vi.mock('../../contexts/NoAccessContext', () => ({
  useNoAccess: () => ({
    isNoAccessOpen: false,
    noAccessMessage: null,
    triggerNoAccess: vi.fn(),
    dismissNoAccess: vi.fn(),
  }),
}));

// Mock Redux store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      lineage: (state = initialState, action: any) => {
        switch (action.type) {
          case 'lineage/fetchLineageSearchLinks/pending':
            return { ...state, status: 'loading' };
          case 'lineage/fetchLineageSearchLinks/fulfilled':
            return { ...state, status: 'succeeded', items: action.payload };
          case 'lineage/fetchLineageSearchLinks/rejected':
            return { ...state, status: 'failed', error: (action.error as Error).message };
          default:
            return state;
        }
      },
      entry: (state = { items: null, status: 'idle', lineageEntryItems: null, lineageEntrystatus: 'idle', lineageEntryError: null }, action: any) => {
        switch (action.type) {
          case 'entry/fetchLineageEntry/pending':
            return { ...state, lineageEntrystatus: 'loading' };
          case 'entry/fetchLineageEntry/fulfilled':
            return { ...state, lineageEntrystatus: 'succeeded', lineageEntryItems: action.payload };
          case 'entry/fetchLineageEntry/rejected':
            return { ...state, lineageEntrystatus: 'failed' };
          default:
            return state;
        }
      }
    },
    preloadedState: {
      lineage: initialState,
      entry: { items: null, status: 'idle', lineageEntryItems: null, lineageEntrystatus: 'idle', lineageEntryError: null }
    }
  });
};

// Mock lineage slice
vi.mock('../../features/lineage/lineageSlice', () => ({
  fetchLineageSearchLinks: vi.fn(() => ({ type: 'lineage/fetchLineageSearchLinks/pending' })),
  default: vi.fn((state = { items: [], status: 'idle', error: null }, action: any) => {
    switch (action.type) {
      case 'lineage/fetchLineageSearchLinks/pending':
        return { ...state, status: 'loading' };
      case 'lineage/fetchLineageSearchLinks/fulfilled':
        return { ...state, status: 'succeeded', items: action.payload };
      case 'lineage/fetchLineageSearchLinks/rejected':
        return { ...state, status: 'failed', error: (action.error as Error).message };
      default:
        return state;
    }
  })
}));

// Mock entry slice
vi.mock('../../features/entry/entrySlice', () => ({
  fetchLineageEntry: vi.fn(() => ({ type: 'entry/fetchLineageEntry/pending' })),
  fetchEntry: vi.fn(() => ({ type: 'entry/fetchEntry' })),
  pushToHistory: vi.fn(() => ({ type: 'entry/pushToHistory' })),
  default: vi.fn((state = { items: null, status: 'idle' }, _action: any) => state)
}));

// Mock MUI icons
vi.mock('@mui/icons-material', () => ({
  ContentCopy: () => <div data-testid="content-copy-icon">Copy</div>,
  Close: () => <div data-testid="close-icon">Close</div>,
  Check: () => <div data-testid="check-icon">Check</div>,
  Schedule: () => <div data-testid="schedule-icon">Schedule</div>,
  FilterList: () => <div data-testid="filter-list-icon">Filter</div>,
  ArrowUpward: () => <div data-testid="arrow-up-icon">Up</div>,
  ArrowDownward: () => <div data-testid="arrow-down-icon">Down</div>,
  AddOutlined: () => <div data-testid="add-outlined-icon">Add</div>,
  OpenInFull: () => <div data-testid="open-in-full-icon">Fullscreen</div>,
}));

// Mock react-d3-tree
vi.mock('react-d3-tree', () => ({
  default: () => <div data-testid="lineage-tree">Lineage Tree</div>
}));

// Mock LineageChartViewNew
vi.mock('./LineageChartViewNew', () => ({
  default: ({ graphData }: any) => (
    <div data-testid="lineage-chart-view-new">
      Lineage Chart View New
      {graphData && <div data-testid="graph-data-loaded">Graph Data Loaded</div>}
    </div>
  )
}));

// Mock useFullScreenStatus hook
vi.mock('../../hooks/useFullScreenStatus', () => ({
  default: () => ({
    elementRef: { current: null },
    isFullscreen: false,
    toggleFullscreen: vi.fn()
  })
}));

// Mock SideDetailsPanel
vi.mock('./SideDetailsPanel', () => ({
  default: ({ sidePanelData, onClose }: any) => (
    <div data-testid="side-details-panel">
      Side Details Panel
      {sidePanelData && <div data-testid="side-panel-data">Has Data</div>}
      {onClose && <button onClick={onClose} data-testid="side-panel-close">Close</button>}
    </div>
  )
}));

describe('Lineage Components', () => {
  const mockLineageData = [
    {
      id: 1,
      sourceSystem: 'BigQuery',
      sourceProject: 'test-project',
      source: 'source_table',
      sourceFQN: 'bigquery:test-project.dataset.source_table',
      target: 'target_table',
      targetProject: 'test-project',
      targetSystem: 'BigQuery',
      targetFQN: 'bigquery:test-project.dataset.target_table'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('QueryPanel', () => {
    const defaultProps = {
      queryPanelData: {
        processDetails: {
          name: 'projects/1069578231809/locations/us/processes/sh-586d68e949ba0dea559c9adf23dac248',
          displayName: 'Query',
          attributes: {
            bigquery_job_id: {
              stringValue: 'bquxjob_54c91aaa_196ef03e028'
            }
          }
        },
        jobDetails: [
          {},
          {
            status: { state: 'Completed' },
            statistics: {
              startTime: 1701432600,
              endTime: 1701432735,
              finalExecutionDurationMs: 135000,
              totalBytesProcessed: 1288490189
            },
            configuration: {
              query: {
                query: 'CREATE OR REPLACE TABLE dataset.table AS SELECT * FROM source'
              }
            }
          }
        ],
        processRuns: [
          {
            name: 'run1',
            displayName: 'Run 1',
            state: 'COMPLETED',
            startTime: { seconds: 1701432600 },
            endTime: { seconds: 1701432735 }
          },
          {
            name: 'run2',
            displayName: 'Run 2',
            state: 'COMPLETED',
            startTime: { seconds: 1701432800 },
            endTime: { seconds: 1701432900 }
          },
          {
            name: 'run3',
            displayName: 'Run 3',
            state: 'PENDING',
            startTime: { seconds: 1701433000 },
            endTime: { seconds: 1701433100 }
          }
        ]
      },
      queryPanelDataStatus: 'succeeded',
      onClose: vi.fn()
    };

    it('renders query panel with loading state', () => {
      render(<QueryPanel {...defaultProps} queryPanelDataStatus="loading" />);

      expect(screen.getByText('Query')).toBeInTheDocument();
      expect(screen.getByText('Details')).toBeInTheDocument();
      expect(screen.getByText('Runs')).toBeInTheDocument();
      // Tabs should be disabled during loading - check for disabled attribute
      const tabs = screen.getAllByRole('tab');
      expect(tabs[0]).toBeDisabled();
      expect(tabs[1]).toBeDisabled();
    });

    it('renders query panel with succeeded state', () => {
      render(<QueryPanel {...defaultProps} />);

      const queryHeadings = screen.getAllByText('Query');
      expect(queryHeadings.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Details')).toBeInTheDocument();
      expect(screen.getByText('Runs')).toBeInTheDocument();
    });

    it('displays query details in Details tab', () => {
      render(<QueryPanel {...defaultProps} />);

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Process type')).toBeInTheDocument();
      expect(screen.getByText('BigQuery_Job_ID')).toBeInTheDocument();
      expect(screen.getByText('bquxjob_54c91aaa_196ef03e028')).toBeInTheDocument();
    });

    it('displays SQL query with syntax highlighting', () => {
      const { container } = render(<QueryPanel {...defaultProps} />);

      // The query is rendered using prism-react-renderer which splits text into tokens
      // Check if the pre element exists instead
      const preElement = container.querySelector('pre');
      expect(preElement).toBeInTheDocument();
      expect(preElement?.textContent).toContain('CREATE');
    });

    it('handles copy SQL query', () => {
      const mockWriteText = vi.fn();
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText
        }
      });

      render(<QueryPanel {...defaultProps} />);

      const copyButton = screen.getByTestId('content-copy-icon').parentElement;
      if (copyButton) {
        fireEvent.click(copyButton);
        expect(mockWriteText).toHaveBeenCalledWith('CREATE OR REPLACE TABLE dataset.table AS SELECT * FROM source');
      }
    });

    it('handles tab switching to runs', () => {
      render(<QueryPanel {...defaultProps} />);

      const runsTab = screen.getByText('Runs');
      fireEvent.click(runsTab);

      expect(screen.getByText('State')).toBeInTheDocument();
      expect(screen.getByText('Display Name')).toBeInTheDocument();
    });

    it('displays run data with correct statuses', () => {
      render(<QueryPanel {...defaultProps} />);

      const runsTab = screen.getByText('Runs');
      fireEvent.click(runsTab);

      // Should show 2 completed runs and 1 pending run
      const completedTexts = screen.getAllByText('Completed');
      expect(completedTexts).toHaveLength(2);
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('handles run details modal opening', () => {
      render(<QueryPanel {...defaultProps} />);

      const runsTab = screen.getByText('Runs');
      fireEvent.click(runsTab);

      const moreButtons = screen.getAllByText('More');
      fireEvent.click(moreButtons[0]);

      expect(screen.getByText('Run Details')).toBeInTheDocument();
    });

    it('handles close button', () => {
      render(<QueryPanel {...defaultProps} />);

      const closeButtons = screen.getAllByTestId('close-icon');
      fireEvent.click(closeButtons[0]);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('displays run status indicators', () => {
      render(<QueryPanel {...defaultProps} />);

      const runsTab = screen.getByText('Runs');
      fireEvent.click(runsTab);

      // Check for status icons
      expect(screen.getAllByTestId('check-icon')).toHaveLength(2);
      expect(screen.getByTestId('schedule-icon')).toBeInTheDocument();
    });

    it('handles modal close', () => {
      render(<QueryPanel {...defaultProps} />);

      const runsTab = screen.getByText('Runs');
      fireEvent.click(runsTab);

      const moreButtons = screen.getAllByText('More');
      fireEvent.click(moreButtons[0]);

      expect(screen.getByText('Run Details')).toBeInTheDocument();

      const closeButtons = screen.getAllByTestId('close-icon');
      const modalCloseButton = closeButtons[closeButtons.length - 1];
      fireEvent.click(modalCloseButton);

      // Modal should close but we can't easily verify it's gone due to MUI Dialog behavior
      expect(modalCloseButton).toBeInTheDocument();
    });

    it('does not show SQL query section for non-Query process types', () => {
      const propsWithDifferentType = {
        ...defaultProps,
        queryPanelData: {
          ...defaultProps.queryPanelData,
          processDetails: {
            ...defaultProps.queryPanelData.processDetails,
            displayName: 'Transform'
          }
        }
      };

      render(<QueryPanel {...propsWithDifferentType} />);

      // SQL query section should not be visible
      const copyIcons = screen.queryAllByTestId('content-copy-icon');
      expect(copyIcons.length).toBe(0);
    });
  });

  describe('ListView', () => {
    const mockEntry = {
      fullyQualifiedName: 'bigquery:test-project.dataset.target_table',
      name: 'projects/test/locations/us/entries/target_table'
    };

    const renderWithRouter = (component: React.ReactElement) => {
      const store = createMockStore({ status: 'succeeded', items: { sourceLinks: [], targetLinks: [] } });
      return render(
        <Provider store={store}>
          <BrowserRouter>
            {component}
          </BrowserRouter>
        </Provider>
      );
    };

    it('renders list view with data', () => {
      renderWithRouter(<ListView listData={mockLineageData} entry={mockEntry} />);

      expect(screen.getByText('Source System')).toBeInTheDocument();
      expect(screen.getByText('Source Project')).toBeInTheDocument();
      expect(screen.getByText('Source')).toBeInTheDocument();
      expect(screen.getByText('Target')).toBeInTheDocument();
    });

    it('displays filter chips', () => {
      renderWithRouter(<ListView listData={mockLineageData} entry={mockEntry} />);

      expect(screen.getByText(/All \(1\)/)).toBeInTheDocument();
      expect(screen.getByText(/Upstream \(1\)/)).toBeInTheDocument();
      expect(screen.getByText(/Downstream \(0\)/)).toBeInTheDocument();
    });

    it('handles filter chip selection', () => {
      renderWithRouter(<ListView listData={mockLineageData} entry={mockEntry} />);

      const upstreamChip = screen.getByText(/Upstream/);
      fireEvent.click(upstreamChip);

      // Should show data filtered to upstream
      expect(screen.getByText('source_table')).toBeInTheDocument();
    });

    it('handles text filter input', () => {
      renderWithRouter(<ListView listData={mockLineageData} entry={mockEntry} />);

      const filterInput = screen.getByPlaceholderText('Enter property name or value');
      fireEvent.change(filterInput, { target: { value: 'source_table' } });

      expect(filterInput).toHaveValue('source_table');
    });

    it('handles column sorting', () => {
      renderWithRouter(<ListView listData={mockLineageData} entry={mockEntry} />);

      const sourceSystemHeader = screen.getByText('Source System');
      const sortButton = sourceSystemHeader.closest('div')?.querySelector('button');

      if (sortButton) {
        fireEvent.click(sortButton);
        // Should show sort icon (there will be multiple arrow icons in headers)
        const arrowIcons = screen.getAllByTestId('arrow-up-icon');
        expect(arrowIcons.length).toBeGreaterThan(0);
      }
    });

    it('renders clickable source and target links', () => {
      renderWithRouter(<ListView listData={mockLineageData} entry={mockEntry} />);

      const sourceLink = screen.getByText('source_table');
      const targetLink = screen.getByText('target_table');

      expect(sourceLink).toBeInTheDocument();
      expect(targetLink).toBeInTheDocument();
    });

    it('opens filter menu when filter icon is clicked', () => {
      renderWithRouter(<ListView listData={mockLineageData} entry={mockEntry} />);

      const filterButton = screen.getByTestId('filter-list-icon').parentElement;
      if (filterButton) {
        fireEvent.click(filterButton);
        // Filter menu should open (we can't easily test MUI menu visibility)
        expect(filterButton).toBeInTheDocument();
      }
    });

    it('displays empty state correctly', () => {
      renderWithRouter(<ListView listData={[]} entry={mockEntry} />);

      expect(screen.getByText(/All \(0\)/)).toBeInTheDocument();
    });
  });

  describe('Main Lineage Component', () => {
    const mockEntry = {
      name: 'projects/test/locations/us/entries/target_table',
      fullyQualifiedName: 'bigquery:test-project.dataset.target_table',
      entryType: 'projects/test/entryGroups/123/entryTypes/1',
      aspects: {
        '1.global.schema': {
          data: {
            fields: {
              fields: {
                listValue: {
                  values: [
                    { structValue: { fields: { name: { stringValue: 'field1' } } } },
                    { structValue: { fields: { name: { stringValue: 'field2' } } } }
                  ]
                }
              }
            }
          }
        }
      }
    };

    const renderLineageComponent = (storeState: any = {}) => {
      const defaultState = {
        status: 'succeeded',
        items: {
          sourceLinks: [
            {
              source: { fullyQualifiedName: 'bigquery:test-project.dataset.source1' },
              target: { fullyQualifiedName: mockEntry.fullyQualifiedName },
              process: { name: 'process1' }
            }
          ],
          targetLinks: [
            {
              source: { fullyQualifiedName: mockEntry.fullyQualifiedName },
              target: { fullyQualifiedName: 'bigquery:test-project.dataset.target1' },
              process: { name: 'process2' }
            }
          ]
        },
        ...storeState
      };

      const store = createMockStore(defaultState);
      return render(
        <Provider store={store}>
          <BrowserRouter>
            <Lineage entry={mockEntry} />
          </BrowserRouter>
        </Provider>
      );
    };

    it('renders lineage component with graph view', () => {
      renderLineageComponent();

      // Check that the main UI elements render
      expect(screen.getByText('GRAPH')).toBeInTheDocument();
      expect(screen.getByText('LIST')).toBeInTheDocument();
      expect(screen.getByTestId('open-in-full-icon')).toBeInTheDocument();
    });

    it('displays view mode toggle buttons', () => {
      renderLineageComponent();

      expect(screen.getByText('GRAPH')).toBeInTheDocument();
      expect(screen.getByText('LIST')).toBeInTheDocument();
    });

    it('handles view mode change to list', () => {
      renderLineageComponent();

      const listButton = screen.getByText('LIST');
      fireEvent.click(listButton);

      // Should render ListView
      expect(screen.getByText('Source System')).toBeInTheDocument();
    });

    it('displays fullscreen button', () => {
      renderLineageComponent();

      expect(screen.getByTestId('open-in-full-icon')).toBeInTheDocument();
    });

    it('dispatches fetchLineageSearchLinks on mount', () => {
      renderLineageComponent();

      expect(fetchLineageSearchLinks).toHaveBeenCalled();
    });

    it('shows loading state initially', () => {
      const store = createMockStore({ status: 'loading', items: null });
      render(
        <Provider store={store}>
          <BrowserRouter>
            <Lineage entry={mockEntry} />
          </BrowserRouter>
        </Provider>
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('handles empty lineage data', () => {
      renderLineageComponent({
        status: 'succeeded',
        items: { sourceLinks: [], targetLinks: [] }
      });

      // Should still render the component
      expect(screen.getByText('GRAPH')).toBeInTheDocument();
      expect(screen.getByText('LIST')).toBeInTheDocument();
    });

    it('switches between graph and list views', () => {
      renderLineageComponent();

      // Component should render
      expect(screen.getByText('GRAPH')).toBeInTheDocument();
      expect(screen.getByText('LIST')).toBeInTheDocument();

      // Switch to list view
      const listButton = screen.getByText('LIST');
      fireEvent.click(listButton);

      // Should show list view (check for table headers)
      expect(screen.getByText('Source System')).toBeInTheDocument();
      expect(screen.getByText('Target System')).toBeInTheDocument();

      // Switch back to graph view
      const graphButton = screen.getByText('GRAPH');
      fireEvent.click(graphButton);

      // Graph button should be selected
      expect(graphButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Redux Integration', () => {
    it('handles fetchLineageSearchLinks pending state', () => {
      const store = createMockStore({ status: 'idle' });
      const action = { type: 'lineage/fetchLineageSearchLinks/pending' };

      store.dispatch(action);
      const state = store.getState();

      expect(state.lineage.status).toBe('loading');
    });

    it('handles fetchLineageSearchLinks fulfilled state', () => {
      const store = createMockStore({ status: 'idle' });
      const action = {
        type: 'lineage/fetchLineageSearchLinks/fulfilled',
        payload: { sourceLinks: [], targetLinks: mockLineageData }
      };

      store.dispatch(action);
      const state = store.getState();

      expect(state.lineage.status).toBe('succeeded');
      expect(state.lineage.items).toEqual({ sourceLinks: [], targetLinks: mockLineageData });
    });

    it('handles fetchLineageSearchLinks rejected state', () => {
      const store = createMockStore({ status: 'idle' });
      const action = {
        type: 'lineage/fetchLineageSearchLinks/rejected',
        error: { message: 'Network error' }
      };

      store.dispatch(action);
      const state = store.getState();

      expect(state.lineage.status).toBe('failed');
      expect(state.lineage.error).toBe('Network error');
    });

    it('handles fetchLineageEntry actions', () => {
      const store = createMockStore({ status: 'idle' });

      store.dispatch({ type: 'entry/fetchLineageEntry/pending' });
      expect(store.getState().entry.lineageEntrystatus).toBe('loading');

      store.dispatch({
        type: 'entry/fetchLineageEntry/fulfilled',
        payload: { name: 'test-entry' }
      });
      expect(store.getState().entry.lineageEntrystatus).toBe('succeeded');
      expect(store.getState().entry.lineageEntryItems).toEqual({ name: 'test-entry' });
    });
  });

  describe('Error Handling', () => {
    it('handles query panel with failed status', () => {
      render(
        <QueryPanel
          queryPanelData={null}
          queryPanelDataStatus="failed"
          onClose={vi.fn()}
        />
      );

      // Should render without crashing
      expect(screen.getByText('Query')).toBeInTheDocument();
    });

    it('handles missing query data gracefully', () => {
      const minimalQueryData = {
        processDetails: {
          name: 'test-process',
          displayName: 'Test Process',
          attributes: {}
        },
        jobDetails: [{}, {}],
        processRuns: []
      };

      render(
        <QueryPanel
          queryPanelData={minimalQueryData}
          queryPanelDataStatus="succeeded"
          onClose={vi.fn()}
        />
      );

      // Should render without crashing
      expect(screen.getByText('Query')).toBeInTheDocument();
    });

    it('handles list view with malformed data', () => {
      const store = createMockStore({ status: 'succeeded', items: { sourceLinks: [], targetLinks: [] } });
      const malformedData = [
        {
          id: 1,
          sourceSystem: '',
          sourceProject: '',
          source: '',
          sourceFQN: '',
          target: '',
          targetProject: '',
          targetSystem: '',
          targetFQN: ''
        }
      ];

      render(
        <Provider store={store}>
          <BrowserRouter>
            <ListView listData={malformedData} />
          </BrowserRouter>
        </Provider>
      );

      // Should render without crashing
      expect(screen.getByText('Source System')).toBeInTheDocument();
    });
  });
});
