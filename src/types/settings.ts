export interface UserSettings {
  inactivityTimeoutSeconds: number; // 15, 30, 45, 60, 120
  theme: 'system' | 'dark' | 'light';
  readerViewMode: 'continuous' | 'single';
  defaultZoom: 'auto' | 'page-width' | 'page-fit' | '100' | '125' | '150';
  readerIdentifier?: string;
  showReadingTicker: boolean;
  enableSoundEffects: boolean;
}

export interface KeyPairRecord {
  publicKeyBase64: string;
  privateKeyBase64: string;
  keyFingerprint: string;
  createdAt: string;
}
