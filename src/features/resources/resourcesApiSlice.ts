import { apiSlice } from '../../app/api/apiSlice';
import { URLS } from '../../constants/urls';

export const resourcesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    resources: builder.mutation({
      query: (body) => ({
        url: URLS.API_URL + URLS.SEARCH,
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useResourcesMutation } = resourcesApiSlice;