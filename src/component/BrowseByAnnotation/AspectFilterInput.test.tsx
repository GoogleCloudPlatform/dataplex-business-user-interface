import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AspectFilterInput from './AspectFilterInput';
import { type AspectFilterChip } from './AspectFilterTypes';

// Helper to open dropdown reliably via focus
const openDropdown = (input: HTMLElement) => {
  fireEvent.focus(input);
};

describe('AspectFilterInput', () => {
  const mockOnFiltersChange = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render the search input with default placeholder', () => {
      render(<AspectFilterInput filters={[]} onFiltersChange={mockOnFiltersChange} />);
      expect(screen.getByPlaceholderText('Filter Aspects')).toBeInTheDocument();
    });

    it('should render with custom placeholder', () => {
      render(
        <AspectFilterInput
          filters={[]}
          onFiltersChange={mockOnFiltersChange}
          placeholder="Custom Placeholder"
        />
      );
      expect(screen.getByPlaceholderText('Custom Placeholder')).toBeInTheDocument();
    });

    it('should render search icon', () => {
      const { container } = render(
        <AspectFilterInput filters={[]} onFiltersChange={mockOnFiltersChange} />
      );
      expect(container.querySelector('[data-testid="SearchIcon"]')).toBeInTheDocument();
    });

    it('should show "Add filter..." placeholder when filters exist', () => {
      const filters: AspectFilterChip[] = [
        { id: 'f1', field: 'name_contains', value: 'test', displayLabel: 'Name contains: test', showFieldLabel: true },
      ];
      render(<AspectFilterInput filters={filters} onFiltersChange={mockOnFiltersChange} />);
      expect(screen.getByPlaceholderText('Add filter...')).toBeInTheDocument();
    });
  });

  describe('dropdown', () => {
    it('should show dropdown on focus', () => {
      render(<AspectFilterInput filters={[]} onFiltersChange={mockOnFiltersChange} />);
      const input = screen.getByPlaceholderText('Filter Aspects');
      openDropdown(input);

      expect(screen.getByText('Name contains')).toBeInTheDocument();
      expect(screen.getByText('Name prefix')).toBeInTheDocument();
      expect(screen.getByText('Location')).toBeInTheDocument();
      expect(screen.getByText('Created on')).toBeInTheDocument();
      expect(screen.getByText('Created before')).toBeInTheDocument();
      expect(screen.getByText('Created after')).toBeInTheDocument();
    });

    it('should have exactly 6 filter field options', () => {
      render(<AspectFilterInput filters={[]} onFiltersChange={mockOnFiltersChange} />);
      const input = screen.getByPlaceholderText('Filter Aspects');
      openDropdown(input);

      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems).toHaveLength(6);
    });

    it('should show OR option when filters exist and last is not OR', () => {
      const filters: AspectFilterChip[] = [
        { id: 'f1', field: 'name_contains', value: 'test', displayLabel: 'Name contains: test', showFieldLabel: true },
      ];
      render(<AspectFilterInput filters={filters} onFiltersChange={mockOnFiltersChange} />);
      const input = screen.getByPlaceholderText('Add filter...');
      openDropdown(input);

      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems).toHaveLength(7); // OR + 6 fields
      expect(screen.getByText('OR')).toBeInTheDocument();
    });

    it('should not show OR option when last filter is OR', () => {
      const filters: AspectFilterChip[] = [
        { id: 'f1', field: 'name_contains', value: 'test', displayLabel: 'Name contains: test', showFieldLabel: true },
        { id: 'or-1', field: 'name_contains', value: 'OR', displayLabel: 'OR', connector: 'OR' },
      ];
      render(<AspectFilterInput filters={filters} onFiltersChange={mockOnFiltersChange} />);
      const input = screen.getByPlaceholderText('Add filter...');
      openDropdown(input);

      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems).toHaveLength(6);
    });

    it('should hide dropdown when typing', async () => {
      render(<AspectFilterInput filters={[]} onFiltersChange={mockOnFiltersChange} />);
      const input = screen.getByPlaceholderText('Filter Aspects');
      openDropdown(input);

      expect(screen.getByText('Name contains')).toBeInTheDocument();

      // Type something - this hides the dropdown
      fireEvent.change(input, { target: { value: 'a' } });

      expect(screen.queryByText('Name prefix')).not.toBeInTheDocument();
    });

    it('should select a field from dropdown and show field label', () => {
      render(<AspectFilterInput filters={[]} onFiltersChange={mockOnFiltersChange} />);
      const input = screen.getByPlaceholderText('Filter Aspects');
      openDropdown(input);

      fireEvent.click(screen.getByText('Location'));

      expect(screen.getByText('Location:')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter Location value...')).toBeInTheDocument();
    });

    it('should add OR connector when OR is clicked', () => {
      const filters: AspectFilterChip[] = [
        { id: 'f1', field: 'name_contains', value: 'test', displayLabel: 'Name contains: test', showFieldLabel: true },
      ];
      render(<AspectFilterInput filters={filters} onFiltersChange={mockOnFiltersChange} />);
      const input = screen.getByPlaceholderText('Add filter...');
      openDropdown(input);

      fireEvent.click(screen.getByText('OR'));

      expect(mockOnFiltersChange).toHaveBeenCalled();
      const calledWith = mockOnFiltersChange.mock.calls[0][0];
      expect(calledWith).toHaveLength(2);
      expect(calledWith[1].connector).toBe('OR');
    });

    it('should close dropdown on click away', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <button data-testid="outside">Outside</button>
          <AspectFilterInput filters={[]} onFiltersChange={mockOnFiltersChange} />
        </div>
      );
      const input = screen.getByPlaceholderText('Filter Aspects');
      openDropdown(input);

      expect(screen.getByText('Name contains')).toBeInTheDocument();

      // Click outside triggers ClickAwayListener
      await user.click(screen.getByTestId('outside'));

      await waitFor(() => {
        expect(screen.queryByText('Name contains')).not.toBeInTheDocument();
      });
    });
  });

  describe('keyboard interactions', () => {
    it('should create a filter chip on Enter with selected field', () => {
      render(<AspectFilterInput filters={[]} onFiltersChange={mockOnFiltersChange} />);
      const input = screen.getByPlaceholderText('Filter Aspects');
      openDropdown(input);

      fireEvent.click(screen.getByText('Location'));

      const fieldInput = screen.getByPlaceholderText('Enter Location value...');
      fireEvent.change(fieldInput, { target: { value: 'us-central1' } });
      fireEvent.keyDown(fieldInput, { key: 'Enter' });

      expect(mockOnFiltersChange).toHaveBeenCalled();
      const calledWith = mockOnFiltersChange.mock.calls[0][0];
      expect(calledWith[0].field).toBe('location');
      expect(calledWith[0].value).toBe('us-central1');
    });

    it('should default to name_contains when no field is selected', async () => {
      const user = userEvent.setup();
      render(<AspectFilterInput filters={[]} onFiltersChange={mockOnFiltersChange} />);

      const input = screen.getByPlaceholderText('Filter Aspects');
      await user.type(input, 'test value');
      await user.keyboard('{Enter}');

      expect(mockOnFiltersChange).toHaveBeenCalled();
      const calledWith = mockOnFiltersChange.mock.calls[0][0];
      expect(calledWith[0].field).toBe('name_contains');
      expect(calledWith[0].value).toBe('test value');
      expect(calledWith[0].showFieldLabel).toBe(false);
    });

    it('should create filter chip on comma key', async () => {
      const user = userEvent.setup();
      render(<AspectFilterInput filters={[]} onFiltersChange={mockOnFiltersChange} />);

      const input = screen.getByPlaceholderText('Filter Aspects');
      await user.type(input, 'test');
      await user.keyboard(',');

      expect(mockOnFiltersChange).toHaveBeenCalled();
    });

    it('should add OR connector when typing "OR" and pressing Enter', async () => {
      const user = userEvent.setup();
      const filters: AspectFilterChip[] = [
        { id: 'f1', field: 'name_contains', value: 'test', displayLabel: 'Name contains: test', showFieldLabel: true },
      ];
      render(<AspectFilterInput filters={filters} onFiltersChange={mockOnFiltersChange} />);

      const input = screen.getByPlaceholderText('Add filter...');
      await user.type(input, 'OR');
      await user.keyboard('{Enter}');

      expect(mockOnFiltersChange).toHaveBeenCalled();
      const calledWith = mockOnFiltersChange.mock.calls[0][0];
      expect(calledWith[1].connector).toBe('OR');
    });

    it('should not add OR when no filters exist', async () => {
      const user = userEvent.setup();
      render(<AspectFilterInput filters={[]} onFiltersChange={mockOnFiltersChange} />);

      const input = screen.getByPlaceholderText('Filter Aspects');
      await user.type(input, 'OR');
      await user.keyboard('{Enter}');

      expect(mockOnFiltersChange).not.toHaveBeenCalled();
    });

    it('should remove last filter on Backspace when input is empty', () => {
      const filters: AspectFilterChip[] = [
        { id: 'f1', field: 'name_contains', value: 'test', displayLabel: 'Name contains: test', showFieldLabel: true },
      ];
      render(<AspectFilterInput filters={filters} onFiltersChange={mockOnFiltersChange} />);

      const input = screen.getByPlaceholderText('Add filter...');
      fireEvent.focus(input);
      fireEvent.keyDown(input, { key: 'Backspace' });

      expect(mockOnFiltersChange).toHaveBeenCalledWith([]);
    });

    it('should clear selected field on Backspace before removing filters', () => {
      render(<AspectFilterInput filters={[]} onFiltersChange={mockOnFiltersChange} />);
      const input = screen.getByPlaceholderText('Filter Aspects');
      openDropdown(input);

      // Select a field
      fireEvent.click(screen.getByText('Location'));
      expect(screen.getByText('Location:')).toBeInTheDocument();

      // Backspace should clear the field
      const fieldInput = screen.getByPlaceholderText('Enter Location value...');
      fireEvent.keyDown(fieldInput, { key: 'Backspace' });

      expect(screen.queryByText('Location:')).not.toBeInTheDocument();
      expect(mockOnFiltersChange).not.toHaveBeenCalled();
    });

    it('should close dropdown and clear field on Escape', () => {
      render(<AspectFilterInput filters={[]} onFiltersChange={mockOnFiltersChange} />);
      const input = screen.getByPlaceholderText('Filter Aspects');
      openDropdown(input);

      expect(screen.getByText('Name contains')).toBeInTheDocument();

      fireEvent.keyDown(input, { key: 'Escape' });

      expect(screen.queryByText('Name contains')).not.toBeInTheDocument();
    });

    it('should not create chip on Enter with empty input', () => {
      render(<AspectFilterInput filters={[]} onFiltersChange={mockOnFiltersChange} />);
      const input = screen.getByPlaceholderText('Filter Aspects');
      fireEvent.focus(input);
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockOnFiltersChange).not.toHaveBeenCalled();
    });
  });

  describe('filter chips display', () => {
    it('should render filter chips when filters are provided', () => {
      const filters: AspectFilterChip[] = [
        { id: 'f1', field: 'name_contains', value: 'test', displayLabel: 'Name contains: test', showFieldLabel: true },
        { id: 'f2', field: 'location', value: 'us', displayLabel: 'Location: us', showFieldLabel: true },
      ];
      render(<AspectFilterInput filters={filters} onFiltersChange={mockOnFiltersChange} />);

      expect(screen.getByText('Name contains:')).toBeInTheDocument();
      expect(screen.getByText('test')).toBeInTheDocument();
      expect(screen.getByText('Location:')).toBeInTheDocument();
      expect(screen.getByText('us')).toBeInTheDocument();
    });

    it('should not render chips container when no filters', () => {
      const { container } = render(
        <AspectFilterInput filters={[]} onFiltersChange={mockOnFiltersChange} />
      );
      const buttons = container.querySelectorAll('button');
      expect(buttons).toHaveLength(0);
    });

    it('should call onFiltersChange when chip is removed', () => {
      const filters: AspectFilterChip[] = [
        { id: 'f1', field: 'name_contains', value: 'test', displayLabel: 'Name contains: test', showFieldLabel: true },
        { id: 'f2', field: 'location', value: 'us', displayLabel: 'Location: us', showFieldLabel: true },
      ];
      render(<AspectFilterInput filters={filters} onFiltersChange={mockOnFiltersChange} />);

      const closeButtons = screen.getAllByRole('button');
      fireEvent.click(closeButtons[0]);

      expect(mockOnFiltersChange).toHaveBeenCalledWith([filters[1]]);
    });
  });

  describe('date field tooltip', () => {
    it('should show date format tooltip when date field is selected and focused', () => {
      render(<AspectFilterInput filters={[]} onFiltersChange={mockOnFiltersChange} />);
      const input = screen.getByPlaceholderText('Filter Aspects');
      openDropdown(input);

      fireEvent.click(screen.getByText('Created on'));

      expect(screen.getByText('Format: YYYY-MM-DD')).toBeInTheDocument();
    });

    it('should show correct placeholder for date field', () => {
      render(<AspectFilterInput filters={[]} onFiltersChange={mockOnFiltersChange} />);
      const input = screen.getByPlaceholderText('Filter Aspects');
      openDropdown(input);

      fireEvent.click(screen.getByText('Created before'));

      expect(screen.getByPlaceholderText('Enter Created before value...')).toBeInTheDocument();
    });

    it('should accept date value and create chip on Enter', () => {
      render(<AspectFilterInput filters={[]} onFiltersChange={mockOnFiltersChange} />);
      const input = screen.getByPlaceholderText('Filter Aspects');
      openDropdown(input);

      fireEvent.click(screen.getByText('Created after'));

      const dateInput = screen.getByPlaceholderText('Enter Created after value...');
      fireEvent.change(dateInput, { target: { value: '2026-01-01' } });
      fireEvent.keyDown(dateInput, { key: 'Enter' });

      expect(mockOnFiltersChange).toHaveBeenCalled();
      const calledWith = mockOnFiltersChange.mock.calls[0][0];
      expect(calledWith[0].field).toBe('created_after');
      expect(calledWith[0].value).toBe('2026-01-01');
    });
  });

  describe('date validation error', () => {
    it('should show error for invalid date format on Enter', () => {
      render(<AspectFilterInput filters={[]} onFiltersChange={mockOnFiltersChange} />);
      const input = screen.getByPlaceholderText('Filter Aspects');
      openDropdown(input);

      fireEvent.click(screen.getByText('Created on'));

      const dateInput = screen.getByPlaceholderText('Enter Created on value...');
      fireEvent.change(dateInput, { target: { value: 'not-a-date' } });
      fireEvent.keyDown(dateInput, { key: 'Enter' });

      expect(screen.getByText('Invalid date. Please use YYYY-MM-DD format.')).toBeInTheDocument();
      expect(mockOnFiltersChange).not.toHaveBeenCalled();
    });

    it('should show error for invalid date like 2024-02-30', () => {
      render(<AspectFilterInput filters={[]} onFiltersChange={mockOnFiltersChange} />);
      const input = screen.getByPlaceholderText('Filter Aspects');
      openDropdown(input);

      fireEvent.click(screen.getByText('Created before'));

      const dateInput = screen.getByPlaceholderText('Enter Created before value...');
      fireEvent.change(dateInput, { target: { value: '2024-02-30' } });
      fireEvent.keyDown(dateInput, { key: 'Enter' });

      expect(screen.getByText('Invalid date. Please use YYYY-MM-DD format.')).toBeInTheDocument();
      expect(mockOnFiltersChange).not.toHaveBeenCalled();
    });

    it('should show error for partial date format like 2024-1-1', () => {
      render(<AspectFilterInput filters={[]} onFiltersChange={mockOnFiltersChange} />);
      const input = screen.getByPlaceholderText('Filter Aspects');
      openDropdown(input);

      fireEvent.click(screen.getByText('Created after'));

      const dateInput = screen.getByPlaceholderText('Enter Created after value...');
      fireEvent.change(dateInput, { target: { value: '2024-1-1' } });
      fireEvent.keyDown(dateInput, { key: 'Enter' });

      expect(screen.getByText('Invalid date. Please use YYYY-MM-DD format.')).toBeInTheDocument();
      expect(mockOnFiltersChange).not.toHaveBeenCalled();
    });

    it('should clear error when user types', () => {
      render(<AspectFilterInput filters={[]} onFiltersChange={mockOnFiltersChange} />);
      const input = screen.getByPlaceholderText('Filter Aspects');
      openDropdown(input);

      fireEvent.click(screen.getByText('Created on'));

      const dateInput = screen.getByPlaceholderText('Enter Created on value...');
      fireEvent.change(dateInput, { target: { value: 'bad' } });
      fireEvent.keyDown(dateInput, { key: 'Enter' });

      expect(screen.getByText('Invalid date. Please use YYYY-MM-DD format.')).toBeInTheDocument();

      fireEvent.change(dateInput, { target: { value: '2026' } });

      expect(screen.queryByText('Invalid date. Please use YYYY-MM-DD format.')).not.toBeInTheDocument();
    });

    it('should clear error when field is changed via dropdown', () => {
      render(<AspectFilterInput filters={[]} onFiltersChange={mockOnFiltersChange} />);
      const input = screen.getByPlaceholderText('Filter Aspects');
      openDropdown(input);

      fireEvent.click(screen.getByText('Created on'));

      const dateInput = screen.getByPlaceholderText('Enter Created on value...');
      fireEvent.change(dateInput, { target: { value: 'bad' } });
      fireEvent.keyDown(dateInput, { key: 'Enter' });

      expect(screen.getByText('Invalid date. Please use YYYY-MM-DD format.')).toBeInTheDocument();

      // Backspace to clear field, then select a different one
      fireEvent.change(dateInput, { target: { value: '' } });
      fireEvent.keyDown(dateInput, { key: 'Backspace' });

      expect(screen.queryByText('Invalid date. Please use YYYY-MM-DD format.')).not.toBeInTheDocument();
    });

    it('should clear error on Escape', () => {
      render(<AspectFilterInput filters={[]} onFiltersChange={mockOnFiltersChange} />);
      const input = screen.getByPlaceholderText('Filter Aspects');
      openDropdown(input);

      fireEvent.click(screen.getByText('Created on'));

      const dateInput = screen.getByPlaceholderText('Enter Created on value...');
      fireEvent.change(dateInput, { target: { value: 'bad' } });
      fireEvent.keyDown(dateInput, { key: 'Enter' });

      expect(screen.getByText('Invalid date. Please use YYYY-MM-DD format.')).toBeInTheDocument();

      fireEvent.keyDown(dateInput, { key: 'Escape' });

      expect(screen.queryByText('Invalid date. Please use YYYY-MM-DD format.')).not.toBeInTheDocument();
    });

    it('should clear error after submitting a valid date', () => {
      render(<AspectFilterInput filters={[]} onFiltersChange={mockOnFiltersChange} />);
      const input = screen.getByPlaceholderText('Filter Aspects');
      openDropdown(input);

      fireEvent.click(screen.getByText('Created on'));

      const dateInput = screen.getByPlaceholderText('Enter Created on value...');
      fireEvent.change(dateInput, { target: { value: 'bad' } });
      fireEvent.keyDown(dateInput, { key: 'Enter' });

      expect(screen.getByText('Invalid date. Please use YYYY-MM-DD format.')).toBeInTheDocument();

      fireEvent.change(dateInput, { target: { value: '2026-03-15' } });
      fireEvent.keyDown(dateInput, { key: 'Enter' });

      expect(screen.queryByText('Invalid date. Please use YYYY-MM-DD format.')).not.toBeInTheDocument();
      expect(mockOnFiltersChange).toHaveBeenCalled();
    });

    it('should not show error for non-date fields', async () => {
      const user = userEvent.setup();
      render(<AspectFilterInput filters={[]} onFiltersChange={mockOnFiltersChange} />);

      const input = screen.getByPlaceholderText('Filter Aspects');
      await user.type(input, 'not-a-date');
      await user.keyboard('{Enter}');

      expect(screen.queryByText('Invalid date. Please use YYYY-MM-DD format.')).not.toBeInTheDocument();
      expect(mockOnFiltersChange).toHaveBeenCalled();
    });
  });

  describe('blur handling', () => {
    it('should handle blur event', () => {
      render(<AspectFilterInput filters={[]} onFiltersChange={mockOnFiltersChange} />);
      const input = screen.getByPlaceholderText('Filter Aspects');
      fireEvent.focus(input);
      fireEvent.blur(input);

      // After blur, focusing again should reopen dropdown
      fireEvent.focus(input);
      expect(screen.getByText('Name contains')).toBeInTheDocument();
    });
  });

  describe('default export', () => {
    it('should export AspectFilterInput as default', async () => {
      const module = await import('./AspectFilterInput');
      expect(module.default).toBeDefined();
      expect(typeof module.default).toBe('function');
    });
  });
});
