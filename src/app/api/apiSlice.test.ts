import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { BaseQueryApi, FetchArgs } from '@reduxjs/toolkit/query/react';

// Mock the modules before importing apiSlice
const mockFetchBaseQuery = vi.fn();
const mockCreateApi = vi.fn();

vi.mock('@reduxjs/toolkit/query/react', async () => {
  const actual = await vi.importActual('@reduxjs/toolkit/query/react');
  return {
    ...actual,
    fetchBaseQuery: (...args: unknown[]) => {
      mockFetchBaseQuery(...args);
      return vi.fn();
    },
    createApi: (...args: unknown[]) => {
      mockCreateApi(...args);
      return {
        reducerPath: 'api',
        reducer: vi.fn(),
        middleware: vi.fn(),
        endpoints: {},
      };
    },
  };
});

// Mock isAuthenticationError
const mockIsAuthenticationError = vi.fn();
vi.mock('../../services/authErrorService', () => ({
  isAuthenticationError: (error: unknown) => mockIsAuthenticationError(error),
}));

// Mock import.meta.env
vi.stubGlobal('import', {
  meta: {
    env: {
      VITE_API_URL: 'https://api.example.com',
    },
  },
});

describe('apiSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset modules to get fresh imports
    vi.resetModules();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('fetchBaseQuery configuration', () => {
    it('should configure fetchBaseQuery with correct baseUrl', async () => {
      // Re-import to trigger the module initialization
      await import('./apiSlice');

      expect(mockFetchBaseQuery).toHaveBeenCalled();
      const config = mockFetchBaseQuery.mock.calls[0][0];
      expect(config).toHaveProperty('baseUrl');
      expect(config).toHaveProperty('prepareHeaders');
    });

    it('should have prepareHeaders function defined', async () => {
      await import('./apiSlice');

      const config = mockFetchBaseQuery.mock.calls[0][0];
      expect(typeof config.prepareHeaders).toBe('function');
    });
  });

  describe('prepareHeaders', () => {
    it('should set Authorization header when token exists', async () => {
      await import('./apiSlice');

      const config = mockFetchBaseQuery.mock.calls[0][0];
      const prepareHeaders = config.prepareHeaders;

      const mockHeaders = new Headers();
      const mockGetState = vi.fn().mockReturnValue({
        user: { token: 'test-token-123' },
      });

      const result = prepareHeaders(mockHeaders, { getState: mockGetState });

      expect(result.get('Authorization')).toBe('Bearer test-token-123');
    });

    it('should not set Authorization header when token is empty', async () => {
      await import('./apiSlice');

      const config = mockFetchBaseQuery.mock.calls[0][0];
      const prepareHeaders = config.prepareHeaders;

      const mockHeaders = new Headers();
      const mockGetState = vi.fn().mockReturnValue({
        user: { token: '' },
      });

      const result = prepareHeaders(mockHeaders, { getState: mockGetState });

      expect(result.get('Authorization')).toBeNull();
    });

    it('should not set Authorization header when token is null', async () => {
      await import('./apiSlice');

      const config = mockFetchBaseQuery.mock.calls[0][0];
      const prepareHeaders = config.prepareHeaders;

      const mockHeaders = new Headers();
      const mockGetState = vi.fn().mockReturnValue({
        user: { token: null },
      });

      const result = prepareHeaders(mockHeaders, { getState: mockGetState });

      expect(result.get('Authorization')).toBeNull();
    });

    it('should not set Authorization header when token is undefined', async () => {
      await import('./apiSlice');

      const config = mockFetchBaseQuery.mock.calls[0][0];
      const prepareHeaders = config.prepareHeaders;

      const mockHeaders = new Headers();
      const mockGetState = vi.fn().mockReturnValue({
        user: { token: undefined },
      });

      const result = prepareHeaders(mockHeaders, { getState: mockGetState });

      expect(result.get('Authorization')).toBeNull();
    });

    it('should return headers object', async () => {
      await import('./apiSlice');

      const config = mockFetchBaseQuery.mock.calls[0][0];
      const prepareHeaders = config.prepareHeaders;

      const mockHeaders = new Headers();
      const mockGetState = vi.fn().mockReturnValue({
        user: { token: 'token' },
      });

      const result = prepareHeaders(mockHeaders, { getState: mockGetState });

      expect(result).toBeInstanceOf(Headers);
    });
  });

  describe('createApi configuration', () => {
    it('should create api with baseQueryWithReauth', async () => {
      await import('./apiSlice');

      expect(mockCreateApi).toHaveBeenCalled();
      const config = mockCreateApi.mock.calls[0][0];
      expect(config).toHaveProperty('baseQuery');
      expect(config).toHaveProperty('endpoints');
    });

    it('should have empty endpoints by default', async () => {
      await import('./apiSlice');

      const config = mockCreateApi.mock.calls[0][0];
      const endpoints = config.endpoints();
      expect(endpoints).toEqual({});
    });
  });
});

