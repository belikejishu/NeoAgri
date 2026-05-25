import { initDB, insertSession, insertMarkers, getPendingScans, markScansSynced } from './schema';
import { fetchDroneMarkers, fetchFarmerHistory, syncOfflineScans } from '../sync_api';
import NetInfo from '@react-native-community/netinfo';

export const initializeOfflineSync = async () => {
  await initDB();

  // Listen for internet connection restoration to flush queue
  NetInfo.addEventListener(state => {
    if (state.isConnected !== false) {
      console.log('[Sync] Network restored, triggering background sync...');
      flushOfflineScans();
    }
  });
};

export const pullDroneSessions = async (sessionId) => {
  const state = await NetInfo.fetch();
  if (state.isConnected !== false) {
    try {
      console.log(`[Sync] Fetching latest markers for session: ${sessionId}`);
      const markers = await fetchDroneMarkers(sessionId);
      if (markers && markers.length > 0) {
        // Tag them with session ID before inserting
        const taggedMarkers = markers.map(m => ({ ...m, session_id: sessionId }));
        await insertMarkers(taggedMarkers);
        console.log(`[Sync] Downloaded and cached ${markers.length} markers into SQLite.`);
      }
    } catch (e) {
      console.error('[Sync] Error pulling drone sessions:', e);
    }
  } else {
    console.log('[Sync] Offline: Cannot pull drone sessions right now. Operating from cache.');
  }
};

export const syncLatestDroneSession = async () => {
  const state = await NetInfo.fetch();
  if (state.isConnected === false && state.isInternetReachable === false) { console.log('[Sync] Force assuming offline');
    return { synced: false, reason: 'offline' };
  }

  try {
    const history = await fetchFarmerHistory();
    if (!history.length) {
      return { synced: false, reason: 'no_history' };
    }

    const latestSessionId = history[0].session_id;
    await pullDroneSessions(latestSessionId);
    return { synced: true, sessionId: latestSessionId };
  } catch (error) {
    console.error('[Sync] Failed to sync latest session:', error);
    return { synced: false, reason: 'error' };
  }
};

export const flushOfflineScans = async () => {
  const state = await NetInfo.fetch();
  if (!state.isConnected) return;

  const pendingScans = await getPendingScans();
  if (pendingScans.length === 0) {
    return;
  }

  console.log(`[Sync] Flushing ${pendingScans.length} manual scans to backend...`);
  const success = await syncOfflineScans(pendingScans);

  if (success) {
    const scanIds = pendingScans.map(s => s.id);
    await markScansSynced(scanIds);
    console.log('[Sync] Successfully uploaded offline scans.');
  } else {
    console.log('[Sync] Failed to upload scans, keeping in queue.');
  }
};
