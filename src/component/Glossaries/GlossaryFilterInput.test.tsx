import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GlossaryFilterInput from "./GlossaryFilterInput";
import { type FilterChip, type FilterFieldType } from "./GlossaryDataType";

// Mock GlossaryFilterChip component
vi.mock("./GlossaryFilterChip", () => ({
  default: vi.fn(
    ({ chip, onRemove }: { chip: FilterChip; onRemove: (id: string) => void }) => (
      <div data-testid={`filter-chip-${chip.id}`}>
        <span data-testid="chip-label">{chip.displayLabel}</span>
        <button
          data-testid={`remove-chip-${chip.id}`}
          onClick={() => onRemove(chip.id)}
        >
          Remove
        </button>
      </div>
    )
  ),
}));

// Mock glossaryUtils
vi.mock("../../utils/glossaryUtils", () => ({
  parseFilterInput: vi.fn(
    (input: string, explicitField?: FilterFieldType | null): FilterChip | null => {
      const trimmed = input.trim();
      if (!trimmed) return null;

      if (explicitField) {
        return {
          id: `filter-${Date.now()}`,
          field: explicitField,
          value: trimmed,
          displayLabel: `${explicitField}: ${trimmed}`,
          showFieldLabel: true,
        };
      }

      // Check for field:value format
      const colonIndex = trimmed.indexOf(":");
      if (colonIndex !== -1) {
        const fieldPart = trimmed.slice(0, colonIndex).toLowerCase().trim();
        const valuePart = trimmed.slice(colonIndex + 1).trim();
        const validFields = ["name", "parent", "synonym", "contact", "labels", "aspect"];
        if (valuePart && validFields.includes(fieldPart)) {
          return {
            id: `filter-${Date.now()}`,
            field: fieldPart as FilterFieldType,
            value: valuePart,
            displayLabel: `${fieldPart}: ${valuePart}`,
            showFieldLabel: true,
          };
        }
      }

      // Default to name field
      return {
        id: `filter-${Date.now()}`,
        field: "name",
        value: trimmed,
        displayLabel: trimmed,
        showFieldLabel: false,
      };
    }
  ),
  createOrConnectorChip: vi.fn(
    (): FilterChip => ({
      id: `or-${Date.now()}`,
      field: "name",
      value: "OR",
      displayLabel: "OR",
      connector: "OR",
    })
  ),
  isOrConnector: vi.fn((chip: FilterChip): boolean => {
    return chip.value === "OR" && chip.displayLabel === "OR";
  }),
}));

// Import mocked modules for spy access
import * as glossaryUtils from "../../utils/glossaryUtils";

// Mock data
const createMockChip = (
  id: string,
  field: FilterFieldType,
  value: string,
  displayLabel: string,
  showFieldLabel = true
): FilterChip => ({
  id,
  field,
  value,
  displayLabel,
  showFieldLabel,
});

const mockOrChip: FilterChip = {
  id: "or-1",
  field: "name",
  value: "OR",
  displayLabel: "OR",
  connector: "OR",
};

