import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  token: null,
  userData: null,
  mode: localStorage.getItem('mode')
    ? localStorage.getItem('mode')
    :'light',
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.token = action.payload.token;
      state.userData = action.payload.user;
    },
    setToken: (state, action) => {
      state.token = action.payload;
    },
    changeMode: (state) => {
      if (state.mode === 'light') {
        state.mode = 'dark';
        localStorage.setItem('mode', 'dark');
      } else {
        state.mode = 'light';
        localStorage.setItem('mode', 'light');
      }
    },
  },
});

export const { setCredentials, setToken, changeMode } = userSlice.actions;

export default userSlice.reducer;
