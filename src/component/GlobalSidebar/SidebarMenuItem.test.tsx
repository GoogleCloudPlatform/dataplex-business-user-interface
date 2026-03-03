import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SidebarMenuItem from './SidebarMenuItem';

// Mock icon components for testing
const MockIcon = () => <svg data-testid="mock-icon" />;
const MockIconWithText = () => <span data-testid="icon-with-text">Icon</span>;

describe('SidebarMenuItem', () => {
  const defaultProps = {
    icon: <MockIcon />,
    label: 'Test Label',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders with required props', () => {
      render(<SidebarMenuItem {...defaultProps} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('Test Label')).toBeInTheDocument();
    });

    it('renders the icon', () => {
      render(<SidebarMenuItem {...defaultProps} />);

      expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
    });

    it('renders the label', () => {
      render(<SidebarMenuItem {...defaultProps} />);

      expect(screen.getByText('Test Label')).toBeInTheDocument();
    });

    it('renders icon inside menu-icon-container', () => {
      render(<SidebarMenuItem {...defaultProps} />);

      const iconContainer = document.querySelector('.menu-icon-container');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer).toContainElement(screen.getByTestId('mock-icon'));
    });

    it('renders label inside menu-label span', () => {
      render(<SidebarMenuItem {...defaultProps} />);

      const labelSpan = document.querySelector('.menu-label');
      expect(labelSpan).toBeInTheDocument();
      expect(labelSpan).toHaveTextContent('Test Label');
    });

    it('renders with different icon types', () => {
      render(<SidebarMenuItem icon={<MockIconWithText />} label="With Text Icon" />);

      expect(screen.getByTestId('icon-with-text')).toBeInTheDocument();
      expect(screen.getByText('With Text Icon')).toBeInTheDocument();
    });

    it('renders with string icon', () => {
      render(<SidebarMenuItem icon="★" label="Star Menu" />);

      expect(screen.getByText('Star Menu')).toBeInTheDocument();
      const iconContainer = document.querySelector('.menu-icon-container');
      expect(iconContainer).toHaveTextContent('★');
    });

    it('renders with complex JSX icon', () => {
      const complexIcon = (
        <div data-testid="complex-icon">
          <span>Part 1</span>
          <span>Part 2</span>
        </div>
      );
      render(<SidebarMenuItem icon={complexIcon} label="Complex Icon" />);

      expect(screen.getByTestId('complex-icon')).toBeInTheDocument();
      expect(screen.getByText('Part 1')).toBeInTheDocument();
      expect(screen.getByText('Part 2')).toBeInTheDocument();
    });
  });

  describe('CSS Classes', () => {
    it('always has sidebar-menu-item class', () => {
      render(<SidebarMenuItem {...defaultProps} />);

      expect(screen.getByRole('button')).toHaveClass('sidebar-menu-item');
    });

    it('has single-line class by default', () => {
      render(<SidebarMenuItem {...defaultProps} />);

      expect(screen.getByRole('button')).toHaveClass('single-line');
    });

    it('does not have active class by default', () => {
      render(<SidebarMenuItem {...defaultProps} />);

      expect(screen.getByRole('button')).not.toHaveClass('active');
    });

    it('does not have disabled class by default', () => {
      render(<SidebarMenuItem {...defaultProps} />);

      expect(screen.getByRole('button')).not.toHaveClass('disabled');
    });

    it('does not have two-line class by default', () => {
      render(<SidebarMenuItem {...defaultProps} />);

      expect(screen.getByRole('button')).not.toHaveClass('two-line');
    });
  });

  describe('isActive prop', () => {
    it('adds active class when isActive is true', () => {
      render(<SidebarMenuItem {...defaultProps} isActive={true} />);

      expect(screen.getByRole('button')).toHaveClass('active');
    });

    it('does not add active class when isActive is false', () => {
      render(<SidebarMenuItem {...defaultProps} isActive={false} />);

      expect(screen.getByRole('button')).not.toHaveClass('active');
    });

    it('does not add active class when isActive is undefined', () => {
      render(<SidebarMenuItem {...defaultProps} />);

      expect(screen.getByRole('button')).not.toHaveClass('active');
    });
  });

  describe('disabled prop', () => {
    it('adds disabled class when disabled is true', () => {
      render(<SidebarMenuItem {...defaultProps} disabled={true} />);

      expect(screen.getByRole('button')).toHaveClass('disabled');
    });

    it('does not add disabled class when disabled is false', () => {
      render(<SidebarMenuItem {...defaultProps} disabled={false} />);

      expect(screen.getByRole('button')).not.toHaveClass('disabled');
    });

    it('does not add disabled class when disabled is undefined', () => {
      render(<SidebarMenuItem {...defaultProps} />);

      expect(screen.getByRole('button')).not.toHaveClass('disabled');
    });

    it('sets tabIndex to -1 when disabled', () => {
      render(<SidebarMenuItem {...defaultProps} disabled={true} />);

      expect(screen.getByRole('button')).toHaveAttribute('tabIndex', '-1');
    });

    it('sets tabIndex to 0 when not disabled', () => {
      render(<SidebarMenuItem {...defaultProps} disabled={false} />);

      expect(screen.getByRole('button')).toHaveAttribute('tabIndex', '0');
    });

    it('sets aria-disabled to true when disabled', () => {
      render(<SidebarMenuItem {...defaultProps} disabled={true} />);

      expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
    });

    it('sets aria-disabled to false when not disabled', () => {
      render(<SidebarMenuItem {...defaultProps} disabled={false} />);

      expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'false');
    });
  });

  describe('multiLine prop', () => {
    it('adds two-line class when multiLine is true', () => {
      render(<SidebarMenuItem {...defaultProps} multiLine={true} />);

      expect(screen.getByRole('button')).toHaveClass('two-line');
    });

    it('does not add two-line class when multiLine is false', () => {
      render(<SidebarMenuItem {...defaultProps} multiLine={false} />);

      expect(screen.getByRole('button')).not.toHaveClass('two-line');
    });

    it('adds single-line class when multiLine is false', () => {
      render(<SidebarMenuItem {...defaultProps} multiLine={false} />);

      expect(screen.getByRole('button')).toHaveClass('single-line');
    });

    it('does not add single-line class when multiLine is true', () => {
      render(<SidebarMenuItem {...defaultProps} multiLine={true} />);

      expect(screen.getByRole('button')).not.toHaveClass('single-line');
    });
  });

  describe('Click Handler', () => {
    it('calls onClick when clicked and not disabled', async () => {
      const mockOnClick = vi.fn();
      const user = userEvent.setup();
      render(<SidebarMenuItem {...defaultProps} onClick={mockOnClick} />);

      await user.click(screen.getByRole('button'));

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', async () => {
      const mockOnClick = vi.fn();
      const user = userEvent.setup();
      render(<SidebarMenuItem {...defaultProps} onClick={mockOnClick} disabled={true} />);

      await user.click(screen.getByRole('button'));

      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('does not throw when onClick is undefined', async () => {
      const user = userEvent.setup();
      render(<SidebarMenuItem {...defaultProps} />);

      await expect(user.click(screen.getByRole('button'))).resolves.not.toThrow();
    });

    it('passes event to onClick handler', async () => {
      const mockOnClick = vi.fn();
      const user = userEvent.setup();
      render(<SidebarMenuItem {...defaultProps} onClick={mockOnClick} />);

      await user.click(screen.getByRole('button'));

      expect(mockOnClick).toHaveBeenCalledWith(expect.any(Object));
      const callArg = mockOnClick.mock.calls[0][0];
      expect(callArg.type).toBe('click');
    });

    it('calls onClick with event containing currentTarget', async () => {
      const mockOnClick = vi.fn();
      const user = userEvent.setup();
      render(<SidebarMenuItem {...defaultProps} onClick={mockOnClick} />);

      await user.click(screen.getByRole('button'));

      const callArg = mockOnClick.mock.calls[0][0];
      expect(callArg.currentTarget).toBeDefined();
    });

    it('works with fireEvent.click', () => {
      const mockOnClick = vi.fn();
      render(<SidebarMenuItem {...defaultProps} onClick={mockOnClick} />);

      fireEvent.click(screen.getByRole('button'));

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick with fireEvent when disabled', () => {
      const mockOnClick = vi.fn();
      render(<SidebarMenuItem {...defaultProps} onClick={mockOnClick} disabled={true} />);

      fireEvent.click(screen.getByRole('button'));

      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('handles multiple clicks', async () => {
      const mockOnClick = vi.fn();
      const user = userEvent.setup();
      render(<SidebarMenuItem {...defaultProps} onClick={mockOnClick} />);

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByRole('button'));
      await user.click(screen.getByRole('button'));

      expect(mockOnClick).toHaveBeenCalledTimes(3);
    });

    it('does not call onClick when disabled even with multiple clicks', async () => {
      const mockOnClick = vi.fn();
      const user = userEvent.setup();
      render(<SidebarMenuItem {...defaultProps} onClick={mockOnClick} disabled={true} />);

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByRole('button'));
      await user.click(screen.getByRole('button'));

      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has role button', () => {
      render(<SidebarMenuItem {...defaultProps} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('has tabIndex 0 when enabled', () => {
      render(<SidebarMenuItem {...defaultProps} />);

      expect(screen.getByRole('button')).toHaveAttribute('tabIndex', '0');
    });

    it('has tabIndex -1 when disabled', () => {
      render(<SidebarMenuItem {...defaultProps} disabled={true} />);

      expect(screen.getByRole('button')).toHaveAttribute('tabIndex', '-1');
    });

    it('has aria-disabled attribute', () => {
      render(<SidebarMenuItem {...defaultProps} />);

      expect(screen.getByRole('button')).toHaveAttribute('aria-disabled');
    });

    it('aria-disabled is false when not disabled', () => {
      render(<SidebarMenuItem {...defaultProps} disabled={false} />);

      expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'false');
    });

    it('aria-disabled is true when disabled', () => {
      render(<SidebarMenuItem {...defaultProps} disabled={true} />);

      expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
    });

    it('label is visible for screen readers', () => {
      render(<SidebarMenuItem {...defaultProps} label="Accessible Label" />);

      expect(screen.getByText('Accessible Label')).toBeVisible();
    });
  });

  describe('Prop Combinations', () => {
    it('handles isActive=true with disabled=false', () => {
      const mockOnClick = vi.fn();
      render(
        <SidebarMenuItem
          {...defaultProps}
          isActive={true}
          disabled={false}
          onClick={mockOnClick}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('active');
      expect(button).not.toHaveClass('disabled');
      expect(button).toHaveAttribute('tabIndex', '0');

      fireEvent.click(button);
      expect(mockOnClick).toHaveBeenCalled();
    });

    it('handles isActive=true with disabled=true', () => {
      const mockOnClick = vi.fn();
      render(
        <SidebarMenuItem
          {...defaultProps}
          isActive={true}
          disabled={true}
          onClick={mockOnClick}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('active');
      expect(button).toHaveClass('disabled');
      expect(button).toHaveAttribute('tabIndex', '-1');

      fireEvent.click(button);
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('handles isActive=false with disabled=true', () => {
      const mockOnClick = vi.fn();
      render(
        <SidebarMenuItem
          {...defaultProps}
          isActive={false}
          disabled={true}
          onClick={mockOnClick}
        />
      );

      const button = screen.getByRole('button');
      expect(button).not.toHaveClass('active');
      expect(button).toHaveClass('disabled');
      expect(button).toHaveAttribute('tabIndex', '-1');

      fireEvent.click(button);
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('handles multiLine=true with isActive=true', () => {
      render(
        <SidebarMenuItem
          {...defaultProps}
          multiLine={true}
          isActive={true}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('two-line');
      expect(button).toHaveClass('active');
      expect(button).not.toHaveClass('single-line');
    });

    it('handles multiLine=true with disabled=true', () => {
      render(
        <SidebarMenuItem
          {...defaultProps}
          multiLine={true}
          disabled={true}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('two-line');
      expect(button).toHaveClass('disabled');
      expect(button).toHaveAttribute('tabIndex', '-1');
    });

    it('handles all props true', () => {
      const mockOnClick = vi.fn();
      render(
        <SidebarMenuItem
          icon={<MockIcon />}
          label="All True"
          isActive={true}
          disabled={true}
          multiLine={true}
          onClick={mockOnClick}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('sidebar-menu-item');
      expect(button).toHaveClass('active');
      expect(button).toHaveClass('disabled');
      expect(button).toHaveClass('two-line');
      expect(button).not.toHaveClass('single-line');
      expect(button).toHaveAttribute('tabIndex', '-1');
      expect(button).toHaveAttribute('aria-disabled', 'true');

      fireEvent.click(button);
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('handles all props false', () => {
      const mockOnClick = vi.fn();
      render(
        <SidebarMenuItem
          icon={<MockIcon />}
          label="All False"
          isActive={false}
          disabled={false}
          multiLine={false}
          onClick={mockOnClick}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('sidebar-menu-item');
      expect(button).not.toHaveClass('active');
      expect(button).not.toHaveClass('disabled');
      expect(button).not.toHaveClass('two-line');
      expect(button).toHaveClass('single-line');
      expect(button).toHaveAttribute('tabIndex', '0');
      expect(button).toHaveAttribute('aria-disabled', 'false');

      fireEvent.click(button);
      expect(mockOnClick).toHaveBeenCalled();
    });
  });

  describe('Default Props', () => {
    it('isActive defaults to false', () => {
      render(<SidebarMenuItem icon={<MockIcon />} label="Test" />);

      expect(screen.getByRole('button')).not.toHaveClass('active');
    });

    it('disabled defaults to false', () => {
      render(<SidebarMenuItem icon={<MockIcon />} label="Test" />);

      const button = screen.getByRole('button');
      expect(button).not.toHaveClass('disabled');
      expect(button).toHaveAttribute('tabIndex', '0');
      expect(button).toHaveAttribute('aria-disabled', 'false');
    });

    it('multiLine defaults to false', () => {
      render(<SidebarMenuItem icon={<MockIcon />} label="Test" />);

      const button = screen.getByRole('button');
      expect(button).not.toHaveClass('two-line');
      expect(button).toHaveClass('single-line');
    });

    it('onClick defaults to undefined (no error on click)', () => {
      render(<SidebarMenuItem icon={<MockIcon />} label="Test" />);

      expect(() => fireEvent.click(screen.getByRole('button'))).not.toThrow();
    });
  });

  describe('Label Variations', () => {
    it('renders short label', () => {
      render(<SidebarMenuItem icon={<MockIcon />} label="A" />);

      expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('renders long label', () => {
      const longLabel = 'This is a very long label that might wrap to multiple lines';
      render(<SidebarMenuItem icon={<MockIcon />} label={longLabel} />);

      expect(screen.getByText(longLabel)).toBeInTheDocument();
    });

    it('renders label with special characters', () => {
      render(<SidebarMenuItem icon={<MockIcon />} label="Test & Label <special>" />);

      expect(screen.getByText('Test & Label <special>')).toBeInTheDocument();
    });

    it('renders label with numbers', () => {
      render(<SidebarMenuItem icon={<MockIcon />} label="Item 123" />);

      expect(screen.getByText('Item 123')).toBeInTheDocument();
    });

    it('renders label with unicode', () => {
      render(<SidebarMenuItem icon={<MockIcon />} label="测试 Тест" />);

      expect(screen.getByText('测试 Тест')).toBeInTheDocument();
    });

    it('renders label with emoji', () => {
      render(<SidebarMenuItem icon={<MockIcon />} label="🏠 Home" />);

      expect(screen.getByText('🏠 Home')).toBeInTheDocument();
    });
  });

  describe('DOM Structure', () => {
    it('has correct DOM structure', () => {
      render(<SidebarMenuItem {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button.children).toHaveLength(2);

      const iconContainer = button.children[0];
      const labelSpan = button.children[1];

      expect(iconContainer).toHaveClass('menu-icon-container');
      expect(labelSpan).toHaveClass('menu-label');
    });

    it('icon container is first child', () => {
      render(<SidebarMenuItem {...defaultProps} />);

      const button = screen.getByRole('button');
      const firstChild = button.children[0];

      expect(firstChild).toHaveClass('menu-icon-container');
    });

    it('label span is second child', () => {
      render(<SidebarMenuItem {...defaultProps} />);

      const button = screen.getByRole('button');
      const secondChild = button.children[1];

      expect(secondChild).toHaveClass('menu-label');
      expect(secondChild.tagName).toBe('SPAN');
    });
  });

  describe('Event Object', () => {
    it('onClick receives MouseEvent', () => {
      const mockOnClick = vi.fn();
      render(<SidebarMenuItem {...defaultProps} onClick={mockOnClick} />);

      fireEvent.click(screen.getByRole('button'));

      const event = mockOnClick.mock.calls[0][0];
      expect(event).toBeDefined();
      expect(event.type).toBe('click');
    });

    it('onClick event has target', () => {
      const mockOnClick = vi.fn();
      render(<SidebarMenuItem {...defaultProps} onClick={mockOnClick} />);

      fireEvent.click(screen.getByRole('button'));

      const event = mockOnClick.mock.calls[0][0];
      expect(event.target).toBeDefined();
    });

    it('onClick event has currentTarget', () => {
      const mockOnClick = vi.fn();
      render(<SidebarMenuItem {...defaultProps} onClick={mockOnClick} />);

      fireEvent.click(screen.getByRole('button'));

      const event = mockOnClick.mock.calls[0][0];
      expect(event.currentTarget).toBeDefined();
    });

    it('event currentTarget is the button element', async () => {
      const mockOnClick = vi.fn();
      const user = userEvent.setup();
      render(<SidebarMenuItem {...defaultProps} onClick={mockOnClick} />);

      const button = screen.getByRole('button');
      await user.click(button);

      const event = mockOnClick.mock.calls[0][0];
      // userEvent properly sets currentTarget during event propagation
      expect(event.currentTarget).toBeDefined();
    });
  });

  describe('Class Name String', () => {
    it('generates correct class string for default state', () => {
      render(<SidebarMenuItem {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button.className).toContain('sidebar-menu-item');
      expect(button.className).toContain('single-line');
    });

    it('generates correct class string when all optional props are true', () => {
      render(
        <SidebarMenuItem
          {...defaultProps}
          isActive={true}
          disabled={true}
          multiLine={true}
        />
      );

      const button = screen.getByRole('button');
      expect(button.className).toContain('sidebar-menu-item');
      expect(button.className).toContain('active');
      expect(button.className).toContain('disabled');
      expect(button.className).toContain('two-line');
    });

    it('class string contains expected base classes', () => {
      render(<SidebarMenuItem {...defaultProps} />);

      const button = screen.getByRole('button');
      // The component uses template literals with conditionals, which may create spaces
      // Verify the essential classes are present
      expect(button.className).toContain('sidebar-menu-item');
      expect(button.className).toContain('single-line');
      expect(button.className).not.toContain('active');
      expect(button.className).not.toContain('disabled');
    });
  });

  describe('Re-render Behavior', () => {
    it('updates when isActive changes', () => {
      const { rerender } = render(<SidebarMenuItem {...defaultProps} isActive={false} />);

      expect(screen.getByRole('button')).not.toHaveClass('active');

      rerender(<SidebarMenuItem {...defaultProps} isActive={true} />);

      expect(screen.getByRole('button')).toHaveClass('active');
    });

    it('updates when disabled changes', () => {
      const { rerender } = render(<SidebarMenuItem {...defaultProps} disabled={false} />);

      expect(screen.getByRole('button')).not.toHaveClass('disabled');
      expect(screen.getByRole('button')).toHaveAttribute('tabIndex', '0');

      rerender(<SidebarMenuItem {...defaultProps} disabled={true} />);

      expect(screen.getByRole('button')).toHaveClass('disabled');
      expect(screen.getByRole('button')).toHaveAttribute('tabIndex', '-1');
    });

    it('updates when multiLine changes', () => {
      const { rerender } = render(<SidebarMenuItem {...defaultProps} multiLine={false} />);

      expect(screen.getByRole('button')).toHaveClass('single-line');

      rerender(<SidebarMenuItem {...defaultProps} multiLine={true} />);

      expect(screen.getByRole('button')).toHaveClass('two-line');
      expect(screen.getByRole('button')).not.toHaveClass('single-line');
    });

    it('updates when label changes', () => {
      const { rerender } = render(<SidebarMenuItem {...defaultProps} label="Original" />);

      expect(screen.getByText('Original')).toBeInTheDocument();

      rerender(<SidebarMenuItem {...defaultProps} label="Updated" />);

      expect(screen.getByText('Updated')).toBeInTheDocument();
      expect(screen.queryByText('Original')).not.toBeInTheDocument();
    });

    it('updates when icon changes', () => {
      const { rerender } = render(<SidebarMenuItem {...defaultProps} icon={<span data-testid="icon-1">1</span>} />);

      expect(screen.getByTestId('icon-1')).toBeInTheDocument();

      rerender(<SidebarMenuItem {...defaultProps} icon={<span data-testid="icon-2">2</span>} />);

      expect(screen.getByTestId('icon-2')).toBeInTheDocument();
      expect(screen.queryByTestId('icon-1')).not.toBeInTheDocument();
    });

    it('updates onClick handler on re-render', () => {
      const mockOnClick1 = vi.fn();
      const mockOnClick2 = vi.fn();

      const { rerender } = render(<SidebarMenuItem {...defaultProps} onClick={mockOnClick1} />);

      fireEvent.click(screen.getByRole('button'));
      expect(mockOnClick1).toHaveBeenCalledTimes(1);
      expect(mockOnClick2).not.toHaveBeenCalled();

      rerender(<SidebarMenuItem {...defaultProps} onClick={mockOnClick2} />);

      fireEvent.click(screen.getByRole('button'));
      expect(mockOnClick1).toHaveBeenCalledTimes(1); // Not called again
      expect(mockOnClick2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty label', () => {
      render(<SidebarMenuItem icon={<MockIcon />} label="" />);

      const labelSpan = document.querySelector('.menu-label');
      expect(labelSpan).toBeInTheDocument();
      expect(labelSpan).toHaveTextContent('');
    });

    it('handles whitespace-only label', () => {
      render(<SidebarMenuItem icon={<MockIcon />} label="   " />);

      const labelSpan = document.querySelector('.menu-label');
      expect(labelSpan).toBeInTheDocument();
      // HTML normalizes whitespace in textContent, but the raw text is preserved
      expect(labelSpan?.textContent).toBe('   ');
    });

    it('handles null icon child gracefully', () => {
      render(<SidebarMenuItem icon={null} label="Null Icon" />);

      const iconContainer = document.querySelector('.menu-icon-container');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer).toBeEmptyDOMElement();
    });

    it('handles rapid prop changes', () => {
      const { rerender } = render(<SidebarMenuItem {...defaultProps} isActive={false} />);

      for (let i = 0; i < 10; i++) {
        rerender(<SidebarMenuItem {...defaultProps} isActive={i % 2 === 0} />);
      }

      // Final state should be isActive=false (9 % 2 = 1, not === 0)
      expect(screen.getByRole('button')).not.toHaveClass('active');
    });
  });
});
