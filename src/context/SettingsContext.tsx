import React, { createContext, useContext, useEffect, useState } from 'react';
import { KeyPairRecord, UserSettings } from '../types/settings';
import {
  getSigningKeyRecord,
  getUserSettings,
  saveSigningKeyRecord,
  saveUserSettings,
} from '../services/storage';
import { generateSigningKeyPair } from '../services/crypto';

interface SettingsContextType {
  settings: UserSettings;
  keyRecord: KeyPairRecord | null;
  effectiveTheme: 'light' | 'dark';
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  regenerateKeys: () => Promise<KeyPairRecord>;
  setTheme: (theme: 'system' | 'dark' | 'light') => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings>({
    inactivityTimeoutSeconds: 30,
    theme: 'system',
    readerViewMode: 'continuous',
    defaultZoom: 'page-width',
    showReadingTicker: true,
    enableSoundEffects: false,
  });

  const [keyRecord, setKeyRecord] = useState<KeyPairRecord | null>(null);
  const [systemIsDark, setSystemIsDark] = useState<boolean>(
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    // Listen to OS theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Initialize settings and signing keys from IndexedDB
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const stored = await getUserSettings();
      if (!isMounted) return;
      setSettings(stored);

      let keyRec = await getSigningKeyRecord();
      if (!keyRec) {
        // Auto-generate initial browser cryptographic identity
        const generated = await generateSigningKeyPair();
        keyRec = {
          publicKeyBase64: generated.publicKeyBase64,
          privateKeyBase64: generated.privateKeyBase64,
          keyFingerprint: generated.keyFingerprint,
          createdAt: new Date().toISOString(),
        };
        await saveSigningKeyRecord(keyRec);
      }
      if (isMounted) {
        setKeyRecord(keyRec);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const effectiveTheme: 'light' | 'dark' =
    settings.theme === 'system' ? (systemIsDark ? 'dark' : 'light') : settings.theme;

  useEffect(() => {
    const root = document.documentElement;
    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [effectiveTheme]);

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    const updated = await saveUserSettings(newSettings);
    setSettings(updated);
  };

  const regenerateKeys = async (): Promise<KeyPairRecord> => {
    const generated = await generateSigningKeyPair();
    const newRecord: KeyPairRecord = {
      publicKeyBase64: generated.publicKeyBase64,
      privateKeyBase64: generated.privateKeyBase64,
      keyFingerprint: generated.keyFingerprint,
      createdAt: new Date().toISOString(),
    };
    await saveSigningKeyRecord(newRecord);
    setKeyRecord(newRecord);
    return newRecord;
  };

  const setTheme = (t: 'system' | 'dark' | 'light') => {
    updateSettings({ theme: t });
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        keyRecord,
        effectiveTheme,
        updateSettings,
        regenerateKeys,
        setTheme,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export function useSettings(): SettingsContextType {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
