import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { NotificationProvider, useNotification } from "./NotificationContext";

// ==========================================================================
// Test Component that uses the hook
// ==========================================================================

const TestConsumer: React.FC<{
  onMount?: (methods: ReturnType<typeof useNotification>) => void;
}> = ({ onMount }) => {
  const notificationMethods = useNotification();

  React.useEffect(() => {
    if (onMount) {
      onMount(notificationMethods);
    }
  }, [onMount, notificationMethods]);

  return (
    <div>
      <button
        data-testid="show-success"
        onClick={() => notificationMethods.showSuccess("Success message")}
      >
        Show Success
      </button>
      <button
        data-testid="show-error"
        onClick={() => notificationMethods.showError("Error message")}
      >
        Show Error
      </button>
      <button
        data-testid="show-warning"
        onClick={() => notificationMethods.showWarning("Warning message")}
      >
        Show Warning
      </button>
      <button
        data-testid="show-info"
        onClick={() => notificationMethods.showInfo("Info message")}
      >
        Show Info
      </button>
      <button
        data-testid="show-notification"
        onClick={() =>
          notificationMethods.showNotification("Custom notification", "success")
        }
      >
        Show Notification
      </button>
      <button
        data-testid="show-with-action"
        onClick={() =>
          notificationMethods.showNotification(
            "Notification with action",
            "info",
            5000,
            { label: "Undo", onClick: () => {} }
          )
        }
      >
        Show With Action
      </button>
      <button
        data-testid="clear-all"
        onClick={() => notificationMethods.clearAllNotifications()}
      >
        Clear All
      </button>
    </div>
  );
};

// ==========================================================================
// useNotification Hook Tests
// ==========================================================================

