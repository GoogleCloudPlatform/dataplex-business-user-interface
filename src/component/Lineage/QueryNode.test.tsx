import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import QueryNode from "./QueryNode";

// Mock @xyflow/react
vi.mock("@xyflow/react", () => ({
  Handle: ({ type, position, isConnectable, onConnect }: any) => (
    <div
      data-testid={`handle-${type}`}
      data-position={position}
      data-connectable={String(isConnectable)}
      onClick={() => onConnect && onConnect({ source: "test-source", target: "test-target" })}
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

// ============================================================================
// Mock Data Generators
// ============================================================================

const createMockNodeData = (overrides: Record<string, any> = {}) => ({
  name: "test-query-node",
  ...overrides,
});

const createMockData = (options: {
  nodeData?: Record<string, any>;
  handleQueryPanelToggle?: () => void;
} = {}) => {
  const {
    nodeData = createMockNodeData(),
    handleQueryPanelToggle = vi.fn(),
  } = options;

  return {
    nodeData,
    handleQueryPanelToggle,
  };
};

// ============================================================================
// Test Suite
// ============================================================================

describe("QueryNode", () => {
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
      const data = createMockData();
      render(<QueryNode data={data} isConnectable={true} />);

      // Should render the query icon image
      const image = screen.getByRole("img");
      expect(image).toBeInTheDocument();
    });

    it("renders the query icon image with correct attributes", () => {
      const nodeData = createMockNodeData({ name: "My Query" });
      const data = createMockData({ nodeData });

      render(<QueryNode data={data} isConnectable={true} />);

      const image = screen.getByRole("img");
      expect(image).toHaveAttribute("src", "/assets/svg/query-icon.svg");
      expect(image).toHaveAttribute("alt", "My Query");
      expect(image).toHaveStyle({ width: "30px", height: "30px" });
    });

    it("renders with custom node name in alt attribute", () => {
      const nodeData = createMockNodeData({ name: "Custom Query Name" });
      const data = createMockData({ nodeData });

      render(<QueryNode data={data} isConnectable={true} />);

      const image = screen.getByRole("img");
      expect(image).toHaveAttribute("alt", "Custom Query Name");
    });

    it("renders target Handle component", () => {
      const data = createMockData();
      render(<QueryNode data={data} isConnectable={true} />);

      const targetHandle = screen.getByTestId("handle-target");
      expect(targetHandle).toBeInTheDocument();
      expect(targetHandle).toHaveAttribute("data-position", "left");
    });

    it("renders source Handle component", () => {
      const data = createMockData();
      render(<QueryNode data={data} isConnectable={true} />);

      const sourceHandle = screen.getByTestId("handle-source");
      expect(sourceHandle).toBeInTheDocument();
      expect(sourceHandle).toHaveAttribute("data-position", "right");
    });

    it("renders both Handle components", () => {
      const data = createMockData();
      render(<QueryNode data={data} isConnectable={true} />);

      expect(screen.getByTestId("handle-target")).toBeInTheDocument();
      expect(screen.getByTestId("handle-source")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // isConnectable Prop Tests
  // ==========================================================================

  describe("isConnectable Prop", () => {
    it("passes isConnectable=true to target Handle", () => {
      const data = createMockData();
      render(<QueryNode data={data} isConnectable={true} />);

      const targetHandle = screen.getByTestId("handle-target");
      expect(targetHandle).toHaveAttribute("data-connectable", "true");
    });

    it("passes isConnectable=true to source Handle", () => {
      const data = createMockData();
      render(<QueryNode data={data} isConnectable={true} />);

      const sourceHandle = screen.getByTestId("handle-source");
      expect(sourceHandle).toHaveAttribute("data-connectable", "true");
    });

    it("passes isConnectable=false to target Handle", () => {
      const data = createMockData();
      render(<QueryNode data={data} isConnectable={false} />);

      const targetHandle = screen.getByTestId("handle-target");
      expect(targetHandle).toHaveAttribute("data-connectable", "false");
    });

    it("passes isConnectable=false to source Handle", () => {
      const data = createMockData();
      render(<QueryNode data={data} isConnectable={false} />);

      const sourceHandle = screen.getByTestId("handle-source");
      expect(sourceHandle).toHaveAttribute("data-connectable", "false");
    });

    it("handles undefined isConnectable", () => {
      const data = createMockData();
      render(<QueryNode data={data} isConnectable={undefined} />);

      const targetHandle = screen.getByTestId("handle-target");
      const sourceHandle = screen.getByTestId("handle-source");
      expect(targetHandle).toHaveAttribute("data-connectable", "undefined");
      expect(sourceHandle).toHaveAttribute("data-connectable", "undefined");
    });
  });

  // ==========================================================================
  // Click Handler Tests
  // ==========================================================================

  describe("Click Handler", () => {
    it("calls handleQueryPanelToggle when box is clicked", () => {
      const mockHandleQueryPanelToggle = vi.fn();
      const nodeData = createMockNodeData({ name: "Clickable Query" });
      const data = createMockData({
        nodeData,
        handleQueryPanelToggle: mockHandleQueryPanelToggle,
      });

      render(<QueryNode data={data} isConnectable={true} />);

      const image = screen.getByRole("img");
      const box = image.parentElement?.parentElement;
      fireEvent.click(box!);

      expect(mockHandleQueryPanelToggle).toHaveBeenCalledTimes(1);
      expect(mockHandleQueryPanelToggle).toHaveBeenCalledWith(nodeData);
    });

    it("passes correct nodeData to handleQueryPanelToggle", () => {
      const mockHandleQueryPanelToggle = vi.fn();
      const nodeData = createMockNodeData({
        name: "Query With Data",
        id: "query-123",
        customField: "custom-value",
      });
      const data = createMockData({
        nodeData,
        handleQueryPanelToggle: mockHandleQueryPanelToggle,
      });

      render(<QueryNode data={data} isConnectable={true} />);

      const image = screen.getByRole("img");
      const box = image.parentElement?.parentElement;
      fireEvent.click(box!);

      expect(mockHandleQueryPanelToggle).toHaveBeenCalledWith({
        name: "Query With Data",
        id: "query-123",
        customField: "custom-value",
      });
    });

    it("stops event propagation on click", () => {
      const mockHandleQueryPanelToggle = vi.fn();
      const data = createMockData({
        handleQueryPanelToggle: mockHandleQueryPanelToggle,
      });

      render(<QueryNode data={data} isConnectable={true} />);

      const image = screen.getByRole("img");
      const box = image.parentElement?.parentElement;

      const clickEvent = new MouseEvent("click", { bubbles: true });
      const stopPropagationSpy = vi.spyOn(clickEvent, "stopPropagation");

      box!.dispatchEvent(clickEvent);

      expect(stopPropagationSpy).toHaveBeenCalled();
    });

    it("handles multiple clicks", () => {
      const mockHandleQueryPanelToggle = vi.fn();
      const nodeData = createMockNodeData();
      const data = createMockData({
        nodeData,
        handleQueryPanelToggle: mockHandleQueryPanelToggle,
      });

      render(<QueryNode data={data} isConnectable={true} />);

      const image = screen.getByRole("img");
      const box = image.parentElement?.parentElement;

      fireEvent.click(box!);
      fireEvent.click(box!);
      fireEvent.click(box!);

      expect(mockHandleQueryPanelToggle).toHaveBeenCalledTimes(3);
    });
  });

  // ==========================================================================
  // Handle onConnect Tests
  // ==========================================================================

  describe("Handle onConnect", () => {
    it("logs to console when target handle onConnect is triggered", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const data = createMockData();

      render(<QueryNode data={data} isConnectable={true} />);

      const targetHandle = screen.getByTestId("handle-target");
      fireEvent.click(targetHandle);

      expect(consoleSpy).toHaveBeenCalledWith("handle onConnect", {
        source: "test-source",
        target: "test-target",
      });

      consoleSpy.mockRestore();
    });
  });

  // ==========================================================================
  // Node Data Variations Tests
  // ==========================================================================

  describe("Node Data Variations", () => {
    it("handles nodeData with minimal properties", () => {
      const nodeData = { name: "Minimal" };
      const data = createMockData({ nodeData });

      render(<QueryNode data={data} isConnectable={true} />);

      const image = screen.getByRole("img");
      expect(image).toHaveAttribute("alt", "Minimal");
    });

    it("handles nodeData with empty name", () => {
      const nodeData = createMockNodeData({ name: "" });
      const data = createMockData({ nodeData });

      const { container } = render(<QueryNode data={data} isConnectable={true} />);

      // Images with empty alt have role "presentation" per accessibility standards
      const image = container.querySelector('img');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute("alt", "");
    });

    it("handles nodeData with special characters in name", () => {
      const nodeData = createMockNodeData({ name: "Query <test> & 'special'" });
      const data = createMockData({ nodeData });

      render(<QueryNode data={data} isConnectable={true} />);

      const image = screen.getByRole("img");
      expect(image).toHaveAttribute("alt", "Query <test> & 'special'");
    });

    it("handles nodeData with numeric name", () => {
      const nodeData = createMockNodeData({ name: 12345 });
      const data = createMockData({ nodeData });

      render(<QueryNode data={data} isConnectable={true} />);

      const image = screen.getByRole("img");
      expect(image).toHaveAttribute("alt", "12345");
    });

    it("handles nodeData with additional properties", () => {
      const mockHandleQueryPanelToggle = vi.fn();
      const nodeData = createMockNodeData({
        name: "Extended Query",
        id: "ext-123",
        type: "sql",
        metadata: { created: "2024-01-01" },
      });
      const data = createMockData({
        nodeData,
        handleQueryPanelToggle: mockHandleQueryPanelToggle,
      });

      render(<QueryNode data={data} isConnectable={true} />);

      const image = screen.getByRole("img");
      const box = image.parentElement?.parentElement;
      fireEvent.click(box!);

      expect(mockHandleQueryPanelToggle).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Extended Query",
          id: "ext-123",
          type: "sql",
          metadata: { created: "2024-01-01" },
        })
      );
    });
  });

  // ==========================================================================
  // Component Structure Tests
  // ==========================================================================

  describe("Component Structure", () => {
    it("renders with correct DOM structure", () => {
      const data = createMockData();
      const { container } = render(<QueryNode data={data} isConnectable={true} />);

      // Should have target handle, content box, and source handle
      const handles = container.querySelectorAll('[data-testid^="handle-"]');
      expect(handles).toHaveLength(2);

      const image = screen.getByRole("img");
      expect(image).toBeInTheDocument();
    });

    it("image is nested within flex container", () => {
      const data = createMockData();
      render(<QueryNode data={data} isConnectable={true} />);

      const image = screen.getByRole("img");
      const flexContainer = image.parentElement;

      // The parent should be the flex container Box
      expect(flexContainer).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe("Edge Cases", () => {
    it("handles undefined nodeData properties gracefully", () => {
      const nodeData = { name: undefined };
      const data = createMockData({ nodeData: nodeData as any });

      render(<QueryNode data={data} isConnectable={true} />);

      const image = screen.getByRole("img");
      expect(image).toBeInTheDocument();
    });

    it("handles null values in nodeData", () => {
      const mockHandleQueryPanelToggle = vi.fn();
      const nodeData = createMockNodeData({ name: null, extra: null });
      const data = createMockData({
        nodeData: nodeData as any,
        handleQueryPanelToggle: mockHandleQueryPanelToggle,
      });

      render(<QueryNode data={data} isConnectable={true} />);

      const image = screen.getByRole("img");
      const box = image.parentElement?.parentElement;
      fireEvent.click(box!);

      expect(mockHandleQueryPanelToggle).toHaveBeenCalledWith(
        expect.objectContaining({ name: null })
      );
    });

    it("renders correctly when isConnectable is a truthy non-boolean", () => {
      const data = createMockData();
      render(<QueryNode data={data} isConnectable={"yes" as any} />);

      const targetHandle = screen.getByTestId("handle-target");
      const sourceHandle = screen.getByTestId("handle-source");
      expect(targetHandle).toHaveAttribute("data-connectable", "yes");
      expect(sourceHandle).toHaveAttribute("data-connectable", "yes");
    });

    it("handles long node names", () => {
      const longName = "A".repeat(500);
      const nodeData = createMockNodeData({ name: longName });
      const data = createMockData({ nodeData });

      render(<QueryNode data={data} isConnectable={true} />);

      const image = screen.getByRole("img");
      expect(image).toHaveAttribute("alt", longName);
    });
  });

  // ==========================================================================
  // Memoization Tests
  // ==========================================================================

  describe("Memoization", () => {
    it("renders consistently with same props", () => {
      const data = createMockData();

      const { rerender } = render(<QueryNode data={data} isConnectable={true} />);

      const firstImage = screen.getByRole("img");
      expect(firstImage).toHaveAttribute("alt", "test-query-node");

      rerender(<QueryNode data={data} isConnectable={true} />);

      const secondImage = screen.getByRole("img");
      expect(secondImage).toHaveAttribute("alt", "test-query-node");
    });

    it("updates when props change", () => {
      const data1 = createMockData({ nodeData: createMockNodeData({ name: "First" }) });
      const data2 = createMockData({ nodeData: createMockNodeData({ name: "Second" }) });

      const { rerender } = render(<QueryNode data={data1} isConnectable={true} />);

      expect(screen.getByRole("img")).toHaveAttribute("alt", "First");

      rerender(<QueryNode data={data2} isConnectable={true} />);

      expect(screen.getByRole("img")).toHaveAttribute("alt", "Second");
    });
  });
});
