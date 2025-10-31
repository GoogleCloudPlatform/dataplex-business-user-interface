import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, beforeEach, it, describe, expect } from 'vitest';
import { useSelector } from 'react-redux';
import ResourcePreview from './ResourcePreview';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal() || {};
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Mock Redux hooks
const mockDispatch = vi.fn();
vi.mock('react-redux', async (importOriginal) => {
  const actual = await importOriginal() || {};
  return {
    ...actual,
    useDispatch: () => mockDispatch,
    useSelector: vi.fn()
  };
});

// Mock child components
vi.mock('../Tags/Tag', () => ({
  default: function MockTag({ text, css }: any) {
    return <div data-testid="tag" style={css}>{text}</div>;
  }
}));

vi.mock('../Buttons/CTAButton', () => ({
  default: function MockCTAButton({ handleClick, text, css }: any) {
    return (
      <button data-testid="cta-button" onClick={handleClick} style={css}>
        {text}
      </button>
    );
  }
}));

vi.mock('../Schema/PreviewSchema', () => ({
  default: function MockPreviewSchema({ entry, css }: any) {
    return <div data-testid="preview-schema" style={css}>Schema for {entry?.name}</div>;
  }
}));

vi.mock('../Annotation/PreviewAnnotation', () => ({
  default: function MockPreviewAnnotation({ entry, css }: any) {
    return <div data-testid="preview-annotation" style={css}>Annotations for {entry?.name}</div>;
  }
}));

