import React from 'react';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Power, Shield, ShieldAlert, Cpu, Layers, Sun, Moon, Languages } from 'lucide-react';
import { motion } from 'framer-motion';

export const Header: React.FC = () => {
  const { devices, powerState, simulationRunning } = useSocket();
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();

  const activePower = powerState?.totalPowerDraw || 0;
  const activeDevices = devices.filter((d) => d.status === 'ON').length;
  const totalDevices = devices.length;

  const currentHour = new Date().getHours();
  const isOpen = currentHour >= 9 && currentHour < 17;

  return (
    <header className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 glass-panel rounded-2xl mb-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-indigo-600/30 text-indigo-400 rounded-xl border border-indigo-500/20">
          <Cpu size={28} className="animate-pulse" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{t('dashboard.title')}</h1>
          <p className="text-sm text-slate-400">{t('dashboard.subtitle')}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Toggle Buttons */}
        <div className="flex items-center gap-2">
          {/* Dark / Light Toggle */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={toggleTheme}
            className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all duration-300 ${
              theme === 'dark'
                ? 'bg-slate-800/80 border-slate-600/50 text-amber-400 hover:bg-slate-700/80 hover:border-amber-500/30'
                : 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100 shadow-sm'
            }`}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <motion.div
              key={theme}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </motion.div>
            <span className="hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </motion.button>

          {/* Bangla / English Toggle */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={toggleLanguage}
            className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all duration-300 ${
              language === 'en'
                ? 'bg-slate-800/80 border-slate-600/50 text-emerald-400 hover:bg-slate-700/80 hover:border-emerald-500/30'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 shadow-sm'
            }`}
            title={language === 'en' ? 'Switch to Bangla' : 'Switch to English'}
          >
            <Languages size={16} />
            <span className="font-bold">
              {language === 'en' ? 'বাংলা' : 'ENG'}
            </span>
          </motion.button>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Office Status */}
          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center gap-2">
            {isOpen ? (
              <Shield size={18} className="text-emerald-400" />
            ) : (
              <ShieldAlert size={18} className="text-amber-400" />
            )}
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">{t('office.hours')}</div>
              <div className="text-xs font-semibold text-white">
                {isOpen ? t('office.open') : t('office.closed')}
              </div>
            </div>
          </div>

          {/* Live Power */}
          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center gap-2">
            <Power size={18} className="text-indigo-400" />
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">{t('live.load')}</div>
              <div className="text-sm font-bold text-indigo-300">{activePower} W</div>
            </div>
          </div>

          {/* Active Devices */}
          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center gap-2">
            <Layers size={18} className="text-sky-400" />
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">{t('devices.active')}</div>
              <div className="text-sm font-bold text-white">
                {activeDevices} <span className="text-xs font-normal text-slate-500">/ {totalDevices}</span>
              </div>
            </div>
          </div>

          {/* Simulator Badge */}
          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${simulationRunning ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`} />
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">{t('simulation')}</div>
              <div className="text-xs font-semibold text-white">
                {simulationRunning ? t('simulation.active') : t('simulation.paused')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
