/**
 * @file apiInterceptor.test.ts
 * @description Tests for axios interceptor error handler to achieve 95%+ coverage
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ==========================================================================
// Tests for exported functions (these work with normal imports)
// ==========================================================================

describe("apiInterceptor - state management", () => {
  beforeEach(async () => {
    vi.resetModules();
  });

  it("should set and get session expiration modal state", async () => {
    const {
      setSessionExpirationModalActive,
      isSessionExpirationModalActive,
    } = await import("./apiInterceptor");

    // Initially false
    setSessionExpirationModalActive(false);
    expect(isSessionExpirationModalActive()).toBe(false);

    // Set to true
    setSessionExpirationModalActive(true);
    expect(isSessionExpirationModalActive()).toBe(true);

    // Set back to false
    setSessionExpirationModalActive(false);
    expect(isSessionExpirationModalActive()).toBe(false);
  });

  it("should toggle state correctly multiple times", async () => {
    const {
      setSessionExpirationModalActive,
      isSessionExpirationModalActive,
    } = await import("./apiInterceptor");

    setSessionExpirationModalActive(false);
    expect(isSessionExpirationModalActive()).toBe(false);

    setSessionExpirationModalActive(true);
    expect(isSessionExpirationModalActive()).toBe(true);

    setSessionExpirationModalActive(true);
    expect(isSessionExpirationModalActive()).toBe(true);

    setSessionExpirationModalActive(false);
    expect(isSessionExpirationModalActive()).toBe(false);
  });

  it("should export default axios instance", async () => {
    const module = await import("./apiInterceptor");
    expect(module.default).toBeDefined();
  });
});

// ==========================================================================
// Tests for axios interceptor error handler with mocked dependencies
// ==========================================================================

describe("apiInterceptor - axios interceptor", () => {
  // Store interceptor callbacks
  let capturedSuccessHandler: ((response: any) => any) | null = null;
  let capturedErrorHandler: ((error: Error) => Promise<never>) | null = null;
  let mockCheckAndHandleAuthError: ReturnType<typeof vi.fn>;
  let mockSaveCurrentLocationForRedirect: ReturnType<typeof vi.fn>;
  let setSessionExpirationModalActive: (active: boolean) => void;

  beforeEach(async () => {
    vi.resetModules();
    capturedSuccessHandler = null;
    capturedErrorHandler = null;

    // Create mock functions
    mockCheckAndHandleAuthError = vi.fn().mockReturnValue(false);
    mockSaveCurrentLocationForRedirect = vi.fn();

    // Mock the services
    vi.doMock("../services/authErrorService", () => ({
      checkAndHandleAuthError: mockCheckAndHandleAuthError,
    }));

    vi.doMock("../services/urlPreservationService", () => ({
      saveCurrentLocationForRedirect: mockSaveCurrentLocationForRedirect,
    }));

    // Mock axios to capture the interceptor callbacks
    vi.doMock("axios", () => {
      return {
        default: {
          interceptors: {
            response: {
              use: (
                successHandler: (response: any) => any,
                errorHandler: (error: Error) => Promise<never>
              ) => {
                capturedSuccessHandler = successHandler;
                capturedErrorHandler = errorHandler;
                return 0;
              },
            },
            request: { use: vi.fn() },
          },
          defaults: { headers: { common: {} } },
        },
      };
    });

    // Mock window.location
    Object.defineProperty(window, "location", {
      value: {
        pathname: "/test/path",
        search: "?query=value",
        hash: "#section",
      },
      writable: true,
      configurable: true,
    });

    // Import the module to trigger interceptor registration
    const module = await import("./apiInterceptor");
    setSessionExpirationModalActive = module.setSessionExpirationModalActive;
  });

  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  describe("interceptor registration", () => {
    it("should register response interceptor with success and error handlers", () => {
      expect(capturedSuccessHandler).toBeDefined();
      expect(typeof capturedSuccessHandler).toBe("function");
      expect(capturedErrorHandler).toBeDefined();
      expect(typeof capturedErrorHandler).toBe("function");
    });
  });

  describe("success handler (line 18)", () => {
    it("should pass through response unchanged", () => {
      const response = { data: "test", status: 200 };
      const result = capturedSuccessHandler!(response);
      expect(result).toBe(response);
    });

    it("should pass through response with all properties", () => {
      const response = {
        data: { message: "success" },
        status: 200,
        statusText: "OK",
        headers: { "content-type": "application/json" },
        config: {},
      };
      const result = capturedSuccessHandler!(response);
      expect(result).toEqual(response);
    });
  });

  describe("error handler (lines 19-33)", () => {
    it("should call checkAndHandleAuthError with the error (line 20)", async () => {
      const testError = new Error("Test error");
      mockCheckAndHandleAuthError.mockReturnValue(false);

      await expect(capturedErrorHandler!(testError)).rejects.toThrow("Test error");
      expect(mockCheckAndHandleAuthError).toHaveBeenCalledWith(testError);
      expect(mockCheckAndHandleAuthError).toHaveBeenCalledTimes(1);
    });

    it("should save URL when auth error AND modal NOT active (lines 24-30)", async () => {
      const authError = new Error("Unauthorized");
      mockCheckAndHandleAuthError.mockReturnValue(true);
      setSessionExpirationModalActive(false);

      await expect(capturedErrorHandler!(authError)).rejects.toThrow("Unauthorized");

      expect(mockSaveCurrentLocationForRedirect).toHaveBeenCalledWith(
        "/test/path?query=value#section"
      );
      expect(mockSaveCurrentLocationForRedirect).toHaveBeenCalledTimes(1);
    });

    it("should NOT save URL when auth error BUT modal IS active (line 24 false branch)", async () => {
      const authError = new Error("Session expired");
      mockCheckAndHandleAuthError.mockReturnValue(true);
      setSessionExpirationModalActive(true);

      await expect(capturedErrorHandler!(authError)).rejects.toThrow("Session expired");

      expect(mockSaveCurrentLocationForRedirect).not.toHaveBeenCalled();
    });

    it("should NOT save URL when NOT an auth error (line 24 false branch)", async () => {
      const networkError = new Error("Network error");
      mockCheckAndHandleAuthError.mockReturnValue(false);
      setSessionExpirationModalActive(false);

      await expect(capturedErrorHandler!(networkError)).rejects.toThrow("Network error");

      expect(mockSaveCurrentLocationForRedirect).not.toHaveBeenCalled();
    });

    it("should always reject with original error (line 32)", async () => {
      const originalError = new Error("Original error");
      mockCheckAndHandleAuthError.mockReturnValue(false);

      try {
        await capturedErrorHandler!(originalError);
        expect.fail("Should have rejected");
      } catch (error) {
        expect(error).toBe(originalError);
      }
    });

    it("should reject with same error after saving URL", async () => {
      const authError = new Error("401 Unauthorized");
      mockCheckAndHandleAuthError.mockReturnValue(true);
      setSessionExpirationModalActive(false);

      try {
        await capturedErrorHandler!(authError);
        expect.fail("Should have rejected");
      } catch (error) {
        expect(error).toBe(authError);
      }

      expect(mockSaveCurrentLocationForRedirect).toHaveBeenCalled();
    });
  });

  describe("URL construction (lines 25-29)", () => {
    it("should concatenate pathname, search, and hash", async () => {
      mockCheckAndHandleAuthError.mockReturnValue(true);
      setSessionExpirationModalActive(false);

      await expect(capturedErrorHandler!(new Error("Auth"))).rejects.toThrow();

      expect(mockSaveCurrentLocationForRedirect).toHaveBeenCalledWith(
        "/test/path?query=value#section"
      );
    });
  });

  describe("conditional logic (line 24)", () => {
    it("condition: isAuthError=true, modal=false -> saves URL", async () => {
      mockCheckAndHandleAuthError.mockReturnValue(true);
      setSessionExpirationModalActive(false);

      await expect(capturedErrorHandler!(new Error("Auth"))).rejects.toThrow();
      expect(mockSaveCurrentLocationForRedirect).toHaveBeenCalled();
    });

    it("condition: isAuthError=true, modal=true -> does NOT save URL", async () => {
      mockCheckAndHandleAuthError.mockReturnValue(true);
      setSessionExpirationModalActive(true);

      await expect(capturedErrorHandler!(new Error("Auth"))).rejects.toThrow();
      expect(mockSaveCurrentLocationForRedirect).not.toHaveBeenCalled();
    });

    it("condition: isAuthError=false, modal=false -> does NOT save URL", async () => {
      mockCheckAndHandleAuthError.mockReturnValue(false);
      setSessionExpirationModalActive(false);

      await expect(capturedErrorHandler!(new Error("Other"))).rejects.toThrow();
      expect(mockSaveCurrentLocationForRedirect).not.toHaveBeenCalled();
    });

    it("condition: isAuthError=false, modal=true -> does NOT save URL", async () => {
      mockCheckAndHandleAuthError.mockReturnValue(false);
      setSessionExpirationModalActive(true);

      await expect(capturedErrorHandler!(new Error("Other"))).rejects.toThrow();
      expect(mockSaveCurrentLocationForRedirect).not.toHaveBeenCalled();
    });
  });
});
