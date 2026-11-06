import 'react-native-url-polyfill/auto';

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const webStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS !== 'web' || typeof globalThis.sessionStorage === 'undefined') return null;
    return globalThis.sessionStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS !== 'web' || typeof globalThis.sessionStorage === 'undefined') return;
    globalThis.sessionStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS !== 'web' || typeof globalThis.sessionStorage === 'undefined') return;
    globalThis.sessionStorage.removeItem(key);
  },
};

const nativeStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const storage = Platform.OS === 'web' ? webStorage : nativeStorage;

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
    },
    global: {
      fetch,
    },
    realtime: { params: { eventsPerSecond: 1 } },
  },
);
