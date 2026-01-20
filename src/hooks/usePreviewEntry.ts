import { useState, useEffect, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { URLS } from '../constants/urls';

/**
 * @file usePreviewEntry.ts
 * @description Custom hook for fetching entry data independently from Redux.
 *
 * This hook provides an isolated fetch mechanism for preview-only operations,
 * allowing components to fetch and display entry data without updating the
 * global Redux state. This is particularly useful for preview panels where
 * the main page context should remain unchanged.
 *
 * @example
 * ```typescript
 * const { entry, status, error, refetch } = usePreviewEntry({
 *   entryName: 'projects/my-project/locations/us/entryGroups/@dataplex/entries/...',
 *   id_token: userToken,
 *   enabled: true
 * });
 * ```
 */

interface PreviewEntryState {
  data: any | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: any | null;
}

interface UsePreviewEntryOptions {
  /** The entry name to fetch (Dataplex entry name format) */
  entryName: string | null;
  /** Authentication token for API requests */
  id_token: string;
  /** Whether to enable automatic fetching (default: true) */
  enabled?: boolean;
}

interface UsePreviewEntryReturn {
  /** The fetched entry data */
  entry: any | null;
  /** Current fetch status */
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  /** Error information if fetch failed */
  error: any | null;
  /** Function to manually refetch the entry */
  refetch: () => Promise<any | null>;
}

/**
 * Hook for fetching entry data without updating Redux state.
 *
 * This hook manages its own local state for loading, success, and error conditions.
 * It automatically fetches when entryName changes (if enabled) and provides a
 * refetch function for manual updates.
 *
 * @param options - Configuration options
 * @returns Object containing entry data, status, error, and refetch function
 */
export const usePreviewEntry = ({
  entryName,
  id_token,
  enabled = true
}: UsePreviewEntryOptions): UsePreviewEntryReturn => {
  const [state, setState] = useState<PreviewEntryState>({
    data: null,
    status: 'idle',
    error: null
  });

  const fetchEntry = useCallback(async (name: string, token: string) => {
    setState(prev => ({ ...prev, status: 'loading', error: null }));

    try {
      // Configure axios with auth header (following existing pattern)
      const config = {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      };

      const response = await axios.get(
        `${URLS.API_URL}${URLS.GET_ENTRY}?entryName=${name}`,
        config
      );

      setState({
        data: response.data,
        status: 'succeeded',
        error: null
      });

      return response.data;
    } catch (error) {
      const errorData = error instanceof AxiosError
        ? error.response?.data || error.message
        : 'An unknown error occurred';

      setState({
        data: null,
        status: 'failed',
        error: errorData
      });

      return null;
    }
  }, []);

  useEffect(() => {
    if (entryName && id_token && enabled) {
      fetchEntry(entryName, id_token);
    } else if (!entryName) {
      // Reset state when entryName is cleared
      setState({
        data: null,
        status: 'idle',
        error: null
      });
    }
  }, [entryName, id_token, enabled, fetchEntry]);

  const refetch = useCallback(() => {
    if (entryName && id_token) {
      return fetchEntry(entryName, id_token);
    }
    return Promise.resolve(null);
  }, [entryName, id_token, fetchEntry]);

  return {
    entry: state.data,
    status: state.status,
    error: state.error,
    refetch
  };
};
