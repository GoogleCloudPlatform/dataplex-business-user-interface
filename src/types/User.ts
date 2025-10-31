export interface User {
  name: string | undefined;
  email: string | undefined;
  picture: string | undefined;
  token: string | undefined;
  hasRole: boolean | undefined;
  roles: string[] | undefined;
  permissions: string[] | undefined;
  appConfig: any;
};