import NetInfo from '@react-native-community/netinfo';

let cachedOnline = true;

export async function checkIsOnline() {
  const state = await NetInfo.fetch();
  cachedOnline = !!(state.isConnected && state.isInternetReachable !== false);
  return cachedOnline;
}

export function getIsOnline() {
  return cachedOnline;
}

export function subscribeToNetwork(callback) {
  return NetInfo.addEventListener((state) => {
    const online = !!(state.isConnected && state.isInternetReachable !== false);
    const wasOffline = !cachedOnline;
    cachedOnline = online;
    callback({ isOnline: online, wasOffline, cameOnline: wasOffline && online });
  });
}