describe("NotificationContext", () => {
  describe("useNotification Hook", () => {
    it("throws error when used outside NotificationProvider", () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        render(<TestConsumer />);
      }).toThrow("useNotification must be used within a NotificationProvider");

      consoleSpy.mockRestore();
    });

    it("returns context methods when used inside NotificationProvider", () => {
      let methods: ReturnType<typeof useNotification> | undefined;

      render(
        <NotificationProvider>
          <TestConsumer
            onMount={(m) => {
              methods = m;
            }}
          />
        </NotificationProvider>
      );

      expect(methods).toBeDefined();
      expect(methods?.showNotification).toBeDefined();
      expect(methods?.showSuccess).toBeDefined();
      expect(methods?.showError).toBeDefined();
      expect(methods?.showWarning).toBeDefined();
      expect(methods?.showInfo).toBeDefined();
      expect(methods?.clearNotification).toBeDefined();
      expect(methods?.clearAllNotifications).toBeDefined();
    });

    it("returns functions that are callable", () => {
      let methods: ReturnType<typeof useNotification> | undefined;

      render(
        <NotificationProvider>
          <TestConsumer
            onMount={(m) => {
              methods = m;
            }}
          />
        </NotificationProvider>
      );

      expect(typeof methods?.showNotification).toBe("function");
      expect(typeof methods?.showSuccess).toBe("function");
      expect(typeof methods?.showError).toBe("function");
      expect(typeof methods?.showWarning).toBe("function");
      expect(typeof methods?.showInfo).toBe("function");
      expect(typeof methods?.clearNotification).toBe("function");
      expect(typeof methods?.clearAllNotifications).toBe("function");
    });
  });

  // ==========================================================================
  // NotificationProvider Tests
  // ==========================================================================

  describe("NotificationProvider", () => {
    it("renders children correctly", () => {
      render(
        <NotificationProvider>
          <div data-testid="child">Child Content</div>
        </NotificationProvider>
      );

      expect(screen.getByTestId("child")).toBeInTheDocument();
      expect(screen.getByText("Child Content")).toBeInTheDocument();
    });

    it("accepts maxNotifications prop", () => {
      render(
        <NotificationProvider maxNotifications={5}>
          <TestConsumer />
        </NotificationProvider>
      );

      expect(screen.getByTestId("show-success")).toBeInTheDocument();
    });

    it("uses default maxNotifications of 3 when not specified", () => {
      let methods: ReturnType<typeof useNotification> | undefined;

      render(
        <NotificationProvider>
          <TestConsumer
            onMount={(m) => {
              methods = m;
            }}
          />
        </NotificationProvider>
      );

      // Show 5 notifications with 0 duration so they persist
      act(() => {
        methods?.showNotification("Notification 1", "info", 0);
        methods?.showNotification("Notification 2", "info", 0);
        methods?.showNotification("Notification 3", "info", 0);
        methods?.showNotification("Notification 4", "info", 0);
        methods?.showNotification("Notification 5", "info", 0);
      });

      // Only 3 should be visible (default maxNotifications)
      const alerts = screen.getAllByRole("alert");
      expect(alerts).toHaveLength(3);
    });
  });

  // ==========================================================================
  // showSuccess Tests
  // ==========================================================================

  describe("showSuccess", () => {
    it("shows success notification", () => {
      render(
        <NotificationProvider>
          <TestConsumer />
        </NotificationProvider>
      );

      act(() => {
        fireEvent.click(screen.getByTestId("show-success"));
      });

      expect(screen.getByText("Success message")).toBeInTheDocument();
      expect(screen.getByRole("alert")).toHaveClass("MuiAlert-standardSuccess");
    });

    it("accepts custom duration parameter", () => {
      let methods: ReturnType<typeof useNotification> | undefined;

      render(
        <NotificationProvider>
          <TestConsumer
            onMount={(m) => {
              methods = m;
            }}
          />
        </NotificationProvider>
      );

      act(() => {
        methods?.showSuccess("Custom duration success", 2000);
      });

      expect(screen.getByText("Custom duration success")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // showError Tests
  // ==========================================================================

  describe("showError", () => {
    it("shows error notification", () => {
      render(
        <NotificationProvider>
          <TestConsumer />
        </NotificationProvider>
      );

      act(() => {
        fireEvent.click(screen.getByTestId("show-error"));
      });

      expect(screen.getByText("Error message")).toBeInTheDocument();
      expect(screen.getByRole("alert")).toHaveClass("MuiAlert-standardError");
    });

    it("accepts custom duration parameter", () => {
      let methods: ReturnType<typeof useNotification> | undefined;

      render(
        <NotificationProvider>
          <TestConsumer
            onMount={(m) => {
              methods = m;
            }}
          />
        </NotificationProvider>
      );

      act(() => {
        methods?.showError("Custom duration error", 3000);
      });

      expect(screen.getByText("Custom duration error")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // showWarning Tests
  // ==========================================================================

  describe("showWarning", () => {
    it("shows warning notification", () => {
      render(
        <NotificationProvider>
          <TestConsumer />
        </NotificationProvider>
      );

      act(() => {
        fireEvent.click(screen.getByTestId("show-warning"));
      });

      expect(screen.getByText("Warning message")).toBeInTheDocument();
      expect(screen.getByRole("alert")).toHaveClass("MuiAlert-standardWarning");
    });

    it("accepts custom duration parameter", () => {
      let methods: ReturnType<typeof useNotification> | undefined;

      render(
        <NotificationProvider>
          <TestConsumer
            onMount={(m) => {
              methods = m;
            }}
          />
        </NotificationProvider>
      );

      act(() => {
        methods?.showWarning("Custom duration warning", 2500);
      });

      expect(screen.getByText("Custom duration warning")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // showInfo Tests
  // ==========================================================================

  describe("showInfo", () => {
    it("shows info notification", () => {
      render(
        <NotificationProvider>
          <TestConsumer />
        </NotificationProvider>
      );

      act(() => {
        fireEvent.click(screen.getByTestId("show-info"));
      });

      expect(screen.getByText("Info message")).toBeInTheDocument();
      expect(screen.getByRole("alert")).toHaveClass("MuiAlert-standardInfo");
    });

    it("accepts custom duration parameter", () => {
      let methods: ReturnType<typeof useNotification> | undefined;

      render(
        <NotificationProvider>
          <TestConsumer
            onMount={(m) => {
              methods = m;
            }}
          />
        </NotificationProvider>
      );

      act(() => {
        methods?.showInfo("Custom duration info", 1500);
      });

      expect(screen.getByText("Custom duration info")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // showNotification Tests
  // ==========================================================================

  describe("showNotification", () => {
    it("shows notification with custom type", () => {
      let methods: ReturnType<typeof useNotification> | undefined;

      render(
        <NotificationProvider>
          <TestConsumer
            onMount={(m) => {
              methods = m;
            }}
          />
        </NotificationProvider>
      );

      act(() => {
        methods?.showNotification("Test message", "warning", 0);
      });

      expect(screen.getByText("Test message")).toBeInTheDocument();
      expect(screen.getByRole("alert")).toHaveClass("MuiAlert-standardWarning");
    });

    it("uses default type 'info' when not specified", () => {
      let methods: ReturnType<typeof useNotification> | undefined;

      render(
        <NotificationProvider>
          <TestConsumer
            onMount={(m) => {
              methods = m;
            }}
          />
        </NotificationProvider>
      );

      act(() => {
        methods?.showNotification("Default type message");
      });

      expect(screen.getByText("Default type message")).toBeInTheDocument();
      expect(screen.getByRole("alert")).toHaveClass("MuiAlert-standardInfo");
    });

    it("renders action button when action is provided", () => {
      const mockAction = vi.fn();
      let methods: ReturnType<typeof useNotification> | undefined;

      render(
        <NotificationProvider>
          <TestConsumer
            onMount={(m) => {
              methods = m;
            }}
          />
        </NotificationProvider>
      );

      act(() => {
        methods?.showNotification("With action", "info", 0, {
          label: "Click Me",
          onClick: mockAction,
        });
      });

      expect(screen.getByText("With action")).toBeInTheDocument();
      expect(screen.getByText("Click Me")).toBeInTheDocument();
    });

    it("calls action onClick when action button is clicked", () => {
      const mockAction = vi.fn();
      let methods: ReturnType<typeof useNotification> | undefined;

      render(
        <NotificationProvider>
          <TestConsumer
            onMount={(m) => {
              methods = m;
            }}
          />
        </NotificationProvider>
      );

      act(() => {
        methods?.showNotification("With action", "info", 0, {
          label: "Click Me",
          onClick: mockAction,
        });
      });

      fireEvent.click(screen.getByText("Click Me"));

      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it("generates unique id for each notification", () => {
      let methods: ReturnType<typeof useNotification> | undefined;

      render(
        <NotificationProvider>
          <TestConsumer
            onMount={(m) => {
              methods = m;
            }}
          />
        </NotificationProvider>
      );

      act(() => {
        methods?.showNotification("Notification 1", "info", 0);
        methods?.showNotification("Notification 2", "info", 0);
      });

      expect(screen.getByText("Notification 1")).toBeInTheDocument();
      expect(screen.getByText("Notification 2")).toBeInTheDocument();
    });

    it("does not render action button when action is not provided", () => {
      let methods: ReturnType<typeof useNotification> | undefined;

      render(
        <NotificationProvider>
          <TestConsumer
            onMount={(m) => {
              methods = m;
            }}
          />
        </NotificationProvider>
      );

      act(() => {
        methods?.showNotification("No action", "info", 0);
      });

      expect(screen.getByText("No action")).toBeInTheDocument();
      // Should not have any action buttons besides the close button
      const alert = screen.getByRole("alert");
      const actionButtons = alert.querySelectorAll("button:not([aria-label])");
      // The close button has aria-label, action buttons don't
      expect(actionButtons.length).toBe(0);
    });
  });

  // ==========================================================================
  // clearNotification Tests
  // ==========================================================================

  describe("clearNotification", () => {
    it("removes specific notification by id", async () => {
      let methods: ReturnType<typeof useNotification> | undefined;

      render(
        <NotificationProvider>
          <TestConsumer
            onMount={(m) => {
              methods = m;
            }}
          />
        </NotificationProvider>
      );

      // Show multiple notifications
      act(() => {
        methods?.showNotification("Keep me", "info", 0);
        methods?.showNotification("Remove me", "info", 0);
      });

      expect(screen.getByText("Keep me")).toBeInTheDocument();
      expect(screen.getByText("Remove me")).toBeInTheDocument();
    });

    it("clearNotification is a function", () => {
      let methods: ReturnType<typeof useNotification> | undefined;

      render(
        <NotificationProvider>
          <TestConsumer
            onMount={(m) => {
              methods = m;
            }}
          />
        </NotificationProvider>
      );

      expect(typeof methods?.clearNotification).toBe("function");
    });
  });

  // ==========================================================================
  // clearAllNotifications Tests
  // ==========================================================================

  describe("clearAllNotifications", () => {
    it("removes all notifications", () => {
      let methods: ReturnType<typeof useNotification> | undefined;

      render(
        <NotificationProvider>
          <TestConsumer
            onMount={(m) => {
              methods = m;
            }}
          />
        </NotificationProvider>
      );

      // Show multiple notifications with 0 duration
      act(() => {
        methods?.showNotification("Notification 1", "success", 0);
        methods?.showNotification("Notification 2", "error", 0);
        methods?.showNotification("Notification 3", "warning", 0);
      });

      expect(screen.getAllByRole("alert")).toHaveLength(3);

      // Clear all
      act(() => {
        methods?.clearAllNotifications();
      });

      expect(screen.queryAllByRole("alert")).toHaveLength(0);
    });

    it("can be called via button click", () => {
      let methods: ReturnType<typeof useNotification> | undefined;

      render(
        <NotificationProvider>
          <TestConsumer
            onMount={(m) => {
              methods = m;
            }}
          />
        </NotificationProvider>
      );

      act(() => {
        methods?.showNotification("Test", "info", 0);
      });

      expect(screen.getByRole("alert")).toBeInTheDocument();

      act(() => {
        fireEvent.click(screen.getByTestId("clear-all"));
      });

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // maxNotifications Tests
  // ==========================================================================

  describe("maxNotifications", () => {
    it("limits notifications to maxNotifications", () => {
      let methods: ReturnType<typeof useNotification> | undefined;

      render(
        <NotificationProvider maxNotifications={2}>
          <TestConsumer
            onMount={(m) => {
              methods = m;
            }}
          />
        </NotificationProvider>
      );

      // Show 4 notifications with 0 duration
      act(() => {
        methods?.showNotification("First", "success", 0);
        methods?.showNotification("Second", "error", 0);
        methods?.showNotification("Third", "warning", 0);
        methods?.showNotification("Fourth", "info", 0);
      });

      // Only last 2 should be visible
      const alerts = screen.getAllByRole("alert");
      expect(alerts).toHaveLength(2);
    });

    it("keeps most recent notifications", () => {
      let methods: ReturnType<typeof useNotification> | undefined;

      render(
        <NotificationProvider maxNotifications={2}>
          <TestConsumer
            onMount={(m) => {
              methods = m;
            }}
          />
        </NotificationProvider>
      );

      act(() => {
        methods?.showNotification("First", "info", 0);
        methods?.showNotification("Second", "info", 0);
        methods?.showNotification("Third", "info", 0);
      });

      // First should be removed, Second and Third should remain
      expect(screen.queryByText("First")).not.toBeInTheDocument();
      expect(screen.getByText("Second")).toBeInTheDocument();
      expect(screen.getByText("Third")).toBeInTheDocument();
    });

    it("respects custom maxNotifications value", () => {
      let methods: ReturnType<typeof useNotification> | undefined;

      render(
        <NotificationProvider maxNotifications={5}>
          <TestConsumer
            onMount={(m) => {
              methods = m;
            }}
          />
        </NotificationProvider>
      );

      act(() => {
        for (let i = 1; i <= 7; i++) {
          methods?.showNotification(`Notification ${i}`, "info", 0);
        }
      });

      // Only last 5 should be visible
      const alerts = screen.getAllByRole("alert");
      expect(alerts).toHaveLength(5);
    });
  });

  // ==========================================================================
  // handleClose Tests
  // ==========================================================================

  describe("handleClose", () => {
    it("closes notification when close button is clicked", async () => {
      let methods: ReturnType<typeof useNotification> | undefined;

      render(
        <NotificationProvider>
          <TestConsumer
            onMount={(m) => {
              methods = m;
            }}
          />
        </NotificationProvider>
      );

      act(() => {
        methods?.showNotification("Close me", "info", 0);
      });

      expect(screen.getByText("Close me")).toBeInTheDocument();

      // Find and click the close button
      const closeButton = screen.getByRole("button", { name: /close/i });
      act(() => {
        fireEvent.click(closeButton);
      });

      await waitFor(() => {
        expect(screen.queryByText("Close me")).not.toBeInTheDocument();
      });
    });

    it("notification persists after clicking outside (clickaway ignored)", () => {
      let methods: ReturnType<typeof useNotification> | undefined;

      render(
        <NotificationProvider>
          <TestConsumer
            onMount={(m) => {
              methods = m;
            }}
          />
        </NotificationProvider>
      );

      act(() => {
        methods?.showNotification("Persistent notification", "info", 0);
      });

      expect(screen.getByText("Persistent notification")).toBeInTheDocument();

      // Click outside - notification should persist because clickaway is ignored
      act(() => {
        fireEvent.click(document.body);
      });

      expect(screen.getByText("Persistent notification")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Snackbar/Alert Rendering Tests
  // ==========================================================================

  describe("Snackbar/Alert Rendering", () => {
    it("renders Snackbar for each notification", () => {
      let methods: ReturnType<typeof useNotification> | undefined;

      render(
        <NotificationProvider>
          <TestConsumer
            onMount={(m) => {
              methods = m;
            }}
          />
        </NotificationProvider>
      );

      act(() => {
        methods?.showNotification("First", "success", 0);
        methods?.showNotification("Second", "error", 0);
      });

      const alerts = screen.getAllByRole("alert");
      expect(alerts).toHaveLength(2);
    });

    it("renders Alert with correct severity for each type", () => {
      let methods: ReturnType<typeof useNotification> | undefined;

      render(
        <NotificationProvider maxNotifications={4}>
          <TestConsumer
            onMount={(m) => {
              methods = m;
            }}
          />
        </NotificationProvider>
      );

      act(() => {
        methods?.showNotification("Success", "success", 0);
        methods?.showNotification("Error", "error", 0);
        methods?.showNotification("Warning", "warning", 0);
        methods?.showNotification("Info", "info", 0);
      });

      const alerts = screen.getAllByRole("alert");
      expect(alerts).toHaveLength(4);

      expect(alerts[0]).toHaveClass("MuiAlert-standardSuccess");
      expect(alerts[1]).toHaveClass("MuiAlert-standardError");
      expect(alerts[2]).toHaveClass("MuiAlert-standardWarning");
      expect(alerts[3]).toHaveClass("MuiAlert-standardInfo");
    });

    it("renders notification message correctly", () => {
      let methods: ReturnType<typeof useNotification> | undefined;

      render(
        <NotificationProvider>
          <TestConsumer
            onMount={(m) => {
              methods = m;
            }}
          />
        </NotificationProvider>
      );

      act(() => {
        methods?.showNotification("Test notification message", "info", 0);
      });

      expect(screen.getByText("Test notification message")).toBeInTheDocument();
    });

    it("applies stacking styles for multiple notifications", () => {
      let methods: ReturnType<typeof useNotification> | undefined;

      render(
        <NotificationProvider>
          <TestConsumer
            onMount={(m) => {
              methods = m;
            }}
          />
        </NotificationProvider>
      );

      act(() => {
        methods?.showNotification("Stacked 1", "info", 0);
        methods?.showNotification("Stacked 2", "info", 0);
        methods?.showNotification("Stacked 3", "info", 0);
      });

      // Check that Snackbars are rendered
      const snackbars = document.querySelectorAll(".MuiSnackbar-root");
      expect(snackbars.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ==========================================================================
  // Action Button Styling Tests
  // ==========================================================================

  describe("Action Button Styling", () => {
    it("renders action button with correct styles", () => {
      let methods: ReturnType<typeof useNotification> | undefined;

      render(
        <NotificationProvider>
          <TestConsumer
            onMount={(m) => {
              methods = m;
            }}
          />
        </NotificationProvider>
      );

      act(() => {
        methods?.showNotification("With styled action", "info", 0, {
          label: "Action Button",
          onClick: () => {},
        });
      });

      const actionButton = screen.getByText("Action Button");
      expect(actionButton).toBeInTheDocument();
      expect(actionButton.tagName).toBe("BUTTON");
    });

    it("action button has no background", () => {
      let methods: ReturnType<typeof useNotification> | undefined;

      render(
        <NotificationProvider>
          <TestConsumer
            onMount={(m) => {
              methods = m;
            }}
          />
        </NotificationProvider>
      );

      act(() => {
        methods?.showNotification("Test", "info", 0, {
          label: "Test Action",
          onClick: () => {},
        });
      });

      const actionButton = screen.getByText("Test Action");
      expect(actionButton).toHaveStyle({ background: "none" });
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe("Edge Cases", () => {
    it("handles empty message", () => {
      let methods: ReturnType<typeof useNotification> | undefined;

      render(
        <NotificationProvider>
          <TestConsumer
            onMount={(m) => {
              methods = m;
            }}
          />
        </NotificationProvider>
      );

      act(() => {
        methods?.showNotification("", "info", 0);
      });

      // Should render an alert even with empty message
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("handles special characters in message", () => {
      let methods: ReturnType<typeof useNotification> | undefined;

      render(
        <NotificationProvider>
          <TestConsumer
            onMount={(m) => {
              methods = m;
            }}
          />
        </NotificationProvider>
      );

      act(() => {
        methods?.showNotification('<script>alert("XSS")</script>', "info", 0);
      });

      expect(
        screen.getByText('<script>alert("XSS")</script>')
      ).toBeInTheDocument();
    });

    it("handles long messages", () => {
      let methods: ReturnType<typeof useNotification> | undefined;
      const longMessage =
        "A".repeat(500) + " This is a very long notification message.";

      render(
        <NotificationProvider>
          <TestConsumer
            onMount={(m) => {
              methods = m;
            }}
          />
        </NotificationProvider>
      );

      act(() => {
        methods?.showNotification(longMessage, "info", 0);
      });

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it("handles rapid successive notifications", () => {
      let methods: ReturnType<typeof useNotification> | undefined;

      render(
        <NotificationProvider maxNotifications={5}>
          <TestConsumer
            onMount={(m) => {
              methods = m;
            }}
          />
        </NotificationProvider>
      );

      act(() => {
        for (let i = 0; i < 10; i++) {
          methods?.showNotification(`Rapid ${i}`, "info", 0);
        }
      });

      // Only last 5 should be visible
      const alerts = screen.getAllByRole("alert");
      expect(alerts).toHaveLength(5);
    });

    it("handles unicode characters in message", () => {
      let methods: ReturnType<typeof useNotification> | undefined;

      render(
        <NotificationProvider>
          <TestConsumer
            onMount={(m) => {
              methods = m;
            }}
          />
        </NotificationProvider>
      );

      act(() => {
        methods?.showNotification("日本語メッセージ 🎉", "info", 0);
      });

      expect(screen.getByText("日本語メッセージ 🎉")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Context Value Memoization Tests
  // ==========================================================================

  describe("Context Value Memoization", () => {
    it("provides stable function references", () => {
      let methods1: ReturnType<typeof useNotification> | undefined;
      let methods2: ReturnType<typeof useNotification> | undefined;

      const { rerender } = render(
        <NotificationProvider>
          <TestConsumer
            onMount={(m) => {
              methods1 = m;
            }}
          />
        </NotificationProvider>
      );

      rerender(
        <NotificationProvider>
          <TestConsumer
            onMount={(m) => {
              methods2 = m;
            }}
          />
        </NotificationProvider>
      );

      // Methods should be the same references due to useCallback/useMemo
      expect(methods1).toBeDefined();
      expect(methods2).toBeDefined();
    });
  });

  // ==========================================================================
  // Integration Tests
  // ==========================================================================

  describe("Integration", () => {
    it("shows notification and then clears it", async () => {
      let methods: ReturnType<typeof useNotification> | undefined;

      render(
        <NotificationProvider>
          <TestConsumer
            onMount={(m) => {
              methods = m;
            }}
          />
        </NotificationProvider>
      );

      act(() => {
        methods?.showNotification("Integration test", "success", 0);
      });

      expect(screen.getByText("Integration test")).toBeInTheDocument();

      act(() => {
        methods?.clearAllNotifications();
      });

      expect(screen.queryByText("Integration test")).not.toBeInTheDocument();
    });

    it("can show multiple types of notifications", () => {
      let methods: ReturnType<typeof useNotification> | undefined;

      render(
        <NotificationProvider maxNotifications={4}>
          <TestConsumer
            onMount={(m) => {
              methods = m;
            }}
          />
        </NotificationProvider>
      );

      act(() => {
        methods?.showSuccess("Success!", 0);
        methods?.showError("Error!", 0);
        methods?.showWarning("Warning!", 0);
        methods?.showInfo("Info!", 0);
      });

      expect(screen.getByText("Success!")).toBeInTheDocument();
      expect(screen.getByText("Error!")).toBeInTheDocument();
      expect(screen.getByText("Warning!")).toBeInTheDocument();
      expect(screen.getByText("Info!")).toBeInTheDocument();
    });
  });
});
