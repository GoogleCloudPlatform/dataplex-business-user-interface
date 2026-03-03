import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, beforeEach, it, describe, expect } from 'vitest';
import Home from './Home';
import axios from 'axios';

// Track projects loaded state across tests
let mockProjectsLoaded = false;

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal() || {};
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

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

// Mock react-redux
const mockDispatch = vi.fn();
vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
    useSelector: (selector: (state: { projects: { isloaded: boolean } }) => unknown) => {
      const mockState = {
        projects: { isloaded: mockProjectsLoaded }
      };
      return selector(mockState);
    }
  };
});

// Mock getProjects action
vi.mock('../../features/projects/projectsSlice', () => ({
  getProjects: vi.fn((data: { id_token?: string }) => ({ type: 'projects/getProjects', payload: data }))
}));

// Mock axios - use actual axios module and spy on it
vi.mock('axios');

// Mock auth provider - will be set per test
let mockAuthContext: { user: unknown; login: unknown; logout: unknown; updateUser: unknown } = {
  user: null,
  login: vi.fn(),
  logout: vi.fn(),
  updateUser: vi.fn()
};
vi.mock('../../auth/AuthProvider', () => ({
  useAuth: () => mockAuthContext
}));

// Mock constants
vi.mock('../../constants/urls', () => ({
  URLS: {
    API_URL: 'http://localhost:3000/api',
    APP_CONFIG: '/app-config'
  }
}));

// Mock SearchBar component
vi.mock('../SearchBar/SearchBar', () => ({
  default: function MockSearchBar({ handleSearchSubmit, variant, dataSearch }: { handleSearchSubmit: (text: string) => void; variant: string; dataSearch: Array<{ name: string }> }) {
    return (
      <div data-testid="search-bar">
        <input
          data-testid="search-input"
          placeholder="Search..."
          onChange={(e) => {
            if (e.target.value) {
              handleSearchSubmit(e.target.value);
            }
          }}
        />
        <div data-testid="search-variant">{variant}</div>
        <div data-testid="search-data">{JSON.stringify(dataSearch)}</div>
      </div>
    );
  }
}));

// Mock CSS file
vi.mock('./Home.css', () => ({}));

