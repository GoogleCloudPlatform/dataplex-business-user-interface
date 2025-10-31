import { AxiosHeaders, AxiosResponseHeaders } from "axios";

// Adjusted HttpResponse type
export type HttpResponse<T> = {
  data: T;
  config: any;
  headers: AxiosResponseHeaders | AxiosHeaders;
  status: number;
  statusText: string;
} & BaseResponse;

export type BaseResponse = {
  status_code?: number;
  additional_status?: AdditionalStatus;
  api?: string;
  message?: string;
  module?: string;
};

export type AdditionalStatus = {
  password_expiring: boolean;
  password_expiring_soon: boolean;
  password_reset_required: boolean;
};

export type PageInfo = {
  limit: number;
  page: number;
};

// Adjusted ListResponse type
export type ListResponse<T, DataKey extends string> = {
  [key in DataKey]: T[];
} & BaseResponse;

type RemoveProperties<T, K extends keyof T> = Omit<T, K>;

export type RemovePropertiesFromPayload = <T>(
  payload: T,
  keysToRemove: (keyof T)[]
) => RemoveProperties<T, keyof T>;

export const removePropertiesFromPayload: RemovePropertiesFromPayload = (payload, keysToRemove) => {
  const updatedPayload = { ...payload }; // Create a shallow copy to avoid mutation

  keysToRemove.forEach(key => {
    delete updatedPayload[key];
  });

  return updatedPayload;
};