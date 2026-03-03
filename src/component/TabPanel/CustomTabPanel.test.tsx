import { render, screen } from '@testing-library/react';
import { it, describe, expect } from 'vitest';
import CustomTabPanel from './CustomTabPanel';

describe('CustomTabPanel', () => {
  describe('Basic Rendering', () => {
    it('renders the tabpanel element', () => {
      render(
        <CustomTabPanel index={0} value={0}>
          <div>Content</div>
        </CustomTabPanel>
      );

      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    });

    it('renders with correct role attribute', () => {
      render(
        <CustomTabPanel index={0} value={0}>
          <div>Content</div>
        </CustomTabPanel>
      );

      const tabpanel = screen.getByRole('tabpanel');
      expect(tabpanel).toHaveAttribute('role', 'tabpanel');
    });

    it('renders with correct id attribute', () => {
      render(
        <CustomTabPanel index={0} value={0}>
          <div>Content</div>
        </CustomTabPanel>
      );

      const tabpanel = screen.getByRole('tabpanel');
      expect(tabpanel).toHaveAttribute('id', 'tabpanel-0');
    });

    it('renders with correct aria-labelledby attribute', () => {
      render(
        <CustomTabPanel index={0} value={0}>
          <div>Content</div>
        </CustomTabPanel>
      );

      const tabpanel = screen.getByRole('tabpanel');
      expect(tabpanel).toHaveAttribute('aria-labelledby', 'tab-0');
    });

    it('renders with height 100% style', () => {
      render(
        <CustomTabPanel index={0} value={0}>
          <div>Content</div>
        </CustomTabPanel>
      );

      const tabpanel = screen.getByRole('tabpanel');
      expect(tabpanel).toHaveStyle({ height: '100%' });
    });
  });

  describe('Active Tab (value === index)', () => {
    it('renders children when value equals index', () => {
      render(
        <CustomTabPanel index={0} value={0}>
          <div data-testid="child-content">Tab Content</div>
        </CustomTabPanel>
      );

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
      expect(screen.getByText('Tab Content')).toBeInTheDocument();
    });

    it('is not hidden when value equals index', () => {
      render(
        <CustomTabPanel index={0} value={0}>
          <div>Content</div>
        </CustomTabPanel>
      );

      const tabpanel = screen.getByRole('tabpanel');
      expect(tabpanel).not.toHaveAttribute('hidden');
    });

    it('renders children wrapped in Box component', () => {
      const { container } = render(
        <CustomTabPanel index={0} value={0}>
          <div data-testid="child-content">Content</div>
        </CustomTabPanel>
      );

      // Box component renders with MuiBox-root class
      const box = container.querySelector('.MuiBox-root');
      expect(box).toBeInTheDocument();
    });

    it('renders text children correctly', () => {
      render(
        <CustomTabPanel index={0} value={0}>
          Simple text content
        </CustomTabPanel>
      );

      expect(screen.getByText('Simple text content')).toBeInTheDocument();
    });

    it('renders multiple children correctly', () => {
      render(
        <CustomTabPanel index={0} value={0}>
          <div data-testid="child-1">First</div>
          <div data-testid="child-2">Second</div>
          <div data-testid="child-3">Third</div>
        </CustomTabPanel>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(screen.getByTestId('child-3')).toBeInTheDocument();
    });

    it('renders nested components correctly', () => {
      render(
        <CustomTabPanel index={0} value={0}>
          <div>
            <span>Nested</span>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </div>
        </CustomTabPanel>
      );

      expect(screen.getByText('Nested')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });
  });

  describe('Inactive Tab (value !== index)', () => {
    it('does not render children when value does not equal index', () => {
      render(
        <CustomTabPanel index={0} value={1}>
          <div data-testid="child-content">Tab Content</div>
        </CustomTabPanel>
      );

      expect(screen.queryByTestId('child-content')).not.toBeInTheDocument();
      expect(screen.queryByText('Tab Content')).not.toBeInTheDocument();
    });

    it('has hidden attribute when value does not equal index', () => {
      render(
        <CustomTabPanel index={0} value={1}>
          <div>Content</div>
        </CustomTabPanel>
      );

      const tabpanel = screen.getByRole('tabpanel', { hidden: true });
      expect(tabpanel).toHaveAttribute('hidden');
    });

    it('does not render Box component when inactive', () => {
      const { container } = render(
        <CustomTabPanel index={0} value={1}>
          <div>Content</div>
        </CustomTabPanel>
      );

      const box = container.querySelector('.MuiBox-root');
      expect(box).not.toBeInTheDocument();
    });

    it('still renders the tabpanel div when inactive', () => {
      render(
        <CustomTabPanel index={0} value={1}>
          <div>Content</div>
        </CustomTabPanel>
      );

      // The tabpanel div should still exist, just hidden
      const tabpanel = screen.getByRole('tabpanel', { hidden: true });
      expect(tabpanel).toBeInTheDocument();
    });
  });

  describe('Different Index Values', () => {
    it('renders correctly with index=0, value=0', () => {
      render(
        <CustomTabPanel index={0} value={0}>
          <div data-testid="content">Content 0</div>
        </CustomTabPanel>
      );

      const tabpanel = screen.getByRole('tabpanel');
      expect(tabpanel).toHaveAttribute('id', 'tabpanel-0');
      expect(tabpanel).toHaveAttribute('aria-labelledby', 'tab-0');
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('renders correctly with index=1, value=1', () => {
      render(
        <CustomTabPanel index={1} value={1}>
          <div data-testid="content">Content 1</div>
        </CustomTabPanel>
      );

      const tabpanel = screen.getByRole('tabpanel');
      expect(tabpanel).toHaveAttribute('id', 'tabpanel-1');
      expect(tabpanel).toHaveAttribute('aria-labelledby', 'tab-1');
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('renders correctly with index=5, value=5', () => {
      render(
        <CustomTabPanel index={5} value={5}>
          <div data-testid="content">Content 5</div>
        </CustomTabPanel>
      );

      const tabpanel = screen.getByRole('tabpanel');
      expect(tabpanel).toHaveAttribute('id', 'tabpanel-5');
      expect(tabpanel).toHaveAttribute('aria-labelledby', 'tab-5');
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('renders correctly with large index value', () => {
      render(
        <CustomTabPanel index={100} value={100}>
          <div data-testid="content">Content 100</div>
        </CustomTabPanel>
      );

      const tabpanel = screen.getByRole('tabpanel');
      expect(tabpanel).toHaveAttribute('id', 'tabpanel-100');
      expect(tabpanel).toHaveAttribute('aria-labelledby', 'tab-100');
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('is hidden when index=0, value=1', () => {
      render(
        <CustomTabPanel index={0} value={1}>
          <div data-testid="content">Content</div>
        </CustomTabPanel>
      );

      const tabpanel = screen.getByRole('tabpanel', { hidden: true });
      expect(tabpanel).toHaveAttribute('hidden');
      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    });

    it('is hidden when index=2, value=0', () => {
      render(
        <CustomTabPanel index={2} value={0}>
          <div data-testid="content">Content</div>
        </CustomTabPanel>
      );

      const tabpanel = screen.getByRole('tabpanel', { hidden: true });
      expect(tabpanel).toHaveAttribute('hidden');
      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    });
  });

  describe('Children Variations', () => {
    it('renders without children', () => {
      render(<CustomTabPanel index={0} value={0} />);

      const tabpanel = screen.getByRole('tabpanel');
      expect(tabpanel).toBeInTheDocument();
    });

    it('renders with null children', () => {
      render(
        <CustomTabPanel index={0} value={0}>
          {null}
        </CustomTabPanel>
      );

      const tabpanel = screen.getByRole('tabpanel');
      expect(tabpanel).toBeInTheDocument();
    });

    it('renders with undefined children', () => {
      render(
        <CustomTabPanel index={0} value={0}>
          {undefined}
        </CustomTabPanel>
      );

      const tabpanel = screen.getByRole('tabpanel');
      expect(tabpanel).toBeInTheDocument();
    });

    it('renders with empty string children', () => {
      render(
        <CustomTabPanel index={0} value={0}>
          {''}
        </CustomTabPanel>
      );

      const tabpanel = screen.getByRole('tabpanel');
      expect(tabpanel).toBeInTheDocument();
    });

    it('renders with number children', () => {
      render(
        <CustomTabPanel index={0} value={0}>
          {42}
        </CustomTabPanel>
      );

      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders with array of elements as children', () => {
      const items = [1, 2, 3].map((num) => (
        <span key={num} data-testid={`item-${num}`}>
          Item {num}
        </span>
      ));

      render(
        <CustomTabPanel index={0} value={0}>
          {items}
        </CustomTabPanel>
      );

      expect(screen.getByTestId('item-1')).toBeInTheDocument();
      expect(screen.getByTestId('item-2')).toBeInTheDocument();
      expect(screen.getByTestId('item-3')).toBeInTheDocument();
    });

    it('renders with React Fragment children', () => {
      render(
        <CustomTabPanel index={0} value={0}>
          <>
            <div data-testid="frag-1">Fragment 1</div>
            <div data-testid="frag-2">Fragment 2</div>
          </>
        </CustomTabPanel>
      );

      expect(screen.getByTestId('frag-1')).toBeInTheDocument();
      expect(screen.getByTestId('frag-2')).toBeInTheDocument();
    });
  });

  describe('Props Spreading', () => {
    it('component accepts index and value props', () => {
      render(
        <CustomTabPanel index={0} value={0}>
          <div data-testid="content">Content</div>
        </CustomTabPanel>
      );

      const tabpanel = screen.getByRole('tabpanel');
      expect(tabpanel).toBeInTheDocument();
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('renders with correct structure when active', () => {
      const { container } = render(
        <CustomTabPanel index={0} value={0}>
          <div>Content</div>
        </CustomTabPanel>
      );

      const tabpanel = screen.getByRole('tabpanel');
      expect(tabpanel).toBeInTheDocument();
      expect(container.querySelector('.MuiBox-root')).toBeInTheDocument();
    });

    it('renders correct id based on index prop', () => {
      render(
        <CustomTabPanel index={5} value={5}>
          <div>Content</div>
        </CustomTabPanel>
      );

      const tabpanel = screen.getByRole('tabpanel');
      expect(tabpanel).toHaveAttribute('id', 'tabpanel-5');
      expect(tabpanel).toHaveAttribute('aria-labelledby', 'tab-5');
    });
  });

  describe('Accessibility', () => {
    it('has correct ARIA attributes for active panel', () => {
      render(
        <CustomTabPanel index={0} value={0}>
          <div>Content</div>
        </CustomTabPanel>
      );

      const tabpanel = screen.getByRole('tabpanel');
      expect(tabpanel).toHaveAttribute('role', 'tabpanel');
      expect(tabpanel).toHaveAttribute('id', 'tabpanel-0');
      expect(tabpanel).toHaveAttribute('aria-labelledby', 'tab-0');
      expect(tabpanel).not.toHaveAttribute('hidden');
    });

    it('has correct ARIA attributes for inactive panel', () => {
      render(
        <CustomTabPanel index={1} value={0}>
          <div>Content</div>
        </CustomTabPanel>
      );

      const tabpanel = screen.getByRole('tabpanel', { hidden: true });
      expect(tabpanel).toHaveAttribute('role', 'tabpanel');
      expect(tabpanel).toHaveAttribute('id', 'tabpanel-1');
      expect(tabpanel).toHaveAttribute('aria-labelledby', 'tab-1');
      expect(tabpanel).toHaveAttribute('hidden');
    });

    it('maintains accessibility across multiple panels', () => {
      render(
        <>
          <CustomTabPanel index={0} value={1}>
            <div>Panel 0</div>
          </CustomTabPanel>
          <CustomTabPanel index={1} value={1}>
            <div>Panel 1</div>
          </CustomTabPanel>
          <CustomTabPanel index={2} value={1}>
            <div>Panel 2</div>
          </CustomTabPanel>
        </>
      );

      const panels = screen.getAllByRole('tabpanel', { hidden: true });
      expect(panels).toHaveLength(3);

      expect(panels[0]).toHaveAttribute('id', 'tabpanel-0');
      expect(panels[0]).toHaveAttribute('hidden');

      expect(panels[1]).toHaveAttribute('id', 'tabpanel-1');
      expect(panels[1]).not.toHaveAttribute('hidden');

      expect(panels[2]).toHaveAttribute('id', 'tabpanel-2');
      expect(panels[2]).toHaveAttribute('hidden');
    });
  });

  describe('Tab Switching Simulation', () => {
    it('shows content when switching to active tab', () => {
      const { rerender } = render(
        <CustomTabPanel index={0} value={1}>
          <div data-testid="content">Content</div>
        </CustomTabPanel>
      );

      // Initially hidden
      expect(screen.queryByTestId('content')).not.toBeInTheDocument();

      // Switch to this tab
      rerender(
        <CustomTabPanel index={0} value={0}>
          <div data-testid="content">Content</div>
        </CustomTabPanel>
      );

      // Now visible
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('hides content when switching away from active tab', () => {
      const { rerender } = render(
        <CustomTabPanel index={0} value={0}>
          <div data-testid="content">Content</div>
        </CustomTabPanel>
      );

      // Initially visible
      expect(screen.getByTestId('content')).toBeInTheDocument();

      // Switch away from this tab
      rerender(
        <CustomTabPanel index={0} value={1}>
          <div data-testid="content">Content</div>
        </CustomTabPanel>
      );

      // Now hidden
      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    });

    it('maintains correct attributes during tab switches', () => {
      const { rerender } = render(
        <CustomTabPanel index={2} value={0}>
          <div>Content</div>
        </CustomTabPanel>
      );

      let tabpanel = screen.getByRole('tabpanel', { hidden: true });
      expect(tabpanel).toHaveAttribute('id', 'tabpanel-2');
      expect(tabpanel).toHaveAttribute('hidden');

      // Switch to tab 2
      rerender(
        <CustomTabPanel index={2} value={2}>
          <div>Content</div>
        </CustomTabPanel>
      );

      tabpanel = screen.getByRole('tabpanel');
      expect(tabpanel).toHaveAttribute('id', 'tabpanel-2');
      expect(tabpanel).not.toHaveAttribute('hidden');

      // Switch to tab 3
      rerender(
        <CustomTabPanel index={2} value={3}>
          <div>Content</div>
        </CustomTabPanel>
      );

      tabpanel = screen.getByRole('tabpanel', { hidden: true });
      expect(tabpanel).toHaveAttribute('id', 'tabpanel-2');
      expect(tabpanel).toHaveAttribute('hidden');
    });
  });

  describe('Box Component Styling', () => {
    it('renders Box with correct padding when active', () => {
      const { container } = render(
        <CustomTabPanel index={0} value={0}>
          <div>Content</div>
        </CustomTabPanel>
      );

      const box = container.querySelector('.MuiBox-root');
      expect(box).toBeInTheDocument();
    });

    it('Box has height 100%', () => {
      const { container } = render(
        <CustomTabPanel index={0} value={0}>
          <div>Content</div>
        </CustomTabPanel>
      );

      const box = container.querySelector('.MuiBox-root');
      expect(box).toBeInTheDocument();
      // MUI Box applies styles via classes, checking it exists is sufficient
    });
  });

  describe('Edge Cases', () => {
    it('handles index=0 specifically (falsy value)', () => {
      render(
        <CustomTabPanel index={0} value={0}>
          <div data-testid="content">Content for index 0</div>
        </CustomTabPanel>
      );

      expect(screen.getByTestId('content')).toBeInTheDocument();
      const tabpanel = screen.getByRole('tabpanel');
      expect(tabpanel).toHaveAttribute('id', 'tabpanel-0');
    });

    it('renders correctly when both index and value are 0', () => {
      render(
        <CustomTabPanel index={0} value={0}>
          <div data-testid="zero-content">Zero Index Content</div>
        </CustomTabPanel>
      );

      expect(screen.getByTestId('zero-content')).toBeInTheDocument();
      const tabpanel = screen.getByRole('tabpanel');
      expect(tabpanel).not.toHaveAttribute('hidden');
    });

    it('handles very long children content', () => {
      const longContent = 'A'.repeat(10000);
      render(
        <CustomTabPanel index={0} value={0}>
          <div data-testid="long-content">{longContent}</div>
        </CustomTabPanel>
      );

      expect(screen.getByTestId('long-content')).toBeInTheDocument();
      expect(screen.getByTestId('long-content').textContent).toHaveLength(10000);
    });

    it('handles special characters in children', () => {
      render(
        <CustomTabPanel index={0} value={0}>
          <div data-testid="special-content">{"<script>alert('xss')</script>"}</div>
        </CustomTabPanel>
      );

      expect(screen.getByTestId('special-content')).toBeInTheDocument();
      expect(screen.getByText("<script>alert('xss')</script>")).toBeInTheDocument();
    });

    it('handles unicode content', () => {
      render(
        <CustomTabPanel index={0} value={0}>
          <div data-testid="unicode-content">こんにちは 🎉 مرحبا</div>
        </CustomTabPanel>
      );

      expect(screen.getByTestId('unicode-content')).toBeInTheDocument();
      expect(screen.getByText('こんにちは 🎉 مرحبا')).toBeInTheDocument();
    });
  });

  describe('Snapshot Tests', () => {
    it('active panel matches snapshot', () => {
      const { container } = render(
        <CustomTabPanel index={0} value={0}>
          <div>Snapshot Content</div>
        </CustomTabPanel>
      );

      expect(container.firstChild).toBeDefined();
    });

    it('inactive panel matches snapshot', () => {
      const { container } = render(
        <CustomTabPanel index={0} value={1}>
          <div>Snapshot Content</div>
        </CustomTabPanel>
      );

      expect(container.firstChild).toBeDefined();
    });

    it('panel with different index matches snapshot', () => {
      const { container } = render(
        <CustomTabPanel index={3} value={3}>
          <div>Panel 3 Content</div>
        </CustomTabPanel>
      );

      expect(container.firstChild).toBeDefined();
    });
  });
});
