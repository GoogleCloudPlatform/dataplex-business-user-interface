import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AxiosError } from "axios";
import Lineage from "./index";

// Mock variables for dynamic control
let mockLineageSearchLinksStatus = "idle";
let mockLineageSearchLinks: any = { sourceLinks: [], targetLinks: [] };
let mockLineageEntryStatus = "idle";
let mockLineageEntry: any = null;

const mockDispatch = vi.fn();

// Mock NotificationContext
const mockShowSuccess = vi.fn();
const mockShowError = vi.fn();
vi.mock('../../contexts/NotificationContext', () => ({
  useNotification: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
    showWarning: vi.fn(),
    showInfo: vi.fn(),
    clearNotification: vi.fn(),
    clearAllNotifications: vi.fn(),
  })
}));

vi.mock('../../contexts/NoAccessContext', () => ({
  useNoAccess: () => ({
    isNoAccessOpen: false,
    noAccessMessage: null,
    triggerNoAccess: vi.fn(),
    dismissNoAccess: vi.fn(),
  }),
}));

// Mock react-redux
vi.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: (state: any) => any) => {
    const state = {
      lineage: {
        items: mockLineageSearchLinks,
        status: mockLineageSearchLinksStatus,
      },
      entry: {
        lineageEntryItems: mockLineageEntry,
        lineageEntrystatus: mockLineageEntryStatus,
        lineageEntryError: null,
      },
    };
    return selector(state);
  },
}));

// Mock useAuth
const mockUser = { token: "test-token-123" };
vi.mock("../../auth/AuthProvider.tsx", () => ({
  useAuth: () => ({ user: mockUser }),
}));

// Mock useFullScreenStatus
const mockToggleFullscreen = vi.fn();
const mockElementRef = { current: null };
let mockIsFullscreen = false;

vi.mock("../../hooks/useFullScreenStatus", () => ({
  default: () => ({
    elementRef: mockElementRef,
    isFullscreen: mockIsFullscreen,
    toggleFullscreen: mockToggleFullscreen,
  }),
}));

// Mock axios
const mockAxiosPost = vi.fn();

vi.mock("axios", () => {
  // Create AxiosError class inside the factory
  class AxiosErrorMock extends Error {
    response?: { data: unknown };
    isAxiosError = true;
    constructor(message: string) {
      super(message);
      this.name = "AxiosError";
    }
  }

  return {
    default: {
      post: (...args: unknown[]) => mockAxiosPost(...args),
      defaults: {
        headers: {
          common: {},
        },
      },
    },
    AxiosError: AxiosErrorMock,
  };
});

// Helper to create AxiosError instances for tests - uses the imported mocked class
const createAxiosError = (message: string, responseData?: unknown) => {
  const error = new AxiosError(message);
  if (responseData !== undefined) {
    (error as { response?: { data: unknown } }).response = { data: responseData };
  }
  return error;
};

// Mock URLS
vi.mock("../../constants/urls.ts", () => ({
  URLS: {
    API_URL: "https://api.test.com",
    GET_PROCESS_AND_JOB_DETAILS: "/process-details",
    LINEAGE_SEARCH: "/lineage-search",
    LINEAGE_SEARCH_COLUMN_LEVEL: "/lineage-search-column",
  },
}));

// Mock Redux actions
vi.mock("../../features/lineage/lineageSlice.ts", () => ({
  fetchLineageSearchLinks: vi.fn((payload) => ({
    type: "lineage/fetchLineageSearchLinks",
    payload,
  })),
}));

vi.mock("../../features/entry/entrySlice.ts", () => ({
  fetchLineageEntry: vi.fn((payload) => ({
    type: "entry/fetchLineageEntry",
    payload,
  })),
}));