describe('Home', () => {
  const mockLogout = vi.fn();
  const mockUpdateUser = vi.fn();

  // Mock user data
  const mockUserWithAppConfig = {
    token: 'test-token',
    name: 'Test User',
    email: 'test@example.com',
    picture: 'test-picture',
    tokenExpiry: Date.now() + 3600000,
    tokenIssuedAt: Date.now(),
    hasRole: true,
    roles: [],
    permissions: [],
    appConfig: {
      aspects: ['aspect1'],
      projects: ['project1'],
      defaultSearchProduct: { name: 'BigQuery' },
      defaultSearchAssets: { type: 'table' },
      browseByAspectTypes: { type1: 'value1' },
      browseByAspectTypesLabels: { label1: 'Label 1' }
    }
  };

  const mockUserWithoutAppConfig = {
    ...mockUserWithAppConfig,
    appConfig: {} as Record<string, never>
  };

  type MockUser = typeof mockUserWithAppConfig | typeof mockUserWithoutAppConfig | {
    token: string;
    name: string;
    email: string;
    picture: string;
    tokenExpiry: number;
    tokenIssuedAt: number;
    hasRole: boolean;
    roles: never[];
    permissions: never[];
    appConfig: Record<string, unknown>;
  };

  const createMockAuthContext = (user: MockUser) => ({
    user,
    login: vi.fn(),
    logout: mockLogout,
    updateUser: mockUpdateUser
  });

  // Mock sessionStorage
  const mockSessionStorage = (() => {
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
      })
    };
  })();

  // Setup and teardown
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionStorage.clear();
    mockProjectsLoaded = false;
    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true
    });

    // Setup axios mock
    vi.mocked(axios.get).mockClear();
    if (!axios.defaults) {
      (axios as any).defaults = { headers: { common: {} } };
    }
  });

  const renderHome = (authContext = createMockAuthContext(mockUserWithAppConfig)) => {
    // Set the mock auth context before rendering
    mockAuthContext = authContext;

    return render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );
  };

  describe('Loading state', () => {
    it('shows CircularProgress when appConfig is empty', async () => {
      const authContext = createMockAuthContext(mockUserWithoutAppConfig);
      vi.mocked(axios.get).mockResolvedValue({
        data: {
          aspects: [],
          projects: [],
          defaultSearchProduct: {},
          defaultSearchAssets: {},
          browseByAspectTypes: {},
          browseByAspectTypesLabels: {}
        }
      } as any);

      renderHome(authContext);

      const loader = screen.getByRole('progressbar');
      expect(loader).toBeInTheDocument();
    });

    it('shows home banner when appConfig is populated', () => {
      const authContext = createMockAuthContext(mockUserWithAppConfig);
      renderHome(authContext);

      waitFor(() => {
        expect(screen.getByText('What would you like to discover?')).toBeInTheDocument();
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });

    it('hides loader after appConfig is fetched', async () => {
      const authContext = createMockAuthContext(mockUserWithoutAppConfig);
      vi.mocked(axios.get).mockResolvedValue({
        data: {
          aspects: [],
          projects: [],
          defaultSearchProduct: {},
          defaultSearchAssets: {},
          browseByAspectTypes: {},
          browseByAspectTypesLabels: {}
        }
      } as any);

      renderHome(authContext);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });
  });

  describe('App config fetching', () => {
    it('makes API call to URLS.APP_CONFIG when appConfig is empty', async () => {
      const authContext = createMockAuthContext(mockUserWithoutAppConfig);
      vi.mocked(axios.get).mockResolvedValue({
        data: {
          aspects: [],
          projects: [],
          defaultSearchProduct: {},
          defaultSearchAssets: {},
          browseByAspectTypes: {},
          browseByAspectTypesLabels: {}
        }
      } as any);

      renderHome(authContext);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('http://localhost:3000/api/app-config');
      });
    });

    it('does NOT make API call when appConfig is already populated', () => {
      const authContext = createMockAuthContext(mockUserWithAppConfig);
      renderHome(authContext);

      expect(axios.get).not.toHaveBeenCalled();
    });

    it('calls updateUser with correct data on successful fetch', async () => {
      const authContext = createMockAuthContext(mockUserWithoutAppConfig);
      const mockAppConfig = {
        aspects: ['aspect1'],
        projects: ['project1'],
        defaultSearchProduct: {},
        defaultSearchAssets: {},
        browseByAspectTypes: {},
        browseByAspectTypesLabels: {}
      };
      vi.mocked(axios.get).mockResolvedValue({ data: mockAppConfig } as any);

      renderHome(authContext);

      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalledWith(
          'test-token',
          expect.objectContaining({
            name: 'Test User',
            email: 'test@example.com',
            picture: 'test-picture',
            token: 'test-token',
            hasRole: true,
            roles: [],
            permissions: [],
            appConfig: mockAppConfig
          })
        );
      });
    });

    it('shows error notification and calls logout on API error', async () => {
      const authContext = createMockAuthContext(mockUserWithoutAppConfig);
      vi.mocked(axios.get).mockRejectedValue(new Error('Network error'));

      renderHome(authContext);

      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith(
          'Access token expired or you do not have enough permissions',
          2000
        );
        expect(mockLogout).toHaveBeenCalled();
      });
    });

    it('sets loader to false after fetch completes', async () => {
      const authContext = createMockAuthContext(mockUserWithoutAppConfig);
      vi.mocked(axios.get).mockResolvedValue({
        data: {
          aspects: [],
          projects: [],
          defaultSearchProduct: {},
          defaultSearchAssets: {},
          browseByAspectTypes: {},
          browseByAspectTypesLabels: {}
        }
      } as any);

      renderHome(authContext);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });
  });

  describe('Redux integration', () => {
    it('dispatches getProjects when projectsLoaded is false', async () => {
      const authContext = createMockAuthContext(mockUserWithAppConfig);
      mockProjectsLoaded = false;

      renderHome(authContext);

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'projects/getProjects',
            payload: { id_token: 'test-token' }
          })
        );
      });
    });

    it('does NOT dispatch getProjects when projectsLoaded is true', () => {
      const authContext = createMockAuthContext(mockUserWithAppConfig);
      mockProjectsLoaded = true;

      renderHome(authContext);

      const projectsCall = mockDispatch.mock.calls.find(
        (call: unknown[]) => (call[0] as { type?: string })?.type === 'projects/getProjects'
      );
      expect(projectsCall).toBeUndefined();
    });

    it('dispatches resources state reset actions on mount', async () => {
      const authContext = createMockAuthContext(mockUserWithAppConfig);
      renderHome(authContext);

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith({
          type: 'resources/setItemsPreviousPageRequest',
          payload: null
        });
        expect(mockDispatch).toHaveBeenCalledWith({
          type: 'resources/setItemsPageRequest',
          payload: null
        });
        expect(mockDispatch).toHaveBeenCalledWith({
          type: 'resources/setItemsStoreData',
          payload: []
        });
        expect(mockDispatch).toHaveBeenCalledWith({
          type: 'resources/setItems',
          payload: []
        });
      });
    });

    it('dispatches resources state reset actions before search', async () => {
      const authContext = createMockAuthContext(mockUserWithAppConfig);
      renderHome(authContext);

      await waitFor(() => {
        expect(screen.getByTestId('search-bar')).toBeInTheDocument();
      });

      mockDispatch.mockClear();

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'test search' } });

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith({
          type: 'resources/setItemsPreviousPageRequest',
          payload: null
        });
        expect(mockDispatch).toHaveBeenCalledWith({
          type: 'resources/setItemsPageRequest',
          payload: null
        });
        expect(mockDispatch).toHaveBeenCalledWith({
          type: 'resources/setItemsStoreData',
          payload: []
        });
        expect(mockDispatch).toHaveBeenCalledWith({
          type: 'resources/setItems',
          payload: []
        });
      });
    });

    it('verifies all 4 resource reset actions are dispatched', async () => {
      const authContext = createMockAuthContext(mockUserWithAppConfig);
      renderHome(authContext);

      await waitFor(() => {
        const dispatchedTypes = mockDispatch.mock.calls.map((call: unknown[]) => (call[0] as { type?: string })?.type);
        expect(dispatchedTypes).toContain('resources/setItemsPreviousPageRequest');
        expect(dispatchedTypes).toContain('resources/setItemsPageRequest');
        expect(dispatchedTypes).toContain('resources/setItemsStoreData');
        expect(dispatchedTypes).toContain('resources/setItems');
      });
    });
  });

  describe('Search functionality', () => {
    it('handleSearch navigates to /search route', async () => {
      const authContext = createMockAuthContext(mockUserWithAppConfig);
      renderHome(authContext);

      await waitFor(() => {
        expect(screen.getByTestId('search-bar')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'test search' } });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/search');
      });
    });

    it('handleSearch dispatches all 4 resource reset actions', async () => {
      const authContext = createMockAuthContext(mockUserWithAppConfig);
      renderHome(authContext);

      await waitFor(() => {
        expect(screen.getByTestId('search-bar')).toBeInTheDocument();
      });

      mockDispatch.mockClear();

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'test search' } });

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledTimes(4);
      });
    });

    it('SearchBar receives correct props', async () => {
      const authContext = createMockAuthContext(mockUserWithAppConfig);
      renderHome(authContext);

      await waitFor(() => {
        expect(screen.getByTestId('search-variant')).toHaveTextContent('default');
        const searchData = screen.getByTestId('search-data');
        expect(searchData).toHaveTextContent('BigQuery');
        expect(searchData).toHaveTextContent('Data Warehouse');
        expect(searchData).toHaveTextContent('Data Lake');
        expect(searchData).toHaveTextContent('Data Pipeline');
        expect(searchData).toHaveTextContent('GCS');
      });
    });
  });

  describe('Rendering', () => {
    it('renders correct heading text', async () => {
      const authContext = createMockAuthContext(mockUserWithAppConfig);
      renderHome(authContext);

      await waitFor(() => {
        expect(screen.getByText('What would you like to discover?')).toBeInTheDocument();
      });
    });

    it('renders SearchBar with correct variant', async () => {
      const authContext = createMockAuthContext(mockUserWithAppConfig);
      renderHome(authContext);

      await waitFor(() => {
        expect(screen.getByTestId('search-variant')).toHaveTextContent('default');
      });
    });

    it('renders SearchBar with correct dataSearch array', async () => {
      const authContext = createMockAuthContext(mockUserWithAppConfig);
      renderHome(authContext);

      await waitFor(() => {
        const searchData = screen.getByTestId('search-data');
        expect(searchData.textContent).toContain('BigQuery');
        expect(searchData.textContent).toContain('Data Warehouse');
        expect(searchData.textContent).toContain('Data Lake');
        expect(searchData.textContent).toContain('Data Pipeline');
        expect(searchData.textContent).toContain('GCS');
      });
    });

    it('applies correct CSS classes', async () => {
      const authContext = createMockAuthContext(mockUserWithAppConfig);
      renderHome(authContext);

      await waitFor(() => {
        const homeElement = document.querySelector('.home');
        const homeBodyElement = document.querySelector('.home-body');
        const homeBannerElement = document.querySelector('.home-banner');
        const homeSearchContainer = document.querySelector('.home-search-container');

        expect(homeElement).toBeInTheDocument();
        expect(homeBodyElement).toBeInTheDocument();
        expect(homeBannerElement).toBeInTheDocument();
        expect(homeSearchContainer).toBeInTheDocument();
      });
    });
  });

  describe('Error handling', () => {
    it('handles axios error with proper error message', async () => {
      const authContext = createMockAuthContext(mockUserWithoutAppConfig);
      vi.mocked(axios.get).mockRejectedValue(new Error('Network error'));

      renderHome(authContext);

      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith(
          'Access token expired or you do not have enough permissions',
          2000
        );
      });
    });

    it('calls logout when API call fails', async () => {
      const authContext = createMockAuthContext(mockUserWithoutAppConfig);
      vi.mocked(axios.get).mockRejectedValue(new Error('API error'));

      renderHome(authContext);

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
      });
    });

  });

  describe('Edge cases', () => {
    it('handles user with empty token', async () => {
      const userWithoutToken = {
        ...mockUserWithAppConfig,
        token: ''
      };
      const authContext = createMockAuthContext(userWithoutToken);

      renderHome(authContext);

      await waitFor(() => {
        expect(screen.getByText('What would you like to discover?')).toBeInTheDocument();
      });
    });

    it('handles user with partial appConfig', async () => {
      const userWithPartialConfig = {
        ...mockUserWithAppConfig,
        appConfig: {
          aspects: []
        } as any
      };
      const authContext = createMockAuthContext(userWithPartialConfig);

      renderHome(authContext);

      await waitFor(() => {
        expect(screen.getByText('What would you like to discover?')).toBeInTheDocument();
      });
    });

    it('handles multiple search submissions without duplicate API calls', async () => {
      const authContext = createMockAuthContext(mockUserWithAppConfig);
      renderHome(authContext);

      await waitFor(() => {
        expect(screen.getByTestId('search-bar')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('search-input');

      fireEvent.change(searchInput, { target: { value: 'search 1' } });
      fireEvent.change(searchInput, { target: { value: 'search 2' } });
      fireEvent.change(searchInput, { target: { value: 'search 3' } });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledTimes(3);
      });

      // Should not make additional app config calls
      expect(axios.get).not.toHaveBeenCalled();
    });
  });
});
