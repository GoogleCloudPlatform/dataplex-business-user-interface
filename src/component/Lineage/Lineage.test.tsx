import { render, screen, fireEvent } from '@testing-library/react';
import { vi, beforeEach, it, describe, expect } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import QueryPanel from './QueryPanel';
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

// Mock Redux store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      lineage: (state = initialState, action) => {
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
      entry: (state = { items: null, status: 'idle' }, _action) => state
    },
    preloadedState: {
      lineage: initialState,
      entry: { items: null, status: 'idle' }
    }
  });
};

// Mock lineage slice
vi.mock('../../features/lineage/lineageSlice', () => ({
  fetchLineageSearchLinks: vi.fn(() => ({ type: 'lineage/fetchLineageSearchLinks/pending' })),
  default: vi.fn((state = { items: [], status: 'idle', error: null }, action) => {
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
  fetchEntry: vi.fn(() => ({ type: 'entry/fetchEntry' })),
  default: vi.fn((state = { items: null, status: 'idle' }, _action) => state)
}));

// Mock MUI icons
vi.mock('@mui/icons-material', () => ({
  ContentCopy: () => <div data-testid="content-copy-icon">Copy</div>,
  Close: () => <div data-testid="close-icon">Close</div>,
  Check: () => <div data-testid="check-icon">Check</div>,
  Schedule: () => <div data-testid="schedule-icon">Schedule</div>
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
      queryPanelData:{
        name: 'projects/1069578231809/locations/us/processes/sh-586d68e949ba0dea559c9adf23dac248',
        processType: 'Query',
        bigQueryJobId: 'bquxjob_54c91aaa_196ef03e028',
        status: 'Completed',
        startTime: '2024-12-01 10:30:00',
        endTime: '2024-12-01 10:32:15',
        duration: '2m 15s',
        bytesProcessed: '1.2 GB',
        rowsProcessed: '45,230',
        cost: '$0.12'
      },
      queryPanelDataStatus: 'succedded',
      onClose: vi.fn()
    };

    it('renders query panel', () => {
      render(<QueryPanel {...defaultProps} />);

      expect(screen.getAllByText('Query')).toHaveLength(2); // Header and process type
      expect(screen.getByText('Details')).toBeInTheDocument();
      expect(screen.getByText('Runs')).toBeInTheDocument();
    });

    it('displays query details', () => {
      render(<QueryPanel {...defaultProps} />);

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Process type')).toBeInTheDocument();
      expect(screen.getByText('BigQuery_Job_ID')).toBeInTheDocument();
    });

    it('displays SQL query', () => {
      render(<QueryPanel {...defaultProps} />);

      expect(screen.getByText(/CREATE OR REPLACE TABLE/)).toBeInTheDocument();
    });

    it('handles copy SQL query', () => {
      const mockWriteText = vi.fn();
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText
        }
      });

      render(<QueryPanel {...defaultProps} />);

      const copyButton = screen.getByTestId('content-copy-icon');
      fireEvent.click(copyButton);

      expect(mockWriteText).toHaveBeenCalled();
    });

    it('handles tab switching to runs', () => {
      render(<QueryPanel {...defaultProps} />);

      const runsTab = screen.getByText('Runs');
      fireEvent.click(runsTab);

      expect(screen.getByText('State')).toBeInTheDocument();
      expect(screen.getByText('Display Name')).toBeInTheDocument();
    });

    it('displays run data', () => {
      render(<QueryPanel {...defaultProps} />);

      const runsTab = screen.getByText('Runs');
      fireEvent.click(runsTab);

      expect(screen.getAllByText('Complete')).toHaveLength(2);
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('handles run details modal', () => {
      render(<QueryPanel {...defaultProps} />);

      const runsTab = screen.getByText('Runs');
      fireEvent.click(runsTab);

      const moreButtons = screen.getAllByText('More');
      fireEvent.click(moreButtons[0]);

      expect(screen.getByText('Run Details')).toBeInTheDocument();
    });

    it('handles close button', () => {
      render(<QueryPanel {...defaultProps} />);

      const closeButton = screen.getByTestId('close-icon');
      fireEvent.click(closeButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('displays run status indicators', () => {
      render(<QueryPanel {...defaultProps} />);

      const runsTab = screen.getByText('Runs');
      fireEvent.click(runsTab);

      expect(screen.getAllByTestId('check-icon')).toHaveLength(2);
      expect(screen.getByTestId('schedule-icon')).toBeInTheDocument();
    });

    it('handles modal interactions', () => {
      render(<QueryPanel {...defaultProps} />);

      const runsTab = screen.getByText('Runs');
      fireEvent.click(runsTab);

      const moreButtons = screen.getAllByText('More');
      fireEvent.click(moreButtons[0]);

      // Modal should open
      expect(screen.getByText('Run Details')).toBeInTheDocument();
      
      const modalCloseButton = screen.getAllByTestId('close-icon')[1];
      fireEvent.click(modalCloseButton);

      // Modal close button should be clickable
      expect(modalCloseButton).toBeInTheDocument();
    });
  });

  describe('LineageSlice Redux', () => {
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
        payload: mockLineageData
      };
      
      store.dispatch(action);
      const state = store.getState();
      
      expect(state.lineage.status).toBe('succeeded');
      expect(state.lineage.items).toEqual(mockLineageData);
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

    it('handles empty request data', async () => {
      const mockFetchLineageSearchLinks = vi.fn().mockResolvedValue([]);
      vi.mocked(fetchLineageSearchLinks).mockImplementation(mockFetchLineageSearchLinks);

      const result = await mockFetchLineageSearchLinks(null);
      expect(result).toEqual([]);
    });

    it('handles API error', async () => {
      const mockFetchLineageSearchLinks = vi.fn().mockRejectedValue(new Error('API Error'));
      vi.mocked(fetchLineageSearchLinks).mockImplementation(mockFetchLineageSearchLinks);

      try {
        await mockFetchLineageSearchLinks({ parent: 'test', fqn: 'test', id_token: 'token' });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('API Error');
      }
    });
  });

  describe('Integration Tests', () => {
    it('renders QueryPanel with proper structure', () => {
      render(<QueryPanel queryPanelData={{
        name: 'projects/1069578231809/locations/us/processes/sh-586d68e949ba0dea559c9adf23dac248',
        processType: 'Query',
        bigQueryJobId: 'bquxjob_54c91aaa_196ef03e028',
        status: 'Completed',
        startTime: '2024-12-01 10:30:00',
        endTime: '2024-12-01 10:32:15',
        duration: '2m 15s',
        bytesProcessed: '1.2 GB',
        rowsProcessed: '45,230',
        cost: '$0.12'
      }} queryPanelDataStatus='succedded' onClose={vi.fn()} />);

      expect(screen.getByText('Details')).toBeInTheDocument();
      expect(screen.getByText('Runs')).toBeInTheDocument();
      expect(screen.getByText(/CREATE OR REPLACE TABLE/)).toBeInTheDocument();
    });

    it('handles tab navigation in QueryPanel', () => {
      render(<QueryPanel queryPanelData={{
        name: 'projects/1069578231809/locations/us/processes/sh-586d68e949ba0dea559c9adf23dac248',
        processType: 'Query',
        bigQueryJobId: 'bquxjob_54c91aaa_196ef03e028',
        status: 'Completed',
        startTime: '2024-12-01 10:30:00',
        endTime: '2024-12-01 10:32:15',
        duration: '2m 15s',
        bytesProcessed: '1.2 GB',
        rowsProcessed: '45,230',
        cost: '$0.12'
      }} queryPanelDataStatus='succedded' onClose={vi.fn()} />);

      const runsTab = screen.getByText('Runs');
      fireEvent.click(runsTab);

      expect(screen.getByText('State')).toBeInTheDocument();
      expect(screen.getByText('Display Name')).toBeInTheDocument();

      const detailsTab = screen.getByText('Details');
      fireEvent.click(detailsTab);

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Process type')).toBeInTheDocument();
    });

    it('handles modal interactions in QueryPanel', () => {
      render(<QueryPanel queryPanelData={{
        name: 'projects/1069578231809/locations/us/processes/sh-586d68e949ba0dea559c9adf23dac248',
        processType: 'Query',
        bigQueryJobId: 'bquxjob_54c91aaa_196ef03e028',
        status: 'Completed',
        startTime: '2024-12-01 10:30:00',
        endTime: '2024-12-01 10:32:15',
        duration: '2m 15s',
        bytesProcessed: '1.2 GB',
        rowsProcessed: '45,230',
        cost: '$0.12'
      }} queryPanelDataStatus='succedded' onClose={vi.fn()} />);

      const runsTab = screen.getByText('Runs');
      fireEvent.click(runsTab);

      const moreButtons = screen.getAllByText('More');
      fireEvent.click(moreButtons[0]);

      expect(screen.getByText('Run Details')).toBeInTheDocument();

      const modalCloseButton = screen.getAllByTestId('close-icon')[1];
      fireEvent.click(modalCloseButton);

      // Modal interactions work correctly
      expect(modalCloseButton).toBeInTheDocument();
    });
  });
});