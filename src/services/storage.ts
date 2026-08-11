import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_STORE_ID } from '../data/stores';
import type { ShoppingItem } from '../types';

const KEYS = {
  items: '@project001/shopping_items',
  storeId: '@project001/store_id',
  apiKey: '@project001/xai_api_key',
} as const;

export async function loadItems(): Promise<ShoppingItem[]> {
  const raw = await AsyncStorage.getItem(KEYS.items);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ShoppingItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveItems(items: ShoppingItem[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.items, JSON.stringify(items));
}

export async function loadStoreId(): Promise<string> {
  return (await AsyncStorage.getItem(KEYS.storeId)) ?? DEFAULT_STORE_ID;
}

export async function saveStoreId(storeId: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.storeId, storeId);
}

export async function loadApiKey(): Promise<string> {
  const stored = await AsyncStorage.getItem(KEYS.apiKey);
  if (stored) return stored;
  // Optional build-time key (not recommended for production secrets)
  return process.env.EXPO_PUBLIC_XAI_API_KEY ?? '';
}

export async function saveApiKey(apiKey: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.apiKey, apiKey.trim());
}
