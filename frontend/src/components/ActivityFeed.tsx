import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { Clock, ToggleLeft, ToggleRight, ListFilter } from 'lucide-react';
import type { Device } from '../types';

interface ActivityLogItem {
  id: string;
  deviceName: string;
  status: 'ON' | 'OFF';
  timestamp: string;
}

export const ActivityFeed: React.FC = () => {
  const { socket } = useSocket();
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);

  useEffect(() => {
    if (!socket) return;

    const handleDeviceUpdate = (device: Device) => {
      const newItem: ActivityLogItem = {
        id: Math.random().toString(36).substr(2, 9),
        deviceName: device.name,
        status: device.status,
        timestamp: new Date().toISOString()
      };

      setLogs((prev) => [newItem, ...prev].slice(0, 20)); // Limit to last 20 items
    };

    socket.on('deviceUpdated', handleDeviceUpdate);

    return () => {
      socket.off('deviceUpdated', handleDeviceUpdate);
    };
  }, [socket]);

  return (
    <div className="p-6 glass-panel rounded-3xl mb-6 flex flex-col h-full min-h-[300px]">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <ListFilter size={18} className="text-indigo-400" />
          Activity Feed
        </h2>
        <p className="text-xs text-slate-400">Recent device changes and activities</p>
      </div>

      <div className="flex-grow overflow-y-auto max-h-[360px] pr-1 flex flex-col gap-3">
        {logs.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-8 text-slate-600 border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
            <Clock size={28} className="mb-2 text-slate-700 animate-pulse" />
            <p className="text-xs font-semibold">No recent activity</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Toggle devices to see actions feed</p>
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-xl bg-slate-900/40 border border-slate-900/80 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2">
                {log.status === 'ON' ? (
                  <ToggleRight size={18} className="text-emerald-400" />
                ) : (
                  <ToggleLeft size={18} className="text-slate-500" />
                )}
                <div>
                  <span className="font-semibold text-white">{log.deviceName}</span>
                  <span className="text-slate-400"> turned </span>
                  <span
                    className={`font-bold ${log.status === 'ON' ? 'text-emerald-400' : 'text-rose-400'}`}
                  >
                    {log.status}
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-slate-500">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
