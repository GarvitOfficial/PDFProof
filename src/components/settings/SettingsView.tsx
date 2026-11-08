import React, { useEffect, useState } from 'react';
import {
  Key,
  Shield,
  Trash2,
  Download,
  Copy,
  Check,
  RotateCw,
  HardDrive,
  Clock,
  Layers,
  Laptop,
  Moon,
  Sun,
  AlertTriangle,
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useDocuments } from '../../context/DocumentContext';
import {
  getStorageUsageEstimate,
  purgeAllLocalData,
} from '../../services/storage';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, keyRecord, regenerateKeys, setTheme, effectiveTheme } =
    useSettings();
  const { refreshDocumentsList } = useDocuments();

  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [isRegenModalOpen, setIsRegenModalOpen] = useState(false);

  const [storageEstimate, setStorageEstimate] = useState<{
    usageBytes: number;
    quotaBytes: number;
    percentage: number;
  }>({ usageBytes: 0, quotaBytes: 1, percentage: 0 });

  useEffect(() => {
    getStorageUsageEstimate().then(setStorageEstimate);
  }, []);

  const copyPublicKey = () => {
    if (!keyRecord) return;
    navigator.clipboard.writeText(keyRecord.publicKeyBase64);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const copyKeyFingerprint = () => {
    if (!keyRecord) return;
    navigator.clipboard.writeText(keyRecord.keyFingerprint);
    setCopiedFingerprint(true);
    setTimeout(() => setCopiedFingerprint(false), 2000);
  };

  const handleConfirmPurge = async () => {
    await purgeAllLocalData();
    await refreshDocumentsList();
    setIsPurgeModalOpen(false);
    window.location.reload();
  };

  const handleConfirmRegenerate = async () => {
    await regenerateKeys();
    setIsRegenModalOpen(false);
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-8">
      {/* Editorial Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 uppercase tracking-wider">
          <span>Security & Local Configuration</span>
          <span>•</span>
          <span>100% Client Resident</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-1 font-serif">
          Settings & Identity
        </h1>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-xl leading-relaxed">
          Manage your browser-resident Ed25519 signing keys, reading tracking thresholds, and IndexedDB storage cache.
        </p>
      </div>

      {/* Cryptographic Signing Key Section */}
      <section className="bg-white dark:bg-[#13141b] border border-zinc-200 dark:border-zinc-800/80 rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">
              Ed25519 Cryptographic Identity
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Unique public/private keypair stored in IndexedDB for signing reading completion reports.
            </p>
          </div>
          <Badge variant="accent" size="sm">
            RFC 8032
          </Badge>
        </div>

        {keyRecord ? (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-mono text-zinc-600 dark:text-zinc-400">
                  Key Fingerprint (SHA-256):
                </span>
                <button
                  onClick={copyKeyFingerprint}
                  className="inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                >
                  {copiedFingerprint ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  <span>{copiedFingerprint ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="p-2.5 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-[11px] font-mono text-zinc-800 dark:text-zinc-200 break-all">
                {keyRecord.keyFingerprint}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-mono text-zinc-600 dark:text-zinc-400">
                  Public Key (Base64):
                </span>
                <button
                  onClick={copyPublicKey}
                  className="inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                >
                  {copiedKey ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="p-2.5 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-[11px] font-mono text-zinc-800 dark:text-zinc-200 break-all line-clamp-2">
                {keyRecord.publicKeyBase64}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-zinc-400">
              <span>Created: {new Date(keyRecord.createdAt).toLocaleString()}</span>
              <Button
                variant="ghost"
                size="sm"
                icon={<RotateCw size={12} />}
                onClick={() => setIsRegenModalOpen(true)}
              >
                Regenerate Keypair
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-xs text-zinc-400">Generating cryptographic keypair...</div>
        )}
      </section>

      {/* Reading Tracking & Inactivity Preferences */}
      <section className="bg-white dark:bg-[#13141b] border border-zinc-200 dark:border-zinc-800/80 rounded-lg p-5 space-y-4">
        <div>
          <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">
            Tracking & Inactivity Threshold
          </h3>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Configure idle detection interval. When no pointer or keyboard events occur within this duration, active reading time pauses.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Inactivity Timeout
            </label>
            <select
              value={settings.inactivityTimeoutSeconds}
              onChange={(e) =>
                updateSettings({ inactivityTimeoutSeconds: parseInt(e.target.value, 10) })
              }
              className="w-full text-xs px-3 py-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            >
              <option value={15}>15 seconds (Strict attention)</option>
              <option value={30}>30 seconds (Recommended standard)</option>
              <option value={45}>45 seconds (Long-form reading)</option>
              <option value={60}>60 seconds (Relaxed)</option>
              <option value={120}>120 seconds (Permissive)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Default Document View Mode
            </label>
            <select
              value={settings.readerViewMode}
              onChange={(e) =>
                updateSettings({
                  readerViewMode: e.target.value as 'continuous' | 'single',
                })
              }
              className="w-full text-xs px-3 py-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            >
              <option value="continuous">Continuous vertical scroll</option>
              <option value="single">Single page navigation</option>
            </select>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-700 dark:text-zinc-300 select-none">
            <input
              type="checkbox"
              checked={settings.showReadingTicker}
              onChange={(e) => updateSettings({ showReadingTicker: e.target.checked })}
              className="rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 focus:ring-0"
            />
            <span>Display live reading ticker & page counter in top header</span>
          </label>
        </div>
      </section>

      {/* Theme Settings */}
      <section className="bg-white dark:bg-[#13141b] border border-zinc-200 dark:border-zinc-800/80 rounded-lg p-5 space-y-4">
        <div>
          <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">
            Appearance
          </h3>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Select light, dark, or automatic system theme.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {[
            { id: 'system', label: 'System Match', icon: <Laptop size={14} /> },
            { id: 'light', label: 'Editorial Light', icon: <Sun size={14} /> },
            { id: 'dark', label: 'Obsidian Dark', icon: <Moon size={14} /> },
          ].map((themeOpt) => {
            const isSelected = settings.theme === themeOpt.id;
            return (
              <button
                key={themeOpt.id}
                onClick={() => setTheme(themeOpt.id as 'system' | 'light' | 'dark')}
                className={`flex-1 p-3 rounded border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                  isSelected
                    ? 'border-zinc-800 dark:border-zinc-200 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 ring-1 ring-zinc-800 dark:ring-zinc-200'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {themeOpt.icon}
                <span>{themeOpt.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Local IndexedDB Storage Management */}
      <section className="bg-white dark:bg-[#13141b] border border-zinc-200 dark:border-zinc-800/80 rounded-lg p-5 space-y-4">
        <div>
          <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">
            Local Storage & Privacy Wipe
          </h3>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            All PDF byte buffers and reading session metrics are stored locally in your browser's IndexedDB.
          </p>
        </div>

        <div className="p-3 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <HardDrive size={14} />
            <span>IndexedDB Usage:</span>
            <strong className="text-zinc-900 dark:text-zinc-100">
              {formatBytes(storageEstimate.usageBytes)}
            </strong>
          </div>
          <span className="text-[11px] text-zinc-400">
            Browser Quota: {formatBytes(storageEstimate.quotaBytes)}
          </span>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <div className="text-[11px] text-zinc-500 max-w-sm">
            Wiping local storage deletes all stored documents, summaries, and locally cached reports immediately.
          </div>

          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 size={13} />}
            onClick={() => setIsPurgeModalOpen(true)}
          >
            Clear All Local Data
          </Button>
        </div>
      </section>

      {/* Wipe Confirmation Modal */}
      <Modal
        isOpen={isPurgeModalOpen}
        onClose={() => setIsPurgeModalOpen(false)}
        title="Purge All Local Storage"
        description="This will permanently delete all stored PDF files, reading duration metrics, and reports from your browser's IndexedDB. This action cannot be undone."
      >
        <div className="space-y-4">
          <div className="p-3 rounded bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
            <p>
              Your local signing keys and reading history will be completely erased.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPurgeModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 size={13} />}
              onClick={handleConfirmPurge}
            >
              Purge Database & Reset
            </Button>
          </div>
        </div>
      </Modal>

      {/* Regenerate Keypair Modal */}
      <Modal
        isOpen={isRegenModalOpen}
        onClose={() => setIsRegenModalOpen(false)}
        title="Regenerate Ed25519 Signing Keys"
        description="Generating a new cryptographic keypair will change your signer public key fingerprint. Previously issued reports will still remain valid with your old public key, but new reports will be signed with the new key."
      >
        <div className="space-y-4">
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsRegenModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<RotateCw size={13} />}
              onClick={handleConfirmRegenerate}
            >
              Regenerate Keys
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
