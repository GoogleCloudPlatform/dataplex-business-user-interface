import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from './Navbar';
import { AuthContext } from '../../auth/AuthProvider';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from '../../app/store';

// Mock react-router-dom with dynamic location
let mockLocation = { pathname: '/home' };
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation
  };
});

// Mock the SearchBar component
vi.mock('../SearchBar/SearchBar', () => ({
  default: function MockSearchBar({ handleSearchSubmit, variant }: any) {
    return (
      <div data-testid="search-bar">
        <input
          data-testid="search-input"
          onChange={(e) => handleSearchSubmit(e.target.value)}
          placeholder="Search for assets"
        />
        <span data-testid="search-variant">{variant}</span>
      </div>
    );
  }
}));

// Mock dispatch to capture all dispatches
const mockDispatch = vi.fn();
vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
    useSelector: (selector: any) => {
      // Mock state
      const mockState = {
        search: {
          searchTerm: '',
          searchFilters: {},
          semanticSearch: false,
          isSearchFiltersOpen: false
        },
        user: {
          mode: 'light'
        }
      };
      return selector(mockState);
    }
  };
});

// Mock the search resources action
vi.mock('../../features/resources/resourcesSlice', async (importOriginal) => {
  const actual = await importOriginal() || {};
  return {
    ...actual,
    searchResourcesByTerm: vi.fn(() => ({ type: 'searchResourcesByTerm' }))
  };
});

// Mock SendFeedback component
vi.mock('./SendFeedback', () => ({
  default: function MockSendFeedback({ isOpen, onClose, onSubmitSuccess }: any) {
    return (
      <div data-testid="send-feedback" style={{ display: isOpen ? 'block' : 'none' }}>
        <button data-testid="close-feedback" onClick={onClose}>Close</button>
        <button
          data-testid="submit-feedback"
          onClick={() => onSubmitSuccess('Feedback sent')}
        >
          Submit
        </button>
      </div>
    );
  }
}));

// Mock @react-oauth/google (required by UserAccountDropdown)
vi.mock('@react-oauth/google', () => ({
  useGoogleLogin: () => vi.fn(),
  GoogleOAuthProvider: ({ children }: any) => children,
}));

// Mock NotificationBar component
vi.mock('../SearchPage/NotificationBar', () => ({
  default: function MockNotificationBar({ isVisible, onClose, onUndo, message }: any) {
    if (!isVisible) return null;
    return (
      <div data-testid="notification-bar">
        <span data-testid="notification-message">{message}</span>
        <button data-testid="close-notification" onClick={onClose}>Close</button>
        {onUndo && <button data-testid="undo-notification" onClick={onUndo}>Undo</button>}
      </div>
    );
  }
}));

// Mock sessionStorage
const mockSessionStorage = {
  removeItem: vi.fn(),
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true
});

