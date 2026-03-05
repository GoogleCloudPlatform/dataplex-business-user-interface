import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, beforeEach, it, describe, expect, afterEach } from 'vitest';
import BrowsePopover from './BrowsePopover';

// Mock functions defined at module scope
const mockNavigate = vi.fn();
const mockDispatch = vi.fn();
const mockOnClose = vi.fn();

// Mock user context
let mockUser: { token: string } | null = { token: 'test-token' };

// Mock react-router-dom
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal() as object;
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock react-redux
vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
  };
});

// Mock AuthProvider
vi.mock('../../auth/AuthProvider', () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}));

// Mock fetchGlossaries action
const mockFetchGlossaries = vi.fn((data: { id_token?: string }) => ({
  type: 'glossaries/fetchGlossaries',
  payload: data,
}));
vi.mock('../../features/glossaries/glossariesSlice', () => ({
  fetchGlossaries: (data: { id_token?: string }) => mockFetchGlossaries(data),
}));

describe('BrowsePopover', () => {
  let anchorEl: HTMLElement;

  beforeEach(() => {
    vi.clearAllMocks();
    // Create anchor element for popover
    anchorEl = document.createElement('div');
    document.body.appendChild(anchorEl);
    mockUser = { token: 'test-token' };
  });

  afterEach(() => {
    if (anchorEl && anchorEl.parentNode) {
      anchorEl.parentNode.removeChild(anchorEl);
    }
  });

  const defaultProps = {
    anchorEl: null as HTMLElement | null,
    open: false,
    onClose: mockOnClose,
  };

  describe('Rendering', () => {
    it('should not render popover content when open is false', () => {
      render(<BrowsePopover {...defaultProps} open={false} anchorEl={anchorEl} />);

      expect(screen.queryByText('Glossaries')).not.toBeInTheDocument();
      expect(screen.queryByText('Aspects')).not.toBeInTheDocument();
    });

    it('should render popover content when open is true', () => {
      render(<BrowsePopover {...defaultProps} open={true} anchorEl={anchorEl} />);

      expect(screen.getByText('Glossaries')).toBeInTheDocument();
      expect(screen.getByText('Aspects')).toBeInTheDocument();
    });

    it('should render with null anchorEl', () => {
      render(<BrowsePopover {...defaultProps} open={true} anchorEl={null} />);

      // Popover may not position correctly without anchor, but should still render
      expect(screen.getByText('Glossaries')).toBeInTheDocument();
      expect(screen.getByText('Aspects')).toBeInTheDocument();
    });

    it('should render glossaries icon with correct attributes', () => {
      render(<BrowsePopover {...defaultProps} open={true} anchorEl={anchorEl} />);

      const glossariesIcon = screen.getByAltText('Glossaries');
      expect(glossariesIcon).toBeInTheDocument();
      expect(glossariesIcon).toHaveAttribute('src', '/assets/svg/glossaries-icon.svg');
    });

    it('should render annotations icon with correct attributes', () => {
      render(<BrowsePopover {...defaultProps} open={true} anchorEl={anchorEl} />);

      const annotationsIcon = screen.getByAltText('Annotations');
      expect(annotationsIcon).toBeInTheDocument();
      expect(annotationsIcon).toHaveAttribute('src', '/assets/svg/annotations-icon.svg');
    });

    it('should display Glossaries text', () => {
      render(<BrowsePopover {...defaultProps} open={true} anchorEl={anchorEl} />);

      const glossariesText = screen.getByText('Glossaries');
      expect(glossariesText).toBeInTheDocument();
    });

    it('should display Aspects text for annotations option', () => {
      render(<BrowsePopover {...defaultProps} open={true} anchorEl={anchorEl} />);

      const aspectsText = screen.getByText('Aspects');
      expect(aspectsText).toBeInTheDocument();
    });
  });

  describe('Glossaries Click Handler', () => {
    it('should dispatch fetchGlossaries when glossaries option is clicked', async () => {
      const user = userEvent.setup();
      render(<BrowsePopover {...defaultProps} open={true} anchorEl={anchorEl} />);

      await user.click(screen.getByText('Glossaries'));

      expect(mockFetchGlossaries).toHaveBeenCalledWith({ id_token: 'test-token' });
      expect(mockDispatch).toHaveBeenCalled();
    });

    it('should navigate to /glossaries when glossaries option is clicked', async () => {
      const user = userEvent.setup();
      render(<BrowsePopover {...defaultProps} open={true} anchorEl={anchorEl} />);

      await user.click(screen.getByText('Glossaries'));

      expect(mockNavigate).toHaveBeenCalledWith('/glossaries');
    });

    it('should call onClose when glossaries option is clicked', async () => {
      const user = userEvent.setup();
      render(<BrowsePopover {...defaultProps} open={true} anchorEl={anchorEl} />);

      await user.click(screen.getByText('Glossaries'));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should perform all glossaries actions in order', async () => {
      const user = userEvent.setup();
      const callOrder: string[] = [];

      mockDispatch.mockImplementation(() => {
        callOrder.push('dispatch');
      });
      mockNavigate.mockImplementation(() => {
        callOrder.push('navigate');
      });
      mockOnClose.mockImplementation(() => {
        callOrder.push('onClose');
      });

      render(<BrowsePopover {...defaultProps} open={true} anchorEl={anchorEl} />);

      await user.click(screen.getByText('Glossaries'));

      expect(callOrder).toEqual(['dispatch', 'navigate', 'onClose']);
    });

    it('should handle glossaries click with null user token', async () => {
      mockUser = null;
      const user = userEvent.setup();
      render(<BrowsePopover {...defaultProps} open={true} anchorEl={anchorEl} />);

      await user.click(screen.getByText('Glossaries'));

      expect(mockFetchGlossaries).toHaveBeenCalledWith({ id_token: undefined });
      expect(mockNavigate).toHaveBeenCalledWith('/glossaries');
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should click glossaries via icon', async () => {
      const user = userEvent.setup();
      render(<BrowsePopover {...defaultProps} open={true} anchorEl={anchorEl} />);

      const glossariesIcon = screen.getByAltText('Glossaries');
      await user.click(glossariesIcon);

      expect(mockDispatch).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/glossaries');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Annotations Click Handler', () => {
    it('should navigate to /browse-by-annotation when aspects option is clicked', async () => {
      const user = userEvent.setup();
      render(<BrowsePopover {...defaultProps} open={true} anchorEl={anchorEl} />);

      await user.click(screen.getByText('Aspects'));

      expect(mockNavigate).toHaveBeenCalledWith('/browse-by-annotation');
    });

    it('should call onClose when aspects option is clicked', async () => {
      const user = userEvent.setup();
      render(<BrowsePopover {...defaultProps} open={true} anchorEl={anchorEl} />);

      await user.click(screen.getByText('Aspects'));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should not dispatch any actions when aspects option is clicked', async () => {
      const user = userEvent.setup();
      render(<BrowsePopover {...defaultProps} open={true} anchorEl={anchorEl} />);

      await user.click(screen.getByText('Aspects'));

      expect(mockDispatch).not.toHaveBeenCalled();
      expect(mockFetchGlossaries).not.toHaveBeenCalled();
    });

    it('should perform annotations actions in order', async () => {
      const user = userEvent.setup();
      const callOrder: string[] = [];

      mockNavigate.mockImplementation(() => {
        callOrder.push('navigate');
      });
      mockOnClose.mockImplementation(() => {
        callOrder.push('onClose');
      });

      render(<BrowsePopover {...defaultProps} open={true} anchorEl={anchorEl} />);

      await user.click(screen.getByText('Aspects'));

      expect(callOrder).toEqual(['navigate', 'onClose']);
    });

    it('should click annotations via icon', async () => {
      const user = userEvent.setup();
      render(<BrowsePopover {...defaultProps} open={true} anchorEl={anchorEl} />);

      const annotationsIcon = screen.getByAltText('Annotations');
      await user.click(annotationsIcon);

      expect(mockNavigate).toHaveBeenCalledWith('/browse-by-annotation');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Popover onClose Handler', () => {
    it('should call onClose when clicking outside popover', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <div data-testid="outside-element">Outside</div>
          <BrowsePopover {...defaultProps} open={true} anchorEl={anchorEl} />
        </div>
      );

      // Click on the backdrop (MUI Popover creates a backdrop)
      const backdrop = document.querySelector('.MuiBackdrop-root');
      if (backdrop) {
        await user.click(backdrop);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });

    it('should handle escape key press', async () => {
      const user = userEvent.setup();
      render(<BrowsePopover {...defaultProps} open={true} anchorEl={anchorEl} />);

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Props Handling', () => {
    it('should update when open prop changes from false to true', () => {
      const { rerender } = render(
        <BrowsePopover {...defaultProps} open={false} anchorEl={anchorEl} />
      );

      expect(screen.queryByText('Glossaries')).not.toBeInTheDocument();

      rerender(<BrowsePopover {...defaultProps} open={true} anchorEl={anchorEl} />);

      expect(screen.getByText('Glossaries')).toBeInTheDocument();
    });

    it('should update when open prop changes from true to false', async () => {
      const { rerender } = render(
        <BrowsePopover {...defaultProps} open={true} anchorEl={anchorEl} />
      );

      expect(screen.getByText('Glossaries')).toBeInTheDocument();

      rerender(<BrowsePopover {...defaultProps} open={false} anchorEl={anchorEl} />);

      // MUI Popover may keep content in DOM but hide it via CSS
      // Check that the popover is no longer visible/accessible
      await waitFor(() => {
        const popoverContent = screen.queryByText('Glossaries');
        // Either removed from DOM or hidden
        if (popoverContent) {
          expect(popoverContent).not.toBeVisible();
        }
      });
    });

    it('should handle anchorEl change', () => {
      const newAnchorEl = document.createElement('span');
      document.body.appendChild(newAnchorEl);

      const { rerender } = render(
        <BrowsePopover {...defaultProps} open={true} anchorEl={anchorEl} />
      );

      expect(screen.getByText('Glossaries')).toBeInTheDocument();

      rerender(<BrowsePopover {...defaultProps} open={true} anchorEl={newAnchorEl} />);

      expect(screen.getByText('Glossaries')).toBeInTheDocument();

      document.body.removeChild(newAnchorEl);
    });

    it('should accept different onClose callbacks', async () => {
      const user = userEvent.setup();
      const customOnClose = vi.fn();

      render(
        <BrowsePopover
          anchorEl={anchorEl}
          open={true}
          onClose={customOnClose}
        />
      );

      await user.click(screen.getByText('Glossaries'));

      expect(customOnClose).toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Multiple Interactions', () => {
    it('should handle rapid clicks on glossaries', async () => {
      const user = userEvent.setup();
      render(<BrowsePopover {...defaultProps} open={true} anchorEl={anchorEl} />);

      const glossariesText = screen.getByText('Glossaries');
      await user.click(glossariesText);
      await user.click(glossariesText);

      expect(mockNavigate).toHaveBeenCalledTimes(2);
      expect(mockOnClose).toHaveBeenCalledTimes(2);
    });

    it('should handle clicks on both options', async () => {
      const user = userEvent.setup();
      render(<BrowsePopover {...defaultProps} open={true} anchorEl={anchorEl} />);

      await user.click(screen.getByText('Glossaries'));
      await user.click(screen.getByText('Aspects'));

      expect(mockNavigate).toHaveBeenCalledWith('/glossaries');
      expect(mockNavigate).toHaveBeenCalledWith('/browse-by-annotation');
      expect(mockOnClose).toHaveBeenCalledTimes(2);
    });
  });

  describe('Component Structure', () => {
    it('should have two clickable options', () => {
      render(<BrowsePopover {...defaultProps} open={true} anchorEl={anchorEl} />);

      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(2);
    });

    it('should render both options as visible when popover is open', () => {
      render(<BrowsePopover {...defaultProps} open={true} anchorEl={anchorEl} />);

      expect(screen.getByText('Glossaries')).toBeVisible();
      expect(screen.getByText('Aspects')).toBeVisible();
    });

    it('should render images with correct dimensions', () => {
      render(<BrowsePopover {...defaultProps} open={true} anchorEl={anchorEl} />);

      const glossariesIcon = screen.getByAltText('Glossaries');
      const annotationsIcon = screen.getByAltText('Annotations');

      expect(glossariesIcon).toHaveStyle({ width: '20px', height: '20px' });
      expect(annotationsIcon).toHaveStyle({ width: '20px', height: '20px' });
    });
  });

  describe('User Authentication Context', () => {
    it('should use token from auth context for glossaries fetch', async () => {
      mockUser = { token: 'custom-auth-token' };
      const user = userEvent.setup();
      render(<BrowsePopover {...defaultProps} open={true} anchorEl={anchorEl} />);

      await user.click(screen.getByText('Glossaries'));

      expect(mockFetchGlossaries).toHaveBeenCalledWith({ id_token: 'custom-auth-token' });
    });

    it('should handle missing user gracefully', async () => {
      mockUser = null;
      const user = userEvent.setup();
      render(<BrowsePopover {...defaultProps} open={true} anchorEl={anchorEl} />);

      // Should still render and be clickable
      expect(screen.getByText('Glossaries')).toBeInTheDocument();

      await user.click(screen.getByText('Glossaries'));

      expect(mockFetchGlossaries).toHaveBeenCalledWith({ id_token: undefined });
    });

    it('should still navigate even without user token', async () => {
      mockUser = null;
      const user = userEvent.setup();
      render(<BrowsePopover {...defaultProps} open={true} anchorEl={anchorEl} />);

      await user.click(screen.getByText('Aspects'));

      expect(mockNavigate).toHaveBeenCalledWith('/browse-by-annotation');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible images with alt text', () => {
      render(<BrowsePopover {...defaultProps} open={true} anchorEl={anchorEl} />);

      expect(screen.getByAltText('Glossaries')).toBeInTheDocument();
      expect(screen.getByAltText('Annotations')).toBeInTheDocument();
    });

    it('should render text labels for screen readers', () => {
      render(<BrowsePopover {...defaultProps} open={true} anchorEl={anchorEl} />);

      expect(screen.getByText('Glossaries')).toBeInTheDocument();
      expect(screen.getByText('Aspects')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle when user has empty token', async () => {
      mockUser = { token: '' };
      const user = userEvent.setup();
      render(<BrowsePopover {...defaultProps} open={true} anchorEl={anchorEl} />);

      await user.click(screen.getByText('Glossaries'));

      expect(mockFetchGlossaries).toHaveBeenCalledWith({ id_token: '' });
    });

    it('should render correctly when mounted multiple times', () => {
      const { unmount } = render(
        <BrowsePopover {...defaultProps} open={true} anchorEl={anchorEl} />
      );

      expect(screen.getByText('Glossaries')).toBeInTheDocument();
      unmount();

      render(<BrowsePopover {...defaultProps} open={true} anchorEl={anchorEl} />);

      expect(screen.getByText('Glossaries')).toBeInTheDocument();
    });

    it('should handle popover with different anchor elements', () => {
      const buttonAnchor = document.createElement('button');
      document.body.appendChild(buttonAnchor);

      render(<BrowsePopover open={true} anchorEl={buttonAnchor} onClose={mockOnClose} />);

      expect(screen.getByText('Glossaries')).toBeInTheDocument();

      document.body.removeChild(buttonAnchor);
    });
  });
});
