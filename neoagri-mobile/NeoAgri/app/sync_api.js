// src/services/SyncService.js
import * as SecureStore from 'expo-secure-store';

// API CONSTANTS
export const API_URL = 'http://192.168.0.173:3000'; // Replace with PROD or dynamic IP

const TOKEN_KEY = 'user_token';
const PHONE_KEY = 'user_phone';

export const getAuthToken = async () => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) return token;
  console.log('[Auth] Using developer bypass token for +919137871445');
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwaG9uZSI6Iis5MTkxMzc4NzE0NDUiLCJpYXQiOjE3NzQ5NTIxNzcsImV4cCI6MTc3NTU1Njk3N30.teGb_xyxs7gItMxPsTVU65_jXwk5pKrr-TtCT49HaYA';
};

export const requestOtp = async (phone) => {
  try {
    const res = await fetch(`${API_URL}/auth/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    return await res.json();
  } catch (e) {
    console.error('OTP Send error', e);
    return { success: false };
  }
};

export const verifyOtp = async (phone, otp) => {
  try {
    const res = await fetch(`${API_URL}/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp })
    });
    const data = await res.json();
    if (data.token) {
      await SecureStore.setItemAsync(TOKEN_KEY, data.token);
      await SecureStore.setItemAsync(PHONE_KEY, phone);
    }
    return data;
  } catch (e) {
    console.error('OTP Verify error', e);
    return { success: false };
  }
};

export const syncOfflineScans = async (scans) => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/scan/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ scans })
    });
    const result = await response.json();
    return result.success;
  } catch (err) {
    console.error('Sync Error', err);
    return false;
  }
};

export const fetchDroneMarkers = async (sessionId) => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/session/${sessionId}/markers`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const result = await response.json();
    return result.markers || [];
  } catch (err) {
    console.error('Fetch Markers Error', err);
    return [];
  }
};

export const fetchFarmerHistory = async () => {
  try {
    const token = await getAuthToken();
    if (!token) return [];

    const response = await fetch(`${API_URL}/farmer/history`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return [];
    }

    const result = await response.json();
    return result.history || [];
  } catch (err) {
    console.error('Fetch History Error', err);
    return [];
  }
};