// Mock child components
vi.mock("./SideDetailsPanel", () => ({
  default: ({ sidePanelData, sidePanelDataStatus, onClose, openSchemaInSidePanel }: any) => (
    <div
      data-testid="side-details-panel"
      data-status={sidePanelDataStatus}
      data-has-data={sidePanelData ? "true" : "false"}
      data-open-schema={String(openSchemaInSidePanel)}
    >
      SideDetailsPanel
      <button data-testid="close-side-panel" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

vi.mock("./QueryPanel", () => ({
  default: ({ queryPanelData, queryPanelDataStatus, onClose }: any) => (
    <div
      data-testid="query-panel"
      data-status={queryPanelDataStatus}
      data-has-data={queryPanelData ? "true" : "false"}
    >
      QueryPanel
      <button data-testid="close-query-panel" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

vi.mock("./ListView.tsx", () => ({
  default: ({ listData, entry }: any) => (
    <div
      data-testid="list-view"
      data-list-count={listData?.length || 0}
      data-entry-name={entry?.name}
    >
      ListView
    </div>
  ),
}));

vi.mock("./LineageChartViewNew.tsx", () => ({
  default: ({
    entry,
    graphData,
    handleSidePanelToggle,
    handleQueryPanelToggle,
    fetchLineageDownStream,
    fetchLineageUpStream,
    fetchColumnLevelLineage,
    resetLineageGraph,
    isSidePanelOpen,
    selectedNode,
    isFullScreen,
    isColumnLineageLoading,
    toggleFullScreen,
  }: any) => (
    <div
      data-testid="lineage-chart-view"
      data-graph-count={graphData?.length || 0}
      data-entry-fqn={entry?.fullyQualifiedName}
      data-side-panel-open={String(isSidePanelOpen)}
      data-selected-node={selectedNode || "none"}
      data-fullscreen={String(isFullScreen)}
      data-column-loading={String(isColumnLineageLoading)}
    >
      LineageChartViewNew
      <button
        data-testid="toggle-side-panel-root"
        onClick={() =>
          handleSidePanelToggle({
            id: "node-asset-test_table",
            isRoot: true,
            entryData: { fullyQualifiedName: entry?.fullyQualifiedName },
          })
        }
      >
        Toggle Side Panel (Root)
      </button>
      <button
        data-testid="toggle-side-panel-source"
        onClick={() =>
          handleSidePanelToggle(
            {
              id: "node-asset-source",
              isRoot: false,
              isSource: true,
              linkData: { target: { fullyQualifiedName: "bigquery:project.dataset.source_table" } },
            },
            true
          )
        }
      >
        Toggle Side Panel (Source)
      </button>
      <button
        data-testid="toggle-side-panel-target"
        onClick={() =>
          handleSidePanelToggle({
            id: "node-asset-target",
            isRoot: false,
            isSource: false,
            linkData: { source: { fullyQualifiedName: "bigquery:project.dataset.target_table" } },
          })
        }
      >
        Toggle Side Panel (Target)
      </button>
      <button
        data-testid="toggle-side-panel-null-fqn"
        onClick={() =>
          handleSidePanelToggle({
            id: "node-asset-null",
            isRoot: false,
            isSource: false,
            linkData: { source: null },
          })
        }
      >
        Toggle Side Panel (Null FQN)
      </button>
      <button
        data-testid="toggle-query-panel"
        onClick={() =>
          handleQueryPanelToggle({
            linkData: { process: "test-process" },
          })
        }
      >
        Toggle Query Panel
      </button>
      <button
        data-testid="fetch-downstream"
        onClick={() =>
          fetchLineageDownStream({
            id: "node-asset-test",
            fqn: "bigquery:project.dataset.test_table",
            level: 2,
            linkData: { name: "projects/test/locations/us/entryGroups/group/entries/entry" },
          })
        }
      >
        Fetch Downstream
      </button>
      <button
        data-testid="fetch-downstream-existing"
        onClick={() =>
          fetchLineageDownStream({
            id: "node-asset-upstream_table1",
            fqn: "bigquery:test-project.dataset.upstream_table",
            level: 0,
            linkData: { name: "projects/test/locations/us/entryGroups/group/entries/entry" },
          })
        }
      >
        Fetch Downstream Existing
      </button>
      <button
        data-testid="fetch-upstream"
        onClick={() =>
          fetchLineageUpStream({
            id: "node-asset-test",
            fqn: "bigquery:project.dataset.test_table",
            level: 2,
            linkData: { name: "projects/test/locations/us/entryGroups/group/entries/entry" },
          })
        }
      >
        Fetch Upstream
      </button>
      <button
        data-testid="fetch-upstream-existing"
        onClick={() =>
          fetchLineageUpStream({
            id: "node-asset-target_table2",
            fqn: "bigquery:test-project.dataset.target_table",
            level: 4,
            linkData: { name: "projects/test/locations/us/entryGroups/group/entries/entry" },
          })
        }
      >
        Fetch Upstream Existing
      </button>
      <button
        data-testid="fetch-column-lineage"
        onClick={() => fetchColumnLevelLineage("column1", "both")}
      >
        Fetch Column Lineage
      </button>
      <button
        data-testid="fetch-column-lineage-undefined"
        onClick={() => fetchColumnLevelLineage(undefined, "both")}
      >
        Fetch Column Lineage Undefined
      </button>
      <button
        data-testid="fetch-column-lineage-empty"
        onClick={() => fetchColumnLevelLineage("", "both")}
      >
        Fetch Column Lineage Empty
      </button>
      <button data-testid="reset-graph" onClick={resetLineageGraph}>
        Reset Graph
      </button>
      <button data-testid="toggle-fullscreen" onClick={toggleFullScreen}>
        Toggle Fullscreen
      </button>
    </div>
  ),
}));

// ============================================================================
// Mock Data Generators
// ============================================================================

const createMockEntry = (overrides: Record<string, any> = {}) => ({
  name: "projects/test-project/locations/us/entryGroups/group/entries/test-entry",
  fullyQualifiedName: "bigquery:test-project.dataset.test_table",
  entryType: "projects/1/locations/us/entryTypes/bigquery.table",
  entrySource: {
    displayName: "Test Table",
    system: "bigquery",
  },
  aspects: {
    "1.global.schema": {
      data: {
        fields: {
          fields: {
            listValue: {
              values: [
                { structValue: { fields: { name: { stringValue: "id" } } } },
                { structValue: { fields: { name: { stringValue: "name" } } } },
              ],
            },
          },
        },
      },
    },
  },
  ...overrides,
});

const createMockSourceLink = (overrides: Record<string, any> = {}) => ({
  name: "projects/test/locations/us/links/link1",
  source: {
    fullyQualifiedName: "bigquery:test-project.dataset.source_table",
  },
  target: {
    fullyQualifiedName: "bigquery:test-project.dataset.target_table",
  },
  process: "test-process",
  ...overrides,
});

const createMockTargetLink = (overrides: Record<string, any> = {}) => ({
  name: "projects/test/locations/us/links/link2",
  source: {
    fullyQualifiedName: "bigquery:test-project.dataset.upstream_table",
  },
  target: {
    fullyQualifiedName: "bigquery:test-project.dataset.test_table",
  },
  process: "test-process-2",
  ...overrides,
});

const createMockLineageSearchLinks = (overrides: Record<string, any> = {}) => ({
  sourceLinks: [createMockSourceLink()],
  targetLinks: [createMockTargetLink()],
  ...overrides,
});

// ============================================================================
// Test Suite
// ============================================================================

describe("Lineage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLineageSearchLinksStatus = "idle";
    mockLineageSearchLinks = { sourceLinks: [], targetLinks: [] };
    mockLineageEntryStatus = "idle";
    mockLineageEntry = null;
    mockIsFullscreen = false;
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
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      expect(screen.getByText("GRAPH")).toBeInTheDocument();
      expect(screen.getByText("LIST")).toBeInTheDocument();
    });

    it("dispatches fetchLineageSearchLinks on mount", () => {
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "lineage/fetchLineageSearchLinks",
        })
      );
    });

    it("renders loading spinner when lineage status is loading", () => {
      mockLineageSearchLinksStatus = "loading";
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });

    it("renders loading spinner when lineage status is idle", () => {
      mockLineageSearchLinksStatus = "idle";
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });

    it("renders graph view by default when data loaded", () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      expect(screen.getByTestId("lineage-chart-view")).toBeInTheDocument();
    });

    it("renders fullscreen toggle button", () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      expect(screen.getByTestId("OpenInFullIcon")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // View Mode Toggle Tests
  // ==========================================================================

  describe("View Mode Toggle", () => {
    it("switches to list view when LIST button is clicked", () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      const listButton = screen.getByText("LIST");
      fireEvent.click(listButton);

      expect(screen.getByTestId("list-view")).toBeInTheDocument();
      expect(screen.queryByTestId("lineage-chart-view")).not.toBeInTheDocument();
    });

    it("switches back to graph view when GRAPH button is clicked", () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      // Switch to list
      fireEvent.click(screen.getByText("LIST"));
      expect(screen.getByTestId("list-view")).toBeInTheDocument();

      // Switch back to graph
      fireEvent.click(screen.getByText("GRAPH"));
      expect(screen.getByTestId("lineage-chart-view")).toBeInTheDocument();
    });

    it("does not change view when same mode is clicked", () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      // Click graph (already selected)
      fireEvent.click(screen.getByText("GRAPH"));
      expect(screen.getByTestId("lineage-chart-view")).toBeInTheDocument();
    });

    it("passes correct data to ListView", () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByText("LIST"));

      const listView = screen.getByTestId("list-view");
      expect(listView).toHaveAttribute("data-entry-name", entry.name);
    });
  });

  // ==========================================================================
  // Side Panel Tests
  // ==========================================================================

  describe("Side Panel", () => {
    it("opens side panel when node is clicked", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("toggle-side-panel-root"));

      await waitFor(() => {
        expect(screen.getByTestId("side-details-panel")).toBeInTheDocument();
      });
    });

    it("closes side panel when close button is clicked", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      // Open side panel
      fireEvent.click(screen.getByTestId("toggle-side-panel-root"));

      await waitFor(() => {
        expect(screen.getByTestId("side-details-panel")).toBeInTheDocument();
      });

      // Close side panel
      fireEvent.click(screen.getByTestId("close-side-panel"));

      await waitFor(() => {
        expect(screen.queryByTestId("side-details-panel")).not.toBeInTheDocument();
      });
    });

    it("opens side panel with schema when showSchema is true", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("toggle-side-panel-source"));

      await waitFor(() => {
        const sidePanel = screen.getByTestId("side-details-panel");
        expect(sidePanel).toHaveAttribute("data-open-schema", "true");
      });
    });

    it("dispatches fetchLineageEntry for non-root nodes", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("toggle-side-panel-source"));

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "entry/fetchLineageEntry",
          })
        );
      });
    });

    it("uses entry data directly for root node", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("toggle-side-panel-root"));

      await waitFor(() => {
        const sidePanel = screen.getByTestId("side-details-panel");
        expect(sidePanel).toHaveAttribute("data-status", "succeeded");
      });
    });

    it("toggles side panel off when same node is clicked again", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      // Open side panel
      fireEvent.click(screen.getByTestId("toggle-side-panel-root"));
      await waitFor(() => {
        expect(screen.getByTestId("side-details-panel")).toBeInTheDocument();
      });

      // Click same node again - should close
      fireEvent.click(screen.getByTestId("toggle-side-panel-root"));
      await waitFor(() => {
        expect(screen.queryByTestId("side-details-panel")).not.toBeInTheDocument();
      });
    });

    it("closes query panel when side panel opens", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      mockAxiosPost.mockResolvedValueOnce({
        status: 200,
        data: { processData: "test" },
      });
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      // Open query panel first
      fireEvent.click(screen.getByTestId("toggle-query-panel"));
      await waitFor(() => {
        expect(screen.getByTestId("query-panel")).toBeInTheDocument();
      });

      // Open side panel - should close query panel
      fireEvent.click(screen.getByTestId("toggle-side-panel-root"));
      await waitFor(() => {
        expect(screen.queryByTestId("query-panel")).not.toBeInTheDocument();
      });
    });

    it("does not show side panel in list view", () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      // Open side panel in graph view
      fireEvent.click(screen.getByTestId("toggle-side-panel-root"));

      // Switch to list view
      fireEvent.click(screen.getByText("LIST"));

      expect(screen.queryByTestId("side-details-panel")).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Query Panel Tests
  // ==========================================================================

  describe("Query Panel", () => {
    it("opens query panel and makes API call", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      mockAxiosPost.mockResolvedValueOnce({
        status: 200,
        data: { processData: "test" },
      });
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("toggle-query-panel"));

      await waitFor(() => {
        expect(screen.getByTestId("query-panel")).toBeInTheDocument();
      });

      expect(mockAxiosPost).toHaveBeenCalledWith(
        "https://api.test.com/process-details",
        { process: "test-process" },
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token-123",
          }),
        })
      );
    });

    it("shows succeeded status when API call succeeds", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      mockAxiosPost.mockResolvedValueOnce({
        status: 200,
        data: { processData: "test" },
      });
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("toggle-query-panel"));

      await waitFor(() => {
        const queryPanel = screen.getByTestId("query-panel");
        expect(queryPanel).toHaveAttribute("data-status", "succeeded");
      });
    });

    it("shows failed status when API call fails", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      mockAxiosPost.mockRejectedValueOnce(new Error("API Error"));
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("toggle-query-panel"));

      await waitFor(() => {
        const queryPanel = screen.getByTestId("query-panel");
        expect(queryPanel).toHaveAttribute("data-status", "failed");
      });
    });

    it("shows failed status for non-2xx response", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      mockAxiosPost.mockResolvedValueOnce({
        status: 400,
        data: { error: "Bad request" },
      });
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("toggle-query-panel"));

      await waitFor(() => {
        const queryPanel = screen.getByTestId("query-panel");
        expect(queryPanel).toHaveAttribute("data-status", "failed");
      });
    });

    it("shows failed status for non-2xx response without error field", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      mockAxiosPost.mockResolvedValueOnce({
        status: 500,
        data: {}, // No error field - tests the || 'Failed to submit access request' branch
      });
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("toggle-query-panel"));

      await waitFor(() => {
        const queryPanel = screen.getByTestId("query-panel");
        expect(queryPanel).toHaveAttribute("data-status", "failed");
      });
    });

    it("handles query panel response with null data", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      mockAxiosPost.mockResolvedValueOnce({
        status: 200,
        data: null, // Null data - tests the data ?? null branch
      });
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("toggle-query-panel"));

      await waitFor(() => {
        const queryPanel = screen.getByTestId("query-panel");
        expect(queryPanel).toHaveAttribute("data-status", "succeeded");
        expect(queryPanel).toHaveAttribute("data-has-data", "false");
      });
    });

    it("handles query panel response with undefined data", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      mockAxiosPost.mockResolvedValueOnce({
        status: 205,
        data: undefined, // Undefined data - tests the data ?? null branch
      });
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("toggle-query-panel"));

      await waitFor(() => {
        const queryPanel = screen.getByTestId("query-panel");
        expect(queryPanel).toHaveAttribute("data-status", "succeeded");
      });
    });

    it("closes query panel when close button is clicked", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      mockAxiosPost.mockResolvedValueOnce({
        status: 200,
        data: { processData: "test" },
      });
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("toggle-query-panel"));

      await waitFor(() => {
        expect(screen.getByTestId("query-panel")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("close-query-panel"));

      await waitFor(() => {
        expect(screen.queryByTestId("query-panel")).not.toBeInTheDocument();
      });
    });

    it("closes side panel when query panel opens", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      mockAxiosPost.mockResolvedValueOnce({
        status: 200,
        data: { processData: "test" },
      });
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      // Open side panel first
      fireEvent.click(screen.getByTestId("toggle-side-panel-root"));
      await waitFor(() => {
        expect(screen.getByTestId("side-details-panel")).toBeInTheDocument();
      });

      // Open query panel - should close side panel
      fireEvent.click(screen.getByTestId("toggle-query-panel"));
      await waitFor(() => {
        expect(screen.queryByTestId("side-details-panel")).not.toBeInTheDocument();
      });
    });

    it("toggles query panel off when clicked while open", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      mockAxiosPost.mockResolvedValueOnce({
        status: 200,
        data: { processData: "test" },
      });
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      // Open query panel
      fireEvent.click(screen.getByTestId("toggle-query-panel"));
      await waitFor(() => {
        expect(screen.getByTestId("query-panel")).toBeInTheDocument();
      });

      // Click again to close
      fireEvent.click(screen.getByTestId("toggle-query-panel"));
      await waitFor(() => {
        expect(screen.queryByTestId("query-panel")).not.toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // Lineage Entry Status Tests
  // ==========================================================================

  describe("Lineage Entry Status", () => {
    it("sets loading status when lineageEntryStatus is loading", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      mockLineageEntryStatus = "loading";
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      // Open side panel for non-root node to trigger entry fetch
      fireEvent.click(screen.getByTestId("toggle-side-panel-source"));

      await waitFor(() => {
        const sidePanel = screen.getByTestId("side-details-panel");
        expect(sidePanel).toHaveAttribute("data-status", "loading");
      });
    });

    it("sets succeeded status when lineageEntryStatus is succeeded", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      mockLineageEntryStatus = "succeeded";
      mockLineageEntry = createMockEntry({ name: "fetched-entry" });
      const entry = createMockEntry();
      const { rerender } = render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("toggle-side-panel-source"));

      // Trigger rerender with updated status
      mockLineageEntryStatus = "succeeded";
      rerender(<Lineage entry={entry} />);

      await waitFor(() => {
        const sidePanel = screen.getByTestId("side-details-panel");
        expect(sidePanel).toHaveAttribute("data-status", "succeeded");
      });
    });

    it("sets failed status when lineageEntryStatus is failed", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      const entry = createMockEntry();
      const { rerender } = render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("toggle-side-panel-source"));

      // Trigger rerender with failed status
      mockLineageEntryStatus = "failed";
      rerender(<Lineage entry={entry} />);

      await waitFor(() => {
        const sidePanel = screen.getByTestId("side-details-panel");
        expect(sidePanel).toHaveAttribute("data-status", "failed");
      });
    });
  });

  // ==========================================================================
  // Downstream/Upstream Fetching Tests
  // ==========================================================================

  describe("Downstream/Upstream Fetching", () => {
    it("fetches downstream lineage data", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      mockAxiosPost.mockResolvedValueOnce({
        data: {
          targetLinks: [createMockTargetLink()],
        },
      });
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("fetch-downstream"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalledWith(
          "https://api.test.com/lineage-search",
          expect.objectContaining({
            parent: "projects/test/locations/us",
            fqn: "bigquery:project.dataset.test_table",
          })
        );
      });
    });

    it("fetches upstream lineage data", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      mockAxiosPost.mockResolvedValueOnce({
        data: {
          sourceLinks: [createMockSourceLink()],
        },
      });
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("fetch-upstream"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalledWith(
          "https://api.test.com/lineage-search",
          expect.objectContaining({
            parent: "projects/test/locations/us",
            fqn: "bigquery:project.dataset.test_table",
          })
        );
      });
    });

    it("handles empty downstream results", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      mockAxiosPost.mockResolvedValueOnce({
        data: {
          targetLinks: [],
        },
      });
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("fetch-downstream"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });
    });

    it("handles empty upstream results", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      mockAxiosPost.mockResolvedValueOnce({
        data: {
          sourceLinks: [],
        },
      });
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("fetch-upstream"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });
    });

    it("handles downstream fetch error", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      mockAxiosPost.mockRejectedValueOnce(new Error("Network error"));
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("fetch-downstream"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });
    });

    it("handles upstream fetch error", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      mockAxiosPost.mockRejectedValueOnce(new Error("Network error"));
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("fetch-upstream"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });
    });

    it("fetches downstream for existing node and updates graphData", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      mockAxiosPost.mockResolvedValueOnce({
        data: {
          targetLinks: [createMockTargetLink()],
        },
      });
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("fetch-downstream-existing"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });
    });

    it("fetches upstream for existing node and updates graphData", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      mockAxiosPost.mockResolvedValueOnce({
        data: {
          sourceLinks: [createMockSourceLink()],
        },
      });
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("fetch-upstream-existing"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });
    });

    it("handles empty downstream results for existing node", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      mockAxiosPost.mockResolvedValueOnce({
        data: {
          targetLinks: [],
        },
      });
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("fetch-downstream-existing"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });
    });

    it("handles empty upstream results for existing node", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      mockAxiosPost.mockResolvedValueOnce({
        data: {
          sourceLinks: [],
        },
      });
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("fetch-upstream-existing"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });
    });

    it("fetches upstream with empty user token", async () => {
      // Temporarily set empty token to test the empty auth header branch
      const originalToken = mockUser.token;
      mockUser.token = "";

      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      mockAxiosPost.mockResolvedValueOnce({
        data: {
          sourceLinks: [createMockSourceLink()],
        },
      });
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("fetch-upstream"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });

      // Restore token
      mockUser.token = originalToken;
    });

    it("fetches downstream with empty user token", async () => {
      // Temporarily set empty token to test the empty auth header branch
      const originalToken = mockUser.token;
      mockUser.token = "";

      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      mockAxiosPost.mockResolvedValueOnce({
        data: {
          targetLinks: [createMockTargetLink()],
        },
      });
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("fetch-downstream"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });

      // Restore token
      mockUser.token = originalToken;
    });
  });

  // ==========================================================================
  // Column Level Lineage Tests
  // ==========================================================================

  describe("Column Level Lineage", () => {
    it("fetches column level lineage", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      mockAxiosPost.mockResolvedValueOnce({
        data: {
          sourceLinks: [],
          targetLinks: [],
        },
      });
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("fetch-column-lineage"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalledWith(
          "https://api.test.com/lineage-search-column",
          expect.objectContaining({
            direction: "both",
          })
        );
      });
    });

    it("handles column lineage fetch error", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      mockAxiosPost.mockRejectedValueOnce(new Error("API Error"));
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("fetch-column-lineage"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });
    });

    it("processes column lineage with entry data in targetLinks", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      const mockSourceEntry = {
        entryType: "projects/1/locations/us/entryTypes/table",
        aspects: {
          "1.global.schema": {
            data: {
              fields: {
                fields: {
                  listValue: {
                    values: [
                      { structValue: { fields: { name: { stringValue: "column1" } } } },
                    ],
                  },
                },
              },
            },
          },
        },
      };
      mockAxiosPost.mockResolvedValueOnce({
        data: {
          sourceLinks: [],
          targetLinks: [
            {
              name: "projects/test/links/link1",
              source: { fullyQualifiedName: "bigquery:p.d.source" },
              target: { fullyQualifiedName: "bigquery:p.d.target" },
              sourceEntry: mockSourceEntry,
            },
          ],
        },
      });
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("fetch-column-lineage"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });
    });

    it("processes column lineage with entry data in sourceLinks", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      const mockTargetEntry = {
        entryType: "projects/1/locations/us/entryTypes/table",
        aspects: {
          "1.global.schema": {
            data: {
              fields: {
                fields: {
                  listValue: {
                    values: [
                      { structValue: { fields: { name: { stringValue: "column1" } } } },
                    ],
                  },
                },
              },
            },
          },
        },
      };
      mockAxiosPost.mockResolvedValueOnce({
        data: {
          sourceLinks: [
            {
              name: "projects/test/links/link1",
              source: { fullyQualifiedName: "bigquery:p.d.source" },
              target: { fullyQualifiedName: "bigquery:p.d.target" },
              targetEntry: mockTargetEntry,
            },
          ],
          targetLinks: [],
        },
      });
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("fetch-column-lineage"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });
    });

    it("filters column lineage by column name in targetLinks", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      const mockSourceEntry = {
        entryType: "projects/1/locations/us/entryTypes/table",
        aspects: {
          "1.global.schema": {
            data: {
              fields: {
                fields: {
                  listValue: {
                    values: [
                      { structValue: { fields: { name: { stringValue: "other_column" } } } },
                    ],
                  },
                },
              },
            },
          },
        },
      };
      mockAxiosPost.mockResolvedValueOnce({
        data: {
          sourceLinks: [],
          targetLinks: [
            {
              name: "projects/test/links/link1",
              source: { fullyQualifiedName: "bigquery:p.d.source" },
              target: { fullyQualifiedName: "bigquery:p.d.target" },
              sourceEntry: mockSourceEntry,
            },
          ],
        },
      });
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("fetch-column-lineage"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });
    });

    it("filters column lineage by column name in sourceLinks", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      const mockTargetEntry = {
        entryType: "projects/1/locations/us/entryTypes/table",
        aspects: {
          "1.global.schema": {
            data: {
              fields: {
                fields: {
                  listValue: {
                    values: [
                      { structValue: { fields: { name: { stringValue: "other_column" } } } },
                    ],
                  },
                },
              },
            },
          },
        },
      };
      mockAxiosPost.mockResolvedValueOnce({
        data: {
          sourceLinks: [
            {
              name: "projects/test/links/link1",
              source: { fullyQualifiedName: "bigquery:p.d.source" },
              target: { fullyQualifiedName: "bigquery:p.d.target" },
              targetEntry: mockTargetEntry,
            },
          ],
          targetLinks: [],
        },
      });
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("fetch-column-lineage"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });
    });

    it("handles AxiosError with response in column lineage fetch", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();

      const axiosError = createAxiosError("Request failed", "Column lineage error");
      mockAxiosPost.mockRejectedValueOnce(axiosError);
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("fetch-column-lineage"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });
    });

    it("handles AxiosError without response in column lineage fetch", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();

      const axiosError = createAxiosError("Request failed no response");
      mockAxiosPost.mockRejectedValueOnce(axiosError);
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("fetch-column-lineage"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });
    });

    it("handles targetLinks with children in column lineage", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      const mockSourceEntry = {
        entryType: "projects/1/locations/us/entryTypes/table",
        aspects: {
          "1.global.schema": {
            data: {
              fields: {
                fields: {
                  listValue: {
                    values: [
                      { structValue: { fields: { name: { stringValue: "column1" } } } },
                    ],
                  },
                },
              },
            },
          },
        },
      };
      mockAxiosPost.mockResolvedValueOnce({
        data: {
          sourceLinks: [],
          targetLinks: [
            {
              name: "projects/test/links/link1",
              source: { fullyQualifiedName: "bigquery:p.d.source" },
              target: { fullyQualifiedName: "bigquery:p.d.target" },
              sourceEntry: mockSourceEntry,
              children: [
                {
                  name: "projects/test/links/child1",
                  source: { fullyQualifiedName: "bigquery:p.d.child_source" },
                  target: { fullyQualifiedName: "bigquery:p.d.child_target" },
                  sourceEntry: mockSourceEntry,
                },
              ],
            },
          ],
        },
      });
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("fetch-column-lineage"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });
    });

    it("handles sourceLinks with children in column lineage", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      const mockTargetEntry = {
        entryType: "projects/1/locations/us/entryTypes/table",
        aspects: {
          "1.global.schema": {
            data: {
              fields: {
                fields: {
                  listValue: {
                    values: [
                      { structValue: { fields: { name: { stringValue: "column1" } } } },
                    ],
                  },
                },
              },
            },
          },
        },
      };
      mockAxiosPost.mockResolvedValueOnce({
        data: {
          sourceLinks: [
            {
              name: "projects/test/links/link1",
              source: { fullyQualifiedName: "bigquery:p.d.source" },
              target: { fullyQualifiedName: "bigquery:p.d.target" },
              targetEntry: mockTargetEntry,
              children: [
                {
                  name: "projects/test/links/child1",
                  source: { fullyQualifiedName: "bigquery:p.d.child_source" },
                  target: { fullyQualifiedName: "bigquery:p.d.child_target" },
                  targetEntry: mockTargetEntry,
                },
              ],
            },
          ],
          targetLinks: [],
        },
      });
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("fetch-column-lineage"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });
    });

    it("handles sourceLinks with null children in column lineage", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      const mockTargetEntry = {
        entryType: "projects/1/locations/us/entryTypes/table",
        aspects: {
          "1.global.schema": {
            data: {
              fields: {
                fields: {
                  listValue: {
                    values: [
                      { structValue: { fields: { name: { stringValue: "column1" } } } },
                    ],
                  },
                },
              },
            },
          },
        },
      };
      mockAxiosPost.mockResolvedValueOnce({
        data: {
          sourceLinks: [
            {
              name: "projects/test/links/link1",
              source: { fullyQualifiedName: "bigquery:p.d.source" },
              target: { fullyQualifiedName: "bigquery:p.d.target" },
              targetEntry: mockTargetEntry,
              children: [
                null,
                undefined,
                {
                  name: "projects/test/links/child1",
                  source: { fullyQualifiedName: "bigquery:p.d.child_source" },
                  target: { fullyQualifiedName: "bigquery:p.d.child_target" },
                  targetEntry: mockTargetEntry,
                },
              ],
            },
          ],
          targetLinks: [],
        },
      });
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("fetch-column-lineage"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });
    });

    it("filters column lineage where schema.find matches column name in targetLinks", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      const mockSourceEntry = {
        entryType: "projects/1/locations/us/entryTypes/table",
        aspects: {
          "1.global.schema": {
            data: {
              fields: {
                fields: {
                  listValue: {
                    values: [
                      { structValue: { fields: { name: { stringValue: "column1" } } } },
                      { structValue: { fields: { name: { stringValue: "other_col" } } } },
                    ],
                  },
                },
              },
            },
          },
        },
      };
      mockAxiosPost.mockResolvedValueOnce({
        data: {
          sourceLinks: [],
          targetLinks: [
            {
              name: "projects/test/links/link1",
              source: { fullyQualifiedName: "bigquery:p.d.source" },
              target: { fullyQualifiedName: "bigquery:p.d.target" },
              sourceEntry: mockSourceEntry,
            },
          ],
        },
      });
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      // column1 matches schema, so it should be included
      fireEvent.click(screen.getByTestId("fetch-column-lineage"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });
    });

    it("filters column lineage where schema.find matches column name in sourceLinks", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      const mockTargetEntry = {
        entryType: "projects/1/locations/us/entryTypes/table",
        aspects: {
          "1.global.schema": {
            data: {
              fields: {
                fields: {
                  listValue: {
                    values: [
                      { structValue: { fields: { name: { stringValue: "column1" } } } },
                      { structValue: { fields: { name: { stringValue: "other_col" } } } },
                    ],
                  },
                },
              },
            },
          },
        },
      };
      mockAxiosPost.mockResolvedValueOnce({
        data: {
          sourceLinks: [
            {
              name: "projects/test/links/link1",
              source: { fullyQualifiedName: "bigquery:p.d.source" },
              target: { fullyQualifiedName: "bigquery:p.d.target" },
              targetEntry: mockTargetEntry,
            },
          ],
          targetLinks: [],
        },
      });
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      // column1 matches schema, so it should be included
      fireEvent.click(screen.getByTestId("fetch-column-lineage"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });
    });

    it("handles column lineage fetch with empty user token", async () => {
      // Temporarily set empty token
      const originalToken = mockUser.token;
      mockUser.token = "";

      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      mockAxiosPost.mockResolvedValueOnce({
        data: {
          sourceLinks: [],
          targetLinks: [],
        },
      });
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("fetch-column-lineage"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });

      // Restore token
      mockUser.token = originalToken;
    });
  });

  // ==========================================================================
  // Reset Graph Tests
  // ==========================================================================

  describe("Reset Graph", () => {
    it("resets graph to initial state", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("reset-graph"));

      // Graph should still be rendered
      expect(screen.getByTestId("lineage-chart-view")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Fullscreen Tests
  // ==========================================================================

  describe("Fullscreen", () => {
    it("calls toggleFullscreen when fullscreen button clicked", () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      const fullscreenIcon = screen.getByTestId("OpenInFullIcon");
      fireEvent.click(fullscreenIcon);

      expect(mockToggleFullscreen).toHaveBeenCalled();
    });

    it("passes isFullScreen to LineageChartViewNew", () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      mockIsFullscreen = true;
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      const chartView = screen.getByTestId("lineage-chart-view");
      expect(chartView).toHaveAttribute("data-fullscreen", "true");
    });

    it("calls toggleFullscreen from chart view", () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("toggle-fullscreen"));

      expect(mockToggleFullscreen).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Lineage Data Processing Tests
  // ==========================================================================

  describe("Lineage Data Processing", () => {
    it("processes lineage data correctly on succeeded status", () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      const chartView = screen.getByTestId("lineage-chart-view");
      // Graph should have data (5 nodes: 2 from targetLinks + 1 root + 2 from sourceLinks)
      expect(parseInt(chartView.getAttribute("data-graph-count") || "0")).toBeGreaterThan(0);
    });

    it("creates default list item when no links exist", () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = { sourceLinks: [], targetLinks: [] };
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByText("LIST"));

      const listView = screen.getByTestId("list-view");
      expect(listView).toHaveAttribute("data-list-count", "1");
    });

    it("creates list items from links", () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByText("LIST"));

      const listView = screen.getByTestId("list-view");
      expect(parseInt(listView.getAttribute("data-list-count") || "0")).toBeGreaterThan(0);
    });

    it("sets empty data when status is loading", () => {
      mockLineageSearchLinksStatus = "loading";
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      // Should show loading spinner
      expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Edge Cases Tests
  // ==========================================================================

  describe("Edge Cases", () => {
    it("handles entry with no user token", () => {
      // Temporarily override the mock
      vi.mocked(mockUser).token = "";
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      expect(mockDispatch).toHaveBeenCalled();
      // Restore
      vi.mocked(mockUser).token = "test-token-123";
    });

    it("handles node with no fqn", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      // The component should handle nodes without fqn gracefully
      expect(screen.getByTestId("lineage-chart-view")).toBeInTheDocument();
    });

    it("handles AxiosError with response data in downstream fetch", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();

      const axiosError = createAxiosError("Request failed", "Error details");
      mockAxiosPost.mockRejectedValueOnce(axiosError);
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("fetch-downstream"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });
    });

    it("handles AxiosError without response data in downstream fetch", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();

      const axiosError = createAxiosError("Request failed without response");
      mockAxiosPost.mockRejectedValueOnce(axiosError);
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("fetch-downstream"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });
    });

    it("handles AxiosError with response data in upstream fetch", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();

      const axiosError = createAxiosError("Request failed", "Upstream error");
      mockAxiosPost.mockRejectedValueOnce(axiosError);
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("fetch-upstream"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });
    });

    it("handles AxiosError without response data in upstream fetch", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();

      const axiosError = createAxiosError("Request failed without response");
      mockAxiosPost.mockRejectedValueOnce(axiosError);
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("fetch-upstream"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });
    });

    it("handles side panel toggle with null fqn", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      // Click button that passes null fqn - side panel opens but no data fetch occurs
      fireEvent.click(screen.getByTestId("toggle-side-panel-null-fqn"));

      // Side panel is shown but without data (dispatch not called for null fqn)
      const sidePanel = screen.getByTestId("side-details-panel");
      expect(sidePanel).toBeInTheDocument();
      expect(sidePanel).toHaveAttribute("data-has-data", "false");
    });

    it("handles downstream fetch with same fqn as node", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      mockAxiosPost.mockResolvedValueOnce({
        data: {
          targetLinks: [
            {
              source: { fullyQualifiedName: "bigquery:project.dataset.test_table" },
              target: { fullyQualifiedName: "bigquery:project.dataset.other" },
            },
          ],
        },
      });
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("fetch-downstream"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });
    });

    it("handles upstream fetch with same fqn as node", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      mockAxiosPost.mockResolvedValueOnce({
        data: {
          sourceLinks: [
            {
              source: { fullyQualifiedName: "bigquery:project.dataset.other" },
              target: { fullyQualifiedName: "bigquery:project.dataset.test_table" },
            },
          ],
        },
      });
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("fetch-upstream"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });
    });

    it("handles column lineage with undefined column name for targetLinks", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      const mockSourceEntry = {
        entryType: "projects/1/locations/us/entryTypes/table",
        aspects: {
          "1.global.schema": {
            data: {
              fields: {
                fields: {
                  listValue: {
                    values: [
                      { structValue: { fields: { name: { stringValue: "any_col" } } } },
                    ],
                  },
                },
              },
            },
          },
        },
      };
      mockAxiosPost.mockResolvedValueOnce({
        data: {
          sourceLinks: [],
          targetLinks: [
            {
              name: "projects/test/links/link1",
              source: { fullyQualifiedName: "bigquery:p.d.source" },
              target: { fullyQualifiedName: "bigquery:p.d.target" },
              sourceEntry: mockSourceEntry,
            },
          ],
        },
      });
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("fetch-column-lineage-undefined"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });
    });

    it("handles column lineage with undefined column name for sourceLinks", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      const mockTargetEntry = {
        entryType: "projects/1/locations/us/entryTypes/table",
        aspects: {
          "1.global.schema": {
            data: {
              fields: {
                fields: {
                  listValue: {
                    values: [
                      { structValue: { fields: { name: { stringValue: "any_col" } } } },
                    ],
                  },
                },
              },
            },
          },
        },
      };
      mockAxiosPost.mockResolvedValueOnce({
        data: {
          sourceLinks: [
            {
              name: "projects/test/links/link1",
              source: { fullyQualifiedName: "bigquery:p.d.source" },
              target: { fullyQualifiedName: "bigquery:p.d.target" },
              targetEntry: mockTargetEntry,
            },
          ],
          targetLinks: [],
        },
      });
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("fetch-column-lineage-undefined"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });
    });

    it("handles column lineage with empty column name for targetLinks", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      const mockSourceEntry = {
        entryType: "projects/1/locations/us/entryTypes/table",
        aspects: {
          "1.global.schema": {
            data: {
              fields: {
                fields: {
                  listValue: {
                    values: [
                      { structValue: { fields: { name: { stringValue: "any_col" } } } },
                    ],
                  },
                },
              },
            },
          },
        },
      };
      mockAxiosPost.mockResolvedValueOnce({
        data: {
          sourceLinks: [],
          targetLinks: [
            {
              name: "projects/test/links/link1",
              source: { fullyQualifiedName: "bigquery:p.d.source" },
              target: { fullyQualifiedName: "bigquery:p.d.target" },
              sourceEntry: mockSourceEntry,
            },
          ],
        },
      });
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("fetch-column-lineage-empty"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });
    });

    it("handles column lineage with empty column name for sourceLinks", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      const mockTargetEntry = {
        entryType: "projects/1/locations/us/entryTypes/table",
        aspects: {
          "1.global.schema": {
            data: {
              fields: {
                fields: {
                  listValue: {
                    values: [
                      { structValue: { fields: { name: { stringValue: "any_col" } } } },
                    ],
                  },
                },
              },
            },
          },
        },
      };
      mockAxiosPost.mockResolvedValueOnce({
        data: {
          sourceLinks: [
            {
              name: "projects/test/links/link1",
              source: { fullyQualifiedName: "bigquery:p.d.source" },
              target: { fullyQualifiedName: "bigquery:p.d.target" },
              targetEntry: mockTargetEntry,
            },
          ],
          targetLinks: [],
        },
      });
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("fetch-column-lineage-empty"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });
    });

    it("handles column lineage with undefined column for both source and target links", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      const mockEntryData = {
        entryType: "projects/1/locations/us/entryTypes/table",
        aspects: {
          "1.global.schema": {
            data: {
              fields: {
                fields: {
                  listValue: {
                    values: [
                      { structValue: { fields: { name: { stringValue: "different_col" } } } },
                    ],
                  },
                },
              },
            },
          },
        },
      };
      mockAxiosPost.mockResolvedValueOnce({
        data: {
          sourceLinks: [
            {
              name: "projects/test/links/link1",
              source: { fullyQualifiedName: "bigquery:p.d.source" },
              target: { fullyQualifiedName: "bigquery:p.d.target" },
              targetEntry: mockEntryData,
            },
          ],
          targetLinks: [
            {
              name: "projects/test/links/link2",
              source: { fullyQualifiedName: "bigquery:p.d.source2" },
              target: { fullyQualifiedName: "bigquery:p.d.target2" },
              sourceEntry: mockEntryData,
            },
          ],
        },
      });
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      // undefined columnName triggers the columnName === undefined branch
      fireEvent.click(screen.getByTestId("fetch-column-lineage-undefined"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });
    });

    it("handles column lineage with empty string column for both source and target links", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      const mockEntryData = {
        entryType: "projects/1/locations/us/entryTypes/table",
        aspects: {
          "1.global.schema": {
            data: {
              fields: {
                fields: {
                  listValue: {
                    values: [
                      { structValue: { fields: { name: { stringValue: "different_col" } } } },
                    ],
                  },
                },
              },
            },
          },
        },
      };
      mockAxiosPost.mockResolvedValueOnce({
        data: {
          sourceLinks: [
            {
              name: "projects/test/links/link1",
              source: { fullyQualifiedName: "bigquery:p.d.source" },
              target: { fullyQualifiedName: "bigquery:p.d.target" },
              targetEntry: mockEntryData,
            },
          ],
          targetLinks: [
            {
              name: "projects/test/links/link2",
              source: { fullyQualifiedName: "bigquery:p.d.source2" },
              target: { fullyQualifiedName: "bigquery:p.d.target2" },
              sourceEntry: mockEntryData,
            },
          ],
        },
      });
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      // empty string columnName triggers the columnName === "" branch
      fireEvent.click(screen.getByTestId("fetch-column-lineage-empty"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });
    });

    it("handles links without entryData in column lineage", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      mockAxiosPost.mockResolvedValueOnce({
        data: {
          sourceLinks: [
            {
              name: "projects/test/links/link1",
              source: { fullyQualifiedName: "bigquery:p.d.source" },
              target: { fullyQualifiedName: "bigquery:p.d.target" },
              // No targetEntry
            },
          ],
          targetLinks: [
            {
              name: "projects/test/links/link2",
              source: { fullyQualifiedName: "bigquery:p.d.source2" },
              target: { fullyQualifiedName: "bigquery:p.d.target2" },
              // No sourceEntry
            },
          ],
        },
      });
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      fireEvent.click(screen.getByTestId("fetch-column-lineage"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });
    });
  });

  // ==========================================================================
  // Integration Tests
  // ==========================================================================

  describe("Integration Tests", () => {
    it("complete workflow: load, view graph, open side panel, switch to list", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      // Graph view is shown
      expect(screen.getByTestId("lineage-chart-view")).toBeInTheDocument();

      // Open side panel
      fireEvent.click(screen.getByTestId("toggle-side-panel-root"));
      await waitFor(() => {
        expect(screen.getByTestId("side-details-panel")).toBeInTheDocument();
      });

      // Switch to list view
      fireEvent.click(screen.getByText("LIST"));
      expect(screen.getByTestId("list-view")).toBeInTheDocument();
      expect(screen.queryByTestId("side-details-panel")).not.toBeInTheDocument();
    });

    it("handles multiple rapid panel toggles", async () => {
      mockLineageSearchLinksStatus = "succeeded";
      mockLineageSearchLinks = createMockLineageSearchLinks();
      mockAxiosPost.mockResolvedValue({
        status: 200,
        data: { processData: "test" },
      });
      const entry = createMockEntry();
      render(<Lineage entry={entry} />);

      // Rapid toggles
      fireEvent.click(screen.getByTestId("toggle-side-panel-root"));
      fireEvent.click(screen.getByTestId("toggle-query-panel"));
      fireEvent.click(screen.getByTestId("toggle-side-panel-source"));

      // Should still be functional
      await waitFor(() => {
        expect(screen.getByTestId("lineage-chart-view")).toBeInTheDocument();
      });
    });
  });
});
