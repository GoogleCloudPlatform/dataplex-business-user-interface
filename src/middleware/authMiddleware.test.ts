import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authMiddleware } from './authMiddleware';

// Mock the authErrorService module
vi.mock('../services/authErrorService', () => ({
  handleAuthenticationError: vi.fn(),
}));

// Import the mocked function after mocking
import { handleAuthenticationError } from '../services/authErrorService';

describe('authMiddleware', () => {
  let mockNext: ReturnType<typeof vi.fn>;
  let mockStore: { dispatch: ReturnType<typeof vi.fn>; getState: ReturnType<typeof vi.fn> };
  let middleware: ReturnType<ReturnType<typeof authMiddleware>>;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockNext = vi.fn((action) => action);
    mockStore = {
      dispatch: vi.fn(),
      getState: vi.fn(),
    };
    // Create the middleware chain: authMiddleware(store)(next)
    middleware = authMiddleware(mockStore)(mockNext);
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('Middleware Structure', () => {
    it('should be a function', () => {
      expect(typeof authMiddleware).toBe('function');
    });

    it('should return a function when called with store', () => {
      const result = authMiddleware(mockStore);
      expect(typeof result).toBe('function');
    });

    it('should return a function when called with next', () => {
      const result = authMiddleware(mockStore)(mockNext);
      expect(typeof result).toBe('function');
    });
  });

  describe('Authentication Error Handling', () => {
    it('should call handleAuthenticationError when action type is auth/authenticationError', () => {
      const authErrorAction = { type: 'auth/authenticationError' };

      middleware(authErrorAction);

      expect(handleAuthenticationError).toHaveBeenCalledTimes(1);
    });

    it('should log message when authentication error is detected', () => {
      const authErrorAction = { type: 'auth/authenticationError' };

      middleware(authErrorAction);

      expect(consoleSpy).toHaveBeenCalledWith('Authentication error detected in RTK Query');
    });

    it('should still pass action to next when auth error is detected', () => {
      const authErrorAction = { type: 'auth/authenticationError' };

      middleware(authErrorAction);

      expect(mockNext).toHaveBeenCalledWith(authErrorAction);
    });

    it('should return the result of next when auth error is detected', () => {
      const authErrorAction = { type: 'auth/authenticationError' };
      const expectedResult = { processed: true };
      mockNext.mockReturnValue(expectedResult);

      const result = middleware(authErrorAction);

      expect(result).toEqual(expectedResult);
    });
  });

  describe('Non-Authentication Actions', () => {
    it('should not call handleAuthenticationError for regular actions', () => {
      const regularAction = { type: 'some/regularAction' };

      middleware(regularAction);

      expect(handleAuthenticationError).not.toHaveBeenCalled();
    });

    it('should not log for regular actions', () => {
      const regularAction = { type: 'some/regularAction' };

      middleware(regularAction);

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should pass regular actions to next', () => {
      const regularAction = { type: 'some/regularAction', payload: 'test' };

      middleware(regularAction);

      expect(mockNext).toHaveBeenCalledWith(regularAction);
    });

    it('should return the result of next for regular actions', () => {
      const regularAction = { type: 'some/regularAction' };
      const expectedResult = { data: 'test' };
      mockNext.mockReturnValue(expectedResult);

      const result = middleware(regularAction);

      expect(result).toEqual(expectedResult);
    });
  });

  describe('Various Action Types', () => {
    const actionTypes = [
      { type: 'user/login', shouldHandle: false },
      { type: 'user/logout', shouldHandle: false },
      { type: 'auth/authenticationError', shouldHandle: true },
      { type: 'api/executeQuery/rejected', shouldHandle: false },
      { type: 'search/setSearchTerm', shouldHandle: false },
      { type: 'resources/searchResourcesByTerm/fulfilled', shouldHandle: false },
      { type: 'AUTH/AUTHENTICATIONERROR', shouldHandle: false }, // Case sensitive
      { type: 'auth/authenticationerror', shouldHandle: false }, // Different case
      { type: 'auth/authentication_error', shouldHandle: false }, // Underscore instead
      { type: '', shouldHandle: false },
    ];

    actionTypes.forEach(({ type, shouldHandle }) => {
      it(`should ${shouldHandle ? '' : 'not '}handle action type: "${type}"`, () => {
        const action = { type };

        middleware(action);

        if (shouldHandle) {
          expect(handleAuthenticationError).toHaveBeenCalledTimes(1);
        } else {
          expect(handleAuthenticationError).not.toHaveBeenCalled();
        }
      });
    });
  });

  describe('Action Payload Handling', () => {
    it('should pass action with payload to next', () => {
      const actionWithPayload = {
        type: 'some/action',
        payload: { data: 'test', nested: { value: 123 } },
      };

      middleware(actionWithPayload);

      expect(mockNext).toHaveBeenCalledWith(actionWithPayload);
    });

    it('should pass auth error action with payload to next', () => {
      const authErrorWithPayload = {
        type: 'auth/authenticationError',
        payload: { error: 'Session expired', code: 401 },
      };

      middleware(authErrorWithPayload);

      expect(mockNext).toHaveBeenCalledWith(authErrorWithPayload);
      expect(handleAuthenticationError).toHaveBeenCalled();
    });

    it('should pass action with meta to next', () => {
      const actionWithMeta = {
        type: 'some/action',
        payload: 'test',
        meta: { requestId: '123', arg: 'original' },
      };

      middleware(actionWithMeta);

      expect(mockNext).toHaveBeenCalledWith(actionWithMeta);
    });

    it('should pass action with error flag to next', () => {
      const actionWithError = {
        type: 'some/action',
        payload: new Error('Test error'),
        error: true,
      };

      middleware(actionWithError);

      expect(mockNext).toHaveBeenCalledWith(actionWithError);
    });
  });

  describe('Multiple Actions', () => {
    it('should handle multiple auth errors in sequence', () => {
      const authErrorAction = { type: 'auth/authenticationError' };

      middleware(authErrorAction);
      middleware(authErrorAction);
      middleware(authErrorAction);

      expect(handleAuthenticationError).toHaveBeenCalledTimes(3);
      expect(mockNext).toHaveBeenCalledTimes(3);
    });

    it('should handle mixed actions correctly', () => {
      const authErrorAction = { type: 'auth/authenticationError' };
      const regularAction1 = { type: 'user/fetchUser' };
      const regularAction2 = { type: 'search/setTerm' };

      middleware(regularAction1);
      middleware(authErrorAction);
      middleware(regularAction2);

      expect(handleAuthenticationError).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledTimes(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle action with undefined type', () => {
      const actionWithUndefinedType = { type: undefined };

      middleware(actionWithUndefinedType);

      expect(handleAuthenticationError).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(actionWithUndefinedType);
    });

    it('should handle action with null type', () => {
      const actionWithNullType = { type: null };

      middleware(actionWithNullType);

      expect(handleAuthenticationError).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(actionWithNullType);
    });

    it('should handle action with numeric type', () => {
      const actionWithNumericType = { type: 123 };

      middleware(actionWithNumericType);

      expect(handleAuthenticationError).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(actionWithNumericType);
    });

    it('should handle empty object action', () => {
      const emptyAction = {};

      middleware(emptyAction);

      expect(handleAuthenticationError).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(emptyAction);
    });
  });

  describe('Middleware Chain Integration', () => {
    it('should work with multiple middleware instances', () => {
      const anotherNext = vi.fn((action) => action);
      const anotherMiddleware = authMiddleware(mockStore)(anotherNext);

      const action = { type: 'auth/authenticationError' };

      middleware(action);
      anotherMiddleware(action);

      expect(handleAuthenticationError).toHaveBeenCalledTimes(2);
    });

    it('should not modify the original action', () => {
      const originalAction = { type: 'some/action', payload: 'test' };
      const actionCopy = { ...originalAction };

      middleware(originalAction);

      expect(originalAction).toEqual(actionCopy);
    });

    it('should return whatever next returns', () => {
      const transformedResult = { type: 'transformed', extra: 'data' };
      mockNext.mockReturnValue(transformedResult);

      const result = middleware({ type: 'any/action' });

      expect(result).toBe(transformedResult);
    });
  });

  describe('Console Logging', () => {
    it('should only log for auth error actions', () => {
      middleware({ type: 'regular/action' });
      middleware({ type: 'another/action' });
      middleware({ type: 'auth/authenticationError' });
      middleware({ type: 'final/action' });

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith('Authentication error detected in RTK Query');
    });
  });
});
