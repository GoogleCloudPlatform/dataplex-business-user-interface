import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from './Navbar';
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
    useLocation: () => ({ pathname: '/home' })
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

// Mock the search resources action
vi.mock('../../features/resources/resourcesSlice', async (importOriginal) => {
  const actual = await importOriginal() || {};
  return {
    ...actual,
    searchResourcesByTerm: vi.fn(() => ({ type: 'searchResourcesByTerm' }))
  };
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
    
    expect(screen.getAllByText('Dataplex')).toHaveLength(2); // Desktop and mobile logos
    expect(screen.getByText('Business Interface')).toBeInTheDocument();
    expect(screen.getAllByAltText('CS Studio Logo')).toHaveLength(2); // Desktop and mobile logos
    expect(screen.getByAltText('Test User')).toBeInTheDocument();
  });

  it('renders navigation icons', () => {
    renderNavbar();
    
    expect(screen.getByLabelText('Admin Panel')).toBeInTheDocument();
    expect(screen.getByLabelText('Guide')).toBeInTheDocument();
    expect(screen.getByLabelText('Help')).toBeInTheDocument();
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
    
    const logos = screen.getAllByText('Dataplex');
    fireEvent.click(logos[0]); // Click the first logo (desktop version)
    
    expect(mockNavigate).toHaveBeenCalledWith('/home');
  });

  it('navigates to admin panel when admin icon is clicked', () => {
    renderNavbar();
    
    const adminButton = screen.getByLabelText('Admin Panel');
    fireEvent.click(adminButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/admin-panel');
  });

  it('navigates to guide when guide icon is clicked', () => {
    renderNavbar();
    
    const guideButton = screen.getByLabelText('Guide');
    fireEvent.click(guideButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/guide');
  });

  it('navigates to help when help icon is clicked', () => {
    renderNavbar();
    
    const helpButton = screen.getByLabelText('Help');
    fireEvent.click(helpButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/help');
  });

  it('opens user menu when avatar is clicked', () => {
    renderNavbar();
    
    const avatar = screen.getByAltText('Test User');
    fireEvent.click(avatar);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('SignOut')).toBeInTheDocument();
  });

  it('navigates to home when Home menu item is clicked', () => {
    renderNavbar();
    
    const avatar = screen.getByAltText('Test User');
    fireEvent.click(avatar);
    
    const homeMenuItem = screen.getByText('Home');
    fireEvent.click(homeMenuItem);
    
    expect(mockNavigate).toHaveBeenCalledWith('/home');
  });

  it('calls logout when SignOut is clicked', () => {
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
    
    const signOutMenuItem = screen.getByText('SignOut');
    fireEvent.click(signOutMenuItem);
    
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
    
    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    expect(screen.getByText('Guide')).toBeInTheDocument();
    expect(screen.getByText('Help')).toBeInTheDocument();
  });

  it('navigates to admin panel from mobile menu', () => {
    renderNavbar();
    
    const menuButton = screen.getByLabelText('account of current user');
    fireEvent.click(menuButton);
    
    const adminMenuItem = screen.getByText('Admin Panel');
    fireEvent.click(adminMenuItem);
    
    expect(mockNavigate).toHaveBeenCalledWith('/admin-panel');
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
    expect(screen.getByLabelText('Admin Panel')).toBeInTheDocument();
    expect(screen.getByLabelText('Guide')).toBeInTheDocument();
    expect(screen.getByLabelText('Help')).toBeInTheDocument();
  });

  it('has proper alt text for images', () => {
    renderNavbar();
    
    expect(screen.getAllByAltText('CS Studio Logo')).toHaveLength(2); // Desktop and mobile logos
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
    expect(screen.getAllByText('Dataplex')).toHaveLength(2); // Desktop and mobile logos
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
});