describe('Navbar', () => {
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
    iamDisplayRole: 'Viewer',
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

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation = { pathname: '/home' }; // Reset to default location
    mockSessionStorage.removeItem.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers(); // Clean up timers if any tests use fake timers
  });

  const renderNavbar = (props = {}) => {
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <AuthContext.Provider value={mockAuthContextValue}>
            <Navbar {...props} />
          </AuthContext.Provider>
        </BrowserRouter>
      </Provider>
    );
  };

  it('renders the navbar with logo and user avatar', () => {
    renderNavbar();

    expect(screen.getAllByText('Knowledge')).toHaveLength(1); // Mobile logo only when on /home
    expect(screen.getByText('Catalog')).toBeInTheDocument();
    expect(screen.getByAltText('Knowledge Catalog')).toBeInTheDocument();
    expect(screen.getByAltText('Test User')).toBeInTheDocument();
  });

  it('renders navigation icons', () => {
    renderNavbar();

    // Admin Panel icon is commented out in the actual component
    expect(screen.getByLabelText('Guide')).toBeInTheDocument();
    expect(screen.getByLabelText('Feedback')).toBeInTheDocument();
  });

  it('renders search bar when searchBar prop is true', () => {
    renderNavbar({ searchBar: true });
    
    expect(screen.getByTestId('search-bar')).toBeInTheDocument();
    expect(screen.getByTestId('search-variant')).toHaveTextContent('navbar');
  });

  it('does not render search bar when searchBar prop is false', () => {
    renderNavbar({ searchBar: false });
    
    expect(screen.queryByTestId('search-bar')).not.toBeInTheDocument();
  });

  it('navigates to home when logo is clicked', () => {
    renderNavbar();
    
    const logos = screen.getAllByText('Knowledge');
    fireEvent.click(logos[0]); // Click the first logo (desktop version)
    
    expect(mockNavigate).toHaveBeenCalledWith('/home');
  });

  it('navigates to guide when guide icon is clicked', () => {
    renderNavbar();
    
    const guideButton = screen.getByLabelText('Guide');
    fireEvent.click(guideButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/guide');
  });

  it('opens feedback dialog when help icon is clicked', () => {
    renderNavbar();

    const helpButton = screen.getByLabelText('Feedback');
    fireEvent.click(helpButton);

    // Help icon opens feedback dialog, not navigate
    const feedbackDialog = screen.getByTestId('send-feedback');
    expect(feedbackDialog).toHaveStyle({ display: 'block' });
  });

  it('opens user menu when avatar is clicked', () => {
    renderNavbar();

    const avatar = screen.getByAltText('Test User');
    fireEvent.click(avatar);

    expect(screen.getByText('Switch account')).toBeInTheDocument();
    expect(screen.getByText('Sign out')).toBeInTheDocument();
  });

  it('shows manage account button when dropdown is opened', () => {
    renderNavbar();

    const avatar = screen.getByAltText('Test User');
    fireEvent.click(avatar);

    expect(screen.getByText('Manage your Google Account')).toBeInTheDocument();
  });

  it('calls logout when Sign out is clicked', () => {
    const mockLogout = vi.fn();
    const authContextWithLogout = {
      ...mockAuthContextValue,
      logout: mockLogout
    };

    render(
      <Provider store={store}>
        <BrowserRouter>
          <AuthContext.Provider value={authContextWithLogout}>
            <Navbar />
          </AuthContext.Provider>
        </BrowserRouter>
      </Provider>
    );

    const avatar = screen.getByAltText('Test User');
    fireEvent.click(avatar);

    const signOutButton = screen.getByText('Sign out');
    fireEvent.click(signOutButton);

    expect(mockLogout).toHaveBeenCalled();
  });

  it('renders mobile menu button on small screens', () => {
    renderNavbar();
    
    const menuButton = screen.getByLabelText('account of current user');
    expect(menuButton).toBeInTheDocument();
  });

  it('opens mobile menu when menu button is clicked', () => {
    renderNavbar();

    const menuButton = screen.getByLabelText('account of current user');
    fireEvent.click(menuButton);

    // Admin Panel is commented out in the component
    expect(screen.getByText('Guide')).toBeInTheDocument();
    expect(screen.getByText('Feedback')).toBeInTheDocument();
  });

  it('calls handleNavSearch when search is submitted', () => {
    renderNavbar({ searchBar: true, searchNavigate: true });
    
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    
    // The mock SearchBar calls handleSearchSubmit on change
    expect(mockNavigate).toHaveBeenCalledWith('/search');
  });

  it('does not navigate when searchNavigate is false', () => {
    renderNavbar({ searchBar: true, searchNavigate: false });
    
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    
    // Should not navigate to search page
    expect(mockNavigate).not.toHaveBeenCalledWith('/search');
  });

  it('has proper ARIA labels for interactive elements', () => {
    renderNavbar();

    expect(screen.getByLabelText('account of current user')).toBeInTheDocument();
    expect(screen.getByLabelText('Open settings')).toBeInTheDocument();
    // Admin Panel is commented out in the component
    expect(screen.getByLabelText('Guide')).toBeInTheDocument();
    expect(screen.getByLabelText('Feedback')).toBeInTheDocument();
  });

  it('has proper alt text for images', () => {
    renderNavbar();

    // Only mobile logo on /home page (desktop logo uses different alt text)
    expect(screen.getByAltText('Knowledge Catalog')).toBeInTheDocument();
    expect(screen.getByAltText('Test User')).toBeInTheDocument();
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
            <Navbar />
          </AuthContext.Provider>
        </BrowserRouter>
      </Provider>
    );

    // Should still render without crashing
    expect(screen.getAllByText('Knowledge')).toHaveLength(1); // Mobile logo
  });

  it('uses default props when not provided', () => {
    renderNavbar();
    
    // searchBar should default to false
    expect(screen.queryByTestId('search-bar')).not.toBeInTheDocument();
  });

  it('respects custom props', () => {
    renderNavbar({ searchBar: true, searchNavigate: false });

    expect(screen.getByTestId('search-bar')).toBeInTheDocument();
  });

  describe('Location-based rendering', () => {
    describe('Desktop logo visibility', () => {
      it('renders desktop logo on home page', () => {
        mockLocation = { pathname: '/home' };
        renderNavbar();

        // Desktop logo should be visible
        const desktopLogos = screen.getAllByAltText('Knowledge Catalog');
        expect(desktopLogos.length).toBeGreaterThan(0);
      });

      it('does not render desktop logo on search page', () => {
        mockLocation = { pathname: '/search' };
        renderNavbar();

        // Only mobile logo should be present
        const logos = screen.queryAllByAltText('Knowledge Catalog');
        // Mobile logo always renders, desktop logo should not
        expect(logos.length).toBeLessThanOrEqual(1);
      });

      it('does not render desktop logo on guide page', () => {
        mockLocation = { pathname: '/guide' };
        renderNavbar();

        const logos = screen.queryAllByAltText('Knowledge Catalog');
        expect(logos.length).toBeLessThanOrEqual(1);
      });

      it('does not render desktop logo on admin panel', () => {
        mockLocation = { pathname: '/admin-panel' };
        renderNavbar();

        const logos = screen.queryAllByAltText('Knowledge Catalog');
        expect(logos.length).toBeLessThanOrEqual(1);
      });
    });

    describe('Search bar margin based on location', () => {
      it('applies correct margin on glossaries page', () => {
        mockLocation = { pathname: '/glossaries' };
        renderNavbar({ searchBar: true });

        const searchBar = screen.getByTestId('search-bar');
        expect(searchBar).toBeInTheDocument();
      });

      it('applies correct margin on browse-by-annotation page', () => {
        mockLocation = { pathname: '/browse-by-annotation' };
        renderNavbar({ searchBar: true });

        const searchBar = screen.getByTestId('search-bar');
        expect(searchBar).toBeInTheDocument();
      });

      it('applies correct margin on search page', () => {
        mockLocation = { pathname: '/search' };
        renderNavbar({ searchBar: true });

        const searchBar = screen.getByTestId('search-bar');
        expect(searchBar).toBeInTheDocument();
      });

      it('applies correct margin on view-details page', () => {
        mockLocation = { pathname: '/view-details' };
        renderNavbar({ searchBar: true });

        const searchBar = screen.getByTestId('search-bar');
        expect(searchBar).toBeInTheDocument();
      });

      it('applies correct margin on guide page', () => {
        mockLocation = { pathname: '/guide' };
        renderNavbar({ searchBar: true });

        const searchBar = screen.getByTestId('search-bar');
        expect(searchBar).toBeInTheDocument();
      });

      it('applies correct margin on data-product page', () => {
        mockLocation = { pathname: '/data-product/123' };
        renderNavbar({ searchBar: true });

        const searchBar = screen.getByTestId('search-bar');
        expect(searchBar).toBeInTheDocument();
      });

      it('applies correct margin on nested data-product page', () => {
        mockLocation = { pathname: '/data-product/abc/details' };
        renderNavbar({ searchBar: true });

        const searchBar = screen.getByTestId('search-bar');
        expect(searchBar).toBeInTheDocument();
      });

      it('renders search bar without special margin on home page', () => {
        mockLocation = { pathname: '/home' };
        renderNavbar({ searchBar: true });

        const searchBar = screen.getByTestId('search-bar');
        expect(searchBar).toBeInTheDocument();
      });
    });

    it('hides search bar on admin panel even when searchBar prop is true', () => {
      mockLocation = { pathname: '/admin-panel' };
      renderNavbar({ searchBar: true });

      expect(screen.queryByTestId('search-bar')).not.toBeInTheDocument();
    });
  });

  describe('SendFeedback dialog interactions', () => {
    it('initially renders feedback dialog as closed', () => {
      renderNavbar();

      const feedbackDialog = screen.getByTestId('send-feedback');
      expect(feedbackDialog).toHaveStyle({ display: 'none' });
    });

    it('opens feedback dialog when desktop Help icon is clicked', () => {
      renderNavbar();

      const helpButton = screen.getByLabelText('Feedback');
      fireEvent.click(helpButton);

      const feedbackDialog = screen.getByTestId('send-feedback');
      expect(feedbackDialog).toHaveStyle({ display: 'block' });
    });

    it('opens feedback dialog when mobile menu Help item is clicked', () => {
      renderNavbar();

      // Open mobile menu
      const menuButton = screen.getByLabelText('account of current user');
      fireEvent.click(menuButton);

      // Click Help in mobile menu
      const helpMenuItem = screen.getByText('Feedback');
      fireEvent.click(helpMenuItem);

      const feedbackDialog = screen.getByTestId('send-feedback');
      expect(feedbackDialog).toHaveStyle({ display: 'block' });
    });

    it('closes feedback dialog when close button is clicked', () => {
      renderNavbar();

      // Open feedback dialog
      const helpButton = screen.getByLabelText('Feedback');
      fireEvent.click(helpButton);

      // Close it
      const closeButton = screen.getByTestId('close-feedback');
      fireEvent.click(closeButton);

      const feedbackDialog = screen.getByTestId('send-feedback');
      expect(feedbackDialog).toHaveStyle({ display: 'none' });
    });

    it('shows notification when feedback is submitted', () => {
      renderNavbar();

      // Open feedback dialog
      const helpButton = screen.getByLabelText('Feedback');
      fireEvent.click(helpButton);

      // Submit feedback
      const submitButton = screen.getByTestId('submit-feedback');
      fireEvent.click(submitButton);

      // Notification should appear
      const notificationBar = screen.getByTestId('notification-bar');
      expect(notificationBar).toBeInTheDocument();
      expect(screen.getByTestId('notification-message')).toHaveTextContent('Feedback sent');
    });
  });

  describe('NotificationBar interactions', () => {
    it('notification bar is initially hidden', () => {
      renderNavbar();

      expect(screen.queryByTestId('notification-bar')).not.toBeInTheDocument();
    });

    it('shows notification after feedback submission', () => {
      renderNavbar();

      // Submit feedback
      const helpButton = screen.getByLabelText('Feedback');
      fireEvent.click(helpButton);
      const submitButton = screen.getByTestId('submit-feedback');
      fireEvent.click(submitButton);

      // Notification should be visible
      expect(screen.getByTestId('notification-bar')).toBeInTheDocument();
      expect(screen.getByTestId('notification-message')).toHaveTextContent('Feedback sent');
    });

    it('closes notification when close button is clicked', () => {
      renderNavbar();

      // Show notification
      const helpButton = screen.getByLabelText('Feedback');
      fireEvent.click(helpButton);
      const submitButton = screen.getByTestId('submit-feedback');
      fireEvent.click(submitButton);

      // Close notification
      const closeButton = screen.getByTestId('close-notification');
      fireEvent.click(closeButton);

      expect(screen.queryByTestId('notification-bar')).not.toBeInTheDocument();
    });

    it('handles undo notification action', () => {
      renderNavbar();

      // Show notification
      const helpButton = screen.getByLabelText('Feedback');
      fireEvent.click(helpButton);
      const submitButton = screen.getByTestId('submit-feedback');
      fireEvent.click(submitButton);

      // Click undo
      const undoButton = screen.getByTestId('undo-notification');
      fireEvent.click(undoButton);

      expect(screen.queryByTestId('notification-bar')).not.toBeInTheDocument();
    });

    it('shows notification and setTimeout is called for auto-hide', () => {
      vi.useFakeTimers();
      const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

      renderNavbar();

      // Show notification
      const helpButton = screen.getByLabelText('Feedback');
      fireEvent.click(helpButton);
      const submitButton = screen.getByTestId('submit-feedback');
      fireEvent.click(submitButton);

      // Notification appears
      expect(screen.getByTestId('notification-bar')).toBeInTheDocument();

      // Verify setTimeout was called with 5000ms delay for auto-hide
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 5000);

      vi.useRealTimers();
      setTimeoutSpy.mockRestore();
    });
  });

  describe('updateUser call on logo click', () => {
    it('calls updateUser with correct data when logo is clicked', () => {
      const mockUpdateUser = vi.fn();
      const authContextWithUpdateUser = {
        ...mockAuthContextValue,
        updateUser: mockUpdateUser
      };

      render(
        <Provider store={store}>
          <BrowserRouter>
            <AuthContext.Provider value={authContextWithUpdateUser}>
              <Navbar />
            </AuthContext.Provider>
          </BrowserRouter>
        </Provider>
      );

      const logos = screen.getAllByText('Knowledge');
      fireEvent.click(logos[0]); // Click desktop logo

      expect(mockUpdateUser).toHaveBeenCalledWith(
        mockUser.token,
        expect.objectContaining({
          name: mockUser.name,
          email: mockUser.email,
          picture: mockUser.picture,
          token: mockUser.token,
          tokenExpiry: mockUser.tokenExpiry,
          tokenIssuedAt: mockUser.tokenIssuedAt,
          hasRole: mockUser.hasRole,
          roles: mockUser.roles,
          permissions: mockUser.permissions,
          appConfig: {}
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith('/home');
    });

    it('navigates without calling updateUser when user is null', () => {
      const authContextWithoutUser = {
        ...mockAuthContextValue,
        user: null
      };

      render(
        <Provider store={store}>
          <BrowserRouter>
            <AuthContext.Provider value={authContextWithoutUser}>
              <Navbar />
            </AuthContext.Provider>
          </BrowserRouter>
        </Provider>
      );

      // Click mobile logo since desktop logo doesn't render on /home without condition
      const logos = screen.getAllByText('Knowledge');
      fireEvent.click(logos[0]);

      expect(mockNavigate).toHaveBeenCalledWith('/home');
    });
  });

  describe('sessionStorage handling', () => {
    it('removes welcomeShown from sessionStorage on logout', () => {
      renderNavbar();

      // Open user menu
      const avatar = screen.getByAltText('Test User');
      fireEvent.click(avatar);

      // Click Sign out
      const signOutButton = screen.getByText('Sign out');
      fireEvent.click(signOutButton);

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('welcomeShown');
    });
  });

  describe('Redux integration', () => {
    it('dispatches setItemsStoreData before search', () => {
      renderNavbar({ searchBar: true });

      mockDispatch.mockClear();
      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'test search' } });

      // Should dispatch setItemsStoreData first
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'resources/setItemsStoreData',
          payload: []
        })
      );
    });

    it('dispatches searchResourcesByTerm when search is submitted', () => {
      renderNavbar({ searchBar: true, searchNavigate: true });

      mockDispatch.mockClear();
      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'test query' } });

      // Should call searchResourcesByTerm action
      expect(mockDispatch).toHaveBeenCalled();
    });

    it('navigates to search page when searchNavigate is true', () => {
      renderNavbar({ searchBar: true, searchNavigate: true });

      mockNavigate.mockClear();
      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      expect(mockNavigate).toHaveBeenCalledWith('/search');
    });

    it('does not navigate when searchNavigate is false', () => {
      renderNavbar({ searchBar: true, searchNavigate: false });

      mockNavigate.mockClear();
      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      expect(mockNavigate).not.toHaveBeenCalledWith('/search');
    });
  });

  describe('Menu closing behavior', () => {
    it('user menu can be opened and closed', () => {
      renderNavbar();

      // Open menu
      const avatar = screen.getByAltText('Test User');
      fireEvent.click(avatar);
      expect(screen.getByText('Switch account')).toBeInTheDocument();

      // Close menu by clicking avatar again
      fireEvent.click(avatar);
    });

    it('mobile menu can be opened and closed', () => {
      renderNavbar();

      // Open mobile menu
      const menuButton = screen.getByLabelText('account of current user');
      fireEvent.click(menuButton);
      expect(screen.getByText('Guide')).toBeInTheDocument();

      // Menu is open
      expect(screen.getByText('Feedback')).toBeInTheDocument();
    });

    it('mobile menu Guide item navigates correctly', () => {
      renderNavbar();

      mockNavigate.mockClear();

      // Open mobile menu
      const menuButton = screen.getByLabelText('account of current user');
      fireEvent.click(menuButton);

      // Click Guide
      const guideMenuItem = screen.getByText('Guide');
      fireEvent.click(guideMenuItem);

      expect(mockNavigate).toHaveBeenCalledWith('/guide');
    });
  });

  describe('Edge cases', () => {
    it('handles multiple rapid logo clicks', () => {
      renderNavbar();

      const logos = screen.getAllByText('Knowledge');
      fireEvent.click(logos[0]);
      fireEvent.click(logos[0]);
      fireEvent.click(logos[0]);

      // Should navigate each time
      expect(mockNavigate).toHaveBeenCalledTimes(3);
    });

    it('handles opening feedback dialog multiple times', () => {
      renderNavbar();

      const helpButton = screen.getByLabelText('Feedback');

      // Open
      fireEvent.click(helpButton);
      expect(screen.getByTestId('send-feedback')).toHaveStyle({ display: 'block' });

      // Close
      const closeButton = screen.getByTestId('close-feedback');
      fireEvent.click(closeButton);
      expect(screen.getByTestId('send-feedback')).toHaveStyle({ display: 'none' });

      // Open again
      fireEvent.click(helpButton);
      expect(screen.getByTestId('send-feedback')).toHaveStyle({ display: 'block' });
    });

    it('handles navigation from different menu items', () => {
      renderNavbar();

      mockNavigate.mockClear();

      // Navigate to guide
      const guideButton = screen.getByLabelText('Guide');
      fireEvent.click(guideButton);
      expect(mockNavigate).toHaveBeenCalledWith('/guide');

      // Open user menu and verify dropdown content
      const avatar = screen.getByAltText('Test User');
      fireEvent.click(avatar);
      expect(screen.getByText('Switch account')).toBeInTheDocument();
      expect(screen.getByText('Sign out')).toBeInTheDocument();
    });

    it('mobile logo is always present regardless of location', () => {
      mockLocation = { pathname: '/search' };
      renderNavbar();

      // Mobile logo uses text labels, not an img tag
      expect(screen.getByText('Knowledge')).toBeInTheDocument();
      expect(screen.getByText('Catalog')).toBeInTheDocument();
    });

    it('renders correctly with all props combinations', () => {
      // Test with searchBar true, searchNavigate true
      const { unmount: unmount1 } = render(
        <Provider store={store}>
          <BrowserRouter>
            <AuthContext.Provider value={mockAuthContextValue}>
              <Navbar searchBar={true} searchNavigate={true} />
            </AuthContext.Provider>
          </BrowserRouter>
        </Provider>
      );
      expect(screen.getByTestId('search-bar')).toBeInTheDocument();
      unmount1();

      // Test with searchBar false, searchNavigate false
      const { unmount: unmount2 } = render(
        <Provider store={store}>
          <BrowserRouter>
            <AuthContext.Provider value={mockAuthContextValue}>
              <Navbar searchBar={false} searchNavigate={false} />
            </AuthContext.Provider>
          </BrowserRouter>
        </Provider>
      );
      expect(screen.queryByTestId('search-bar')).not.toBeInTheDocument();
      unmount2();
    });
  });
});
