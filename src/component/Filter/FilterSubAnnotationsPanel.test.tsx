import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import FilterSubAnnotationsPanel from './FilterSubAnnotationsPanel';

const createMockStore = () =>
  configureStore({
    reducer: {
      user: (state = { mode: 'light' }) => state,
    },
    preloadedState: { user: { mode: 'light' } },
  });

const renderWithProvider = (ui: React.ReactElement) => {
  const store = createMockStore();
  const result = render(<Provider store={store}>{ui}</Provider>);
  return {
    ...result,
    rerender: (newUi: React.ReactElement) =>
      result.rerender(<Provider store={store}>{newUi}</Provider>),
  };
};

// Mock data
interface FieldDefinition {
  name: string;
  displayName?: string;
  type: 'bool' | 'enum' | 'string' | 'int' | 'strong' | 'datetime';
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
      renderWithProvider(<FilterSubAnnotationsPanel {...defaultProps} />);

      expect(screen.getByText('Test Annotation')).toBeInTheDocument();
    });

    it('should not render the panel when isOpen is false', () => {
      renderWithProvider(<FilterSubAnnotationsPanel {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Test Annotation')).not.toBeInTheDocument();
    });

    it('should render the annotation name in the header', () => {
      renderWithProvider(<FilterSubAnnotationsPanel {...defaultProps} annotationName="Custom Annotation" />);

      expect(screen.getByText('Custom Annotation')).toBeInTheDocument();
    });

    it('should not render subtitle text', () => {
      renderWithProvider(<FilterSubAnnotationsPanel {...defaultProps} />);

      expect(screen.queryByText('Filter on tag values')).not.toBeInTheDocument();
    });

    it('should render the close button', () => {
      renderWithProvider(<FilterSubAnnotationsPanel {...defaultProps} />);

      const closeButton = screen.getByTestId('CloseIcon');
      expect(closeButton).toBeInTheDocument();
    });

    it('should render all field names as text labels', () => {
      renderWithProvider(<FilterSubAnnotationsPanel {...defaultProps} />);

      expect(screen.getByText('isActive')).toBeInTheDocument();
      expect(screen.getByText('status')).toBeInTheDocument();
      expect(screen.getByText('description')).toBeInTheDocument();
      expect(screen.getByText('count')).toBeInTheDocument();
      expect(screen.getByText('identifier')).toBeInTheDocument();
    });

    it('should render the Apply button', () => {
      renderWithProvider(<FilterSubAnnotationsPanel {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument();
    });

    it('should render the Clear all button', () => {
      renderWithProvider(<FilterSubAnnotationsPanel {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Clear all' })).toBeInTheDocument();
    });

    it('should render checkboxes for each field', () => {
      renderWithProvider(<FilterSubAnnotationsPanel {...defaultProps} />);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(mockSubAnnotations.length);
    });

    it('should not render input fields when no checkboxes are checked', () => {
      renderWithProvider(<FilterSubAnnotationsPanel {...defaultProps} />);

      expect(screen.queryAllByRole('textbox')).toHaveLength(0);
      expect(screen.queryAllByRole('combobox')).toHaveLength(0);
    });

    it('should not render MoreVert icons', () => {
      renderWithProvider(<FilterSubAnnotationsPanel {...defaultProps} />);

      expect(screen.queryAllByTestId('MoreVertIcon')).toHaveLength(0);
    });

    it('should display displayName when available', () => {
      const fieldsWithDisplayName: FieldDefinition[] = [
        { name: 'quality_contact', displayName: 'Quality Contact', type: 'string' },
        { name: 'num-rows', displayName: 'Number of Rows', type: 'int' },
      ];
      renderWithProvider(<FilterSubAnnotationsPanel {...defaultProps} subAnnotations={fieldsWithDisplayName} />);

      expect(screen.getByText('Quality Contact')).toBeInTheDocument();
      expect(screen.getByText('Number of Rows')).toBeInTheDocument();
      expect(screen.queryByText('quality_contact')).not.toBeInTheDocument();
      expect(screen.queryByText('num-rows')).not.toBeInTheDocument();
    });

    it('should fallback to name when displayName is not provided', () => {
      const fieldsWithoutDisplayName: FieldDefinition[] = [
        { name: 'raw_field_name', type: 'string' },
      ];
      renderWithProvider(<FilterSubAnnotationsPanel {...defaultProps} subAnnotations={fieldsWithoutDisplayName} />);

      expect(screen.getByText('raw_field_name')).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should render loading spinner when subAnnotationsloader is true', () => {
      renderWithProvider(<FilterSubAnnotationsPanel {...defaultProps} subAnnotationsloader={true} />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should not render field inputs when loading', () => {
      renderWithProvider(<FilterSubAnnotationsPanel {...defaultProps} subAnnotationsloader={true} />);

      expect(screen.queryByText('isActive')).not.toBeInTheDocument();
      expect(screen.queryByText('description')).not.toBeInTheDocument();
    });

    it('should render field inputs when not loading', () => {
      renderWithProvider(<FilterSubAnnotationsPanel {...defaultProps} subAnnotationsloader={false} />);

      expect(screen.getByText('isActive')).toBeInTheDocument();
      expect(screen.getByText('description')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should render "No fields found" when subAnnotations is empty', () => {
      renderWithProvider(<FilterSubAnnotationsPanel {...defaultProps} subAnnotations={[]} />);

      expect(screen.getByText('No fields found')).toBeInTheDocument();
    });

    it('should not render checkboxes when no fields', () => {
      renderWithProvider(<FilterSubAnnotationsPanel {...defaultProps} subAnnotations={[]} />);

      expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    });
  });

  describe('checkbox toggle', () => {
    it('should have all checkboxes enabled by default', () => {
      renderWithProvider(<FilterSubAnnotationsPanel {...defaultProps} />);

      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        expect(checkbox).not.toBeDisabled();
      });
    });

    it('should toggle checkbox and call onSubAnnotationsChange', async () => {
      const user = userEvent.setup();
      renderWithProvider(<FilterSubAnnotationsPanel {...defaultProps} />);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);

      expect(mockOnSubAnnotationsChange).toHaveBeenCalled();
      const lastCall = mockOnSubAnnotationsChange.mock.calls[0][0];
      expect(lastCall).toContainEqual(expect.objectContaining({
        fieldName: 'isActive',
        enabled: true
      }));
    });

    it('should show input field when checkbox is checked', () => {
      const checkedField: FilterValue[] = [
        { fieldName: 'description', value: '', enabled: true, filterType: 'include' }
      ];
      renderWithProvider(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          selectedSubAnnotations={checkedField}
        />
      );

      const textInputs = screen.getAllByRole('textbox');
      expect(textInputs).toHaveLength(1);
    });

    it('should hide input field when checkbox is unchecked', () => {
      renderWithProvider(<FilterSubAnnotationsPanel {...defaultProps} selectedSubAnnotations={[]} />);

      expect(screen.queryAllByRole('textbox')).toHaveLength(0);
      expect(screen.queryAllByRole('combobox')).toHaveLength(0);
    });

    it('should uncheck and remove field when clicking checked checkbox', async () => {
      const user = userEvent.setup();
      const checkedField: FilterValue[] = [
        { fieldName: 'isActive', value: 'true', enabled: true, filterType: 'include' }
      ];
      renderWithProvider(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          selectedSubAnnotations={checkedField}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      // isActive is the first checkbox and should be checked
      expect(checkboxes[0]).toBeChecked();

      await user.click(checkboxes[0]);

      expect(mockOnSubAnnotationsChange).toHaveBeenCalled();
      const lastCall = mockOnSubAnnotationsChange.mock.calls[0][0];
      // Field should be removed from array (spliced)
      expect(lastCall).not.toContainEqual(expect.objectContaining({
        fieldName: 'isActive'
      }));
    });

    it('should show checked state for enabled fields', () => {
      renderWithProvider(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          selectedSubAnnotations={mockSelectedSubAnnotations}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      // isActive is enabled: true
      expect(checkboxes[0]).toBeChecked();
    });

    it('should show unchecked state for non-enabled fields', () => {
      renderWithProvider(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          selectedSubAnnotations={mockSelectedSubAnnotations}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      // description (index 2) is not in selectedSubAnnotations
      expect(checkboxes[2]).not.toBeChecked();
    });
  });

  describe('input field interactions', () => {
    it('should show bool select when bool field is checked', () => {
      const checkedBool: FilterValue[] = [
        { fieldName: 'isActive', value: '', enabled: true, filterType: 'include' }
      ];
      renderWithProvider(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          selectedSubAnnotations={checkedBool}
        />
      );

      const comboboxes = screen.getAllByRole('combobox');
      expect(comboboxes).toHaveLength(1);
    });

    it('should change value when bool option is selected', async () => {
      const user = userEvent.setup();
      const checkedBool: FilterValue[] = [
        { fieldName: 'isActive', value: '', enabled: true, filterType: 'include' }
      ];
      renderWithProvider(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          selectedSubAnnotations={checkedBool}
        />
      );

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      const trueOption = screen.getByRole('option', { name: 'True' });
      await user.click(trueOption);

      expect(mockOnSubAnnotationsChange).toHaveBeenCalled();
    });

    it('should show enum select when enum field is checked', () => {
      const checkedEnum: FilterValue[] = [
        { fieldName: 'status', value: '', enabled: true, filterType: 'include' }
      ];
      renderWithProvider(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          selectedSubAnnotations={checkedEnum}
        />
      );

      const comboboxes = screen.getAllByRole('combobox');
      expect(comboboxes).toHaveLength(1);
    });

    it('should display enum values as options', async () => {
      const user = userEvent.setup();
      const checkedEnum: FilterValue[] = [
        { fieldName: 'status', value: '', enabled: true, filterType: 'include' }
      ];
      renderWithProvider(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          selectedSubAnnotations={checkedEnum}
        />
      );

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      expect(screen.getByRole('option', { name: 'Active' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Inactive' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Pending' })).toBeInTheDocument();
    });

    it('should show text input when string field is checked', () => {
      const checkedString: FilterValue[] = [
        { fieldName: 'description', value: '', enabled: true, filterType: 'include' }
      ];
      renderWithProvider(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          selectedSubAnnotations={checkedString}
        />
      );

      const textInputs = screen.getAllByRole('textbox');
      expect(textInputs).toHaveLength(1);
    });

    it('should show text input when int field is checked', () => {
      const checkedInt: FilterValue[] = [
        { fieldName: 'count', value: '', enabled: true, filterType: 'include' }
      ];
      renderWithProvider(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          selectedSubAnnotations={checkedInt}
        />
      );

      const textInputs = screen.getAllByRole('textbox');
      expect(textInputs).toHaveLength(1);
    });

    it('should show text input when strong field is checked', () => {
      const checkedStrong: FilterValue[] = [
        { fieldName: 'identifier', value: '', enabled: true, filterType: 'include' }
      ];
      renderWithProvider(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          selectedSubAnnotations={checkedStrong}
        />
      );

      const textInputs = screen.getAllByRole('textbox');
      expect(textInputs).toHaveLength(1);
    });

    it('should change value when text is entered', async () => {
      const user = userEvent.setup();
      const checkedString: FilterValue[] = [
        { fieldName: 'description', value: '', enabled: true, filterType: 'include' }
      ];
      renderWithProvider(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          subAnnotations={[{ name: 'description', type: 'string' }]}
          selectedSubAnnotations={checkedString}
        />
      );

      const textInput = screen.getByRole('textbox');
      await user.type(textInput, 'test value');

      expect(mockOnSubAnnotationsChange).toHaveBeenCalled();
    });

    it('should show "Enter value" placeholder for string fields', () => {
      const checkedString: FilterValue[] = [
        { fieldName: 'description', value: '', enabled: true, filterType: 'include' }
      ];
      renderWithProvider(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          subAnnotations={[{ name: 'description', type: 'string' }]}
          selectedSubAnnotations={checkedString}
        />
      );

      const textInput = screen.getByPlaceholderText('Enter value');
      expect(textInput).toBeInTheDocument();
    });

    it('should show "Enter number" placeholder for int fields', () => {
      const checkedInt: FilterValue[] = [
        { fieldName: 'count', value: '', enabled: true, filterType: 'include' }
      ];
      renderWithProvider(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          subAnnotations={[{ name: 'count', type: 'int' }]}
          selectedSubAnnotations={checkedInt}
        />
      );

      const textInput = screen.getByPlaceholderText('Enter number');
      expect(textInput).toBeInTheDocument();
    });

    it('should show "Choose option" placeholder for bool fields', () => {
      const checkedBool: FilterValue[] = [
        { fieldName: 'isActive', value: '', enabled: true, filterType: 'include' }
      ];
      renderWithProvider(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          subAnnotations={[{ name: 'isActive', type: 'bool' }]}
          selectedSubAnnotations={checkedBool}
        />
      );

      expect(screen.getByText('Choose option')).toBeInTheDocument();
    });

    it('should show "Choose option" placeholder for enum fields', () => {
      const checkedEnum: FilterValue[] = [
        { fieldName: 'status', value: '', enabled: true, filterType: 'include' }
      ];
      renderWithProvider(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          subAnnotations={[{ name: 'status', type: 'enum', enumValues: ['Active', 'Inactive'] }]}
          selectedSubAnnotations={checkedEnum}
        />
      );

      expect(screen.getByText('Choose option')).toBeInTheDocument();
    });

    it('should render MUI DatePicker for datetime fields', () => {
      const checkedDatetime: FilterValue[] = [
        { fieldName: 'createdAt', value: '', enabled: true, filterType: 'include' }
      ];
      render(
        <Provider store={createMockStore()}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <FilterSubAnnotationsPanel
              {...defaultProps}
              subAnnotations={[{ name: 'createdAt', type: 'datetime' }]}
              selectedSubAnnotations={checkedDatetime}
            />
          </LocalizationProvider>
        </Provider>
      );

      const dateInput = screen.getByPlaceholderText('Pick a date');
      expect(dateInput).toBeInTheDocument();
    });
  });

  describe('clear all functionality', () => {
    it('should disable Clear all when no fields are checked', () => {
      renderWithProvider(<FilterSubAnnotationsPanel {...defaultProps} />);

      const clearAllButton = screen.getByRole('button', { name: 'Clear all' });
      expect(clearAllButton).toBeDisabled();
    });

    it('should enable Clear all when a field is checked', () => {
      const checkedField: FilterValue[] = [
        { fieldName: 'isActive', value: 'true', enabled: true, filterType: 'include' }
      ];
      renderWithProvider(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          selectedSubAnnotations={checkedField}
        />
      );

      const clearAllButton = screen.getByRole('button', { name: 'Clear all' });
      expect(clearAllButton).not.toBeDisabled();
    });

    it('should call onSubAnnotationsChange with empty array when Clear all is clicked', async () => {
      const user = userEvent.setup();
      const checkedField: FilterValue[] = [
        { fieldName: 'isActive', value: 'true', enabled: true, filterType: 'include' }
      ];
      renderWithProvider(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          selectedSubAnnotations={checkedField}
        />
      );

      const clearAllButton = screen.getByRole('button', { name: 'Clear all' });
      await user.click(clearAllButton);

      expect(mockOnSubAnnotationsChange).toHaveBeenCalledWith([]);
    });
  });

  describe('close functionality', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProvider(<FilterSubAnnotationsPanel {...defaultProps} />);

      const closeIcon = screen.getByTestId('CloseIcon');
      await user.click(closeIcon.closest('button')!);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('apply functionality', () => {
    it('should always render Apply button as enabled', () => {
      renderWithProvider(<FilterSubAnnotationsPanel {...defaultProps} />);

      const applyButton = screen.getByRole('button', { name: 'Apply' });
      expect(applyButton).not.toBeDisabled();
    });

    it('should call onSubAnnotationsApply with valid filters when Apply is clicked', async () => {
      const user = userEvent.setup();
      const validSelectedFilters: FilterValue[] = [
        { fieldName: 'isActive', value: 'true', enabled: true, filterType: 'include' }
      ];
      renderWithProvider(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          selectedSubAnnotations={validSelectedFilters}
        />
      );

      const applyButton = screen.getByRole('button', { name: 'Apply' });
      await user.click(applyButton);

      expect(mockOnSubAnnotationsApply).toHaveBeenCalledWith(validSelectedFilters);
    });

    it('should call onSubAnnotationsApply with empty array when no valid filters', async () => {
      const user = userEvent.setup();
      renderWithProvider(<FilterSubAnnotationsPanel {...defaultProps} />);

      const applyButton = screen.getByRole('button', { name: 'Apply' });
      await user.click(applyButton);

      expect(mockOnSubAnnotationsApply).toHaveBeenCalledWith([]);
    });

    it('should not include disabled filters in apply', async () => {
      const user = userEvent.setup();
      const mixedFilters: FilterValue[] = [
        { fieldName: 'isActive', value: 'true', enabled: true, filterType: 'include' },
        { fieldName: 'description', value: 'test', enabled: false, filterType: 'include' }
      ];
      renderWithProvider(
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

    it('should show error and not apply when a checked field has empty value', async () => {
      const user = userEvent.setup();
      const filtersWithEmpty: FilterValue[] = [
        { fieldName: 'isActive', value: 'true', enabled: true, filterType: 'include' },
        { fieldName: 'description', value: '', enabled: true, filterType: 'include' }
      ];
      renderWithProvider(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          selectedSubAnnotations={filtersWithEmpty}
        />
      );

      const applyButton = screen.getByRole('button', { name: 'Apply' });
      await user.click(applyButton);

      // Should show error message and NOT call onSubAnnotationsApply
      expect(screen.getByText('Please enter a value')).toBeInTheDocument();
      expect(mockOnSubAnnotationsApply).not.toHaveBeenCalled();
    });

    it('should not include filters with invalid values', async () => {
      const user = userEvent.setup();
      const filtersWithInvalid: FilterValue[] = [
        { fieldName: 'isActive', value: 'true', enabled: true, filterType: 'include' },
        { fieldName: 'count', value: 'not-a-number', enabled: true, filterType: 'include' }
      ];
      renderWithProvider(
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
      renderWithProvider(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          clickPosition={clickPosition}
        />
      );

      expect(screen.getByText('Test Annotation')).toBeInTheDocument();
    });

    it('should center panel when clickPosition is not provided', () => {
      renderWithProvider(<FilterSubAnnotationsPanel {...defaultProps} />);

      expect(screen.getByText('Test Annotation')).toBeInTheDocument();
    });

    it('should handle clickPosition near viewport edges', () => {
      Object.defineProperty(window, 'innerWidth', { value: 800, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 600, writable: true });

      const clickPosition = { top: 500, right: 750 };
      renderWithProvider(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          clickPosition={clickPosition}
        />
      );

      expect(screen.getByText('Test Annotation')).toBeInTheDocument();
    });

    it('should reset position when panel closes', () => {
      const { rerender } = renderWithProvider(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          clickPosition={{ top: 100, right: 200 }}
        />
      );

      rerender(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          isOpen={false}
          clickPosition={{ top: 100, right: 200 }}
        />
      );

      expect(screen.queryByText('Test Annotation')).not.toBeInTheDocument();
    });
  });

  describe('prop updates', () => {
    it('should update when selectedSubAnnotations prop changes', () => {
      const { rerender } = renderWithProvider(
        <FilterSubAnnotationsPanel {...defaultProps} selectedSubAnnotations={[]} />
      );

      // No inputs visible initially
      expect(screen.queryAllByRole('textbox')).toHaveLength(0);

      const newSelected: FilterValue[] = [
        { fieldName: 'description', value: 'test', enabled: true, filterType: 'include' }
      ];
      rerender(
        <FilterSubAnnotationsPanel {...defaultProps} selectedSubAnnotations={newSelected} />
      );

      // Input should now be visible for checked field
      expect(screen.getAllByRole('textbox')).toHaveLength(1);
    });

    it('should update when subAnnotations prop changes', () => {
      const { rerender } = renderWithProvider(
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
      const { rerender } = renderWithProvider(
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
      renderWithProvider(<FilterSubAnnotationsPanel {...defaultProps} subAnnotations={fieldsWithEmptyName} />);

      expect(screen.getByText('Test Annotation')).toBeInTheDocument();
    });

    it('should handle string enum values correctly', async () => {
      const user = userEvent.setup();
      const fieldsWithEnum: FieldDefinition[] = [
        {
          name: 'category',
          type: 'enum',
          enumValues: ['Option A', 'Option B']
        }
      ];
      const checkedEnum: FilterValue[] = [
        { fieldName: 'category', value: '', enabled: true, filterType: 'include' }
      ];
      renderWithProvider(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          subAnnotations={fieldsWithEnum}
          selectedSubAnnotations={checkedEnum}
        />
      );

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      expect(screen.getByRole('option', { name: 'Option A' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Option B' })).toBeInTheDocument();
    });

    it('should handle rapid value changes', async () => {
      const user = userEvent.setup();
      const stringOnlyFields: FieldDefinition[] = [
        { name: 'description', type: 'string' }
      ];
      const checkedField: FilterValue[] = [
        { fieldName: 'description', value: '', enabled: true, filterType: 'include' }
      ];
      renderWithProvider(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          subAnnotations={stringOnlyFields}
          selectedSubAnnotations={checkedField}
        />
      );

      const textInput = screen.getByRole('textbox');
      await user.type(textInput, 'abcdefghij');

      expect(mockOnSubAnnotationsChange.mock.calls.length).toBeGreaterThanOrEqual(10);
    });

    it('should handle special characters in field values', async () => {
      const user = userEvent.setup();
      const stringOnlyFields: FieldDefinition[] = [
        { name: 'description', type: 'string' }
      ];
      const checkedField: FilterValue[] = [
        { fieldName: 'description', value: '', enabled: true, filterType: 'include' }
      ];
      renderWithProvider(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          subAnnotations={stringOnlyFields}
          selectedSubAnnotations={checkedField}
        />
      );

      const textInput = screen.getByRole('textbox');
      await user.type(textInput, '!@#$%^&*()');

      expect(mockOnSubAnnotationsChange).toHaveBeenCalled();
    });

    it('should handle very long field names', () => {
      const fieldsWithLongName: FieldDefinition[] = [
        { name: 'thisIsAVeryLongFieldNameThatShouldStillRenderCorrectly', type: 'string' }
      ];
      renderWithProvider(<FilterSubAnnotationsPanel {...defaultProps} subAnnotations={fieldsWithLongName} />);

      expect(screen.getByText('thisIsAVeryLongFieldNameThatShouldStillRenderCorrectly')).toBeInTheDocument();
    });

    it('should handle enum field with no enumValues', () => {
      const fieldsWithNoEnum: FieldDefinition[] = [
        { name: 'category', type: 'enum' }
      ];
      const checkedField: FilterValue[] = [
        { fieldName: 'category', value: '', enabled: true, filterType: 'include' }
      ];
      renderWithProvider(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          subAnnotations={fieldsWithNoEnum}
          selectedSubAnnotations={checkedField}
        />
      );

      // Should render a combobox even with no enum values
      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();
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
      renderWithProvider(<FilterSubAnnotationsPanel {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toBeInTheDocument();
    });

    it('should have accessible checkboxes', () => {
      renderWithProvider(<FilterSubAnnotationsPanel {...defaultProps} />);

      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        expect(checkbox).toBeInTheDocument();
      });
    });

    it('should have accessible textbox when field is checked', () => {
      const checkedField: FilterValue[] = [
        { fieldName: 'description', value: '', enabled: true, filterType: 'include' }
      ];
      renderWithProvider(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          subAnnotations={[{ name: 'description', type: 'string' }]}
          selectedSubAnnotations={checkedField}
        />
      );

      const textbox = screen.getByRole('textbox');
      expect(textbox).toBeInTheDocument();
    });

    it('should have accessible combobox when bool/enum field is checked', () => {
      const checkedField: FilterValue[] = [
        { fieldName: 'isActive', value: '', enabled: true, filterType: 'include' }
      ];
      renderWithProvider(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          subAnnotations={[{ name: 'isActive', type: 'bool' }]}
          selectedSubAnnotations={checkedField}
        />
      );

      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();
    });
  });

  describe('empty value error validation', () => {
    it('should show error for each empty checked field on Apply', async () => {
      const user = userEvent.setup();
      const filtersWithEmpty: FilterValue[] = [
        { fieldName: 'isActive', value: '', enabled: true, filterType: 'include' },
        { fieldName: 'description', value: '', enabled: true, filterType: 'include' }
      ];
      renderWithProvider(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          selectedSubAnnotations={filtersWithEmpty}
        />
      );

      const applyButton = screen.getByRole('button', { name: 'Apply' });
      await user.click(applyButton);

      // Both empty fields should show error
      const errors = screen.getAllByText('Please enter a value');
      expect(errors).toHaveLength(2);
      expect(mockOnSubAnnotationsApply).not.toHaveBeenCalled();
    });

    it('should show error only for the empty field when one is filled', async () => {
      const user = userEvent.setup();
      const filtersWithMixed: FilterValue[] = [
        { fieldName: 'isActive', value: 'true', enabled: true, filterType: 'include' },
        { fieldName: 'description', value: '', enabled: true, filterType: 'include' }
      ];
      renderWithProvider(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          selectedSubAnnotations={filtersWithMixed}
        />
      );

      const applyButton = screen.getByRole('button', { name: 'Apply' });
      await user.click(applyButton);

      // Only the empty field should show error
      const errors = screen.getAllByText('Please enter a value');
      expect(errors).toHaveLength(1);
      expect(mockOnSubAnnotationsApply).not.toHaveBeenCalled();
    });

    it('should not show error when all checked fields have values', async () => {
      const user = userEvent.setup();
      const validFilters: FilterValue[] = [
        { fieldName: 'isActive', value: 'true', enabled: true, filterType: 'include' },
        { fieldName: 'description', value: 'test', enabled: true, filterType: 'include' }
      ];
      renderWithProvider(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          selectedSubAnnotations={validFilters}
        />
      );

      const applyButton = screen.getByRole('button', { name: 'Apply' });
      await user.click(applyButton);

      expect(screen.queryByText('Please enter a value')).not.toBeInTheDocument();
      expect(mockOnSubAnnotationsApply).toHaveBeenCalled();
    });

    it('should clear errors when Clear All is clicked', async () => {
      const user = userEvent.setup();
      const filtersWithEmpty: FilterValue[] = [
        { fieldName: 'description', value: '', enabled: true, filterType: 'include' }
      ];
      renderWithProvider(
        <FilterSubAnnotationsPanel
          {...defaultProps}
          selectedSubAnnotations={filtersWithEmpty}
        />
      );

      // Click Apply to trigger errors
      const applyButton = screen.getByRole('button', { name: 'Apply' });
      await user.click(applyButton);
      expect(screen.getByText('Please enter a value')).toBeInTheDocument();

      // Click Clear all to clear errors
      const clearAllButton = screen.getByRole('button', { name: 'Clear all' });
      await user.click(clearAllButton);

      expect(screen.queryByText('Please enter a value')).not.toBeInTheDocument();
    });

    it('should not show error when no fields are checked', async () => {
      const user = userEvent.setup();
      renderWithProvider(<FilterSubAnnotationsPanel {...defaultProps} />);

      const applyButton = screen.getByRole('button', { name: 'Apply' });
      await user.click(applyButton);

      expect(screen.queryByText('Please enter a value')).not.toBeInTheDocument();
      expect(mockOnSubAnnotationsApply).toHaveBeenCalledWith([]);
    });
  });
});