describe('baseQueryWithReauth', () => {
  let baseQueryWithReauth: (
    args: string | FetchArgs,
    api: BaseQueryApi,
    extraOptions: object
  ) => Promise<unknown>;
  let mockBaseQueryFn: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    // Create a mock base query function that we can control
    mockBaseQueryFn = vi.fn();

    // Re-mock with a controllable base query
    vi.doMock('@reduxjs/toolkit/query/react', async () => {
      const actual = await vi.importActual('@reduxjs/toolkit/query/react');
      return {
        ...actual,
        fetchBaseQuery: () => mockBaseQueryFn,
        createApi: (config: { baseQuery: typeof baseQueryWithReauth }) => {
          // Capture the baseQueryWithReauth function
          baseQueryWithReauth = config.baseQuery;
          return {
            reducerPath: 'api',
            reducer: vi.fn(),
            middleware: vi.fn(),
            endpoints: {},
          };
        },
      };
    });

    // Import fresh module
    await import('./apiSlice');
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should call baseQuery with provided arguments', async () => {
    const mockResult = { data: { success: true } };
    mockBaseQueryFn.mockResolvedValue(mockResult);
    mockIsAuthenticationError.mockReturnValue(false);

    const mockApi = {
      dispatch: vi.fn(),
      getState: vi.fn(),
    } as unknown as BaseQueryApi;

    const result = await baseQueryWithReauth('/test', mockApi, {});

    expect(mockBaseQueryFn).toHaveBeenCalledWith('/test', mockApi, {});
    expect(result).toEqual(mockResult);
  });

  it('should call baseQuery with FetchArgs', async () => {
    const mockResult = { data: { items: [] } };
    mockBaseQueryFn.mockResolvedValue(mockResult);
    mockIsAuthenticationError.mockReturnValue(false);

    const mockApi = {
      dispatch: vi.fn(),
      getState: vi.fn(),
    } as unknown as BaseQueryApi;

    const fetchArgs: FetchArgs = {
      url: '/users',
      method: 'POST',
      body: { name: 'test' },
    };

    const result = await baseQueryWithReauth(fetchArgs, mockApi, {});

    expect(mockBaseQueryFn).toHaveBeenCalledWith(fetchArgs, mockApi, {});
    expect(result).toEqual(mockResult);
  });

  it('should dispatch auth error action when authentication error detected', async () => {
    const mockResult = {
      error: {
        status: 401,
        data: { message: 'Unauthorized' },
      },
    };
    mockBaseQueryFn.mockResolvedValue(mockResult);
    mockIsAuthenticationError.mockReturnValue(true);

    const mockDispatch = vi.fn();
    const mockApi = {
      dispatch: mockDispatch,
      getState: vi.fn(),
    } as unknown as BaseQueryApi;

    await baseQueryWithReauth('/protected', mockApi, {});

    expect(mockIsAuthenticationError).toHaveBeenCalledWith(mockResult.error);
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'auth/authenticationError' });
  });

  it('should not dispatch auth error when no error in result', async () => {
    const mockResult = { data: { success: true } };
    mockBaseQueryFn.mockResolvedValue(mockResult);
    mockIsAuthenticationError.mockReturnValue(false);

    const mockDispatch = vi.fn();
    const mockApi = {
      dispatch: mockDispatch,
      getState: vi.fn(),
    } as unknown as BaseQueryApi;

    await baseQueryWithReauth('/test', mockApi, {});

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('should not dispatch auth error when error is not authentication error', async () => {
    const mockResult = {
      error: {
        status: 500,
        data: { message: 'Internal Server Error' },
      },
    };
    mockBaseQueryFn.mockResolvedValue(mockResult);
    mockIsAuthenticationError.mockReturnValue(false);

    const mockDispatch = vi.fn();
    const mockApi = {
      dispatch: mockDispatch,
      getState: vi.fn(),
    } as unknown as BaseQueryApi;

    await baseQueryWithReauth('/test', mockApi, {});

    expect(mockIsAuthenticationError).toHaveBeenCalledWith(mockResult.error);
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('should return result even when auth error is dispatched', async () => {
    const mockResult = {
      error: {
        status: 403,
        data: { message: 'Forbidden' },
      },
    };
    mockBaseQueryFn.mockResolvedValue(mockResult);
    mockIsAuthenticationError.mockReturnValue(true);

    const mockApi = {
      dispatch: vi.fn(),
      getState: vi.fn(),
    } as unknown as BaseQueryApi;

    const result = await baseQueryWithReauth('/forbidden', mockApi, {});

    expect(result).toEqual(mockResult);
  });

  it('should handle extraOptions parameter', async () => {
    const mockResult = { data: 'success' };
    mockBaseQueryFn.mockResolvedValue(mockResult);
    mockIsAuthenticationError.mockReturnValue(false);

    const mockApi = {
      dispatch: vi.fn(),
      getState: vi.fn(),
    } as unknown as BaseQueryApi;

    const extraOptions = { customOption: true };

    await baseQueryWithReauth('/test', mockApi, extraOptions);

    expect(mockBaseQueryFn).toHaveBeenCalledWith('/test', mockApi, extraOptions);
  });
});

describe('apiSlice export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('should export apiSlice', async () => {
    const module = await import('./apiSlice');

    expect(module.apiSlice).toBeDefined();
  });

  it('should have reducerPath property', async () => {
    const module = await import('./apiSlice');

    expect(module.apiSlice).toHaveProperty('reducerPath');
  });

  it('should have reducer property', async () => {
    const module = await import('./apiSlice');

    expect(module.apiSlice).toHaveProperty('reducer');
  });

  it('should have middleware property', async () => {
    const module = await import('./apiSlice');

    expect(module.apiSlice).toHaveProperty('middleware');
  });
});
