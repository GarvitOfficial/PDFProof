import React, { useState } from 'react';
import { SettingsProvider } from './context/SettingsContext';
import { DocumentProvider } from './context/DocumentContext';
import { TrackingProvider, useTracking } from './context/TrackingContext';
import { Header, ActiveTab } from './components/layout/Header';
import { DocumentLibrary } from './components/library/DocumentLibrary';
import { PdfViewer } from './components/reader/PdfViewer';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { ReportGenerator } from './components/reports/ReportGenerator';
import { VerificationView } from './components/verify/VerificationView';
import { SettingsView } from './components/settings/SettingsView';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('library');
  const { flushTracking } = useTracking();

  const handleTabChange = async (tab: ActiveTab) => {
    if (activeTab === 'reader') {
      await flushTracking();
    }
    setActiveTab(tab);
  };

  const handleOpenDocument = () => {
    setActiveTab('reader');
  };

  const handleOpenAnalytics = () => {
    setActiveTab('analytics');
  };

  return (
    <div className="h-full flex flex-col bg-zinc-50 dark:bg-[#0c0d12] text-zinc-900 dark:text-zinc-100 overflow-hidden font-sans">
      <Header activeTab={activeTab} onTabChange={handleTabChange} />

      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'library' && (
          <DocumentLibrary
            onOpenDocument={handleOpenDocument}
            onOpenAnalytics={handleOpenAnalytics}
          />
        )}

        {activeTab === 'reader' && <PdfViewer />}

        {activeTab === 'analytics' && (
          <AnalyticsView
            onNavigateToReader={() => setActiveTab('reader')}
            onNavigateToReports={() => setActiveTab('reports')}
          />
        )}

        {activeTab === 'reports' && <ReportGenerator />}

        {activeTab === 'verify' && <VerificationView />}

        {activeTab === 'settings' && <SettingsView />}
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <SettingsProvider>
      <DocumentProvider>
        <TrackingProvider>
          <AppContent />
        </TrackingProvider>
      </DocumentProvider>
    </SettingsProvider>
  );
};

export default App;
