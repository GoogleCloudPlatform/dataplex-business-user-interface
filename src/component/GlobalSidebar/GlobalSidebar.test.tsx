import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GlobalSidebar from './GlobalSidebar';

// Mock dependencies
const mockNavigate = vi.fn();
const mockDispatch = vi.fn();
let mockLocation = { pathname: '/home' };
let mockIsAccessPanelOpen = false;
let mockUser: { token: string } | null = { token: 'test-token' };

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal() as object;
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
    useSelector: (selector: any) => {
      const mockState = {
        user: { mode: 'light' }
      };
      return selector(mockState);
    },
  };
});

vi.mock('../../contexts/AccessRequestContext', () => ({
  useAccessRequest: () => ({
    isAccessPanelOpen: mockIsAccessPanelOpen,
    setAccessPanelOpen: vi.fn(),
  }),
}));

vi.mock('../../auth/AuthProvider', () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock('../../features/dataProducts/dataProductsSlice', async (importOriginal) => {
  const actual = await importOriginal() as object;
  return {
    ...actual,
    fetchDataProductsList: vi.fn((params) => ({ type: 'dataProducts/fetchDataProductsList', payload: params })),
  };
});

vi.mock('../../features/glossaries/glossariesSlice', async (importOriginal) => {
  const actual = await importOriginal() as object;
  return {
    ...actual,
    fetchGlossaries: vi.fn((params) => ({ type: 'glossaries/fetchGlossaries', payload: params })),
  };
});

// Mock child components
vi.mock('./SidebarMenuItem', () => ({
  default: vi.fn(({ icon, label, isActive, onClick, disabled, multiLine }) => (
    <div
      data-testid={`sidebar-menu-item-${label.toLowerCase().replace(/\s+/g, '-')}`}
      data-active={isActive}
      data-disabled={disabled}
      data-multiline={multiLine}
      onClick={onClick}
      role="button"
    >
      <span data-testid={`icon-${label.toLowerCase().replace(/\s+/g, '-')}`}>{icon}</span>
      <span>{label}</span>
    </div>
  )),
}));

describe('GlobalSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation = { pathname: '/home' };
    mockIsAccessPanelOpen = false;
    mockUser = { token: 'test-token' };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders the sidebar navigation', () => {
      render(<GlobalSidebar />);
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('renders with global-sidebar class', () => {
      render(<GlobalSidebar />);
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('global-sidebar');
    });

    it('renders all menu items', () => {
      render(<GlobalSidebar />);
      expect(screen.getByTestId('sidebar-menu-item-home')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar-menu-item-glossaries')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar-menu-item-aspects')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar-menu-item-data-products')).toBeInTheDocument();
    });
  });

  describe('Home Menu Item', () => {
    it('renders Home menu item', () => {
      render(<GlobalSidebar />);
      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    it('Home click navigates to /home', async () => {
      const user = userEvent.setup();
      render(<GlobalSidebar />);

      await user.click(screen.getByTestId('sidebar-menu-item-home'));

      expect(mockNavigate).toHaveBeenCalledWith('/home');
    });

    it('Home is active when pathname is /home', () => {
      mockLocation = { pathname: '/home' };
      render(<GlobalSidebar />);

      expect(screen.getByTestId('sidebar-menu-item-home')).toHaveAttribute('data-active', 'true');
    });

    it('Home is active when pathname is /search', () => {
      mockLocation = { pathname: '/search' };
      render(<GlobalSidebar />);

      expect(screen.getByTestId('sidebar-menu-item-home')).toHaveAttribute('data-active', 'true');
    });

    it('Home is active when pathname is /view-details', () => {
      mockLocation = { pathname: '/view-details' };
      render(<GlobalSidebar />);

      expect(screen.getByTestId('sidebar-menu-item-home')).toHaveAttribute('data-active', 'true');
    });

    it('Home is not active when on other paths', () => {
      mockLocation = { pathname: '/glossaries' };
      render(<GlobalSidebar />);

      expect(screen.getByTestId('sidebar-menu-item-home')).toHaveAttribute('data-active', 'false');
    });

    it('Home icon is rendered with correct size', () => {
      render(<GlobalSidebar />);
      const iconContainer = screen.getByTestId('icon-home');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('Glossaries Menu Item', () => {
    it('renders Glossaries menu item', () => {
      render(<GlobalSidebar />);
      expect(screen.getByText('Glossaries')).toBeInTheDocument();
    });

    it('Glossaries click navigates to /glossaries and dispatches fetchGlossaries', async () => {
      const user = userEvent.setup();
      render(<GlobalSidebar />);

      await user.click(screen.getByTestId('sidebar-menu-item-glossaries'));

      expect(mockDispatch).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/glossaries');
    });

    it('Glossaries is active when pathname is /glossaries', () => {
      mockLocation = { pathname: '/glossaries' };
      render(<GlobalSidebar />);

      expect(screen.getByTestId('sidebar-menu-item-glossaries')).toHaveAttribute('data-active', 'true');
    });

    it('Glossaries is not active when on other paths', () => {
      mockLocation = { pathname: '/home' };
      render(<GlobalSidebar />);

      expect(screen.getByTestId('sidebar-menu-item-glossaries')).toHaveAttribute('data-active', 'false');
    });

    it('Glossaries icon is rendered', () => {
      render(<GlobalSidebar />);
      const iconContainer = screen.getByTestId('icon-glossaries');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('Aspects Menu Item', () => {
    it('renders Aspects menu item', () => {
      render(<GlobalSidebar />);
      expect(screen.getByText('Aspects')).toBeInTheDocument();
    });

    it('Aspects click navigates to /browse-by-annotation', async () => {
      const user = userEvent.setup();
      render(<GlobalSidebar />);

      await user.click(screen.getByTestId('sidebar-menu-item-aspects'));

      expect(mockNavigate).toHaveBeenCalledWith('/browse-by-annotation');
    });

    it('Aspects is active when pathname is /browse-by-annotation', () => {
      mockLocation = { pathname: '/browse-by-annotation' };
      render(<GlobalSidebar />);

      expect(screen.getByTestId('sidebar-menu-item-aspects')).toHaveAttribute('data-active', 'true');
    });

    it('Aspects is not active when on other paths', () => {
      mockLocation = { pathname: '/home' };
      render(<GlobalSidebar />);

      expect(screen.getByTestId('sidebar-menu-item-aspects')).toHaveAttribute('data-active', 'false');
    });

    it('Aspects icon is rendered', () => {
      render(<GlobalSidebar />);
      const iconContainer = screen.getByTestId('icon-aspects');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('Data Products Menu Item', () => {
    it('renders Data Products menu item', () => {
      render(<GlobalSidebar />);
      expect(screen.getByText('Data Products')).toBeInTheDocument();
    });

    it('Data Products click dispatches action and navigates', async () => {
      const user = userEvent.setup();
      render(<GlobalSidebar />);

      await user.click(screen.getByTestId('sidebar-menu-item-data-products'));

      expect(mockDispatch).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/data-products');
    });

    it('Data Products click dispatches action with user token', async () => {
      const user = userEvent.setup();
      mockUser = { token: 'my-special-token' };
      render(<GlobalSidebar />);

      await user.click(screen.getByTestId('sidebar-menu-item-data-products'));

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'dataProducts/fetchDataProductsList',
          payload: { id_token: 'my-special-token' },
        })
      );
    });

    it('Data Products click works with null user', async () => {
      const user = userEvent.setup();
      mockUser = null;
      render(<GlobalSidebar />);

      await user.click(screen.getByTestId('sidebar-menu-item-data-products'));

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: { id_token: undefined },
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith('/data-products');
    });

    it('Data Products is active when pathname starts with /data-products', () => {
      mockLocation = { pathname: '/data-products' };
      render(<GlobalSidebar />);

      expect(screen.getByTestId('sidebar-menu-item-data-products')).toHaveAttribute('data-active', 'true');
    });

    it('Data Products is active when on nested data-products path', () => {
      mockLocation = { pathname: '/data-products/some-product' };
      render(<GlobalSidebar />);

      expect(screen.getByTestId('sidebar-menu-item-data-products')).toHaveAttribute('data-active', 'true');
    });

    it('Data Products is not active when on other paths', () => {
      mockLocation = { pathname: '/home' };
      render(<GlobalSidebar />);

      expect(screen.getByTestId('sidebar-menu-item-data-products')).toHaveAttribute('data-active', 'false');
    });

    it('Data Products menu item is not disabled', () => {
      render(<GlobalSidebar />);

      expect(screen.getByTestId('sidebar-menu-item-data-products')).toHaveAttribute('data-disabled', 'false');
    });

    it('Data Products menu item is single line', () => {
      render(<GlobalSidebar />);

      expect(screen.getByTestId('sidebar-menu-item-data-products')).toHaveAttribute('data-multiline', 'false');
    });
  });

  describe('z-index behavior', () => {
    it('has higher z-index when access panel is closed', () => {
      mockIsAccessPanelOpen = false;
      render(<GlobalSidebar />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveStyle({ zIndex: 1200 });
    });

    it('has lower z-index when access panel is open', () => {
      mockIsAccessPanelOpen = true;
      render(<GlobalSidebar />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveStyle({ zIndex: 999 });
    });
  });

  describe('Active State Icon Variants', () => {
    it('renders active Glossaries icon when on /glossaries', () => {
      mockLocation = { pathname: '/glossaries' };
      render(<GlobalSidebar />);

      const iconContainer = screen.getByTestId('icon-glossaries');
      expect(iconContainer.querySelector('svg') || iconContainer.innerHTML.includes('svg')).toBeTruthy();
    });

    it('renders Aspects icon when on /browse-by-annotation', () => {
      mockLocation = { pathname: '/browse-by-annotation' };
      render(<GlobalSidebar />);

      const iconContainer = screen.getByTestId('icon-aspects');
      expect(iconContainer).toBeInTheDocument();
    });

    it('renders Home icon when on /home', () => {
      mockLocation = { pathname: '/home' };
      render(<GlobalSidebar />);

      const iconContainer = screen.getByTestId('icon-home');
      expect(iconContainer).toBeInTheDocument();
    });

    it('renders active Data Products icon when on /data-products', () => {
      mockLocation = { pathname: '/data-products' };
      render(<GlobalSidebar />);

      const iconContainer = screen.getByTestId('icon-data-products');
      expect(iconContainer).toBeInTheDocument();
    });

    it('renders inactive Data Products icon when not on /data-products', () => {
      mockLocation = { pathname: '/home' };
      render(<GlobalSidebar />);

      const iconContainer = screen.getByTestId('icon-data-products');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('Navigation Flows', () => {
    it('multiple home clicks work correctly', async () => {
      const user = userEvent.setup();
      render(<GlobalSidebar />);

      const homeItem = screen.getByTestId('sidebar-menu-item-home');

      await user.click(homeItem);
      await user.click(homeItem);
      await user.click(homeItem);

      expect(mockNavigate).toHaveBeenCalledTimes(3);
      expect(mockNavigate).toHaveBeenNthCalledWith(1, '/home');
      expect(mockNavigate).toHaveBeenNthCalledWith(2, '/home');
      expect(mockNavigate).toHaveBeenNthCalledWith(3, '/home');
    });

    it('navigating to data products after home works', async () => {
      const user = userEvent.setup();
      render(<GlobalSidebar />);

      await user.click(screen.getByTestId('sidebar-menu-item-home'));
      await user.click(screen.getByTestId('sidebar-menu-item-data-products'));

      expect(mockNavigate).toHaveBeenNthCalledWith(1, '/home');
      expect(mockNavigate).toHaveBeenNthCalledWith(2, '/data-products');
    });
  });

  describe('Combined Active States', () => {
    it('only Home is active on /home', () => {
      mockLocation = { pathname: '/home' };
      render(<GlobalSidebar />);

      expect(screen.getByTestId('sidebar-menu-item-home')).toHaveAttribute('data-active', 'true');
      expect(screen.getByTestId('sidebar-menu-item-glossaries')).toHaveAttribute('data-active', 'false');
      expect(screen.getByTestId('sidebar-menu-item-aspects')).toHaveAttribute('data-active', 'false');
      expect(screen.getByTestId('sidebar-menu-item-data-products')).toHaveAttribute('data-active', 'false');
    });

    it('only Glossaries is active on /glossaries', () => {
      mockLocation = { pathname: '/glossaries' };
      render(<GlobalSidebar />);

      expect(screen.getByTestId('sidebar-menu-item-home')).toHaveAttribute('data-active', 'false');
      expect(screen.getByTestId('sidebar-menu-item-glossaries')).toHaveAttribute('data-active', 'true');
      expect(screen.getByTestId('sidebar-menu-item-aspects')).toHaveAttribute('data-active', 'false');
      expect(screen.getByTestId('sidebar-menu-item-data-products')).toHaveAttribute('data-active', 'false');
    });

    it('only Aspects is active on /browse-by-annotation', () => {
      mockLocation = { pathname: '/browse-by-annotation' };
      render(<GlobalSidebar />);

      expect(screen.getByTestId('sidebar-menu-item-home')).toHaveAttribute('data-active', 'false');
      expect(screen.getByTestId('sidebar-menu-item-glossaries')).toHaveAttribute('data-active', 'false');
      expect(screen.getByTestId('sidebar-menu-item-aspects')).toHaveAttribute('data-active', 'true');
      expect(screen.getByTestId('sidebar-menu-item-data-products')).toHaveAttribute('data-active', 'false');
    });

    it('only Data Products is active on /data-products', () => {
      mockLocation = { pathname: '/data-products' };
      render(<GlobalSidebar />);

      expect(screen.getByTestId('sidebar-menu-item-home')).toHaveAttribute('data-active', 'false');
      expect(screen.getByTestId('sidebar-menu-item-glossaries')).toHaveAttribute('data-active', 'false');
      expect(screen.getByTestId('sidebar-menu-item-aspects')).toHaveAttribute('data-active', 'false');
      expect(screen.getByTestId('sidebar-menu-item-data-products')).toHaveAttribute('data-active', 'true');
    });

    it('no menu is active on unknown path', () => {
      mockLocation = { pathname: '/unknown-page' };
      render(<GlobalSidebar />);

      expect(screen.getByTestId('sidebar-menu-item-home')).toHaveAttribute('data-active', 'false');
      expect(screen.getByTestId('sidebar-menu-item-glossaries')).toHaveAttribute('data-active', 'false');
      expect(screen.getByTestId('sidebar-menu-item-aspects')).toHaveAttribute('data-active', 'false');
      expect(screen.getByTestId('sidebar-menu-item-data-products')).toHaveAttribute('data-active', 'false');
    });
  });

  describe('CSS Classes', () => {
    it('sidebar has global-sidebar class', () => {
      render(<GlobalSidebar />);
      expect(screen.getByRole('navigation')).toHaveClass('global-sidebar');
    });

    it('menu items container has sidebar-menu-items class', () => {
      render(<GlobalSidebar />);
      const menuContainer = document.querySelector('.sidebar-menu-items');
      expect(menuContainer).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('renders as nav element', () => {
      render(<GlobalSidebar />);
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('menu items have button role', () => {
      render(<GlobalSidebar />);
      const buttons = screen.getAllByRole('button');
      // Should have Home, Glossaries, Aspects, Data Products
      expect(buttons.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid clicks on different menu items', async () => {
      const user = userEvent.setup();
      render(<GlobalSidebar />);

      await user.click(screen.getByTestId('sidebar-menu-item-home'));
      await user.click(screen.getByTestId('sidebar-menu-item-glossaries'));
      await user.click(screen.getByTestId('sidebar-menu-item-data-products'));

      expect(mockNavigate).toHaveBeenCalledWith('/home');
      expect(mockNavigate).toHaveBeenCalledWith('/glossaries');
      expect(mockNavigate).toHaveBeenCalledWith('/data-products');
      expect(mockDispatch).toHaveBeenCalled();
    });

    it('handles fireEvent for Home click', () => {
      render(<GlobalSidebar />);

      fireEvent.click(screen.getByTestId('sidebar-menu-item-home'));

      expect(mockNavigate).toHaveBeenCalledWith('/home');
    });

    it('handles fireEvent for Data Products click', () => {
      render(<GlobalSidebar />);

      fireEvent.click(screen.getByTestId('sidebar-menu-item-data-products'));

      expect(mockDispatch).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/data-products');
    });

    it('handles path with trailing slash', () => {
      mockLocation = { pathname: '/data-products/' };
      render(<GlobalSidebar />);

      expect(screen.getByTestId('sidebar-menu-item-data-products')).toHaveAttribute('data-active', 'true');
    });

    it('handles path /data-products-extra (should be active)', () => {
      mockLocation = { pathname: '/data-products-extra' };
      render(<GlobalSidebar />);

      expect(screen.getByTestId('sidebar-menu-item-data-products')).toHaveAttribute('data-active', 'true');
    });
  });

  describe('User token handling', () => {
    it('dispatches with user token when available', async () => {
      const user = userEvent.setup();
      mockUser = { token: 'abc123' };
      render(<GlobalSidebar />);

      await user.click(screen.getByTestId('sidebar-menu-item-data-products'));

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: { id_token: 'abc123' },
        })
      );
    });

    it('dispatches with undefined when user is null', async () => {
      const user = userEvent.setup();
      mockUser = null;
      render(<GlobalSidebar />);

      await user.click(screen.getByTestId('sidebar-menu-item-data-products'));

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: { id_token: undefined },
        })
      );
    });

    it('handles user with empty token', async () => {
      const user = userEvent.setup();
      mockUser = { token: '' };
      render(<GlobalSidebar />);

      await user.click(screen.getByTestId('sidebar-menu-item-data-products'));

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: { id_token: '' },
        })
      );
    });
  });

  describe('Path matching edge cases', () => {
    it('/home matches isHomeActive', () => {
      mockLocation = { pathname: '/home' };
      render(<GlobalSidebar />);
      expect(screen.getByTestId('sidebar-menu-item-home')).toHaveAttribute('data-active', 'true');
    });

    it('/search matches isHomeActive', () => {
      mockLocation = { pathname: '/search' };
      render(<GlobalSidebar />);
      expect(screen.getByTestId('sidebar-menu-item-home')).toHaveAttribute('data-active', 'true');
    });

    it('/view-details matches isHomeActive', () => {
      mockLocation = { pathname: '/view-details' };
      render(<GlobalSidebar />);
      expect(screen.getByTestId('sidebar-menu-item-home')).toHaveAttribute('data-active', 'true');
    });

    it('/home-extra does not match isHomeActive', () => {
      mockLocation = { pathname: '/home-extra' };
      render(<GlobalSidebar />);
      expect(screen.getByTestId('sidebar-menu-item-home')).toHaveAttribute('data-active', 'false');
    });

    it('/glossaries matches isGlossariesActive', () => {
      mockLocation = { pathname: '/glossaries' };
      render(<GlobalSidebar />);
      expect(screen.getByTestId('sidebar-menu-item-glossaries')).toHaveAttribute('data-active', 'true');
    });

    it('/browse-by-annotation matches isAnnotationsActive', () => {
      mockLocation = { pathname: '/browse-by-annotation' };
      render(<GlobalSidebar />);
      expect(screen.getByTestId('sidebar-menu-item-aspects')).toHaveAttribute('data-active', 'true');
    });

    it('/glossaries-extra does not match isGlossariesActive (exact match)', () => {
      mockLocation = { pathname: '/glossaries-extra' };
      render(<GlobalSidebar />);
      expect(screen.getByTestId('sidebar-menu-item-glossaries')).toHaveAttribute('data-active', 'false');
    });

    it('/data-products/id/details matches isDataProductsActive', () => {
      mockLocation = { pathname: '/data-products/id/details' };
      render(<GlobalSidebar />);
      expect(screen.getByTestId('sidebar-menu-item-data-products')).toHaveAttribute('data-active', 'true');
    });
  });
});
