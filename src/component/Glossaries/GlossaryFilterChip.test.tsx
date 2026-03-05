import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GlossaryFilterChip from './GlossaryFilterChip';
import type { FilterChip } from './GlossaryDataType';

// Mock isOrConnector from glossaryUtils
vi.mock('../../utils/glossaryUtils', () => ({
  isOrConnector: (chip: FilterChip) => chip.value === 'OR' && chip.displayLabel === 'OR',
}));

describe('GlossaryFilterChip', () => {
  const mockOnRemove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('OR Connector Chip', () => {
    const orChip: FilterChip = {
      id: 'or-chip-1',
      field: 'name' as any,
      value: 'OR',
      displayLabel: 'OR',
    };

    it('renders OR text for OR connector chip', () => {
      render(<GlossaryFilterChip chip={orChip} onRemove={mockOnRemove} />);

      expect(screen.getByText('OR')).toBeInTheDocument();
    });

    it('renders close button for OR connector chip', () => {
      render(<GlossaryFilterChip chip={orChip} onRemove={mockOnRemove} />);

      const closeButton = screen.getByRole('button');
      expect(closeButton).toBeInTheDocument();
    });

    it('calls onRemove with chip id when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<GlossaryFilterChip chip={orChip} onRemove={mockOnRemove} />);

      const closeButton = screen.getByRole('button');
      await user.click(closeButton);

      expect(mockOnRemove).toHaveBeenCalledWith('or-chip-1');
      expect(mockOnRemove).toHaveBeenCalledTimes(1);
    });

    it('renders CloseIcon inside button', () => {
      render(<GlossaryFilterChip chip={orChip} onRemove={mockOnRemove} />);

      const closeIcon = screen.getByTestId('CloseIcon');
      expect(closeIcon).toBeInTheDocument();
    });
  });

  describe('Regular Filter Chip with Field Label', () => {
    const regularChip: FilterChip = {
      id: 'filter-1',
      field: 'name' as any,
      value: 'Test Value',
      displayLabel: 'Name: Test Value',
    };

    it('renders field label and value separately', () => {
      render(<GlossaryFilterChip chip={regularChip} onRemove={mockOnRemove} />);

      expect(screen.getByText('Name:')).toBeInTheDocument();
      expect(screen.getByText('Test Value')).toBeInTheDocument();
    });

    it('renders close button', () => {
      render(<GlossaryFilterChip chip={regularChip} onRemove={mockOnRemove} />);

      const closeButton = screen.getByRole('button');
      expect(closeButton).toBeInTheDocument();
    });

    it('calls onRemove with chip id when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<GlossaryFilterChip chip={regularChip} onRemove={mockOnRemove} />);

      const closeButton = screen.getByRole('button');
      await user.click(closeButton);

      expect(mockOnRemove).toHaveBeenCalledWith('filter-1');
    });

    it('renders CloseIcon inside button', () => {
      render(<GlossaryFilterChip chip={regularChip} onRemove={mockOnRemove} />);

      const closeIcon = screen.getByTestId('CloseIcon');
      expect(closeIcon).toBeInTheDocument();
    });
  });

  describe('Regular Filter Chip without Field Label (showFieldLabel = false)', () => {
    const chipWithoutFieldLabel: FilterChip = {
      id: 'filter-2',
      field: 'name' as any,
      value: 'Just Value',
      displayLabel: 'Field: Just Value',
      showFieldLabel: false,
    };

    it('renders only the full displayLabel without splitting', () => {
      render(<GlossaryFilterChip chip={chipWithoutFieldLabel} onRemove={mockOnRemove} />);

      // When showFieldLabel is false, the entire displayLabel is shown as valueLabel
      expect(screen.getByText('Field: Just Value')).toBeInTheDocument();
    });

    it('does not render field label separately when showFieldLabel is false', () => {
      render(<GlossaryFilterChip chip={chipWithoutFieldLabel} onRemove={mockOnRemove} />);

      // Should not have separate "Field:" text element
      const allTypographies = document.querySelectorAll('.MuiTypography-root');
      expect(allTypographies.length).toBe(1); // Only one Typography for the full value
    });

    it('calls onRemove when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<GlossaryFilterChip chip={chipWithoutFieldLabel} onRemove={mockOnRemove} />);

      const closeButton = screen.getByRole('button');
      await user.click(closeButton);

      expect(mockOnRemove).toHaveBeenCalledWith('filter-2');
    });
  });

  describe('Regular Filter Chip without Colon in displayLabel', () => {
    const chipWithoutColon: FilterChip = {
      id: 'filter-3',
      field: 'name' as any,
      value: 'NoColonValue',
      displayLabel: 'NoColonValue',
    };

    it('renders entire displayLabel as value when no colon present', () => {
      render(<GlossaryFilterChip chip={chipWithoutColon} onRemove={mockOnRemove} />);

      expect(screen.getByText('NoColonValue')).toBeInTheDocument();
    });

    it('does not render field label when no colon present', () => {
      render(<GlossaryFilterChip chip={chipWithoutColon} onRemove={mockOnRemove} />);

      // Only one Typography for the value
      const allTypographies = document.querySelectorAll('.MuiTypography-root');
      expect(allTypographies.length).toBe(1);
    });

    it('calls onRemove when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<GlossaryFilterChip chip={chipWithoutColon} onRemove={mockOnRemove} />);

      const closeButton = screen.getByRole('button');
      await user.click(closeButton);

      expect(mockOnRemove).toHaveBeenCalledWith('filter-3');
    });
  });

  describe('Regular Filter Chip with showFieldLabel = true', () => {
    const chipWithFieldLabelTrue: FilterChip = {
      id: 'filter-4',
      field: 'description' as any,
      value: 'Description Value',
      displayLabel: 'Description: Description Value',
      showFieldLabel: true,
    };

    it('renders field label when showFieldLabel is true', () => {
      render(<GlossaryFilterChip chip={chipWithFieldLabelTrue} onRemove={mockOnRemove} />);

      expect(screen.getByText('Description:')).toBeInTheDocument();
      expect(screen.getByText('Description Value')).toBeInTheDocument();
    });

    it('renders two Typography elements for field and value', () => {
      render(<GlossaryFilterChip chip={chipWithFieldLabelTrue} onRemove={mockOnRemove} />);

      const allTypographies = document.querySelectorAll('.MuiTypography-root');
      expect(allTypographies.length).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty displayLabel', () => {
      const emptyLabelChip: FilterChip = {
        id: 'empty-1',
        field: 'name' as any,
        value: '',
        displayLabel: '',
      };

      render(<GlossaryFilterChip chip={emptyLabelChip} onRemove={mockOnRemove} />);

      // Should still render the chip structure
      const closeButton = screen.getByRole('button');
      expect(closeButton).toBeInTheDocument();
    });

    it('handles displayLabel with only colon', () => {
      const onlyColonChip: FilterChip = {
        id: 'colon-1',
        field: 'name' as any,
        value: '',
        displayLabel: ':',
      };

      render(<GlossaryFilterChip chip={onlyColonChip} onRemove={mockOnRemove} />);

      expect(screen.getByText(':')).toBeInTheDocument();
    });

    it('handles displayLabel with colon at the end', () => {
      const colonAtEndChip: FilterChip = {
        id: 'colon-end-1',
        field: 'name' as any,
        value: '',
        displayLabel: 'Field:',
      };

      render(<GlossaryFilterChip chip={colonAtEndChip} onRemove={mockOnRemove} />);

      expect(screen.getByText('Field:')).toBeInTheDocument();
    });

    it('handles displayLabel with multiple colons', () => {
      const multipleColonsChip: FilterChip = {
        id: 'multi-colon-1',
        field: 'name' as any,
        value: 'Value:With:Colons',
        displayLabel: 'Field: Value:With:Colons',
      };

      render(<GlossaryFilterChip chip={multipleColonsChip} onRemove={mockOnRemove} />);

      // Should split only on first colon
      expect(screen.getByText('Field:')).toBeInTheDocument();
      expect(screen.getByText('Value:With:Colons')).toBeInTheDocument();
    });

    it('handles displayLabel with spaces around colon', () => {
      const spacesChip: FilterChip = {
        id: 'spaces-1',
        field: 'name' as any,
        value: '  Value with spaces  ',
        displayLabel: 'Field :   Value with spaces  ',
      };

      render(<GlossaryFilterChip chip={spacesChip} onRemove={mockOnRemove} />);

      // Field label includes colon
      expect(screen.getByText('Field :')).toBeInTheDocument();
      // Value is trimmed
      expect(screen.getByText('Value with spaces')).toBeInTheDocument();
    });

    it('handles special characters in displayLabel', () => {
      const specialCharsChip: FilterChip = {
        id: 'special-1',
        field: 'name' as any,
        value: '!@#$%^&*()',
        displayLabel: 'Special: !@#$%^&*()',
      };

      render(<GlossaryFilterChip chip={specialCharsChip} onRemove={mockOnRemove} />);

      expect(screen.getByText('Special:')).toBeInTheDocument();
      expect(screen.getByText('!@#$%^&*()')).toBeInTheDocument();
    });

    it('handles unicode characters in displayLabel', () => {
      const unicodeChip: FilterChip = {
        id: 'unicode-1',
        field: 'name' as any,
        value: '日本語テスト',
        displayLabel: 'Language: 日本語テスト',
      };

      render(<GlossaryFilterChip chip={unicodeChip} onRemove={mockOnRemove} />);

      expect(screen.getByText('Language:')).toBeInTheDocument();
      expect(screen.getByText('日本語テスト')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('renders Box container for OR chip', () => {
      const orChip: FilterChip = {
        id: 'or-1',
        field: 'name' as any,
        value: 'OR',
        displayLabel: 'OR',
      };

      const { container } = render(<GlossaryFilterChip chip={orChip} onRemove={mockOnRemove} />);

      expect(container.querySelector('.MuiBox-root')).toBeInTheDocument();
    });

    it('renders Box container for regular chip', () => {
      const regularChip: FilterChip = {
        id: 'regular-1',
        field: 'name' as any,
        value: 'Test',
        displayLabel: 'Name: Test',
      };

      const { container } = render(<GlossaryFilterChip chip={regularChip} onRemove={mockOnRemove} />);

      expect(container.querySelector('.MuiBox-root')).toBeInTheDocument();
    });

    it('renders IconButton with small size', () => {
      const chip: FilterChip = {
        id: 'chip-1',
        field: 'name' as any,
        value: 'Test',
        displayLabel: 'Name: Test',
      };

      render(<GlossaryFilterChip chip={chip} onRemove={mockOnRemove} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('MuiIconButton-sizeSmall');
    });
  });

  describe('Multiple Clicks', () => {
    it('calls onRemove each time close button is clicked', async () => {
      const user = userEvent.setup();
      const chip: FilterChip = {
        id: 'multi-click-1',
        field: 'name' as any,
        value: 'Test',
        displayLabel: 'Name: Test',
      };

      render(<GlossaryFilterChip chip={chip} onRemove={mockOnRemove} />);

      const closeButton = screen.getByRole('button');
      await user.click(closeButton);
      await user.click(closeButton);
      await user.click(closeButton);

      expect(mockOnRemove).toHaveBeenCalledTimes(3);
      expect(mockOnRemove).toHaveBeenCalledWith('multi-click-1');
    });
  });

  describe('Different Chip IDs', () => {
    it('passes correct chip id for different chips', async () => {
      const user = userEvent.setup();

      const chip1: FilterChip = {
        id: 'unique-id-abc',
        field: 'name' as any,
        value: 'Value1',
        displayLabel: 'Name: Value1',
      };

      const chip2: FilterChip = {
        id: 'unique-id-xyz',
        field: 'description' as any,
        value: 'Value2',
        displayLabel: 'Description: Value2',
      };

      const { rerender } = render(<GlossaryFilterChip chip={chip1} onRemove={mockOnRemove} />);

      const closeButton1 = screen.getByRole('button');
      await user.click(closeButton1);
      expect(mockOnRemove).toHaveBeenCalledWith('unique-id-abc');

      rerender(<GlossaryFilterChip chip={chip2} onRemove={mockOnRemove} />);

      const closeButton2 = screen.getByRole('button');
      await user.click(closeButton2);
      expect(mockOnRemove).toHaveBeenCalledWith('unique-id-xyz');
    });
  });

  describe('Default Export', () => {
    it('exports the component as default', () => {
      expect(GlossaryFilterChip).toBeDefined();
      expect(typeof GlossaryFilterChip).toBe('function');
    });
  });

  describe('Rerender with Different Props', () => {
    it('updates display when chip prop changes', () => {
      const chip1: FilterChip = {
        id: 'chip-1',
        field: 'name' as any,
        value: 'Initial',
        displayLabel: 'Name: Initial',
      };

      const chip2: FilterChip = {
        id: 'chip-2',
        field: 'description' as any,
        value: 'Updated',
        displayLabel: 'Description: Updated',
      };

      const { rerender } = render(<GlossaryFilterChip chip={chip1} onRemove={mockOnRemove} />);

      expect(screen.getByText('Name:')).toBeInTheDocument();
      expect(screen.getByText('Initial')).toBeInTheDocument();

      rerender(<GlossaryFilterChip chip={chip2} onRemove={mockOnRemove} />);

      expect(screen.getByText('Description:')).toBeInTheDocument();
      expect(screen.getByText('Updated')).toBeInTheDocument();
    });

    it('switches between OR and regular chip on rerender', () => {
      const orChip: FilterChip = {
        id: 'or-1',
        field: 'name' as any,
        value: 'OR',
        displayLabel: 'OR',
      };

      const regularChip: FilterChip = {
        id: 'regular-1',
        field: 'name' as any,
        value: 'Test',
        displayLabel: 'Name: Test',
      };

      const { rerender } = render(<GlossaryFilterChip chip={orChip} onRemove={mockOnRemove} />);

      expect(screen.getByText('OR')).toBeInTheDocument();
      expect(screen.queryByText('Name:')).not.toBeInTheDocument();

      rerender(<GlossaryFilterChip chip={regularChip} onRemove={mockOnRemove} />);

      expect(screen.getByText('Name:')).toBeInTheDocument();
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });

  describe('showFieldLabel variations', () => {
    it('shows field label when showFieldLabel is undefined', () => {
      const chip: FilterChip = {
        id: 'chip-undefined',
        field: 'name' as any,
        value: 'Value',
        displayLabel: 'Name: Value',
        // showFieldLabel is undefined
      };

      render(<GlossaryFilterChip chip={chip} onRemove={mockOnRemove} />);

      expect(screen.getByText('Name:')).toBeInTheDocument();
      expect(screen.getByText('Value')).toBeInTheDocument();
    });

    it('shows field label when showFieldLabel is explicitly true', () => {
      const chip: FilterChip = {
        id: 'chip-true',
        field: 'name' as any,
        value: 'Value',
        displayLabel: 'Name: Value',
        showFieldLabel: true,
      };

      render(<GlossaryFilterChip chip={chip} onRemove={mockOnRemove} />);

      expect(screen.getByText('Name:')).toBeInTheDocument();
      expect(screen.getByText('Value')).toBeInTheDocument();
    });

    it('hides field label when showFieldLabel is false', () => {
      const chip: FilterChip = {
        id: 'chip-false',
        field: 'name' as any,
        value: 'Value',
        displayLabel: 'Name: Value',
        showFieldLabel: false,
      };

      render(<GlossaryFilterChip chip={chip} onRemove={mockOnRemove} />);

      // Full display label shown as single element
      expect(screen.getByText('Name: Value')).toBeInTheDocument();
      // Should not be split
      const allTypographies = document.querySelectorAll('.MuiTypography-root');
      expect(allTypographies.length).toBe(1);
    });
  });

  describe('Long Text Handling', () => {
    it('renders long field labels', () => {
      const chip: FilterChip = {
        id: 'long-field',
        field: 'name' as any,
        value: 'Short',
        displayLabel: 'This Is A Very Long Field Name That Should Still Render: Short',
      };

      render(<GlossaryFilterChip chip={chip} onRemove={mockOnRemove} />);

      expect(screen.getByText('This Is A Very Long Field Name That Should Still Render:')).toBeInTheDocument();
      expect(screen.getByText('Short')).toBeInTheDocument();
    });

    it('renders long values', () => {
      const chip: FilterChip = {
        id: 'long-value',
        field: 'name' as any,
        value: 'This is a very long value that contains lots of text and should render properly',
        displayLabel: 'Name: This is a very long value that contains lots of text and should render properly',
      };

      render(<GlossaryFilterChip chip={chip} onRemove={mockOnRemove} />);

      expect(screen.getByText('Name:')).toBeInTheDocument();
      expect(screen.getByText('This is a very long value that contains lots of text and should render properly')).toBeInTheDocument();
    });
  });
});
