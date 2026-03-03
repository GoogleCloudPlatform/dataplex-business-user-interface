import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SidebarItem from "./SidebarItem";
import { type GlossaryItem, type ItemType } from "./GlossaryDataType";

// Mock getIcon from glossaryUIHelpers
vi.mock("./glossaryUIHelpers", () => ({
  getIcon: vi.fn((type: ItemType, size: string) => (
    <span data-testid={`icon-${type}`} data-size={size}>
      {type} icon
    </span>
  )),
}));

// Helper function to create mock GlossaryItem
const createMockItem = (
  id: string,
  type: ItemType,
  displayName: string,
  options: Partial<GlossaryItem> = {}
): GlossaryItem => ({
  id,
  type,
  displayName,
  ...options,
});

describe("SidebarItem", () => {
  const mockOnSelect = vi.fn();
  const mockOnToggle = vi.fn();

  const defaultProps = {
    selectedId: "",
    expandedIds: new Set<string>(),
    onSelect: mockOnSelect,
    onToggle: mockOnToggle,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("renders a glossary item with display name", () => {
      const item = createMockItem("glossary-1", "glossary", "Test Glossary");

      render(<SidebarItem item={item} {...defaultProps} />);

      expect(screen.getByText("Test Glossary")).toBeInTheDocument();
    });

    it("renders a category item with display name", () => {
      const item = createMockItem("category-1", "category", "Test Category");

      render(<SidebarItem item={item} {...defaultProps} />);

      expect(screen.getByText("Test Category")).toBeInTheDocument();
    });

    it("renders a term item with display name", () => {
      const item = createMockItem("term-1", "term", "Test Term");

      render(<SidebarItem item={item} {...defaultProps} />);

      expect(screen.getByText("Test Term")).toBeInTheDocument();
    });

    it("renders the correct icon for glossary type", () => {
      const item = createMockItem("glossary-1", "glossary", "Test Glossary");

      render(<SidebarItem item={item} {...defaultProps} />);

      expect(screen.getByTestId("icon-glossary")).toBeInTheDocument();
    });

    it("renders the correct icon for category type", () => {
      const item = createMockItem("category-1", "category", "Test Category");

      render(<SidebarItem item={item} {...defaultProps} />);

      expect(screen.getByTestId("icon-category")).toBeInTheDocument();
    });

    it("renders the correct icon for term type", () => {
      const item = createMockItem("term-1", "term", "Test Term");

      render(<SidebarItem item={item} {...defaultProps} />);

      expect(screen.getByTestId("icon-term")).toBeInTheDocument();
    });
  });

  describe("Selection State", () => {
    it("applies selected styling when item is selected", () => {
      const item = createMockItem("glossary-1", "glossary", "Test Glossary");

      render(
        <SidebarItem
          item={item}
          {...defaultProps}
          selectedId="glossary-1"
        />
      );

      const listItemButton = screen.getByRole("button");
      expect(listItemButton).toHaveClass("Mui-selected");
    });

    it("does not apply selected styling when item is not selected", () => {
      const item = createMockItem("glossary-1", "glossary", "Test Glossary");

      render(
        <SidebarItem
          item={item}
          {...defaultProps}
          selectedId="other-id"
        />
      );

      const listItemButton = screen.getByRole("button");
      expect(listItemButton).not.toHaveClass("Mui-selected");
    });

    it("does not apply selected styling when item is inaccessible even if selectedId matches", () => {
      const item = createMockItem("glossary-1", "glossary", "Test Glossary", {
        isInaccessible: true,
      });

      render(
        <SidebarItem
          item={item}
          {...defaultProps}
          selectedId="glossary-1"
        />
      );

      const listItemButton = screen.getByRole("button");
      expect(listItemButton).not.toHaveClass("Mui-selected");
    });
  });

  describe("Click Handlers", () => {
    it("calls onSelect when item is clicked", () => {
      const item = createMockItem("glossary-1", "glossary", "Test Glossary");

      render(<SidebarItem item={item} {...defaultProps} />);

      fireEvent.click(screen.getByRole("button"));

      expect(mockOnSelect).toHaveBeenCalledWith("glossary-1");
    });

    it("calls onToggle when item is clicked and not expanded", () => {
      const item = createMockItem("glossary-1", "glossary", "Test Glossary");

      render(<SidebarItem item={item} {...defaultProps} />);

      fireEvent.click(screen.getByRole("button"));

      expect(mockOnToggle).toHaveBeenCalledWith("glossary-1");
    });

    it("does not call onToggle when item is clicked and already expanded", () => {
      const item = createMockItem("glossary-1", "glossary", "Test Glossary");
      const expandedIds = new Set(["glossary-1"]);

      render(
        <SidebarItem
          item={item}
          {...defaultProps}
          expandedIds={expandedIds}
        />
      );

      fireEvent.click(screen.getByRole("button"));

      expect(mockOnSelect).toHaveBeenCalledWith("glossary-1");
      expect(mockOnToggle).not.toHaveBeenCalled();
    });

    it("does not call handlers when inaccessible item is clicked", () => {
      const item = createMockItem("glossary-1", "glossary", "Test Glossary", {
        isInaccessible: true,
      });

      render(<SidebarItem item={item} {...defaultProps} />);

      fireEvent.click(screen.getByRole("button"));

      expect(mockOnSelect).not.toHaveBeenCalled();
      expect(mockOnToggle).not.toHaveBeenCalled();
    });
  });

  describe("Chevron/Expand Icon", () => {
    it("shows expand icon for glossary items", () => {
      const item = createMockItem("glossary-1", "glossary", "Test Glossary");

      render(<SidebarItem item={item} {...defaultProps} />);

      expect(screen.getByTestId("ExpandMoreIcon")).toBeInTheDocument();
    });

    it("shows expand icon for category items", () => {
      const item = createMockItem("category-1", "category", "Test Category");

      render(<SidebarItem item={item} {...defaultProps} />);

      expect(screen.getByTestId("ExpandMoreIcon")).toBeInTheDocument();
    });

    it("hides expand icon for term items (display: none)", () => {
      const item = createMockItem("term-1", "term", "Test Term");

      render(<SidebarItem item={item} {...defaultProps} />);

      // The icon is still rendered but hidden via display: none
      const expandIcon = screen.getByTestId("ExpandMoreIcon");
      const iconContainer = expandIcon.parentElement;
      expect(iconContainer).toHaveStyle({ display: "none" });
    });

    it("calls both onToggle and onSelect when chevron is clicked", () => {
      const item = createMockItem("glossary-1", "glossary", "Test Glossary");

      render(<SidebarItem item={item} {...defaultProps} />);

      const expandIcon = screen.getByTestId("ExpandMoreIcon");
      const iconContainer = expandIcon.parentElement;

      fireEvent.click(iconContainer!);

      expect(mockOnToggle).toHaveBeenCalledWith("glossary-1");
      expect(mockOnSelect).toHaveBeenCalledWith("glossary-1");
    });

    it("does not call handlers when chevron is clicked on inaccessible item", () => {
      const item = createMockItem("glossary-1", "glossary", "Test Glossary", {
        isInaccessible: true,
      });

      render(<SidebarItem item={item} {...defaultProps} />);

      const expandIcon = screen.getByTestId("ExpandMoreIcon");
      const iconContainer = expandIcon.parentElement;

      fireEvent.click(iconContainer!);

      expect(mockOnToggle).not.toHaveBeenCalled();
      expect(mockOnSelect).not.toHaveBeenCalled();
    });

    it("rotates chevron when item is expanded", () => {
      const item = createMockItem("glossary-1", "glossary", "Test Glossary");
      const expandedIds = new Set(["glossary-1"]);

      render(
        <SidebarItem
          item={item}
          {...defaultProps}
          expandedIds={expandedIds}
        />
      );

      const expandIcon = screen.getByTestId("ExpandMoreIcon");
      const iconContainer = expandIcon.parentElement;

      expect(iconContainer).toHaveStyle({ transform: "rotate(0deg)" });
    });

    it("shows chevron rotated -90deg when item is collapsed", () => {
      const item = createMockItem("glossary-1", "glossary", "Test Glossary");

      render(<SidebarItem item={item} {...defaultProps} />);

      const expandIcon = screen.getByTestId("ExpandMoreIcon");
      const iconContainer = expandIcon.parentElement;

      expect(iconContainer).toHaveStyle({ transform: "rotate(-90deg)" });
    });
  });

  describe("Inaccessible Items", () => {
    it("disables the button for inaccessible items", () => {
      const item = createMockItem("glossary-1", "glossary", "Test Glossary", {
        isInaccessible: true,
      });

      render(<SidebarItem item={item} {...defaultProps} />);

      const button = screen.getByRole("button");
      // MUI ListItemButton uses aria-disabled instead of disabled attribute
      expect(button).toHaveAttribute("aria-disabled", "true");
      expect(button).toHaveClass("Mui-disabled");
    });

    it("shows lock icon instead of type icon for inaccessible items", () => {
      const item = createMockItem("glossary-1", "glossary", "Test Glossary", {
        isInaccessible: true,
      });

      render(<SidebarItem item={item} {...defaultProps} />);

      expect(screen.getByTestId("LockOutlinedIcon")).toBeInTheDocument();
      expect(screen.queryByTestId("icon-glossary")).not.toBeInTheDocument();
    });

    it("wraps inaccessible item in tooltip", () => {
      const item = createMockItem("glossary-1", "glossary", "Test Glossary", {
        isInaccessible: true,
      });

      render(<SidebarItem item={item} {...defaultProps} />);

      // Hover to show tooltip
      const button = screen.getByRole("button");
      fireEvent.mouseOver(button);

      // Check that the item has a wrapper span (for tooltip)
      expect(button.parentElement?.tagName).toBe("SPAN");
    });

    it("does not wrap accessible item in tooltip span", () => {
      const item = createMockItem("glossary-1", "glossary", "Test Glossary");

      render(<SidebarItem item={item} {...defaultProps} />);

      const button = screen.getByRole("button");
      // The parent should not be a span wrapper for tooltip
      expect(button.parentElement?.tagName).not.toBe("SPAN");
    });
  });

  describe("Depth and Indentation", () => {
    it("applies default depth of 0", () => {
      const item = createMockItem("glossary-1", "glossary", "Test Glossary");

      render(<SidebarItem item={item} {...defaultProps} />);

      const button = screen.getByRole("button");
      // Default depth = 0, indent = 0 * 20 = 0, ml = 20 + 0 = 20px
      expect(button).toHaveStyle({ marginLeft: "20px" });
    });

    it("applies correct indentation for depth 1", () => {
      const item = createMockItem("category-1", "category", "Test Category");

      render(<SidebarItem item={item} {...defaultProps} depth={1} />);

      const button = screen.getByRole("button");
      // depth = 1, indent = 1 * 20 = 20, ml = 20 + 20 = 40px
      expect(button).toHaveStyle({ marginLeft: "40px" });
    });

    it("applies correct indentation for depth 2", () => {
      const item = createMockItem("term-1", "term", "Test Term");

      render(<SidebarItem item={item} {...defaultProps} depth={2} />);

      const button = screen.getByRole("button");
      // depth = 2, indent = 2 * 20 = 40, ml = 20 + 40 = 60px
      expect(button).toHaveStyle({ marginLeft: "60px" });
    });
  });

  describe("Children Rendering", () => {
    it("renders children when item is expanded", () => {
      const childItem = createMockItem("child-1", "term", "Child Term");
      const item = createMockItem("glossary-1", "glossary", "Test Glossary", {
        children: [childItem],
      });
      const expandedIds = new Set(["glossary-1"]);

      render(
        <SidebarItem
          item={item}
          {...defaultProps}
          expandedIds={expandedIds}
        />
      );

      expect(screen.getByText("Child Term")).toBeInTheDocument();
    });

    it("does not render children when item is collapsed", () => {
      const childItem = createMockItem("child-1", "term", "Child Term");
      const item = createMockItem("glossary-1", "glossary", "Test Glossary", {
        children: [childItem],
      });

      render(<SidebarItem item={item} {...defaultProps} />);

      // Due to unmountOnExit, children should not be in DOM
      expect(screen.queryByText("Child Term")).not.toBeInTheDocument();
    });

    it("renders multiple children correctly", () => {
      const children = [
        createMockItem("child-1", "category", "Child Category"),
        createMockItem("child-2", "term", "Child Term 1"),
        createMockItem("child-3", "term", "Child Term 2"),
      ];
      const item = createMockItem("glossary-1", "glossary", "Test Glossary", {
        children,
      });
      const expandedIds = new Set(["glossary-1"]);

      render(
        <SidebarItem
          item={item}
          {...defaultProps}
          expandedIds={expandedIds}
        />
      );

      expect(screen.getByText("Child Category")).toBeInTheDocument();
      expect(screen.getByText("Child Term 1")).toBeInTheDocument();
      expect(screen.getByText("Child Term 2")).toBeInTheDocument();
    });

    it("passes incremented depth to children", () => {
      const grandchild = createMockItem("grandchild-1", "term", "Grandchild Term");
      const child = createMockItem("child-1", "category", "Child Category", {
        children: [grandchild],
      });
      const item = createMockItem("glossary-1", "glossary", "Test Glossary", {
        children: [child],
      });
      const expandedIds = new Set(["glossary-1", "child-1"]);

      render(
        <SidebarItem
          item={item}
          {...defaultProps}
          expandedIds={expandedIds}
        />
      );

      // Find grandchild button and check indentation
      const grandchildText = screen.getByText("Grandchild Term");
      const grandchildButton = grandchildText.closest('[role="button"]');

      // depth = 2, indent = 2 * 20 = 40, ml = 20 + 40 = 60px
      expect(grandchildButton).toHaveStyle({ marginLeft: "60px" });
    });

    it("does not render Collapse when there are no children", () => {
      const item = createMockItem("term-1", "term", "Test Term");

      const { container } = render(<SidebarItem item={item} {...defaultProps} />);

      // No collapse element should exist
      expect(container.querySelector(".MuiCollapse-root")).not.toBeInTheDocument();
    });

    it("renders nested children with selection working correctly", () => {
      const child = createMockItem("child-1", "term", "Child Term");
      const item = createMockItem("glossary-1", "glossary", "Test Glossary", {
        children: [child],
      });
      const expandedIds = new Set(["glossary-1"]);

      render(
        <SidebarItem
          item={item}
          {...defaultProps}
          expandedIds={expandedIds}
          selectedId="child-1"
        />
      );

      // Find child button and verify it's selected
      const childText = screen.getByText("Child Term");
      const childButton = childText.closest('[role="button"]');
      expect(childButton).toHaveClass("Mui-selected");
    });
  });

  describe("Empty Children Array", () => {
    it("handles empty children array without crashing", () => {
      const item = createMockItem("glossary-1", "glossary", "Test Glossary", {
        children: [],
      });

      render(<SidebarItem item={item} {...defaultProps} />);

      expect(screen.getByText("Test Glossary")).toBeInTheDocument();
    });

    it("handles undefined children without crashing", () => {
      const item = createMockItem("glossary-1", "glossary", "Test Glossary");
      // children is undefined by default

      render(<SidebarItem item={item} {...defaultProps} />);

      expect(screen.getByText("Test Glossary")).toBeInTheDocument();
    });
  });

  describe("Event Propagation", () => {
    it("stops propagation when chevron is clicked", () => {
      const item = createMockItem("glossary-1", "glossary", "Test Glossary");

      render(<SidebarItem item={item} {...defaultProps} />);

      const expandIcon = screen.getByTestId("ExpandMoreIcon");
      const iconContainer = expandIcon.parentElement;

      // Click on chevron
      fireEvent.click(iconContainer!);

      // Should only call once (not trigger parent click as well)
      expect(mockOnSelect).toHaveBeenCalledTimes(1);
      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe("Font Family Based on Depth", () => {
    it("uses Product Sans font for depth 0", () => {
      const item = createMockItem("glossary-1", "glossary", "Test Glossary");

      render(<SidebarItem item={item} {...defaultProps} depth={0} />);

      const text = screen.getByText("Test Glossary");
      expect(text).toHaveStyle({ fontFamily: "Product Sans" });
    });

    it("uses Google Sans font for depth > 0", () => {
      const item = createMockItem("category-1", "category", "Test Category");

      render(<SidebarItem item={item} {...defaultProps} depth={1} />);

      const text = screen.getByText("Test Category");
      expect(text).toHaveStyle({ fontFamily: "Google Sans" });
    });
  });

  describe("Font Weight Based on Selection", () => {
    it("uses fontWeight 500 when selected and accessible", () => {
      const item = createMockItem("glossary-1", "glossary", "Test Glossary");

      render(
        <SidebarItem
          item={item}
          {...defaultProps}
          selectedId="glossary-1"
        />
      );

      const text = screen.getByText("Test Glossary");
      expect(text).toHaveStyle({ fontWeight: 500 });
    });

    it("uses fontWeight 400 when not selected", () => {
      const item = createMockItem("glossary-1", "glossary", "Test Glossary");

      render(<SidebarItem item={item} {...defaultProps} />);

      const text = screen.getByText("Test Glossary");
      expect(text).toHaveStyle({ fontWeight: 400 });
    });

    it("uses fontWeight 400 when selected but inaccessible", () => {
      const item = createMockItem("glossary-1", "glossary", "Test Glossary", {
        isInaccessible: true,
      });

      render(
        <SidebarItem
          item={item}
          {...defaultProps}
          selectedId="glossary-1"
        />
      );

      const text = screen.getByText("Test Glossary");
      expect(text).toHaveStyle({ fontWeight: 400 });
    });
  });

  describe("Complex Scenarios", () => {
    it("handles deeply nested structure correctly", () => {
      const level3 = createMockItem("level3", "term", "Level 3 Term");
      const level2 = createMockItem("level2", "category", "Level 2 Category", {
        children: [level3],
      });
      const level1 = createMockItem("level1", "category", "Level 1 Category", {
        children: [level2],
      });
      const root = createMockItem("root", "glossary", "Root Glossary", {
        children: [level1],
      });
      const expandedIds = new Set(["root", "level1", "level2"]);

      render(
        <SidebarItem
          item={root}
          {...defaultProps}
          expandedIds={expandedIds}
        />
      );

      expect(screen.getByText("Root Glossary")).toBeInTheDocument();
      expect(screen.getByText("Level 1 Category")).toBeInTheDocument();
      expect(screen.getByText("Level 2 Category")).toBeInTheDocument();
      expect(screen.getByText("Level 3 Term")).toBeInTheDocument();
    });

    it("handles mixed accessible and inaccessible children", () => {
      const accessibleChild = createMockItem("child-1", "term", "Accessible Child");
      const inaccessibleChild = createMockItem("child-2", "term", "Inaccessible Child", {
        isInaccessible: true,
      });
      const item = createMockItem("glossary-1", "glossary", "Test Glossary", {
        children: [accessibleChild, inaccessibleChild],
      });
      const expandedIds = new Set(["glossary-1"]);

      render(
        <SidebarItem
          item={item}
          {...defaultProps}
          expandedIds={expandedIds}
        />
      );

      // Accessible child should have normal icon
      expect(screen.getByText("Accessible Child")).toBeInTheDocument();

      // Inaccessible child should have lock icon
      expect(screen.getByText("Inaccessible Child")).toBeInTheDocument();
      expect(screen.getByTestId("LockOutlinedIcon")).toBeInTheDocument();
    });

    it("child selection triggers onSelect with child id", () => {
      const child = createMockItem("child-1", "term", "Child Term");
      const item = createMockItem("glossary-1", "glossary", "Test Glossary", {
        children: [child],
      });
      const expandedIds = new Set(["glossary-1"]);

      render(
        <SidebarItem
          item={item}
          {...defaultProps}
          expandedIds={expandedIds}
        />
      );

      // Click on child
      const childButton = screen.getByText("Child Term").closest('[role="button"]');
      fireEvent.click(childButton!);

      expect(mockOnSelect).toHaveBeenCalledWith("child-1");
    });
  });

  describe("isInaccessible Edge Cases", () => {
    it("handles isInaccessible: false same as undefined", () => {
      const item = createMockItem("glossary-1", "glossary", "Test Glossary", {
        isInaccessible: false,
      });

      render(<SidebarItem item={item} {...defaultProps} />);

      const button = screen.getByRole("button");
      expect(button).not.toBeDisabled();
      expect(screen.getByTestId("icon-glossary")).toBeInTheDocument();
      expect(screen.queryByTestId("LockOutlinedIcon")).not.toBeInTheDocument();
    });
  });

  describe("Default Export", () => {
    it("exports the component as default", () => {
      expect(SidebarItem).toBeDefined();
      expect(typeof SidebarItem).toBe("function");
    });
  });
});