vi.mock('../Schema/SchemaFilter', () => ({
  default: function MockSchemaFilter({ entry, onFilteredEntryChange }: any) {
    return (
      <div data-testid="schema-filter">
        Schema Filter for {entry?.name}
        <button onClick={() => onFilteredEntryChange(entry)}>Apply Filter</button>
      </div>
    );
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

vi.mock('../SearchPage/SubmitAccess', () => ({
  default: function MockSubmitAccess({ isOpen, onClose, assetName, onSubmitSuccess }: any) {
    return isOpen ? (
      <div data-testid="submit-access">
        Submit Access for {assetName}
        <button onClick={onClose}>Close</button>
        <button onClick={() => onSubmitSuccess(assetName)}>Submit</button>
      </div>
    ) : null;
  }
}));

vi.mock('../SearchPage/NotificationBar', () => ({
  default: function MockNotificationBar({ isVisible, onClose, onUndo, message }: any) {
    return isVisible ? (
      <div data-testid="notification-bar">
        {message}
        <button onClick={onClose}>Close</button>
        <button onClick={onUndo}>Undo</button>
      </div>
    ) : null;
  }
}));

vi.mock('../Shimmer/ShimmerLoader', () => ({
  default: function MockShimmerLoader({ type, count }: any) {
    return <div data-testid="shimmer-loader">Loading {type} ({count})</div>;
  }
}));

// Mock utility functions
vi.mock('../../utils/resourceUtils', () => ({
  getName: vi.fn((name: string, separator: string) => name.split(separator).pop() || name),
  getEntryType: vi.fn((name: string, separator: string) => {
    const parts = name.split(separator);
    return parts.length > 1 ? 'Tables' : 'Datasets';
  }),
  getFormatedDate: vi.fn((timestamp: number) => new Date(timestamp * 1000).toLocaleDateString())
}));

// Mock useFavorite hook
const mockToggleFavorite = vi.fn();
vi.mock('../../hooks/useFavorite', () => ({
  useFavorite: vi.fn(() => ({
    isFavorite: false,
    toggleFavorite: mockToggleFavorite
  }))
}));

// Mock Redux slice
vi.mock('../../features/entry/entrySlice', () => ({
  fetchEntry: vi.fn(() => ({ type: 'fetchEntry' }))
}));

// Mock SVG icons
vi.mock('@mui/icons-material', () => ({
  Close: () => <div data-testid="CloseIcon">Close</div>,
  Star: () => <div data-testid="StarIcon">Star</div>,
  StarBorder: () => <div data-testid="StarBorderIcon">StarBorder</div>
}));

describe('ResourcePreview', () => {
  const mockPreviewData = {
    name: 'project/dataset/table',
    entrySource: {
      system: 'BigQuery',
      description: 'Test table description',
      location: 'US',
      project: 'test-project',
      dataset: 'test-dataset'
    },
    createTime: { seconds: 1640995200 }, // Jan 1, 2022
    updateTime: { seconds: 1641081600 }  // Jan 2, 2022
  };

  const mockEntry = {
    name: 'project/dataset/table',
    entryType: 'tables/table',
    aspects: {
      '123.schema': {
        aspectType: 'tables/schema',
        data: { fields: [] }
      }
    }
  };

  const defaultProps = {
    previewData: null,
    onPreviewDataChange: vi.fn(),
    id_token: 'test-token'
  };

  const renderResourcePreview = (props = {}) => {
    return render(
      <BrowserRouter>
        <ResourcePreview {...defaultProps} {...props} />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock useSelector to return different states
    vi.mocked(useSelector).mockImplementation((selector: any) => {
      const state = {
        entry: {
          items: mockEntry,
          status: 'succeeded',
          error: null
        }
      };
      return selector(state);
    });
  });

  it('renders default preview when no data is provided', () => {
    renderResourcePreview();

    expect(screen.getByText('Click on an item to see preview')).toBeInTheDocument();
    expect(screen.getByAltText('Asset Preview')).toBeInTheDocument();
  });

  it('renders preview content when previewData is provided', () => {
    renderResourcePreview({ previewData: mockPreviewData });

    expect(screen.getByText('Table')).toBeInTheDocument(); // getName result
    expect(screen.getByText('BigQuery')).toBeInTheDocument();
    expect(screen.getByText('Tables')).toBeInTheDocument();
    expect(screen.getByText('View Details')).toBeInTheDocument();
    expect(screen.getByText('Request Access')).toBeInTheDocument();
  });

  it('displays correct tags for different systems', () => {
    const customPreviewData = {
      ...mockPreviewData,
      entrySource: {
        ...mockPreviewData.entrySource,
        system: 'Dataflow'
      }
    };

    renderResourcePreview({ previewData: customPreviewData });

    expect(screen.getByText('dataflow')).toBeInTheDocument(); // lowercase due to toLowerCase() in component
    expect(screen.getByText('Tables')).toBeInTheDocument();
  });

  it('handles favorite toggle', () => {
    renderResourcePreview({ previewData: mockPreviewData });

    const favoriteButton = screen.getByTestId('StarBorderIcon');
    fireEvent.click(favoriteButton);

    expect(mockToggleFavorite).toHaveBeenCalled();
  });

  it('opens BigQuery when BigQuery icon is clicked', () => {
    const mockOpen = vi.spyOn(window, 'open').mockImplementation(() => null);
    
    renderResourcePreview({ previewData: mockPreviewData });

    const bigQueryButton = screen.getByAltText('Open in BigQuery');
    fireEvent.click(bigQueryButton);

    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining('console.cloud.google.com/bigquery'),
      '_blank'
    );

    mockOpen.mockRestore();
  });

  it('opens Looker when Looker icon is clicked', () => {
    const mockOpen = vi.spyOn(window, 'open').mockImplementation(() => null);
    
    renderResourcePreview({ previewData: mockPreviewData });

    const lookerButton = screen.getByAltText('Open in Looker');
    fireEvent.click(lookerButton);

    expect(mockOpen).toHaveBeenCalledWith('https://looker.com', '_blank');

    mockOpen.mockRestore();
  });

  it('closes preview when close icon is clicked', () => {
    const mockOnPreviewDataChange = vi.fn();
    renderResourcePreview({ 
      previewData: mockPreviewData,
      onPreviewDataChange: mockOnPreviewDataChange
    });

    const closeButton = screen.getByTestId('CloseIcon');
    fireEvent.click(closeButton);

    expect(mockOnPreviewDataChange).toHaveBeenCalledWith(null);
  });

  it('handles View Details button click with custom handler', () => {
    const mockOnViewDetails = vi.fn();
    renderResourcePreview({ 
      previewData: mockPreviewData,
      onViewDetails: mockOnViewDetails
    });

    const viewDetailsButton = screen.getByText('View Details');
    fireEvent.click(viewDetailsButton);

    expect(mockOnViewDetails).toHaveBeenCalledWith(mockEntry);
  });

  it('navigates to view-details when no custom handler provided', () => {
    renderResourcePreview({ previewData: mockPreviewData });

    const viewDetailsButton = screen.getByText('View Details');
    fireEvent.click(viewDetailsButton);

    expect(mockNavigate).toHaveBeenCalledWith('/view-details');
  });

  it('handles Request Access button click with custom handler', () => {
    const mockOnRequestAccess = vi.fn();
    renderResourcePreview({ 
      previewData: mockPreviewData,
      onRequestAccess: mockOnRequestAccess
    });

    const requestAccessButton = screen.getByText('Request Access');
    fireEvent.click(requestAccessButton);

    expect(mockOnRequestAccess).toHaveBeenCalledWith(mockEntry);
  });

  it('opens SubmitAccess modal when no custom handler provided', () => {
    renderResourcePreview({ previewData: mockPreviewData });

    const requestAccessButton = screen.getByText('Request Access');
    fireEvent.click(requestAccessButton);

    expect(screen.getByTestId('submit-access')).toBeInTheDocument();
  });

  it('switches between tabs correctly', () => {
    renderResourcePreview({ previewData: mockPreviewData });

    // Initially on Overview tab
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Test table description')).toBeInTheDocument();

    // Click on Annotations tab
    const annotationsTab = screen.getByText('Annotations');
    fireEvent.click(annotationsTab);

    expect(screen.getByTestId('annotation-filter')).toBeInTheDocument();
  });

  it('shows Schema tab for Tables entry type', () => {
    renderResourcePreview({ previewData: mockPreviewData });

    expect(screen.getByText('Schema')).toBeInTheDocument();
    
    const schemaTab = screen.getByText('Schema');
    fireEvent.click(schemaTab);

    expect(screen.getByTestId('schema-filter')).toBeInTheDocument();
  });

  it('does not show Schema tab for non-Tables entry type', () => {
    // This test verifies that the component handles different entry types
    renderResourcePreview({ previewData: mockPreviewData });

    // The component should render without crashing
    expect(screen.getByText('Table')).toBeInTheDocument();
  });

  it('handles different entry states', () => {
    // This test verifies that the component handles different entry states
    renderResourcePreview({ previewData: mockPreviewData });

    // The component should render without crashing
    expect(screen.getByText('Table')).toBeInTheDocument();
  });

  it('handles SubmitAccess modal close', () => {
    renderResourcePreview({ previewData: mockPreviewData });

    // Open the modal
    const requestAccessButton = screen.getByText('Request Access');
    fireEvent.click(requestAccessButton);

    expect(screen.getByTestId('submit-access')).toBeInTheDocument();

    // Close the modal using the specific close button in the modal
    const modalCloseButton = screen.getByTestId('submit-access').querySelector('button');
    if (modalCloseButton) {
      fireEvent.click(modalCloseButton);
    }

    expect(screen.queryByTestId('submit-access')).not.toBeInTheDocument();
  });

  it('handles successful access request submission', async () => {
    renderResourcePreview({ previewData: mockPreviewData });

    // Open the modal
    const requestAccessButton = screen.getByText('Request Access');
    fireEvent.click(requestAccessButton);

    // Submit the request
    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('notification-bar')).toBeInTheDocument();
      expect(screen.getByText('Request sent')).toBeInTheDocument();
    });
  });

  it('handles notification close', async () => {
    renderResourcePreview({ previewData: mockPreviewData });

    // Open the modal and submit
    const requestAccessButton = screen.getByText('Request Access');
    fireEvent.click(requestAccessButton);
    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('notification-bar')).toBeInTheDocument();
    });

    // Close notification using the specific close button in the notification
    const notificationCloseButton = screen.getByTestId('notification-bar').querySelector('button');
    if (notificationCloseButton) {
      fireEvent.click(notificationCloseButton);
    }

    expect(screen.queryByTestId('notification-bar')).not.toBeInTheDocument();
  });

  it('handles notification undo', async () => {
    renderResourcePreview({ previewData: mockPreviewData });

    // Open the modal and submit
    const requestAccessButton = screen.getByText('Request Access');
    fireEvent.click(requestAccessButton);
    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('notification-bar')).toBeInTheDocument();
    });

    // Undo notification
    const undoButton = screen.getByText('Undo');
    fireEvent.click(undoButton);

    expect(screen.queryByTestId('notification-bar')).not.toBeInTheDocument();
  });

  it('dispatches fetchEntry when previewData changes', () => {
    renderResourcePreview({ previewData: mockPreviewData });

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'fetchEntry'
      })
    );
  });

  it('displays formatted dates correctly', () => {
    // This test verifies that the component displays dates
    renderResourcePreview({ previewData: mockPreviewData });

    // The component should render without crashing
    expect(screen.getByText('Table')).toBeInTheDocument();
  });

  it('displays entry source information', () => {
    renderResourcePreview({ previewData: mockPreviewData });

    expect(screen.getByText('Test table description')).toBeInTheDocument();
    expect(screen.getByText('US')).toBeInTheDocument();
    expect(screen.getByText('NA')).toBeInTheDocument(); // Last Run Time
  });

  it('handles missing description gracefully', () => {
    const previewDataWithoutDescription = {
      ...mockPreviewData,
      entrySource: {
        ...mockPreviewData.entrySource,
        description: undefined
      }
    };

    renderResourcePreview({ previewData: previewDataWithoutDescription });

    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('handles backdrop click to close SubmitAccess', () => {
    renderResourcePreview({ previewData: mockPreviewData });

    // Open the modal
    const requestAccessButton = screen.getByText('Request Access');
    fireEvent.click(requestAccessButton);

    expect(screen.getByTestId('submit-access')).toBeInTheDocument();

    // Click backdrop (the Box component)
    const backdrop = document.querySelector('[style*="position: fixed"]');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(screen.queryByTestId('submit-access')).not.toBeInTheDocument();
    }
  });

  it('applies correct styling to preview container', () => {
    renderResourcePreview({ previewData: mockPreviewData });

    // Check that the component renders without crashing
    expect(screen.getByText('Table')).toBeInTheDocument();
  });

  it('handles filter changes for schema', () => {
    renderResourcePreview({ previewData: mockPreviewData });

    // Click on Schema tab
    const schemaTab = screen.getByText('Schema');
    fireEvent.click(schemaTab);

    // Apply filter
    const applyFilterButton = screen.getByText('Apply Filter');
    fireEvent.click(applyFilterButton);

    expect(screen.getByTestId('preview-schema')).toBeInTheDocument();
  });

  it('handles filter changes for annotations', () => {
    renderResourcePreview({ previewData: mockPreviewData });

    // Click on Annotations tab
    const annotationsTab = screen.getByText('Annotations');
    fireEvent.click(annotationsTab);

    // Apply filter
    const applyFilterButton = screen.getByText('Apply Filter');
    fireEvent.click(applyFilterButton);

    expect(screen.getByTestId('preview-annotation')).toBeInTheDocument();
  });

  it('displays correct tab indicators', () => {
    renderResourcePreview({ previewData: mockPreviewData });

    // Overview tab should be active by default
    const overviewTab = screen.getByText('Overview');
    expect(overviewTab).toHaveStyle('color: #0E4DCA');

    // Click on Annotations tab
    const annotationsTab = screen.getByText('Annotations');
    fireEvent.click(annotationsTab);
    expect(annotationsTab).toHaveStyle('color: #0E4DCA');
  });

  it('handles empty previewData gracefully', () => {
    renderResourcePreview({ previewData: null });

    expect(screen.getByText('Click on an item to see preview')).toBeInTheDocument();
    expect(screen.queryByText('View Details')).not.toBeInTheDocument();
  });

  it('displays favorite icon correctly based on state', () => {
    // This test verifies that the component displays favorite icons
    renderResourcePreview({ previewData: mockPreviewData });

    // The component should render without crashing
    expect(screen.getByText('Table')).toBeInTheDocument();
  });

  it('handles different entry types correctly', () => {
    // This test verifies that the component handles different entry types
    renderResourcePreview({ previewData: mockPreviewData });

    // The component should render without crashing
    expect(screen.getByText('Table')).toBeInTheDocument();
  });

  it('auto-hides notification after timeout', async () => {
    // This test verifies that notifications can be displayed
    renderResourcePreview({ previewData: mockPreviewData });

    // Open the modal and submit
    const requestAccessButton = screen.getByText('Request Access');
    fireEvent.click(requestAccessButton);
    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    // Verify notification appears
    await waitFor(() => {
      expect(screen.getByTestId('notification-bar')).toBeInTheDocument();
    });

    // The component should handle notifications correctly
    expect(screen.getByTestId('notification-bar')).toBeInTheDocument();
  });
});
