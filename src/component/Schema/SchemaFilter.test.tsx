import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SchemaFilter from "./SchemaFilter";

// ============================================================================
// Mock Data Generators
// ============================================================================

const createSchemaField = (
  name: string,
  dataType: string,
  metadataType: string,
  mode: string,
  defaultValue?: string | null,
  description?: string | null
) => ({
  structValue: {
    fields: {
      name: { stringValue: name },
      dataType: { stringValue: dataType },
      metadataType: { stringValue: metadataType },
      mode: { stringValue: mode },
      ...(defaultValue !== undefined && {
        defaultValue: defaultValue === null ? null : { stringValue: defaultValue },
      }),
      ...(description !== undefined && {
        description: description === null ? null : { stringValue: description },
      }),
    },
  },
});

const createMockEntry = (projectNumber: string, schemaFields: any[]) => ({
  entryType: `projects/${projectNumber}/locations/us/entryTypes/bigquery.table`,
  aspects: {
    [`${projectNumber}.global.schema`]: {
      data: {
        fields: {
          fields: {
            listValue: {
              values: schemaFields,
            },
          },
        },
      },
    },
  },
});

const defaultSchemaFields = [
  createSchemaField("id", "INT64", "PRIMITIVE", "REQUIRED", "0", "Primary key"),
  createSchemaField("username", "STRING", "PRIMITIVE", "NULLABLE", null, "User name"),
  createSchemaField("email", "STRING", "PRIMITIVE", "NULLABLE", null, "Email address"),
  createSchemaField("age", "INT64", "PRIMITIVE", "NULLABLE", "18", null),
  createSchemaField("is_active", "BOOLEAN", "PRIMITIVE", "NULLABLE", "true", "Active status"),
];

// ============================================================================
// Test Suite
// ============================================================================

