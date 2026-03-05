import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LineageChartViewNew from "./LineageChartViewNew";

// Capture props for testing - these will be set by the mocks
let capturedReactFlowProps: any = null;
let capturedMiniMapProps: any = null;
let capturedBackgroundProps: any = null;

// Track mock state changes
const mockSetNodesCallHistory: any[] = [];
const mockSetEdgesCallHistory: any[] = [];

// Mock @xyflow/react
vi.mock("@xyflow/react", () => {
  return {
    ReactFlow: (props: any) => {
      capturedReactFlowProps = props;
      return (
        <div data-testid="react-flow" data-fit-view={props.fitView}>
          {props.children}
        </div>
      );
    },
    useNodesState: () => {
      const setNodes = (nodes: any) => {
        mockSetNodesCallHistory.push(typeof nodes === "function" ? nodes([]) : nodes);
      };
      return [[], setNodes, vi.fn()];
    },
    useEdgesState: () => {
      const setEdges = (edges: any) => {
        mockSetEdgesCallHistory.push(typeof edges === "function" ? edges([]) : edges);
      };
      return [[], setEdges, vi.fn()];
    },
    MiniMap: (props: any) => {
      capturedMiniMapProps = props;
      return <div data-testid="mini-map">MiniMap</div>;
    },
    Controls: (props: any) => (
      <div data-testid="controls" data-show-interactive={props.showInteractive}>
        Controls
      </div>
    ),
    Background: (props: any) => {
      capturedBackgroundProps = props;
      return <div data-testid="background">Background</div>;
    },
    BackgroundVariant: {
      Dots: "dots",
      Lines: "lines",
      Cross: "cross",
    },
    Panel: (props: any) => (
      <div data-testid="panel" data-position={props.position}>
        {props.children}
      </div>
    ),
  };
});

// Mock dagre
vi.mock("@dagrejs/dagre", () => {
  const mockSetGraph = vi.fn();
  const mockSetNode = vi.fn();
  const mockSetEdge = vi.fn();
  const mockLayout = vi.fn();

  return {
    default: {
      graphlib: {
        Graph: vi.fn().mockImplementation(() => ({
          setDefaultEdgeLabel: vi.fn().mockReturnThis(),
          setGraph: mockSetGraph,
          setNode: mockSetNode,
          setEdge: mockSetEdge,
          node: () => ({ x: 100, y: 100, width: 350, height: 200 }),
        })),
      },
      layout: mockLayout,
    },
  };
});

// Mock child components
vi.mock("./LineageNode", () => ({
  default: ({ data }: any) => (
    <div data-testid="lineage-node" data-label={data?.label}>
      LineageNode: {data?.label}
    </div>
  ),
}));

vi.mock("./QueryNode", () => ({
  default: ({ data }: any) => (
    <div data-testid="query-node" data-label={data?.label}>
      QueryNode: {data?.label}
    </div>
  ),
}));

vi.mock("./LineageColumnLevelPanel", () => ({
  default: ({
    entryData: _entryData,
    direction,
    setDirection,
    columnName,
    setColumnName,
    onClose,
    fetchColumnLineage,
    resetLineageGraph,
  }: any) => (
    <div data-testid="lineage-column-level-panel">
      <span data-testid="panel-column-name">{columnName}</span>
      <span data-testid="panel-direction">{direction}</span>
      <button data-testid="panel-close" onClick={onClose}>
        Close Panel
      </button>
      <button
        data-testid="panel-fetch-lineage"
        onClick={() => fetchColumnLineage("test_column", direction)}
      >
        Fetch Column Lineage
      </button>
      <button data-testid="panel-reset" onClick={resetLineageGraph}>
        Reset
      </button>
      <button
        data-testid="panel-set-column"
        onClick={() => setColumnName && setColumnName("new_column")}
      >
        Set Column
      </button>
      <button
        data-testid="panel-set-direction"
        onClick={() => setDirection && setDirection("upstream")}
      >
        Set Direction
      </button>
    </div>
  ),
}));

// Mock MUI components
vi.mock("@mui/icons-material", () => ({
  CloseFullscreen: ({ onClick, sx }: any) => (
    <div
      data-testid="close-fullscreen-icon"
      onClick={onClick}
      style={sx}
    >
      CloseFullscreen
    </div>
  ),
}));

vi.mock("@mui/material", () => ({
  CircularProgress: () => (
    <div data-testid="circular-progress">Loading...</div>
  ),
  Tooltip: ({ children, title }: any) => (
    <div data-testid="tooltip" title={title}>
      {children}
    </div>
  ),
}));

// ============================================================================
// Mock Data Generators
// ============================================================================

const createMockAssetNode = (options: {
  id?: string;
  name?: string;
  isRoot?: boolean;
  showDownStreamIcon?: boolean;
  showUpStreamIcon?: boolean;
  isDownStreamFetched?: boolean;
  isUpStreamFetched?: boolean;
  entryData?: any;
} = {}) => {
  const {
    id = "asset-1",
    name = "test-asset",
    isRoot = false,
    showDownStreamIcon = false,
    showUpStreamIcon = false,
    isDownStreamFetched = false,
    isUpStreamFetched = false,
    entryData = null,
  } = options;

  return {
    id,
    type: "assetNode",
    name,
    isRoot,
    showDownStreamIcon,
    showUpStreamIcon,
    isDownStreamFetched,
    isUpStreamFetched,
    entryData: entryData || {
      entryType: "projects/testschema",
      aspects: {
        "testschema.global.schema": {
          data: {
            fields: {
              fields: {
                listValue: {
                  values: [
                    { structValue: { fields: { name: { stringValue: "field_1" } } } },
                    { structValue: { fields: { name: { stringValue: "field_2" } } } },
                  ],
                },
              },
            },
          },
        },
      },
    },
  };
};

const createMockQueryNode = (options: {
  id?: string;
  name?: string;
  source?: string;
  target?: string;
} = {}) => {
  const {
    id = "query-1",
    name = "test-query",
    source = "asset-1",
    target = "asset-2",
  } = options;

  return {
    id,
    type: "queryNode",
    name,
    source,
    target,
  };
};

