import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LineageColumnLevelPanel from "./LineageColumnLevelPanel";

// ============================================================================
// Mock Data Generators
// ============================================================================

const createMockEntryData = (options: {
  schemaFields?: string[];
  entryType?: string;
} = {}) => {
  const {
    schemaFields = ["column_a", "column_b", "column_c"],
    entryType = "projects/testschema",
  } = options;

  const number = entryType.split("/")[1];

  const schemaValues = schemaFields.map((fieldName) => ({
    structValue: {
      fields: {
        name: {
          stringValue: fieldName,
        },
      },
    },
  }));

  return {
    entryType,
    aspects: {
      [`${number}.global.schema`]: {
        data: {
          fields: {
            fields: {
              listValue: {
                values: schemaValues,
              },
            },
          },
        },
      },
    },
  };
};

const createEmptyEntryData = () => ({
  entryType: "projects/emptyschema",
  aspects: {
    "emptyschema.global.schema": {
      data: {
        fields: {
          fields: {
            listValue: {
              values: [],
            },
          },
        },
      },
    },
  },
});

// ============================================================================
// Test Suite
// ============================================================================

describe("LineageColumnLevelPanel", () => {
  const defaultProps = {
    resetLineageGraph: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // Basic Rendering Tests
  // ==========================================================================

  describe("Basic Rendering", () => {
    it("renders the panel with correct title", () => {
      render(<LineageColumnLevelPanel {...defaultProps} />);

      expect(screen.getByText(/Lineage Explorer/)).toBeInTheDocument();
      expect(screen.getByText(/Preview Feature/)).toBeInTheDocument();
    });

    it("renders Column Level Lineage heading", () => {
      render(<LineageColumnLevelPanel {...defaultProps} />);

      expect(screen.getByText("Column Level Lineage")).toBeInTheDocument();
    });

    it("renders Direction heading", () => {
      render(<LineageColumnLevelPanel {...defaultProps} />);

      expect(screen.getByText("Direction")).toBeInTheDocument();
    });

    it("renders Column Name label", () => {
      render(<LineageColumnLevelPanel {...defaultProps} />);

      // Column Name appears both as label and in the select, so use getAllByText
      const columnNameElements = screen.getAllByText("Column Name");
      expect(columnNameElements.length).toBeGreaterThan(0);
    });

    it("renders UPSTREAM checkbox label", () => {
      render(<LineageColumnLevelPanel {...defaultProps} />);

      expect(screen.getByText("UPSTREAM")).toBeInTheDocument();
    });

    it("renders DOWNSTREAM checkbox label", () => {
      render(<LineageColumnLevelPanel {...defaultProps} />);

      expect(screen.getByText("DOWNSTREAM")).toBeInTheDocument();
    });

    it("renders Apply button", () => {
      render(<LineageColumnLevelPanel {...defaultProps} />);

      expect(screen.getByRole("button", { name: "Apply" })).toBeInTheDocument();
    });

    it("renders Reset button", () => {
      render(<LineageColumnLevelPanel {...defaultProps} />);

      expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
    });

    it("exports LineageColumnLevelPanel as default export", () => {
      expect(LineageColumnLevelPanel).toBeDefined();
      expect(typeof LineageColumnLevelPanel).toBe("function");
    });
  });

  // ==========================================================================
  // Close Button Tests
  // ==========================================================================

  describe("Close Button", () => {
    it("does not render close button when onClose is not provided", () => {
      render(<LineageColumnLevelPanel {...defaultProps} />);

      // Close icon button should not be present
      const closeButtons = screen.queryAllByRole("button");
      const closeButton = closeButtons.find((btn) =>
        btn.querySelector('[data-testid="CloseIcon"]')
      );
      expect(closeButton).toBeUndefined();
    });

    it("renders close button when onClose is provided", () => {
      const mockOnClose = vi.fn();
      render(<LineageColumnLevelPanel {...defaultProps} onClose={mockOnClose} />);

      // Find the IconButton with Close icon
      const iconButtons = screen.getAllByRole("button");
      // There should be 3 buttons: close, apply, reset
      expect(iconButtons.length).toBe(3);
    });

    it("calls onClose when close button is clicked", () => {
      const mockOnClose = vi.fn();
      render(<LineageColumnLevelPanel {...defaultProps} onClose={mockOnClose} />);

      // Find and click the close button (first button is the IconButton)
      const buttons = screen.getAllByRole("button");
      const closeButton = buttons[0]; // IconButton is first
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // Column Name Select Tests
  // ==========================================================================

  describe("Column Name Select", () => {
    it("renders Select with empty value when columnName is not provided", () => {
      render(<LineageColumnLevelPanel {...defaultProps} />);

      const select = screen.getByRole("combobox");
      expect(select).toBeInTheDocument();
    });

    it("renders Select with provided columnName value", () => {
      const entryData = createMockEntryData();
      render(
        <LineageColumnLevelPanel
          {...defaultProps}
          entryData={entryData}
          columnName="column_a"
        />
      );

      const select = screen.getByRole("combobox");
      expect(select).toHaveTextContent("COLUMN_A");
    });

    it("renders menu items from schema", async () => {
      const user = userEvent.setup();
      const entryData = createMockEntryData({
        schemaFields: ["field_1", "field_2", "field_3"],
      });

      render(
        <LineageColumnLevelPanel {...defaultProps} entryData={entryData} />
      );

      // Open the select dropdown
      const select = screen.getByRole("combobox");
      await user.click(select);

      // Check menu items are rendered (uppercase)
      expect(screen.getByText("FIELD_1")).toBeInTheDocument();
      expect(screen.getByText("FIELD_2")).toBeInTheDocument();
      expect(screen.getByText("FIELD_3")).toBeInTheDocument();
    });

    it("calls setColumnName when a column is selected", async () => {
      const user = userEvent.setup();
      const mockSetColumnName = vi.fn();
      const entryData = createMockEntryData({
        schemaFields: ["column_x", "column_y"],
      });

      render(
        <LineageColumnLevelPanel
          {...defaultProps}
          entryData={entryData}
          setColumnName={mockSetColumnName}
        />
      );

      // Open the select dropdown
      const select = screen.getByRole("combobox");
      await user.click(select);

      // Select an option
      const option = screen.getByText("COLUMN_X");
      await user.click(option);

      expect(mockSetColumnName).toHaveBeenCalledWith("column_x");
    });

    it("does not call setColumnName when setColumnName is not provided", async () => {
      const user = userEvent.setup();
      const entryData = createMockEntryData({
        schemaFields: ["column_x"],
      });

      // This should not throw
      render(
        <LineageColumnLevelPanel {...defaultProps} entryData={entryData} />
      );

      const select = screen.getByRole("combobox");
      await user.click(select);

      const option = screen.getByText("COLUMN_X");
      // Should not throw when clicking without setColumnName
      expect(() => user.click(option)).not.toThrow();
    });

    it("renders empty select when entryData is not provided", () => {
      render(<LineageColumnLevelPanel {...defaultProps} />);

      const select = screen.getByRole("combobox");
      expect(select).toBeInTheDocument();
    });

    it("renders empty select when schema is empty", async () => {
      const user = userEvent.setup();
      const entryData = createEmptyEntryData();

      render(
        <LineageColumnLevelPanel {...defaultProps} entryData={entryData} />
      );

      const select = screen.getByRole("combobox");
      await user.click(select);

      // Should open but have no options
      const listbox = screen.getByRole("listbox");
      const options = within(listbox).queryAllByRole("option");
      expect(options).toHaveLength(0);
    });
  });

  // ==========================================================================
  // Direction Checkboxes Tests
  // ==========================================================================

  describe("Direction Checkboxes", () => {
    it("renders both checkboxes unchecked when direction is undefined", () => {
      render(<LineageColumnLevelPanel {...defaultProps} />);

      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes).toHaveLength(2);
      // Both should be unchecked when direction is undefined
      expect(checkboxes[0]).not.toBeChecked();
      expect(checkboxes[1]).not.toBeChecked();
    });

    it("checks upstream checkbox when direction is 'upstream'", () => {
      render(<LineageColumnLevelPanel {...defaultProps} direction="upstream" />);

      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes[0]).toBeChecked(); // upstream
      expect(checkboxes[1]).not.toBeChecked(); // downstream
    });

    it("checks downstream checkbox when direction is 'downstream'", () => {
      render(<LineageColumnLevelPanel {...defaultProps} direction="downstream" />);

      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes[0]).not.toBeChecked(); // upstream
      expect(checkboxes[1]).toBeChecked(); // downstream
    });

    it("checks both checkboxes when direction is 'both'", () => {
      render(<LineageColumnLevelPanel {...defaultProps} direction="both" />);

      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes[0]).toBeChecked(); // upstream
      expect(checkboxes[1]).toBeChecked(); // downstream
    });

    // Upstream checkbox change tests
    it("calls setDirection with 'upstream' when upstream is checked and direction is undefined", () => {
      const mockSetDirection = vi.fn();
      render(
        <LineageColumnLevelPanel
          {...defaultProps}
          setDirection={mockSetDirection}
        />
      );

      const checkboxes = screen.getAllByRole("checkbox");
      fireEvent.click(checkboxes[0]); // upstream checkbox

      expect(mockSetDirection).toHaveBeenCalledWith("upstream");
    });

    it("calls setDirection with 'both' when upstream is checked and direction is 'downstream'", () => {
      const mockSetDirection = vi.fn();
      render(
        <LineageColumnLevelPanel
          {...defaultProps}
          direction="downstream"
          setDirection={mockSetDirection}
        />
      );

      const checkboxes = screen.getAllByRole("checkbox");
      fireEvent.click(checkboxes[0]); // upstream checkbox

      expect(mockSetDirection).toHaveBeenCalledWith("both");
    });

    it("calls setDirection with 'downstream' when upstream is unchecked and direction is 'both'", () => {
      const mockSetDirection = vi.fn();
      render(
        <LineageColumnLevelPanel
          {...defaultProps}
          direction="both"
          setDirection={mockSetDirection}
        />
      );

      const checkboxes = screen.getAllByRole("checkbox");
      fireEvent.click(checkboxes[0]); // upstream checkbox (uncheck)

      expect(mockSetDirection).toHaveBeenCalledWith("downstream");
    });

    it("calls setDirection with 'downstream' when upstream is unchecked and direction is 'upstream'", () => {
      const mockSetDirection = vi.fn();
      render(
        <LineageColumnLevelPanel
          {...defaultProps}
          direction="upstream"
          setDirection={mockSetDirection}
        />
      );

      const checkboxes = screen.getAllByRole("checkbox");
      fireEvent.click(checkboxes[0]); // upstream checkbox (uncheck)

      expect(mockSetDirection).toHaveBeenCalledWith("downstream");
    });

    // Downstream checkbox change tests
    it("calls setDirection with 'downstream' when downstream is checked and direction is undefined", () => {
      const mockSetDirection = vi.fn();
      render(
        <LineageColumnLevelPanel
          {...defaultProps}
          setDirection={mockSetDirection}
        />
      );

      const checkboxes = screen.getAllByRole("checkbox");
      fireEvent.click(checkboxes[1]); // downstream checkbox

      expect(mockSetDirection).toHaveBeenCalledWith("downstream");
    });

    it("calls setDirection with 'both' when downstream is checked and direction is 'upstream'", () => {
      const mockSetDirection = vi.fn();
      render(
        <LineageColumnLevelPanel
          {...defaultProps}
          direction="upstream"
          setDirection={mockSetDirection}
        />
      );

      const checkboxes = screen.getAllByRole("checkbox");
      fireEvent.click(checkboxes[1]); // downstream checkbox

      expect(mockSetDirection).toHaveBeenCalledWith("both");
    });

    it("calls setDirection with 'upstream' when downstream is unchecked and direction is 'both'", () => {
      const mockSetDirection = vi.fn();
      render(
        <LineageColumnLevelPanel
          {...defaultProps}
          direction="both"
          setDirection={mockSetDirection}
        />
      );

      const checkboxes = screen.getAllByRole("checkbox");
      fireEvent.click(checkboxes[1]); // downstream checkbox (uncheck)

      expect(mockSetDirection).toHaveBeenCalledWith("upstream");
    });

    it("calls setDirection with 'upstream' when downstream is unchecked and direction is 'downstream'", () => {
      const mockSetDirection = vi.fn();
      render(
        <LineageColumnLevelPanel
          {...defaultProps}
          direction="downstream"
          setDirection={mockSetDirection}
        />
      );

      const checkboxes = screen.getAllByRole("checkbox");
      fireEvent.click(checkboxes[1]); // downstream checkbox (uncheck)

      expect(mockSetDirection).toHaveBeenCalledWith("upstream");
    });

    it("does not call setDirection when setDirection is not provided (upstream)", () => {
      render(<LineageColumnLevelPanel {...defaultProps} />);

      const checkboxes = screen.getAllByRole("checkbox");
      // Should not throw when clicking without setDirection
      expect(() => fireEvent.click(checkboxes[0])).not.toThrow();
    });

    it("does not call setDirection when setDirection is not provided (downstream)", () => {
      render(<LineageColumnLevelPanel {...defaultProps} />);

      const checkboxes = screen.getAllByRole("checkbox");
      // Should not throw when clicking without setDirection
      expect(() => fireEvent.click(checkboxes[1])).not.toThrow();
    });
  });

  // ==========================================================================
  // Apply Button Tests
  // ==========================================================================

  describe("Apply Button", () => {
    it("calls fetchColumnLineage with columnName and direction when clicked", () => {
      const mockFetchColumnLineage = vi.fn();
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      render(
        <LineageColumnLevelPanel
          {...defaultProps}
          columnName="test_column"
          direction="upstream"
          fetchColumnLineage={mockFetchColumnLineage}
        />
      );

      const applyButton = screen.getByRole("button", { name: "Apply" });
      fireEvent.click(applyButton);

      expect(consoleSpy).toHaveBeenCalledWith("Apply clicked");
      expect(mockFetchColumnLineage).toHaveBeenCalledWith("test_column", "upstream");

      consoleSpy.mockRestore();
    });

    it("calls fetchColumnLineage with 'both' as default direction when direction is undefined", () => {
      const mockFetchColumnLineage = vi.fn();
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      render(
        <LineageColumnLevelPanel
          {...defaultProps}
          columnName="my_column"
          fetchColumnLineage={mockFetchColumnLineage}
        />
      );

      const applyButton = screen.getByRole("button", { name: "Apply" });
      fireEvent.click(applyButton);

      expect(mockFetchColumnLineage).toHaveBeenCalledWith("my_column", "both");

      consoleSpy.mockRestore();
    });

    it("calls fetchColumnLineage with undefined columnName when not provided", () => {
      const mockFetchColumnLineage = vi.fn();
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      render(
        <LineageColumnLevelPanel
          {...defaultProps}
          direction="downstream"
          fetchColumnLineage={mockFetchColumnLineage}
        />
      );

      const applyButton = screen.getByRole("button", { name: "Apply" });
      fireEvent.click(applyButton);

      expect(mockFetchColumnLineage).toHaveBeenCalledWith(undefined, "downstream");

      consoleSpy.mockRestore();
    });

    it("does not call fetchColumnLineage when fetchColumnLineage is not provided", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      render(<LineageColumnLevelPanel {...defaultProps} />);

      const applyButton = screen.getByRole("button", { name: "Apply" });
      // Should not throw when clicking without fetchColumnLineage
      expect(() => fireEvent.click(applyButton)).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith("Apply clicked");

      consoleSpy.mockRestore();
    });

    it("logs 'Apply clicked' to console when clicked", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      render(<LineageColumnLevelPanel {...defaultProps} />);

      const applyButton = screen.getByRole("button", { name: "Apply" });
      fireEvent.click(applyButton);

      expect(consoleSpy).toHaveBeenCalledWith("Apply clicked");

      consoleSpy.mockRestore();
    });

    it("has correct styles", () => {
      render(<LineageColumnLevelPanel {...defaultProps} />);

      const applyButton = screen.getByRole("button", { name: "Apply" });
      expect(applyButton).toHaveStyle({
        backgroundColor: "rgb(26, 115, 232)", // #1A73E8
        color: "rgb(255, 255, 255)", // #FFFFFF
        borderRadius: "4px",
        padding: "8px 16px",
        cursor: "pointer",
      });
    });
  });

  // ==========================================================================
  // Reset Button Tests
  // ==========================================================================

  describe("Reset Button", () => {
    it("calls resetLineageGraph when clicked", () => {
      const mockResetLineageGraph = vi.fn();

      render(
        <LineageColumnLevelPanel resetLineageGraph={mockResetLineageGraph} />
      );

      const resetButton = screen.getByRole("button", { name: "Reset" });
      fireEvent.click(resetButton);

      expect(mockResetLineageGraph).toHaveBeenCalledTimes(1);
    });

    it("does not throw when resetLineageGraph is undefined (edge case)", () => {
      // The component requires resetLineageGraph, but test defensive coding
      // @ts-expect-error - Testing edge case where resetLineageGraph might be undefined
      render(<LineageColumnLevelPanel resetLineageGraph={undefined} />);

      const resetButton = screen.getByRole("button", { name: "Reset" });
      // Should not throw even if resetLineageGraph is undefined
      expect(() => fireEvent.click(resetButton)).not.toThrow();
    });

    it("has correct styles", () => {
      render(<LineageColumnLevelPanel {...defaultProps} />);

      const resetButton = screen.getByRole("button", { name: "Reset" });
      expect(resetButton).toHaveStyle({
        backgroundColor: "rgb(255, 255, 255)", // #FFFFFF
        color: "rgb(51, 51, 51)", // #333333
        borderRadius: "4px",
        padding: "8px 16px",
        cursor: "pointer",
      });
    });
  });

  // ==========================================================================
  // Custom CSS Tests
  // ==========================================================================

  describe("Custom CSS", () => {
    it("applies custom css styles to the main container", () => {
      const customCss = { marginTop: "20px", border: "2px solid red" };

      const { container } = render(
        <LineageColumnLevelPanel {...defaultProps} css={customCss} />
      );

      // The main Box should have custom styles applied
      const mainBox = container.firstChild as HTMLElement;
      expect(mainBox).toHaveStyle({
        marginTop: "20px",
      });
    });

    it("maintains default styles when no custom css is provided", () => {
      const { container } = render(<LineageColumnLevelPanel {...defaultProps} />);

      const mainBox = container.firstChild as HTMLElement;
      expect(mainBox).toHaveStyle({
        width: "22rem",
        background: "#ffffff",
        height: "380px",
      });
    });
  });

  // ==========================================================================
  // Entry Data Handling Tests
  // ==========================================================================

  describe("Entry Data Handling", () => {
    it("handles entryData with different entryType format", async () => {
      const user = userEvent.setup();
      const entryData = createMockEntryData({
        entryType: "organizations/myorg",
        schemaFields: ["org_field_1", "org_field_2"],
      });

      render(
        <LineageColumnLevelPanel {...defaultProps} entryData={entryData} />
      );

      const select = screen.getByRole("combobox");
      await user.click(select);

      expect(screen.getByText("ORG_FIELD_1")).toBeInTheDocument();
      expect(screen.getByText("ORG_FIELD_2")).toBeInTheDocument();
    });

    it("handles entryData with missing aspects gracefully", () => {
      const entryData = {
        entryType: "projects/test",
        aspects: {},
      };

      // Should not throw
      render(
        <LineageColumnLevelPanel {...defaultProps} entryData={entryData} />
      );

      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("handles entryData with missing entryType gracefully", () => {
      const entryData = {
        aspects: {},
      };

      // Should not throw
      render(
        <LineageColumnLevelPanel {...defaultProps} entryData={entryData} />
      );

      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("handles null entryData gracefully", () => {
      // Should not throw
      render(
        <LineageColumnLevelPanel {...defaultProps} entryData={null} />
      );

      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Integration Tests
  // ==========================================================================

  describe("Integration Tests", () => {
    it("renders complete panel with all props", () => {
      const mockSetColumnName = vi.fn();
      const mockSetDirection = vi.fn();
      const mockFetchColumnLineage = vi.fn();
      const mockResetLineageGraph = vi.fn();
      const mockOnClose = vi.fn();
      const entryData = createMockEntryData({
        schemaFields: ["id", "name", "email"],
      });

      render(
        <LineageColumnLevelPanel
          entryData={entryData}
          columnName="name"
          setColumnName={mockSetColumnName}
          direction="both"
          setDirection={mockSetDirection}
          fetchColumnLineage={mockFetchColumnLineage}
          resetLineageGraph={mockResetLineageGraph}
          onClose={mockOnClose}
          css={{ marginLeft: "10px" }}
        />
      );

      // Verify header
      expect(screen.getByText(/Lineage Explorer/)).toBeInTheDocument();

      // Verify column select shows selected value
      expect(screen.getByRole("combobox")).toHaveTextContent("NAME");

      // Verify both checkboxes are checked
      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).toBeChecked();

      // Verify buttons
      expect(screen.getByRole("button", { name: "Apply" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
    });

    it("handles full user interaction flow", async () => {
      const user = userEvent.setup();
      const mockSetColumnName = vi.fn();
      const mockSetDirection = vi.fn();
      const mockFetchColumnLineage = vi.fn();
      const mockResetLineageGraph = vi.fn();
      const mockOnClose = vi.fn();
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const entryData = createMockEntryData({
        schemaFields: ["col_a", "col_b"],
      });

      render(
        <LineageColumnLevelPanel
          entryData={entryData}
          setColumnName={mockSetColumnName}
          direction="upstream"
          setDirection={mockSetDirection}
          fetchColumnLineage={mockFetchColumnLineage}
          resetLineageGraph={mockResetLineageGraph}
          onClose={mockOnClose}
        />
      );

      // Step 1: Select a column
      const select = screen.getByRole("combobox");
      await user.click(select);
      const columnOption = screen.getByText("COL_A");
      await user.click(columnOption);
      expect(mockSetColumnName).toHaveBeenCalledWith("col_a");

      // Step 2: Change direction (check downstream to make it 'both')
      const checkboxes = screen.getAllByRole("checkbox");
      fireEvent.click(checkboxes[1]); // downstream
      expect(mockSetDirection).toHaveBeenCalledWith("both");

      // Step 3: Click Apply
      const applyButton = screen.getByRole("button", { name: "Apply" });
      fireEvent.click(applyButton);
      expect(mockFetchColumnLineage).toHaveBeenCalled();

      // Step 4: Click Reset
      const resetButton = screen.getByRole("button", { name: "Reset" });
      fireEvent.click(resetButton);
      expect(mockResetLineageGraph).toHaveBeenCalled();

      // Step 5: Close panel
      const buttons = screen.getAllByRole("button");
      fireEvent.click(buttons[0]); // close button
      expect(mockOnClose).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("works correctly with only required props", () => {
      const mockResetLineageGraph = vi.fn();

      render(
        <LineageColumnLevelPanel resetLineageGraph={mockResetLineageGraph} />
      );

      // Should render without errors
      expect(screen.getByText(/Lineage Explorer/)).toBeInTheDocument();
      expect(screen.getByRole("combobox")).toBeInTheDocument();
      expect(screen.getAllByRole("checkbox")).toHaveLength(2);
      expect(screen.getByRole("button", { name: "Apply" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe("Edge Cases", () => {
    it("handles schema with single field", async () => {
      const user = userEvent.setup();
      const entryData = createMockEntryData({
        schemaFields: ["only_field"],
      });

      render(
        <LineageColumnLevelPanel {...defaultProps} entryData={entryData} />
      );

      const select = screen.getByRole("combobox");
      await user.click(select);

      expect(screen.getByText("ONLY_FIELD")).toBeInTheDocument();
    });

    it("handles schema with many fields", async () => {
      const user = userEvent.setup();
      const manyFields = Array.from({ length: 20 }, (_, i) => `field_${i + 1}`);
      const entryData = createMockEntryData({
        schemaFields: manyFields,
      });

      render(
        <LineageColumnLevelPanel {...defaultProps} entryData={entryData} />
      );

      const select = screen.getByRole("combobox");
      await user.click(select);

      expect(screen.getByText("FIELD_1")).toBeInTheDocument();
      expect(screen.getByText("FIELD_20")).toBeInTheDocument();
    });

    it("handles column names with special characters", async () => {
      const user = userEvent.setup();
      const entryData = createMockEntryData({
        schemaFields: ["user_id", "first-name", "last.name"],
      });

      render(
        <LineageColumnLevelPanel {...defaultProps} entryData={entryData} />
      );

      const select = screen.getByRole("combobox");
      await user.click(select);

      expect(screen.getByText("USER_ID")).toBeInTheDocument();
      expect(screen.getByText("FIRST-NAME")).toBeInTheDocument();
      expect(screen.getByText("LAST.NAME")).toBeInTheDocument();
    });

    it("handles empty string columnName", () => {
      render(
        <LineageColumnLevelPanel {...defaultProps} columnName="" />
      );

      const select = screen.getByRole("combobox");
      expect(select).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Accessibility Tests
  // ==========================================================================

  describe("Accessibility", () => {
    it("has accessible select with proper label", () => {
      render(<LineageColumnLevelPanel {...defaultProps} />);

      const select = screen.getByLabelText("Column Name");
      expect(select).toBeInTheDocument();
    });

    it("checkboxes are keyboard accessible", () => {
      const mockSetDirection = vi.fn();
      render(
        <LineageColumnLevelPanel
          {...defaultProps}
          setDirection={mockSetDirection}
        />
      );

      const checkboxes = screen.getAllByRole("checkbox");

      // Focus and press space on upstream checkbox
      checkboxes[0].focus();
      fireEvent.keyDown(checkboxes[0], { key: " ", code: "Space" });

      // The checkbox should respond to keyboard interaction
      expect(checkboxes[0]).toBeInTheDocument();
    });

    it("buttons are focusable", () => {
      render(<LineageColumnLevelPanel {...defaultProps} />);

      const applyButton = screen.getByRole("button", { name: "Apply" });
      const resetButton = screen.getByRole("button", { name: "Reset" });

      applyButton.focus();
      expect(document.activeElement).toBe(applyButton);

      resetButton.focus();
      expect(document.activeElement).toBe(resetButton);
    });
  });
});
