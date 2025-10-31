import { apiSlice } from '../../app/api/apiSlice';
import { URLS } from '../../constants/urls';

export const searchApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    search: builder.mutation({
      query: (body) => ({
        url: URLS.API_URL + URLS.SEARCH,
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useSearchMutation } = searchApiSlice;