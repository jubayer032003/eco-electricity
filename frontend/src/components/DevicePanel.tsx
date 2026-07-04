import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { Fan, Lightbulb, Power, Clock, History } from 'lucide-react';
import type { RoomId } from '../types';

export const DevicePanel: React.FC = () => {
  const { devices, toggleDevice } = useSocket();
  const [selectedRoom, setSelectedRoom] = useState<RoomId | 'all'>('all');

  const roomsList: { id: RoomId | 'all'; name: string }[] = [
    { id: 'all', name: 'All Rooms' },
    { id: 'drawing', name: 'Drawing Room' },
    { id: 'work1', name: 'Work Room 1' },
    { id: 'work2', name: 'Work Room 2' }
  ];

  const filteredDevices = selectedRoom === 'all'
    ? devices
    : devices.filter((d) => d.room === selectedRoom);

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m < 60) return `${m}m ${s}s`;
    const h = Math.floor(m / 60);
    const remM = m % 60;
    return `${h}h ${remM}m ${s}s`;
  };

  const getRoomName = (room: RoomId) => {
    switch (room) {
      case 'drawing': return 'Drawing Room';
      case 'work1': return 'Work Room 1';
      case 'work2': return 'Work Room 2';
    }
  };

  return (
    <div className="p-6 glass-panel rounded-3xl mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-white">Live Device Panel</h2>
          <p className="text-xs text-slate-400">Total list of active electrical nodes</p>
        </div>

        {/* Filter buttons */}
        <div className="flex bg-slate-900/80 border border-slate-800 p-1 rounded-xl">
          {roomsList.map((room) => (
            <button
              key={room.id}
              onClick={() => setSelectedRoom(room.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 ${
                selectedRoom === room.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {room.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredDevices.map((device) => {
          const isOn = device.status === 'ON';
          return (
            <div
              key={device.id}
              onClick={() => toggleDevice(device.id, device.status)}
              className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
                isOn
                  ? 'bg-slate-900/70 border-indigo-500/30 shadow-md shadow-indigo-500/10 hover:border-indigo-500/60'
                  : 'bg-slate-900/30 border-slate-800/60 hover:border-slate-700'
              }`}
            >
              <div className="flex justify-between items-start gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2.5 rounded-xl border transition-colors duration-300 ${
                      isOn
                        ? device.type === 'fan'
                          ? 'bg-sky-500/20 text-sky-400 border-sky-500/30'
                          : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                        : 'bg-slate-950/60 text-slate-500 border-slate-800'
                    }`}
                  >
                    {device.type === 'fan' ? (
                      <Fan size={18} className={isOn ? 'fan-spinning' : ''} />
                    ) : (
                      <Lightbulb size={18} />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white leading-tight">
                      {device.name}
                    </h4>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {getRoomName(device.room)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDevice(device.id, device.status);
                  }}
                  className={`p-2 rounded-lg border transition-all duration-300 ${
                    isOn
                      ? 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border-indigo-500/30 hover:border-indigo-500/50'
                      : 'bg-slate-950/40 hover:bg-slate-900/60 text-slate-500 hover:text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                  title={isOn ? 'Turn OFF' : 'Turn ON'}
                >
                  <Power size={14} />
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 bg-slate-950/40 border border-slate-900/60 rounded-xl p-3">
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-500 uppercase font-semibold">Load</span>
                  <span className={`font-semibold ${isOn ? 'text-indigo-400' : 'text-slate-500'}`}>
                    {device.powerDraw} W
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-500 uppercase font-semibold">Status</span>
                  <span className={`font-semibold uppercase ${isOn ? 'text-emerald-400' : 'text-rose-500'}`}>
                    {device.status}
                  </span>
                </div>
                <div className="flex flex-col col-span-2 border-t border-slate-900/60 pt-2 mt-1 gap-1">
                  <div className="flex items-center gap-1.5">
                    <Clock size={10} className="text-slate-500" />
                    <span>Today: <strong>{formatDuration(device.runtimeToday)}</strong></span>
                  </div>
                  {isOn && (
                    <div className="flex items-center gap-1.5 text-indigo-400">
                      <History size={10} className="text-indigo-400" />
                      <span>Session: <strong>{formatDuration(device.runtimeCurrentSession)}</strong></span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