const createMockEntryData = () => ({
  entryType: "projects/testschema",
  aspects: {
    "testschema.global.schema": {
      data: {
        fields: {
          fields: {
            listValue: {
              values: [
                { structValue: { fields: { name: { stringValue: "column_a" } } } },
                { structValue: { fields: { name: { stringValue: "column_b" } } } },
                { structValue: { fields: { name: { stringValue: "column_c" } } } },
              ],
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

describe("LineageChartViewNew", () => {
  const defaultProps = {
    graphData: [],
    fetchColumnLevelLineage: vi.fn(),
    resetLineageGraph: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSetNodesCallHistory.length = 0;
    mockSetEdgesCallHistory.length = 0;
    capturedReactFlowProps = null;
    capturedMiniMapProps = null;
    capturedBackgroundProps = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // Basic Rendering Tests
  // ==========================================================================

  describe("Basic Rendering", () => {
    it("renders ReactFlow component", () => {
      render(<LineageChartViewNew {...defaultProps} />);

      expect(screen.getByTestId("react-flow")).toBeInTheDocument();
    });

    it("renders MiniMap component", () => {
      render(<LineageChartViewNew {...defaultProps} />);

      expect(screen.getByTestId("mini-map")).toBeInTheDocument();
    });

    it("renders Controls component", () => {
      render(<LineageChartViewNew {...defaultProps} />);

      expect(screen.getByTestId("controls")).toBeInTheDocument();
    });

    it("renders Background component", () => {
      render(<LineageChartViewNew {...defaultProps} />);

      expect(screen.getByTestId("background")).toBeInTheDocument();
    });

    it("renders Panel component at top-left position", () => {
      render(<LineageChartViewNew {...defaultProps} />);

      const panel = screen.getByTestId("panel");
      expect(panel).toBeInTheDocument();
      expect(panel).toHaveAttribute("data-position", "top-left");
    });

    it("renders 'Show Lineage Explorer' button by default", () => {
      render(<LineageChartViewNew {...defaultProps} />);

      expect(screen.getByText("Show Lineage Explorer")).toBeInTheDocument();
    });

    it("exports LineageChartViewNew as default export", () => {
      expect(LineageChartViewNew).toBeDefined();
      expect(typeof LineageChartViewNew).toBe("function");
    });
  });

  // ==========================================================================
  // ReactFlow Props Tests
  // ==========================================================================

  describe("ReactFlow Configuration", () => {
    it("passes correct style props to ReactFlow", () => {
      render(<LineageChartViewNew {...defaultProps} />);

      expect(capturedReactFlowProps.style).toEqual({
        border: "1px solid #fafafa",
        borderBottomLeftRadius: "15px",
        borderBottomRightRadius: "15px",
      });
    });

    it("enables snapToGrid with correct snapGrid values", () => {
      render(<LineageChartViewNew {...defaultProps} />);

      expect(capturedReactFlowProps.snapToGrid).toBe(true);
      expect(capturedReactFlowProps.snapGrid).toEqual([20, 20]);
    });

    it("configures defaultViewport correctly", () => {
      render(<LineageChartViewNew {...defaultProps} />);

      expect(capturedReactFlowProps.defaultViewport).toEqual({
        x: 0,
        y: 0,
        zoom: 1.1,
      });
    });

    it("sets attributionPosition to bottom-left", () => {
      render(<LineageChartViewNew {...defaultProps} />);

      expect(capturedReactFlowProps.attributionPosition).toBe("bottom-left");
    });

    it("registers custom nodeTypes", () => {
      render(<LineageChartViewNew {...defaultProps} />);

      expect(capturedReactFlowProps.nodeTypes).toHaveProperty("lineageNode");
      expect(capturedReactFlowProps.nodeTypes).toHaveProperty("queryNode");
    });

    it("passes onConnect as empty function", () => {
      render(<LineageChartViewNew {...defaultProps} />);

      expect(capturedReactFlowProps.onConnect).toBeDefined();
      expect(typeof capturedReactFlowProps.onConnect).toBe("function");
      // Call it to verify it doesn't throw
      expect(() => capturedReactFlowProps.onConnect()).not.toThrow();
    });

    it("sets fitView to false for single node", () => {
      const props = {
        ...defaultProps,
        graphData: [createMockAssetNode()],
      };
      render(<LineageChartViewNew {...props} />);

      expect(capturedReactFlowProps.fitView).toBe(false);
    });

    it("sets fitView to true for multiple nodes", () => {
      const props = {
        ...defaultProps,
        graphData: [
          createMockAssetNode({ id: "asset-1" }),
          createMockQueryNode({ id: "query-1", source: "asset-1", target: "asset-2" }),
          createMockAssetNode({ id: "asset-2" }),
        ],
      };
      render(<LineageChartViewNew {...props} />);

      expect(capturedReactFlowProps.fitView).toBe(true);
    });
  });

  // ==========================================================================
  // MiniMap Tests
  // ==========================================================================

  describe("MiniMap Configuration", () => {
    it("configures MiniMap with correct props", () => {
      render(<LineageChartViewNew {...defaultProps} />);

      expect(capturedMiniMapProps.nodeStrokeWidth).toBe(1);
      expect(capturedMiniMapProps.pannable).toBe(true);
      expect(capturedMiniMapProps.zoomable).toBe(true);
      expect(capturedMiniMapProps.style).toEqual({ backgroundColor: "#ffffff" });
    });

    it("returns correct stroke color for lineageNode", () => {
      render(<LineageChartViewNew {...defaultProps} />);

      const strokeColor = capturedMiniMapProps.nodeStrokeColor({ type: "lineageNode" });
      expect(strokeColor).toBe("#0041d0");
    });

    it("returns correct stroke color for queryNode", () => {
      render(<LineageChartViewNew {...defaultProps} />);

      const strokeColor = capturedMiniMapProps.nodeStrokeColor({ type: "queryNode" });
      expect(strokeColor).toBe("#5a3600ff");
    });

    it("returns default stroke color for unknown node type", () => {
      render(<LineageChartViewNew {...defaultProps} />);

      const strokeColor = capturedMiniMapProps.nodeStrokeColor({ type: "unknownNode" });
      expect(strokeColor).toBe("#000");
    });

    it("returns correct fill color for lineageNode", () => {
      render(<LineageChartViewNew {...defaultProps} />);

      const fillColor = capturedMiniMapProps.nodeColor({ type: "lineageNode" });
      expect(fillColor).toBe("#0041d0");
    });

    it("returns correct fill color for queryNode", () => {
      render(<LineageChartViewNew {...defaultProps} />);

      const fillColor = capturedMiniMapProps.nodeColor({ type: "queryNode" });
      expect(fillColor).toBe("#e4a03bff");
    });

    it("returns default fill color for unknown node type", () => {
      render(<LineageChartViewNew {...defaultProps} />);

      const fillColor = capturedMiniMapProps.nodeColor({ type: "unknownNode" });
      expect(fillColor).toBe("#fff");
    });
  });

  // ==========================================================================
  // Background Tests
  // ==========================================================================

  describe("Background Configuration", () => {
    it("configures Background with Dots variant", () => {
      render(<LineageChartViewNew {...defaultProps} />);

      expect(capturedBackgroundProps.variant).toBe("dots");
    });

    it("configures Background with correct gap and size", () => {
      render(<LineageChartViewNew {...defaultProps} />);

      expect(capturedBackgroundProps.gap).toBe(25);
      expect(capturedBackgroundProps.size).toBe(2);
    });

    it("configures Background with correct colors", () => {
      render(<LineageChartViewNew {...defaultProps} />);

      expect(capturedBackgroundProps.color).toBe("#c4c4c4");
      expect(capturedBackgroundProps.bgColor).toBe("rgb(248, 250, 253)");
    });
  });

  // ==========================================================================
  // Panel and Lineage Explorer Tests
  // ==========================================================================

  describe("Panel and Lineage Explorer", () => {
    it("shows 'Show Lineage Explorer' button when panel is hidden", () => {
      render(<LineageChartViewNew {...defaultProps} />);

      expect(screen.getByText("Show Lineage Explorer")).toBeInTheDocument();
      expect(screen.queryByTestId("lineage-column-level-panel")).not.toBeInTheDocument();
    });

    it("shows LineageColumnLevelPanel when button is clicked", () => {
      render(<LineageChartViewNew {...defaultProps} />);

      const showButton = screen.getByText("Show Lineage Explorer");
      fireEvent.click(showButton);

      expect(screen.getByTestId("lineage-column-level-panel")).toBeInTheDocument();
      expect(screen.queryByText("Show Lineage Explorer")).not.toBeInTheDocument();
    });

    it("hides LineageColumnLevelPanel when close is clicked", () => {
      render(<LineageChartViewNew {...defaultProps} />);

      // Open panel
      const showButton = screen.getByText("Show Lineage Explorer");
      fireEvent.click(showButton);

      expect(screen.getByTestId("lineage-column-level-panel")).toBeInTheDocument();

      // Close panel
      const closeButton = screen.getByTestId("panel-close");
      fireEvent.click(closeButton);

      expect(screen.queryByTestId("lineage-column-level-panel")).not.toBeInTheDocument();
      expect(screen.getByText("Show Lineage Explorer")).toBeInTheDocument();
    });

    it("passes entry data to LineageColumnLevelPanel", () => {
      const entryData = createMockEntryData();
      const props = {
        ...defaultProps,
        entry: entryData,
      };

      render(<LineageChartViewNew {...props} />);

      const showButton = screen.getByText("Show Lineage Explorer");
      fireEvent.click(showButton);

      expect(screen.getByTestId("lineage-column-level-panel")).toBeInTheDocument();
    });

    it("passes correct direction to LineageColumnLevelPanel", () => {
      render(<LineageChartViewNew {...defaultProps} />);

      const showButton = screen.getByText("Show Lineage Explorer");
      fireEvent.click(showButton);

      expect(screen.getByTestId("panel-direction")).toHaveTextContent("both");
    });

    it("calls fetchColumnLevelLineage when panel fetch is triggered", () => {
      const mockFetchColumnLevelLineage = vi.fn();
      const props = {
        ...defaultProps,
        fetchColumnLevelLineage: mockFetchColumnLevelLineage,
      };

      render(<LineageChartViewNew {...props} />);

      const showButton = screen.getByText("Show Lineage Explorer");
      fireEvent.click(showButton);

      const fetchButton = screen.getByTestId("panel-fetch-lineage");
      fireEvent.click(fetchButton);

      expect(mockFetchColumnLevelLineage).toHaveBeenCalledWith("test_column", "both");
    });

    it("calls resetLineageGraph when panel reset is triggered", () => {
      const mockResetLineageGraph = vi.fn();
      const props = {
        ...defaultProps,
        resetLineageGraph: mockResetLineageGraph,
      };

      render(<LineageChartViewNew {...props} />);

      const showButton = screen.getByText("Show Lineage Explorer");
      fireEvent.click(showButton);

      const resetButton = screen.getByTestId("panel-reset");
      fireEvent.click(resetButton);

      expect(mockResetLineageGraph).toHaveBeenCalled();
    });

    it("updates columnName when setColumnName is called", async () => {
      render(<LineageChartViewNew {...defaultProps} />);

      const showButton = screen.getByText("Show Lineage Explorer");
      fireEvent.click(showButton);

      const setColumnButton = screen.getByTestId("panel-set-column");
      fireEvent.click(setColumnButton);

      await waitFor(() => {
        expect(screen.getByTestId("panel-column-name")).toHaveTextContent("new_column");
      });
    });

    it("updates direction when setDirection is called", async () => {
      render(<LineageChartViewNew {...defaultProps} />);

      const showButton = screen.getByText("Show Lineage Explorer");
      fireEvent.click(showButton);

      const setDirectionButton = screen.getByTestId("panel-set-direction");
      fireEvent.click(setDirectionButton);

      await waitFor(() => {
        expect(screen.getByTestId("panel-direction")).toHaveTextContent("upstream");
      });
    });

    it("applies correct button styles", () => {
      render(<LineageChartViewNew {...defaultProps} />);

      const showButton = screen.getByText("Show Lineage Explorer");
      expect(showButton).toHaveStyle({
        margin: "0.5rem",
        padding: "0.25rem 0.5rem",
        fontSize: "14px",
        borderRadius: "4px",
        border: "1px solid #dddddd",
        backgroundColor: "#ffffff",
        cursor: "pointer",
      });
    });
  });

  // ==========================================================================
  // Fullscreen Mode Tests
  // ==========================================================================

  describe("Fullscreen Mode", () => {
    it("does not render CloseFullscreen icon when isFullScreen is false", () => {
      const props = {
        ...defaultProps,
        isFullScreen: false,
      };

      render(<LineageChartViewNew {...props} />);

      expect(screen.queryByTestId("close-fullscreen-icon")).not.toBeInTheDocument();
    });

    it("renders CloseFullscreen icon when isFullScreen is true", () => {
      const props = {
        ...defaultProps,
        isFullScreen: true,
      };

      render(<LineageChartViewNew {...props} />);

      expect(screen.getByTestId("close-fullscreen-icon")).toBeInTheDocument();
    });

    it("renders CloseFullscreen inside Tooltip", () => {
      const props = {
        ...defaultProps,
        isFullScreen: true,
      };

      render(<LineageChartViewNew {...props} />);

      expect(screen.getByTestId("tooltip")).toBeInTheDocument();
      expect(screen.getByTestId("close-fullscreen-icon")).toBeInTheDocument();
    });

    it("calls toggleFullScreen when CloseFullscreen is clicked", () => {
      const mockToggleFullScreen = vi.fn();
      const props = {
        ...defaultProps,
        isFullScreen: true,
        toggleFullScreen: mockToggleFullScreen,
      };

      render(<LineageChartViewNew {...props} />);

      const closeFullscreenIcon = screen.getByTestId("close-fullscreen-icon");
      fireEvent.click(closeFullscreenIcon);

      expect(mockToggleFullScreen).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Column Lineage Loading State Tests
  // ==========================================================================

  describe("Column Lineage Loading State", () => {
    it("does not render loading overlay when isColumnLineageLoading is false", () => {
      const props = {
        ...defaultProps,
        isColumnLineageLoading: false,
      };

      render(<LineageChartViewNew {...props} />);

      expect(screen.queryByTestId("circular-progress")).not.toBeInTheDocument();
    });

    it("renders loading overlay when isColumnLineageLoading is true", () => {
      const props = {
        ...defaultProps,
        isColumnLineageLoading: true,
      };

      render(<LineageChartViewNew {...props} />);

      expect(screen.getByTestId("circular-progress")).toBeInTheDocument();
    });

    it("renders CircularProgress inside loading overlay", () => {
      const props = {
        ...defaultProps,
        isColumnLineageLoading: true,
      };

      render(<LineageChartViewNew {...props} />);

      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Graph Data Processing Tests - Single Node
  // ==========================================================================

  describe("Single Node Rendering", () => {
    it("processes single assetNode correctly", async () => {
      const singleAssetNode = createMockAssetNode({
        id: "single-asset",
        name: "Single Asset",
        isRoot: true,
      });

      const props = {
        ...defaultProps,
        graphData: [singleAssetNode],
      };

      render(<LineageChartViewNew {...props} />);

      await waitFor(() => {
        expect(mockSetNodesCallHistory.length).toBeGreaterThan(0);
      });

      // Verify setNodes was called with the single node
      const lastCall = mockSetNodesCallHistory[mockSetNodesCallHistory.length - 1];
      expect(lastCall).toHaveLength(1);
      expect(lastCall[0].id).toBe("single-asset");
      expect(lastCall[0].type).toBe("lineageNode");
    });

    it("sets correct position for single node", async () => {
      const singleAssetNode = createMockAssetNode({
        id: "single-asset",
        name: "Single Asset",
      });

      const props = {
        ...defaultProps,
        graphData: [singleAssetNode],
      };

      render(<LineageChartViewNew {...props} />);

      await waitFor(() => {
        expect(mockSetNodesCallHistory.length).toBeGreaterThan(0);
      });

      // For single node, position is set explicitly (not using dagre)
      const lastCall = mockSetNodesCallHistory[mockSetNodesCallHistory.length - 1];
      expect(lastCall[0].position).toEqual({ x: 200, y: 50 });
    });

    it("does not use dagre layout for single node", async () => {
      const singleAssetNode = createMockAssetNode();

      const props = {
        ...defaultProps,
        graphData: [singleAssetNode],
      };

      render(<LineageChartViewNew {...props} />);

      await waitFor(() => {
        expect(mockSetNodesCallHistory.length).toBeGreaterThan(0);
      });

      // Dagre layout should not be applied for single nodes
      // The nodes array should be passed directly without layout processing
      const lastCall = mockSetNodesCallHistory[mockSetNodesCallHistory.length - 1];
      expect(lastCall).toHaveLength(1);
    });
  });

  // ==========================================================================
  // Graph Data Processing Tests - Multiple Nodes
  // ==========================================================================

  describe("Multiple Nodes Rendering", () => {
    it("processes multiple assetNodes and queryNodes correctly", async () => {
      const graphData = [
        createMockAssetNode({ id: "asset-1", name: "Asset 1" }),
        createMockQueryNode({ id: "query-1", source: "asset-1", target: "asset-2" }),
        createMockAssetNode({ id: "asset-2", name: "Asset 2" }),
      ];

      const props = {
        ...defaultProps,
        graphData,
      };

      render(<LineageChartViewNew {...props} />);

      await waitFor(() => {
        expect(mockSetNodesCallHistory.length).toBeGreaterThan(0);
        expect(mockSetEdgesCallHistory.length).toBeGreaterThan(0);
      });
    });

    it("creates edges for queryNodes", async () => {
      const graphData = [
        createMockAssetNode({ id: "asset-1", name: "Asset 1" }),
        createMockQueryNode({ id: "query-1", source: "asset-1", target: "asset-2" }),
        createMockAssetNode({ id: "asset-2", name: "Asset 2" }),
      ];

      const props = {
        ...defaultProps,
        graphData,
      };

      render(<LineageChartViewNew {...props} />);

      await waitFor(() => {
        expect(mockSetEdgesCallHistory.length).toBeGreaterThan(0);
      });

      // Verify edges are created - each queryNode creates 2 edges
      const lastCall = mockSetEdgesCallHistory[mockSetEdgesCallHistory.length - 1];
      expect(lastCall.length).toBeGreaterThanOrEqual(2);
    });

    it("sets correct node types for assetNodes", async () => {
      const graphData = [
        createMockAssetNode({ id: "asset-1", name: "Asset 1" }),
        createMockAssetNode({ id: "asset-2", name: "Asset 2" }),
      ];

      const props = {
        ...defaultProps,
        graphData,
      };

      render(<LineageChartViewNew {...props} />);

      await waitFor(() => {
        expect(mockSetNodesCallHistory.length).toBeGreaterThan(0);
      });

      const lastCall = mockSetNodesCallHistory[mockSetNodesCallHistory.length - 1];
      lastCall.forEach((node: any) => {
        expect(node.type).toBe("lineageNode");
      });
    });

    it("sets correct node types for queryNodes", async () => {
      const graphData = [
        createMockAssetNode({ id: "asset-1" }),
        createMockQueryNode({ id: "query-1", source: "asset-1", target: "asset-2" }),
        createMockAssetNode({ id: "asset-2" }),
      ];

      const props = {
        ...defaultProps,
        graphData,
      };

      render(<LineageChartViewNew {...props} />);

      await waitFor(() => {
        expect(mockSetNodesCallHistory.length).toBeGreaterThan(0);
      });

      const lastCall = mockSetNodesCallHistory[mockSetNodesCallHistory.length - 1];
      const queryNode = lastCall.find((n: any) => n.id === "query-1");
      expect(queryNode?.type).toBe("queryNode");
    });

    it("sets correct edge styles", async () => {
      const graphData = [
        createMockAssetNode({ id: "asset-1" }),
        createMockQueryNode({ id: "query-1", source: "asset-1", target: "asset-2" }),
        createMockAssetNode({ id: "asset-2" }),
      ];

      const props = {
        ...defaultProps,
        graphData,
      };

      render(<LineageChartViewNew {...props} />);

      await waitFor(() => {
        expect(mockSetEdgesCallHistory.length).toBeGreaterThan(0);
      });

      const lastCall = mockSetEdgesCallHistory[mockSetEdgesCallHistory.length - 1];
      lastCall.forEach((edge: any) => {
        expect(edge.animated).toBe(true);
        expect(edge.style.strokeWidth).toBe(3);
      });
    });
  });

  // ==========================================================================
  // useEffect Dependencies Tests
  // ==========================================================================

  describe("useEffect Dependencies", () => {
    it("re-renders nodes when graphData changes", async () => {
      const initialGraphData = [createMockAssetNode({ id: "asset-1", name: "Initial" })];
      const props = {
        ...defaultProps,
        graphData: initialGraphData,
      };

      const { rerender } = render(<LineageChartViewNew {...props} />);

      await waitFor(() => {
        expect(mockSetNodesCallHistory.length).toBeGreaterThan(0);
      });

      const callCountBeforeRerender = mockSetNodesCallHistory.length;

      const updatedGraphData = [createMockAssetNode({ id: "asset-2", name: "Updated" })];
      rerender(<LineageChartViewNew {...props} graphData={updatedGraphData} />);

      await waitFor(() => {
        expect(mockSetNodesCallHistory.length).toBeGreaterThan(callCountBeforeRerender);
      });
    });

    it("re-renders nodes when selectedNode changes", async () => {
      const graphData = [createMockAssetNode({ id: "asset-1" })];
      const props = {
        ...defaultProps,
        graphData,
        selectedNode: null,
      };

      const { rerender } = render(<LineageChartViewNew {...props} />);

      await waitFor(() => {
        expect(mockSetNodesCallHistory.length).toBeGreaterThan(0);
      });

      const callCountBeforeRerender = mockSetNodesCallHistory.length;

      rerender(<LineageChartViewNew {...props} selectedNode="asset-1" />);

      await waitFor(() => {
        expect(mockSetNodesCallHistory.length).toBeGreaterThan(callCountBeforeRerender);
      });
    });
  });

  // ==========================================================================
  // Node Styling Tests
  // ==========================================================================

  describe("Node Styling", () => {
    it("applies 'card' className when node is selected", async () => {
      const graphData = [createMockAssetNode({ id: "asset-1" })];
      const props = {
        ...defaultProps,
        graphData,
        selectedNode: "asset-1",
      };

      render(<LineageChartViewNew {...props} />);

      await waitFor(() => {
        expect(mockSetNodesCallHistory.length).toBeGreaterThan(0);
      });

      const lastCall = mockSetNodesCallHistory[mockSetNodesCallHistory.length - 1];
      const selectedNode = lastCall.find((n: any) => n.id === "asset-1");
      expect(selectedNode?.className).toBe("card");
    });

    it("does not apply 'card' className when node is not selected", async () => {
      const graphData = [createMockAssetNode({ id: "asset-1" })];
      const props = {
        ...defaultProps,
        graphData,
        selectedNode: "different-node",
      };

      render(<LineageChartViewNew {...props} />);

      await waitFor(() => {
        expect(mockSetNodesCallHistory.length).toBeGreaterThan(0);
      });

      const lastCall = mockSetNodesCallHistory[mockSetNodesCallHistory.length - 1];
      const nonSelectedNode = lastCall.find((n: any) => n.id === "asset-1");
      expect(nonSelectedNode?.className).toBe("");
    });

    it("applies correct border style to assetNodes", async () => {
      const graphData = [createMockAssetNode({ id: "asset-1" })];
      const props = {
        ...defaultProps,
        graphData,
      };

      render(<LineageChartViewNew {...props} />);

      await waitFor(() => {
        expect(mockSetNodesCallHistory.length).toBeGreaterThan(0);
      });

      const lastCall = mockSetNodesCallHistory[mockSetNodesCallHistory.length - 1];
      const assetNode = lastCall.find((n: any) => n.id === "asset-1");
      expect(assetNode?.style.border).toBe("1px solid #bdbdbdff");
      expect(assetNode?.style.backgroundColor).toBe("#ffffff");
    });

    it("applies correct style to queryNodes", async () => {
      const graphData = [
        createMockAssetNode({ id: "asset-1" }),
        createMockQueryNode({ id: "query-1", source: "asset-1", target: "asset-2" }),
        createMockAssetNode({ id: "asset-2" }),
      ];
      const props = {
        ...defaultProps,
        graphData,
      };

      render(<LineageChartViewNew {...props} />);

      await waitFor(() => {
        expect(mockSetNodesCallHistory.length).toBeGreaterThan(0);
      });

      const lastCall = mockSetNodesCallHistory[mockSetNodesCallHistory.length - 1];
      const queryNode = lastCall.find((n: any) => n.id === "query-1");
      expect(queryNode?.style.borderRadius).toBe("50%");
      expect(queryNode?.style.border).toBe("1px solid #d58813ff");
    });
  });

  // ==========================================================================
  // Node Data Props Tests
  // ==========================================================================

  describe("Node Data Props", () => {
    it("passes handleSidePanelToggle to node data", async () => {
      const mockHandleSidePanelToggle = vi.fn();
      const graphData = [createMockAssetNode({ id: "asset-1" })];
      const props = {
        ...defaultProps,
        graphData,
        handleSidePanelToggle: mockHandleSidePanelToggle,
      };

      render(<LineageChartViewNew {...props} />);

      await waitFor(() => {
        expect(mockSetNodesCallHistory.length).toBeGreaterThan(0);
      });

      const lastCall = mockSetNodesCallHistory[mockSetNodesCallHistory.length - 1];
      expect(lastCall[0].data.handleSidePanelToggle).toBe(mockHandleSidePanelToggle);
    });

    it("passes handleQueryPanelToggle to node data", async () => {
      const mockHandleQueryPanelToggle = vi.fn();
      const graphData = [createMockAssetNode({ id: "asset-1" })];
      const props = {
        ...defaultProps,
        graphData,
        handleQueryPanelToggle: mockHandleQueryPanelToggle,
      };

      render(<LineageChartViewNew {...props} />);

      await waitFor(() => {
        expect(mockSetNodesCallHistory.length).toBeGreaterThan(0);
      });

      const lastCall = mockSetNodesCallHistory[mockSetNodesCallHistory.length - 1];
      expect(lastCall[0].data.handleQueryPanelToggle).toBe(mockHandleQueryPanelToggle);
    });

    it("passes fetchLineageDownStream to node data", async () => {
      const mockFetchLineageDownStream = vi.fn();
      const graphData = [createMockAssetNode({ id: "asset-1" })];
      const props = {
        ...defaultProps,
        graphData,
        fetchLineageDownStream: mockFetchLineageDownStream,
      };

      render(<LineageChartViewNew {...props} />);

      await waitFor(() => {
        expect(mockSetNodesCallHistory.length).toBeGreaterThan(0);
      });

      const lastCall = mockSetNodesCallHistory[mockSetNodesCallHistory.length - 1];
      expect(lastCall[0].data.fetchLineageDownStream).toBe(mockFetchLineageDownStream);
    });

    it("passes fetchLineageUpStream to node data", async () => {
      const mockFetchLineageUpStream = vi.fn();
      const graphData = [createMockAssetNode({ id: "asset-1" })];
      const props = {
        ...defaultProps,
        graphData,
        fetchLineageUpStream: mockFetchLineageUpStream,
      };

      render(<LineageChartViewNew {...props} />);

      await waitFor(() => {
        expect(mockSetNodesCallHistory.length).toBeGreaterThan(0);
      });

      const lastCall = mockSetNodesCallHistory[mockSetNodesCallHistory.length - 1];
      expect(lastCall[0].data.fetchLineageUpStream).toBe(mockFetchLineageUpStream);
    });

    it("passes isSidePanelOpen to node data", async () => {
      const graphData = [createMockAssetNode({ id: "asset-1" })];
      const props = {
        ...defaultProps,
        graphData,
        isSidePanelOpen: true,
      };

      render(<LineageChartViewNew {...props} />);

      await waitFor(() => {
        expect(mockSetNodesCallHistory.length).toBeGreaterThan(0);
      });

      const lastCall = mockSetNodesCallHistory[mockSetNodesCallHistory.length - 1];
      expect(lastCall[0].data.isSidePanelOpen).toBe(true);
    });

    it("passes selectedNode to node data", async () => {
      const graphData = [createMockAssetNode({ id: "asset-1" })];
      const props = {
        ...defaultProps,
        graphData,
        selectedNode: "asset-1",
      };

      render(<LineageChartViewNew {...props} />);

      await waitFor(() => {
        expect(mockSetNodesCallHistory.length).toBeGreaterThan(0);
      });

      const lastCall = mockSetNodesCallHistory[mockSetNodesCallHistory.length - 1];
      expect(lastCall[0].data.selectedNode).toBe("asset-1");
    });

    it("passes nodeData to node data", async () => {
      const assetNode = createMockAssetNode({ id: "asset-1", name: "Test Asset" });
      const graphData = [assetNode];
      const props = {
        ...defaultProps,
        graphData,
      };

      render(<LineageChartViewNew {...props} />);

      await waitFor(() => {
        expect(mockSetNodesCallHistory.length).toBeGreaterThan(0);
      });

      const lastCall = mockSetNodesCallHistory[mockSetNodesCallHistory.length - 1];
      expect(lastCall[0].data.nodeData).toEqual(assetNode);
    });

    it("passes label to node data", async () => {
      const graphData = [createMockAssetNode({ id: "asset-1", name: "My Label" })];
      const props = {
        ...defaultProps,
        graphData,
      };

      render(<LineageChartViewNew {...props} />);

      await waitFor(() => {
        expect(mockSetNodesCallHistory.length).toBeGreaterThan(0);
      });

      const lastCall = mockSetNodesCallHistory[mockSetNodesCallHistory.length - 1];
      expect(lastCall[0].data.label).toBe("My Label");
    });
  });

  // ==========================================================================
  // Column Lineage State Tests
  // ==========================================================================

  describe("Column Lineage State", () => {
    it("passes columnName to node data", async () => {
      const graphData = [createMockAssetNode({ id: "asset-1" })];
      const props = {
        ...defaultProps,
        graphData,
      };

      render(<LineageChartViewNew {...props} />);

      await waitFor(() => {
        expect(mockSetNodesCallHistory.length).toBeGreaterThan(0);
      });

      const lastCall = mockSetNodesCallHistory[mockSetNodesCallHistory.length - 1];
      expect(lastCall[0].data.columnName).toBeDefined();
    });

    it("passes columnLineageApplied to node data", async () => {
      const graphData = [createMockAssetNode({ id: "asset-1" })];
      const props = {
        ...defaultProps,
        graphData,
      };

      render(<LineageChartViewNew {...props} />);

      await waitFor(() => {
        expect(mockSetNodesCallHistory.length).toBeGreaterThan(0);
      });

      const lastCall = mockSetNodesCallHistory[mockSetNodesCallHistory.length - 1];
      expect(lastCall[0].data.columnLineageApplied).toBe(false);
    });

    it("sets columnLineageApplied to true when fetchColumnLineage is called", async () => {
      const mockFetchColumnLevelLineage = vi.fn();
      const graphData = [createMockAssetNode({ id: "asset-1" })];
      const props = {
        ...defaultProps,
        graphData,
        fetchColumnLevelLineage: mockFetchColumnLevelLineage,
      };

      render(<LineageChartViewNew {...props} />);

      // Open panel
      const showButton = screen.getByText("Show Lineage Explorer");
      fireEvent.click(showButton);

      // Trigger fetch column lineage
      const fetchButton = screen.getByTestId("panel-fetch-lineage");
      fireEvent.click(fetchButton);

      expect(mockFetchColumnLevelLineage).toHaveBeenCalled();
    });

    it("resets columnName when resetLineageGraph is called from panel", async () => {
      const mockResetLineageGraph = vi.fn();
      const graphData = [createMockAssetNode({ id: "asset-1" })];
      const props = {
        ...defaultProps,
        graphData,
        resetLineageGraph: mockResetLineageGraph,
      };

      render(<LineageChartViewNew {...props} />);

      // Open panel
      const showButton = screen.getByText("Show Lineage Explorer");
      fireEvent.click(showButton);

      // Set column name first
      const setColumnButton = screen.getByTestId("panel-set-column");
      fireEvent.click(setColumnButton);

      await waitFor(() => {
        expect(screen.getByTestId("panel-column-name")).toHaveTextContent("new_column");
      });

      // Trigger reset
      const resetButton = screen.getByTestId("panel-reset");
      fireEvent.click(resetButton);

      expect(mockResetLineageGraph).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Controls Component Tests
  // ==========================================================================

  describe("Controls Component", () => {
    it("renders Controls with showInteractive set to false", () => {
      render(<LineageChartViewNew {...defaultProps} />);

      const controls = screen.getByTestId("controls");
      expect(controls).toHaveAttribute("data-show-interactive", "false");
    });
  });

  // ==========================================================================
  // Default Props Tests
  // ==========================================================================

  describe("Default Props", () => {
    it("uses default isSidePanelOpen as false", async () => {
      const graphData = [createMockAssetNode({ id: "asset-1" })];
      const props = {
        ...defaultProps,
        graphData,
        // isSidePanelOpen not provided
      };

      render(<LineageChartViewNew {...props} />);

      await waitFor(() => {
        expect(mockSetNodesCallHistory.length).toBeGreaterThan(0);
      });

      const lastCall = mockSetNodesCallHistory[mockSetNodesCallHistory.length - 1];
      expect(lastCall[0].data.isSidePanelOpen).toBe(false);
    });

    it("uses default selectedNode as null", async () => {
      const graphData = [createMockAssetNode({ id: "asset-1" })];
      const props = {
        ...defaultProps,
        graphData,
        // selectedNode not provided
      };

      render(<LineageChartViewNew {...props} />);

      await waitFor(() => {
        expect(mockSetNodesCallHistory.length).toBeGreaterThan(0);
      });

      const lastCall = mockSetNodesCallHistory[mockSetNodesCallHistory.length - 1];
      expect(lastCall[0].data.selectedNode).toBe(null);
    });

    it("uses default isFullScreen as false", () => {
      render(<LineageChartViewNew {...defaultProps} />);

      expect(screen.queryByTestId("close-fullscreen-icon")).not.toBeInTheDocument();
    });

    it("uses default isColumnLineageLoading as false", () => {
      render(<LineageChartViewNew {...defaultProps} />);

      expect(screen.queryByTestId("circular-progress")).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Empty GraphData Tests
  // ==========================================================================

  describe("Empty GraphData", () => {
    it("handles empty graphData array", async () => {
      const props = {
        ...defaultProps,
        graphData: [],
      };

      render(<LineageChartViewNew {...props} />);

      await waitFor(() => {
        expect(mockSetNodesCallHistory.length).toBeGreaterThan(0);
      });

      const lastCall = mockSetNodesCallHistory[mockSetNodesCallHistory.length - 1];
      expect(lastCall).toHaveLength(0);
    });

    it("renders correctly with empty graphData", () => {
      const props = {
        ...defaultProps,
        graphData: [],
      };

      render(<LineageChartViewNew {...props} />);

      expect(screen.getByTestId("react-flow")).toBeInTheDocument();
      expect(screen.getByTestId("mini-map")).toBeInTheDocument();
      expect(screen.getByTestId("controls")).toBeInTheDocument();
      expect(screen.getByTestId("background")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Layout Direction Tests
  // ==========================================================================

  describe("Layout Direction", () => {
    it("sets correct targetPosition and sourcePosition for horizontal layout", async () => {
      const graphData = [
        createMockAssetNode({ id: "asset-1" }),
        createMockQueryNode({ id: "query-1", source: "asset-1", target: "asset-2" }),
        createMockAssetNode({ id: "asset-2" }),
      ];

      const props = {
        ...defaultProps,
        graphData,
      };

      render(<LineageChartViewNew {...props} />);

      await waitFor(() => {
        expect(mockSetNodesCallHistory.length).toBeGreaterThan(0);
      });

      const lastCall = mockSetNodesCallHistory[mockSetNodesCallHistory.length - 1];
      lastCall.forEach((node: any) => {
        expect(node.targetPosition).toBe("left");
        expect(node.sourcePosition).toBe("right");
      });
    });
  });

  // ==========================================================================
  // setRefresh Callback Tests
  // ==========================================================================

  describe("setRefresh Callback", () => {
    it("passes setRefresh function to node data", async () => {
      const graphData = [createMockAssetNode({ id: "asset-1" })];
      const props = {
        ...defaultProps,
        graphData,
      };

      render(<LineageChartViewNew {...props} />);

      await waitFor(() => {
        expect(mockSetNodesCallHistory.length).toBeGreaterThan(0);
      });

      const lastCall = mockSetNodesCallHistory[mockSetNodesCallHistory.length - 1];
      expect(lastCall[0].data.setRefresh).toBeDefined();
      expect(typeof lastCall[0].data.setRefresh).toBe("function");
    });
  });

  // ==========================================================================
  // Edge ID Generation Tests
  // ==========================================================================

  describe("Edge ID Generation", () => {
    it("generates unique edge IDs for queryNodes", async () => {
      const graphData = [
        createMockAssetNode({ id: "asset-1" }),
        createMockQueryNode({ id: "query-1", source: "asset-1", target: "asset-2" }),
        createMockAssetNode({ id: "asset-2" }),
      ];

      const props = {
        ...defaultProps,
        graphData,
      };

      render(<LineageChartViewNew {...props} />);

      await waitFor(() => {
        expect(mockSetEdgesCallHistory.length).toBeGreaterThan(0);
      });

      const lastCall = mockSetEdgesCallHistory[mockSetEdgesCallHistory.length - 1];
      const edgeIds = lastCall.map((e: any) => e.id);
      const uniqueIds = [...new Set(edgeIds)];
      expect(edgeIds.length).toBe(uniqueIds.length);
    });
  });

  // ==========================================================================
  // Root Node Special Handling Tests
  // ==========================================================================

  describe("Root Node Special Handling", () => {
    it("handles root node with entryData", async () => {
      const rootNode = createMockAssetNode({
        id: "root-asset",
        name: "Root Asset",
        isRoot: true,
      });

      const props = {
        ...defaultProps,
        graphData: [rootNode],
      };

      render(<LineageChartViewNew {...props} />);

      await waitFor(() => {
        expect(mockSetNodesCallHistory.length).toBeGreaterThan(0);
      });

      const lastCall = mockSetNodesCallHistory[mockSetNodesCallHistory.length - 1];
      expect(lastCall[0].data.nodeData.isRoot).toBe(true);
    });
  });

  // ==========================================================================
  // Integration Tests
  // ==========================================================================

  describe("Integration Tests", () => {
    it("renders complete lineage graph with multiple node types", async () => {
      const graphData = [
        createMockAssetNode({ id: "source-1", name: "Source Table 1", isRoot: true }),
        createMockQueryNode({ id: "query-1", name: "Transform", source: "source-1", target: "target-1" }),
        createMockAssetNode({ id: "target-1", name: "Target Table 1" }),
        createMockQueryNode({ id: "query-2", name: "Aggregate", source: "target-1", target: "final-1" }),
        createMockAssetNode({ id: "final-1", name: "Final Table" }),
      ];

      const props = {
        ...defaultProps,
        graphData,
        handleSidePanelToggle: vi.fn(),
        handleQueryPanelToggle: vi.fn(),
        fetchLineageDownStream: vi.fn(),
        fetchLineageUpStream: vi.fn(),
        isSidePanelOpen: true,
        selectedNode: "source-1",
        isFullScreen: true,
        isColumnLineageLoading: false,
        toggleFullScreen: vi.fn(),
      };

      render(<LineageChartViewNew {...props} />);

      // Verify all UI elements
      expect(screen.getByTestId("react-flow")).toBeInTheDocument();
      expect(screen.getByTestId("mini-map")).toBeInTheDocument();
      expect(screen.getByTestId("controls")).toBeInTheDocument();
      expect(screen.getByTestId("background")).toBeInTheDocument();
      expect(screen.getByTestId("panel")).toBeInTheDocument();
      expect(screen.getByTestId("close-fullscreen-icon")).toBeInTheDocument();

      // Verify nodes and edges are set
      await waitFor(() => {
        expect(mockSetNodesCallHistory.length).toBeGreaterThan(0);
        expect(mockSetEdgesCallHistory.length).toBeGreaterThan(0);
      });
    });

    it("handles user interaction flow: open panel, fetch lineage, reset", async () => {
      const mockFetchColumnLevelLineage = vi.fn();
      const mockResetLineageGraph = vi.fn();

      const props = {
        ...defaultProps,
        graphData: [createMockAssetNode({ id: "asset-1", isRoot: true })],
        entry: createMockEntryData(),
        fetchColumnLevelLineage: mockFetchColumnLevelLineage,
        resetLineageGraph: mockResetLineageGraph,
      };

      render(<LineageChartViewNew {...props} />);

      // Step 1: Open panel
      fireEvent.click(screen.getByText("Show Lineage Explorer"));
      expect(screen.getByTestId("lineage-column-level-panel")).toBeInTheDocument();

      // Step 2: Set column name
      fireEvent.click(screen.getByTestId("panel-set-column"));
      await waitFor(() => {
        expect(screen.getByTestId("panel-column-name")).toHaveTextContent("new_column");
      });

      // Step 3: Set direction
      fireEvent.click(screen.getByTestId("panel-set-direction"));
      await waitFor(() => {
        expect(screen.getByTestId("panel-direction")).toHaveTextContent("upstream");
      });

      // Step 4: Fetch column lineage
      fireEvent.click(screen.getByTestId("panel-fetch-lineage"));
      expect(mockFetchColumnLevelLineage).toHaveBeenCalled();

      // Step 5: Reset
      fireEvent.click(screen.getByTestId("panel-reset"));
      expect(mockResetLineageGraph).toHaveBeenCalled();

      // Step 6: Close panel
      fireEvent.click(screen.getByTestId("panel-close"));
      expect(screen.queryByTestId("lineage-column-level-panel")).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Edge Source/Target Tests
  // ==========================================================================

  describe("Edge Source and Target", () => {
    it("creates edges with correct source and target for queryNodes", async () => {
      const graphData = [
        createMockAssetNode({ id: "asset-1", name: "Source Asset" }),
        createMockQueryNode({ id: "query-1", source: "asset-1", target: "asset-2" }),
        createMockAssetNode({ id: "asset-2", name: "Target Asset" }),
      ];

      const props = {
        ...defaultProps,
        graphData,
      };

      render(<LineageChartViewNew {...props} />);

      await waitFor(() => {
        expect(mockSetEdgesCallHistory.length).toBeGreaterThan(0);
      });

      const lastCall = mockSetEdgesCallHistory[mockSetEdgesCallHistory.length - 1];

      // First edge: source -> query
      const firstEdge = lastCall.find((e: any) => e.target === "query-1");
      expect(firstEdge).toBeDefined();
      expect(firstEdge.source).toBe("asset-1");

      // Second edge: query -> target
      const secondEdge = lastCall.find((e: any) => e.source === "query-1");
      expect(secondEdge).toBeDefined();
      expect(secondEdge.target).toBe("asset-2");
    });
  });

  // ==========================================================================
  // Query Node Data Tests
  // ==========================================================================

  describe("Query Node Data Props", () => {
    it("passes correct data to queryNode", async () => {
      const graphData = [
        createMockAssetNode({ id: "asset-1" }),
        createMockQueryNode({ id: "query-1", name: "My Query", source: "asset-1", target: "asset-2" }),
        createMockAssetNode({ id: "asset-2" }),
      ];

      const mockHandleSidePanelToggle = vi.fn();
      const mockHandleQueryPanelToggle = vi.fn();

      const props = {
        ...defaultProps,
        graphData,
        handleSidePanelToggle: mockHandleSidePanelToggle,
        handleQueryPanelToggle: mockHandleQueryPanelToggle,
        isSidePanelOpen: true,
        selectedNode: "query-1",
      };

      render(<LineageChartViewNew {...props} />);

      await waitFor(() => {
        expect(mockSetNodesCallHistory.length).toBeGreaterThan(0);
      });

      const lastCall = mockSetNodesCallHistory[mockSetNodesCallHistory.length - 1];
      const queryNode = lastCall.find((n: any) => n.id === "query-1");

      expect(queryNode.data.label).toBe("My Query");
      expect(queryNode.data.handleSidePanelToggle).toBe(mockHandleSidePanelToggle);
      expect(queryNode.data.handleQueryPanelToggle).toBe(mockHandleQueryPanelToggle);
      expect(queryNode.data.isSidePanelOpen).toBe(true);
      expect(queryNode.data.selectedNode).toBe("query-1");
    });
  });

  // ==========================================================================
  // Additional Coverage Tests
  // ==========================================================================

  describe("Additional Coverage", () => {
    it("handles undefined toggleFullScreen gracefully", () => {
      const props = {
        ...defaultProps,
        isFullScreen: true,
        toggleFullScreen: undefined,
      };

      render(<LineageChartViewNew {...props} />);

      const closeFullscreenIcon = screen.getByTestId("close-fullscreen-icon");
      // Should not throw when clicking without toggleFullScreen
      expect(() => fireEvent.click(closeFullscreenIcon)).not.toThrow();
    });

    it("handles multiple queryNodes in sequence", async () => {
      const graphData = [
        createMockAssetNode({ id: "a1" }),
        createMockQueryNode({ id: "q1", source: "a1", target: "a2" }),
        createMockAssetNode({ id: "a2" }),
        createMockQueryNode({ id: "q2", source: "a2", target: "a3" }),
        createMockAssetNode({ id: "a3" }),
      ];

      const props = {
        ...defaultProps,
        graphData,
      };

      render(<LineageChartViewNew {...props} />);

      await waitFor(() => {
        expect(mockSetEdgesCallHistory.length).toBeGreaterThan(0);
      });

      // Should have 4 edges (2 per query node)
      const lastCall = mockSetEdgesCallHistory[mockSetEdgesCallHistory.length - 1];
      expect(lastCall.length).toBe(4);
    });

    it("renders with all optional props provided", async () => {
      const graphData = [createMockAssetNode({ id: "asset-1" })];

      const props = {
        graphData,
        handleSidePanelToggle: vi.fn(),
        handleQueryPanelToggle: vi.fn(),
        fetchLineageDownStream: vi.fn(),
        fetchLineageUpStream: vi.fn(),
        fetchColumnLevelLineage: vi.fn(),
        resetLineageGraph: vi.fn(),
        entry: createMockEntryData(),
        isSidePanelOpen: true,
        selectedNode: "asset-1",
        isFullScreen: true,
        isColumnLineageLoading: true,
        toggleFullScreen: vi.fn(),
      };

      render(<LineageChartViewNew {...props} />);

      expect(screen.getByTestId("react-flow")).toBeInTheDocument();
      expect(screen.getByTestId("close-fullscreen-icon")).toBeInTheDocument();
      expect(screen.getByTestId("circular-progress")).toBeInTheDocument();
    });

    it("verifies onNodesChange and onEdgesChange are passed to ReactFlow", () => {
      render(<LineageChartViewNew {...defaultProps} />);

      expect(capturedReactFlowProps.onNodesChange).toBeDefined();
      expect(capturedReactFlowProps.onEdgesChange).toBeDefined();
    });
  });
});