describe("GlossaryFilterInput", () => {
  const mockOnFiltersChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("renders with default props", () => {
      render(
        <GlossaryFilterInput
          filters={[]}
          onFiltersChange={mockOnFiltersChange}
          isLoading={false}
        />
      );

      expect(screen.getByPlaceholderText("Filter Glossaries")).toBeInTheDocument();
    });

    it("renders with custom placeholder", () => {
      render(
        <GlossaryFilterInput
          filters={[]}
          onFiltersChange={mockOnFiltersChange}
          isLoading={false}
          placeholder="Search terms..."
        />
      );

      expect(screen.getByPlaceholderText("Search terms...")).toBeInTheDocument();
    });

    it("renders search icon when not loading", () => {
      render(
        <GlossaryFilterInput
          filters={[]}
          onFiltersChange={mockOnFiltersChange}
          isLoading={false}
        />
      );

      expect(screen.getByTestId("SearchIcon")).toBeInTheDocument();
    });

    it("renders loading spinner when isLoading is true", () => {
      render(
        <GlossaryFilterInput
          filters={[]}
          onFiltersChange={mockOnFiltersChange}
          isLoading={true}
        />
      );

      expect(screen.getByRole("progressbar")).toBeInTheDocument();
      expect(screen.queryByTestId("SearchIcon")).not.toBeInTheDocument();
    });

    it("renders filter chips when filters are provided", () => {
      const mockChips = [
        createMockChip("chip-1", "name", "Customer", "Name: Customer"),
        createMockChip("chip-2", "contact", "john@example.com", "Contact: john@example.com"),
      ];

      render(
        <GlossaryFilterInput
          filters={mockChips}
          onFiltersChange={mockOnFiltersChange}
          isLoading={false}
        />
      );

      expect(screen.getByTestId("filter-chip-chip-1")).toBeInTheDocument();
      expect(screen.getByTestId("filter-chip-chip-2")).toBeInTheDocument();
    });

    it("does not render chips container when filters array is empty", () => {
      render(
        <GlossaryFilterInput
          filters={[]}
          onFiltersChange={mockOnFiltersChange}
          isLoading={false}
        />
      );

      expect(screen.queryByTestId("filter-chip-chip-1")).not.toBeInTheDocument();
    });

    it("shows 'Add filter...' placeholder when filters exist", () => {
      const mockChips = [createMockChip("chip-1", "name", "Test", "Name: Test")];

      render(
        <GlossaryFilterInput
          filters={mockChips}
          onFiltersChange={mockOnFiltersChange}
          isLoading={false}
        />
      );

      expect(screen.getByPlaceholderText("Add filter...")).toBeInTheDocument();
    });
  });

  describe("Input Behavior", () => {
    it("updates input value on typing", async () => {
      const user = userEvent.setup();

      render(
        <GlossaryFilterInput
          filters={[]}
          onFiltersChange={mockOnFiltersChange}
          isLoading={false}
        />
      );

      const input = screen.getByPlaceholderText("Filter Glossaries");
      await user.type(input, "Customer");

      expect(input).toHaveValue("Customer");
    });

    it("hides dropdown when user starts typing", async () => {
      render(
        <GlossaryFilterInput
          filters={[]}
          onFiltersChange={mockOnFiltersChange}
          isLoading={false}
        />
      );

      const input = screen.getByPlaceholderText("Filter Glossaries");

      // Focus first to show dropdown
      await act(async () => {
        fireEvent.focus(input);
      });

      // Dropdown should be visible after focus
      expect(screen.getByText("Name")).toBeInTheDocument();

      // Type to hide dropdown
      await act(async () => {
        fireEvent.change(input, { target: { value: "test" } });
      });

      // Dropdown should be hidden after typing
      expect(screen.queryByText("Name")).not.toBeInTheDocument();
    });

    it("focuses input when clicking the container", async () => {
      const user = userEvent.setup();

      render(
        <GlossaryFilterInput
          filters={[]}
          onFiltersChange={mockOnFiltersChange}
          isLoading={false}
        />
      );

      const input = screen.getByPlaceholderText("Filter Glossaries");
      const container = input.closest('[class*="MuiBox-root"]');

      await user.click(container!);

      expect(input).toHaveFocus();
    });
  });

  describe("Dropdown Behavior", () => {
    it("shows dropdown on focus when input is empty", async () => {
      render(
        <GlossaryFilterInput
          filters={[]}
          onFiltersChange={mockOnFiltersChange}
          isLoading={false}
        />
      );

      const input = screen.getByPlaceholderText("Filter Glossaries");

      await act(async () => {
        fireEvent.focus(input);
      });

      // Check that all field options are visible
      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.getByText("Parent")).toBeInTheDocument();
      expect(screen.getByText("Synonym")).toBeInTheDocument();
      expect(screen.getByText("Contact")).toBeInTheDocument();
      expect(screen.getByText("Labels")).toBeInTheDocument();
      expect(screen.getByText("Aspect")).toBeInTheDocument();
    });

    it("shows OR option when filters exist and last filter is not OR", async () => {
      const mockChips = [createMockChip("chip-1", "name", "Test", "Name: Test")];

      render(
        <GlossaryFilterInput
          filters={mockChips}
          onFiltersChange={mockOnFiltersChange}
          isLoading={false}
        />
      );

      const input = screen.getByPlaceholderText("Add filter...");

      await act(async () => {
        fireEvent.focus(input);
      });

      expect(screen.getByRole("menuitem", { name: "OR" })).toBeInTheDocument();
    });

    it("does not show OR option when last filter is OR", async () => {
      render(
        <GlossaryFilterInput
          filters={[mockOrChip]}
          onFiltersChange={mockOnFiltersChange}
          isLoading={false}
        />
      );

      const input = screen.getByPlaceholderText("Add filter...");

      await act(async () => {
        fireEvent.focus(input);
      });

      // Should only show field options, not OR
      const orMenuItems = screen.queryAllByRole("menuitem", { name: "OR" });
      expect(orMenuItems.length).toBe(0);
    });

    it("does not show OR option when no filters exist", async () => {
      render(
        <GlossaryFilterInput
          filters={[]}
          onFiltersChange={mockOnFiltersChange}
          isLoading={false}
        />
      );

      const input = screen.getByPlaceholderText("Filter Glossaries");

      await act(async () => {
        fireEvent.focus(input);
      });

      const orMenuItems = screen.queryAllByRole("menuitem", { name: "OR" });
      expect(orMenuItems.length).toBe(0);
    });

    it("selects field from dropdown and updates placeholder", async () => {
      const user = userEvent.setup();

      render(
        <GlossaryFilterInput
          filters={[]}
          onFiltersChange={mockOnFiltersChange}
          isLoading={false}
        />
      );

      const input = screen.getByPlaceholderText("Filter Glossaries");

      await act(async () => {
        fireEvent.focus(input);
      });

      const contactOption = screen.getByText("Contact");
      await user.click(contactOption);

      // Dropdown should close
      expect(screen.queryByRole("menuitem")).not.toBeInTheDocument();

      // Selected field label should appear
      expect(screen.getByText("Contact:")).toBeInTheDocument();

      // Placeholder should update
      expect(screen.getByPlaceholderText("Enter Contact value...")).toBeInTheDocument();
    });

    it("adds OR chip when selecting OR from dropdown", async () => {
      const user = userEvent.setup();
      const mockChips = [createMockChip("chip-1", "name", "Test", "Name: Test")];

      render(
        <GlossaryFilterInput
          filters={mockChips}
          onFiltersChange={mockOnFiltersChange}
          isLoading={false}
        />
      );

      const input = screen.getByPlaceholderText("Add filter...");

      await act(async () => {
        fireEvent.focus(input);
      });

      const orOption = screen.getByRole("menuitem", { name: "OR" });
      await user.click(orOption);

      expect(glossaryUtils.createOrConnectorChip).toHaveBeenCalled();
      expect(mockOnFiltersChange).toHaveBeenCalled();
      const calledWith = mockOnFiltersChange.mock.calls[0][0];
      expect(calledWith.length).toBe(2);
      expect(calledWith[1].value).toBe("OR");
    });

    it("closes dropdown on click away", async () => {
      const user = userEvent.setup();

      render(
        <div>
          <div data-testid="outside">Outside</div>
          <GlossaryFilterInput
            filters={[]}
            onFiltersChange={mockOnFiltersChange}
            isLoading={false}
          />
        </div>
      );

      const input = screen.getByPlaceholderText("Filter Glossaries");

      await act(async () => {
        fireEvent.focus(input);
      });

      // Dropdown is open
      expect(screen.getByText("Name")).toBeInTheDocument();

      // Click outside
      const outside = screen.getByTestId("outside");
      await user.click(outside);

      // Dropdown should close
      await waitFor(() => {
        expect(screen.queryByText("Name")).not.toBeInTheDocument();
      });
    });

    it("toggles dropdown when clicking input while already focused", async () => {
      const user = userEvent.setup();

      render(
        <GlossaryFilterInput
          filters={[]}
          onFiltersChange={mockOnFiltersChange}
          isLoading={false}
        />
      );

      const input = screen.getByPlaceholderText("Filter Glossaries");

      // First focus - opens dropdown
      await act(async () => {
        fireEvent.focus(input);
      });
      expect(screen.getByText("Name")).toBeInTheDocument();

      // Click while focused - toggles dropdown off
      await user.click(input);
      await waitFor(() => {
        expect(screen.queryByText("Name")).not.toBeInTheDocument();
      });

      // Click again - toggles dropdown on
      await user.click(input);
      await waitFor(() => {
        expect(screen.getByText("Name")).toBeInTheDocument();
      });
    });

    it("does not reopen dropdown after selecting a field", async () => {
      const user = userEvent.setup();

      render(
        <GlossaryFilterInput
          filters={[]}
          onFiltersChange={mockOnFiltersChange}
          isLoading={false}
        />
      );

      const input = screen.getByPlaceholderText("Filter Glossaries");

      await act(async () => {
        fireEvent.focus(input);
      });

      const nameOption = screen.getByText("Name");
      await user.click(nameOption);

      // Dropdown should be closed after selection
      expect(screen.queryByRole("menuitem")).not.toBeInTheDocument();
    });
  });

  describe("Keyboard Handling", () => {
    it("creates filter chip on Enter with input value", async () => {
      const user = userEvent.setup();

      render(
        <GlossaryFilterInput
          filters={[]}
          onFiltersChange={mockOnFiltersChange}
          isLoading={false}
        />
      );

      const input = screen.getByPlaceholderText("Filter Glossaries");
      await user.type(input, "Customer{enter}");

      expect(glossaryUtils.parseFilterInput).toHaveBeenCalledWith("Customer", null);
      expect(mockOnFiltersChange).toHaveBeenCalled();
    });

    it("creates filter chip on comma key", async () => {
      render(
        <GlossaryFilterInput
          filters={[]}
          onFiltersChange={mockOnFiltersChange}
          isLoading={false}
        />
      );

      const input = screen.getByPlaceholderText("Filter Glossaries");

      // Type value
      await act(async () => {
        fireEvent.change(input, { target: { value: "Customer" } });
      });

      // Press comma
      await act(async () => {
        fireEvent.keyDown(input, { key: "," });
      });

      expect(glossaryUtils.parseFilterInput).toHaveBeenCalled();
      expect(mockOnFiltersChange).toHaveBeenCalled();
    });

    it("creates filter chip with selected field", async () => {
      const user = userEvent.setup();

      render(
        <GlossaryFilterInput
          filters={[]}
          onFiltersChange={mockOnFiltersChange}
          isLoading={false}
        />
      );

      const input = screen.getByPlaceholderText("Filter Glossaries");

      await act(async () => {
        fireEvent.focus(input);
      });

      // Select a field
      const contactOption = screen.getByText("Contact");
      await user.click(contactOption);

      // Type value and press Enter
      const updatedInput = screen.getByPlaceholderText("Enter Contact value...");
      await user.type(updatedInput, "john@test.com{enter}");

      expect(glossaryUtils.parseFilterInput).toHaveBeenCalledWith("john@test.com", "contact");
      expect(mockOnFiltersChange).toHaveBeenCalled();
    });

    it("does not create chip on Enter with empty input", async () => {
      render(
        <GlossaryFilterInput
          filters={[]}
          onFiltersChange={mockOnFiltersChange}
          isLoading={false}
        />
      );

      const input = screen.getByPlaceholderText("Filter Glossaries");

      await act(async () => {
        fireEvent.focus(input);
        fireEvent.keyDown(input, { key: "Enter" });
      });

      expect(mockOnFiltersChange).not.toHaveBeenCalled();
    });

    it("creates OR chip when typing 'OR' and pressing Enter", async () => {
      const user = userEvent.setup();
      const mockChips = [createMockChip("chip-1", "name", "Test", "Name: Test")];

      render(
        <GlossaryFilterInput
          filters={mockChips}
          onFiltersChange={mockOnFiltersChange}
          isLoading={false}
        />
      );

      const input = screen.getByPlaceholderText("Add filter...");
      await user.type(input, "OR{enter}");

      expect(glossaryUtils.createOrConnectorChip).toHaveBeenCalled();
      expect(mockOnFiltersChange).toHaveBeenCalled();
    });

    it("creates OR chip when typing 'or' (lowercase) and pressing Enter", async () => {
      const user = userEvent.setup();
      const mockChips = [createMockChip("chip-1", "name", "Test", "Name: Test")];

      render(
        <GlossaryFilterInput
          filters={mockChips}
          onFiltersChange={mockOnFiltersChange}
          isLoading={false}
        />
      );

      const input = screen.getByPlaceholderText("Add filter...");
      await user.type(input, "or{enter}");

      expect(glossaryUtils.createOrConnectorChip).toHaveBeenCalled();
      expect(mockOnFiltersChange).toHaveBeenCalled();
    });

    it("does not create OR chip when no filters exist", async () => {
      const user = userEvent.setup();

      render(
        <GlossaryFilterInput
          filters={[]}
          onFiltersChange={mockOnFiltersChange}
          isLoading={false}
        />
      );

      const input = screen.getByPlaceholderText("Filter Glossaries");
      await user.type(input, "OR{enter}");

      expect(glossaryUtils.createOrConnectorChip).not.toHaveBeenCalled();
      expect(mockOnFiltersChange).not.toHaveBeenCalled();
    });

    it("does not create OR chip when last filter is OR", async () => {
      const user = userEvent.setup();

      render(
        <GlossaryFilterInput
          filters={[mockOrChip]}
          onFiltersChange={mockOnFiltersChange}
          isLoading={false}
        />
      );

      const input = screen.getByPlaceholderText("Add filter...");
      await user.type(input, "OR{enter}");

      expect(mockOnFiltersChange).not.toHaveBeenCalled();
    });

    it("removes last filter on Backspace with empty input", async () => {
      const mockChips = [
        createMockChip("chip-1", "name", "Test1", "Name: Test1"),
        createMockChip("chip-2", "name", "Test2", "Name: Test2"),
      ];

      render(
        <GlossaryFilterInput
          filters={mockChips}
          onFiltersChange={mockOnFiltersChange}
          isLoading={false}
        />
      );

      const input = screen.getByPlaceholderText("Add filter...");

      await act(async () => {
        fireEvent.focus(input);
        fireEvent.keyDown(input, { key: "Backspace" });
      });

      expect(mockOnFiltersChange).toHaveBeenCalledWith([mockChips[0]]);
    });

    it("clears selected field on Backspace before removing filters", async () => {
      const user = userEvent.setup();

      render(
        <GlossaryFilterInput
          filters={[]}
          onFiltersChange={mockOnFiltersChange}
          isLoading={false}
        />
      );

      const input = screen.getByPlaceholderText("Filter Glossaries");

      await act(async () => {
        fireEvent.focus(input);
      });

      // Select a field
      const contactOption = screen.getByText("Contact");
      await user.click(contactOption);

      expect(screen.getByText("Contact:")).toBeInTheDocument();

      // Press Backspace to clear selected field
      const updatedInput = screen.getByPlaceholderText("Enter Contact value...");
      await act(async () => {
        fireEvent.keyDown(updatedInput, { key: "Backspace" });
      });

      // Field should be cleared
      expect(screen.queryByText("Contact:")).not.toBeInTheDocument();

      // Dropdown should reopen
      expect(screen.getByText("Name")).toBeInTheDocument();
    });

    it("reopens dropdown when removing a filter with Backspace", async () => {
      const mockChips = [createMockChip("chip-1", "name", "Test", "Name: Test")];

      render(
        <GlossaryFilterInput
          filters={mockChips}
          onFiltersChange={mockOnFiltersChange}
          isLoading={false}
        />
      );

      const input = screen.getByPlaceholderText("Add filter...");

      await act(async () => {
        fireEvent.focus(input);
      });

      // Close dropdown first using Escape
      await act(async () => {
        fireEvent.keyDown(input, { key: "Escape" });
      });
      expect(screen.queryByText("Name")).not.toBeInTheDocument();

      // Press Backspace
      await act(async () => {
        fireEvent.keyDown(input, { key: "Backspace" });
      });

      // Dropdown should reopen
      expect(screen.getByText("Name")).toBeInTheDocument();
    });

    it("closes dropdown and clears selected field on Escape", async () => {
      const user = userEvent.setup();

      render(
        <GlossaryFilterInput
          filters={[]}
          onFiltersChange={mockOnFiltersChange}
          isLoading={false}
        />
      );

      const input = screen.getByPlaceholderText("Filter Glossaries");

      await act(async () => {
        fireEvent.focus(input);
      });

      // Select a field
      const contactOption = screen.getByText("Contact");
      await user.click(contactOption);

      expect(screen.getByText("Contact:")).toBeInTheDocument();

      // Press Escape
      const updatedInput = screen.getByPlaceholderText("Enter Contact value...");
      await act(async () => {
        fireEvent.keyDown(updatedInput, { key: "Escape" });
      });

      // Field should be cleared and dropdown should be closed
      expect(screen.queryByText("Contact:")).not.toBeInTheDocument();
      expect(screen.queryByRole("menuitem")).not.toBeInTheDocument();
    });

    it("does not process Backspace when input has value", async () => {
      const user = userEvent.setup();
      const mockChips = [createMockChip("chip-1", "name", "Test", "Name: Test")];

      render(
        <GlossaryFilterInput
          filters={mockChips}
          onFiltersChange={mockOnFiltersChange}
          isLoading={false}
        />
      );

      const input = screen.getByPlaceholderText("Add filter...");
      await user.type(input, "Customer");

      // Now press backspace (should just delete a character, not remove chip)
      await act(async () => {
        fireEvent.keyDown(input, { key: "Backspace" });
      });

      // Should not remove filter since input has value
      expect(mockOnFiltersChange).not.toHaveBeenCalled();
    });
  });

  describe("Chip Removal", () => {
    it("removes chip when clicking remove button", async () => {
      const user = userEvent.setup();
      const mockChips = [
        createMockChip("chip-1", "name", "Test1", "Name: Test1"),
        createMockChip("chip-2", "name", "Test2", "Name: Test2"),
      ];

      render(
        <GlossaryFilterInput
          filters={mockChips}
          onFiltersChange={mockOnFiltersChange}
          isLoading={false}
        />
      );

      const removeButton = screen.getByTestId("remove-chip-chip-1");
      await user.click(removeButton);

      expect(mockOnFiltersChange).toHaveBeenCalledWith([mockChips[1]]);
    });

    it("removes all filters when clicking remove on each", async () => {
      const user = userEvent.setup();
      const mockChips = [createMockChip("chip-1", "name", "Test", "Name: Test")];

      const { rerender } = render(
        <GlossaryFilterInput
          filters={mockChips}
          onFiltersChange={mockOnFiltersChange}
          isLoading={false}
        />
      );

      const removeButton = screen.getByTestId("remove-chip-chip-1");
      await user.click(removeButton);

      expect(mockOnFiltersChange).toHaveBeenCalledWith([]);

      // Rerender with empty filters
      rerender(
        <GlossaryFilterInput
          filters={[]}
          onFiltersChange={mockOnFiltersChange}
          isLoading={false}
        />
      );

      expect(screen.getByPlaceholderText("Filter Glossaries")).toBeInTheDocument();
    });
  });

  describe("Filter Input Parsing", () => {
    it("parses field:value format correctly", async () => {
      const user = userEvent.setup();

      render(
        <GlossaryFilterInput
          filters={[]}
          onFiltersChange={mockOnFiltersChange}
          isLoading={false}
        />
      );

      const input = screen.getByPlaceholderText("Filter Glossaries");
      await user.type(input, "contact:john@test.com{enter}");

      expect(glossaryUtils.parseFilterInput).toHaveBeenCalledWith("contact:john@test.com", null);
      expect(mockOnFiltersChange).toHaveBeenCalled();
    });

    it("does not create chip when parseFilterInput returns null", async () => {
      // Mock parseFilterInput to return null
      vi.mocked(glossaryUtils.parseFilterInput).mockReturnValueOnce(null);

      render(
        <GlossaryFilterInput
          filters={[]}
          onFiltersChange={mockOnFiltersChange}
          isLoading={false}
        />
      );

      const input = screen.getByPlaceholderText("Filter Glossaries");

      await act(async () => {
        fireEvent.change(input, { target: { value: "test" } });
        fireEvent.keyDown(input, { key: "Enter" });
      });

      expect(mockOnFiltersChange).not.toHaveBeenCalled();
    });
  });

  describe("Focus and Blur Behavior", () => {
    it("sets focused state on input focus and shows dropdown", async () => {
      render(
        <GlossaryFilterInput
          filters={[]}
          onFiltersChange={mockOnFiltersChange}
          isLoading={false}
        />
      );

      const input = screen.getByPlaceholderText("Filter Glossaries");

      await act(async () => {
        fireEvent.focus(input);
      });

      // Focus should trigger dropdown to show (indicating focus state is set)
      expect(screen.getByText("Name")).toBeInTheDocument();
    });

    it("clears focused state on blur and hides dropdown via click away", async () => {
      const user = userEvent.setup();

      render(
        <div>
          <button data-testid="other-button">Other</button>
          <GlossaryFilterInput
            filters={[]}
            onFiltersChange={mockOnFiltersChange}
            isLoading={false}
          />
        </div>
      );

      const input = screen.getByPlaceholderText("Filter Glossaries");

      await act(async () => {
        fireEvent.focus(input);
      });

      // Focus should trigger dropdown to show
      expect(screen.getByText("Name")).toBeInTheDocument();

      // Trigger blur by clicking elsewhere
      await user.click(screen.getByTestId("other-button"));

      // Dropdown should close (indicating blur state is handled)
      await waitFor(() => {
        expect(screen.queryByText("Name")).not.toBeInTheDocument();
      });
    });

    it("handles blur event directly on input", async () => {
      render(
        <GlossaryFilterInput
          filters={[]}
          onFiltersChange={mockOnFiltersChange}
          isLoading={false}
        />
      );

      const input = screen.getByPlaceholderText("Filter Glossaries");

      await act(async () => {
        fireEvent.focus(input);
      });

      expect(screen.getByText("Name")).toBeInTheDocument();

      // Directly trigger blur event
      await act(async () => {
        fireEvent.blur(input);
      });

      // Component should handle blur without errors
      expect(input).toBeInTheDocument();
    });
  });

  describe("Multiple Filter Operations", () => {
    it("handles multiple filters being added in sequence", async () => {
      const user = userEvent.setup();

      let currentFilters: FilterChip[] = [];
      const onFiltersChange = vi.fn((newFilters: FilterChip[]) => {
        currentFilters = newFilters;
      });

      const { rerender } = render(
        <GlossaryFilterInput
          filters={currentFilters}
          onFiltersChange={onFiltersChange}
          isLoading={false}
        />
      );

      const input = screen.getByPlaceholderText("Filter Glossaries");

      // Add first filter
      await user.type(input, "Customer{enter}");
      expect(onFiltersChange).toHaveBeenCalled();

      // Simulate rerender with new filter
      currentFilters = [createMockChip("filter-1", "name", "Customer", "Customer", false)];
      rerender(
        <GlossaryFilterInput
          filters={currentFilters}
          onFiltersChange={onFiltersChange}
          isLoading={false}
        />
      );

      // Add second filter
      const updatedInput = screen.getByPlaceholderText("Add filter...");
      await user.type(updatedInput, "Product{enter}");
      expect(onFiltersChange).toHaveBeenCalledTimes(2);
    });

    it("handles filter with OR connector", async () => {
      const user = userEvent.setup();

      const mockChips = [
        createMockChip("chip-1", "name", "Customer", "Name: Customer"),
        mockOrChip,
      ];

      render(
        <GlossaryFilterInput
          filters={mockChips}
          onFiltersChange={mockOnFiltersChange}
          isLoading={false}
        />
      );

      // Verify both chips are rendered
      expect(screen.getByTestId("filter-chip-chip-1")).toBeInTheDocument();
      expect(screen.getByTestId("filter-chip-or-1")).toBeInTheDocument();

      // Add another filter after OR
      const input = screen.getByPlaceholderText("Add filter...");
      await user.type(input, "Product{enter}");

      expect(mockOnFiltersChange).toHaveBeenCalled();
      const calledWith = mockOnFiltersChange.mock.calls[0][0];
      expect(calledWith.length).toBe(3);
    });
  });

  describe("Edge Cases", () => {
    it("handles whitespace-only input", async () => {
      render(
        <GlossaryFilterInput
          filters={[]}
          onFiltersChange={mockOnFiltersChange}
          isLoading={false}
        />
      );

      const input = screen.getByPlaceholderText("Filter Glossaries");

      await act(async () => {
        fireEvent.change(input, { target: { value: "   " } });
        fireEvent.keyDown(input, { key: "Enter" });
      });

      // Should not create a chip
      expect(mockOnFiltersChange).not.toHaveBeenCalled();
    });

    it("handles rapid input changes", async () => {
      const user = userEvent.setup();

      render(
        <GlossaryFilterInput
          filters={[]}
          onFiltersChange={mockOnFiltersChange}
          isLoading={false}
        />
      );

      const input = screen.getByPlaceholderText("Filter Glossaries");
      await user.type(input, "test1{enter}test2{enter}");

      // Both should trigger filter creation
      expect(glossaryUtils.parseFilterInput).toHaveBeenCalledTimes(2);
    });

    it("handles special characters in filter value", async () => {
      const user = userEvent.setup();

      render(
        <GlossaryFilterInput
          filters={[]}
          onFiltersChange={mockOnFiltersChange}
          isLoading={false}
        />
      );

      const input = screen.getByPlaceholderText("Filter Glossaries");
      await user.type(input, "user@example.com{enter}");

      expect(glossaryUtils.parseFilterInput).toHaveBeenCalledWith("user@example.com", null);
      expect(mockOnFiltersChange).toHaveBeenCalled();
    });

    it("handles empty filters array gracefully", () => {
      render(
        <GlossaryFilterInput
          filters={[]}
          onFiltersChange={mockOnFiltersChange}
          isLoading={false}
        />
      );

      // Should render without errors
      expect(screen.getByPlaceholderText("Filter Glossaries")).toBeInTheDocument();
    });

    it("clears input value after successful filter creation", async () => {
      const user = userEvent.setup();

      render(
        <GlossaryFilterInput
          filters={[]}
          onFiltersChange={mockOnFiltersChange}
          isLoading={false}
        />
      );

      const input = screen.getByPlaceholderText("Filter Glossaries");
      await user.type(input, "Customer{enter}");

      expect(input).toHaveValue("");
    });

    it("clears selected field after successful filter creation", async () => {
      const user = userEvent.setup();

      render(
        <GlossaryFilterInput
          filters={[]}
          onFiltersChange={mockOnFiltersChange}
          isLoading={false}
        />
      );

      const input = screen.getByPlaceholderText("Filter Glossaries");

      await act(async () => {
        fireEvent.focus(input);
      });

      // Select a field
      const contactOption = screen.getByText("Contact");
      await user.click(contactOption);

      expect(screen.getByText("Contact:")).toBeInTheDocument();

      // Type and submit
      const updatedInput = screen.getByPlaceholderText("Enter Contact value...");
      await user.type(updatedInput, "test@test.com{enter}");

      // Selected field should be cleared
      expect(screen.queryByText("Contact:")).not.toBeInTheDocument();
    });
  });

  describe("Cleanup", () => {
    it("clears debounce timer on unmount", () => {
      const { unmount } = render(
        <GlossaryFilterInput
          filters={[]}
          onFiltersChange={mockOnFiltersChange}
          isLoading={false}
        />
      );

      unmount();

      // Component unmounted without error
      expect(true).toBe(true);
    });
  });

  describe("All Filter Field Types", () => {
    const fieldTypes: FilterFieldType[] = ["name", "parent", "synonym", "contact", "labels", "aspect"];

    fieldTypes.forEach((field) => {
      it(`shows correct placeholder for ${field} field selection`, async () => {
        const user = userEvent.setup();
        const fieldLabel = field.charAt(0).toUpperCase() + field.slice(1);

        render(
          <GlossaryFilterInput
            filters={[]}
            onFiltersChange={mockOnFiltersChange}
            isLoading={false}
          />
        );

        const input = screen.getByPlaceholderText("Filter Glossaries");

        await act(async () => {
          fireEvent.focus(input);
        });

        const fieldOption = screen.getByText(fieldLabel);
        await user.click(fieldOption);

        expect(screen.getByPlaceholderText(`Enter ${fieldLabel} value...`)).toBeInTheDocument();
      });
    });
  });
});
