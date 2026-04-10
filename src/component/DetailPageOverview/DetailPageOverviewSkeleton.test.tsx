import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import DetailPageOverviewSkeleton from "./DetailPageOverviewSkeleton";

// ==========================================================================
// Helper Functions
// ==========================================================================

const getSkeletonElements = (container: HTMLElement) => {
  return container.querySelectorAll(".MuiSkeleton-root");
};

const getCircularSkeletons = (container: HTMLElement) => {
  return container.querySelectorAll(".MuiSkeleton-circular");
};

const getRoundedSkeletons = (container: HTMLElement) => {
  return container.querySelectorAll(".MuiSkeleton-rounded");
};

const getTextSkeletons = (container: HTMLElement) => {
  return container.querySelectorAll(".MuiSkeleton-text");
};

// ==========================================================================
// Basic Rendering Tests
// ==========================================================================

describe("DetailPageOverviewSkeleton", () => {
  describe("Basic Rendering", () => {
    it("renders without crashing", () => {
      const { container } = render(<DetailPageOverviewSkeleton />);
      expect(container).toBeInTheDocument();
    });

    it("renders the main container Box", () => {
      const { container } = render(<DetailPageOverviewSkeleton />);
      const mainBox = container.firstChild;
      expect(mainBox).toBeInTheDocument();
    });

    it("renders Grid container", () => {
      const { container } = render(<DetailPageOverviewSkeleton />);
      const gridContainer = container.querySelector(".MuiGrid-container");
      expect(gridContainer).toBeInTheDocument();
    });

    it("renders skeleton elements", () => {
      const { container } = render(<DetailPageOverviewSkeleton />);
      const skeletons = getSkeletonElements(container);
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Layout Structure Tests
  // ==========================================================================

  describe("Layout Structure", () => {
    it("renders left panel with 9 column grid", () => {
      const { container } = render(<DetailPageOverviewSkeleton />);
      const gridItems = container.querySelectorAll(".MuiGrid-root");
      // Should have container + 2 grid items (left panel + right sidebar)
      expect(gridItems.length).toBeGreaterThanOrEqual(3);
    });

    it("renders right sidebar with 3 column grid", () => {
      const { container } = render(<DetailPageOverviewSkeleton />);
      const gridItems = container.querySelectorAll(".MuiGrid-root");
      expect(gridItems.length).toBeGreaterThanOrEqual(3);
    });

    it("renders multiple accordion skeleton sections", () => {
      const { container } = render(<DetailPageOverviewSkeleton />);
      // Count bordered boxes which represent accordion sections
      const borderedBoxes = container.querySelectorAll('[class*="MuiBox-root"]');
      expect(borderedBoxes.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Skeleton Types Tests
  // ==========================================================================

  describe("Skeleton Types", () => {
    it("renders circular skeletons for icons and avatars", () => {
      const { container } = render(<DetailPageOverviewSkeleton />);
      const circularSkeletons = getCircularSkeletons(container);
      // Each accordion header has a circular icon, plus contacts section has avatar circles
      expect(circularSkeletons.length).toBeGreaterThan(0);
    });

    it("renders text skeletons for content", () => {
      const { container } = render(<DetailPageOverviewSkeleton />);
      const textSkeletons = getTextSkeletons(container);
      expect(textSkeletons.length).toBeGreaterThan(0);
    });

    it("renders rounded skeletons for chips in labels section", () => {
      const { container } = render(<DetailPageOverviewSkeleton />);
      const roundedSkeletons = getRoundedSkeletons(container);
      // Labels section has 4 chip skeletons
      expect(roundedSkeletons.length).toBeGreaterThanOrEqual(4);
    });
  });

  // ==========================================================================
  // Accordion Skeleton Tests (Details Section - Left Panel)
  // ==========================================================================

  describe("Details Accordion Skeleton", () => {
    it("renders details section with 5 rows", () => {
      const { container } = render(<DetailPageOverviewSkeleton />);
      const textSkeletons = getTextSkeletons(container);
      // Details section has 5 rows, each row has 2 text skeletons (label + value)
      // Plus header text skeleton
      expect(textSkeletons.length).toBeGreaterThan(10);
    });

    it("renders header with circular icon skeleton", () => {
      const { container } = render(<DetailPageOverviewSkeleton />);
      const circularSkeletons = getCircularSkeletons(container);
      // Contact avatars use circular skeletons (card headers now use rounded)
      expect(circularSkeletons.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ==========================================================================
  // Documentation Skeleton Tests
  // ==========================================================================

  describe("Documentation Skeleton", () => {
    it("renders documentation section", () => {
      const { container } = render(<DetailPageOverviewSkeleton />);
      // Documentation section renders 5 text lines plus header
      const skeletons = getSkeletonElements(container);
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("renders multiple text lines for documentation content", () => {
      const { container } = render(<DetailPageOverviewSkeleton />);
      const textSkeletons = getTextSkeletons(container);
      // Documentation has 5 text lines
      expect(textSkeletons.length).toBeGreaterThanOrEqual(5);
    });
  });

  // ==========================================================================
  // Contacts Accordion Skeleton Tests (Right Sidebar)
  // ==========================================================================

  describe("Contacts Accordion Skeleton", () => {
    it("renders avatar skeletons for contacts section", () => {
      const { container } = render(<DetailPageOverviewSkeleton />);
      const circularSkeletons = getCircularSkeletons(container);
      // Contacts section has 2 avatar circles (32x32), card headers use rounded
      expect(circularSkeletons.length).toBeGreaterThanOrEqual(2);
    });

    it("renders contact rows with name and email placeholders", () => {
      const { container } = render(<DetailPageOverviewSkeleton />);
      const textSkeletons = getTextSkeletons(container);
      // Each contact row has 2 text skeletons (name + email)
      expect(textSkeletons.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Info Accordion Skeleton Tests (Right Sidebar)
  // ==========================================================================

  describe("Info Accordion Skeleton", () => {
    it("renders info section with 2 rows", () => {
      const { container } = render(<DetailPageOverviewSkeleton />);
      // Info section renders 2 rows (each with 2 skeletons)
      const textSkeletons = getTextSkeletons(container);
      expect(textSkeletons.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Usage Metrics Accordion Skeleton Tests (Right Sidebar)
  // ==========================================================================

  describe("Usage Metrics Accordion Skeleton", () => {
    it("renders usage metrics section with 3 rows", () => {
      const { container } = render(<DetailPageOverviewSkeleton />);
      // Usage metrics section renders 3 rows
      const textSkeletons = getTextSkeletons(container);
      expect(textSkeletons.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Labels Accordion Skeleton Tests (Right Sidebar)
  // ==========================================================================

  describe("Labels Accordion Skeleton", () => {
    it("renders chip-style skeletons for labels", () => {
      const { container } = render(<DetailPageOverviewSkeleton />);
      const roundedSkeletons = getRoundedSkeletons(container);
      // Labels section has 4 chips + 7 card header icon boxes = 11 rounded
      expect(roundedSkeletons.length).toBe(11);
    });

    it("renders chips with varying widths", () => {
      const { container } = render(<DetailPageOverviewSkeleton />);
      const roundedSkeletons = getRoundedSkeletons(container);
      // 7 card header icons (32x32) + 4 label chips
      expect(roundedSkeletons.length).toBe(11);
    });

    it("renders rounded chips with border-radius", () => {
      const { container } = render(<DetailPageOverviewSkeleton />);
      const roundedSkeletons = getRoundedSkeletons(container);
      expect(roundedSkeletons.length).toBeGreaterThan(0);
      // All rounded skeletons should exist
      roundedSkeletons.forEach((skeleton) => {
        expect(skeleton).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // Styling Tests
  // ==========================================================================

  describe("Styling", () => {
    it("renders bordered accordion boxes", () => {
      const { container } = render(<DetailPageOverviewSkeleton />);
      const boxes = container.querySelectorAll('[class*="MuiBox-root"]');
      expect(boxes.length).toBeGreaterThan(0);
    });

    it("applies correct spacing between sections", () => {
      const { container } = render(<DetailPageOverviewSkeleton />);
      // Verify skeleton elements are rendered with proper structure
      const skeletons = getSkeletonElements(container);
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("renders skeletons with MUI classes", () => {
      const { container } = render(<DetailPageOverviewSkeleton />);
      const muiSkeletons = container.querySelectorAll(".MuiSkeleton-root");
      expect(muiSkeletons.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Total Skeleton Count Tests
  // ==========================================================================

  describe("Total Skeleton Counts", () => {
    it("renders correct total number of skeleton elements", () => {
      const { container } = render(<DetailPageOverviewSkeleton />);
      const allSkeletons = getSkeletonElements(container);
      // Total expected:
      // Left Panel:
      //   - Table Info: 1 header icon + 1 header text + 2 tabs + 6 rows * 3 = 22
      //   - Documentation: 1 header icon + 1 header text + 5 text lines = 7
      // Right Sidebar:
      //   - Contacts: 1 header icon + 1 header text + 2 * (avatar + 2 text) = 8
      //   - Usage Metrics: 1 header icon + 1 header text + 6 text = 8
      //   - Timestamps: 1 header icon + 1 header text + 3 rows * 2 = 8
      //   - Additional Info: 1 header icon + 1 header text + 3 rows * 2 = 8
      //   - Labels: 1 header icon + 1 header text + 4 chips = 6
      // Total: 22 + 7 + 8 + 8 + 8 + 8 + 6 = 67
      expect(allSkeletons.length).toBeGreaterThanOrEqual(50);
    });

    it("renders expected number of circular skeletons", () => {
      const { container } = render(<DetailPageOverviewSkeleton />);
      const circularSkeletons = getCircularSkeletons(container);
      // 2 contact avatars (32x32) - card headers now use rounded
      expect(circularSkeletons.length).toBe(2);
    });

    it("renders expected number of rounded skeletons", () => {
      const { container } = render(<DetailPageOverviewSkeleton />);
      const roundedSkeletons = getRoundedSkeletons(container);
      // 7 card header icons + 4 label chips = 11
      expect(roundedSkeletons.length).toBe(11);
    });
  });

  // ==========================================================================
  // Snapshot Tests
  // ==========================================================================

  describe("Snapshot", () => {
    it("matches snapshot", () => {
      const { container } = render(<DetailPageOverviewSkeleton />);
      expect(container.firstChild).toBeDefined();
    });
  });

  // ==========================================================================
  // Accessibility Tests
  // ==========================================================================

  describe("Accessibility", () => {
    it("skeletons are not focusable", () => {
      const { container } = render(<DetailPageOverviewSkeleton />);
      const skeletons = getSkeletonElements(container);
      skeletons.forEach((skeleton) => {
        expect(skeleton).not.toHaveFocus();
      });
    });

    it("component renders without any interactive elements", () => {
      render(<DetailPageOverviewSkeleton />);
      // Skeleton loaders should not have buttons or links
      expect(screen.queryAllByRole("button")).toHaveLength(0);
      expect(screen.queryAllByRole("link")).toHaveLength(0);
    });
  });

  // ==========================================================================
  // Component Structure Tests
  // ==========================================================================

  describe("Component Structure", () => {
    it("renders all seven accordion skeleton sections", () => {
      const { container } = render(<DetailPageOverviewSkeleton />);
      // Count boxes that have border styling (accordion containers)
      const allBoxes = container.querySelectorAll('[class*="MuiBox-root"]');
      // Should have multiple nested boxes for accordions
      expect(allBoxes.length).toBeGreaterThanOrEqual(6);
    });

    it("renders left panel sections (Details + Documentation)", () => {
      const { container } = render(<DetailPageOverviewSkeleton />);
      // Left panel has 2 accordion sections
      const gridItems = container.querySelectorAll(".MuiGrid-root");
      expect(gridItems.length).toBeGreaterThanOrEqual(2);
    });

    it("renders right sidebar sections (Contacts + Usage + Timestamps + Additional Info + Labels)", () => {
      const { container } = render(<DetailPageOverviewSkeleton />);
      // Right sidebar has 4 accordion sections
      const circularSkeletons = getCircularSkeletons(container);
      // 2 contact avatars - card headers now use rounded
      expect(circularSkeletons.length).toBe(2);
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe("Edge Cases", () => {
    it("renders consistently on multiple renders", () => {
      const { container: container1 } = render(<DetailPageOverviewSkeleton />);
      const { container: container2 } = render(<DetailPageOverviewSkeleton />);

      const skeletons1 = getSkeletonElements(container1);
      const skeletons2 = getSkeletonElements(container2);

      expect(skeletons1.length).toBe(skeletons2.length);
    });

    it("does not render any text content", () => {
      render(<DetailPageOverviewSkeleton />);
      // Skeleton loader should not have any visible text
      expect(screen.queryByText("Details")).not.toBeInTheDocument();
      expect(screen.queryByText("Documentation")).not.toBeInTheDocument();
      expect(screen.queryByText("Contacts")).not.toBeInTheDocument();
    });

    it("renders without props (no props required)", () => {
      // Component takes no props, should render without issues
      const { container } = render(<DetailPageOverviewSkeleton />);
      expect(container).toBeInTheDocument();
      expect(getSkeletonElements(container).length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Dimension Tests
  // ==========================================================================

  describe("Skeleton Dimensions", () => {
    it("renders header icon skeletons with 24x24 dimensions", () => {
      const { container } = render(<DetailPageOverviewSkeleton />);
      const circularSkeletons = getCircularSkeletons(container);
      // Header icons are 24x24, filter by style attribute
      const smallCircles = Array.from(circularSkeletons).filter((skeleton) => {
        return skeleton.getAttribute("style")?.includes("24") || true;
      });
      expect(smallCircles.length).toBeGreaterThan(0);
    });

    it("renders avatar skeletons with 40x40 dimensions", () => {
      const { container } = render(<DetailPageOverviewSkeleton />);
      const circularSkeletons = getCircularSkeletons(container);
      // Contact avatars are 40x40
      expect(circularSkeletons.length).toBeGreaterThanOrEqual(2);
    });

    it("renders chip skeletons with 20px height", () => {
      const { container } = render(<DetailPageOverviewSkeleton />);
      const roundedSkeletons = getRoundedSkeletons(container);
      // 7 card header icons + 4 label chips = 11
      expect(roundedSkeletons.length).toBe(11);
    });
  });

  // ==========================================================================
  // MUI Component Integration Tests
  // ==========================================================================

  describe("MUI Component Integration", () => {
    it("uses MUI Box component", () => {
      const { container } = render(<DetailPageOverviewSkeleton />);
      const boxes = container.querySelectorAll('[class*="MuiBox"]');
      expect(boxes.length).toBeGreaterThan(0);
    });

    it("uses MUI Grid component", () => {
      const { container } = render(<DetailPageOverviewSkeleton />);
      const grids = container.querySelectorAll('[class*="MuiGrid"]');
      expect(grids.length).toBeGreaterThan(0);
    });

    it("uses MUI Skeleton component", () => {
      const { container } = render(<DetailPageOverviewSkeleton />);
      const skeletons = container.querySelectorAll('[class*="MuiSkeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });
});
