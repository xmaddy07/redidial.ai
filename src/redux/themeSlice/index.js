import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getOrganizationPreferences, updateOrganizationPreferences } from '../../api';

/** Unwrap API response shapes: { data }, { preferences }, or raw object */
export function normalizePreferencesPayload(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const raw = payload.data ?? payload.preferences ?? payload;
  if (!raw || typeof raw !== 'object') return null;

  const brandingSettings = raw.brandingSettings ?? raw.branding_settings ?? null;
  const logoPath =
    raw.logoPath ??
    raw.logo_path ??
    brandingSettings?.logoPath ??
    brandingSettings?.logo_path ??
    null;

  return {
    ...raw,
    logoPath,
    themeColor: raw.themeColor ?? raw.theme_color ?? null,
    brandingSettings,
  };
}

function preferencesChanged(prev, next) {
  if (prev === next) return false;
  if (!prev || !next) return true;
  try {
    return JSON.stringify(prev) !== JSON.stringify(next);
  } catch {
    return true;
  }
}

function applyPreferences(state, payload) {
  const normalized = normalizePreferencesPayload(payload);
  if (!normalized) return;
  if (preferencesChanged(state.preferences, normalized)) {
    state.preferences = normalized;
  }
}

export const fetchOrgPreferences = createAsyncThunk(
  'theme/fetchOrgPreferences',
  async (token, { rejectWithValue }) => {
    try {
      const data = await getOrganizationPreferences(token);
      return data;
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to fetch preferences');
    }
  }
);

export const updateOrgPreferences = createAsyncThunk(
  'theme/updateOrgPreferences',
  async ({ token, preferences }, { rejectWithValue }) => {
    try {
      const data = await updateOrganizationPreferences(token, preferences);
      return data;
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to update preferences');
    }
  }
);

const initialState = {
  themeMode: 'light',
  preferences: null,
  loading: false,
  updating: false,
  error: null,
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setThemeMode: (state, action) => {
      state.themeMode = action.payload;
    },
    toggleThemeMode: (state) => {
      state.themeMode = state.themeMode === 'light' ? 'dark' : 'light';
    },
    setPreferences: (state, action) => {
      state.preferences = action.payload;
    },
    clearPreferences: (state) => {
      state.themeMode = 'light';
      state.preferences = null;
      state.loading = false;
      state.updating = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrgPreferences.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrgPreferences.fulfilled, (state, action) => {
        state.loading = false;
        applyPreferences(state, action.payload);
      })
      .addCase(fetchOrgPreferences.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateOrgPreferences.pending, (state, action) => {
        state.updating = true;
        state.error = null;
        state._rollbackPreferences = state.preferences;
        const next = action.meta.arg?.preferences;
        if (next) {
          state.preferences = next;
        }
      })
      .addCase(updateOrgPreferences.fulfilled, (state, action) => {
        state.updating = false;
        delete state._rollbackPreferences;
        applyPreferences(state, action.payload);
      })
      .addCase(updateOrgPreferences.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload;
        if (state._rollbackPreferences !== undefined) {
          state.preferences = state._rollbackPreferences;
          delete state._rollbackPreferences;
        }
      });
  },
});

export const { setThemeMode, toggleThemeMode, setPreferences, clearPreferences } = themeSlice.actions;
export default themeSlice.reducer;
