import React from 'react';
import { ShieldCheck, Moon, Sun, Laptop, FileText, CheckCircle2, PauseCircle, EyeOff, Activity } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useTracking } from '../../context/TrackingContext';
import { useDocuments } from '../../context/DocumentContext';
import { Badge } from '../common/Badge';

export type ActiveTab = 'library' | 'reader' | 'analytics' | 'reports' | 'verify' | 'settings';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange }) => {
  const { settings, setTheme, effectiveTheme } = useSettings();
  const { currentDoc } = useDocuments();
  const { status, activeSeconds, currentPageNumber } = useTracking();

  const formatTimer = (totalSeconds: number) => {
    const sec = Math.round(totalSeconds);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const navItems: { id: ActiveTab; label: string; disabled?: boolean }[] = [
    { id: 'library', label: 'Library' },
    { id: 'reader', label: 'Reader', disabled: !currentDoc },
    { id: 'analytics', label: 'Analytics', disabled: !currentDoc },
    { id: 'reports', label: 'Reports', disabled: !currentDoc },
    { id: 'verify', label: 'Verify' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <header className="h-13 bg-white dark:bg-[#101117] border-b border-zinc-200 dark:border-zinc-800/80 shrink-0 px-4 flex items-center justify-between select-none">
      {/* Brand & Document Name */}
      <div className="flex items-center gap-3">
        <div
          onClick={() => onTabChange('library')}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="w-7 h-7 rounded bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 flex items-center justify-center font-bold text-xs tracking-tighter">
            P<span className="text-zinc-400 dark:text-zinc-500 font-light">P</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors">
              PDFProof
            </span>
            <span className="text-[10px] font-mono uppercase text-zinc-400 dark:text-zinc-500">
              v1.0
            </span>
          </div>
        </div>

        {/* Current Document Pill */}
        {currentDoc && (
          <div className="hidden md:flex items-center gap-1.5 pl-3 border-l border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
            <FileText size={13} className="text-zinc-400 shrink-0" />
            <span
              className="max-w-[180px] lg:max-w-[280px] truncate font-medium text-zinc-800 dark:text-zinc-200"
              title={currentDoc.meta.filename}
            >
              {currentDoc.meta.filename}
            </span>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <span className="font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
              {currentDoc.meta.totalPages}p
            </span>
          </div>
        )}
      </div>

      {/* Primary Navigation Tabs */}
      <nav className="flex items-center bg-zinc-100 dark:bg-[#161722] p-0.5 rounded border border-zinc-200/60 dark:border-zinc-800/60">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              disabled={item.disabled}
              onClick={() => onTabChange(item.id)}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                isActive
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : item.disabled
                  ? 'text-zinc-350 dark:text-zinc-600 opacity-40 cursor-not-allowed'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Right Controls: Active Ticker, Privacy Badge, Theme */}
      <div className="flex items-center gap-2.5">
        {/* Active Reading Live Indicator (when reading) */}
        {currentDoc && settings.showReadingTicker && (
          <div
            onClick={() => onTabChange('reader')}
            className="cursor-pointer hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-zinc-50 dark:bg-[#151620] border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
            title={`Reading state: ${status}`}
          >
            {status === 'active' && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            )}
            {status === 'idle' && <PauseCircle size={12} className="text-amber-500 shrink-0" />}
            {status === 'hidden' && <EyeOff size={12} className="text-zinc-400 shrink-0" />}
            {status === 'paused' && <Activity size={12} className="text-zinc-400 shrink-0" />}

            <span className="font-mono text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {formatTimer(activeSeconds)}
            </span>

            <span className="text-zinc-300 dark:text-zinc-700 text-xs">/</span>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
              p.{currentPageNumber}
            </span>
          </div>
        )}

        {/* Local-Only Privacy Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100/70 dark:bg-zinc-850/60 border border-zinc-200/50 dark:border-zinc-800/50">
          <ShieldCheck size={12} className="text-emerald-500" />
          <span>Local Only</span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={() => {
            const nextTheme =
              settings.theme === 'system'
                ? effectiveTheme === 'dark'
                  ? 'light'
                  : 'dark'
                : settings.theme === 'light'
                ? 'dark'
                : 'system';
            setTheme(nextTheme);
          }}
          className="p-1.5 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          title={`Theme: ${settings.theme} (Click to toggle)`}
        >
          {settings.theme === 'system' ? (
            <Laptop size={14} />
          ) : effectiveTheme === 'dark' ? (
            <Moon size={14} />
          ) : (
            <Sun size={14} />
          )}
        </button>
      </div>
    </header>
  );
};

