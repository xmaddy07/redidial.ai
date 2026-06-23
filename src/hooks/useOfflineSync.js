import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  initOfflineDatabase,
  startOfflineSync,
  stopOfflineSync,
} from '../services/offlineSync';

export function useOfflineSync() {
  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    let cancelled = false;

    initOfflineDatabase()
      .then(() => {
        if (cancelled) return;
        if (token) {
          startOfflineSync(token);
        } else {
          stopOfflineSync();
        }
      })
      .catch((error) => {
        console.warn('[offlineSync] init failed:', error?.message || error);
      });

    return () => {
      cancelled = true;
      stopOfflineSync();
    };
  }, [token]);
}
