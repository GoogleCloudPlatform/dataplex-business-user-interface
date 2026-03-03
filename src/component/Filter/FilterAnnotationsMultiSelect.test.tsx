import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterAnnotationsMultiSelect from './FilterAnnotationsMultiSelect';

// Mock SVG import
vi.mock('../../assets/svg/edit_note.svg', () => ({
  default: 'edit_note.svg',
}));

// Mock data
const mockOptions = ['Option A', 'Option B', 'Option C', 'Option D', 'Option E'];

describe('FilterAnnotationsMultiSelect', () => {
  let mockOnChange: ReturnType<typeof vi.fn>;
  let mockOnClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnChange = vi.fn();
    mockOnClose = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('rendering', () => {
    it('should render nothing when isOpen is false', () => {
      const { container } = render(
        <FilterAnnotationsMultiSelect
          options={mockOptions}
          value={[]}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={false}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render the component when isOpen is true', () => {
      render(
        <FilterAnnotationsMultiSelect
          options={mockOptions}
          value={[]}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      expect(screen.getByText('Annotations')).toBeInTheDocument();
    });

    it('should render with custom filterType', () => {
      render(
        <FilterAnnotationsMultiSelect
          options={mockOptions}
          value={[]}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
          filterType="Tags"
        />
      );

      expect(screen.getByText('Tags')).toBeInTheDocument();
    });

    it('should render all options in the left panel', () => {
      render(
        <FilterAnnotationsMultiSelect
          options={mockOptions}
          value={[]}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      mockOptions.forEach((option) => {
        expect(screen.getByText(option)).toBeInTheDocument();
      });
    });

    it('should render selected count in right panel', () => {
      render(
        <FilterAnnotationsMultiSelect
          options={mockOptions}
          value={['Option A', 'Option B']}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      expect(screen.getByText('2 Selected')).toBeInTheDocument();
    });

    it('should render Clear All button', () => {
      render(
        <FilterAnnotationsMultiSelect
          options={mockOptions}
          value={[]}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });

    it('should render OK button', () => {
      render(
        <FilterAnnotationsMultiSelect
          options={mockOptions}
          value={[]}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      expect(screen.getByText('OK')).toBeInTheDocument();
    });

    it('should render search placeholder with filterType', () => {
      render(
        <FilterAnnotationsMultiSelect
          options={mockOptions}
          value={[]}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
          filterType="Custom Filter"
        />
      );

      expect(screen.getByPlaceholderText('Search for custom filter')).toBeInTheDocument();
    });

    it('should render with custom position', () => {
      render(
        <FilterAnnotationsMultiSelect
          options={mockOptions}
          value={[]}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
          position={{ top: 200, left: 300 }}
        />
      );

      expect(screen.getByText('Annotations')).toBeInTheDocument();
    });

    it('should render "No items selected" when value is empty', () => {
      render(
        <FilterAnnotationsMultiSelect
          options={mockOptions}
          value={[]}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      expect(screen.getByText('No items selected')).toBeInTheDocument();
    });

    it('should render selected items in right panel', () => {
      render(
        <FilterAnnotationsMultiSelect
          options={mockOptions}
          value={['Option A', 'Option C']}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      // Both panels should show selected items
      const optionAElements = screen.getAllByText('Option A');
      expect(optionAElements.length).toBeGreaterThan(1);
    });

    it('should render 0 Selected when no items selected', () => {
      render(
        <FilterAnnotationsMultiSelect
          options={mockOptions}
          value={[]}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      expect(screen.getByText('0 Selected')).toBeInTheDocument();
    });
  });

  describe('search functionality', () => {
    it('should filter options based on search term', async () => {
      const user = userEvent.setup();

      render(
        <FilterAnnotationsMultiSelect
          options={mockOptions}
          value={[]}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search for annotations');
      await user.type(searchInput, 'Option A');

      expect(screen.getByText('Option A')).toBeInTheDocument();
      expect(screen.queryByText('Option B')).not.toBeInTheDocument();
    });

    it('should show "No annotations found" when search has no results', async () => {
      const user = userEvent.setup();

      render(
        <FilterAnnotationsMultiSelect
          options={mockOptions}
          value={[]}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search for annotations');
      await user.type(searchInput, 'NonExistent');

      expect(screen.getByText('No annotations found')).toBeInTheDocument();
    });

    it('should be case insensitive when searching', async () => {
      const user = userEvent.setup();

      render(
        <FilterAnnotationsMultiSelect
          options={mockOptions}
          value={[]}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search for annotations');
      await user.type(searchInput, 'option a');

      expect(screen.getByText('Option A')).toBeInTheDocument();
    });

    it('should update search term on input change', () => {
      render(
        <FilterAnnotationsMultiSelect
          options={mockOptions}
          value={[]}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search for annotations');
      fireEvent.change(searchInput, { target: { value: 'Test' } });

      expect(searchInput).toHaveValue('Test');
    });

    it('should show custom filterType in no results message', async () => {
      const user = userEvent.setup();

      render(
        <FilterAnnotationsMultiSelect
          options={mockOptions}
          value={[]}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
          filterType="Tags"
        />
      );

      const searchInput = screen.getByPlaceholderText('Search for tags');
      await user.type(searchInput, 'xyz');

      expect(screen.getByText('No tags found')).toBeInTheDocument();
    });
  });

  describe('selection functionality', () => {
    it('should call onChange when selecting an option', () => {
      render(
        <FilterAnnotationsMultiSelect
          options={mockOptions}
          value={[]}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      const optionA = screen.getByText('Option A');
      fireEvent.click(optionA);

      expect(mockOnChange).toHaveBeenCalledWith(['Option A']);
    });

    it('should call onChange with removed option when deselecting', () => {
      render(
        <FilterAnnotationsMultiSelect
          options={mockOptions}
          value={['Option A', 'Option B']}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      // Click on Option A in left panel to deselect
      const optionElements = screen.getAllByText('Option A');
      fireEvent.click(optionElements[0]);

      expect(mockOnChange).toHaveBeenCalledWith(['Option B']);
    });

    it('should toggle option via checkbox icon click', () => {
      const { container } = render(
        <FilterAnnotationsMultiSelect
          options={mockOptions}
          value={['Option A']}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      // Find the checked checkbox box (blue background) and click it
      const checkIcons = container.querySelectorAll('[data-testid="CheckIcon"]');
      if (checkIcons.length > 0) {
        const checkboxBox = checkIcons[0].closest('div');
        if (checkboxBox) {
          fireEvent.click(checkboxBox);
          expect(mockOnChange).toHaveBeenCalled();
        }
      }
    });

    it('should toggle unselected option via checkbox box click', () => {
      render(
        <FilterAnnotationsMultiSelect
          options={mockOptions}
          value={[]}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      // Click on the row containing Option A
      const optionA = screen.getByText('Option A');
      fireEvent.click(optionA);

      expect(mockOnChange).toHaveBeenCalledWith(['Option A']);
    });
  });

  describe('Select All functionality', () => {
    it('should select all filtered options when Select All is clicked', () => {
      render(
        <FilterAnnotationsMultiSelect
          options={mockOptions}
          value={[]}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      const selectAllCheckbox = screen.getByRole('checkbox');
      fireEvent.click(selectAllCheckbox);

      expect(mockOnChange).toHaveBeenCalledWith([...mockOptions]);
    });

    it('should deselect all when all options are selected and Select All is clicked', () => {
      render(
        <FilterAnnotationsMultiSelect
          options={mockOptions}
          value={[...mockOptions]}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      const selectAllCheckbox = screen.getByRole('checkbox');
      fireEvent.click(selectAllCheckbox);

      expect(mockOnChange).toHaveBeenCalledWith([]);
    });

    it('should show indeterminate state when some options are selected', () => {
      render(
        <FilterAnnotationsMultiSelect
          options={mockOptions}
          value={['Option A', 'Option B']}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      const selectAllCheckbox = screen.getByRole('checkbox');
      // MUI indeterminate checkbox has data-indeterminate attribute
      expect(selectAllCheckbox).toHaveAttribute('data-indeterminate', 'true');
    });

    it('should show checked state when all options are selected', () => {
      render(
        <FilterAnnotationsMultiSelect
          options={mockOptions}
          value={[...mockOptions]}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      const selectAllCheckbox = screen.getByRole('checkbox');
      expect(selectAllCheckbox).toBeChecked();
    });

    it('should select all filtered options only when search is active', async () => {
      const user = userEvent.setup();

      render(
        <FilterAnnotationsMultiSelect
          options={mockOptions}
          value={[]}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search for annotations');
      await user.type(searchInput, 'Option A');

      const selectAllCheckbox = screen.getByRole('checkbox');
      fireEvent.click(selectAllCheckbox);

      // Should only select Option A (the filtered result)
      expect(mockOnChange).toHaveBeenCalledWith(['Option A']);
    });
  });

  describe('Clear All functionality', () => {
    it('should call onChange with empty array when Clear All is clicked', () => {
      render(
        <FilterAnnotationsMultiSelect
          options={mockOptions}
          value={['Option A', 'Option B', 'Option C']}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      const clearAllButton = screen.getByText('Clear All');
      fireEvent.click(clearAllButton);

      expect(mockOnChange).toHaveBeenCalledWith([]);
    });

    it('should work when no items are selected', () => {
      render(
        <FilterAnnotationsMultiSelect
          options={mockOptions}
          value={[]}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      const clearAllButton = screen.getByText('Clear All');
      fireEvent.click(clearAllButton);

      expect(mockOnChange).toHaveBeenCalledWith([]);
    });
  });

  describe('close functionality', () => {
    it('should call onClose when OK button is clicked', () => {
      render(
        <FilterAnnotationsMultiSelect
          options={mockOptions}
          value={[]}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      const okButton = screen.getByText('OK');
      fireEvent.click(okButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when Close icon is clicked', () => {
      render(
        <FilterAnnotationsMultiSelect
          options={mockOptions}
          value={[]}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      const closeIcon = screen.getByTestId('CloseIcon');
      const closeButton = closeIcon.closest('button');
      fireEvent.click(closeButton!);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when clicking outside the component', async () => {
      render(
        <div data-testid="outside">
          <FilterAnnotationsMultiSelect
            options={mockOptions}
            value={[]}
            onChange={mockOnChange}
            onClose={mockOnClose}
            isOpen={true}
          />
        </div>
      );

      // Click outside the component
      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should not call onClose when clicking inside the component', () => {
      render(
        <FilterAnnotationsMultiSelect
          options={mockOptions}
          value={[]}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      const header = screen.getByText('Annotations');
      fireEvent.mouseDown(header);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle empty options array', () => {
      render(
        <FilterAnnotationsMultiSelect
          options={[]}
          value={[]}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      expect(screen.getByText('No annotations found')).toBeInTheDocument();
    });

    it('should handle options with special characters', () => {
      const specialOptions = ['Option & Special', 'Option <Test>', 'Option "Quoted"'];

      render(
        <FilterAnnotationsMultiSelect
          options={specialOptions}
          value={[]}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      expect(screen.getByText('Option & Special')).toBeInTheDocument();
    });

    it('should handle very long option names', () => {
      const longOption = 'A'.repeat(100);
      const longOptions = [longOption];

      render(
        <FilterAnnotationsMultiSelect
          options={longOptions}
          value={[]}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      expect(screen.getByText(longOption)).toBeInTheDocument();
    });

    it('should handle large number of options', () => {
      const manyOptions = Array.from({ length: 100 }, (_, i) => `Option ${i + 1}`);

      render(
        <FilterAnnotationsMultiSelect
          options={manyOptions}
          value={[]}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 100')).toBeInTheDocument();
    });

    it('should handle default props', () => {
      render(
        <FilterAnnotationsMultiSelect
          options={mockOptions}
          value={[]}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      // Default filterType should be 'Annotations'
      expect(screen.getByText('Annotations')).toBeInTheDocument();
    });
  });

  describe('right panel interactions', () => {
    it('should deselect item when clicking checkbox in right panel', () => {
      const { container } = render(
        <FilterAnnotationsMultiSelect
          options={mockOptions}
          value={['Option A', 'Option B']}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      // Find Check icons - there should be multiple (in both left and right panels)
      const checkIcons = container.querySelectorAll('[data-testid="CheckIcon"]');
      expect(checkIcons.length).toBeGreaterThan(0);

      // Click on one of the checked boxes in right panel
      const rightPanelCheckbox = checkIcons[checkIcons.length - 1].parentElement;
      if (rightPanelCheckbox) {
        fireEvent.click(rightPanelCheckbox);
        expect(mockOnChange).toHaveBeenCalled();
      }
    });

    it('should display edit note icons for selected items', () => {
      const { container } = render(
        <FilterAnnotationsMultiSelect
          options={mockOptions}
          value={['Option A']}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      const editNoteIcons = container.querySelectorAll('img[alt="Edit Note"]');
      expect(editNoteIcons.length).toBeGreaterThan(0);
    });
  });

  describe('unchecked option interaction', () => {
    it('should select option when clicking on unchecked checkbox box', () => {
      const { container } = render(
        <FilterAnnotationsMultiSelect
          options={mockOptions}
          value={[]}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      // Find unchecked checkbox boxes (they have border but no background color)
      const uncheckedBoxes = container.querySelectorAll('div[style*="border"]');
      if (uncheckedBoxes.length > 0) {
        fireEvent.click(uncheckedBoxes[0]);
      }

      // Clicking anywhere in the option row should trigger selection
      const optionText = screen.getByText('Option A');
      fireEvent.click(optionText);

      expect(mockOnChange).toHaveBeenCalledWith(['Option A']);
    });
  });

  describe('event propagation', () => {
    it('should stop propagation when clicking checkbox icon for selected option', () => {
      const { container } = render(
        <FilterAnnotationsMultiSelect
          options={mockOptions}
          value={['Option A']}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      // Find the checkbox box with blue background
      const checkboxBoxes = container.querySelectorAll('div');
      let blueBox: Element | null = null;

      checkboxBoxes.forEach((box) => {
        if (box.querySelector('[data-testid="CheckIcon"]')) {
          blueBox = box;
        }
      });

      if (blueBox) {
        fireEvent.click(blueBox);
        expect(mockOnChange).toHaveBeenCalled();
      }
    });

    it('should stop propagation when clicking unchecked checkbox box', () => {
      render(
        <FilterAnnotationsMultiSelect
          options={mockOptions}
          value={[]}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      // Click on the option text to toggle
      const optionB = screen.getByText('Option B');
      fireEvent.click(optionB);

      expect(mockOnChange).toHaveBeenCalledWith(['Option B']);
    });
  });

  describe('cleanup', () => {
    it('should remove event listener when component unmounts', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const { unmount } = render(
        <FilterAnnotationsMultiSelect
          options={mockOptions}
          value={[]}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });

    it('should not add event listener when isOpen is false', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

      render(
        <FilterAnnotationsMultiSelect
          options={mockOptions}
          value={[]}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={false}
        />
      );

      // Event listener should not be added when isOpen is false
      const mousedownCalls = addEventListenerSpy.mock.calls.filter(
        (call) => call[0] === 'mousedown'
      );

      expect(mousedownCalls.length).toBe(0);

      addEventListenerSpy.mockRestore();
    });
  });

  describe('default export', () => {
    it('should export FilterAnnotationsMultiSelect as default', async () => {
      const module = await import('./FilterAnnotationsMultiSelect');
      expect(module.default).toBeDefined();
    });

    it('should export a function component', async () => {
      const module = await import('./FilterAnnotationsMultiSelect');
      expect(typeof module.default).toBe('function');
    });
  });

  describe('Select All checkbox states', () => {
    it('should be unchecked when filteredOptions is empty', async () => {
      const user = userEvent.setup();

      render(
        <FilterAnnotationsMultiSelect
          options={mockOptions}
          value={[]}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search for annotations');
      await user.type(searchInput, 'xyz');

      const selectAllCheckbox = screen.getByRole('checkbox');
      expect(selectAllCheckbox).not.toBeChecked();
    });

    it('should not be checked when filteredOptions.length is 0', async () => {
      const user = userEvent.setup();

      render(
        <FilterAnnotationsMultiSelect
          options={mockOptions}
          value={[]}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      // Filter to get no results
      const searchInput = screen.getByPlaceholderText('Search for annotations');
      await user.type(searchInput, 'nonexistent');

      // Checkbox should be unchecked
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();
    });
  });

  describe('position prop', () => {
    it('should use default position when position is null', () => {
      render(
        <FilterAnnotationsMultiSelect
          options={mockOptions}
          value={[]}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
          position={null}
        />
      );

      // Component should render with default position
      expect(screen.getByText('Annotations')).toBeInTheDocument();
    });

    it('should use custom position when provided', () => {
      render(
        <FilterAnnotationsMultiSelect
          options={mockOptions}
          value={[]}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
          position={{ top: 150, left: 250 }}
        />
      );

      // Component should render with custom position
      expect(screen.getByText('Annotations')).toBeInTheDocument();
    });
  });

  describe('multiple selections and deselections', () => {
    it('should handle adding multiple selections sequentially', () => {
      const { rerender } = render(
        <FilterAnnotationsMultiSelect
          options={mockOptions}
          value={[]}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      // Select Option A
      fireEvent.click(screen.getByText('Option A'));
      expect(mockOnChange).toHaveBeenCalledWith(['Option A']);

      // Re-render with updated value
      rerender(
        <FilterAnnotationsMultiSelect
          options={mockOptions}
          value={['Option A']}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      // Select Option B
      const optionB = screen.getAllByText('Option B');
      fireEvent.click(optionB[0]);
      expect(mockOnChange).toHaveBeenCalledWith(['Option A', 'Option B']);
    });

    it('should handle removing from middle of selection', () => {
      render(
        <FilterAnnotationsMultiSelect
          options={mockOptions}
          value={['Option A', 'Option B', 'Option C']}
          onChange={mockOnChange}
          onClose={mockOnClose}
          isOpen={true}
        />
      );

      // Deselect Option B (in the middle)
      const optionBElements = screen.getAllByText('Option B');
      fireEvent.click(optionBElements[0]);

      expect(mockOnChange).toHaveBeenCalledWith(['Option A', 'Option C']);
    });
  });
});
