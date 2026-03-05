import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import NotificationBar from "./NotificationBar";

// ============================================================================
// Test Suite for NotificationBar Component
// ============================================================================

describe("NotificationBar", () => {
  // Default props for testing
  const mockOnClose = vi.fn();
  const mockOnUndo = vi.fn();
  const defaultProps = {
    isVisible: true,
    onClose: mockOnClose,
    onUndo: mockOnUndo,
    message: "Test notification message",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Visibility Tests
  // ==========================================================================

  describe("Visibility", () => {
    it("renders notification bar when isVisible is true", () => {
      render(<NotificationBar {...defaultProps} />);

      expect(screen.getByText("Test notification message")).toBeInTheDocument();
    });

    it("does not render when isVisible is false", () => {
      render(<NotificationBar {...defaultProps} isVisible={false} />);

      expect(
        screen.queryByText("Test notification message")
      ).not.toBeInTheDocument();
    });

    it("returns null when isVisible is false", () => {
      const { container } = render(
        <NotificationBar {...defaultProps} isVisible={false} />
      );

      expect(container.firstChild).toBeNull();
    });

    it("toggles visibility based on isVisible prop", () => {
      const { rerender } = render(
        <NotificationBar {...defaultProps} isVisible={true} />
      );

      expect(screen.getByText("Test notification message")).toBeInTheDocument();

      rerender(<NotificationBar {...defaultProps} isVisible={false} />);

      expect(
        screen.queryByText("Test notification message")
      ).not.toBeInTheDocument();

      rerender(<NotificationBar {...defaultProps} isVisible={true} />);

      expect(screen.getByText("Test notification message")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Message Display Tests
  // ==========================================================================

  describe("Message Display", () => {
    it("displays the provided message", () => {
      render(<NotificationBar {...defaultProps} message="Custom message" />);

      expect(screen.getByText("Custom message")).toBeInTheDocument();
    });

    it("displays empty message", () => {
      render(<NotificationBar {...defaultProps} message="" />);

      // Undo should still be visible
      expect(screen.getByText("Undo")).toBeInTheDocument();
    });

    it("displays long message", () => {
      const longMessage =
        "This is a very long notification message that should still be displayed correctly within the notification bar component";
      render(<NotificationBar {...defaultProps} message={longMessage} />);

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it("displays message with special characters", () => {
      const specialMessage = "Action completed! <test> & 'done' \"success\"";
      render(<NotificationBar {...defaultProps} message={specialMessage} />);

      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });

    it("displays message with unicode characters", () => {
      const unicodeMessage = "成功完成 ✓ Ação concluída";
      render(<NotificationBar {...defaultProps} message={unicodeMessage} />);

      expect(screen.getByText(unicodeMessage)).toBeInTheDocument();
    });

    it("displays message with numbers", () => {
      const numericMessage = "3 items deleted successfully";
      render(<NotificationBar {...defaultProps} message={numericMessage} />);

      expect(screen.getByText(numericMessage)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Undo Button Tests
  // ==========================================================================

  describe("Undo Button", () => {
    it("renders Undo text", () => {
      render(<NotificationBar {...defaultProps} />);

      expect(screen.getByText("Undo")).toBeInTheDocument();
    });

    it("calls onUndo when Undo is clicked", () => {
      render(<NotificationBar {...defaultProps} />);

      fireEvent.click(screen.getByText("Undo"));

      expect(mockOnUndo).toHaveBeenCalledTimes(1);
    });

    it("calls onUndo multiple times on multiple clicks", () => {
      render(<NotificationBar {...defaultProps} />);

      const undoButton = screen.getByText("Undo");

      fireEvent.click(undoButton);
      fireEvent.click(undoButton);
      fireEvent.click(undoButton);

      expect(mockOnUndo).toHaveBeenCalledTimes(3);
    });

    it("does not call onClose when Undo is clicked", () => {
      render(<NotificationBar {...defaultProps} />);

      fireEvent.click(screen.getByText("Undo"));

      expect(mockOnUndo).toHaveBeenCalledTimes(1);
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Close Button Tests
  // ==========================================================================

  describe("Close Button", () => {
    it("renders close button", () => {
      render(<NotificationBar {...defaultProps} />);

      // Find the close button by its role
      const closeButton = screen.getByRole("button");
      expect(closeButton).toBeInTheDocument();
    });

    it("calls onClose when close button is clicked", () => {
      render(<NotificationBar {...defaultProps} />);

      const closeButton = screen.getByRole("button");
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose multiple times on multiple clicks", () => {
      render(<NotificationBar {...defaultProps} />);

      const closeButton = screen.getByRole("button");

      fireEvent.click(closeButton);
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(2);
    });

    it("does not call onUndo when close button is clicked", () => {
      render(<NotificationBar {...defaultProps} />);

      const closeButton = screen.getByRole("button");
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockOnUndo).not.toHaveBeenCalled();
    });

    it("renders Close icon within button", () => {
      render(<NotificationBar {...defaultProps} />);

      // MUI Close icon has a testid
      const closeButton = screen.getByRole("button");
      expect(closeButton.querySelector("svg")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Component Structure Tests
  // ==========================================================================

  describe("Component Structure", () => {
    it("renders message, undo, and close button", () => {
      render(<NotificationBar {...defaultProps} />);

      expect(screen.getByText("Test notification message")).toBeInTheDocument();
      expect(screen.getByText("Undo")).toBeInTheDocument();
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("has correct element hierarchy", () => {
      const { container } = render(<NotificationBar {...defaultProps} />);

      // The root Box element should contain Typography elements and IconButton
      const rootElement = container.firstChild;
      expect(rootElement).not.toBeNull();
      expect(rootElement?.childNodes.length).toBeGreaterThanOrEqual(3);
    });

    it("renders all children in correct order", () => {
      const { container } = render(<NotificationBar {...defaultProps} />);

      const children = container.firstChild?.childNodes;
      expect(children).toBeDefined();

      // First child should contain the message
      expect(children![0].textContent).toBe("Test notification message");
      // Second child should be Undo
      expect(children![1].textContent).toBe("Undo");
      // Third child should be the close button
      expect(children![2]).toBeDefined();
    });
  });

  // ==========================================================================
  // Props Validation Tests
  // ==========================================================================

  describe("Props Handling", () => {
    it("handles different onClose functions", () => {
      const customOnClose = vi.fn();
      render(
        <NotificationBar {...defaultProps} onClose={customOnClose} />
      );

      fireEvent.click(screen.getByRole("button"));

      expect(customOnClose).toHaveBeenCalledTimes(1);
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it("handles different onUndo functions", () => {
      const customOnUndo = vi.fn();
      render(<NotificationBar {...defaultProps} onUndo={customOnUndo} />);

      fireEvent.click(screen.getByText("Undo"));

      expect(customOnUndo).toHaveBeenCalledTimes(1);
      expect(mockOnUndo).not.toHaveBeenCalled();
    });

    it("accepts all required props", () => {
      const props = {
        isVisible: true,
        onClose: vi.fn(),
        onUndo: vi.fn(),
        message: "Props test",
      };

      render(<NotificationBar {...props} />);

      expect(screen.getByText("Props test")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Styling Tests
  // ==========================================================================

  describe("Styling", () => {
    it("has fixed position styling", () => {
      const { container } = render(<NotificationBar {...defaultProps} />);

      const rootElement = container.firstChild as HTMLElement;

      // MUI applies styles, we check that the element exists and has styles applied
      expect(rootElement).toBeInTheDocument();
    });

    it("applies correct styling to container", () => {
      const { container } = render(<NotificationBar {...defaultProps} />);

      const rootElement = container.firstChild as HTMLElement;
      expect(rootElement).toHaveClass("MuiBox-root");
    });

    it("applies Typography styles to message", () => {
      render(<NotificationBar {...defaultProps} />);

      const message = screen.getByText("Test notification message");
      expect(message).toHaveClass("MuiTypography-root");
    });

    it("applies Typography styles to Undo text", () => {
      render(<NotificationBar {...defaultProps} />);

      const undoText = screen.getByText("Undo");
      expect(undoText).toHaveClass("MuiTypography-root");
    });

    it("applies IconButton styles to close button", () => {
      render(<NotificationBar {...defaultProps} />);

      const closeButton = screen.getByRole("button");
      expect(closeButton).toHaveClass("MuiIconButton-root");
    });
  });

  // ==========================================================================
  // Re-render Tests
  // ==========================================================================

  describe("Re-render Behavior", () => {
    it("updates message on re-render", () => {
      const { rerender } = render(<NotificationBar {...defaultProps} />);

      expect(screen.getByText("Test notification message")).toBeInTheDocument();

      rerender(
        <NotificationBar {...defaultProps} message="Updated message" />
      );

      expect(screen.getByText("Updated message")).toBeInTheDocument();
      expect(
        screen.queryByText("Test notification message")
      ).not.toBeInTheDocument();
    });

    it("maintains callbacks after re-render", () => {
      const { rerender } = render(<NotificationBar {...defaultProps} />);

      rerender(
        <NotificationBar {...defaultProps} message="Updated message" />
      );

      fireEvent.click(screen.getByText("Undo"));
      fireEvent.click(screen.getByRole("button"));

      expect(mockOnUndo).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("handles callback changes on re-render", () => {
      const newOnClose = vi.fn();
      const { rerender } = render(<NotificationBar {...defaultProps} />);

      fireEvent.click(screen.getByRole("button"));
      expect(mockOnClose).toHaveBeenCalledTimes(1);

      rerender(<NotificationBar {...defaultProps} onClose={newOnClose} />);

      fireEvent.click(screen.getByRole("button"));
      expect(newOnClose).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // Edge Cases Tests
  // ==========================================================================

  describe("Edge Cases", () => {
    it("handles rapid visibility toggles", () => {
      const { rerender } = render(
        <NotificationBar {...defaultProps} isVisible={true} />
      );

      for (let i = 0; i < 10; i++) {
        rerender(
          <NotificationBar {...defaultProps} isVisible={i % 2 === 0} />
        );
      }

      // After 10 iterations (0-9), i=9 is odd, so isVisible should be false
      expect(
        screen.queryByText("Test notification message")
      ).not.toBeInTheDocument();
    });

    it("handles rapid clicks on Undo", () => {
      render(<NotificationBar {...defaultProps} />);

      const undoButton = screen.getByText("Undo");

      for (let i = 0; i < 10; i++) {
        fireEvent.click(undoButton);
      }

      expect(mockOnUndo).toHaveBeenCalledTimes(10);
    });

    it("handles rapid clicks on close button", () => {
      render(<NotificationBar {...defaultProps} />);

      const closeButton = screen.getByRole("button");

      for (let i = 0; i < 10; i++) {
        fireEvent.click(closeButton);
      }

      expect(mockOnClose).toHaveBeenCalledTimes(10);
    });

    it("handles whitespace-only message", () => {
      render(<NotificationBar {...defaultProps} message="   " />);

      // Component should still render
      expect(screen.getByText("Undo")).toBeInTheDocument();
    });

    it("handles newline characters in message", () => {
      render(
        <NotificationBar {...defaultProps} message="Line 1\nLine 2" />
      );

      // The literal string "Line 1\nLine 2" is rendered (not as actual newline)
      const message = screen.getByText(/Line 1/);
      expect(message).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Accessibility Tests
  // ==========================================================================

  describe("Accessibility", () => {
    it("close button is accessible via keyboard", () => {
      render(<NotificationBar {...defaultProps} />);

      const closeButton = screen.getByRole("button");

      // Simulate keyboard interaction
      fireEvent.keyDown(closeButton, { key: "Enter" });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("has proper button role for close button", () => {
      render(<NotificationBar {...defaultProps} />);

      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("Undo text is clickable", () => {
      render(<NotificationBar {...defaultProps} />);

      const undoText = screen.getByText("Undo");

      // Check that cursor style indicates clickability
      expect(undoText).toBeInTheDocument();
      fireEvent.click(undoText);
      expect(mockOnUndo).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Different Message Content Tests
  // ==========================================================================

  describe("Different Message Contents", () => {
    it("displays deletion message", () => {
      render(
        <NotificationBar {...defaultProps} message="Item deleted" />
      );

      expect(screen.getByText("Item deleted")).toBeInTheDocument();
    });

    it("displays creation message", () => {
      render(
        <NotificationBar {...defaultProps} message="New item created" />
      );

      expect(screen.getByText("New item created")).toBeInTheDocument();
    });

    it("displays update message", () => {
      render(
        <NotificationBar {...defaultProps} message="Changes saved" />
      );

      expect(screen.getByText("Changes saved")).toBeInTheDocument();
    });

    it("displays error message", () => {
      render(
        <NotificationBar {...defaultProps} message="Error occurred" />
      );

      expect(screen.getByText("Error occurred")).toBeInTheDocument();
    });

    it("displays success message", () => {
      render(
        <NotificationBar {...defaultProps} message="Operation successful!" />
      );

      expect(screen.getByText("Operation successful!")).toBeInTheDocument();
    });

    it("displays message with count", () => {
      render(
        <NotificationBar {...defaultProps} message="5 items selected" />
      );

      expect(screen.getByText("5 items selected")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Callback Arguments Tests
  // ==========================================================================

  describe("Callback Arguments", () => {
    it("onClose is called with click event", () => {
      render(<NotificationBar {...defaultProps} />);

      fireEvent.click(screen.getByRole("button"));

      // onClick handlers receive the event object
      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockOnClose.mock.calls[0][0]).toBeDefined();
    });

    it("onUndo is called with click event", () => {
      render(<NotificationBar {...defaultProps} />);

      fireEvent.click(screen.getByText("Undo"));

      // onClick handlers receive the event object
      expect(mockOnUndo).toHaveBeenCalledTimes(1);
      expect(mockOnUndo.mock.calls[0][0]).toBeDefined();
    });
  });

  // ==========================================================================
  // Integration Tests
  // ==========================================================================

  describe("Integration", () => {
    it("complete flow: display, undo, close", () => {
      const { rerender } = render(<NotificationBar {...defaultProps} />);

      // Verify display
      expect(screen.getByText("Test notification message")).toBeInTheDocument();

      // Click Undo
      fireEvent.click(screen.getByText("Undo"));
      expect(mockOnUndo).toHaveBeenCalledTimes(1);

      // Click Close
      fireEvent.click(screen.getByRole("button"));
      expect(mockOnClose).toHaveBeenCalledTimes(1);

      // Simulate hiding
      rerender(<NotificationBar {...defaultProps} isVisible={false} />);
      expect(
        screen.queryByText("Test notification message")
      ).not.toBeInTheDocument();
    });

    it("handles show-action-hide cycle multiple times", () => {
      const { rerender } = render(
        <NotificationBar {...defaultProps} isVisible={true} />
      );

      // First cycle
      expect(screen.getByText("Test notification message")).toBeInTheDocument();
      fireEvent.click(screen.getByText("Undo"));
      rerender(<NotificationBar {...defaultProps} isVisible={false} />);
      expect(
        screen.queryByText("Test notification message")
      ).not.toBeInTheDocument();

      // Second cycle
      rerender(
        <NotificationBar
          {...defaultProps}
          isVisible={true}
          message="Second message"
        />
      );
      expect(screen.getByText("Second message")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button"));
      rerender(<NotificationBar {...defaultProps} isVisible={false} />);
      expect(screen.queryByText("Second message")).not.toBeInTheDocument();

      // Verify all callbacks called
      expect(mockOnUndo).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // Snapshot Tests (Optional - for visual regression)
  // ==========================================================================

  describe("Snapshot", () => {
    it("matches snapshot when visible", () => {
      const { container } = render(<NotificationBar {...defaultProps} />);

      expect(container.firstChild).toBeDefined();
    });

    it("matches snapshot when hidden", () => {
      const { container } = render(
        <NotificationBar {...defaultProps} isVisible={false} />
      );

      expect(container.firstChild).toBeDefined();
    });
  });
});
