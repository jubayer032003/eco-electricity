import React from 'react';
import { useSocket } from '../context/SocketContext';
import { AlertCircle, CheckCircle, ShieldAlert, Clock } from 'lucide-react';

export const AlertsPanel: React.FC = () => {
  const { alerts, resolveAlert } = useSocket();

  const activeAlerts = alerts.filter((a) => !a.resolved);

  const getSeverityStyle = (severity: string, resolved: boolean) => {
    if (resolved) return 'bg-slate-900/20 border-slate-800 text-slate-500';
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-500/10 border-rose-500/30 text-rose-400';
      case 'WARNING':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      default:
        return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
    }
  };

  const getSeverityIcon = (severity: string, resolved: boolean) => {
    if (resolved) return <CheckCircle size={16} className="text-slate-600" />;
    switch (severity) {
      case 'CRITICAL':
        return <ShieldAlert size={16} className="text-rose-400 animate-bounce" />;
      case 'WARNING':
        return <AlertCircle size={16} className="text-amber-400" />;
      default:
        return <AlertCircle size={16} className="text-blue-400" />;
    }
  };

  return (
    <div className="p-6 glass-panel rounded-3xl mb-6 flex flex-col h-full min-h-[300px]">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Alerts Log</span>
            {activeAlerts.length > 0 && (
              <span className="px-2 py-0.5 text-[10px] bg-rose-600 text-white rounded-full font-extrabold animate-pulse">
                {activeAlerts.length} Active
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400 font-medium">System exceptions and alerts</p>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto max-h-[360px] pr-1 flex flex-col gap-3">
        {alerts.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-8 text-slate-600 border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
            <CheckCircle size={28} className="mb-2 text-slate-700" />
            <p className="text-xs font-semibold">No issues detected</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Everything is operating normally</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 transition-all duration-300 ${getSeverityStyle(
                alert.severity,
                alert.resolved
              )}`}
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5">{getSeverityIcon(alert.severity, alert.resolved)}</div>
                <div className="flex flex-col">
                  <span className={`text-xs font-medium leading-snug ${alert.resolved ? 'line-through text-slate-600' : 'text-slate-200'}`}>
                    {alert.message}
                  </span>
                  <span className="text-[9px] text-slate-500 mt-1 flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {!alert.resolved && (
                <button
                  onClick={() => resolveAlert(alert.id)}
                  className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700/60 rounded-md transition-all duration-300 hover:text-white"
                >
                  Resolve
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
