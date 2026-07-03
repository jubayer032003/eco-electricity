import React from 'react';
import { SocketProvider, useSocket } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { Header } from './components/Header';
import { OfficeMap } from './components/OfficeMap';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { AlertsPanel } from './components/AlertsPanel';
import { DevicePanel } from './components/DevicePanel';
import { AIInsightsPanel } from './components/AIInsightsPanel';
import { HistoricalDashboard } from './components/HistoricalDashboard';
import { AutomationDashboard } from './components/AutomationDashboard';
import { AIAssistantChat } from './components/AIAssistantChat';
import { QuickAccessSidebar } from './components/QuickAccessSidebar';
import { AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const DashboardContent: React.FC = () => {
  const { loading, error } = useSocket();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-950 text-white">
        <Loader2 size={40} className="text-indigo-500 animate-spin" />
        <div className="text-sm font-semibold tracking-wide text-slate-400">
          Connecting to IoT Hub...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-950 text-white px-6 text-center">
        <div className="p-4 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20">
          <AlertCircle size={40} className="animate-bounce" />
        </div>
        <div className="text-lg font-bold text-white mt-2">Connection Error</div>
        <p className="text-sm text-slate-400 max-w-md">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Quick Access Sidebar */}
      <QuickAccessSidebar />

      <div className="max-w-7xl mx-auto px-4 py-8 md:px-8 lg:pl-16 relative">
        {/* Header */}
        <motion.div
          id="section-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="scroll-mt-6"
        >
          <Header />
        </motion.div>

        {/* Office Schematic */}
        <motion.div
          id="section-office"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="scroll-mt-6"
        >
          <OfficeMap />
        </motion.div>

        {/* AI Energy Insights Panel */}
        <motion.div
          id="section-ai-insights"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="scroll-mt-6"
        >
          <AIInsightsPanel />
        </motion.div>

        {/* Main Grid: Analytics & Alerts */}
        <div id="section-analytics" className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 scroll-mt-6">
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <AnalyticsPanel />
          </motion.div>
          
          <motion.div
            className="flex flex-col gap-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <AlertsPanel />
          </motion.div>
        </div>

        {/* Historical Power Analytics Dashboard */}
        <motion.div
          id="section-historical"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="scroll-mt-6"
        >
          <HistoricalDashboard />
        </motion.div>

        {/* Smart Automation Dashboard */}
        <motion.div
          id="section-automation"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.37 }}
          className="scroll-mt-6"
        >
          <AutomationDashboard />
        </motion.div>

        {/* Detailed Device Management */}
        <motion.div
          id="section-devices"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="scroll-mt-6"
        >
          <DevicePanel />
        </motion.div>

        {/* Floating AI Chat Assistant */}
        <AIAssistantChat />
      </div>
    </>
  );
};

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <SocketProvider>
          <DashboardContent />
        </SocketProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
