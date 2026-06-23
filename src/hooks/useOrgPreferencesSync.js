import { useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native'
import { Alert } from '../utils/alert';
import { useDispatch } from 'react-redux';
import {
  connectSocket,
  disconnectSocket,
  onSocket,
  offSocket,
  ORG_PREFERENCE_SOCKET_EVENTS,
} from '../services';
import {
  fetchOrgPreferences,
  setPreferences,
  normalizePreferencesPayload,
  clearPreferences,
} from '../redux/themeSlice';
import { logout } from '../redux/authSlice';
import { clearOfflineCache, stopOfflineSync } from '../services/offlineSync';
import { clearTeamChatUnreadStore, hydrateTeamChatUnread } from '../utils/teamChatNotify';

/** Poll interval while app is in foreground */
export const PREFERENCES_POLL_MS = 15000;

const SOCKET_FETCH_DEBOUNCE_MS = 500;
export const NAV_REFETCH_DEBOUNCE_MS = 400;

export function useOrgPreferencesSync(user, token) {
  const dispatch = useDispatch();
  const socketFetchTimer = useRef(null);

  useEffect(() => {
    if (!user || !token) {
      disconnectSocket();
      clearTeamChatUnreadStore().catch(() => {});
      return undefined;
    }

    connectSocket(token);
    hydrateTeamChatUnread().catch(() => {});
    dispatch(fetchOrgPreferences(token));

    let pollInterval = null;

    const startPolling = () => {
      if (pollInterval) return;
      pollInterval = setInterval(() => {
        dispatch(fetchOrgPreferences(token));
      }, PREFERENCES_POLL_MS);
    };

    const stopPolling = () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };

    const appSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        dispatch(fetchOrgPreferences(token));
        startPolling();
      } else {
        stopPolling();
      }
    });

    if (AppState.currentState === 'active') {
      startPolling();
    }

    const scheduleDebouncedFetch = () => {
      if (socketFetchTimer.current) clearTimeout(socketFetchTimer.current);
      socketFetchTimer.current = setTimeout(() => {
        dispatch(fetchOrgPreferences(token));
        socketFetchTimer.current = null;
      }, SOCKET_FETCH_DEBOUNCE_MS);
    };

    const handlePreferencesUpdate = (payload) => {
      const normalized = normalizePreferencesPayload(payload);
      if (normalized) {
        dispatch(setPreferences(normalized));
        scheduleDebouncedFetch();
      } else {
        dispatch(fetchOrgPreferences(token));
      }
    };

    ORG_PREFERENCE_SOCKET_EVENTS.forEach((event) => {
      onSocket(event, handlePreferencesUpdate);
    });

    const handleForceLogout = () => {
      stopOfflineSync();
      clearOfflineCache().catch(() => {});
      clearTeamChatUnreadStore().catch(() => {});
      disconnectSocket();
      dispatch(clearPreferences());
      dispatch(logout());
      Alert.alert('Signed out', 'Your session was ended. Please sign in again.');
    };

    onSocket('force_logout', handleForceLogout);

    return () => {
      stopPolling();
      if (socketFetchTimer.current) clearTimeout(socketFetchTimer.current);
      appSubscription.remove();
      ORG_PREFERENCE_SOCKET_EVENTS.forEach((event) => {
        offSocket(event, handlePreferencesUpdate);
      });
      offSocket('force_logout', handleForceLogout);
    };
  }, [user, token, dispatch]);
}

/** Debounced refetch for navigation / screen focus */
export function useDebouncedOrgPreferencesRefetch(token, debounceMs = NAV_REFETCH_DEBOUNCE_MS) {
  const dispatch = useDispatch();
  const timer = useRef(null);

  const refetch = useCallback(() => {
    if (!token) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      dispatch(fetchOrgPreferences(token));
      timer.current = null;
    }, debounceMs);
  }, [token, dispatch, debounceMs]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return refetch;
}
