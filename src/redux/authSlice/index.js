import { createSlice } from '@reduxjs/toolkit';
import { clearPreferences } from '../themeSlice';

const initialState = {
    user: null,
    token: null,
    role: null,
    loading: false,

};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setToken: (state, action) => {
      state.token = action.payload;
    },
    setRole: (state, action) => {
      state.role = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.role = null;
    },
  }
})

export const { setUser, logout, setToken, setRole } = authSlice.actions;
export default authSlice.reducer;