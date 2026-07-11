/// <reference types="vite/client" />

const LS_KEY = 'amap_key';

export function getAmapKey(): string {
  const envKey = (import.meta as Record<string, any>).env?.VITE_AMAP_KEY || '';
  if (envKey) return envKey;
  return localStorage.getItem(LS_KEY) || '';
}

export function saveAmapKey(key: string): void {
  localStorage.setItem(LS_KEY, key);
}

export function clearAmapKey(): void {
  localStorage.removeItem(LS_KEY);
}
