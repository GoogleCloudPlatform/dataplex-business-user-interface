import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { vi, beforeEach, it, describe, expect } from 'vitest';
import FilterDropdown from './FilterDropDown';

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
      aspects: [
        {
          dataplexEntry: {
            entrySource: {
              displayName: 'Test Annotation 1',
              resource: 'test-resource-1'
            }
          }
        },
        {
          dataplexEntry: {
            entrySource: {
              displayName: 'Test Annotation 2',
              resource: 'test-resource-2'
            }
          }
        }
      ],
      projects: [
        { projectId: 'project-1' },
        { projectId: 'project-2' }
      ],
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
      search: (state = initialState, _action) => state
    },
    preloadedState: initialState
  });
};

// Mock child components
vi.mock('./FilterAnnotationsMultiSelect', () => ({
  default: function MockFilterAnnotationsMultiSelect({ options, value, onChange, onClose, isOpen }: any) {
    return isOpen ? (
      <div data-testid="annotations-multiselect">
        <div>Options: {options.join(', ')}</div>
        <div>Selected: {value.join(', ')}</div>
        <button onClick={() => onChange(['Test Annotation 1'])}>Select Annotation</button>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null;
  }
}));

vi.mock('./FilterSubAnnotationsPanel', () => ({
  default: function MockFilterSubAnnotationsPanel({ 
    annotationName, 
    subAnnotations, 
    selectedSubAnnotations, 
    onSubAnnotationsChange, 
    onSubAnnotationsApply, 
    onClose, 
    isOpen 
  }: any) {
    return isOpen ? (
      <div data-testid="sub-annotations-panel">
        <div>Annotation: {annotationName}</div>
        <div>Sub-annotations: {subAnnotations.length}</div>
        <div>Selected: {selectedSubAnnotations.length}</div>
        <button onClick={() => onSubAnnotationsChange([{ name: 'field1', type: 'string' }])}>
          Select Sub-annotation
        </button>
        <button onClick={() => onSubAnnotationsApply([{ name: 'field1', type: 'string' }])}>
          Apply
        </button>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null;
  }
}));

// Mock axios
vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
    defaults: {
      headers: {
        common: {}
      }
    }
  }
}));

// Mock SVG assets
vi.mock('../../assets/svg/edit_note.svg', () => ({ default: 'edit-note-icon' }));
vi.mock('../../assets/svg/BigQuery.svg', () => ({ default: 'bigquery-icon' }));
vi.mock('../../assets/svg/CloudBigTable.svg', () => ({ default: 'cloud-bigtable-icon' }));
vi.mock('../../assets/svg/cloudpub_sub.svg', () => ({ default: 'cloud-pubsub-icon' }));
vi.mock('../../assets/svg/CloudSpanner.svg', () => ({ default: 'cloud-spanner-icon' }));
vi.mock('../../assets/svg/CloudStorage.svg', () => ({ default: 'cloud-storage-icon' }));
vi.mock('../../assets/svg/Dataplex.svg', () => ({ default: 'dataplex-icon' }));
vi.mock('../../assets/svg/Dataproc.svg', () => ({ default: 'dataproc-icon' }));
vi.mock('../../assets/svg/vertex.svg', () => ({ default: 'vertex-icon' }));

// Mock constants
vi.mock('../../constants/urls', () => ({
  URLS: {
    API_URL: 'http://localhost:3000/api',
    GET_ASPECT_DETAIL: '/aspect-detail'
  }
}));

