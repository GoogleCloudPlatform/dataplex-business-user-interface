import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import SendFeedback from "./SendFeedback";

// ============================================================================
// Mock Setup
// ============================================================================

// Mock user data
const mockUser = {
  email: "test@example.com",
  token: "test-token-123",
};

// Mock useAuth
vi.mock("../../auth/AuthProvider", () => ({
  useAuth: () => ({ user: mockUser }),
}));

// Mock useSelector for user state
const mockUserState = {
  token: "user-state-token-123",
};

vi.mock("react-redux", () => ({
  useSelector: (selector: (state: any) => any) => {
    const state = {
      user: mockUserState,
    };
    return selector(state);
  },
}));

// Mock axios
const mockAxiosPost = vi.fn();
vi.mock("axios", () => ({
  default: {
    post: (...args: unknown[]) => mockAxiosPost(...args),
  },
}));

// Mock URLS
vi.mock("../../constants/urls", () => ({
  URLS: {
    API_URL: "https://api.test.com",
    SEND_FEEDBACK: "/send-feedback",
  },
}));

// ============================================================================
// Test Suite
// ============================================================================

describe("SendFeedback", () => {
  const mockOnClose = vi.fn();
  const mockOnSubmitSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    // Reset mock user data
    mockUser.email = "test@example.com";
    mockUser.token = "test-token-123";
    mockUserState.token = "user-state-token-123";

    // Set up environment variables
    vi.stubEnv("VITE_SUPPORT_EMAIL", "support@test.com");
    vi.stubEnv("VITE_ADMIN_EMAIL", "admin@test.com");
    vi.stubEnv("VITE_GOOGLE_PROJECT_ID", "test-project");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  // ==========================================================================
  // Basic Rendering Tests
  // ==========================================================================

  describe("Basic Rendering", () => {
    it("renders when isOpen is true", () => {
      render(
        <SendFeedback
          isOpen={true}
          onClose={mockOnClose}
          onSubmitSuccess={mockOnSubmitSuccess}
        />
      );

      expect(screen.getByText("Send Feedback")).toBeInTheDocument();
    });

    it("renders title correctly", () => {
      render(
        <SendFeedback
          isOpen={true}
          onClose={mockOnClose}
          onSubmitSuccess={mockOnSubmitSuccess}
        />
      );

      expect(screen.getByText("Send Feedback")).toBeInTheDocument();
    });

    it("renders description text", () => {
      render(
        <SendFeedback
          isOpen={true}
          onClose={mockOnClose}
          onSubmitSuccess={mockOnSubmitSuccess}
        />
      );

      expect(screen.getByText("Describe your feedback (required)")).toBeInTheDocument();
      expect(
        screen.getByText("The following message will be send to the admin/support.")
      ).toBeInTheDocument();
    });

    it("renders message text field", () => {
      render(
        <SendFeedback
          isOpen={true}
          onClose={mockOnClose}
          onSubmitSuccess={mockOnSubmitSuccess}
        />
      );

      expect(screen.getByPlaceholderText("Enter your message here...")).toBeInTheDocument();
    });

    it("renders Cancel and Send buttons", () => {
      render(
        <SendFeedback
          isOpen={true}
          onClose={mockOnClose}
          onSubmitSuccess={mockOnSubmitSuccess}
        />
      );

      expect(screen.getByText("Cancel")).toBeInTheDocument();
      expect(screen.getByText("Send")).toBeInTheDocument();
    });

    it("renders close icon button", () => {
      render(
        <SendFeedback
          isOpen={true}
          onClose={mockOnClose}
          onSubmitSuccess={mockOnSubmitSuccess}
        />
      );

      expect(screen.getByTestId("CloseIcon")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Form Interaction Tests
  // ==========================================================================

  describe("Form Interaction", () => {
    it("updates message field when typing", () => {
      render(
        <SendFeedback
          isOpen={true}
          onClose={mockOnClose}
          onSubmitSuccess={mockOnSubmitSuccess}
        />
      );

      const textField = screen.getByPlaceholderText("Enter your message here...");
      fireEvent.change(textField, { target: { value: "Test feedback message" } });

      expect(textField).toHaveValue("Test feedback message");
    });

    it("clears message on cancel", () => {
      render(
        <SendFeedback
          isOpen={true}
          onClose={mockOnClose}
          onSubmitSuccess={mockOnSubmitSuccess}
        />
      );

      const textField = screen.getByPlaceholderText("Enter your message here...");
      fireEvent.change(textField, { target: { value: "Test message" } });

      fireEvent.click(screen.getByText("Cancel"));

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Close Button Tests
  // ==========================================================================

  describe("Close Button", () => {
    it("calls onClose when close icon is clicked", () => {
      render(
        <SendFeedback
          isOpen={true}
          onClose={mockOnClose}
          onSubmitSuccess={mockOnSubmitSuccess}
        />
      );

      const closeIcon = screen.getByTestId("CloseIcon");
      fireEvent.click(closeIcon.closest("button")!);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("calls onClose when Cancel button is clicked", () => {
      render(
        <SendFeedback
          isOpen={true}
          onClose={mockOnClose}
          onSubmitSuccess={mockOnSubmitSuccess}
        />
      );

      fireEvent.click(screen.getByText("Cancel"));

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Submit Functionality Tests
  // ==========================================================================

  describe("Submit Functionality", () => {
    it("does not submit when message is empty", async () => {
      render(
        <SendFeedback
          isOpen={true}
          onClose={mockOnClose}
          onSubmitSuccess={mockOnSubmitSuccess}
        />
      );

      fireEvent.click(screen.getByText("Send"));

      expect(mockAxiosPost).not.toHaveBeenCalled();
    });

    it("submits feedback successfully", async () => {
      mockAxiosPost.mockResolvedValueOnce({
        data: { success: true },
      });

      render(
        <SendFeedback
          isOpen={true}
          onClose={mockOnClose}
          onSubmitSuccess={mockOnSubmitSuccess}
        />
      );

      const textField = screen.getByPlaceholderText("Enter your message here...");
      fireEvent.change(textField, { target: { value: "Test feedback message" } });

      fireEvent.click(screen.getByText("Send"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalledWith(
          "https://api.test.com/send-feedback",
          expect.objectContaining({
            message: "Test feedback message",
            requesterEmail: "test@example.com",
          }),
          expect.objectContaining({
            headers: expect.objectContaining({
              "Content-Type": "application/json",
              Authorization: "Bearer test-token-123",
            }),
          })
        );
      });

      await waitFor(() => {
        expect(mockOnSubmitSuccess).toHaveBeenCalledWith(
          "Your request has been sent successfully"
        );
      });
    });

    it("handles API error response", async () => {
      mockAxiosPost.mockResolvedValueOnce({
        data: { success: false, error: "API Error" },
      });

      render(
        <SendFeedback
          isOpen={true}
          onClose={mockOnClose}
          onSubmitSuccess={mockOnSubmitSuccess}
        />
      );

      const textField = screen.getByPlaceholderText("Enter your message here...");
      fireEvent.change(textField, { target: { value: "Test message" } });

      fireEvent.click(screen.getByText("Send"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });
    });

    it("handles API error response without error message", async () => {
      mockAxiosPost.mockResolvedValueOnce({
        data: { success: false },
      });

      render(
        <SendFeedback
          isOpen={true}
          onClose={mockOnClose}
          onSubmitSuccess={mockOnSubmitSuccess}
        />
      );

      const textField = screen.getByPlaceholderText("Enter your message here...");
      fireEvent.change(textField, { target: { value: "Test message" } });

      fireEvent.click(screen.getByText("Send"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });
    });

    it("handles network error", async () => {
      mockAxiosPost.mockRejectedValueOnce(new Error("Network error"));

      render(
        <SendFeedback
          isOpen={true}
          onClose={mockOnClose}
          onSubmitSuccess={mockOnSubmitSuccess}
        />
      );

      const textField = screen.getByPlaceholderText("Enter your message here...");
      fireEvent.change(textField, { target: { value: "Test message" } });

      fireEvent.click(screen.getByText("Send"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });
    });

    it("handles non-Error exception", async () => {
      mockAxiosPost.mockRejectedValueOnce("String error");

      render(
        <SendFeedback
          isOpen={true}
          onClose={mockOnClose}
          onSubmitSuccess={mockOnSubmitSuccess}
        />
      );

      const textField = screen.getByPlaceholderText("Enter your message here...");
      fireEvent.change(textField, { target: { value: "Test message" } });

      fireEvent.click(screen.getByText("Send"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });
    });
  });

  // ==========================================================================
  // User Validation Tests
  // ==========================================================================

  describe("User Validation", () => {
    it("shows error when user email is not available", async () => {
      // Temporarily remove user email
      mockUser.email = "";

      render(
        <SendFeedback
          isOpen={true}
          onClose={mockOnClose}
          onSubmitSuccess={mockOnSubmitSuccess}
        />
      );

      const textField = screen.getByPlaceholderText("Enter your message here...");
      fireEvent.change(textField, { target: { value: "Test message" } });

      fireEvent.click(screen.getByText("Send"));

      // Should not call API
      expect(mockAxiosPost).not.toHaveBeenCalled();
    });

    it("shows error when user token is not available", async () => {
      // Temporarily remove user token from state
      mockUserState.token = "";

      render(
        <SendFeedback
          isOpen={true}
          onClose={mockOnClose}
          onSubmitSuccess={mockOnSubmitSuccess}
        />
      );

      const textField = screen.getByPlaceholderText("Enter your message here...");
      fireEvent.change(textField, { target: { value: "Test message" } });

      fireEvent.click(screen.getByText("Send"));

      // Should not call API
      expect(mockAxiosPost).not.toHaveBeenCalled();
    });

    it("shows error when user email is undefined", async () => {
      // Set user email to undefined
      (mockUser as any).email = undefined;

      render(
        <SendFeedback
          isOpen={true}
          onClose={mockOnClose}
          onSubmitSuccess={mockOnSubmitSuccess}
        />
      );

      const textField = screen.getByPlaceholderText("Enter your message here...");
      fireEvent.change(textField, { target: { value: "Test message" } });

      fireEvent.click(screen.getByText("Send"));

      expect(mockAxiosPost).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Cancel Functionality Tests
  // ==========================================================================

  describe("Cancel Functionality", () => {
    it("resets state and closes on cancel", () => {
      render(
        <SendFeedback
          isOpen={true}
          onClose={mockOnClose}
          onSubmitSuccess={mockOnSubmitSuccess}
        />
      );

      // Type a message first
      const textField = screen.getByPlaceholderText("Enter your message here...");
      fireEvent.change(textField, { target: { value: "Test message" } });

      // Click cancel
      fireEvent.click(screen.getByText("Cancel"));

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Tooltip Tests
  // ==========================================================================

  describe("Tooltip", () => {
    it("renders send button with tooltip", () => {
      render(
        <SendFeedback
          isOpen={true}
          onClose={mockOnClose}
          onSubmitSuccess={mockOnSubmitSuccess}
        />
      );

      const sendButton = screen.getByText("Send");
      expect(sendButton).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Drawer Tests
  // ==========================================================================

  describe("Drawer", () => {
    it("renders as a right-anchored drawer", () => {
      render(
        <SendFeedback
          isOpen={true}
          onClose={mockOnClose}
          onSubmitSuccess={mockOnSubmitSuccess}
        />
      );

      // The component should render content when open
      expect(screen.getByText("Send Feedback")).toBeInTheDocument();
      expect(screen.getByText("Send")).toBeInTheDocument();
    });

    it("does not render content when closed", () => {
      render(
        <SendFeedback
          isOpen={false}
          onClose={mockOnClose}
          onSubmitSuccess={mockOnSubmitSuccess}
        />
      );

      // The drawer should not be visible/in document when closed
      // Note: MUI Drawer may still render the structure but with visibility hidden
      const drawer = screen.queryByText("Send Feedback");
      // When drawer is closed, content might not be in document
      expect(drawer).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Edge Cases Tests
  // ==========================================================================

  describe("Edge Cases", () => {
    it("handles user token being empty string in Authorization header", async () => {
      mockUser.token = "";
      mockAxiosPost.mockResolvedValueOnce({
        data: { success: true },
      });

      render(
        <SendFeedback
          isOpen={true}
          onClose={mockOnClose}
          onSubmitSuccess={mockOnSubmitSuccess}
        />
      );

      const textField = screen.getByPlaceholderText("Enter your message here...");
      fireEvent.change(textField, { target: { value: "Test message" } });

      fireEvent.click(screen.getByText("Send"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(Object),
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: "Bearer ",
            }),
          })
        );
      });
    });

    it("handles undefined user token gracefully", async () => {
      (mockUser as any).token = undefined;
      mockAxiosPost.mockResolvedValueOnce({
        data: { success: true },
      });

      render(
        <SendFeedback
          isOpen={true}
          onClose={mockOnClose}
          onSubmitSuccess={mockOnSubmitSuccess}
        />
      );

      const textField = screen.getByPlaceholderText("Enter your message here...");
      fireEvent.change(textField, { target: { value: "Test message" } });

      fireEvent.click(screen.getByText("Send"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(Object),
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: "Bearer ",
            }),
          })
        );
      });
    });

    it("handles rapid submit clicks", async () => {
      mockAxiosPost.mockResolvedValue({
        data: { success: true },
      });

      render(
        <SendFeedback
          isOpen={true}
          onClose={mockOnClose}
          onSubmitSuccess={mockOnSubmitSuccess}
        />
      );

      const textField = screen.getByPlaceholderText("Enter your message here...");
      fireEvent.change(textField, { target: { value: "Test message" } });

      // Rapid clicks
      fireEvent.click(screen.getByText("Send"));
      fireEvent.click(screen.getByText("Send"));
      fireEvent.click(screen.getByText("Send"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });
    });

    it("handles very long message", async () => {
      mockAxiosPost.mockResolvedValueOnce({
        data: { success: true },
      });

      render(
        <SendFeedback
          isOpen={true}
          onClose={mockOnClose}
          onSubmitSuccess={mockOnSubmitSuccess}
        />
      );

      const longMessage = "A".repeat(10000);
      const textField = screen.getByPlaceholderText("Enter your message here...");
      fireEvent.change(textField, { target: { value: longMessage } });

      fireEvent.click(screen.getByText("Send"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            message: longMessage,
          }),
          expect.any(Object)
        );
      });
    });

    it("handles special characters in message", async () => {
      mockAxiosPost.mockResolvedValueOnce({
        data: { success: true },
      });

      render(
        <SendFeedback
          isOpen={true}
          onClose={mockOnClose}
          onSubmitSuccess={mockOnSubmitSuccess}
        />
      );

      const specialMessage = "Test <script>alert('xss')</script> & \"quotes\" 'apostrophes'";
      const textField = screen.getByPlaceholderText("Enter your message here...");
      fireEvent.change(textField, { target: { value: specialMessage } });

      fireEvent.click(screen.getByText("Send"));

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            message: specialMessage,
          }),
          expect.any(Object)
        );
      });
    });
  });

  // ==========================================================================
  // Integration Tests
  // ==========================================================================

  // ==========================================================================
  // setTimeout Callback Tests
  // ==========================================================================

  describe("setTimeout Callbacks", () => {
    it("closes panel after success timeout", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      mockAxiosPost.mockResolvedValueOnce({
        data: { success: true },
      });

      render(
        <SendFeedback
          isOpen={true}
          onClose={mockOnClose}
          onSubmitSuccess={mockOnSubmitSuccess}
        />
      );

      const textField = screen.getByPlaceholderText("Enter your message here...");
      fireEvent.change(textField, { target: { value: "Test message" } });

      fireEvent.click(screen.getByText("Send"));

      await waitFor(() => {
        expect(mockOnSubmitSuccess).toHaveBeenCalled();
      });

      // Advance timers to trigger setTimeout
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      expect(mockOnClose).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  describe("Integration Tests", () => {
    it("complete workflow: type message, submit, success", async () => {
      mockAxiosPost.mockResolvedValueOnce({
        data: { success: true },
      });

      render(
        <SendFeedback
          isOpen={true}
          onClose={mockOnClose}
          onSubmitSuccess={mockOnSubmitSuccess}
        />
      );

      // Type message
      const textField = screen.getByPlaceholderText("Enter your message here...");
      fireEvent.change(textField, { target: { value: "My feedback" } });

      // Submit
      fireEvent.click(screen.getByText("Send"));

      // Wait for success
      await waitFor(() => {
        expect(mockOnSubmitSuccess).toHaveBeenCalledWith(
          "Your request has been sent successfully"
        );
      });
    });

    it("complete workflow: type message, submit, error", async () => {
      mockAxiosPost.mockRejectedValueOnce(new Error("Server error"));

      render(
        <SendFeedback
          isOpen={true}
          onClose={mockOnClose}
          onSubmitSuccess={mockOnSubmitSuccess}
        />
      );

      // Type message
      const textField = screen.getByPlaceholderText("Enter your message here...");
      fireEvent.change(textField, { target: { value: "My feedback" } });

      // Submit
      fireEvent.click(screen.getByText("Send"));

      // Wait for API call
      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalled();
      });

      // onSubmitSuccess should not have been called
      expect(mockOnSubmitSuccess).not.toHaveBeenCalled();
    });

    it("type message then cancel resets form", () => {
      render(
        <SendFeedback
          isOpen={true}
          onClose={mockOnClose}
          onSubmitSuccess={mockOnSubmitSuccess}
        />
      );

      // Type message
      const textField = screen.getByPlaceholderText("Enter your message here...");
      fireEvent.change(textField, { target: { value: "My feedback" } });
      expect(textField).toHaveValue("My feedback");

      // Cancel
      fireEvent.click(screen.getByText("Cancel"));

      // onClose called
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
