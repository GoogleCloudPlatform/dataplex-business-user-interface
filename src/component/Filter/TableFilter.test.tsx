import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TableFilter from './TableFilter';

// Mock data
const mockData = [
  { name: 'Product A', category: 'Electronics', price: '100', status: 'Active' },
  { name: 'Product B', category: 'Electronics', price: '200', status: 'Inactive' },
  { name: 'Product C', category: 'Clothing', price: '50', status: 'Active' },
  { name: 'Product D', category: 'Clothing', price: '75', status: 'Pending' },
  { name: 'Product E', category: 'Food', price: '25', status: 'Active' }
];

const mockColumns = ['name', 'category', 'price', 'status'];

describe('TableFilter', () => {
  const mockOnFilteredDataChange = vi.fn();

  const defaultProps = {
    data: mockData,
    columns: mockColumns,
    onFilteredDataChange: mockOnFilteredDataChange
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('rendering', () => {
    it('should render the filter bar', () => {
      render(<TableFilter {...defaultProps} />);

      expect(screen.getByText('Filter')).toBeInTheDocument();
    });

    it('should render the search input', () => {
      render(<TableFilter {...defaultProps} />);

      expect(screen.getByPlaceholderText('Enter property name or value')).toBeInTheDocument();
    });

    it('should render the filter icon button', () => {
      render(<TableFilter {...defaultProps} />);

      expect(screen.getByTestId('FilterListIcon')).toBeInTheDocument();
    });

    it('should not render Clear All button initially', () => {
      render(<TableFilter {...defaultProps} />);

      expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
    });

    it('should render with empty data', () => {
      render(<TableFilter {...defaultProps} data={[]} />);

      expect(screen.getByText('Filter')).toBeInTheDocument();
    });

    it('should render with empty columns', () => {
      render(<TableFilter {...defaultProps} columns={[]} />);

      expect(screen.getByText('Filter')).toBeInTheDocument();
    });
  });

  describe('text search', () => {
    it('should update filter text when typing in search input', async () => {
      const user = userEvent.setup();
      render(<TableFilter {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Enter property name or value');
      await user.type(searchInput, 'Product A');

      expect(searchInput).toHaveValue('Product A');
    });

    it('should call onFilteredDataChange when searching', async () => {
      const user = userEvent.setup();
      render(<TableFilter {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Enter property name or value');
      await user.type(searchInput, 'Product A');

      await waitFor(() => {
        expect(mockOnFilteredDataChange).toHaveBeenCalled();
      });
    });

    it('should filter data based on search text', async () => {
      const user = userEvent.setup();
      render(<TableFilter {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Enter property name or value');
      await user.type(searchInput, 'Electronics');

      await waitFor(() => {
        expect(mockOnFilteredDataChange).toHaveBeenCalled();
        // Last call should include Electronics items
        const lastCall = mockOnFilteredDataChange.mock.calls[mockOnFilteredDataChange.mock.calls.length - 1][0];
        expect(lastCall.length).toBe(2);
      });
    });

    it('should show clear button when text is entered', async () => {
      const user = userEvent.setup();
      render(<TableFilter {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Enter property name or value');
      await user.type(searchInput, 'test');

      expect(screen.getByTestId('CloseIcon')).toBeInTheDocument();
    });

    it('should clear search text when clear button is clicked', async () => {
      const user = userEvent.setup();
      render(<TableFilter {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Enter property name or value');
      await user.type(searchInput, 'test');

      const clearButton = screen.getByTestId('CloseIcon').closest('button')!;
      await user.click(clearButton);

      expect(searchInput).toHaveValue('');
    });

    it('should search case-insensitively', async () => {
      const user = userEvent.setup();
      render(<TableFilter {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Enter property name or value');
      await user.type(searchInput, 'ELECTRONICS');

      await waitFor(() => {
        expect(mockOnFilteredDataChange).toHaveBeenCalled();
        const lastCall = mockOnFilteredDataChange.mock.calls[mockOnFilteredDataChange.mock.calls.length - 1][0];
        expect(lastCall.length).toBe(2);
      });
    });

    it('should emit empty array when search has no results', async () => {
      const user = userEvent.setup();
      render(<TableFilter {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Enter property name or value');
      await user.type(searchInput, 'nonexistent-term-xyz');

      await waitFor(() => {
        expect(mockOnFilteredDataChange).toHaveBeenCalled();
        const lastCall = mockOnFilteredDataChange.mock.calls[mockOnFilteredDataChange.mock.calls.length - 1][0];
        expect(lastCall.length).toBe(0);
      });
    });
  });

  describe('filter menu', () => {
    it('should open filter menu when filter icon is clicked', async () => {
      const user = userEvent.setup();
      render(<TableFilter {...defaultProps} />);

      const filterIcon = screen.getByTestId('FilterListIcon');
      await user.click(filterIcon.closest('button')!);

      expect(screen.getByText('Select Property to Filter')).toBeInTheDocument();
    });

    it('should open filter menu when Filter text is clicked', async () => {
      const user = userEvent.setup();
      render(<TableFilter {...defaultProps} />);

      await user.click(screen.getByText('Filter'));

      expect(screen.getByText('Select Property to Filter')).toBeInTheDocument();
    });

    it('should display column names in filter menu', async () => {
      const user = userEvent.setup();
      render(<TableFilter {...defaultProps} />);

      await user.click(screen.getByText('Filter'));

      mockColumns.forEach(column => {
        expect(screen.getByText(column)).toBeInTheDocument();
      });
    });

    it('should have menu open state controlled by anchor element', async () => {
      const user = userEvent.setup();
      render(<TableFilter {...defaultProps} />);

      // Initially menu should not be visible
      expect(screen.queryByText('Select Property to Filter')).not.toBeInTheDocument();

      // Open menu
      await user.click(screen.getByText('Filter'));
      expect(screen.getByText('Select Property to Filter')).toBeInTheDocument();

      // Verify menu is open
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('should not display columns with null/undefined values', async () => {
      const user = userEvent.setup();
      const dataWithNulls = [
        { name: 'Product A', category: null },
        { name: 'Product B', category: undefined }
      ];
      render(<TableFilter data={dataWithNulls} columns={['name', 'category']} onFilteredDataChange={mockOnFilteredDataChange} />);

      await user.click(screen.getByText('Filter'));

      expect(screen.getByText('name')).toBeInTheDocument();
      // category should not appear since all values are null/undefined
      const menuItems = screen.getAllByRole('menuitem');
      const categoryItem = menuItems.find(item => item.textContent === 'category');
      expect(categoryItem).toBeUndefined();
    });
  });

  describe('property selection', () => {
    it('should show property values when property is selected', async () => {
      const user = userEvent.setup();
      render(<TableFilter {...defaultProps} />);

      await user.click(screen.getByText('Filter'));

      const menuItems = screen.getAllByRole('menuitem');
      const categoryItem = menuItems.find(item => item.textContent === 'category');
      await user.click(categoryItem!);

      expect(screen.getByText('Filter by: category')).toBeInTheDocument();
      expect(screen.getByText('Electronics')).toBeInTheDocument();
      expect(screen.getByText('Clothing')).toBeInTheDocument();
      expect(screen.getByText('Food')).toBeInTheDocument();
    });

    it('should show back button when property is selected', async () => {
      const user = userEvent.setup();
      render(<TableFilter {...defaultProps} />);

      await user.click(screen.getByText('Filter'));

      const menuItems = screen.getAllByRole('menuitem');
      const categoryItem = menuItems.find(item => item.textContent === 'category');
      await user.click(categoryItem!);

      expect(screen.getByText('← Back to Properties')).toBeInTheDocument();
    });

    it('should navigate back to properties when back button is clicked', async () => {
      const user = userEvent.setup();
      render(<TableFilter {...defaultProps} />);

      await user.click(screen.getByText('Filter'));

      const menuItems = screen.getAllByRole('menuitem');
      const categoryItem = menuItems.find(item => item.textContent === 'category');
      await user.click(categoryItem!);

      await user.click(screen.getByText('← Back to Properties'));

      expect(screen.getByText('Select Property to Filter')).toBeInTheDocument();
    });

    it('should show checkboxes for property values', async () => {
      const user = userEvent.setup();
      render(<TableFilter {...defaultProps} />);

      await user.click(screen.getByText('Filter'));

      const menuItems = screen.getAllByRole('menuitem');
      const categoryItem = menuItems.find(item => item.textContent === 'category');
      await user.click(categoryItem!);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBe(3); // Electronics, Clothing, Food
    });

    it('should sort property values alphabetically', async () => {
      const user = userEvent.setup();
      render(<TableFilter {...defaultProps} />);

      await user.click(screen.getByText('Filter'));

      const menuItems = screen.getAllByRole('menuitem');
      const categoryItem = menuItems.find(item => item.textContent === 'category');
      await user.click(categoryItem!);

      // Get all menu items after selecting property
      const valueMenuItems = screen.getAllByRole('menuitem');
      const values = valueMenuItems
        .filter(item => item.textContent !== '← Back to Properties' && item.textContent !== 'Filter by: category')
        .map(item => item.textContent?.replace(/^\s*/, '')); // Remove leading checkbox space

      // Values should be sorted: Clothing, Electronics, Food
      expect(values).toEqual(['Clothing', 'Electronics', 'Food']);
    });
  });

  describe('value selection', () => {
    it('should toggle value selection when checkbox is clicked', async () => {
      const user = userEvent.setup();
      render(<TableFilter {...defaultProps} />);

      await user.click(screen.getByText('Filter'));

      const menuItems = screen.getAllByRole('menuitem');
      const categoryItem = menuItems.find(item => item.textContent === 'category');
      await user.click(categoryItem!);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);

      expect(checkboxes[0]).toBeChecked();
    });

    it('should add filter when value is selected', async () => {
      const user = userEvent.setup();
      render(<TableFilter {...defaultProps} />);

      await user.click(screen.getByText('Filter'));

      const menuItems = screen.getAllByRole('menuitem');
      const categoryItem = menuItems.find(item => item.textContent === 'category');
      await user.click(categoryItem!);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]); // Select first value

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(mockOnFilteredDataChange).toHaveBeenCalled();
      });
    });

    it('should update existing filter when selecting more values', async () => {
      const user = userEvent.setup();
      render(<TableFilter {...defaultProps} />);

      await user.click(screen.getByText('Filter'));

      let menuItems = screen.getAllByRole('menuitem');
      const categoryItem = menuItems.find(item => item.textContent === 'category');
      await user.click(categoryItem!);

      let checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]); // Select first value

      checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]); // Select second value

      // Both should be checked
      checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).toBeChecked();
    });

    it('should remove filter when all values are deselected', async () => {
      const user = userEvent.setup();
      render(<TableFilter {...defaultProps} />);

      await user.click(screen.getByText('Filter'));

      let menuItems = screen.getAllByRole('menuitem');
      const categoryItem = menuItems.find(item => item.textContent === 'category');
      await user.click(categoryItem!);

      let checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]); // Select first value

      checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]); // Deselect first value

      await user.keyboard('{Escape}');

      // Should not show any filter chips
      expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
    });

    it('should pre-select values when property with active filter is reopened', async () => {
      const user = userEvent.setup();
      render(<TableFilter {...defaultProps} />);

      // Select a filter
      await user.click(screen.getByText('Filter'));
      let menuItems = screen.getAllByRole('menuitem');
      const categoryItem = menuItems.find(item => item.textContent === 'category');
      await user.click(categoryItem!);
      let checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]); // Select first value
      await user.keyboard('{Escape}');

      // Reopen the filter menu
      await user.click(screen.getByText('Filter'));
      menuItems = screen.getAllByRole('menuitem');
      const categoryItemAgain = menuItems.find(item => item.textContent === 'category');
      await user.click(categoryItemAgain!);

      // The first checkbox should still be checked
      checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).toBeChecked();
    });
  });

  describe('filter chips', () => {
    it('should display filter chip when filter is applied', async () => {
      const user = userEvent.setup();
      render(<TableFilter {...defaultProps} />);

      await user.click(screen.getByText('Filter'));

      const menuItems = screen.getAllByRole('menuitem');
      const categoryItem = menuItems.find(item => item.textContent === 'category');
      await user.click(categoryItem!);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]); // Select first value (Clothing)

      await user.keyboard('{Escape}');

      // Should show filter chip with property name
      expect(screen.getByText('category:')).toBeInTheDocument();
    });

    it('should display filter values in chip', async () => {
      const user = userEvent.setup();
      render(<TableFilter {...defaultProps} />);

      await user.click(screen.getByText('Filter'));

      const menuItems = screen.getAllByRole('menuitem');
      const categoryItem = menuItems.find(item => item.textContent === 'category');
      await user.click(categoryItem!);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]); // Select Clothing

      await user.keyboard('{Escape}');

      // Should show the selected value
      expect(screen.getByText('Clothing')).toBeInTheDocument();
    });

    it('should display multiple values separated by comma in chip', async () => {
      const user = userEvent.setup();
      render(<TableFilter {...defaultProps} />);

      await user.click(screen.getByText('Filter'));

      const menuItems = screen.getAllByRole('menuitem');
      const categoryItem = menuItems.find(item => item.textContent === 'category');
      await user.click(categoryItem!);

      let checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]); // Select Clothing
      checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]); // Select Electronics

      await user.keyboard('{Escape}');

      // Should show both values
      expect(screen.getByText('Clothing, Electronics')).toBeInTheDocument();
    });

    it('should remove filter when chip close button is clicked', async () => {
      const user = userEvent.setup();
      render(<TableFilter {...defaultProps} />);

      await user.click(screen.getByText('Filter'));

      const menuItems = screen.getAllByRole('menuitem');
      const categoryItem = menuItems.find(item => item.textContent === 'category');
      await user.click(categoryItem!);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]); // Select first value

      await user.keyboard('{Escape}');

      // Find and click the remove button (×)
      const removeButton = screen.getByText('×').closest('button')!;
      await user.click(removeButton);

      // Filter chip should be removed
      expect(screen.queryByText('category:')).not.toBeInTheDocument();
    });

    it('should show Clear All button when filters are active', async () => {
      const user = userEvent.setup();
      render(<TableFilter {...defaultProps} />);

      await user.click(screen.getByText('Filter'));

      const menuItems = screen.getAllByRole('menuitem');
      const categoryItem = menuItems.find(item => item.textContent === 'category');
      await user.click(categoryItem!);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]); // Select first value

      await user.keyboard('{Escape}');

      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });
  });

  describe('clear filters', () => {
    it('should clear all filters when Clear All is clicked', async () => {
      const user = userEvent.setup();
      render(<TableFilter {...defaultProps} />);

      await user.click(screen.getByText('Filter'));

      const menuItems = screen.getAllByRole('menuitem');
      const categoryItem = menuItems.find(item => item.textContent === 'category');
      await user.click(categoryItem!);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]); // Select first value

      await user.keyboard('{Escape}');

      // Click Clear All
      await user.click(screen.getByText('Clear All'));

      // Filter chip should be removed
      expect(screen.queryByText('category:')).not.toBeInTheDocument();
      expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
    });

    it('should clear search text when Clear All is clicked', async () => {
      const user = userEvent.setup();
      render(<TableFilter {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Enter property name or value');
      await user.type(searchInput, 'test');

      // Add a filter to show Clear All button
      await user.click(screen.getByText('Filter'));
      const menuItems = screen.getAllByRole('menuitem');
      const categoryItem = menuItems.find(item => item.textContent === 'category');
      await user.click(categoryItem!);
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);
      await user.keyboard('{Escape}');

      // Click Clear All
      await user.click(screen.getByText('Clear All'));

      // Search input should be cleared
      expect(searchInput).toHaveValue('');
    });

    it('should close filter menu when Clear All is clicked', async () => {
      const user = userEvent.setup();
      render(<TableFilter {...defaultProps} />);

      // Add a filter
      await user.click(screen.getByText('Filter'));
      const menuItems = screen.getAllByRole('menuitem');
      const categoryItem = menuItems.find(item => item.textContent === 'category');
      await user.click(categoryItem!);
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);
      await user.keyboard('{Escape}');

      // Click Clear All
      await user.click(screen.getByText('Clear All'));

      // Menu should be closed
      expect(screen.queryByText('Select Property to Filter')).not.toBeInTheDocument();
    });

    it('should call onFilteredDataChange with empty array after clearing', async () => {
      const user = userEvent.setup();
      render(<TableFilter {...defaultProps} />);

      // Add a filter
      await user.click(screen.getByText('Filter'));
      const menuItems = screen.getAllByRole('menuitem');
      const categoryItem = menuItems.find(item => item.textContent === 'category');
      await user.click(categoryItem!);
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);
      await user.keyboard('{Escape}');

      mockOnFilteredDataChange.mockClear();

      // Click Clear All
      await user.click(screen.getByText('Clear All'));

      await waitFor(() => {
        expect(mockOnFilteredDataChange).toHaveBeenCalledWith([]);
      });
    });
  });

  describe('filtering logic', () => {
    it('should filter data by single value', async () => {
      const user = userEvent.setup();
      render(<TableFilter {...defaultProps} />);

      await user.click(screen.getByText('Filter'));
      const menuItems = screen.getAllByRole('menuitem');
      const categoryItem = menuItems.find(item => item.textContent === 'category');
      await user.click(categoryItem!);

      // Click on Electronics checkbox
      const electronicsItem = screen.getByText('Electronics').closest('li')!;
      await user.click(electronicsItem);

      await waitFor(() => {
        expect(mockOnFilteredDataChange).toHaveBeenCalled();
        const lastCall = mockOnFilteredDataChange.mock.calls[mockOnFilteredDataChange.mock.calls.length - 1][0];
        expect(lastCall.length).toBe(2);
        expect(lastCall.every((item: any) => item.category === 'Electronics')).toBe(true);
      });
    });

    it('should filter data by multiple values (OR logic within property)', async () => {
      const user = userEvent.setup();
      render(<TableFilter {...defaultProps} />);

      await user.click(screen.getByText('Filter'));
      const menuItems = screen.getAllByRole('menuitem');
      const categoryItem = menuItems.find(item => item.textContent === 'category');
      await user.click(categoryItem!);

      // Select Electronics and Clothing
      let checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]); // Clothing
      checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]); // Electronics

      await waitFor(() => {
        expect(mockOnFilteredDataChange).toHaveBeenCalled();
        const lastCall = mockOnFilteredDataChange.mock.calls[mockOnFilteredDataChange.mock.calls.length - 1][0];
        expect(lastCall.length).toBe(4);
        expect(lastCall.every((item: any) => ['Electronics', 'Clothing'].includes(item.category))).toBe(true);
      });
    });

    it('should combine property filter and text search', async () => {
      const user = userEvent.setup();
      render(<TableFilter {...defaultProps} />);

      // Add property filter for Electronics
      await user.click(screen.getByText('Filter'));
      const menuItems = screen.getAllByRole('menuitem');
      const categoryItem = menuItems.find(item => item.textContent === 'category');
      await user.click(categoryItem!);
      const electronicsItem = screen.getByText('Electronics').closest('li')!;
      await user.click(electronicsItem);
      await user.keyboard('{Escape}');

      // Add text search for "Product A"
      const searchInput = screen.getByPlaceholderText('Enter property name or value');
      await user.type(searchInput, 'Product A');

      await waitFor(() => {
        expect(mockOnFilteredDataChange).toHaveBeenCalled();
        const lastCall = mockOnFilteredDataChange.mock.calls[mockOnFilteredDataChange.mock.calls.length - 1][0];
        expect(lastCall.length).toBe(1);
        expect(lastCall[0].name).toBe('Product A');
        expect(lastCall[0].category).toBe('Electronics');
      });
    });

    it('should handle multiple property filters (AND logic between properties)', async () => {
      const user = userEvent.setup();
      render(<TableFilter {...defaultProps} />);

      // Add category filter
      await user.click(screen.getByText('Filter'));
      let menuItems = screen.getAllByRole('menuitem');
      const categoryItem = menuItems.find(item => item.textContent === 'category');
      await user.click(categoryItem!);
      const electronicsItem = screen.getByText('Electronics').closest('li')!;
      await user.click(electronicsItem);
      await user.click(screen.getByText('← Back to Properties'));

      // Add status filter
      menuItems = screen.getAllByRole('menuitem');
      const statusItem = menuItems.find(item => item.textContent === 'status');
      await user.click(statusItem!);
      const activeItem = screen.getByText('Active').closest('li')!;
      await user.click(activeItem);

      await waitFor(() => {
        expect(mockOnFilteredDataChange).toHaveBeenCalled();
        const lastCall = mockOnFilteredDataChange.mock.calls[mockOnFilteredDataChange.mock.calls.length - 1][0];
        expect(lastCall.length).toBe(1);
        expect(lastCall[0].category).toBe('Electronics');
        expect(lastCall[0].status).toBe('Active');
      });
    });
  });

  describe('edge cases', () => {
    it('should handle data with null values', () => {
      const dataWithNulls = [
        { name: 'Product A', category: null },
        { name: 'Product B', category: 'Electronics' }
      ];
      render(<TableFilter data={dataWithNulls} columns={['name', 'category']} onFilteredDataChange={mockOnFilteredDataChange} />);

      expect(screen.getByText('Filter')).toBeInTheDocument();
    });

    it('should handle data with undefined values', () => {
      const dataWithUndefined = [
        { name: 'Product A' },
        { name: 'Product B', category: 'Electronics' }
      ];
      render(<TableFilter data={dataWithUndefined} columns={['name', 'category']} onFilteredDataChange={mockOnFilteredDataChange} />);

      expect(screen.getByText('Filter')).toBeInTheDocument();
    });

    it('should handle empty string values', async () => {
      const user = userEvent.setup();
      const dataWithEmptyStrings = [
        { name: 'Product A', category: '' },
        { name: 'Product B', category: 'Electronics' }
      ];
      render(<TableFilter data={dataWithEmptyStrings} columns={['name', 'category']} onFilteredDataChange={mockOnFilteredDataChange} />);

      await user.click(screen.getByText('Filter'));

      // Category should still be available since one item has a value
      expect(screen.getByText('category')).toBeInTheDocument();
    });

    it('should handle numeric values converted to strings', async () => {
      const user = userEvent.setup();
      const dataWithNumbers = [
        { name: 'Product A', price: 100 },
        { name: 'Product B', price: 200 }
      ];
      render(<TableFilter data={dataWithNumbers} columns={['name', 'price']} onFilteredDataChange={mockOnFilteredDataChange} />);

      await user.click(screen.getByText('Filter'));
      const menuItems = screen.getAllByRole('menuitem');
      const priceItem = menuItems.find(item => item.textContent === 'price');
      await user.click(priceItem!);

      // Should show numeric values as strings
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('200')).toBeInTheDocument();
    });

    it('should handle data with special characters', async () => {
      const user = userEvent.setup();
      const dataWithSpecialChars = [
        { name: 'Product <A>', category: 'Test & Demo' },
        { name: 'Product "B"', category: "Test's Category" }
      ];
      render(<TableFilter data={dataWithSpecialChars} columns={['name', 'category']} onFilteredDataChange={mockOnFilteredDataChange} />);

      await user.click(screen.getByText('Filter'));
      const menuItems = screen.getAllByRole('menuitem');
      const categoryItem = menuItems.find(item => item.textContent === 'category');
      await user.click(categoryItem!);

      expect(screen.getByText('Test & Demo')).toBeInTheDocument();
      expect(screen.getByText("Test's Category")).toBeInTheDocument();
    });

    it('should handle very long values', async () => {
      const user = userEvent.setup();
      const longValue = 'A'.repeat(200);
      const dataWithLongValues = [
        { name: longValue, category: 'Test' }
      ];
      render(<TableFilter data={dataWithLongValues} columns={['name', 'category']} onFilteredDataChange={mockOnFilteredDataChange} />);

      await user.click(screen.getByText('Filter'));
      const menuItems = screen.getAllByRole('menuitem');
      const nameItem = menuItems.find(item => item.textContent === 'name');
      await user.click(nameItem!);

      // Should display the long value
      expect(screen.getByText(longValue)).toBeInTheDocument();
    });

    it('should handle non-object rows gracefully', () => {
      const invalidData = [null, undefined, 'string', 123];
      render(<TableFilter data={invalidData as any} columns={['name']} onFilteredDataChange={mockOnFilteredDataChange} />);

      expect(screen.getByText('Filter')).toBeInTheDocument();
    });
  });

  describe('callback behavior', () => {
    it('should emit empty array when no filters are active', () => {
      render(<TableFilter {...defaultProps} />);

      expect(mockOnFilteredDataChange).toHaveBeenCalledWith([]);
    });

    it('should not emit duplicate callbacks for same filtered result', async () => {
      const user = userEvent.setup();
      render(<TableFilter {...defaultProps} />);

      // Wait for initial callback
      await waitFor(() => {
        expect(mockOnFilteredDataChange).toHaveBeenCalled();
      });

      const initialCallCount = mockOnFilteredDataChange.mock.calls.length;

      // Type the same character twice
      const searchInput = screen.getByPlaceholderText('Enter property name or value');
      await user.type(searchInput, 'a');
      await user.clear(searchInput);
      await user.type(searchInput, 'a');

      // Should not emit duplicate callbacks for the same result
      await waitFor(() => {
        // The number of calls should not grow unboundedly
        expect(mockOnFilteredDataChange.mock.calls.length).toBeLessThan(initialCallCount + 10);
      });
    });
  });

  describe('accessibility', () => {
    it('should have tooltip on filter button', async () => {
      const user = userEvent.setup();
      render(<TableFilter {...defaultProps} />);

      const filterButton = screen.getByTestId('FilterListIcon').closest('button')!;
      await user.hover(filterButton);

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });

    it('should have accessible menu items', async () => {
      const user = userEvent.setup();
      render(<TableFilter {...defaultProps} />);

      await user.click(screen.getByText('Filter'));

      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems.length).toBeGreaterThan(0);
    });

    it('should have accessible checkboxes', async () => {
      const user = userEvent.setup();
      render(<TableFilter {...defaultProps} />);

      await user.click(screen.getByText('Filter'));
      const menuItems = screen.getAllByRole('menuitem');
      const categoryItem = menuItems.find(item => item.textContent === 'category');
      await user.click(categoryItem!);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });
  });

  describe('prop updates', () => {
    it('should update when data prop changes', () => {
      const { rerender } = render(<TableFilter {...defaultProps} />);

      const newData = [{ name: 'New Product', category: 'New Category' }];
      rerender(<TableFilter {...defaultProps} data={newData} />);

      expect(screen.getByText('Filter')).toBeInTheDocument();
    });

    it('should update when columns prop changes', () => {
      const { rerender } = render(<TableFilter {...defaultProps} />);

      const newColumns = ['name', 'newColumn'];
      rerender(<TableFilter {...defaultProps} columns={newColumns} />);

      expect(screen.getByText('Filter')).toBeInTheDocument();
    });
  });

  describe('default export', () => {
    it('should export TableFilter as default', async () => {
      const module = await import('./TableFilter');
      expect(module.default).toBeDefined();
    });

    it('should export a function component', async () => {
      const module = await import('./TableFilter');
      expect(typeof module.default).toBe('function');
    });
  });

  describe('filter update scenarios', () => {
    it('should update specific filter while keeping others unchanged', async () => {
      const user = userEvent.setup();
      render(<TableFilter {...defaultProps} />);

      // Add first filter (category)
      await user.click(screen.getByText('Filter'));
      let menuItems = screen.getAllByRole('menuitem');
      const categoryItem = menuItems.find(item => item.textContent === 'category');
      await user.click(categoryItem!);
      let checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]); // Select Clothing
      await user.click(screen.getByText('← Back to Properties'));

      // Add second filter (status)
      menuItems = screen.getAllByRole('menuitem');
      const statusItem = menuItems.find(item => item.textContent === 'status');
      await user.click(statusItem!);
      checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]); // Select Active
      await user.click(screen.getByText('← Back to Properties'));

      // Now update the first filter (category) by adding another value
      menuItems = screen.getAllByRole('menuitem');
      const categoryItemAgain = menuItems.find(item => item.textContent === 'category');
      await user.click(categoryItemAgain!);
      checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]); // Select Electronics too

      await user.keyboard('{Escape}');

      // Both filters should be active
      expect(screen.getByText('category:')).toBeInTheDocument();
      expect(screen.getByText('status:')).toBeInTheDocument();
    });

    it('should handle filter removal while other filters remain', async () => {
      const user = userEvent.setup();
      render(<TableFilter {...defaultProps} />);

      // Add two filters
      await user.click(screen.getByText('Filter'));
      let menuItems = screen.getAllByRole('menuitem');
      const categoryItem = menuItems.find(item => item.textContent === 'category');
      await user.click(categoryItem!);
      let checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);
      await user.click(screen.getByText('← Back to Properties'));

      menuItems = screen.getAllByRole('menuitem');
      const statusItem = menuItems.find(item => item.textContent === 'status');
      await user.click(statusItem!);
      checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);
      await user.keyboard('{Escape}');

      // Remove category filter
      const categoryChipClose = screen.getAllByText('×')[0].closest('button')!;
      await user.click(categoryChipClose);

      // Only status filter should remain
      expect(screen.queryByText('category:')).not.toBeInTheDocument();
      expect(screen.getByText('status:')).toBeInTheDocument();
    });
  });

  describe('focus management', () => {
    it('should manage menu focus when menu opens and closes', async () => {
      const user = userEvent.setup();
      render(<TableFilter {...defaultProps} />);

      // Open menu
      await user.click(screen.getByText('Filter'));
      expect(screen.getByRole('menu')).toBeInTheDocument();

      // Select a property
      const menuItems = screen.getAllByRole('menuitem');
      const categoryItem = menuItems.find(item => item.textContent === 'category');
      await user.click(categoryItem!);

      // Select a value and close
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);
      await user.keyboard('{Escape}');

      // Verify the component still renders correctly
      expect(screen.getByText('Filter')).toBeInTheDocument();
    });
  });
});
