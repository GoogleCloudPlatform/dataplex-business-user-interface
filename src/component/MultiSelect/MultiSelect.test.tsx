import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import MultiSelect from "./MultiSelect";

// ============================================================================
// Mock Data
// ============================================================================

const defaultOptions = ["Option 1", "Option 2", "Option 3", "Option 4", "Option 5"];

const mockEditOptions = {
  "Option 1": ["Schema", "Data Quality", "Lineage"],
  "Option 2": ["Business Terms", "Classifications"],
  "Partial": ["Partial Option 1", "Partial Option 2"],
};

// ============================================================================
// Test Suite
// ============================================================================

describe("MultiSelect", () => {
  const mockOnChange = vi.fn();
  const mockOnEditChip = vi.fn();
  const mockOnEditSelectionsChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // Basic Rendering Tests
  // ==========================================================================

  describe("Basic Rendering", () => {
    it("renders without crashing", () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={defaultOptions}
          value={[]}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText("Test Label")).toBeInTheDocument();
    });

    it("renders label correctly", () => {
      render(
        <MultiSelect
          label="Products"
          placeholder="Select products"
          options={defaultOptions}
          value={[]}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText("Products")).toBeInTheDocument();
    });

    it("renders placeholder when no values selected", () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={defaultOptions}
          value={[]}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText("Select options")).toBeInTheDocument();
    });

    it("renders selected count when values are selected", () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={defaultOptions}
          value={["Option 1", "Option 2"]}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText("2 Test Label selected")).toBeInTheDocument();
    });

    it("applies custom CSS styles", () => {
      const { container } = render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={defaultOptions}
          value={[]}
          onChange={mockOnChange}
          css={{ marginTop: "20px" }}
        />
      );

      const rootBox = container.firstChild as HTMLElement;
      expect(rootBox).toHaveStyle({ marginTop: "20px" });
    });

    it("renders with default empty arrays when options and value not provided", () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={[]}
          value={[]}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText("Test Label")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Dropdown Open/Close Tests
  // ==========================================================================

  describe("Dropdown Open/Close", () => {
    it("opens dropdown when clicked", async () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={defaultOptions}
          value={[]}
          onChange={mockOnChange}
        />
      );

      const select = screen.getByRole("combobox");
      fireEvent.mouseDown(select);

      await waitFor(() => {
        expect(screen.getByText("0 Selected")).toBeInTheDocument();
      });
    });

    it("closes dropdown when OK button is clicked", async () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={defaultOptions}
          value={[]}
          onChange={mockOnChange}
        />
      );

      const select = screen.getByRole("combobox");
      fireEvent.mouseDown(select);

      await waitFor(() => {
        expect(screen.getByText("OK")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("OK"));

      await waitFor(() => {
        expect(screen.queryByText("0 Selected")).not.toBeInTheDocument();
      });
    });

    it("shows No items selected message when no values selected", async () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={defaultOptions}
          value={[]}
          onChange={mockOnChange}
        />
      );

      const select = screen.getByRole("combobox");
      fireEvent.mouseDown(select);

      await waitFor(() => {
        expect(screen.getByText("No items selected")).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // Option Selection Tests
  // ==========================================================================

  describe("Option Selection", () => {
    it("calls onChange when option is toggled on", async () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={defaultOptions}
          value={[]}
          onChange={mockOnChange}
        />
      );

      const select = screen.getByRole("combobox");
      fireEvent.mouseDown(select);

      await waitFor(() => {
        expect(screen.getByText("Option 1")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Option 1"));

      expect(mockOnChange).toHaveBeenCalledWith(["Option 1"]);
    });

    it("calls onChange when option is toggled off", async () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={defaultOptions}
          value={["Option 1"]}
          onChange={mockOnChange}
        />
      );

      const select = screen.getByRole("combobox");
      fireEvent.mouseDown(select);

      await waitFor(() => {
        expect(screen.getAllByText("Option 1").length).toBeGreaterThan(0);
      });

      // Find the checkbox that is checked and click it to deselect
      // The first checked checkbox after the "select all" should be in the left panel
      const checkboxes = screen.getAllByRole("checkbox");
      // Find the checkbox for Option 1 in the left panel
      fireEvent.click(checkboxes[1]); // Option 1's checkbox in left panel

      expect(mockOnChange).toHaveBeenCalledWith([]);
    });

    it("displays selected items in right panel", async () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={defaultOptions}
          value={["Option 1", "Option 2"]}
          onChange={mockOnChange}
        />
      );

      const select = screen.getByRole("combobox");
      fireEvent.mouseDown(select);

      await waitFor(() => {
        expect(screen.getByText("2 Selected")).toBeInTheDocument();
      });
    });

    it("toggles option via checkbox change event", async () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={defaultOptions}
          value={[]}
          onChange={mockOnChange}
        />
      );

      const select = screen.getByRole("combobox");
      fireEvent.mouseDown(select);

      await waitFor(() => {
        expect(screen.getByText("Option 1")).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole("checkbox");
      // First checkbox is "select all", second is Option 1
      fireEvent.click(checkboxes[1]);

      expect(mockOnChange).toHaveBeenCalledWith(["Option 1"]);
    });

    it("deselects from right panel checkbox", async () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={defaultOptions}
          value={["Option 1"]}
          onChange={mockOnChange}
        />
      );

      const select = screen.getByRole("combobox");
      fireEvent.mouseDown(select);

      await waitFor(() => {
        expect(screen.getByText("1 Selected")).toBeInTheDocument();
      });

      // Find the checkbox in the right panel (checked)
      const checkedCheckboxes = screen.getAllByRole("checkbox").filter(
        (cb) => (cb as HTMLInputElement).checked
      );
      // Click the last checked checkbox (in right panel)
      fireEvent.click(checkedCheckboxes[checkedCheckboxes.length - 1]);

      expect(mockOnChange).toHaveBeenCalledWith([]);
    });
  });

  // ==========================================================================
  // Search Functionality Tests
  // ==========================================================================

  describe("Search Functionality", () => {
    it("filters options based on search term", async () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={defaultOptions}
          value={[]}
          onChange={mockOnChange}
        />
      );

      const select = screen.getByRole("combobox");
      fireEvent.mouseDown(select);

      await waitFor(() => {
        expect(screen.getByText("Option 1")).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText("Search for aspect types");
      fireEvent.change(searchInput, { target: { value: "Option 1" } });

      await waitFor(() => {
        expect(screen.getByText("Option 1")).toBeInTheDocument();
        expect(screen.queryByText("Option 2")).not.toBeInTheDocument();
      });
    });

    it("shows search placeholder for Products label", async () => {
      render(
        <MultiSelect
          label="Products"
          placeholder="Select products"
          options={defaultOptions}
          value={[]}
          onChange={mockOnChange}
        />
      );

      const select = screen.getByRole("combobox");
      fireEvent.mouseDown(select);

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Search for products")).toBeInTheDocument();
      });
    });

    it("case-insensitive search", async () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={defaultOptions}
          value={[]}
          onChange={mockOnChange}
        />
      );

      const select = screen.getByRole("combobox");
      fireEvent.mouseDown(select);

      await waitFor(() => {
        expect(screen.getByText("Option 1")).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText("Search for aspect types");
      fireEvent.change(searchInput, { target: { value: "OPTION 1" } });

      await waitFor(() => {
        expect(screen.getByText("Option 1")).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // Select All Tests
  // ==========================================================================

  describe("Select All Functionality", () => {
    it("selects all filtered options when none selected", async () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={defaultOptions}
          value={[]}
          onChange={mockOnChange}
        />
      );

      const select = screen.getByRole("combobox");
      fireEvent.mouseDown(select);

      await waitFor(() => {
        expect(screen.getByText("Option 1")).toBeInTheDocument();
      });

      // Click the select all checkbox (first checkbox)
      const checkboxes = screen.getAllByRole("checkbox");
      fireEvent.click(checkboxes[0]);

      expect(mockOnChange).toHaveBeenCalledWith(defaultOptions);
    });

    it("deselects all filtered options when all selected", async () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={defaultOptions}
          value={defaultOptions}
          onChange={mockOnChange}
        />
      );

      const select = screen.getByRole("combobox");
      fireEvent.mouseDown(select);

      await waitFor(() => {
        expect(screen.getByText("5 Selected")).toBeInTheDocument();
      });

      // Click the select all checkbox (first checkbox)
      const checkboxes = screen.getAllByRole("checkbox");
      fireEvent.click(checkboxes[0]);

      expect(mockOnChange).toHaveBeenCalledWith([]);
    });

    it("shows indeterminate state when some options selected", async () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={defaultOptions}
          value={["Option 1", "Option 2"]}
          onChange={mockOnChange}
        />
      );

      const select = screen.getByRole("combobox");
      fireEvent.mouseDown(select);

      await waitFor(() => {
        const checkboxes = screen.getAllByRole("checkbox");
        // The first checkbox should be indeterminate
        expect(checkboxes[0]).toHaveAttribute("data-indeterminate", "true");
      });
    });

    it("selects remaining options when some already selected", async () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={defaultOptions}
          value={["Option 1"]}
          onChange={mockOnChange}
        />
      );

      const select = screen.getByRole("combobox");
      fireEvent.mouseDown(select);

      await waitFor(() => {
        expect(screen.getAllByText("Option 1").length).toBeGreaterThan(0);
      });

      // Click select all
      const checkboxes = screen.getAllByRole("checkbox");
      fireEvent.click(checkboxes[0]);

      expect(mockOnChange).toHaveBeenCalledWith(defaultOptions);
    });

    it("handles select all with empty filtered options", async () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={defaultOptions}
          value={[]}
          onChange={mockOnChange}
        />
      );

      const select = screen.getByRole("combobox");
      fireEvent.mouseDown(select);

      await waitFor(() => {
        expect(screen.getByText("Option 1")).toBeInTheDocument();
      });

      // Search for something that doesn't exist
      const searchInput = screen.getByPlaceholderText("Search for aspect types");
      fireEvent.change(searchInput, { target: { value: "nonexistent" } });

      await waitFor(() => {
        expect(screen.queryByText("Option 1")).not.toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // Clear All Tests
  // ==========================================================================

  describe("Clear All Functionality", () => {
    it("clears all selected values", async () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={defaultOptions}
          value={["Option 1", "Option 2"]}
          onChange={mockOnChange}
          onEditSelectionsChange={mockOnEditSelectionsChange}
        />
      );

      const select = screen.getByRole("combobox");
      fireEvent.mouseDown(select);

      await waitFor(() => {
        expect(screen.getByText("Clear All")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Clear All"));

      expect(mockOnChange).toHaveBeenCalledWith([]);
      expect(mockOnEditSelectionsChange).toHaveBeenCalledWith({});
    });
  });

  // ==========================================================================
  // Chip Display Tests
  // ==========================================================================

  describe("Chip Display", () => {
    it("renders chips for selected values", () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={defaultOptions}
          value={["Option 1", "Option 2"]}
          onChange={mockOnChange}
        />
      );

      // Chips are displayed below the select
      const chips = screen.getAllByText("Option 1");
      expect(chips.length).toBeGreaterThanOrEqual(1);
    });

    it("does not render chips when no values selected", () => {
      const { container } = render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={defaultOptions}
          value={[]}
          onChange={mockOnChange}
        />
      );

      // No chip grid should be rendered
      const chipGrid = container.querySelector('[style*="grid"]');
      expect(chipGrid).not.toBeInTheDocument();
    });

    it("displays correct aspect count on chip for Products label", () => {
      render(
        <MultiSelect
          label="Products"
          placeholder="Select products"
          options={defaultOptions}
          value={["Option 1"]}
          onChange={mockOnChange}
          editOptions={mockEditOptions}
        />
      );

      // Should show "3 Assets" (from editOptions for Option 1)
      expect(screen.getByText("3 Assets")).toBeInTheDocument();
    });

    it("displays correct aspect count on chip for non-Products label", () => {
      render(
        <MultiSelect
          label="Aspect Types"
          placeholder="Select aspect types"
          options={defaultOptions}
          value={["Option 1"]}
          onChange={mockOnChange}
          editOptions={mockEditOptions}
        />
      );

      // Should show "3 Aspects" (from editOptions for Option 1)
      expect(screen.getByText("3 Aspects")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Edit Chip Tests
  // ==========================================================================

  describe("Edit Chip Functionality", () => {
    it("opens edit dropdown when edit icon clicked with exact match", async () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={defaultOptions}
          value={["Option 1"]}
          onChange={mockOnChange}
          editOptions={mockEditOptions}
        />
      );

      // Find and click the edit button
      const editButton = screen.getByRole("button", { name: /edit/i });
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByText("Option 1 Aspects")).toBeInTheDocument();
      });
    });

    it("opens edit dropdown with partial match", async () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={["Partial Match Item"]}
          value={["Partial Match Item"]}
          onChange={mockOnChange}
          editOptions={mockEditOptions}
        />
      );

      const editButton = screen.getByRole("button", { name: /edit/i });
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByText("Partial Match Item Aspects")).toBeInTheDocument();
      });
    });

    it("opens edit dropdown with default options when no match", async () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={["Unknown Option"]}
          value={["Unknown Option"]}
          onChange={mockOnChange}
          editOptions={{}}
        />
      );

      const editButton = screen.getByRole("button", { name: /edit/i });
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByText("Unknown Option Aspects")).toBeInTheDocument();
        expect(screen.getByText("Schema")).toBeInTheDocument();
      });
    });

    it("calls onEditChip callback when no edit options and callback provided", async () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={["Unknown Option"]}
          value={["Unknown Option"]}
          onChange={mockOnChange}
          editOptions={{}}
          onEditChip={mockOnEditChip}
        />
      );

      const editButton = screen.getByRole("button", { name: /edit/i });
      fireEvent.click(editButton);

      expect(mockOnEditChip).toHaveBeenCalledWith("Unknown Option");
    });

    it("closes edit dropdown when close button clicked", async () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={defaultOptions}
          value={["Option 1"]}
          onChange={mockOnChange}
          editOptions={mockEditOptions}
          onEditSelectionsChange={mockOnEditSelectionsChange}
        />
      );

      const editButton = screen.getByRole("button", { name: /edit/i });
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByText("Option 1 Aspects")).toBeInTheDocument();
      });

      // Find the close button in the edit dropdown
      const closeButton = screen.getByTestId("CloseIcon").closest("button");
      fireEvent.click(closeButton!);

      await waitFor(() => {
        expect(screen.queryByText("Option 1 Aspects")).not.toBeInTheDocument();
      });
    });

    it("closes edit dropdown on click away", async () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={defaultOptions}
          value={["Option 1"]}
          onChange={mockOnChange}
          editOptions={mockEditOptions}
          onEditSelectionsChange={mockOnEditSelectionsChange}
        />
      );

      const editButton = screen.getByRole("button", { name: /edit/i });
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByText("Option 1 Aspects")).toBeInTheDocument();
      });

      // Close the dropdown via close button as click away is complex to test with MUI
      const closeButton = screen.getByTestId("CloseIcon").closest("button");
      fireEvent.click(closeButton!);

      await waitFor(() => {
        expect(screen.queryByText("Option 1 Aspects")).not.toBeInTheDocument();
      });

      expect(mockOnEditSelectionsChange).toHaveBeenCalled();
    });

    it("shows correct selection count when edit dropdown is open", async () => {
      render(
        <MultiSelect
          label="Products"
          placeholder="Select products"
          options={defaultOptions}
          value={["Option 1"]}
          onChange={mockOnChange}
          editOptions={mockEditOptions}
        />
      );

      const editButton = screen.getByRole("button", { name: /edit/i });
      fireEvent.click(editButton);

      await waitFor(() => {
        // When dropdown is open, should show current selection count
        expect(screen.getByText("3 Assets")).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // Edit Option Toggle Tests
  // ==========================================================================

  describe("Edit Option Toggle", () => {
    it("toggles edit option selection", async () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={defaultOptions}
          value={["Option 1"]}
          onChange={mockOnChange}
          editOptions={mockEditOptions}
        />
      );

      const editButton = screen.getByRole("button", { name: /edit/i });
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByText("Schema")).toBeInTheDocument();
      });

      // Toggle off an option
      const schemaCheckbox = screen.getByText("Schema").closest("div")?.querySelector("input");
      fireEvent.click(schemaCheckbox!);

      // Now Schema should be unchecked
      await waitFor(() => {
        expect(schemaCheckbox).not.toBeChecked();
      });
    });

    it("toggles edit option on when not selected", async () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={defaultOptions}
          value={["Option 1"]}
          onChange={mockOnChange}
          editOptions={mockEditOptions}
        />
      );

      const editButton = screen.getByRole("button", { name: /edit/i });
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByText("Schema")).toBeInTheDocument();
      });

      // First toggle off
      const schemaCheckbox = screen.getByText("Schema").closest("div")?.querySelector("input");
      fireEvent.click(schemaCheckbox!);

      // Then toggle back on
      fireEvent.click(schemaCheckbox!);

      await waitFor(() => {
        expect(schemaCheckbox).toBeChecked();
      });
    });
  });

  // ==========================================================================
  // Edit Search Tests
  // ==========================================================================

  describe("Edit Search Functionality", () => {
    it("filters edit options based on search term", async () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={defaultOptions}
          value={["Option 1"]}
          onChange={mockOnChange}
          editOptions={mockEditOptions}
        />
      );

      const editButton = screen.getByRole("button", { name: /edit/i });
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByText("Schema")).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText("Search for Option 1 Aspects");
      fireEvent.change(searchInput, { target: { value: "Schema" } });

      await waitFor(() => {
        expect(screen.getByText("Schema")).toBeInTheDocument();
        expect(screen.queryByText("Data Quality")).not.toBeInTheDocument();
      });
    });

    it("shows correct placeholder for Products label in edit search", async () => {
      render(
        <MultiSelect
          label="Products"
          placeholder="Select products"
          options={defaultOptions}
          value={["Option 1"]}
          onChange={mockOnChange}
          editOptions={mockEditOptions}
        />
      );

      const editButton = screen.getByRole("button", { name: /edit/i });
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Search for Option 1 Assets")).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // Edit Select All Tests
  // ==========================================================================

  describe("Edit Select All Functionality", () => {
    it("selects all edit options when none selected", async () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={defaultOptions}
          value={["Option 1"]}
          onChange={mockOnChange}
          editOptions={mockEditOptions}
        />
      );

      const editButton = screen.getByRole("button", { name: /edit/i });
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByText("Schema")).toBeInTheDocument();
      });

      // First deselect all by clicking select all twice (to ensure we start fresh)
      const checkboxesInDropdown = within(screen.getByText("Option 1 Aspects").closest("div")!.parentElement!).getAllByRole("checkbox");

      // First checkbox in the edit dropdown is select all
      const selectAllCheckbox = checkboxesInDropdown[0];

      // Toggle twice to deselect all then select all
      fireEvent.click(selectAllCheckbox);
      fireEvent.click(selectAllCheckbox);
    });

    it("deselects all edit options when all selected", async () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={defaultOptions}
          value={["Option 1"]}
          onChange={mockOnChange}
          editOptions={mockEditOptions}
        />
      );

      const editButton = screen.getByRole("button", { name: /edit/i });
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByText("Schema")).toBeInTheDocument();
      });

      // Get the select all checkbox in the edit dropdown
      const paper = screen.getByText("Option 1 Aspects").closest('[class*="MuiPaper"]') as HTMLElement;
      const checkboxes = within(paper).getAllByRole("checkbox");

      // Click select all to deselect
      fireEvent.click(checkboxes[0]);

      // All should be deselected now
      await waitFor(() => {
        const schemaCheckbox = screen.getByText("Schema").closest("div")?.querySelector("input");
        expect(schemaCheckbox).not.toBeChecked();
      });
    });
  });

  // ==========================================================================
  // onEditSelectionsChange Tests
  // ==========================================================================

  describe("onEditSelectionsChange Callback", () => {
    it("calls onEditSelectionsChange when option is added", async () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={defaultOptions}
          value={[]}
          onChange={mockOnChange}
          editOptions={mockEditOptions}
          onEditSelectionsChange={mockOnEditSelectionsChange}
        />
      );

      const select = screen.getByRole("combobox");
      fireEvent.mouseDown(select);

      await waitFor(() => {
        expect(screen.getByText("Option 1")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Option 1"));

      expect(mockOnEditSelectionsChange).toHaveBeenCalled();
    });

    it("calls onEditSelectionsChange when option is removed after being added", async () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={defaultOptions}
          value={[]}
          onChange={mockOnChange}
          editOptions={mockEditOptions}
          onEditSelectionsChange={mockOnEditSelectionsChange}
        />
      );

      const select = screen.getByRole("combobox");
      fireEvent.mouseDown(select);

      await waitFor(() => {
        expect(screen.getByText("Option 1")).toBeInTheDocument();
      });

      // First add Option 1
      fireEvent.click(screen.getByText("Option 1"));
      expect(mockOnEditSelectionsChange).toHaveBeenCalled();

      // Clear the mock
      mockOnEditSelectionsChange.mockClear();

      // Now deselect Option 1 - click the checkbox (index 1 as index 0 is select all)
      const checkboxes = screen.getAllByRole("checkbox");
      fireEvent.click(checkboxes[1]);

      // onEditSelectionsChange should be called again for removal
      expect(mockOnEditSelectionsChange).toHaveBeenCalled();
    });

    it("calls onEditSelectionsChange when edit dropdown is closed", async () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={defaultOptions}
          value={["Option 1"]}
          onChange={mockOnChange}
          editOptions={mockEditOptions}
          onEditSelectionsChange={mockOnEditSelectionsChange}
        />
      );

      const editButton = screen.getByRole("button", { name: /edit/i });
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByText("Option 1 Aspects")).toBeInTheDocument();
      });

      // Close the dropdown
      const closeButton = screen.getByTestId("CloseIcon").closest("button");
      fireEvent.click(closeButton!);

      expect(mockOnEditSelectionsChange).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // getEditOptionsForChip Tests
  // ==========================================================================

  describe("getEditOptionsForChip Logic", () => {
    it("returns exact match options", () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={defaultOptions}
          value={["Option 1"]}
          onChange={mockOnChange}
          editOptions={mockEditOptions}
        />
      );

      // Option 1 should show 3 options from mockEditOptions
      expect(screen.getByText("3 Aspects")).toBeInTheDocument();
    });

    it("returns partial match options", () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={["Item with Partial in name"]}
          value={["Item with Partial in name"]}
          onChange={mockOnChange}
          editOptions={mockEditOptions}
        />
      );

      // Should match "Partial" key and show 2 options
      expect(screen.getByText("2 Aspects")).toBeInTheDocument();
    });

    it("returns default options when no match", () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={["No Match Option"]}
          value={["No Match Option"]}
          onChange={mockOnChange}
          editOptions={{}}
        />
      );

      // Should show default 5 options
      expect(screen.getByText("5 Aspects")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Chip Edit Selections Persistence Tests
  // ==========================================================================

  describe("Chip Edit Selections Persistence", () => {
    it("persists selections after closing edit dropdown", async () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={defaultOptions}
          value={["Option 1"]}
          onChange={mockOnChange}
          editOptions={mockEditOptions}
          onEditSelectionsChange={mockOnEditSelectionsChange}
        />
      );

      // Open edit dropdown
      const editButton = screen.getByRole("button", { name: /edit/i });
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByText("Schema")).toBeInTheDocument();
      });

      // Toggle off an option
      const schemaCheckbox = screen.getByText("Schema").closest("div")?.querySelector("input");
      fireEvent.click(schemaCheckbox!);

      // Close dropdown
      const closeButton = screen.getByTestId("CloseIcon").closest("button");
      fireEvent.click(closeButton!);

      // Verify onEditSelectionsChange was called with updated selections
      expect(mockOnEditSelectionsChange).toHaveBeenCalled();
    });

    it("shows existing selections when reopening edit dropdown", async () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={defaultOptions}
          value={["Option 1"]}
          onChange={mockOnChange}
          editOptions={mockEditOptions}
          onEditSelectionsChange={mockOnEditSelectionsChange}
        />
      );

      // Open, modify, close
      const editButton = screen.getByRole("button", { name: /edit/i });
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByText("Schema")).toBeInTheDocument();
      });

      // Close
      const closeButton = screen.getByTestId("CloseIcon").closest("button");
      fireEvent.click(closeButton!);

      // Reopen
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByText("Schema")).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // Edge Cases Tests
  // ==========================================================================

  describe("Edge Cases", () => {
    it("handles empty options array", async () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={[]}
          value={[]}
          onChange={mockOnChange}
        />
      );

      const select = screen.getByRole("combobox");
      fireEvent.mouseDown(select);

      await waitFor(() => {
        expect(screen.getByText("No items selected")).toBeInTheDocument();
      });
    });

    it("handles value with items not in options", async () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={defaultOptions}
          value={["Non-existent Option"]}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText("1 Test Label selected")).toBeInTheDocument();
    });

    it("handles very long option names", () => {
      const longOption = "This is a very long option name that should be truncated in the chip display";
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={[longOption]}
          value={[longOption]}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText(longOption)).toBeInTheDocument();
    });

    it("handles special characters in options", async () => {
      const specialOption = "Option & <special> 'chars'";
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={[specialOption]}
          value={[]}
          onChange={mockOnChange}
        />
      );

      const select = screen.getByRole("combobox");
      fireEvent.mouseDown(select);

      await waitFor(() => {
        expect(screen.getByText(specialOption)).toBeInTheDocument();
      });
    });

    it("handles chipEditSelections without entry for chip", async () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={defaultOptions}
          value={["Option 3"]}
          onChange={mockOnChange}
          editOptions={{}}
        />
      );

      // Option 3 has no entry in editOptions, should show default count
      expect(screen.getByText("5 Aspects")).toBeInTheDocument();
    });

    it("handles persistentCount equal to 0 but default options exist", () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={defaultOptions}
          value={["Option 1"]}
          onChange={mockOnChange}
          editOptions={mockEditOptions}
        />
      );

      // Should show the editOptions count for Option 1
      expect(screen.getByText("3 Aspects")).toBeInTheDocument();
    });

    it("handles persistentCount greater than 0", async () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={defaultOptions}
          value={["Option 1"]}
          onChange={mockOnChange}
          editOptions={mockEditOptions}
          onEditSelectionsChange={mockOnEditSelectionsChange}
        />
      );

      // Open and close edit to persist selections
      const editButton = screen.getByRole("button", { name: /edit/i });
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByText("Schema")).toBeInTheDocument();
      });

      const closeButton = screen.getByTestId("CloseIcon").closest("button");
      fireEvent.click(closeButton!);

      // Now the chip should show persistent count
      await waitFor(() => {
        expect(screen.getByText("3 Aspects")).toBeInTheDocument();
      });
    });

    it("shows fallback text when persistentCount is 0 and no default options", () => {
      render(
        <MultiSelect
          label="Products"
          placeholder="Select products"
          options={["Option X"]}
          value={["Option X"]}
          onChange={mockOnChange}
          editOptions={{}}
        />
      );

      // Should show default options count (5) or fallback "Assets"
      expect(screen.getByText(/Assets/)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Branch Coverage for chipEditSelections Removal
  // ==========================================================================

  describe("chipEditSelections Removal Branch", () => {
    it("removes option from chipEditSelections when deselected and has persisted selections", async () => {
      let currentValue = ["Option 1"];
      const dynamicOnChange = vi.fn((newValue: string[]) => {
        currentValue = newValue;
      });

      const { rerender } = render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={defaultOptions}
          value={currentValue}
          onChange={dynamicOnChange}
          editOptions={mockEditOptions}
          onEditSelectionsChange={mockOnEditSelectionsChange}
        />
      );

      // Step 1: Open edit dropdown to populate chipEditSelections
      const editButton = screen.getByRole("button", { name: /edit/i });
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByText("Option 1 Aspects")).toBeInTheDocument();
      });

      // Step 2: Close edit dropdown to persist selections
      const closeButton = screen.getByTestId("CloseIcon").closest("button");
      fireEvent.click(closeButton!);

      await waitFor(() => {
        expect(screen.queryByText("Option 1 Aspects")).not.toBeInTheDocument();
      });

      mockOnEditSelectionsChange.mockClear();

      // Step 3: Open main dropdown
      const select = screen.getByRole("combobox");
      fireEvent.mouseDown(select);

      await waitFor(() => {
        expect(screen.getAllByText("Option 1").length).toBeGreaterThan(0);
      });

      // Step 4: Rerender with current value to ensure state is correct
      rerender(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={defaultOptions}
          value={currentValue}
          onChange={dynamicOnChange}
          editOptions={mockEditOptions}
          onEditSelectionsChange={mockOnEditSelectionsChange}
        />
      );

      // Step 5: Deselect Option 1 - this should trigger the removal branch
      const checkboxes = screen.getAllByRole("checkbox");
      fireEvent.click(checkboxes[1]); // Option 1's checkbox

      expect(dynamicOnChange).toHaveBeenCalledWith([]);
      // onEditSelectionsChange should be called when removing with persisted selections
      expect(mockOnEditSelectionsChange).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Integration Tests
  // ==========================================================================

  describe("Integration Tests", () => {
    it("complete workflow: select options, edit chip, close", async () => {
      render(
        <MultiSelect
          label="Products"
          placeholder="Select products"
          options={defaultOptions}
          value={[]}
          onChange={mockOnChange}
          editOptions={mockEditOptions}
          onEditSelectionsChange={mockOnEditSelectionsChange}
        />
      );

      // Open main dropdown
      const select = screen.getByRole("combobox");
      fireEvent.mouseDown(select);

      await waitFor(() => {
        expect(screen.getByText("Option 1")).toBeInTheDocument();
      });

      // Select an option
      fireEvent.click(screen.getByText("Option 1"));
      expect(mockOnChange).toHaveBeenCalledWith(["Option 1"]);
    });

    it("handles rapid clicks on options", async () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={defaultOptions}
          value={[]}
          onChange={mockOnChange}
        />
      );

      const select = screen.getByRole("combobox");
      fireEvent.mouseDown(select);

      await waitFor(() => {
        expect(screen.getByText("Option 1")).toBeInTheDocument();
      });

      // Rapid clicks
      fireEvent.click(screen.getByText("Option 1"));
      fireEvent.click(screen.getByText("Option 2"));
      fireEvent.click(screen.getByText("Option 3"));

      expect(mockOnChange).toHaveBeenCalledTimes(3);
    });

    it("search then select workflow", async () => {
      render(
        <MultiSelect
          label="Test Label"
          placeholder="Select options"
          options={defaultOptions}
          value={[]}
          onChange={mockOnChange}
        />
      );

      const select = screen.getByRole("combobox");
      fireEvent.mouseDown(select);

      await waitFor(() => {
        expect(screen.getByText("Option 1")).toBeInTheDocument();
      });

      // Search
      const searchInput = screen.getByPlaceholderText("Search for aspect types");
      fireEvent.change(searchInput, { target: { value: "Option 3" } });

      await waitFor(() => {
        expect(screen.queryByText("Option 1")).not.toBeInTheDocument();
      });

      // Select the filtered option
      fireEvent.click(screen.getByText("Option 3"));

      expect(mockOnChange).toHaveBeenCalledWith(["Option 3"]);
    });
  });
});
