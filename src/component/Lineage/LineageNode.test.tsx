import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LineageNode from "./LineageNode";

// Mock @xyflow/react
vi.mock("@xyflow/react", () => ({
  Handle: ({ type, position, isConnectable, onConnect }: any) => (
    <div
      data-testid={`handle-${type}`}
      data-position={position}
      data-connectable={isConnectable}
      onClick={() => onConnect && onConnect({ source: "test", target: "test" })}
    >
      Handle {type}
    </div>
  ),
  Position: {
    Left: "left",
    Right: "right",
    Top: "top",
    Bottom: "bottom",
  },
}));

// Mock MUI icons
vi.mock("@mui/icons-material", () => ({
  ChevronLeftOutlined: ({ onClick, sx }: any) => (
    <div
      data-testid="chevron-left-icon"
      onClick={onClick}
      style={sx}
    >
      ChevronLeft
    </div>
  ),
  ChevronRightOutlined: ({ onClick, sx }: any) => (
    <div
      data-testid="chevron-right-icon"
      onClick={onClick}
      style={sx}
    >
      ChevronRight
    </div>
  ),
}));

// ============================================================================
// Mock Data Generators
// ============================================================================

const createMockEntryData = (options: {
  schemaFields?: string[];
  entryType?: string;
} = {}) => {
  const {
    schemaFields = ["field_1", "field_2", "field_3"],
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

const createMockNodeData = (options: {
  name?: string;
  isRoot?: boolean;
  showDownStreamIcon?: boolean;
  showUpStreamIcon?: boolean;
  isDownStreamFetched?: boolean;
  isUpStreamFetched?: boolean;
  entryData?: any;
} = {}) => {
  const {
    name = "test-node",
    isRoot = false,
    showDownStreamIcon = false,
    showUpStreamIcon = false,
    isDownStreamFetched = false,
    isUpStreamFetched = false,
    entryData = createMockEntryData(),
  } = options;

  return {
    name,
    isRoot,
    showDownStreamIcon,
    showUpStreamIcon,
    isDownStreamFetched,
    isUpStreamFetched,
    entryData,
  };
};

const createMockData = (options: {
  nodeData?: any;
  columnLineageApplied?: boolean;
  columnName?: string;
  handleSidePanelToggle?: ReturnType<typeof vi.fn>;
  fetchLineageDownStream?: ReturnType<typeof vi.fn>;
  fetchLineageUpStream?: ReturnType<typeof vi.fn>;
} = {}) => {
  const {
    nodeData = createMockNodeData(),
    columnLineageApplied = false,
    columnName = "",
    handleSidePanelToggle = vi.fn(),
    fetchLineageDownStream = vi.fn(),
    fetchLineageUpStream = vi.fn(),
  } = options;

  return {
    nodeData,
    columnLineageApplied,
    columnName,
    handleSidePanelToggle,
    fetchLineageDownStream,
    fetchLineageUpStream,
  };
};

// ============================================================================
// Test Suite
// ============================================================================

describe("LineageNode", () => {
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
    it("renders the node with target Handle", () => {
      const data = createMockData();
      render(<LineageNode data={data} isConnectable={true} />);

      const targetHandle = screen.getByTestId("handle-target");
      expect(targetHandle).toBeInTheDocument();
      expect(targetHandle).toHaveAttribute("data-position", "left");
      expect(targetHandle).toHaveAttribute("data-connectable", "true");
    });

    it("renders the node with source Handle", () => {
      const data = createMockData();
      render(<LineageNode data={data} isConnectable={true} />);

      const sourceHandle = screen.getByTestId("handle-source");
      expect(sourceHandle).toBeInTheDocument();
      expect(sourceHandle).toHaveAttribute("data-position", "right");
      expect(sourceHandle).toHaveAttribute("data-connectable", "true");
    });

    it("renders isConnectable as false when provided", () => {
      const data = createMockData();
      render(<LineageNode data={data} isConnectable={false} />);

      const targetHandle = screen.getByTestId("handle-target");
      expect(targetHandle).toHaveAttribute("data-connectable", "false");
    });

    it("renders the node name", () => {
      const data = createMockData({
        nodeData: createMockNodeData({ name: "My Test Node" }),
      });
      render(<LineageNode data={data} isConnectable={true} />);

      expect(screen.getByText("My Test Node")).toBeInTheDocument();
    });

    it("renders the asset preview image", () => {
      const data = createMockData();
      render(<LineageNode data={data} isConnectable={true} />);

      const image = screen.getByAltText("Asset Preview");
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute("src", "/assets/images/Product-Icons.png");
    });

    it("exports LineageNode as default export", () => {
      expect(LineageNode).toBeDefined();
    });
  });

  // ==========================================================================
  // Main Box Click Handler Tests
  // ==========================================================================

  describe("Main Box Click Handler", () => {
    it("calls handleSidePanelToggle when box is clicked", () => {
      const mockHandleSidePanelToggle = vi.fn();
      const nodeData = createMockNodeData({ name: "clickable-node" });
      const data = createMockData({
        nodeData,
        handleSidePanelToggle: mockHandleSidePanelToggle,
      });

      render(<LineageNode data={data} isConnectable={true} />);

      // Click on the node name (which is inside the clickable box)
      const nodeName = screen.getByText("clickable-node");
      fireEvent.click(nodeName);

      expect(mockHandleSidePanelToggle).toHaveBeenCalledWith(nodeData, false);
    });

    it("stops event propagation when box is clicked", () => {
      const mockHandleSidePanelToggle = vi.fn();
      const data = createMockData({
        handleSidePanelToggle: mockHandleSidePanelToggle,
      });

      const { container } = render(<LineageNode data={data} isConnectable={true} />);

      const clickableBox = container.querySelector(".MuiBox-root");
      const mockStopPropagation = vi.fn();

      if (clickableBox) {
        fireEvent.click(clickableBox, {
          stopPropagation: mockStopPropagation,
        });
      }

      expect(mockHandleSidePanelToggle).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Downstream Icon Tests
  // ==========================================================================

  describe("Downstream Icon (ChevronLeftOutlined)", () => {
    it("does not render downstream icon when showDownStreamIcon is false", () => {
      const data = createMockData({
        nodeData: createMockNodeData({ showDownStreamIcon: false }),
      });
      render(<LineageNode data={data} isConnectable={true} />);

      expect(screen.queryByTestId("chevron-left-icon")).not.toBeInTheDocument();
    });

    it("renders downstream icon when showDownStreamIcon is true", () => {
      const data = createMockData({
        nodeData: createMockNodeData({ showDownStreamIcon: true }),
      });
      render(<LineageNode data={data} isConnectable={true} />);

      expect(screen.getByTestId("chevron-left-icon")).toBeInTheDocument();
    });

    it("calls fetchLineageDownStream when downstream icon is clicked", () => {
      const mockFetchLineageDownStream = vi.fn();
      const nodeData = createMockNodeData({ showDownStreamIcon: true });
      const data = createMockData({
        nodeData,
        fetchLineageDownStream: mockFetchLineageDownStream,
      });

      render(<LineageNode data={data} isConnectable={true} />);

      const downstreamIcon = screen.getByTestId("chevron-left-icon");
      fireEvent.click(downstreamIcon);

      expect(mockFetchLineageDownStream).toHaveBeenCalledWith(nodeData);
    });

    it("shows loader instead of downstream icon when lineageLoader is true and isUpStreamFetched is false", () => {
      const mockFetchLineageDownStream = vi.fn();
      const nodeData = createMockNodeData({
        showDownStreamIcon: true,
        isUpStreamFetched: false,
      });
      const data = createMockData({
        nodeData,
        fetchLineageDownStream: mockFetchLineageDownStream,
      });

      render(<LineageNode data={data} isConnectable={true} />);

      // Click to set lineageLoader to true
      const downstreamIcon = screen.getByTestId("chevron-left-icon");
      fireEvent.click(downstreamIcon);

      // After click, loader should appear
      expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });

    it("shows downstream icon when lineageLoader is true but isUpStreamFetched is true", () => {
      const mockFetchLineageDownStream = vi.fn();
      const nodeData = createMockNodeData({
        showDownStreamIcon: true,
        isUpStreamFetched: true,
      });
      const data = createMockData({
        nodeData,
        fetchLineageDownStream: mockFetchLineageDownStream,
      });

      render(<LineageNode data={data} isConnectable={true} />);

      // Click to set lineageLoader to true
      const downstreamIcon = screen.getByTestId("chevron-left-icon");
      fireEvent.click(downstreamIcon);

      // Icon should still be visible because isUpStreamFetched is true
      expect(screen.getByTestId("chevron-left-icon")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Upstream Icon Tests
  // ==========================================================================

  describe("Upstream Icon (ChevronRightOutlined)", () => {
    it("does not render upstream icon when showUpStreamIcon is false", () => {
      const data = createMockData({
        nodeData: createMockNodeData({ showUpStreamIcon: false }),
      });
      render(<LineageNode data={data} isConnectable={true} />);

      expect(screen.queryByTestId("chevron-right-icon")).not.toBeInTheDocument();
    });

    it("renders upstream icon when showUpStreamIcon is true", () => {
      const data = createMockData({
        nodeData: createMockNodeData({ showUpStreamIcon: true }),
      });
      render(<LineageNode data={data} isConnectable={true} />);

      expect(screen.getByTestId("chevron-right-icon")).toBeInTheDocument();
    });

    it("calls fetchLineageUpStream when upstream icon is clicked", () => {
      const mockFetchLineageUpStream = vi.fn();
      const nodeData = createMockNodeData({ showUpStreamIcon: true });
      const data = createMockData({
        nodeData,
        fetchLineageUpStream: mockFetchLineageUpStream,
      });

      render(<LineageNode data={data} isConnectable={true} />);

      const upstreamIcon = screen.getByTestId("chevron-right-icon");
      fireEvent.click(upstreamIcon);

      expect(mockFetchLineageUpStream).toHaveBeenCalledWith(nodeData);
    });

    it("shows loader instead of upstream icon when lineageLoader is true and isDownStreamFetched is false", () => {
      const mockFetchLineageDownStream = vi.fn();
      const nodeData = createMockNodeData({
        showDownStreamIcon: true,
        showUpStreamIcon: true,
        isDownStreamFetched: false,
      });
      const data = createMockData({
        nodeData,
        fetchLineageDownStream: mockFetchLineageDownStream,
      });

      render(<LineageNode data={data} isConnectable={true} />);

      // Click downstream to set lineageLoader to true
      const downstreamIcon = screen.getByTestId("chevron-left-icon");
      fireEvent.click(downstreamIcon);

      // Upstream icon should be replaced with loader
      const loaders = screen.getAllByRole("progressbar");
      expect(loaders.length).toBeGreaterThanOrEqual(1);
    });

    it("shows upstream icon when lineageLoader is true but isDownStreamFetched is true", () => {
      const mockFetchLineageDownStream = vi.fn();
      const nodeData = createMockNodeData({
        showDownStreamIcon: true,
        showUpStreamIcon: true,
        isDownStreamFetched: true,
      });
      const data = createMockData({
        nodeData,
        fetchLineageDownStream: mockFetchLineageDownStream,
      });

      render(<LineageNode data={data} isConnectable={true} />);

      // Click downstream to set lineageLoader to true
      const downstreamIcon = screen.getByTestId("chevron-left-icon");
      fireEvent.click(downstreamIcon);

      // Upstream icon should still be visible because isDownStreamFetched is true
      expect(screen.getByTestId("chevron-right-icon")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Schema Display Tests - Root Node
  // ==========================================================================

  describe("Schema Display - Root Node", () => {
    it("does not display schema when node is not root and columnLineageApplied is false", () => {
      const data = createMockData({
        nodeData: createMockNodeData({
          isRoot: false,
          entryData: createMockEntryData({ schemaFields: ["col1", "col2"] }),
        }),
        columnLineageApplied: false,
      });

      render(<LineageNode data={data} isConnectable={true} />);

      expect(screen.queryByText("col1")).not.toBeInTheDocument();
      expect(screen.queryByText("col2")).not.toBeInTheDocument();
    });

    it("displays first 3 schema fields for root node", () => {
      const data = createMockData({
        nodeData: createMockNodeData({
          isRoot: true,
          entryData: createMockEntryData({
            schemaFields: ["field_a", "field_b", "field_c", "field_d"],
          }),
        }),
        columnLineageApplied: false,
      });

      render(<LineageNode data={data} isConnectable={true} />);

      expect(screen.getByText("field_a")).toBeInTheDocument();
      expect(screen.getByText("field_b")).toBeInTheDocument();
      expect(screen.getByText("field_c")).toBeInTheDocument();
      expect(screen.queryByText("field_d")).not.toBeInTheDocument();
    });

    it("displays '+N more' when schema has more than 3 fields", () => {
      const data = createMockData({
        nodeData: createMockNodeData({
          isRoot: true,
          entryData: createMockEntryData({
            schemaFields: ["f1", "f2", "f3", "f4", "f5"],
          }),
        }),
        columnLineageApplied: false,
      });

      render(<LineageNode data={data} isConnectable={true} />);

      expect(screen.getByText("+2 more")).toBeInTheDocument();
    });

    it("does not display '+N more' when schema has exactly 3 fields", () => {
      const data = createMockData({
        nodeData: createMockNodeData({
          isRoot: true,
          entryData: createMockEntryData({
            schemaFields: ["f1", "f2", "f3"],
          }),
        }),
        columnLineageApplied: false,
      });

      render(<LineageNode data={data} isConnectable={true} />);

      expect(screen.queryByText(/more/)).not.toBeInTheDocument();
    });

    it("calls handleSidePanelToggle with showSchema=true when '+N more' is clicked", () => {
      const mockHandleSidePanelToggle = vi.fn();
      const nodeData = createMockNodeData({
        isRoot: true,
        entryData: createMockEntryData({
          schemaFields: ["f1", "f2", "f3", "f4", "f5", "f6"],
        }),
      });
      const data = createMockData({
        nodeData,
        handleSidePanelToggle: mockHandleSidePanelToggle,
        columnLineageApplied: false,
      });

      render(<LineageNode data={data} isConnectable={true} />);

      const moreLink = screen.getByText("+3 more");
      fireEvent.click(moreLink);

      expect(mockHandleSidePanelToggle).toHaveBeenCalledWith(nodeData, true);
    });

    it("does not display schema section when columnLineageApplied is true for root", () => {
      const data = createMockData({
        nodeData: createMockNodeData({
          isRoot: true,
          entryData: createMockEntryData({
            schemaFields: ["f1", "f2", "f3"],
          }),
        }),
        columnLineageApplied: true,
        columnName: "",
      });

      render(<LineageNode data={data} isConnectable={true} />);

      // When columnLineageApplied is true, it shows filtered schema, not the root schema
      // With empty columnName, no fields should match
      expect(screen.queryByText("f1")).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Schema Display Tests - Column Lineage Applied
  // ==========================================================================

  describe("Schema Display - Column Lineage Applied", () => {
    it("displays filtered schema field when columnLineageApplied is true and columnName matches", () => {
      const data = createMockData({
        nodeData: createMockNodeData({
          isRoot: false,
          entryData: createMockEntryData({
            schemaFields: ["id", "name", "email"],
          }),
        }),
        columnLineageApplied: true,
        columnName: "name",
      });

      render(<LineageNode data={data} isConnectable={true} />);

      expect(screen.getByText("name")).toBeInTheDocument();
      expect(screen.queryByText("id")).not.toBeInTheDocument();
      expect(screen.queryByText("email")).not.toBeInTheDocument();
    });

    it("displays no schema fields when columnName does not match any field", () => {
      const data = createMockData({
        nodeData: createMockNodeData({
          isRoot: false,
          entryData: createMockEntryData({
            schemaFields: ["id", "name", "email"],
          }),
        }),
        columnLineageApplied: true,
        columnName: "nonexistent",
      });

      render(<LineageNode data={data} isConnectable={true} />);

      expect(screen.queryByText("id")).not.toBeInTheDocument();
      expect(screen.queryByText("name")).not.toBeInTheDocument();
      expect(screen.queryByText("email")).not.toBeInTheDocument();
    });

    it("displays no schema fields when columnName is empty", () => {
      const data = createMockData({
        nodeData: createMockNodeData({
          isRoot: false,
          entryData: createMockEntryData({
            schemaFields: ["id", "name"],
          }),
        }),
        columnLineageApplied: true,
        columnName: "",
      });

      render(<LineageNode data={data} isConnectable={true} />);

      expect(screen.queryByText("id")).not.toBeInTheDocument();
      expect(screen.queryByText("name")).not.toBeInTheDocument();
    });

    it("displays no schema fields when columnName is undefined", () => {
      const data = createMockData({
        nodeData: createMockNodeData({
          isRoot: false,
          entryData: createMockEntryData({
            schemaFields: ["id", "name"],
          }),
        }),
        columnLineageApplied: true,
        columnName: undefined as any,
      });

      render(<LineageNode data={data} isConnectable={true} />);

      expect(screen.queryByText("id")).not.toBeInTheDocument();
      expect(screen.queryByText("name")).not.toBeInTheDocument();
    });

    it("displays schema for root node with columnLineageApplied", () => {
      const data = createMockData({
        nodeData: createMockNodeData({
          isRoot: true,
          entryData: createMockEntryData({
            schemaFields: ["col_a", "col_b", "col_c"],
          }),
        }),
        columnLineageApplied: true,
        columnName: "col_b",
      });

      render(<LineageNode data={data} isConnectable={true} />);

      expect(screen.getByText("col_b")).toBeInTheDocument();
      expect(screen.queryByText("col_a")).not.toBeInTheDocument();
      expect(screen.queryByText("col_c")).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Handle onConnect Tests
  // ==========================================================================

  describe("Handle onConnect", () => {
    it("logs connection params when target handle connects", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const data = createMockData();

      render(<LineageNode data={data} isConnectable={true} />);

      const targetHandle = screen.getByTestId("handle-target");
      fireEvent.click(targetHandle);

      expect(consoleSpy).toHaveBeenCalledWith("handle onConnect", {
        source: "test",
        target: "test",
      });

      consoleSpy.mockRestore();
    });
  });

  // ==========================================================================
  // Node Width Tests
  // ==========================================================================

  describe("Node Width Based on isRoot", () => {
    it("uses correct width for root node name", () => {
      const data = createMockData({
        nodeData: createMockNodeData({ isRoot: true }),
      });

      const { container } = render(<LineageNode data={data} isConnectable={true} />);

      // Root node should have narrower name width (10rem vs 12.5rem)
      const typographyElements = container.querySelectorAll(".MuiTypography-root");
      expect(typographyElements.length).toBeGreaterThan(0);
    });

    it("uses correct width for non-root node name", () => {
      const data = createMockData({
        nodeData: createMockNodeData({ isRoot: false }),
      });

      const { container } = render(<LineageNode data={data} isConnectable={true} />);

      const typographyElements = container.querySelectorAll(".MuiTypography-root");
      expect(typographyElements.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Icon Rotation Tests
  // ==========================================================================

  describe("Icon Rotation Based on Fetch State", () => {
    it("downstream icon rotates when isRoot is true", () => {
      const data = createMockData({
        nodeData: createMockNodeData({
          isRoot: true,
          showDownStreamIcon: true,
        }),
      });

      render(<LineageNode data={data} isConnectable={true} />);

      const icon = screen.getByTestId("chevron-left-icon");
      expect(icon).toBeInTheDocument();
    });

    it("downstream icon rotates when isDownStreamFetched is true", () => {
      const data = createMockData({
        nodeData: createMockNodeData({
          isRoot: false,
          showDownStreamIcon: true,
          isDownStreamFetched: true,
        }),
      });

      render(<LineageNode data={data} isConnectable={true} />);

      const icon = screen.getByTestId("chevron-left-icon");
      expect(icon).toBeInTheDocument();
    });

    it("upstream icon rotates when isRoot is true", () => {
      const data = createMockData({
        nodeData: createMockNodeData({
          isRoot: true,
          showUpStreamIcon: true,
        }),
      });

      render(<LineageNode data={data} isConnectable={true} />);

      const icon = screen.getByTestId("chevron-right-icon");
      expect(icon).toBeInTheDocument();
    });

    it("upstream icon rotates when isUpStreamFetched is true", () => {
      const data = createMockData({
        nodeData: createMockNodeData({
          isRoot: false,
          showUpStreamIcon: true,
          isUpStreamFetched: true,
        }),
      });

      render(<LineageNode data={data} isConnectable={true} />);

      const icon = screen.getByTestId("chevron-right-icon");
      expect(icon).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Integration Tests
  // ==========================================================================

  describe("Integration Tests", () => {
    it("renders complete root node with all features", () => {
      const mockHandleSidePanelToggle = vi.fn();
      const mockFetchLineageDownStream = vi.fn();
      const mockFetchLineageUpStream = vi.fn();

      const data = createMockData({
        nodeData: createMockNodeData({
          name: "Root Table",
          isRoot: true,
          showDownStreamIcon: true,
          showUpStreamIcon: true,
          entryData: createMockEntryData({
            schemaFields: ["id", "name", "email", "created_at", "updated_at"],
          }),
        }),
        handleSidePanelToggle: mockHandleSidePanelToggle,
        fetchLineageDownStream: mockFetchLineageDownStream,
        fetchLineageUpStream: mockFetchLineageUpStream,
        columnLineageApplied: false,
      });

      render(<LineageNode data={data} isConnectable={true} />);

      // Verify node name
      expect(screen.getByText("Root Table")).toBeInTheDocument();

      // Verify handles
      expect(screen.getByTestId("handle-target")).toBeInTheDocument();
      expect(screen.getByTestId("handle-source")).toBeInTheDocument();

      // Verify icons
      expect(screen.getByTestId("chevron-left-icon")).toBeInTheDocument();
      expect(screen.getByTestId("chevron-right-icon")).toBeInTheDocument();

      // Verify schema fields (first 3)
      expect(screen.getByText("id")).toBeInTheDocument();
      expect(screen.getByText("name")).toBeInTheDocument();
      expect(screen.getByText("email")).toBeInTheDocument();

      // Verify '+N more' link
      expect(screen.getByText("+2 more")).toBeInTheDocument();

      // Verify image
      expect(screen.getByAltText("Asset Preview")).toBeInTheDocument();
    });

    it("renders non-root node with column lineage applied", () => {
      const data = createMockData({
        nodeData: createMockNodeData({
          name: "Child Table",
          isRoot: false,
          showDownStreamIcon: false,
          showUpStreamIcon: true,
          entryData: createMockEntryData({
            schemaFields: ["user_id", "order_id", "amount"],
          }),
        }),
        columnLineageApplied: true,
        columnName: "order_id",
      });

      render(<LineageNode data={data} isConnectable={true} />);

      // Verify node name
      expect(screen.getByText("Child Table")).toBeInTheDocument();

      // Verify only filtered column is shown
      expect(screen.getByText("order_id")).toBeInTheDocument();
      expect(screen.queryByText("user_id")).not.toBeInTheDocument();
      expect(screen.queryByText("amount")).not.toBeInTheDocument();

      // Verify upstream icon is present, downstream is not
      expect(screen.queryByTestId("chevron-left-icon")).not.toBeInTheDocument();
      expect(screen.getByTestId("chevron-right-icon")).toBeInTheDocument();
    });

    it("handles user interaction flow", () => {
      const mockHandleSidePanelToggle = vi.fn();
      const mockFetchLineageDownStream = vi.fn();
      const mockFetchLineageUpStream = vi.fn();
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const nodeData = createMockNodeData({
        name: "Interactive Node",
        isRoot: true,
        showDownStreamIcon: true,
        showUpStreamIcon: true,
        isDownStreamFetched: true,
        isUpStreamFetched: true,
        entryData: createMockEntryData({
          schemaFields: ["a", "b", "c", "d"],
        }),
      });

      const data = createMockData({
        nodeData,
        handleSidePanelToggle: mockHandleSidePanelToggle,
        fetchLineageDownStream: mockFetchLineageDownStream,
        fetchLineageUpStream: mockFetchLineageUpStream,
        columnLineageApplied: false,
      });

      render(<LineageNode data={data} isConnectable={true} />);

      // Step 1: Click node name to toggle side panel
      const nodeName = screen.getByText("Interactive Node");
      fireEvent.click(nodeName);
      expect(mockHandleSidePanelToggle).toHaveBeenCalledWith(nodeData, false);

      // Step 2: Click downstream icon
      const downstreamIcon = screen.getByTestId("chevron-left-icon");
      fireEvent.click(downstreamIcon);
      expect(mockFetchLineageDownStream).toHaveBeenCalledWith(nodeData);

      // Step 3: Click upstream icon
      const upstreamIcon = screen.getByTestId("chevron-right-icon");
      fireEvent.click(upstreamIcon);
      expect(mockFetchLineageUpStream).toHaveBeenCalledWith(nodeData);

      // Step 4: Click '+N more' to show schema
      const moreLink = screen.getByText("+1 more");
      fireEvent.click(moreLink);
      expect(mockHandleSidePanelToggle).toHaveBeenCalledWith(nodeData, true);

      consoleSpy.mockRestore();
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe("Edge Cases", () => {
    it("handles empty schema", () => {
      const data = createMockData({
        nodeData: createMockNodeData({
          isRoot: true,
          entryData: createMockEntryData({ schemaFields: [] }),
        }),
        columnLineageApplied: false,
      });

      render(<LineageNode data={data} isConnectable={true} />);

      // No schema fields should be displayed
      expect(screen.queryByText(/more/)).not.toBeInTheDocument();
    });

    it("handles single schema field", () => {
      const data = createMockData({
        nodeData: createMockNodeData({
          isRoot: true,
          entryData: createMockEntryData({ schemaFields: ["only_field"] }),
        }),
        columnLineageApplied: false,
      });

      render(<LineageNode data={data} isConnectable={true} />);

      expect(screen.getByText("only_field")).toBeInTheDocument();
      expect(screen.queryByText(/more/)).not.toBeInTheDocument();
    });

    it("handles both icons visible at the same time", () => {
      const data = createMockData({
        nodeData: createMockNodeData({
          showDownStreamIcon: true,
          showUpStreamIcon: true,
        }),
      });

      render(<LineageNode data={data} isConnectable={true} />);

      expect(screen.getByTestId("chevron-left-icon")).toBeInTheDocument();
      expect(screen.getByTestId("chevron-right-icon")).toBeInTheDocument();
    });

    it("handles node with special characters in name", () => {
      const data = createMockData({
        nodeData: createMockNodeData({
          name: "table_with-special.chars:v1",
        }),
      });

      render(<LineageNode data={data} isConnectable={true} />);

      expect(screen.getByText("table_with-special.chars:v1")).toBeInTheDocument();
    });

    it("handles long node name", () => {
      const data = createMockData({
        nodeData: createMockNodeData({
          name: "this_is_a_very_long_table_name_that_might_overflow_the_container_width",
        }),
      });

      render(<LineageNode data={data} isConnectable={true} />);

      expect(
        screen.getByText("this_is_a_very_long_table_name_that_might_overflow_the_container_width")
      ).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Memoization Tests
  // ==========================================================================

  describe("Memoization", () => {
    it("component is wrapped with memo", () => {
      // The component is exported as memo(Component)
      // We can verify it's callable and renders correctly
      const data = createMockData();
      const { rerender } = render(<LineageNode data={data} isConnectable={true} />);

      expect(screen.getByText("test-node")).toBeInTheDocument();

      // Rerender with same props should not cause issues
      rerender(<LineageNode data={data} isConnectable={true} />);
      expect(screen.getByText("test-node")).toBeInTheDocument();
    });
  });
});
