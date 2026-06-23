import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authSlice from '../authSlice/index';
import themeSlice from '../themeSlice/index';

const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  whitelist: ['user', 'token', 'role'],
};

const themePersistConfig = {
  key: 'theme',
  storage: AsyncStorage,
  whitelist: ['preferences', 'themeMode'],
};

const persistedAuthReducer = persistReducer(authPersistConfig, authSlice);
const persistedThemeReducer = persistReducer(themePersistConfig, themeSlice);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    theme: persistedThemeReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store); 