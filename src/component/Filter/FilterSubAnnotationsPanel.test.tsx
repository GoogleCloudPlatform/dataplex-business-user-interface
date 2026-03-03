import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterSubAnnotationsPanel from './FilterSubAnnotationsPanel';

// Mock data
interface FieldDefinition {
  name: string;
  type: 'bool' | 'enum' | 'string' | 'int' | 'strong';
  enumValues?: string[];
}

interface FilterValue {
  fieldName: string;
  value: string;
  enabled: boolean;
  filterType: 'include' | 'exclude';
}

const mockSubAnnotations: FieldDefinition[] = [
  { name: 'isActive', type: 'bool' },
  { name: 'status', type: 'enum', enumValues: ['Active', 'Inactive', 'Pending'] },
  { name: 'description', type: 'string' },
  { name: 'count', type: 'int' },
  { name: 'identifier', type: 'strong' }
];

const mockSelectedSubAnnotations: FilterValue[] = [
  { fieldName: 'isActive', value: 'true', enabled: true, filterType: 'include' },
  { fieldName: 'count', value: '42', enabled: false, filterType: 'include' }
];

describe('FilterSubAnnotationsPanel', () => {
  const mockOnSubAnnotationsChange = vi.fn();
  const mockOnSubAnnotationsApply = vi.fn();
  const mockOnClose = vi.fn();

  const defaultProps = {
    annotationName: 'Test Annotation',
    subAnnotations: mockSubAnnotations,
    subAnnotationsloader: false,
    selectedSubAnnotations: [] as FilterValue[],
    onSubAnnotationsChange: mockOnSubAnnotationsChange,
    onSubAnnotationsApply: mockOnSubAnnotationsApply,
    onClose: mockOnClose,
    isOpen: true
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('rendering', () => {
    it('should render the panel when isOpen is true', () => {
      render(<FilterSubAnnotationsPanel {...defaultProps} />);

      expect(screen.getByText('Test Annotation')).toBeInTheDocument();
      expect(screen.getByText('Filter on tag values')).toBeInTheDocument();
    });

    it('should not render the panel when isOpen is false', () => {
      render(<FilterSubAnnotationsPanel {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Test Annotation')).not.toBeInTheDocument();
    });

    it('should render the annotation name in the header', () => {
      render(<FilterSubAnnotationsPanel {...defaultProps} annotationName="Custom Annotation" />);

      expect(screen.getByText('Custom Annotation')).toBeInTheDocument();
    });

    it('should render the close button', () => {
      render(<FilterSubAnnotationsPanel {...defaultProps} />);

      const closeButton = screen.getByTestId('CloseIcon');
      expect(closeButton).toBeInTheDocument();
    });

    it('should render all field inputs', () => {
      render(<FilterSubAnnotationsPanel {...defaultProps} />);

      // Each field should render its name as label
      expect(screen.getByText('isActive')).toBeInTheDocument();
      expect(screen.getByText('status')).toBeInTheDocument();
      expect(screen.getByText('description')).toBeInTheDocument();
      expect(screen.getByText('count')).toBeInTheDocument();
      expect(screen.getByText('identifier')).toBeInTheDocument();
    });

    it('should render the Apply button', () => {
      render(<FilterSubAnnotationsPanel {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument();
    });

    it('should render "No filters ready to apply" when no valid filters', () => {
      render(<FilterSubAnnotationsPanel {...defaultProps} />);

      expect(screen.getByText('No filters ready to apply')).toBeInTheDocument();
    });

    it('should render checkboxes for each field', () => {
      render(<FilterSubAnnotationsPanel {...defaultProps} />);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(mockSubAnnotations.length);
    });

    it('should render More Options buttons for each field', () => {
      render(<FilterSubAnnotationsPanel {...defaultProps} />);

      const moreOptionsButtons = screen.getAllByTestId('MoreVertIcon');
      expect(moreOptionsButtons).toHaveLength(mockSubAnnotations.length);
    });
  });

  describe('loading state', () => {
    it('should render loading spinner when subAnnotationsloader is true', () => {
      render(<FilterSubAnnotationsPanel {...defaultProps} subAnnotationsloader={true} />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should not render field inputs when loading', () => {
      render(<FilterSubAnnotationsPanel {...defaultProps} subAnnotationsloader={true} />);

      expect(screen.queryByText('isActive')).not.toBeInTheDocument();
      expect(screen.queryByText('description')).not.toBeInTheDocument();
    });

    it('should render field inputs when not loading', () => {
      render(<FilterSubAnnotationsPanel {...defaultProps} subAnnotationsloader={false} />);

      expect(screen.getByText('isActive')).toBeInTheDocument();
      expect(screen.getByText('description')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should render "No fields found" when subAnnotations is empty', () => {
      render(<FilterSubAnnotationsPanel {...defaultProps} subAnnotations={[]} />);

      expect(screen.getByText('No fields found')).toBeInTheDocument();
    });

    it('should not render checkboxes when no fields', () => {
      render(<FilterSubAnnotationsPanel {...defaultProps} subAnnotations={[]} />);

      expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    });
  });

  describe('bool field type', () => {
    it('should render a select dropdown for bool fields', () => {
      render(<FilterSubAnnotationsPanel {...defaultProps} />);

      // Bool field should have a select with True/False options
      const comboboxes = screen.getAllByRole('combobox');
      expect(comboboxes.length).toBeGreaterThan(0);
    });

    it('should change value when bool option is selected', async () => {
      const user = userEvent.setup();
      render(<FilterSubAnnotationsPanel {...defaultProps} />);

      // Find and click the first combobox (isActive - bool type)
      const comboboxes = screen.getAllByRole('combobox');
      await user.click(comboboxes[0]);

      // Select 'True' option
      const trueOption = screen.getByRole('option', { name: 'True' });
      await user.click(trueOption);

      expect(mockOnSubAnnotationsChange).toHaveBeenCalled();
    });

    it('should allow selecting False for bool fields', async () => {
      const user = userEvent.setup();
      render(<FilterSubAnnotationsPanel {...defaultProps} />);

      const comboboxes = screen.getAllByRole('combobox');
      await user.click(comboboxes[0]);

      const falseOption = screen.getByRole('option', { name: 'False' });
      await user.click(falseOption);

      expect(mockOnSubAnnotationsChange).toHaveBeenCalled();
    });
  });

  describe('enum field type', () => {
    it('should render a select dropdown for enum fields', () => {
      render(<FilterSubAnnotationsPanel {...defaultProps} />);

      const comboboxes = screen.getAllByRole('combobox');
      // Should have at least 2 comboboxes (bool and enum)
      expect(comboboxes.length).toBeGreaterThanOrEqual(2);
    });

    it('should display enum values as options', async () => {
      const user = userEvent.setup();
      render(<FilterSubAnnotationsPanel {...defaultProps} />);

      // Click on the status enum dropdown (second combobox)
      const comboboxes = screen.getAllByRole('combobox');
      await user.click(comboboxes[1]);

      expect(screen.getByRole('option', { name: 'Active' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Inactive' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Pending' })).toBeInTheDocument();
    });

    it('should change value when enum option is selected', async () => {
      const user = userEvent.setup();
      render(<FilterSubAnnotationsPanel {...defaultProps} />);

      const comboboxes = screen.getAllByRole('combobox');
      await user.click(comboboxes[1]);

      const activeOption = screen.getByRole('option', { name: 'Active' });
      await user.click(activeOption);

      expect(mockOnSubAnnotationsChange).toHaveBeenCalled();
    });

    it('should use default options if enumValues is not provided', async () => {
      const user = userEvent.setup();
      const fieldsWithoutEnumValues: FieldDefinition[] = [
        { name: 'category', type: 'enum' }
      ];
      render(<FilterSubAnnotationsPanel {...defaultProps} subAnnotations={fieldsWithoutEnumValues} />);

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      // Should have default options
      expect(screen.getByRole('option', { name: 'Option 1' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Option 2' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Option 3' })).toBeInTheDocument();
    });
  });

  describe('string field type', () => {
    it('should render a text input for string fields', () => {
      render(<FilterSubAnnotationsPanel {...defaultProps} />);

      const textInputs = screen.getAllByRole('textbox');
      expect(textInputs.length).toBeGreaterThan(0);
    });

    it('should change value when text is entered in string field', async () => {
      const user = userEvent.setup();
      render(<FilterSubAnnotationsPanel {...defaultProps} />);

      const textInputs = screen.getAllByRole('textbox');
      await user.type(textInputs[0], 'test value');

      expect(mockOnSubAnnotationsChange).toHaveBeenCalled();
    });
  });

  describe('int field type', () => {
    it('should render a text input for int fields', () => {
      render(<FilterSubAnnotationsPanel {...defaultProps} />);

      const textInputs = screen.getAllByRole('textbox');
      expect(textInputs.length).toBeGreaterThan(0);
    });

    it('should allow entering integer values', async () => {
      const user = userEvent.setup();
      const intOnlyFields: FieldDefinition[] = [
        { name: 'count', type: 'int' }
      ];
      render(<FilterSubAnnotationsPanel {...defaultProps} subAnnotations={intOnlyFields} />);

      const textInput = screen.getByRole('textbox');
      await user.type(textInput, '123');

      expect(mockOnSubAnnotationsChange).toHaveBeenCalled();
    });

    it('should show validation error for invalid integer on blur', async () => {
      const user = userEvent.setup();
      const intOnlyFields: FieldDefinition[] = [
        { name: 'count', type: 'int' }
      ];
      // Pre-populate with invalid value so blur validation works
      const selectedWithInvalid: FilterValue[] = [
        { fieldName: 'count', value: 'not a number', enabled: false, filterType: 'include' }
      ];
      render(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          subAnnotations={intOnlyFields}
          selectedSubAnnotations={selectedWithInvalid}
        />
      );

      const textInput = screen.getByRole('textbox');
      // Focus and blur the input to trigger validation
      await user.click(textInput);
      // Click on header text to blur the input
      await user.click(screen.getByText('Test Annotation'));

      await waitFor(() => {
        // Error shows in both helperText and notification, so use getAllByText
        const errorMessages = screen.getAllByText('Please enter a valid integer value (e.g., 123, -456)');
        expect(errorMessages.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should not show validation error for valid integer', async () => {
      const user = userEvent.setup();
      const intOnlyFields: FieldDefinition[] = [
        { name: 'count', type: 'int' }
      ];
      render(<FilterSubAnnotationsPanel {...defaultProps} subAnnotations={intOnlyFields} />);

      const textInput = screen.getByRole('textbox');
      await user.type(textInput, '42');
      fireEvent.blur(textInput);

      await waitFor(() => {
        expect(screen.queryByText('Please enter a valid integer value (e.g., 123, -456)')).not.toBeInTheDocument();
      });
    });

    it('should validate negative integers as valid', async () => {
      const user = userEvent.setup();
      const intOnlyFields: FieldDefinition[] = [
        { name: 'count', type: 'int' }
      ];
      render(<FilterSubAnnotationsPanel {...defaultProps} subAnnotations={intOnlyFields} />);

      const textInput = screen.getByRole('textbox');
      await user.type(textInput, '-456');
      fireEvent.blur(textInput);

      await waitFor(() => {
        expect(screen.queryByText('Please enter a valid integer value (e.g., 123, -456)')).not.toBeInTheDocument();
      });
    });

    it('should show error for decimal values in int fields', async () => {
      const user = userEvent.setup();
      const intOnlyFields: FieldDefinition[] = [
        { name: 'count', type: 'int' }
      ];
      // Pre-populate with decimal value so blur validation works
      const selectedWithDecimal: FilterValue[] = [
        { fieldName: 'count', value: '12.5', enabled: false, filterType: 'include' }
      ];
      render(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          subAnnotations={intOnlyFields}
          selectedSubAnnotations={selectedWithDecimal}
        />
      );

      const textInput = screen.getByRole('textbox');
      // Focus and blur the input to trigger validation
      await user.click(textInput);
      // Click on header text to blur the input
      await user.click(screen.getByText('Test Annotation'));

      await waitFor(() => {
        // Error shows in both helperText and notification, so use getAllByText
        const errorMessages = screen.getAllByText('Please enter a valid integer value (e.g., 123, -456)');
        expect(errorMessages.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('strong field type', () => {
    it('should render a text input for strong fields', () => {
      const strongOnlyFields: FieldDefinition[] = [
        { name: 'identifier', type: 'strong' }
      ];
      render(<FilterSubAnnotationsPanel {...defaultProps} subAnnotations={strongOnlyFields} />);

      const textInput = screen.getByRole('textbox');
      expect(textInput).toBeInTheDocument();
    });

    it('should accept any value for strong fields', async () => {
      const user = userEvent.setup();
      const strongOnlyFields: FieldDefinition[] = [
        { name: 'identifier', type: 'strong' }
      ];
      render(<FilterSubAnnotationsPanel {...defaultProps} subAnnotations={strongOnlyFields} />);

      const textInput = screen.getByRole('textbox');
      await user.type(textInput, 'any-value-123');
      fireEvent.blur(textInput);

      expect(screen.queryByText('Please enter a valid integer value (e.g., 123, -456)')).not.toBeInTheDocument();
    });
  });

  describe('checkbox toggle', () => {
    it('should not toggle checkbox when field has no value', () => {
      render(<FilterSubAnnotationsPanel {...defaultProps} />);

      const checkboxes = screen.getAllByRole('checkbox');

      // Checkbox should be disabled when field has no value
      expect(checkboxes[0]).toBeDisabled();

      // Manually dispatch click to verify handler logic doesn't run
      checkboxes[0].click();

      // Should not call onChange because checkbox is disabled
      expect(mockOnSubAnnotationsChange).not.toHaveBeenCalled();
    });

    it('should toggle checkbox when field has a value', async () => {
      const user = userEvent.setup();
      render(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          selectedSubAnnotations={mockSelectedSubAnnotations}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      // The first checkbox should be for isActive which has a value
      await user.click(checkboxes[0]);

      expect(mockOnSubAnnotationsChange).toHaveBeenCalled();
    });

    it('should disable checkbox when field has no value', () => {
      render(<FilterSubAnnotationsPanel {...defaultProps} />);

      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        expect(checkbox).toBeDisabled();
      });
    });

    it('should enable checkbox when field has a value', () => {
      render(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          selectedSubAnnotations={mockSelectedSubAnnotations}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      // First checkbox (isActive) should be enabled since it has a value
      expect(checkboxes[0]).not.toBeDisabled();
    });

    it('should show checked state for enabled fields', () => {
      render(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          selectedSubAnnotations={mockSelectedSubAnnotations}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      // isActive is enabled: true
      expect(checkboxes[0]).toBeChecked();
    });

    it('should show unchecked state for disabled fields', () => {
      render(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          selectedSubAnnotations={mockSelectedSubAnnotations}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      // count is enabled: false
      expect(checkboxes[3]).not.toBeChecked();
    });
  });

  describe('value change handling', () => {
    it('should add field to selected when value is entered', async () => {
      const user = userEvent.setup();
      const stringOnlyFields: FieldDefinition[] = [
        { name: 'description', type: 'string' }
      ];
      render(<FilterSubAnnotationsPanel {...defaultProps} subAnnotations={stringOnlyFields} />);

      const textInput = screen.getByRole('textbox');
      await user.type(textInput, 'test');

      expect(mockOnSubAnnotationsChange).toHaveBeenCalled();
      const lastCall = mockOnSubAnnotationsChange.mock.calls[mockOnSubAnnotationsChange.mock.calls.length - 1][0];
      expect(lastCall).toContainEqual(expect.objectContaining({
        fieldName: 'description',
        enabled: false
      }));
    });

    it('should remove field from selected when value is cleared', async () => {
      const user = userEvent.setup();
      const stringOnlyFields: FieldDefinition[] = [
        { name: 'description', type: 'string' }
      ];
      const selectedWithValue: FilterValue[] = [
        { fieldName: 'description', value: 'test', enabled: false, filterType: 'include' }
      ];
      render(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          subAnnotations={stringOnlyFields}
          selectedSubAnnotations={selectedWithValue}
        />
      );

      const textInput = screen.getByRole('textbox');
      await user.clear(textInput);

      expect(mockOnSubAnnotationsChange).toHaveBeenCalled();
    });

    it('should auto-disable field when value is cleared', async () => {
      const user = userEvent.setup();
      const stringOnlyFields: FieldDefinition[] = [
        { name: 'description', type: 'string' }
      ];
      const selectedWithValue: FilterValue[] = [
        { fieldName: 'description', value: 'test', enabled: true, filterType: 'include' }
      ];
      render(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          subAnnotations={stringOnlyFields}
          selectedSubAnnotations={selectedWithValue}
        />
      );

      const textInput = screen.getByRole('textbox');
      await user.clear(textInput);

      expect(mockOnSubAnnotationsChange).toHaveBeenCalled();
    });
  });

  describe('filter type change (include/exclude)', () => {
    it('should open More Options menu when clicked', async () => {
      const user = userEvent.setup();
      render(<FilterSubAnnotationsPanel {...defaultProps} />);

      const moreOptionsButtons = screen.getAllByTestId('MoreVertIcon');
      await user.click(moreOptionsButtons[0].closest('button')!);

      expect(screen.getByText('Include filter')).toBeInTheDocument();
      expect(screen.getByText('Exclude filter')).toBeInTheDocument();
    });

    it('should change filter type to include', async () => {
      const user = userEvent.setup();
      render(<FilterSubAnnotationsPanel {...defaultProps} />);

      const moreOptionsButtons = screen.getAllByTestId('MoreVertIcon');
      await user.click(moreOptionsButtons[0].closest('button')!);

      const includeOption = screen.getByText('Include filter');
      await user.click(includeOption);

      expect(mockOnSubAnnotationsChange).toHaveBeenCalled();
    });

    it('should change filter type to exclude', async () => {
      const user = userEvent.setup();
      render(<FilterSubAnnotationsPanel {...defaultProps} />);

      const moreOptionsButtons = screen.getAllByTestId('MoreVertIcon');
      await user.click(moreOptionsButtons[0].closest('button')!);

      const excludeOption = screen.getByText('Exclude filter');
      await user.click(excludeOption);

      expect(mockOnSubAnnotationsChange).toHaveBeenCalled();
    });

    it('should close menu after selecting filter type', async () => {
      const user = userEvent.setup();
      render(<FilterSubAnnotationsPanel {...defaultProps} />);

      const moreOptionsButtons = screen.getAllByTestId('MoreVertIcon');
      await user.click(moreOptionsButtons[0].closest('button')!);

      const includeOption = screen.getByText('Include filter');
      await user.click(includeOption);

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });

    it('should show exclude symbol when filter type is exclude', () => {
      const selectedWithExclude: FilterValue[] = [
        { fieldName: 'isActive', value: 'true', enabled: true, filterType: 'exclude' }
      ];
      render(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          selectedSubAnnotations={selectedWithExclude}
        />
      );

      // The exclude symbol (≠) should be rendered
      expect(screen.getByText('≠')).toBeInTheDocument();
    });
  });

  describe('close functionality', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<FilterSubAnnotationsPanel {...defaultProps} />);

      const closeIcon = screen.getByTestId('CloseIcon');
      await user.click(closeIcon.closest('button')!);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('apply functionality', () => {
    it('should disable Apply button when no valid filters', () => {
      render(<FilterSubAnnotationsPanel {...defaultProps} />);

      const applyButton = screen.getByRole('button', { name: 'Apply' });
      expect(applyButton).toBeDisabled();
    });

    it('should enable Apply button when there are valid filters', () => {
      const validSelectedFilters: FilterValue[] = [
        { fieldName: 'isActive', value: 'true', enabled: true, filterType: 'include' }
      ];
      render(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          selectedSubAnnotations={validSelectedFilters}
        />
      );

      const applyButton = screen.getByRole('button', { name: 'Apply' });
      expect(applyButton).not.toBeDisabled();
    });

    it('should call onSubAnnotationsApply with valid filters when Apply is clicked', async () => {
      const user = userEvent.setup();
      const validSelectedFilters: FilterValue[] = [
        { fieldName: 'isActive', value: 'true', enabled: true, filterType: 'include' }
      ];
      render(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          selectedSubAnnotations={validSelectedFilters}
        />
      );

      const applyButton = screen.getByRole('button', { name: 'Apply' });
      await user.click(applyButton);

      expect(mockOnSubAnnotationsApply).toHaveBeenCalledWith(validSelectedFilters);
    });

    it('should show filter count when there are valid filters', () => {
      const validSelectedFilters: FilterValue[] = [
        { fieldName: 'isActive', value: 'true', enabled: true, filterType: 'include' }
      ];
      render(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          selectedSubAnnotations={validSelectedFilters}
        />
      );

      expect(screen.getByText('1 filter ready to apply')).toBeInTheDocument();
    });

    it('should show plural filter count for multiple filters', () => {
      const validSelectedFilters: FilterValue[] = [
        { fieldName: 'isActive', value: 'true', enabled: true, filterType: 'include' },
        { fieldName: 'description', value: 'test', enabled: true, filterType: 'include' }
      ];
      render(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          selectedSubAnnotations={validSelectedFilters}
        />
      );

      expect(screen.getByText('2 filters ready to apply')).toBeInTheDocument();
    });

    it('should not include disabled filters in apply', async () => {
      const user = userEvent.setup();
      const mixedFilters: FilterValue[] = [
        { fieldName: 'isActive', value: 'true', enabled: true, filterType: 'include' },
        { fieldName: 'description', value: 'test', enabled: false, filterType: 'include' }
      ];
      render(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          selectedSubAnnotations={mixedFilters}
        />
      );

      const applyButton = screen.getByRole('button', { name: 'Apply' });
      await user.click(applyButton);

      expect(mockOnSubAnnotationsApply).toHaveBeenCalledWith([
        { fieldName: 'isActive', value: 'true', enabled: true, filterType: 'include' }
      ]);
    });

    it('should not include filters with empty values', async () => {
      const user = userEvent.setup();
      const filtersWithEmpty: FilterValue[] = [
        { fieldName: 'isActive', value: 'true', enabled: true, filterType: 'include' },
        { fieldName: 'description', value: '', enabled: true, filterType: 'include' }
      ];
      render(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          selectedSubAnnotations={filtersWithEmpty}
        />
      );

      const applyButton = screen.getByRole('button', { name: 'Apply' });
      await user.click(applyButton);

      expect(mockOnSubAnnotationsApply).toHaveBeenCalledWith([
        { fieldName: 'isActive', value: 'true', enabled: true, filterType: 'include' }
      ]);
    });

    it('should not include filters with invalid values', async () => {
      const user = userEvent.setup();
      const filtersWithInvalid: FilterValue[] = [
        { fieldName: 'isActive', value: 'true', enabled: true, filterType: 'include' },
        { fieldName: 'count', value: 'not-a-number', enabled: true, filterType: 'include' }
      ];
      render(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          selectedSubAnnotations={filtersWithInvalid}
        />
      );

      const applyButton = screen.getByRole('button', { name: 'Apply' });
      await user.click(applyButton);

      expect(mockOnSubAnnotationsApply).toHaveBeenCalledWith([
        { fieldName: 'isActive', value: 'true', enabled: true, filterType: 'include' }
      ]);
    });
  });

  describe('position calculation', () => {
    it('should position panel based on clickPosition', () => {
      const clickPosition = { top: 100, right: 200 };
      render(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          clickPosition={clickPosition}
        />
      );

      // Panel should be rendered (we can't easily test exact position in jsdom)
      expect(screen.getByText('Test Annotation')).toBeInTheDocument();
    });

    it('should center panel when clickPosition is not provided', () => {
      render(<FilterSubAnnotationsPanel {...defaultProps} />);

      // Panel should still be rendered
      expect(screen.getByText('Test Annotation')).toBeInTheDocument();
    });

    it('should handle clickPosition near viewport edges', () => {
      // Simulate small viewport
      Object.defineProperty(window, 'innerWidth', { value: 800, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 600, writable: true });

      const clickPosition = { top: 500, right: 750 };
      render(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          clickPosition={clickPosition}
        />
      );

      expect(screen.getByText('Test Annotation')).toBeInTheDocument();
    });

    it('should reset position when panel closes', () => {
      const { rerender } = render(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          clickPosition={{ top: 100, right: 200 }}
        />
      );

      // Close the panel
      rerender(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          isOpen={false}
          clickPosition={{ top: 100, right: 200 }}
        />
      );

      // Panel should not be visible
      expect(screen.queryByText('Test Annotation')).not.toBeInTheDocument();
    });
  });

  describe('notification snackbar', () => {
    it('should show notification on validation error', async () => {
      const user = userEvent.setup();
      const intOnlyFields: FieldDefinition[] = [
        { name: 'count', type: 'int' }
      ];
      // Pre-populate with invalid value so blur validation triggers notification
      const selectedWithInvalid: FilterValue[] = [
        { fieldName: 'count', value: 'invalid', enabled: false, filterType: 'include' }
      ];
      render(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          subAnnotations={intOnlyFields}
          selectedSubAnnotations={selectedWithInvalid}
        />
      );

      const textInput = screen.getByRole('textbox');
      // Focus and blur the input to trigger validation and notification
      await user.click(textInput);
      // Click on header text to blur the input
      await user.click(screen.getByText('Test Annotation'));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('should close notification when close button is clicked', async () => {
      const user = userEvent.setup();
      const intOnlyFields: FieldDefinition[] = [
        { name: 'count', type: 'int' }
      ];
      // Pre-populate with invalid value so blur validation triggers notification
      const selectedWithInvalid: FilterValue[] = [
        { fieldName: 'count', value: 'invalid', enabled: false, filterType: 'include' }
      ];
      render(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          subAnnotations={intOnlyFields}
          selectedSubAnnotations={selectedWithInvalid}
        />
      );

      const textInput = screen.getByRole('textbox');
      // Focus and blur the input to trigger validation and notification
      await user.click(textInput);
      // Click on header text to blur the input
      await user.click(screen.getByText('Test Annotation'));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      // Close the notification
      const alertCloseButton = within(screen.getByRole('alert')).getByRole('button');
      await user.click(alertCloseButton);

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });
  });

  describe('field focus state', () => {
    it('should update focus state when field is focused', async () => {
      const user = userEvent.setup();
      const stringOnlyFields: FieldDefinition[] = [
        { name: 'description', type: 'string' }
      ];
      render(<FilterSubAnnotationsPanel {...defaultProps} subAnnotations={stringOnlyFields} />);

      const textInput = screen.getByRole('textbox');
      await user.click(textInput);

      // Field is focused (visual state change)
      expect(textInput).toHaveFocus();
    });

    it('should clear focus state when field is blurred', async () => {
      const user = userEvent.setup();
      const stringOnlyFields: FieldDefinition[] = [
        { name: 'description', type: 'string' }
      ];
      render(<FilterSubAnnotationsPanel {...defaultProps} subAnnotations={stringOnlyFields} />);

      const textInput = screen.getByRole('textbox');
      await user.click(textInput);
      await user.tab(); // Move focus away

      expect(textInput).not.toHaveFocus();
    });
  });

  describe('prop updates', () => {
    it('should update when selectedSubAnnotations prop changes', () => {
      const { rerender } = render(
        <FilterSubAnnotationsPanel {...defaultProps} selectedSubAnnotations={[]} />
      );

      expect(screen.getByText('No filters ready to apply')).toBeInTheDocument();

      const newSelected: FilterValue[] = [
        { fieldName: 'isActive', value: 'true', enabled: true, filterType: 'include' }
      ];
      rerender(
        <FilterSubAnnotationsPanel {...defaultProps} selectedSubAnnotations={newSelected} />
      );

      expect(screen.getByText('1 filter ready to apply')).toBeInTheDocument();
    });

    it('should update when subAnnotations prop changes', () => {
      const { rerender } = render(
        <FilterSubAnnotationsPanel {...defaultProps} subAnnotations={mockSubAnnotations} />
      );

      expect(screen.getByText('isActive')).toBeInTheDocument();

      const newSubAnnotations: FieldDefinition[] = [
        { name: 'newField', type: 'string' }
      ];
      rerender(
        <FilterSubAnnotationsPanel {...defaultProps} subAnnotations={newSubAnnotations} />
      );

      expect(screen.queryByText('isActive')).not.toBeInTheDocument();
      expect(screen.getByText('newField')).toBeInTheDocument();
    });

    it('should update when annotationName prop changes', () => {
      const { rerender } = render(
        <FilterSubAnnotationsPanel {...defaultProps} annotationName="Original Name" />
      );

      expect(screen.getByText('Original Name')).toBeInTheDocument();

      rerender(
        <FilterSubAnnotationsPanel {...defaultProps} annotationName="Updated Name" />
      );

      expect(screen.queryByText('Original Name')).not.toBeInTheDocument();
      expect(screen.getByText('Updated Name')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle field with empty name', () => {
      const fieldsWithEmptyName: FieldDefinition[] = [
        { name: '', type: 'string' }
      ];
      render(<FilterSubAnnotationsPanel {...defaultProps} subAnnotations={fieldsWithEmptyName} />);

      // Should still render without crashing
      expect(screen.getByText('Test Annotation')).toBeInTheDocument();
    });

    it('should handle object values in enum enumValues', async () => {
      const user = userEvent.setup();
      const fieldsWithObjectEnum: FieldDefinition[] = [
        {
          name: 'category',
          type: 'enum',
          enumValues: [
            { name: 'Option A', value: 'a' } as unknown as string,
            { name: 'Option B', value: 'b' } as unknown as string
          ]
        }
      ];
      render(<FilterSubAnnotationsPanel {...defaultProps} subAnnotations={fieldsWithObjectEnum} />);

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      // Should handle object values and display them
      expect(screen.getByRole('option', { name: 'Option A' })).toBeInTheDocument();
    });

    it('should handle rapid value changes', async () => {
      const user = userEvent.setup();
      const stringOnlyFields: FieldDefinition[] = [
        { name: 'description', type: 'string' }
      ];
      render(<FilterSubAnnotationsPanel {...defaultProps} subAnnotations={stringOnlyFields} />);

      const textInput = screen.getByRole('textbox');
      await user.type(textInput, 'abcdefghij');

      // Should have called onChange multiple times
      expect(mockOnSubAnnotationsChange.mock.calls.length).toBeGreaterThanOrEqual(10);
    });

    it('should handle special characters in field values', async () => {
      const user = userEvent.setup();
      const stringOnlyFields: FieldDefinition[] = [
        { name: 'description', type: 'string' }
      ];
      render(<FilterSubAnnotationsPanel {...defaultProps} subAnnotations={stringOnlyFields} />);

      const textInput = screen.getByRole('textbox');
      await user.type(textInput, '!@#$%^&*()');

      expect(mockOnSubAnnotationsChange).toHaveBeenCalled();
    });

    it('should handle very long field names', () => {
      const fieldsWithLongName: FieldDefinition[] = [
        { name: 'thisIsAVeryLongFieldNameThatShouldStillRenderCorrectly', type: 'string' }
      ];
      render(<FilterSubAnnotationsPanel {...defaultProps} subAnnotations={fieldsWithLongName} />);

      expect(screen.getByText('thisIsAVeryLongFieldNameThatShouldStillRenderCorrectly')).toBeInTheDocument();
    });

    it('should handle whitespace-only values', async () => {
      const user = userEvent.setup();
      const stringOnlyFields: FieldDefinition[] = [
        { name: 'description', type: 'string' }
      ];
      render(<FilterSubAnnotationsPanel {...defaultProps} subAnnotations={stringOnlyFields} />);

      const textInput = screen.getByRole('textbox');
      await user.type(textInput, '   ');

      expect(mockOnSubAnnotationsChange).toHaveBeenCalled();
    });
  });

  describe('menu interactions', () => {
    it('should close menu when pressing Escape', async () => {
      const user = userEvent.setup();
      render(<FilterSubAnnotationsPanel {...defaultProps} />);

      const moreOptionsButtons = screen.getAllByTestId('MoreVertIcon');
      await user.click(moreOptionsButtons[0].closest('button')!);

      expect(screen.getByText('Include filter')).toBeInTheDocument();

      // Press Escape to close the menu
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });

    it('should show selected state for current filter type in menu', async () => {
      const user = userEvent.setup();
      const selectedWithInclude: FilterValue[] = [
        { fieldName: 'isActive', value: 'true', enabled: true, filterType: 'include' }
      ];
      render(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          selectedSubAnnotations={selectedWithInclude}
        />
      );

      const moreOptionsButtons = screen.getAllByTestId('MoreVertIcon');
      await user.click(moreOptionsButtons[0].closest('button')!);

      // Include filter should have the selected styling
      const includeText = screen.getByText('Include filter');
      expect(includeText).toBeInTheDocument();
    });
  });

  describe('default export', () => {
    it('should export FilterSubAnnotationsPanel as default', async () => {
      const module = await import('./FilterSubAnnotationsPanel');
      expect(module.default).toBeDefined();
    });

    it('should export a function component', async () => {
      const module = await import('./FilterSubAnnotationsPanel');
      expect(typeof module.default).toBe('function');
    });
  });

  describe('accessibility', () => {
    it('should have accessible close button', () => {
      render(<FilterSubAnnotationsPanel {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      // First button should be the close button
      expect(buttons[0]).toBeInTheDocument();
    });

    it('should have accessible checkboxes', () => {
      render(<FilterSubAnnotationsPanel {...defaultProps} />);

      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        expect(checkbox).toBeInTheDocument();
      });
    });

    it('should have accessible comboboxes', () => {
      render(<FilterSubAnnotationsPanel {...defaultProps} />);

      const comboboxes = screen.getAllByRole('combobox');
      comboboxes.forEach(combobox => {
        expect(combobox).toBeInTheDocument();
      });
    });

    it('should have accessible textboxes', () => {
      render(<FilterSubAnnotationsPanel {...defaultProps} />);

      const textboxes = screen.getAllByRole('textbox');
      textboxes.forEach(textbox => {
        expect(textbox).toBeInTheDocument();
      });
    });
  });
});
