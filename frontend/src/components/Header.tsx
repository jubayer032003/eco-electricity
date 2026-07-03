import React from 'react';
import { useSocket } from '../context/SocketContext';
import { useLanguage } from '../context/LanguageContext';
import { Power, Shield, ShieldAlert, Cpu, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

export const Header: React.FC = () => {
  const { devices, powerState } = useSocket();
  const { t } = useLanguage();

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
