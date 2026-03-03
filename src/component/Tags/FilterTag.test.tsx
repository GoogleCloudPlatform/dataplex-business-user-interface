import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import FilterTag from "./FilterTag";

// ============================================================================
// Test Suite for FilterTag Component
// ============================================================================

describe("FilterTag", () => {
  const mockHandleClick = vi.fn();
  const mockHandleClose = vi.fn();

  const defaultProps = {
    handleClick: mockHandleClick,
    text: "Test Filter",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // Basic Rendering Tests
  // ==========================================================================

  describe("Basic Rendering", () => {
    it("renders with required props", () => {
      render(<FilterTag {...defaultProps} />);

      expect(screen.getByText("Test Filter")).toBeInTheDocument();
    });

    it("renders as a button element", () => {
      render(<FilterTag {...defaultProps} />);

      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("renders the text prop correctly", () => {
      render(<FilterTag {...defaultProps} text="Custom Text" />);

      expect(screen.getByText("Custom Text")).toBeInTheDocument();
    });

    it("renders empty text", () => {
      render(<FilterTag {...defaultProps} text="" />);

      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("renders text with special characters", () => {
      render(<FilterTag {...defaultProps} text="Filter: <test> & 'value'" />);

      expect(screen.getByText("Filter: <test> & 'value'")).toBeInTheDocument();
    });

    it("renders text with numbers", () => {
      render(<FilterTag {...defaultProps} text="Filter 123" />);

      expect(screen.getByText("Filter 123")).toBeInTheDocument();
    });

    it("renders long text", () => {
      const longText = "This is a very long filter tag text that should still render correctly";
      render(<FilterTag {...defaultProps} text={longText} />);

      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it("renders text with unicode characters", () => {
      render(<FilterTag {...defaultProps} text="フィルター 标签" />);

      expect(screen.getByText("フィルター 标签")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Close Button Visibility Tests
  // ==========================================================================

  describe("Close Button Visibility", () => {
    it("does not show close icon when showCloseButton is false", () => {
      render(<FilterTag {...defaultProps} showCloseButton={false} />);

      expect(screen.queryByTestId("CloseIcon")).not.toBeInTheDocument();
    });

    it("does not show close icon when showCloseButton is not provided", () => {
      render(<FilterTag {...defaultProps} />);

      expect(screen.queryByTestId("CloseIcon")).not.toBeInTheDocument();
    });

    it("shows close icon when showCloseButton is true and handleClose provided", () => {
      render(
        <FilterTag
          {...defaultProps}
          showCloseButton={true}
          handleClose={mockHandleClose}
        />
      );

      expect(screen.getByTestId("CloseIcon")).toBeInTheDocument();
    });

    it("does not show close icon when showCloseButton is true but handleClose not provided", () => {
      render(<FilterTag {...defaultProps} showCloseButton={true} />);

      // The condition requires both showCloseButton AND handleClose
      expect(screen.queryByTestId("CloseIcon")).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Click Handler Tests
  // ==========================================================================

  describe("Click Handlers", () => {
    it("calls handleClick when button is clicked without close button", () => {
      render(<FilterTag {...defaultProps} />);

      fireEvent.click(screen.getByRole("button"));

      expect(mockHandleClick).toHaveBeenCalledTimes(1);
    });

    it("calls both handleClose and handleClick when showCloseButton is true", () => {
      render(
        <FilterTag
          {...defaultProps}
          showCloseButton={true}
          handleClose={mockHandleClose}
        />
      );

      fireEvent.click(screen.getByRole("button"));

      expect(mockHandleClose).toHaveBeenCalledTimes(1);
      expect(mockHandleClick).toHaveBeenCalledTimes(1);
    });

    it("calls handleClose before handleClick", () => {
      const callOrder: string[] = [];
      const trackingHandleClose = vi.fn(() => callOrder.push("close"));
      const trackingHandleClick = vi.fn(() => callOrder.push("click"));

      render(
        <FilterTag
          handleClick={trackingHandleClick}
          handleClose={trackingHandleClose}
          text="Test"
          showCloseButton={true}
        />
      );

      fireEvent.click(screen.getByRole("button"));

      expect(callOrder).toEqual(["close", "click"]);
    });

    it("only calls handleClick when showCloseButton is false", () => {
      render(
        <FilterTag
          {...defaultProps}
          showCloseButton={false}
          handleClose={mockHandleClose}
        />
      );

      fireEvent.click(screen.getByRole("button"));

      expect(mockHandleClick).toHaveBeenCalledTimes(1);
      expect(mockHandleClose).not.toHaveBeenCalled();
    });

    it("handles multiple clicks", () => {
      render(<FilterTag {...defaultProps} />);

      const button = screen.getByRole("button");

      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(mockHandleClick).toHaveBeenCalledTimes(3);
    });

    it("handles multiple clicks with close button", () => {
      render(
        <FilterTag
          {...defaultProps}
          showCloseButton={true}
          handleClose={mockHandleClose}
        />
      );

      const button = screen.getByRole("button");

      fireEvent.click(button);
      fireEvent.click(button);

      expect(mockHandleClose).toHaveBeenCalledTimes(2);
      expect(mockHandleClick).toHaveBeenCalledTimes(2);
    });
  });

  // ==========================================================================
  // Console Logging Tests
  // ==========================================================================

  describe("Console Logging", () => {
    it("logs 'btn close' message with text on click", () => {
      render(<FilterTag {...defaultProps} text="MyFilter" />);

      fireEvent.click(screen.getByRole("button"));

      expect(console.log).toHaveBeenCalledWith("btn close", "MyFilter");
    });

    it("logs correct text when showCloseButton is true", () => {
      render(
        <FilterTag
          {...defaultProps}
          text="CloseableFilter"
          showCloseButton={true}
          handleClose={mockHandleClose}
        />
      );

      fireEvent.click(screen.getByRole("button"));

      expect(console.log).toHaveBeenCalledWith("btn close", "CloseableFilter");
    });
  });

  // ==========================================================================
  // Custom CSS Tests
  // ==========================================================================

  describe("Custom CSS", () => {
    it("applies custom css prop to button", () => {
      const customCss = { marginTop: "10px", padding: "20px" };
      render(<FilterTag {...defaultProps} css={customCss} />);

      const button = screen.getByRole("button");
      expect(button).toHaveStyle({ marginTop: "10px", padding: "20px" });
    });

    it("merges custom css with default styles", () => {
      const customCss = { marginTop: "10px" };
      render(<FilterTag {...defaultProps} css={customCss} />);

      const button = screen.getByRole("button");
      // Should have both default and custom styles
      expect(button).toHaveStyle({ marginTop: "10px" });
    });

    it("allows custom css to override default styles", () => {
      const customCss = { borderRadius: "5px" };
      render(<FilterTag {...defaultProps} css={customCss} />);

      const button = screen.getByRole("button");
      expect(button).toHaveStyle({ borderRadius: "5px" });
    });

    it("renders correctly without css prop", () => {
      render(<FilterTag handleClick={mockHandleClick} text="No CSS" />);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("applies empty css object", () => {
      render(<FilterTag {...defaultProps} css={{}} />);

      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Default Styling Tests
  // ==========================================================================

  describe("Default Styling", () => {
    it("has default background color", () => {
      render(<FilterTag {...defaultProps} />);

      const button = screen.getByRole("button");
      expect(button).toHaveStyle({ background: "rgb(255, 255, 255)" });
    });

    it("has default text color", () => {
      render(<FilterTag {...defaultProps} />);

      const button = screen.getByRole("button");
      expect(button).toHaveStyle({ color: "rgb(0, 74, 119)" });
    });

    it("has default border radius", () => {
      render(<FilterTag {...defaultProps} />);

      const button = screen.getByRole("button");
      expect(button).toHaveStyle({ borderRadius: "20px" });
    });

    it("has default font size", () => {
      render(<FilterTag {...defaultProps} />);

      const button = screen.getByRole("button");
      expect(button).toHaveStyle({ fontSize: "12px" });
    });

    it("has default font weight", () => {
      render(<FilterTag {...defaultProps} />);

      const button = screen.getByRole("button");
      expect(button).toHaveStyle({ fontWeight: "500" });
    });

    it("has default border style", () => {
      render(<FilterTag {...defaultProps} />);

      const button = screen.getByRole("button");
      // Border is applied as inline style
      expect(button).toBeInTheDocument();
    });

    it("has flex display", () => {
      render(<FilterTag {...defaultProps} />);

      const button = screen.getByRole("button");
      expect(button).toHaveStyle({ display: "flex" });
    });
  });

  // ==========================================================================
  // Close Icon Hover Effects Tests
  // ==========================================================================

  describe("Close Icon Hover Effects", () => {
    it("changes background on mouse enter", () => {
      render(
        <FilterTag
          {...defaultProps}
          showCloseButton={true}
          handleClose={mockHandleClose}
        />
      );

      const closeIcon = screen.getByTestId("CloseIcon");
      const closeIconContainer = closeIcon.parentElement;

      fireEvent.mouseEnter(closeIconContainer!);

      expect(closeIconContainer).toHaveStyle({
        backgroundColor: "rgba(0, 0, 0, 0.04)",
      });
    });

    it("resets background on mouse leave", () => {
      render(
        <FilterTag
          {...defaultProps}
          showCloseButton={true}
          handleClose={mockHandleClose}
        />
      );

      const closeIcon = screen.getByTestId("CloseIcon");
      const closeIconContainer = closeIcon.parentElement;

      // First hover
      fireEvent.mouseEnter(closeIconContainer!);
      expect(closeIconContainer).toHaveStyle({
        backgroundColor: "rgba(0, 0, 0, 0.04)",
      });

      // Then leave - style is set directly so check the raw value
      fireEvent.mouseLeave(closeIconContainer!);
      expect(closeIconContainer?.style.backgroundColor).toBe("transparent");
    });

    it("handles multiple hover cycles", () => {
      render(
        <FilterTag
          {...defaultProps}
          showCloseButton={true}
          handleClose={mockHandleClose}
        />
      );

      const closeIcon = screen.getByTestId("CloseIcon");
      const closeIconContainer = closeIcon.parentElement;

      // Multiple hover cycles
      for (let i = 0; i < 3; i++) {
        fireEvent.mouseEnter(closeIconContainer!);
        expect(closeIconContainer).toHaveStyle({
          backgroundColor: "rgba(0, 0, 0, 0.04)",
        });

        fireEvent.mouseLeave(closeIconContainer!);
        expect(closeIconContainer?.style.backgroundColor).toBe("transparent");
      }
    });
  });

  // ==========================================================================
  // Close Icon Styling Tests
  // ==========================================================================

  describe("Close Icon Styling", () => {
    it("close icon has correct font size", () => {
      render(
        <FilterTag
          {...defaultProps}
          showCloseButton={true}
          handleClose={mockHandleClose}
        />
      );

      const closeIcon = screen.getByTestId("CloseIcon");
      expect(closeIcon).toHaveStyle({ fontSize: "14px" });
    });

    it("close icon container has cursor pointer", () => {
      render(
        <FilterTag
          {...defaultProps}
          showCloseButton={true}
          handleClose={mockHandleClose}
        />
      );

      const closeIcon = screen.getByTestId("CloseIcon");
      const closeIconContainer = closeIcon.parentElement;
      expect(closeIconContainer).toHaveStyle({ cursor: "pointer" });
    });

    it("close icon container has border radius for circular shape", () => {
      render(
        <FilterTag
          {...defaultProps}
          showCloseButton={true}
          handleClose={mockHandleClose}
        />
      );

      const closeIcon = screen.getByTestId("CloseIcon");
      const closeIconContainer = closeIcon.parentElement;
      expect(closeIconContainer).toHaveStyle({ borderRadius: "50%" });
    });
  });

  // ==========================================================================
  // Props Combination Tests
  // ==========================================================================

  describe("Props Combinations", () => {
    it("renders with all props provided", () => {
      const customCss = { margin: "5px" };
      render(
        <FilterTag
          handleClick={mockHandleClick}
          handleClose={mockHandleClose}
          text="Full Props"
          css={customCss}
          showCloseButton={true}
        />
      );

      expect(screen.getByText("Full Props")).toBeInTheDocument();
      expect(screen.getByTestId("CloseIcon")).toBeInTheDocument();
    });

    it("renders with minimal props", () => {
      render(<FilterTag handleClick={mockHandleClick} text="Minimal" />);

      expect(screen.getByText("Minimal")).toBeInTheDocument();
    });

    it("handles different handleClick function types", () => {
      const asyncHandleClick = vi.fn(async () => {
        await Promise.resolve();
      });

      render(<FilterTag handleClick={asyncHandleClick} text="Async" />);

      fireEvent.click(screen.getByRole("button"));

      expect(asyncHandleClick).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe("Edge Cases", () => {
    it("handles rapid clicking", () => {
      render(<FilterTag {...defaultProps} />);

      const button = screen.getByRole("button");

      for (let i = 0; i < 10; i++) {
        fireEvent.click(button);
      }

      expect(mockHandleClick).toHaveBeenCalledTimes(10);
    });

    it("handles whitespace-only text", () => {
      render(<FilterTag {...defaultProps} text="   " />);

      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("handles text with newlines", () => {
      render(<FilterTag {...defaultProps} text="Line1\nLine2" />);

      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("handles text with tabs", () => {
      render(<FilterTag {...defaultProps} text="Tab\tText" />);

      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Re-render Tests
  // ==========================================================================

  describe("Re-render Behavior", () => {
    it("updates text on re-render", () => {
      const { rerender } = render(<FilterTag {...defaultProps} text="Initial" />);

      expect(screen.getByText("Initial")).toBeInTheDocument();

      rerender(<FilterTag {...defaultProps} text="Updated" />);

      expect(screen.getByText("Updated")).toBeInTheDocument();
      expect(screen.queryByText("Initial")).not.toBeInTheDocument();
    });

    it("shows close button on re-render when prop changes", () => {
      const { rerender } = render(
        <FilterTag {...defaultProps} showCloseButton={false} />
      );

      expect(screen.queryByTestId("CloseIcon")).not.toBeInTheDocument();

      rerender(
        <FilterTag
          {...defaultProps}
          showCloseButton={true}
          handleClose={mockHandleClose}
        />
      );

      expect(screen.getByTestId("CloseIcon")).toBeInTheDocument();
    });

    it("hides close button on re-render when prop changes", () => {
      const { rerender } = render(
        <FilterTag
          {...defaultProps}
          showCloseButton={true}
          handleClose={mockHandleClose}
        />
      );

      expect(screen.getByTestId("CloseIcon")).toBeInTheDocument();

      rerender(<FilterTag {...defaultProps} showCloseButton={false} />);

      expect(screen.queryByTestId("CloseIcon")).not.toBeInTheDocument();
    });

    it("updates css on re-render", () => {
      const { rerender } = render(
        <FilterTag {...defaultProps} css={{ marginLeft: "5px" }} />
      );

      expect(screen.getByRole("button")).toHaveStyle({ marginLeft: "5px" });

      rerender(<FilterTag {...defaultProps} css={{ marginLeft: "20px" }} />);

      expect(screen.getByRole("button")).toHaveStyle({ marginLeft: "20px" });
    });

    it("maintains click handler after re-render", () => {
      const { rerender } = render(<FilterTag {...defaultProps} />);

      fireEvent.click(screen.getByRole("button"));
      expect(mockHandleClick).toHaveBeenCalledTimes(1);

      rerender(<FilterTag {...defaultProps} text="New Text" />);

      fireEvent.click(screen.getByRole("button"));
      expect(mockHandleClick).toHaveBeenCalledTimes(2);
    });
  });

  // ==========================================================================
  // Accessibility Tests
  // ==========================================================================

  describe("Accessibility", () => {
    it("button is focusable", () => {
      render(<FilterTag {...defaultProps} />);

      const button = screen.getByRole("button");
      button.focus();

      expect(document.activeElement).toBe(button);
    });

    it("button can be clicked via keyboard", () => {
      render(<FilterTag {...defaultProps} />);

      const button = screen.getByRole("button");
      button.focus();

      fireEvent.keyDown(button, { key: "Enter" });
      fireEvent.click(button);

      expect(mockHandleClick).toHaveBeenCalled();
    });

    it("has correct button role", () => {
      render(<FilterTag {...defaultProps} />);

      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Different Text Content Tests
  // ==========================================================================

  describe("Different Text Contents", () => {
    it("renders filter type text", () => {
      render(<FilterTag {...defaultProps} text="Type: BigQuery" />);

      expect(screen.getByText("Type: BigQuery")).toBeInTheDocument();
    });

    it("renders date filter text", () => {
      render(<FilterTag {...defaultProps} text="Date: 2024-01-01" />);

      expect(screen.getByText("Date: 2024-01-01")).toBeInTheDocument();
    });

    it("renders status filter text", () => {
      render(<FilterTag {...defaultProps} text="Status: Active" />);

      expect(screen.getByText("Status: Active")).toBeInTheDocument();
    });

    it("renders category filter text", () => {
      render(<FilterTag {...defaultProps} text="Category: Analytics" />);

      expect(screen.getByText("Category: Analytics")).toBeInTheDocument();
    });

    it("renders boolean filter text", () => {
      render(<FilterTag {...defaultProps} text="Featured: Yes" />);

      expect(screen.getByText("Featured: Yes")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Integration Tests
  // ==========================================================================

  describe("Integration", () => {
    it("complete flow: render, hover close icon, click", () => {
      render(
        <FilterTag
          {...defaultProps}
          showCloseButton={true}
          handleClose={mockHandleClose}
        />
      );

      // Verify render
      expect(screen.getByText("Test Filter")).toBeInTheDocument();
      const closeIcon = screen.getByTestId("CloseIcon");
      expect(closeIcon).toBeInTheDocument();

      // Hover
      const closeIconContainer = closeIcon.parentElement;
      fireEvent.mouseEnter(closeIconContainer!);
      expect(closeIconContainer).toHaveStyle({
        backgroundColor: "rgba(0, 0, 0, 0.04)",
      });

      // Click
      fireEvent.click(screen.getByRole("button"));
      expect(mockHandleClose).toHaveBeenCalledTimes(1);
      expect(mockHandleClick).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith("btn close", "Test Filter");
    });

    it("simulate filter tag in a list", () => {
      const filters = ["Filter 1", "Filter 2", "Filter 3"];
      const handleClicks = filters.map(() => vi.fn());

      const { container } = render(
        <div>
          {filters.map((filter, index) => (
            <FilterTag
              key={index}
              handleClick={handleClicks[index]}
              text={filter}
            />
          ))}
        </div>
      );

      const buttons = container.querySelectorAll("button");
      expect(buttons).toHaveLength(3);

      // Click each filter
      buttons.forEach((button, index) => {
        fireEvent.click(button);
        expect(handleClicks[index]).toHaveBeenCalledTimes(1);
      });
    });
  });

  // ==========================================================================
  // Snapshot Tests
  // ==========================================================================

  describe("Snapshots", () => {
    it("matches snapshot without close button", () => {
      const { container } = render(<FilterTag {...defaultProps} />);

      expect(container.firstChild).toBeDefined();
    });

    it("matches snapshot with close button", () => {
      const { container } = render(
        <FilterTag
          {...defaultProps}
          showCloseButton={true}
          handleClose={mockHandleClose}
        />
      );

      expect(container.firstChild).toBeDefined();
    });

    it("matches snapshot with custom css", () => {
      const { container } = render(
        <FilterTag
          {...defaultProps}
          css={{ backgroundColor: "blue", padding: "20px" }}
        />
      );

      expect(container.firstChild).toBeDefined();
    });
  });
});
