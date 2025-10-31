import { checkAndHandleAuthError } from '../services/authErrorService';

/**
 * Wraps an async function to automatically handle authentication errors
 * @param asyncFn - The async function to wrap
 * @returns Wrapped function that handles auth errors
 */
export const withAuthErrorHandling = <T extends (...args: any[]) => Promise<any>>(
  asyncFn: T
): T => {
  return (async (...args: Parameters<T>) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      checkAndHandleAuthError(error);
      throw error;
    }
  }) as T;
};

/**
 * Executes an async operation and handles authentication errors
 * @param asyncFn - The async function to execute
 * @param args - Arguments to pass to the function
 * @returns Promise that resolves to the function result or rejects with auth error handled
 */
export const executeWithAuthHandling = async <T>(
  asyncFn: (...args: any[]) => Promise<T>,
  ...args: any[]
): Promise<T> => {
  try {
    return await asyncFn(...args);
  } catch (error) {
    checkAndHandleAuthError(error);
    throw error;
  }
};
