import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ListView from "./ListView";

// Mock navigate function
const mockNavigate = vi.fn();

// Mock dispatch function
const mockDispatch = vi.fn();

// Mock useAuth
const mockUseAuth = vi.fn();

// Mock react-router-dom
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

// Mock react-redux
vi.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
}));

// Mock entry slice
vi.mock("../../features/entry/entrySlice", () => ({
  fetchLineageEntry: vi.fn((payload) => ({
    type: "entry/fetchLineageEntry",
    payload,
  })),
  pushToHistory: vi.fn(() => ({ type: "entry/pushToHistory" })),
}));

// Mock auth provider
vi.mock("../../auth/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock MUI icons
vi.mock("@mui/icons-material", () => ({
  FilterList: () => <span data-testid="filter-list-icon">FilterList</span>,
  Close: () => <span data-testid="close-icon">Close</span>,
  ArrowUpward: ({ sx }: any) => (
    <span data-testid="arrow-upward-icon" style={sx}>
      ArrowUpward
    </span>
  ),
  ArrowDownward: ({ sx }: any) => (
    <span data-testid="arrow-downward-icon" style={sx}>
      ArrowDownward
    </span>
  ),
}));

// ============================================================================
// Mock Data Generators
// ============================================================================

interface LineageData {
  id: number;
  sourceSystem: string;
  sourceProject: string;
  source: string;
  sourceFQN: string;
  target: string;
  targetProject: string;
  targetSystem: string;
  targetFQN: string;
}

const createMockLineageData = (
  overrides: Partial<LineageData> = {},
  index: number = 1
): LineageData => ({
  id: index,
  sourceSystem: `SourceSystem${index}`,
  sourceProject: `SourceProject${index}`,
  source: `source_table_${index}`,
  sourceFQN: `project.dataset.source_table_${index}`,
  target: `target_table_${index}`,
  targetProject: `TargetProject${index}`,
  targetSystem: `TargetSystem${index}`,
  targetFQN: `project.dataset.target_table_${index}`,
  ...overrides,
});

const createMockListData = (count: number = 3): LineageData[] => {
  return Array.from({ length: count }, (_, i) => createMockLineageData({}, i + 1));
};

const createMockEntry = (name: string = "current_table") => ({
  fullyQualifiedName: `project.dataset.${name}`,
  name,
});

// ============================================================================
// Test Suite
// ============================================================================

describe("ListView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { token: "test-token-123" },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // Basic Rendering Tests
  // ==========================================================================

  describe("Basic Rendering", () => {
    it("renders without crashing", () => {
      render(<ListView listData={[]} />);
      expect(screen.getByText("Filter")).toBeInTheDocument();
    });

    it("renders filter chips section", () => {
      const listData = createMockListData(5);
      render(<ListView listData={listData} />);

      expect(screen.getByText("All (5)")).toBeInTheDocument();
    });

    it("renders upstream chip with correct count", () => {
      const listData = [
        createMockLineageData({ target: "current_table" }, 1),
        createMockLineageData({ target: "current_table" }, 2),
        createMockLineageData({ target: "other_table" }, 3),
      ];
      const entry = createMockEntry("current_table");

      render(<ListView listData={listData} entry={entry} />);

      expect(screen.getByText("Upstream (2)")).toBeInTheDocument();
    });

    it("renders downstream chip with correct count", () => {
      const listData = [
        createMockLineageData({ source: "current_table" }, 1),
        createMockLineageData({ source: "current_table" }, 2),
        createMockLineageData({ source: "other_table" }, 3),
      ];
      const entry = createMockEntry("current_table");

      render(<ListView listData={listData} entry={entry} />);

      expect(screen.getByText("Downstream (2)")).toBeInTheDocument();
    });

    it("renders filter text input", () => {
      render(<ListView listData={[]} />);

      expect(
        screen.getByPlaceholderText("Enter property name or value")
      ).toBeInTheDocument();
    });

    it("renders filter icon button", () => {
      render(<ListView listData={[]} />);

      expect(screen.getByTestId("filter-list-icon")).toBeInTheDocument();
    });

    it("renders table headers", () => {
      render(<ListView listData={createMockListData()} />);

      // Use getAllByText since headers may appear in multiple places
      expect(screen.getAllByText("Source System").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Source Project").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Source").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Source FQN").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Target").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Target Project").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Target System").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Target FQN").length).toBeGreaterThan(0);
    });

    it("renders table data rows", () => {
      const listData = createMockListData(2);
      render(<ListView listData={listData} />);

      expect(screen.getByText("SourceSystem1")).toBeInTheDocument();
      expect(screen.getByText("SourceSystem2")).toBeInTheDocument();
      expect(screen.getByText("source_table_1")).toBeInTheDocument();
      expect(screen.getByText("source_table_2")).toBeInTheDocument();
    });

    it("renders empty table when no data", () => {
      render(<ListView listData={[]} />);

      expect(screen.getByText("All (0)")).toBeInTheDocument();
      expect(screen.queryByText("SourceSystem1")).not.toBeInTheDocument();
    });

    it("logs listData on mount", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const listData = createMockListData(2);

      render(<ListView listData={listData} />);

      expect(consoleSpy).toHaveBeenCalledWith(listData);
      consoleSpy.mockRestore();
    });
  });

  // ==========================================================================
  // Filter Chip Tests
  // ==========================================================================

  describe("Filter Chips", () => {
    it("selects All filter by default", () => {
      const listData = createMockListData(3);
      render(<ListView listData={listData} />);

      // All 3 rows should be visible
      expect(screen.getByText("source_table_1")).toBeInTheDocument();
      expect(screen.getByText("source_table_2")).toBeInTheDocument();
      expect(screen.getByText("source_table_3")).toBeInTheDocument();
    });

    it("filters to upstream when upstream chip clicked", async () => {
      const listData = [
        createMockLineageData({ target: "current_table", source: "upstream1" }, 1),
        createMockLineageData({ target: "current_table", source: "upstream2" }, 2),
        createMockLineageData({ target: "other_table", source: "other" }, 3),
      ];
      const entry = createMockEntry("current_table");

      render(<ListView listData={listData} entry={entry} />);

      const upstreamChip = screen.getByText("Upstream (2)");
      fireEvent.click(upstreamChip);

      // Only upstream items should be visible
      expect(screen.getByText("upstream1")).toBeInTheDocument();
      expect(screen.getByText("upstream2")).toBeInTheDocument();
      expect(screen.queryByText("other")).not.toBeInTheDocument();
    });

    it("filters to downstream when downstream chip clicked", async () => {
      const listData = [
        createMockLineageData({ source: "current_table", target: "downstream1" }, 1),
        createMockLineageData({ source: "current_table", target: "downstream2" }, 2),
        createMockLineageData({ source: "other_table", target: "other" }, 3),
      ];
      const entry = createMockEntry("current_table");

      render(<ListView listData={listData} entry={entry} />);

      const downstreamChip = screen.getByText("Downstream (2)");
      fireEvent.click(downstreamChip);

      // Only downstream items should be visible
      expect(screen.getByText("downstream1")).toBeInTheDocument();
      expect(screen.getByText("downstream2")).toBeInTheDocument();
      expect(screen.queryByText("other")).not.toBeInTheDocument();
    });

    it("returns to all items when all chip clicked after filtering", async () => {
      const listData = [
        createMockLineageData({ source: "current_table", target: "downstream1" }, 1),
        createMockLineageData({ source: "other_table", target: "other" }, 2),
      ];
      const entry = createMockEntry("current_table");

      render(<ListView listData={listData} entry={entry} />);

      // First filter to downstream
      const downstreamChip = screen.getByText("Downstream (1)");
      fireEvent.click(downstreamChip);

      expect(screen.queryByText("other")).not.toBeInTheDocument();

      // Then click All
      const allChip = screen.getByText("All (2)");
      fireEvent.click(allChip);

      // All items should be visible again
      expect(screen.getByText("downstream1")).toBeInTheDocument();
      expect(screen.getByText("other")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Text Filter Tests
  // ==========================================================================

  describe("Text Filtering", () => {
    it("filters data by source name", async () => {
      const listData = [
        createMockLineageData({ source: "orders_table" }, 1),
        createMockLineageData({ source: "customers_table" }, 2),
        createMockLineageData({ source: "products_table" }, 3),
      ];

      render(<ListView listData={listData} />);

      const filterInput = screen.getByPlaceholderText("Enter property name or value");
      await userEvent.type(filterInput, "orders");

      expect(screen.getByText("orders_table")).toBeInTheDocument();
      expect(screen.queryByText("customers_table")).not.toBeInTheDocument();
      expect(screen.queryByText("products_table")).not.toBeInTheDocument();
    });

    it("filters data by target name", async () => {
      const listData = [
        createMockLineageData({ target: "analytics_table" }, 1),
        createMockLineageData({ target: "reports_table" }, 2),
      ];

      render(<ListView listData={listData} />);

      const filterInput = screen.getByPlaceholderText("Enter property name or value");
      await userEvent.type(filterInput, "analytics");

      expect(screen.getByText("analytics_table")).toBeInTheDocument();
      expect(screen.queryByText("reports_table")).not.toBeInTheDocument();
    });

    it("filters data by sourceFQN", async () => {
      const listData = [
        createMockLineageData({ sourceFQN: "project.sales.orders" }, 1),
        createMockLineageData({ sourceFQN: "project.hr.employees" }, 2),
      ];

      render(<ListView listData={listData} />);

      const filterInput = screen.getByPlaceholderText("Enter property name or value");
      await userEvent.type(filterInput, "sales");

      expect(screen.getByText("project.sales.orders")).toBeInTheDocument();
      expect(screen.queryByText("project.hr.employees")).not.toBeInTheDocument();
    });

    it("filters data by targetFQN", async () => {
      const listData = [
        createMockLineageData({ targetFQN: "project.warehouse.inventory" }, 1),
        createMockLineageData({ targetFQN: "project.finance.budgets" }, 2),
      ];

      render(<ListView listData={listData} />);

      const filterInput = screen.getByPlaceholderText("Enter property name or value");
      await userEvent.type(filterInput, "warehouse");

      expect(screen.getByText("project.warehouse.inventory")).toBeInTheDocument();
      expect(screen.queryByText("project.finance.budgets")).not.toBeInTheDocument();
    });

    it("is case insensitive", async () => {
      const listData = [
        createMockLineageData({ source: "UPPERCASE_TABLE" }, 1),
        createMockLineageData({ source: "lowercase_table" }, 2),
      ];

      render(<ListView listData={listData} />);

      const filterInput = screen.getByPlaceholderText("Enter property name or value");
      await userEvent.type(filterInput, "uppercase");

      expect(screen.getByText("UPPERCASE_TABLE")).toBeInTheDocument();
      expect(screen.queryByText("lowercase_table")).not.toBeInTheDocument();
    });

    it("clears filter text when clear button clicked", async () => {
      const listData = createMockListData(2);

      render(<ListView listData={listData} />);

      const filterInput = screen.getByPlaceholderText("Enter property name or value");
      await userEvent.type(filterInput, "source_table_1");

      // Only first item visible
      expect(screen.getByText("source_table_1")).toBeInTheDocument();
      expect(screen.queryByText("source_table_2")).not.toBeInTheDocument();

      // Find and click clear button (the close icon inside the text field)
      const clearButtons = screen.getAllByTestId("close-icon");
      const clearButton = clearButtons[0].closest("button");
      if (clearButton) {
        fireEvent.click(clearButton);
      }

      // Both items should be visible again
      expect(screen.getByText("source_table_1")).toBeInTheDocument();
      expect(screen.getByText("source_table_2")).toBeInTheDocument();
    });

    it("resets filter text when listData changes", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const listData1 = createMockListData(2);
      const listData2 = createMockListData(3);

      const { rerender } = render(<ListView listData={listData1} />);

      // Type something in filter
      const filterInput = screen.getByPlaceholderText("Enter property name or value");
      fireEvent.change(filterInput, { target: { value: "test" } });

      expect(filterInput).toHaveValue("test");

      // Rerender with new data
      rerender(<ListView listData={listData2} />);

      // Filter should be reset
      expect(filterInput).toHaveValue("");
      consoleSpy.mockRestore();
    });
  });

  // ==========================================================================
  // Sorting Tests
  // ==========================================================================

  describe("Sorting", () => {
    it("sorts by sourceSystem ascending on first click", async () => {
      const listData = [
        createMockLineageData({ sourceSystem: "Zebra" }, 1),
        createMockLineageData({ sourceSystem: "Alpha" }, 2),
        createMockLineageData({ sourceSystem: "Mango" }, 3),
      ];

      render(<ListView listData={listData} />);

      // Find the table header cell
      const table = screen.getByRole("table");
      const headerRow = within(table).getAllByRole("row")[0];
      const headerCells = within(headerRow).getAllByRole("columnheader");
      const sortButton = within(headerCells[0]).getByRole("button");
      fireEvent.click(sortButton);

      // Get all data rows
      const rows = within(table).getAllByRole("row").slice(1);
      const firstRowCells = within(rows[0]).getAllByRole("cell");
      expect(firstRowCells[0]).toHaveTextContent("Alpha");
    });

    it("sorts by sourceSystem descending on second click", async () => {
      const listData = [
        createMockLineageData({ sourceSystem: "Zebra" }, 1),
        createMockLineageData({ sourceSystem: "Alpha" }, 2),
        createMockLineageData({ sourceSystem: "Mango" }, 3),
      ];

      render(<ListView listData={listData} />);

      const table = screen.getByRole("table");
      const headerRow = within(table).getAllByRole("row")[0];
      const headerCells = within(headerRow).getAllByRole("columnheader");
      const sortButton = within(headerCells[0]).getByRole("button");

      // First click - ascending
      fireEvent.click(sortButton);
      // Second click - descending
      fireEvent.click(sortButton);

      const rows = within(table).getAllByRole("row").slice(1);
      const firstRowCells = within(rows[0]).getAllByRole("cell");
      expect(firstRowCells[0]).toHaveTextContent("Zebra");
    });

    it("removes sort on third click", async () => {
      const listData = [
        createMockLineageData({ sourceSystem: "Zebra" }, 1),
        createMockLineageData({ sourceSystem: "Alpha" }, 2),
        createMockLineageData({ sourceSystem: "Mango" }, 3),
      ];

      render(<ListView listData={listData} />);

      const table = screen.getByRole("table");
      const headerRow = within(table).getAllByRole("row")[0];
      const headerCells = within(headerRow).getAllByRole("columnheader");
      const sortButton = within(headerCells[0]).getByRole("button");

      // Three clicks to reset
      fireEvent.click(sortButton);
      fireEvent.click(sortButton);
      fireEvent.click(sortButton);

      // Should be back to original order
      const rows = within(table).getAllByRole("row").slice(1);
      const firstRowCells = within(rows[0]).getAllByRole("cell");
      expect(firstRowCells[0]).toHaveTextContent("Zebra");
    });

    it("changes sort column when different column clicked", async () => {
      const listData = [
        createMockLineageData({ sourceSystem: "Zebra", sourceProject: "Project1" }, 1),
        createMockLineageData({ sourceSystem: "Alpha", sourceProject: "Project3" }, 2),
        createMockLineageData({ sourceSystem: "Mango", sourceProject: "Project2" }, 3),
      ];

      render(<ListView listData={listData} />);

      const table = screen.getByRole("table");
      const headerRow = within(table).getAllByRole("row")[0];
      const headerCells = within(headerRow).getAllByRole("columnheader");

      // Sort by Source System first
      const sortButton1 = within(headerCells[0]).getByRole("button");
      fireEvent.click(sortButton1);

      // Then sort by Source Project
      const sortButton2 = within(headerCells[1]).getByRole("button");
      fireEvent.click(sortButton2);

      // Should be sorted by Source Project ascending
      const rows = within(table).getAllByRole("row").slice(1);
      const firstRowCells = within(rows[0]).getAllByRole("cell");
      expect(firstRowCells[1]).toHaveTextContent("Project1");
    });

    it("sorts by source column", async () => {
      const listData = [
        createMockLineageData({ source: "charlie_table" }, 1),
        createMockLineageData({ source: "alpha_table" }, 2),
        createMockLineageData({ source: "bravo_table" }, 3),
      ];

      render(<ListView listData={listData} />);

      const table = screen.getByRole("table");
      const headerRow = within(table).getAllByRole("row")[0];
      const headerCells = within(headerRow).getAllByRole("columnheader");
      const sortButton = within(headerCells[2]).getByRole("button");
      fireEvent.click(sortButton);

      const rows = within(table).getAllByRole("row").slice(1);
      expect(within(rows[0]).getByText("alpha_table")).toBeInTheDocument();
    });

    it("sorts by sourceFQN column", async () => {
      const listData = [
        createMockLineageData({ sourceFQN: "z.dataset.table" }, 1),
        createMockLineageData({ sourceFQN: "a.dataset.table" }, 2),
      ];

      render(<ListView listData={listData} />);

      const table = screen.getByRole("table");
      const headerRow = within(table).getAllByRole("row")[0];
      const headerCells = within(headerRow).getAllByRole("columnheader");
      const sortButton = within(headerCells[3]).getByRole("button");
      fireEvent.click(sortButton);

      const rows = within(table).getAllByRole("row").slice(1);
      const firstRowCells = within(rows[0]).getAllByRole("cell");
      expect(firstRowCells[3]).toHaveTextContent("a.dataset.table");
    });

    it("sorts by target column", async () => {
      const listData = [
        createMockLineageData({ target: "zulu_target" }, 1),
        createMockLineageData({ target: "alpha_target" }, 2),
      ];

      render(<ListView listData={listData} />);

      const table = screen.getByRole("table");
      const headerRow = within(table).getAllByRole("row")[0];
      const headerCells = within(headerRow).getAllByRole("columnheader");
      const sortButton = within(headerCells[4]).getByRole("button");
      fireEvent.click(sortButton);

      expect(screen.getByText("alpha_target")).toBeInTheDocument();
    });

    it("sorts by targetProject column", async () => {
      const listData = [
        createMockLineageData({ targetProject: "ZProject" }, 1),
        createMockLineageData({ targetProject: "AProject" }, 2),
      ];

      render(<ListView listData={listData} />);

      const table = screen.getByRole("table");
      const headerRow = within(table).getAllByRole("row")[0];
      const headerCells = within(headerRow).getAllByRole("columnheader");
      const sortButton = within(headerCells[5]).getByRole("button");
      fireEvent.click(sortButton);

      const rows = within(table).getAllByRole("row").slice(1);
      const firstRowCells = within(rows[0]).getAllByRole("cell");
      expect(firstRowCells[5]).toHaveTextContent("AProject");
    });

    it("sorts by targetSystem column", async () => {
      const listData = [
        createMockLineageData({ targetSystem: "ZSystem" }, 1),
        createMockLineageData({ targetSystem: "ASystem" }, 2),
      ];

      render(<ListView listData={listData} />);

      const table = screen.getByRole("table");
      const headerRow = within(table).getAllByRole("row")[0];
      const headerCells = within(headerRow).getAllByRole("columnheader");
      const sortButton = within(headerCells[6]).getByRole("button");
      fireEvent.click(sortButton);

      const rows = within(table).getAllByRole("row").slice(1);
      const firstRowCells = within(rows[0]).getAllByRole("cell");
      expect(firstRowCells[6]).toHaveTextContent("ASystem");
    });

    it("sorts by targetFQN column", async () => {
      const listData = [
        createMockLineageData({ targetFQN: "z.dataset.target" }, 1),
        createMockLineageData({ targetFQN: "a.dataset.target" }, 2),
      ];

      render(<ListView listData={listData} />);

      const table = screen.getByRole("table");
      const headerRow = within(table).getAllByRole("row")[0];
      const headerCells = within(headerRow).getAllByRole("columnheader");
      const sortButton = within(headerCells[7]).getByRole("button");
      fireEvent.click(sortButton);

      const rows = within(table).getAllByRole("row").slice(1);
      const firstRowCells = within(rows[0]).getAllByRole("cell");
      expect(firstRowCells[7]).toHaveTextContent("a.dataset.target");
    });
  });

  // ==========================================================================
  // Advanced Filter Tests
  // ==========================================================================

  describe("Advanced Filtering", () => {
    it("opens filter menu when filter icon clicked", async () => {
      const listData = createMockListData(2);
      render(<ListView listData={listData} />);

      const filterButton = screen.getByTestId("filter-list-icon").closest("button");
      fireEvent.click(filterButton!);

      await waitFor(() => {
        expect(screen.getByText("Select Property to Filter")).toBeInTheDocument();
      });
    });

    it("opens filter menu when Filter text clicked", async () => {
      const listData = createMockListData(2);
      render(<ListView listData={listData} />);

      const filterText = screen.getByText("Filter");
      fireEvent.click(filterText);

      await waitFor(() => {
        expect(screen.getByText("Select Property to Filter")).toBeInTheDocument();
      });
    });

    it("shows property names in filter menu", async () => {
      const listData = createMockListData(2);
      render(<ListView listData={listData} />);

      const filterButton = screen.getByTestId("filter-list-icon").closest("button");
      fireEvent.click(filterButton!);

      await waitFor(() => {
        // Should show formatted property names in menu items
        const menuItems = screen.getAllByRole("menuitem");
        const menuTexts = menuItems.map((item) => item.textContent);
        expect(menuTexts.some((t) => t?.includes("Source System"))).toBe(true);
        expect(menuTexts.some((t) => t?.includes("Source Project"))).toBe(true);
      });
    });

    it("excludes id property from filter options", async () => {
      const listData = createMockListData(1);
      render(<ListView listData={listData} />);

      const filterButton = screen.getByTestId("filter-list-icon").closest("button");
      fireEvent.click(filterButton!);

      await waitFor(() => {
        expect(screen.getByText("Select Property to Filter")).toBeInTheDocument();
      });

      // id should not be in the filter options
      const menuItems = screen.getAllByRole("menuitem");
      const hasId = menuItems.some((item) => item.textContent === "Id");
      expect(hasId).toBe(false);
    });

    it("returns empty options when no data", async () => {
      render(<ListView listData={[]} />);

      const filterButton = screen.getByTestId("filter-list-icon").closest("button");
      fireEvent.click(filterButton!);

      await waitFor(() => {
        expect(screen.getByText("Select Property to Filter")).toBeInTheDocument();
      });

      // Should only have the header menu item
      const menuItems = screen.getAllByRole("menuitem");
      expect(menuItems.length).toBe(1);
    });
  });

  // ==========================================================================
  // Navigation Tests
  // ==========================================================================

  describe("Navigation", () => {
    it("navigates to view-details when source link clicked", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const listData = [
        createMockLineageData({
          source: "orders_table",
          sourceFQN: "project.dataset.orders",
        }, 1),
      ];
      render(<ListView listData={listData} />);

      const sourceLink = screen.getByText("orders_table");
      fireEvent.click(sourceLink);

      expect(mockDispatch).toHaveBeenCalledWith({ type: "entry/pushToHistory" });
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "entry/setLineageToEntryCopy",
        payload: true,
      });
      expect(mockNavigate).toHaveBeenCalledWith("/view-details");
      consoleSpy.mockRestore();
    });

    it("navigates to view-details when target link clicked", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const listData = [
        createMockLineageData({
          target: "analytics_table",
          targetFQN: "project.dataset.analytics",
        }, 1),
      ];
      render(<ListView listData={listData} />);

      const targetLink = screen.getByText("analytics_table");
      fireEvent.click(targetLink);

      expect(mockDispatch).toHaveBeenCalledWith({ type: "entry/pushToHistory" });
      expect(mockNavigate).toHaveBeenCalledWith("/view-details");
      consoleSpy.mockRestore();
    });

    it("uses user token from auth context", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      mockUseAuth.mockReturnValue({
        user: { token: "custom-token-456" },
      });

      const listData = [
        createMockLineageData({ sourceFQN: "project.dataset.table" }, 1),
      ];
      render(<ListView listData={listData} />);

      const sourceLink = screen.getByText("source_table_1");
      fireEvent.click(sourceLink);

      // Verify the dispatch was called
      expect(mockDispatch).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("handles missing user token gracefully", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      mockUseAuth.mockReturnValue({
        user: null,
      });

      const listData = [
        createMockLineageData({ sourceFQN: "project.dataset.table" }, 1),
      ];
      render(<ListView listData={listData} />);

      const sourceLink = screen.getByText("source_table_1");
      fireEvent.click(sourceLink);

      // Should still navigate
      expect(mockNavigate).toHaveBeenCalledWith("/view-details");
      consoleSpy.mockRestore();
    });

    it("logs navigation message to console", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const listData = [
        createMockLineageData({ sourceFQN: "project.dataset.test_table" }, 1),
      ];
      render(<ListView listData={listData} />);

      const sourceLink = screen.getByText("source_table_1");
      fireEvent.click(sourceLink);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Navigating to Overview for FQN:",
        "project.dataset.test_table"
      );

      consoleSpy.mockRestore();
    });
  });

  // ==========================================================================
  // Combined Filter Tests
  // ==========================================================================

  describe("Combined Filtering", () => {
    it("combines tab filter with text filter", async () => {
      const listData = [
        createMockLineageData({ source: "current_table", target: "target_a" }, 1),
        createMockLineageData({ source: "current_table", target: "target_b" }, 2),
        createMockLineageData({ source: "other_table", target: "target_c" }, 3),
      ];
      const entry = createMockEntry("current_table");

      render(<ListView listData={listData} entry={entry} />);

      // Apply downstream filter
      const downstreamChip = screen.getByText("Downstream (2)");
      fireEvent.click(downstreamChip);

      // Apply text filter
      const filterInput = screen.getByPlaceholderText("Enter property name or value");
      await userEvent.type(filterInput, "target_a");

      // Only target_a should be visible
      expect(screen.getByText("target_a")).toBeInTheDocument();
      expect(screen.queryByText("target_b")).not.toBeInTheDocument();
      expect(screen.queryByText("target_c")).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe("Edge Cases", () => {
    it("handles entry without fullyQualifiedName", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const listData = createMockListData(2);
      const entry = { name: "test", fullyQualifiedName: "" };

      render(<ListView listData={listData} entry={entry} />);

      // Should render without crashing
      expect(screen.getByText("All (2)")).toBeInTheDocument();
      expect(screen.getByText("Upstream (0)")).toBeInTheDocument();
      expect(screen.getByText("Downstream (0)")).toBeInTheDocument();
      consoleSpy.mockRestore();
    });

    it("handles entry with complex fullyQualifiedName", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const listData = [
        createMockLineageData({ target: "complex_table" }, 1),
      ];
      const entry = {
        name: "complex_table",
        fullyQualifiedName: "project.dataset.nested.complex_table",
      };

      render(<ListView listData={listData} entry={entry} />);

      // Should correctly parse the last part of FQN
      expect(screen.getByText("Upstream (1)")).toBeInTheDocument();
      consoleSpy.mockRestore();
    });

    it("handles special characters in filter text", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const listData = [
        createMockLineageData({ source: "table@123" }, 1),
        createMockLineageData({ source: "normal_table" }, 2),
      ];

      render(<ListView listData={listData} />);

      const filterInput = screen.getByPlaceholderText("Enter property name or value");
      await userEvent.type(filterInput, "@123");

      expect(screen.getByText("table@123")).toBeInTheDocument();
      expect(screen.queryByText("normal_table")).not.toBeInTheDocument();
      consoleSpy.mockRestore();
    });

    it("handles rapid filter changes", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const listData = createMockListData(5);

      render(<ListView listData={listData} />);

      const filterInput = screen.getByPlaceholderText("Enter property name or value");

      // Type quickly
      await userEvent.type(filterInput, "123");

      // Should handle without errors
      expect(filterInput).toHaveValue("123");
      consoleSpy.mockRestore();
    });

    it("handles data with empty string values", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const listData = [
        {
          id: 1,
          sourceSystem: "BigQuery",
          sourceProject: "",
          source: "table1",
          sourceFQN: "fqn1",
          target: "target1",
          targetProject: "",
          targetSystem: "Snowflake",
          targetFQN: "fqn2",
        },
      ];

      render(<ListView listData={listData} />);

      expect(screen.getByText("table1")).toBeInTheDocument();
      consoleSpy.mockRestore();
    });

    it("maintains sort when filter applied", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const listData = [
        createMockLineageData({ sourceSystem: "Zebra", source: "z_table" }, 1),
        createMockLineageData({ sourceSystem: "Alpha", source: "a_table" }, 2),
        createMockLineageData({ sourceSystem: "Mango", source: "m_table" }, 3),
      ];

      render(<ListView listData={listData} />);

      // Sort by sourceSystem
      const table = screen.getByRole("table");
      const headerRow = within(table).getAllByRole("row")[0];
      const headerCells = within(headerRow).getAllByRole("columnheader");
      const sortButton = within(headerCells[0]).getByRole("button");
      fireEvent.click(sortButton);

      // Verify sorted
      let rows = within(table).getAllByRole("row").slice(1);
      expect(within(rows[0]).getByText("Alpha")).toBeInTheDocument();

      // Apply text filter
      const filterInput = screen.getByPlaceholderText("Enter property name or value");
      await userEvent.type(filterInput, "table");

      // Sort should still be applied
      rows = within(table).getAllByRole("row").slice(1);
      expect(within(rows[0]).getByText("Alpha")).toBeInTheDocument();
      consoleSpy.mockRestore();
    });
  });

  // ==========================================================================
  // Sort Icon Display Tests
  // ==========================================================================

  describe("Sort Icon Display", () => {
    it("shows upward arrow when sorted ascending", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const listData = createMockListData(2);
      render(<ListView listData={listData} />);

      const table = screen.getByRole("table");
      const headerRow = within(table).getAllByRole("row")[0];
      const headerCells = within(headerRow).getAllByRole("columnheader");
      const sortButton = within(headerCells[0]).getByRole("button");
      fireEvent.click(sortButton);

      // Should show upward arrow
      const upwardIcon = within(headerCells[0]).getByTestId("arrow-upward-icon");
      expect(upwardIcon).toBeInTheDocument();
      consoleSpy.mockRestore();
    });

    it("shows downward arrow when sorted descending", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const listData = createMockListData(2);
      render(<ListView listData={listData} />);

      const table = screen.getByRole("table");
      const headerRow = within(table).getAllByRole("row")[0];
      const headerCells = within(headerRow).getAllByRole("columnheader");
      const sortButton = within(headerCells[0]).getByRole("button");
      fireEvent.click(sortButton);
      fireEvent.click(sortButton);

      // Should show downward arrow
      const downwardIcon = within(headerCells[0]).getByTestId("arrow-downward-icon");
      expect(downwardIcon).toBeInTheDocument();
      consoleSpy.mockRestore();
    });
  });
});