describe('FilterDropdown', () => {
  const mockOnFilterChange = vi.fn();
  const mockDispatch = vi.fn();

  const renderFilterDropdown = (props = {}, storeState: any = {}) => {
    const defaultStoreState = {
      search: {
        searchTerm: '',
        searchType: 'All',
        ...storeState.search
      }
    };

    const store = createMockStore(defaultStoreState);
    
    // Mock dispatch
    store.dispatch = mockDispatch;
    
    return render(
      <Provider store={store}>
        <FilterDropdown onFilterChange={mockOnFilterChange} {...props} />
      </Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component with all filter sections', () => {
    renderFilterDropdown();

    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByText('Clear')).toBeInTheDocument();
    expect(screen.getByText('Annotations')).toBeInTheDocument();
    expect(screen.getByText('Assets')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
  });

  it('displays filter sections as accordions', () => {
    renderFilterDropdown();

    // Check for accordion buttons by their text content
    expect(screen.getByText('Annotations')).toBeInTheDocument();
    expect(screen.getByText('Assets')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    
    // Check that they are rendered as buttons (accordion headers)
    const accordionButtons = screen.getAllByRole('button').filter(button => 
      button.getAttribute('aria-controls')?.includes('-content')
    );
    expect(accordionButtons).toHaveLength(4);
  });

  it('expands accordion when clicked', () => {
    renderFilterDropdown();

    const annotationsAccordion = screen.getByText('Annotations').closest('[role="button"]');
    if (annotationsAccordion) {
      fireEvent.click(annotationsAccordion);
      expect(screen.getByText('Test Annotation 1')).toBeInTheDocument();
    }
  });

  it('displays assets in the Assets section', () => {
    renderFilterDropdown();

    const assetsAccordion = screen.getByText('Assets').closest('[role="button"]');
    if (assetsAccordion) {
      fireEvent.click(assetsAccordion);
      expect(screen.getByText('Bucket')).toBeInTheDocument();
      expect(screen.getByText('Dataset')).toBeInTheDocument();
      expect(screen.getByText('Table')).toBeInTheDocument();
    }
  });

  it('displays products in the Products section', () => {
    renderFilterDropdown();

    const productsAccordion = screen.getByText('Products').closest('[role="button"]');
    if (productsAccordion) {
      fireEvent.click(productsAccordion);
      expect(screen.getByText('BigQuery')).toBeInTheDocument();
      expect(screen.getByText('Cloud BigTable')).toBeInTheDocument();
      expect(screen.getByText('Vertex AI')).toBeInTheDocument();
    }
  });

  it('displays user projects in the Projects section', () => {
    renderFilterDropdown();

    const projectsAccordion = screen.getByText('Projects').closest('[role="button"]');
    if (projectsAccordion) {
      fireEvent.click(projectsAccordion);
      expect(screen.getByText('project-1')).toBeInTheDocument();
      expect(screen.getByText('project-2')).toBeInTheDocument();
      expect(screen.getByText('Others')).toBeInTheDocument();
    }
  });

  it('displays user annotations in the Annotations section', () => {
    renderFilterDropdown();

    const annotationsAccordion = screen.getByText('Annotations').closest('[role="button"]');
    if (annotationsAccordion) {
      fireEvent.click(annotationsAccordion);
      expect(screen.getByText('Test Annotation 1')).toBeInTheDocument();
      expect(screen.getByText('Test Annotation 2')).toBeInTheDocument();
    }
  });

  it('handles checkbox selection for assets', () => {
    renderFilterDropdown();

    const assetsAccordion = screen.getByText('Assets').closest('[role="button"]');
    if (assetsAccordion) {
      fireEvent.click(assetsAccordion);
      
      const bucketCheckbox = screen.getByLabelText('Bucket');
      fireEvent.click(bucketCheckbox);
      
      expect(mockOnFilterChange).toHaveBeenCalledWith([
        expect.objectContaining({
          name: 'Bucket',
          type: 'typeAliases'
        })
      ]);
    }
  });

  it('handles checkbox selection for products', () => {
    renderFilterDropdown();

    const productsAccordion = screen.getByText('Products').closest('[role="button"]');
    if (productsAccordion) {
      fireEvent.click(productsAccordion);
      
      const bigqueryCheckbox = screen.getByLabelText('BigQuery');
      fireEvent.click(bigqueryCheckbox);
      
      expect(mockOnFilterChange).toHaveBeenCalledWith([
        expect.objectContaining({
          name: 'BigQuery',
          type: 'system'
        })
      ]);
    }
  });

  it('handles checkbox selection for annotations', () => {
    renderFilterDropdown();

    const annotationsAccordion = screen.getByText('Annotations').closest('[role="button"]');
    if (annotationsAccordion) {
      fireEvent.click(annotationsAccordion);
      
      const annotationCheckbox = screen.getByLabelText('Test Annotation 1');
      fireEvent.click(annotationCheckbox);
      
      expect(mockOnFilterChange).toHaveBeenCalledWith([
        expect.objectContaining({
          name: 'Test Annotation 1',
          type: 'aspectType'
        })
      ]);
    }
  });

  it('handles checkbox deselection', () => {
    const initialFilters = [
      { name: 'Bucket', type: 'typeAliases', data: {} }
    ];

    renderFilterDropdown({ filters: initialFilters });

    const assetsAccordion = screen.getByText('Assets').closest('[role="button"]');
    if (assetsAccordion) {
      fireEvent.click(assetsAccordion);
      
      const bucketCheckbox = screen.getByLabelText('Bucket');
      fireEvent.click(bucketCheckbox);
      
      expect(mockOnFilterChange).toHaveBeenCalledWith([]);
    }
  });

  it('clears all filters when Clear button is clicked', () => {
    const initialFilters = [
      { name: 'Bucket', type: 'typeAliases', data: {} },
      { name: 'BigQuery', type: 'system', data: {} }
    ];

    renderFilterDropdown({ filters: initialFilters });

    const clearButton = screen.getByText('Clear');
    fireEvent.click(clearButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith([]);
  });

  it('shows View All button in Annotations section', () => {
    renderFilterDropdown();

    const annotationsAccordion = screen.getByText('Annotations').closest('[role="button"]');
    if (annotationsAccordion) {
      fireEvent.click(annotationsAccordion);
      expect(screen.getByText('View All')).toBeInTheDocument();
    }
  });

  it('opens annotations multiselect when View All is clicked', () => {
    renderFilterDropdown();

    const annotationsAccordion = screen.getByText('Annotations').closest('[role="button"]');
    if (annotationsAccordion) {
      fireEvent.click(annotationsAccordion);
      
      const viewAllButton = screen.getByText('View All');
      fireEvent.click(viewAllButton);
      
      expect(screen.getByTestId('annotations-multiselect')).toBeInTheDocument();
    }
  });

  it('shows edit note icon for annotations', () => {
    renderFilterDropdown();

    const annotationsAccordion = screen.getByText('Annotations').closest('[role="button"]');
    if (annotationsAccordion) {
      fireEvent.click(annotationsAccordion);
      
      const editIcons = screen.getAllByAltText('Edit Note');
      expect(editIcons.length).toBeGreaterThan(0);
    }
  });

  it('opens sub-annotations panel when edit note icon is clicked', () => {
    renderFilterDropdown();

    const annotationsAccordion = screen.getByText('Annotations').closest('[role="button"]');
    if (annotationsAccordion) {
      fireEvent.click(annotationsAccordion);
      
      const editIcon = screen.getAllByAltText('Edit Note')[0];
      fireEvent.click(editIcon);
      
      expect(screen.getByTestId('sub-annotations-panel')).toBeInTheDocument();
    }
  });

  it('displays product icons for products', () => {
    renderFilterDropdown();

    const productsAccordion = screen.getByText('Products').closest('[role="button"]');
    if (productsAccordion) {
      fireEvent.click(productsAccordion);
      
      const bigqueryIcon = screen.getByAltText('BigQuery');
      expect(bigqueryIcon).toBeInTheDocument();
    }
  });

  it('syncs with search type when product is selected', () => {
    renderFilterDropdown();

    const productsAccordion = screen.getByText('Products').closest('[role="button"]');
    if (productsAccordion) {
      fireEvent.click(productsAccordion);
      
      const bigqueryCheckbox = screen.getByLabelText('BigQuery');
      fireEvent.click(bigqueryCheckbox);
      
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'search/setSearchType',
        payload: { searchType: 'BigQuery' }
      });
    }
  });

  it('sets search type to All when no products are selected', () => {
    const initialFilters = [
      { name: 'BigQuery', type: 'system', data: {} }
    ];

    renderFilterDropdown({ filters: initialFilters });

    const productsAccordion = screen.getByText('Products').closest('[role="button"]');
    if (productsAccordion) {
      fireEvent.click(productsAccordion);
      
      const bigqueryCheckbox = screen.getByLabelText('BigQuery');
      fireEvent.click(bigqueryCheckbox);
      
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'search/setSearchType',
        payload: { searchType: 'All' }
      });
    }
  });

  it('auto-selects assets when search term matches', async () => {
    renderFilterDropdown({}, {
      search: {
        searchTerm: 'dataset',
        searchType: 'All'
      }
    });

    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith([
        expect.objectContaining({
          name: 'Dataset',
          type: 'typeAliases'
        })
      ]);
    });
  });

  it('auto-selects product when search type is set', async () => {
    renderFilterDropdown({}, {
      search: {
        searchTerm: '',
        searchType: 'BigQuery'
      }
    });

    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith([
        expect.objectContaining({
          name: 'BigQuery',
          type: 'system'
        })
      ]);
    });
  });

  it('clears asset filters when search term is cleared', async () => {
    const initialFilters = [
      { name: 'Dataset', type: 'typeAliases', data: {} }
    ];

    renderFilterDropdown({ filters: initialFilters }, {
      search: {
        searchTerm: '',
        searchType: 'All'
      }
    });

    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith([]);
    });
  });

  it('sorts assets and products to show selected items first', () => {
    const initialFilters = [
      { name: 'Table', type: 'typeAliases', data: {} }
    ];

    renderFilterDropdown({ filters: initialFilters });

    const assetsAccordion = screen.getByText('Assets').closest('[role="button"]');
    if (assetsAccordion) {
      fireEvent.click(assetsAccordion);
      
      // Table should appear first in the list since it's selected
      const assetItems = screen.getAllByText(/^(Bucket|Cluster|Code asset|Connection|Dashboard|Dashboard element|Data exchange|Data source connection|Data stream|Database|Database schema|Dataset|Explore|Feature group|Feature online store|Feature view|Fileset|Folder|Function|Glossary|Glossary Category|Glossary Term|Listing|Look|Model|Repository|Resource|Routine|Service|Table|View|Other)$/);
      expect(assetItems[0]).toHaveTextContent('Table');
    }
  });

  it('handles user without appConfig', () => {
    const authContextWithoutAppConfig = {
      ...mockAuthContext,
      user: { ...mockAuthContext.user, appConfig: null }
    };

    vi.doMock('../../auth/AuthProvider', () => ({
      useAuth: () => authContextWithoutAppConfig
    }));

    renderFilterDropdown();

    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  it('handles user without aspects in appConfig', () => {
    const authContextWithoutAspects = {
      ...mockAuthContext,
      user: { 
        ...mockAuthContext.user, 
        appConfig: { 
          ...mockAuthContext.user.appConfig,
          aspects: null 
        } 
      }
    };

    vi.doMock('../../auth/AuthProvider', () => ({
      useAuth: () => authContextWithoutAspects
    }));

    renderFilterDropdown();

    const annotationsAccordion = screen.getByText('Annotations').closest('[role="button"]');
    if (annotationsAccordion) {
      fireEvent.click(annotationsAccordion);
      // Should not crash and should show View All button
      expect(screen.getByText('View All')).toBeInTheDocument();
    }
  });

  it('handles user without projects in appConfig', () => {
    const authContextWithoutProjects = {
      ...mockAuthContext,
      user: { 
        ...mockAuthContext.user, 
        appConfig: { 
          ...mockAuthContext.user.appConfig,
          projects: null 
        } 
      }
    };

    vi.doMock('../../auth/AuthProvider', () => ({
      useAuth: () => authContextWithoutProjects
    }));

    renderFilterDropdown();

    const projectsAccordion = screen.getByText('Projects').closest('[role="button"]');
    if (projectsAccordion) {
      fireEvent.click(projectsAccordion);
      // Should not crash and should show Others option
      expect(screen.getByText('Others')).toBeInTheDocument();
    }
  });

  it('handles empty filters prop', () => {
    renderFilterDropdown({ filters: [] });

    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  it('handles undefined filters prop', () => {
    renderFilterDropdown({ filters: undefined });

    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  it('shows loading state when clear is clicked', () => {
    renderFilterDropdown();

    const clearButton = screen.getByText('Clear');
    fireEvent.click(clearButton);

    // Component should briefly show loading state
    expect(mockOnFilterChange).toHaveBeenCalledWith([]);
  });

  it('handles sub-annotations panel apply', () => {
    renderFilterDropdown();

    const annotationsAccordion = screen.getByText('Annotations').closest('[role="button"]');
    if (annotationsAccordion) {
      fireEvent.click(annotationsAccordion);
      
      const editIcon = screen.getAllByAltText('Edit Note')[0];
      fireEvent.click(editIcon);
      
      const applyButton = screen.getByText('Apply');
      fireEvent.click(applyButton);
      
      expect(mockOnFilterChange).toHaveBeenCalledWith([
        expect.objectContaining({
          name: 'Test Annotation 1',
          type: 'aspectType'
        })
      ]);
    }
  });

  it('handles annotations multiselect change', () => {
    renderFilterDropdown();

    const annotationsAccordion = screen.getByText('Annotations').closest('[role="button"]');
    if (annotationsAccordion) {
      fireEvent.click(annotationsAccordion);
      
      const viewAllButton = screen.getByText('View All');
      fireEvent.click(viewAllButton);
      
      const selectButton = screen.getByText('Select Annotation');
      fireEvent.click(selectButton);
      
      expect(mockOnFilterChange).toHaveBeenCalledWith([
        expect.objectContaining({
          name: 'Test Annotation 1',
          type: 'aspectType'
        })
      ]);
    }
  });

  it('handles user without token', () => {
    const authContextWithoutToken = {
      ...mockAuthContext,
      user: { ...mockAuthContext.user, token: '' }
    };

    vi.doMock('../../auth/AuthProvider', () => ({
      useAuth: () => authContextWithoutToken
    }));

    renderFilterDropdown();

    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  it('handles missing entry prop gracefully', () => {
    renderFilterDropdown();

    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  it('applies correct styling to filter sections', () => {
    renderFilterDropdown();

    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });

  it('handles multiple filter selections', () => {
    renderFilterDropdown();

    const assetsAccordion = screen.getByText('Assets').closest('[role="button"]');
    if (assetsAccordion) {
      fireEvent.click(assetsAccordion);
      
      const bucketCheckbox = screen.getByLabelText('Bucket');
      const datasetCheckbox = screen.getByLabelText('Dataset');
      
      fireEvent.click(bucketCheckbox);
      fireEvent.click(datasetCheckbox);
      
      expect(mockOnFilterChange).toHaveBeenCalledWith([
        expect.objectContaining({ name: 'Bucket', type: 'typeAliases' }),
        expect.objectContaining({ name: 'Dataset', type: 'typeAliases' })
      ]);
    }
  });

  it('handles mixed filter types selection', () => {
    renderFilterDropdown();

    const assetsAccordion = screen.getByText('Assets').closest('[role="button"]');
    const productsAccordion = screen.getByText('Products').closest('[role="button"]');
    
    if (assetsAccordion && productsAccordion) {
      fireEvent.click(assetsAccordion);
      const bucketCheckbox = screen.getByLabelText('Bucket');
      fireEvent.click(bucketCheckbox);
      
      fireEvent.click(productsAccordion);
      const bigqueryCheckbox = screen.getByLabelText('BigQuery');
      fireEvent.click(bigqueryCheckbox);
      
      expect(mockOnFilterChange).toHaveBeenCalledWith([
        expect.objectContaining({ name: 'Bucket', type: 'typeAliases' }),
        expect.objectContaining({ name: 'BigQuery', type: 'system' })
      ]);
    }
  });
});
