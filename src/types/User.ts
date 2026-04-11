export interface User {
  name: string | undefined;
  email: string | undefined;
  picture: string | undefined;
  token: string | undefined;
  tokenExpiry: number | undefined;    // Unix timestamp in seconds when token expires
  tokenIssuedAt: number | undefined;  // Unix timestamp in seconds when token was issued
  hasRole: boolean | undefined;
  roles: string[] | undefined;
  permissions: string[] | undefined;
  iamDisplayRole?: string | undefined; // "Owner" | "Admin" | "Editor" | "Viewer" | "No Dataplex Role"
  appConfig: any;
  role?: any;
  isAdmin?: boolean;
  isDataOwner?: boolean;
  ownedDatasets?: { projectId: string; datasetId: string }[];
  hasAdminCapabilities?: boolean;
};
