export const FEATURE_FLAGS = {
  enableRequestAccess: import.meta.env.VITE_FEATURE_REQUEST_ACCESS ? import.meta.env.VITE_FEATURE_REQUEST_ACCESS !== 'false' : false,
} as const;