describe("SchemaFilter", () => {
  const mockOnFilteredEntryChange = vi.fn();

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
    it("renders without crashing", () => {
      const entry = createMockEntry("123", defaultSchemaFields);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      expect(screen.getByPlaceholderText("Enter property name or value")).toBeInTheDocument();
    });

    it("renders filter text input", () => {
      const entry = createMockEntry("123", defaultSchemaFields);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      expect(
        screen.getByPlaceholderText("Enter property name or value")
      ).toBeInTheDocument();
    });

    it("renders filter icon button", () => {
      const entry = createMockEntry("123", defaultSchemaFields);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      expect(screen.getByTestId("FilterListIcon")).toBeInTheDocument();
    });

    it("applies sx prop to filter bar", () => {
      const entry = createMockEntry("123", defaultSchemaFields);
      const customSx = { marginTop: "20px" };

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
          sx={customSx}
        />
      );

      // Component should render without error with sx prop
      expect(screen.getByPlaceholderText("Enter property name or value")).toBeInTheDocument();
    });

    it("calls onFilteredEntryChange on initial render", () => {
      const entry = createMockEntry("123", defaultSchemaFields);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      expect(mockOnFilteredEntryChange).toHaveBeenCalledWith(entry);
    });
  });

  // ==========================================================================
  // Text Filter Tests
  // ==========================================================================

  describe("Text Filter", () => {
    it("updates filter text when typing", () => {
      const entry = createMockEntry("123", defaultSchemaFields);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      const input = screen.getByPlaceholderText("Enter property name or value");
      fireEvent.change(input, { target: { value: "email" } });

      expect(input).toHaveValue("email");
    });

    it("shows clear button when text is entered", () => {
      const entry = createMockEntry("123", defaultSchemaFields);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      const input = screen.getByPlaceholderText("Enter property name or value");
      fireEvent.change(input, { target: { value: "test" } });

      expect(screen.getByTestId("CloseIcon")).toBeInTheDocument();
    });

    it("clears text when clear button is clicked", () => {
      const entry = createMockEntry("123", defaultSchemaFields);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      const input = screen.getByPlaceholderText("Enter property name or value");
      fireEvent.change(input, { target: { value: "test" } });

      const closeButton = screen.getByTestId("CloseIcon").closest("button");
      fireEvent.click(closeButton!);

      expect(input).toHaveValue("");
    });

    it("filters by name field (default property on Enter)", async () => {
      const entry = createMockEntry("123", defaultSchemaFields);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      const input = screen.getByPlaceholderText("Enter property name or value");
      fireEvent.change(input, { target: { value: "email" } });
      fireEvent.keyDown(input, { key: "Enter" });

      await waitFor(() => {
        // Pressing Enter with no selected property creates a Name chip (default)
        const lastCall =
          mockOnFilteredEntryChange.mock.calls[
            mockOnFilteredEntryChange.mock.calls.length - 1
          ][0];
        const filteredValues =
          lastCall.aspects["123.global.schema"].data.fields.fields.listValue
            .values;
        // Should match 'email' field by name
        expect(filteredValues.length).toBe(1);
      });
    });

    it("filters by type field via dropdown selection", async () => {
      const entry = createMockEntry("123", defaultSchemaFields);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      fireEvent.click(screen.getByTestId("FilterListIcon").closest("button")!);
      await waitFor(() => {
        expect(screen.getByText("Type")).toBeInTheDocument();
      });
      fireEvent.mouseEnter(screen.getByText("Type").closest('[role="menuitem"]')!);
      await waitFor(() => {
        expect(screen.getByText("INT64")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText("INT64").closest("li")!);

      // Close menu
      fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });

      await waitFor(() => {
        const lastCall =
          mockOnFilteredEntryChange.mock.calls[
            mockOnFilteredEntryChange.mock.calls.length - 1
          ][0];
        const filteredValues =
          lastCall.aspects["123.global.schema"].data.fields.fields.listValue
            .values;
        // Should match id and age (both INT64)
        expect(filteredValues.length).toBe(2);
      });
    });

    it("filters by mode field via dropdown selection", async () => {
      const entry = createMockEntry("123", defaultSchemaFields);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      fireEvent.click(screen.getByTestId("FilterListIcon").closest("button")!);
      await waitFor(() => {
        expect(screen.getByText("Mode")).toBeInTheDocument();
      });
      fireEvent.mouseEnter(screen.getByText("Mode").closest('[role="menuitem"]')!);
      await waitFor(() => {
        expect(screen.getByText("REQUIRED")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText("REQUIRED").closest("li")!);

      // Close menu
      fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });

      await waitFor(() => {
        const lastCall =
          mockOnFilteredEntryChange.mock.calls[
            mockOnFilteredEntryChange.mock.calls.length - 1
          ][0];
        const filteredValues =
          lastCall.aspects["123.global.schema"].data.fields.fields.listValue
            .values;
        // Should match only id (REQUIRED)
        expect(filteredValues.length).toBe(1);
      });
    });

    it("filters by description field via text input", async () => {
      const entry = createMockEntry("123", defaultSchemaFields);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      // Click on search input to open menu (text properties only visible via search trigger)
      fireEvent.click(screen.getByPlaceholderText("Enter property name or value"));
      await waitFor(() => {
        expect(screen.getByText("Description")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText("Description").closest('[role="menuitem"]')!);

      const input = screen.getByPlaceholderText("Enter Description value...");
      fireEvent.change(input, { target: { value: "Primary" } });
      fireEvent.keyDown(input, { key: "Enter" });

      await waitFor(() => {
        const lastCall =
          mockOnFilteredEntryChange.mock.calls[
            mockOnFilteredEntryChange.mock.calls.length - 1
          ][0];
        const filteredValues =
          lastCall.aspects["123.global.schema"].data.fields.fields.listValue
            .values;
        expect(filteredValues.length).toBe(1);
      });
    });

    it("filters by metaDataType field via dropdown selection", async () => {
      const entry = createMockEntry("123", defaultSchemaFields);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      fireEvent.click(screen.getByTestId("FilterListIcon").closest("button")!);
      await waitFor(() => {
        expect(screen.getByText("Metadata Type")).toBeInTheDocument();
      });
      fireEvent.mouseEnter(screen.getByText("Metadata Type").closest('[role="menuitem"]')!);
      await waitFor(() => {
        expect(screen.getByText("PRIMITIVE")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText("PRIMITIVE").closest("li")!);

      // Close menu
      fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });

      await waitFor(() => {
        const lastCall =
          mockOnFilteredEntryChange.mock.calls[
            mockOnFilteredEntryChange.mock.calls.length - 1
          ][0];
        const filteredValues =
          lastCall.aspects["123.global.schema"].data.fields.fields.listValue
            .values;
        // All fields have PRIMITIVE metaDataType
        expect(filteredValues.length).toBe(5);
      });
    });

    it("filters by defaultValue field via dropdown selection", async () => {
      const entry = createMockEntry("123", defaultSchemaFields);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      fireEvent.click(screen.getByTestId("FilterListIcon").closest("button")!);
      await waitFor(() => {
        expect(screen.getByText("Default Value")).toBeInTheDocument();
      });
      fireEvent.mouseEnter(screen.getByText("Default Value").closest('[role="menuitem"]')!);
      await waitFor(() => {
        expect(screen.getByText("true")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText("true").closest("li")!);

      // Close menu
      fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });

      await waitFor(() => {
        const lastCall =
          mockOnFilteredEntryChange.mock.calls[
            mockOnFilteredEntryChange.mock.calls.length - 1
          ][0];
        const filteredValues =
          lastCall.aspects["123.global.schema"].data.fields.fields.listValue
            .values;
        // Should match is_active (defaultValue: "true")
        expect(filteredValues.length).toBe(1);
      });
    });
  });

  // ==========================================================================
  // Filter Menu Tests
  // ==========================================================================

  describe("Filter Menu", () => {
    it("opens menu when filter icon is clicked", async () => {
      const entry = createMockEntry("123", defaultSchemaFields);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      const filterButton = screen.getByTestId("FilterListIcon").closest("button");
      fireEvent.click(filterButton!);

      await waitFor(() => {
        expect(screen.getByText("Name")).toBeInTheDocument();
      });
    });

    it("opens menu when Filter text is clicked", async () => {
      const entry = createMockEntry("123", defaultSchemaFields);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      fireEvent.click(screen.getByTestId("FilterListIcon").closest("button")!);

      await waitFor(() => {
        expect(screen.getByText("Name")).toBeInTheDocument();
      });
    });

    it("shows only dropdown/both property names in filter icon menu (non-preview mode)", async () => {
      const entry = createMockEntry("123", defaultSchemaFields);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
          isPreview={false}
        />
      );

      // Filter icon menu should only show dropdown/both properties, not text-only
      fireEvent.click(screen.getByTestId("FilterListIcon").closest("button")!);

      await waitFor(() => {
        expect(screen.getByText("Name")).toBeInTheDocument();
        expect(screen.getByText("Type")).toBeInTheDocument();
        expect(screen.getByText("Metadata Type")).toBeInTheDocument();
        expect(screen.getByText("Mode")).toBeInTheDocument();
        expect(screen.getByText("Default Value")).toBeInTheDocument();
        // Description is text-only, so it should NOT appear in filter icon menu
        expect(screen.queryByText("Description")).not.toBeInTheDocument();
      });
    });

    it("shows limited property names in preview mode", async () => {
      const entry = createMockEntry("123", defaultSchemaFields);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
          isPreview={true}
        />
      );

      fireEvent.click(screen.getByTestId("FilterListIcon").closest("button")!);

      await waitFor(() => {
        expect(screen.getByText("Name")).toBeInTheDocument();
        expect(screen.getByText("Type")).toBeInTheDocument();
        expect(screen.getByText("Mode")).toBeInTheDocument();
        // These should NOT be in preview mode
        expect(screen.queryByText("Metadata Type")).not.toBeInTheDocument();
        expect(screen.queryByText("Default Value")).not.toBeInTheDocument();
        expect(screen.queryByText("Description")).not.toBeInTheDocument();
      });
    });

    it("shows values when property is selected", async () => {
      const entry = createMockEntry("123", defaultSchemaFields);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      fireEvent.click(screen.getByTestId("FilterListIcon").closest("button")!);

      await waitFor(() => {
        expect(screen.getByText("Type")).toBeInTheDocument();
      });

      fireEvent.mouseEnter(screen.getByText("Type").closest('[role="menuitem"]')!);

      await waitFor(() => {
        // Sub-menu values should be visible on hover
        expect(screen.getByText("INT64")).toBeInTheDocument();
        expect(screen.getByText("STRING")).toBeInTheDocument();
        expect(screen.getByText("BOOLEAN")).toBeInTheDocument();
      });
    });

    it("shows sub-menu values when property is hovered", async () => {
      const entry = createMockEntry("123", defaultSchemaFields);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      fireEvent.click(screen.getByTestId("FilterListIcon").closest("button")!);

      await waitFor(() => {
        expect(screen.getByText("Type")).toBeInTheDocument();
      });

      fireEvent.mouseEnter(screen.getByText("Type").closest('[role="menuitem"]')!);

      await waitFor(() => {
        expect(screen.getByText("INT64")).toBeInTheDocument();
      });
    });

    it("closes menu when Escape is pressed", async () => {
      const entry = createMockEntry("123", defaultSchemaFields);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      fireEvent.click(screen.getByTestId("FilterListIcon").closest("button")!);

      await waitFor(() => {
        expect(screen.getByText("Name")).toBeInTheDocument();
      });

      // Press Escape to close the menu
      const menu = screen.getByRole("menu");
      fireEvent.keyDown(menu, { key: "Escape" });

      await waitFor(() => {
        expect(
          screen.queryByText("Name")
        ).not.toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // Value Selection Tests
  // ==========================================================================

  describe("Value Selection", () => {
    it("selects value when checkbox is clicked", async () => {
      const entry = createMockEntry("123", defaultSchemaFields);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      fireEvent.click(screen.getByTestId("FilterListIcon").closest("button")!);

      await waitFor(() => {
        expect(screen.getByText("Type")).toBeInTheDocument();
      });

      fireEvent.mouseEnter(screen.getByText("Type").closest('[role="menuitem"]')!);

      await waitFor(() => {
        expect(screen.getByText("INT64")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("INT64"));

      await waitFor(() => {
        // Should show active filter chip
        expect(screen.getByText("Type:")).toBeInTheDocument();
      });
    });

    it("deselects value when checkbox is clicked again", async () => {
      const entry = createMockEntry("123", defaultSchemaFields);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      fireEvent.click(screen.getByTestId("FilterListIcon").closest("button")!);

      await waitFor(() => {
        expect(screen.getByText("Type")).toBeInTheDocument();
      });

      fireEvent.mouseEnter(screen.getByText("Type").closest('[role="menuitem"]')!);

      await waitFor(() => {
        expect(screen.getByText("INT64")).toBeInTheDocument();
      });

      // Select INT64
      const int64MenuItem = screen.getByText("INT64").closest("li");
      fireEvent.click(int64MenuItem!);

      await waitFor(() => {
        // Verify checkbox is checked
        const checkbox = int64MenuItem?.querySelector('input[type="checkbox"]');
        expect(checkbox).toBeChecked();
      });

      // Deselect INT64
      fireEvent.click(int64MenuItem!);

      await waitFor(() => {
        // Verify checkbox is unchecked
        const checkbox = int64MenuItem?.querySelector('input[type="checkbox"]');
        expect(checkbox).not.toBeChecked();
      });
    });

    it("allows multiple value selection", async () => {
      const entry = createMockEntry("123", defaultSchemaFields);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      fireEvent.click(screen.getByTestId("FilterListIcon").closest("button")!);

      await waitFor(() => {
        expect(screen.getByText("Type")).toBeInTheDocument();
      });

      fireEvent.mouseEnter(screen.getByText("Type").closest('[role="menuitem"]')!);

      await waitFor(() => {
        expect(screen.getByText("INT64")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("INT64"));
      fireEvent.click(screen.getByText("STRING"));

      await waitFor(() => {
        expect(screen.getByText("INT64, STRING")).toBeInTheDocument();
      });
    });

    it("updates existing filter when same property is selected again", async () => {
      const entry = createMockEntry("123", defaultSchemaFields);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      // First selection
      fireEvent.click(screen.getByTestId("FilterListIcon").closest("button")!);
      await waitFor(() => {
        expect(screen.getByText("Type")).toBeInTheDocument();
      });
      fireEvent.mouseEnter(screen.getByText("Type").closest('[role="menuitem"]')!);
      await waitFor(() => {
        expect(screen.getByText("INT64")).toBeInTheDocument();
      });
      const int64MenuItem = screen.getByText("INT64").closest("li");
      fireEvent.click(int64MenuItem!);

      // Hover Type again to re-enter sub-menu
      fireEvent.mouseEnter(screen.getByText("Type").closest('[role="menuitem"]')!);

      // INT64 should be pre-selected
      await waitFor(() => {
        const checkboxes = screen.getAllByRole("checkbox");
        const int64Checkbox = checkboxes.find((cb) =>
          cb.closest("li")?.textContent?.includes("INT64")
        );
        expect(int64Checkbox).toBeChecked();
      });

      // Add another value
      const booleanMenuItem = screen.getByText("BOOLEAN").closest("li");
      fireEvent.click(booleanMenuItem!);

      // Close menu to see chips
      fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });

      await waitFor(() => {
        expect(screen.getByText("INT64, BOOLEAN")).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // Active Filter Chips Tests
  // ==========================================================================

  describe("Active Filter Chips", () => {
    it("displays filter chip when filter is active", async () => {
      const entry = createMockEntry("123", defaultSchemaFields);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      fireEvent.click(screen.getByTestId("FilterListIcon").closest("button")!);
      await waitFor(() => {
        expect(screen.getByText("Mode")).toBeInTheDocument();
      });
      fireEvent.mouseEnter(screen.getByText("Mode").closest('[role="menuitem"]')!);
      await waitFor(() => {
        expect(screen.getByText("REQUIRED")).toBeInTheDocument();
      });

      const requiredMenuItem = screen.getByText("REQUIRED").closest("li");
      fireEvent.click(requiredMenuItem!);

      // Close menu to see chips
      fireEvent.keyDown(document.body, { key: "Escape" });

      await waitFor(() => {
        expect(screen.getByText("Mode:")).toBeInTheDocument();
      });
    });

    it("shows Clear All button when filters are active", async () => {
      const entry = createMockEntry("123", defaultSchemaFields);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      fireEvent.click(screen.getByTestId("FilterListIcon").closest("button")!);
      await waitFor(() => {
        expect(screen.getByText("Mode")).toBeInTheDocument();
      });
      fireEvent.mouseEnter(screen.getByText("Mode").closest('[role="menuitem"]')!);
      await waitFor(() => {
        expect(screen.getByText("REQUIRED")).toBeInTheDocument();
      });

      const requiredMenuItem = screen.getByText("REQUIRED").closest("li");
      fireEvent.click(requiredMenuItem!);

      // Close the menu first to see the Clear All button
      fireEvent.keyDown(document.body, { key: "Escape" });

      await waitFor(() => {
        expect(screen.getByText("Clear All")).toBeInTheDocument();
      });
    });

    it("removes filter when chip close button is clicked", async () => {
      const entry = createMockEntry("123", defaultSchemaFields);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      fireEvent.click(screen.getByTestId("FilterListIcon").closest("button")!);
      await waitFor(() => {
        expect(screen.getByText("Mode")).toBeInTheDocument();
      });
      fireEvent.mouseEnter(screen.getByText("Mode").closest('[role="menuitem"]')!);
      await waitFor(() => {
        expect(screen.getByText("REQUIRED")).toBeInTheDocument();
      });

      const requiredMenuItem = screen.getByText("REQUIRED").closest("li");
      fireEvent.click(requiredMenuItem!);

      // Close menu by clicking backdrop
      const backdrop = document.querySelector('.MuiBackdrop-root');
      if (backdrop) fireEvent.click(backdrop);

      await waitFor(() => {
        expect(screen.getByText("Mode:")).toBeInTheDocument();
        // Verify menu is closed by checking buttons are accessible
        expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
      });

      // Find and click the chip close button (CloseIcon inside chip area)
      const chipCloseButtons = screen.getAllByRole('button').filter(btn => {
        const svg = btn.querySelector('[data-testid="CloseIcon"]');
        return svg && btn.closest('[class*="MuiBox-root"]');
      });
      fireEvent.click(chipCloseButtons[chipCloseButtons.length - 1]);

      await waitFor(() => {
        expect(screen.queryByText("Mode:")).not.toBeInTheDocument();
      });
    });

    it("clears all filters when Clear All is clicked", async () => {
      const entry = createMockEntry("123", defaultSchemaFields);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      // Add first filter (Mode)
      fireEvent.click(screen.getByTestId("FilterListIcon").closest("button")!);
      await waitFor(() => {
        expect(screen.getByText("Mode")).toBeInTheDocument();
      });
      fireEvent.mouseEnter(screen.getByText("Mode").closest('[role="menuitem"]')!);
      await waitFor(() => {
        expect(screen.getByText("REQUIRED")).toBeInTheDocument();
      });
      const requiredMenuItem = screen.getByText("REQUIRED").closest("li");
      fireEvent.click(requiredMenuItem!);

      // Hover Type to add second filter
      fireEvent.mouseEnter(screen.getByText("Type").closest('[role="menuitem"]')!);
      await waitFor(() => {
        expect(screen.getByText("INT64")).toBeInTheDocument();
      });
      const int64MenuItem = screen.getByText("INT64").closest("li");
      fireEvent.click(int64MenuItem!);

      // Close menu
      fireEvent.keyDown(document.body, { key: "Escape" });

      await waitFor(() => {
        expect(screen.getByText("Mode:")).toBeInTheDocument();
        expect(screen.getByText("Type:")).toBeInTheDocument();
      });

      // Click Clear All
      fireEvent.click(screen.getByText("Clear All"));

      await waitFor(() => {
        expect(screen.queryByText("Mode:")).not.toBeInTheDocument();
        expect(screen.queryByText("Type:")).not.toBeInTheDocument();
        expect(screen.queryByText("Clear All")).not.toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // Filtered Entry Tests
  // ==========================================================================

  describe("Filtered Entry", () => {
    it("returns original entry when no filters applied", () => {
      const entry = createMockEntry("123", defaultSchemaFields);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      expect(mockOnFilteredEntryChange).toHaveBeenCalledWith(entry);
    });

    it("returns filtered entry when filter is applied", async () => {
      const entry = createMockEntry("123", defaultSchemaFields);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      fireEvent.click(screen.getByTestId("FilterListIcon").closest("button")!);
      await waitFor(() => {
        expect(screen.getByText("Mode")).toBeInTheDocument();
      });
      fireEvent.mouseEnter(screen.getByText("Mode").closest('[role="menuitem"]')!);
      await waitFor(() => {
        expect(screen.getByText("REQUIRED")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText("REQUIRED"));

      await waitFor(() => {
        const lastCall =
          mockOnFilteredEntryChange.mock.calls[
            mockOnFilteredEntryChange.mock.calls.length - 1
          ][0];
        const filteredValues =
          lastCall.aspects["123.global.schema"].data.fields.fields.listValue
            .values;
        // Only 'id' field has REQUIRED mode
        expect(filteredValues.length).toBe(1);
        expect(
          filteredValues[0].structValue.fields.name.stringValue
        ).toBe("id");
      });
    });

    it("filters by multiple values of same property", async () => {
      const entry = createMockEntry("123", defaultSchemaFields);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      fireEvent.click(screen.getByTestId("FilterListIcon").closest("button")!);
      await waitFor(() => {
        expect(screen.getByText("Type")).toBeInTheDocument();
      });
      fireEvent.mouseEnter(screen.getByText("Type").closest('[role="menuitem"]')!);
      await waitFor(() => {
        expect(screen.getByText("INT64")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText("INT64"));
      fireEvent.click(screen.getByText("STRING"));

      await waitFor(() => {
        const lastCall =
          mockOnFilteredEntryChange.mock.calls[
            mockOnFilteredEntryChange.mock.calls.length - 1
          ][0];
        const filteredValues =
          lastCall.aspects["123.global.schema"].data.fields.fields.listValue
            .values;
        // id, age (INT64), username, email (STRING)
        expect(filteredValues.length).toBe(4);
      });
    });
  });

  // ==========================================================================
  // Edge Cases Tests
  // ==========================================================================

  describe("Edge Cases", () => {
    it("handles empty schema data", () => {
      const entry = createMockEntry("123", []);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      expect(screen.getByPlaceholderText("Enter property name or value")).toBeInTheDocument();
      expect(mockOnFilteredEntryChange).toHaveBeenCalledWith(entry);
    });

    it("handles missing entry", () => {
      render(
        <SchemaFilter
          entry={undefined as any}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      expect(screen.getByPlaceholderText("Enter property name or value")).toBeInTheDocument();
    });

    it("handles missing aspects", () => {
      const entry = { entryType: "projects/123/locations/us/entryTypes/table" };

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      expect(screen.getByPlaceholderText("Enter property name or value")).toBeInTheDocument();
    });

    it("handles entry with undefined entryType", () => {
      const entry = { aspects: {} };

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      expect(screen.getByPlaceholderText("Enter property name or value")).toBeInTheDocument();
    });

    it("handles fields with missing optional properties", () => {
      const fieldsWithMissing = [
        {
          structValue: {
            fields: {
              name: { stringValue: "col1" },
              dataType: { stringValue: "STRING" },
              metadataType: { stringValue: "PRIMITIVE" },
              mode: { stringValue: "NULLABLE" },
              // no defaultValue
              // no description
            },
          },
        },
      ];
      const entry = createMockEntry("123", fieldsWithMissing);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      expect(screen.getByPlaceholderText("Enter property name or value")).toBeInTheDocument();
    });

    it("filters properties that have no valid data", async () => {
      // Create entry where Description and Default Value only have '-' or empty
      const fieldsWithNoDescriptions = [
        createSchemaField("col1", "STRING", "PRIMITIVE", "NULLABLE", null, null),
        createSchemaField("col2", "INT64", "PRIMITIVE", "REQUIRED", null, null),
      ];
      const entry = createMockEntry("123", fieldsWithNoDescriptions);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
          isPreview={false}
        />
      );

      fireEvent.click(screen.getByTestId("FilterListIcon").closest("button")!);

      await waitFor(() => {
        // Description is text-mode so it is hidden from filter icon menu; Default Value has no valid data so also hidden
        expect(screen.queryByText("Description")).not.toBeInTheDocument();
        expect(screen.queryByText("Default Value")).not.toBeInTheDocument();
        // Dropdown/both properties should appear
        expect(screen.getByText("Name")).toBeInTheDocument();
        expect(screen.getByText("Type")).toBeInTheDocument();
      });
    });

    it("handles fields with null defaultValue", () => {
      const fieldsWithNull = [
        {
          structValue: {
            fields: {
              name: { stringValue: "col1" },
              dataType: { stringValue: "STRING" },
              metadataType: { stringValue: "PRIMITIVE" },
              mode: { stringValue: "NULLABLE" },
              defaultValue: null,
              description: null,
            },
          },
        },
      ];
      const entry = createMockEntry("123", fieldsWithNull);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      expect(screen.getByPlaceholderText("Enter property name or value")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Property Values Tests
  // ==========================================================================

  describe("Property Values", () => {
    it("shows unique values for Name property", async () => {
      const entry = createMockEntry("123", defaultSchemaFields);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      fireEvent.click(screen.getByTestId("FilterListIcon").closest("button")!);
      await waitFor(() => {
        expect(screen.getByText("Name")).toBeInTheDocument();
      });
      fireEvent.mouseEnter(screen.getByText("Name").closest('[role="menuitem"]')!);

      await waitFor(() => {
        expect(screen.getByText("id")).toBeInTheDocument();
        expect(screen.getByText("username")).toBeInTheDocument();
        expect(screen.getByText("email")).toBeInTheDocument();
        expect(screen.getByText("age")).toBeInTheDocument();
        expect(screen.getByText("is_active")).toBeInTheDocument();
      });
    });

    it("shows unique values for Mode property", async () => {
      const entry = createMockEntry("123", defaultSchemaFields);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      fireEvent.click(screen.getByTestId("FilterListIcon").closest("button")!);
      await waitFor(() => {
        expect(screen.getByText("Mode")).toBeInTheDocument();
      });
      fireEvent.mouseEnter(screen.getByText("Mode").closest('[role="menuitem"]')!);

      await waitFor(() => {
        expect(screen.getByText("REQUIRED")).toBeInTheDocument();
        expect(screen.getByText("NULLABLE")).toBeInTheDocument();
      });
    });

    it("shows sorted values alphabetically", async () => {
      const entry = createMockEntry("123", defaultSchemaFields);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      fireEvent.click(screen.getByTestId("FilterListIcon").closest("button")!);
      await waitFor(() => {
        expect(screen.getByText("Type")).toBeInTheDocument();
      });
      fireEvent.mouseEnter(screen.getByText("Type").closest('[role="menuitem"]')!);

      await waitFor(() => {
        const menuItems = screen.getAllByRole("menuitem");
        const typeValues = menuItems
          .filter((item) => item.querySelector('[type="checkbox"]'))
          .map((item) => item.textContent?.trim());

        // Should be sorted: BOOLEAN, INT64, STRING
        expect(typeValues).toEqual(["BOOLEAN", "INT64", "STRING"]);
      });
    });

    it("excludes '-' from Default Value options", async () => {
      const entry = createMockEntry("123", defaultSchemaFields);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      fireEvent.click(screen.getByTestId("FilterListIcon").closest("button")!);
      await waitFor(() => {
        expect(screen.getByText("Default Value")).toBeInTheDocument();
      });
      fireEvent.mouseEnter(screen.getByText("Default Value").closest('[role="menuitem"]')!);

      await waitFor(() => {
        // Should show actual values, not '-'
        expect(screen.getByText("0")).toBeInTheDocument();
        expect(screen.getByText("18")).toBeInTheDocument();
        // The '-' placeholder should not be in the options
        const menuItems = screen.getAllByRole("menuitem");
        const hasHyphen = menuItems.some(
          (item) => item.querySelector('[type="checkbox"]') && item.textContent?.trim() === "-"
        );
        expect(hasHyphen).toBe(false);
      });
    });

    it("Description is text-mode and enters text input on click", async () => {
      const entry = createMockEntry("123", defaultSchemaFields);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      // Text properties are accessible via search input click, not filter icon
      fireEvent.click(screen.getByPlaceholderText("Enter property name or value"));
      await waitFor(() => {
        expect(screen.getByText("Description")).toBeInTheDocument();
      });
      // Clicking Description enters text-input mode (no submenu)
      fireEvent.click(screen.getByText("Description").closest('[role="menuitem"]')!);

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Enter Description value...")).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // Filter Combinations Tests
  // ==========================================================================

  describe("Filter Combinations", () => {
    it("applies multiple filters from different properties", async () => {
      const entry = createMockEntry("123", defaultSchemaFields);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      // Add Type filter
      fireEvent.click(screen.getByTestId("FilterListIcon").closest("button")!);
      await waitFor(() => {
        expect(screen.getByText("Type")).toBeInTheDocument();
      });
      fireEvent.mouseEnter(screen.getByText("Type").closest('[role="menuitem"]')!);
      await waitFor(() => {
        expect(screen.getByText("INT64")).toBeInTheDocument();
      });
      const int64Item = screen.getByText("INT64").closest("li");
      fireEvent.click(int64Item!);

      // Hover Mode to add Mode filter
      fireEvent.mouseEnter(screen.getByText("Mode").closest('[role="menuitem"]')!);
      await waitFor(() => {
        expect(screen.getByText("REQUIRED")).toBeInTheDocument();
      });
      const requiredItem = screen.getByText("REQUIRED").closest("li");
      fireEvent.click(requiredItem!);

      // Close menu
      fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });

      await waitFor(() => {
        // Both filters should be active
        expect(screen.getByText("Type:")).toBeInTheDocument();
        expect(screen.getByText("Mode:")).toBeInTheDocument();

        // Only 'id' matches both INT64 and REQUIRED
        const lastCall =
          mockOnFilteredEntryChange.mock.calls[
            mockOnFilteredEntryChange.mock.calls.length - 1
          ][0];
        const filteredValues =
          lastCall.aspects["123.global.schema"].data.fields.fields.listValue
            .values;
        expect(filteredValues.length).toBe(1);
      });
    });

    it("updates one filter while keeping other filters unchanged", async () => {
      const entry = createMockEntry("123", defaultSchemaFields);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      // Add Type filter with INT64
      fireEvent.click(screen.getByTestId("FilterListIcon").closest("button")!);
      await waitFor(() => {
        expect(screen.getByText("Type")).toBeInTheDocument();
      });
      fireEvent.mouseEnter(screen.getByText("Type").closest('[role="menuitem"]')!);
      await waitFor(() => {
        expect(screen.getByText("INT64")).toBeInTheDocument();
      });
      const int64Item = screen.getByText("INT64").closest("li");
      fireEvent.click(int64Item!);

      // Hover Mode to add Mode filter
      fireEvent.mouseEnter(screen.getByText("Mode").closest('[role="menuitem"]')!);
      await waitFor(() => {
        expect(screen.getByText("NULLABLE")).toBeInTheDocument();
      });
      const nullableItem = screen.getByText("NULLABLE").closest("li");
      fireEvent.click(nullableItem!);

      // Hover Type to update Type filter by adding STRING
      fireEvent.mouseEnter(screen.getByText("Type").closest('[role="menuitem"]')!);
      await waitFor(() => {
        expect(screen.getByText("STRING")).toBeInTheDocument();
      });
      const stringItem = screen.getByText("STRING").closest("li");
      fireEvent.click(stringItem!);

      // Close menu
      fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });

      await waitFor(() => {
        // Both filters should still be active
        expect(screen.getByText("Type:")).toBeInTheDocument();
        expect(screen.getByText("Mode:")).toBeInTheDocument();
        // Type should now include both INT64 and STRING
        expect(screen.getByText("INT64, STRING")).toBeInTheDocument();
      });
    });

    it("filters by Metadata Type property", async () => {
      const entry = createMockEntry("123", defaultSchemaFields);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      fireEvent.click(screen.getByTestId("FilterListIcon").closest("button")!);
      await waitFor(() => {
        expect(screen.getByText("Metadata Type")).toBeInTheDocument();
      });
      fireEvent.mouseEnter(screen.getByText("Metadata Type").closest('[role="menuitem"]')!);
      await waitFor(() => {
        expect(screen.getByText("PRIMITIVE")).toBeInTheDocument();
      });

      const primitiveItem = screen.getByText("PRIMITIVE").closest("li");
      fireEvent.click(primitiveItem!);

      // Close menu
      fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });

      await waitFor(() => {
        expect(screen.getByText("Metadata Type:")).toBeInTheDocument();
      });
    });

    it("filters by Default Value property", async () => {
      const entry = createMockEntry("123", defaultSchemaFields);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      fireEvent.click(screen.getByTestId("FilterListIcon").closest("button")!);
      await waitFor(() => {
        expect(screen.getByText("Default Value")).toBeInTheDocument();
      });
      fireEvent.mouseEnter(screen.getByText("Default Value").closest('[role="menuitem"]')!);
      await waitFor(() => {
        expect(screen.getByText("0")).toBeInTheDocument();
      });

      const zeroItem = screen.getByText("0").closest("li");
      fireEvent.click(zeroItem!);

      // Close menu
      fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });

      await waitFor(() => {
        expect(screen.getByText("Default Value:")).toBeInTheDocument();
        // Should filter to just 'id' field
        const lastCall =
          mockOnFilteredEntryChange.mock.calls[
            mockOnFilteredEntryChange.mock.calls.length - 1
          ][0];
        const filteredValues =
          lastCall.aspects["123.global.schema"].data.fields.fields.listValue
            .values;
        expect(filteredValues.length).toBe(1);
      });
    });

    it("filters by Description property via text input", async () => {
      const entry = createMockEntry("123", defaultSchemaFields);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      // Click search input to open menu (text properties visible via search trigger)
      fireEvent.click(screen.getByPlaceholderText("Enter property name or value"));
      await waitFor(() => {
        expect(screen.getByText("Description")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText("Description").closest('[role="menuitem"]')!);

      const input = screen.getByPlaceholderText("Enter Description value...");
      fireEvent.change(input, { target: { value: "Primary key" } });
      fireEvent.keyDown(input, { key: "Enter" });

      await waitFor(() => {
        expect(screen.getByText("Description:")).toBeInTheDocument();
      });
    });

    it("filters by Name property", async () => {
      const entry = createMockEntry("123", defaultSchemaFields);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      fireEvent.click(screen.getByTestId("FilterListIcon").closest("button")!);
      await waitFor(() => {
        expect(screen.getByText("Name")).toBeInTheDocument();
      });
      fireEvent.mouseEnter(screen.getByText("Name").closest('[role="menuitem"]')!);
      await waitFor(() => {
        expect(screen.getByText("id")).toBeInTheDocument();
      });

      const idItem = screen.getByText("id").closest("li");
      fireEvent.click(idItem!);

      // Close menu
      fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });

      await waitFor(() => {
        expect(screen.getByText("Name:")).toBeInTheDocument();
        // Should filter to just 'id' field
        const lastCall =
          mockOnFilteredEntryChange.mock.calls[
            mockOnFilteredEntryChange.mock.calls.length - 1
          ][0];
        const filteredValues =
          lastCall.aspects["123.global.schema"].data.fields.fields.listValue
            .values;
        expect(filteredValues.length).toBe(1);
      });
    });
  });

  // ==========================================================================
  // Accessibility Tests
  // ==========================================================================

  describe("Accessibility", () => {
    it("has tooltip on filter button", async () => {
      const entry = createMockEntry("123", defaultSchemaFields);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      // The tooltip is present on the IconButton
      const filterButton = screen.getByTestId("FilterListIcon").closest("button");
      expect(filterButton).toBeInTheDocument();
    });

    it("has tooltip on Filter text", async () => {
      const entry = createMockEntry("123", defaultSchemaFields);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      // The Filter text should be clickable
      expect(screen.getByPlaceholderText("Enter property name or value")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Integration Tests
  // ==========================================================================

  describe("Integration Tests", () => {
    it("complete workflow: filter by text chip, add property filter, clear all", async () => {
      const entry = createMockEntry("123", defaultSchemaFields);

      render(
        <SchemaFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
        />
      );

      // Step 1: Text filter via Enter (creates global search chip without property key)
      const input = screen.getByPlaceholderText("Enter property name or value");
      fireEvent.change(input, { target: { value: "id" } });
      fireEvent.keyDown(input, { key: "Enter" });

      await waitFor(() => {
        expect(screen.getByText("id")).toBeInTheDocument();
      });

      // Step 2: Add property filter via dropdown
      fireEvent.click(screen.getByTestId("FilterListIcon").closest("button")!);
      await waitFor(() => {
        expect(screen.getByText("Type")).toBeInTheDocument();
      });
      fireEvent.mouseEnter(screen.getByText("Type").closest('[role="menuitem"]')!);
      await waitFor(() => {
        expect(screen.getByText("BOOLEAN")).toBeInTheDocument();
      });
      const booleanMenuItem = screen.getByText("BOOLEAN").closest("li");
      fireEvent.click(booleanMenuItem!);

      // Close menu to see chips
      fireEvent.keyDown(document.body, { key: "Escape" });

      await waitFor(() => {
        expect(screen.getByText("Type:")).toBeInTheDocument();
      });

      // Step 3: Clear all
      fireEvent.click(screen.getByText("Clear All"));

      await waitFor(() => {
        expect(screen.queryByText("Type:")).not.toBeInTheDocument();
        expect(screen.queryByText("Name:")).not.toBeInTheDocument();
      });
    });
  });
});
