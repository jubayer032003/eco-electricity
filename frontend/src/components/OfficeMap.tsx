import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useLanguage } from '../context/LanguageContext';
import { Fan, Lightbulb, Layers, ArrowUp, Compass, SlidersHorizontal, Play, Pause, RotateCcw, Zap, UserPlus, UserMinus, Activity, Clock, Coins, TrendingUp } from 'lucide-react';
import type { RoomId, Device } from '../types';
import { motion } from 'framer-motion';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const OfficeMap: React.FC = () => {
  const { devices, powerState, toggleDevice, socket, simulationRunning, simulationSpeed, toggleSimulation, resetSimulation, triggerDemoMode } = useSocket();
  const { t } = useLanguage();

  const [occupancy, setOccupancy] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d'); // '2d' (Architectural diagram) or '3d' (Isometric view)

  // 3D View Controls state (for 3D mode)
  const [rotX, setRotX] = useState<number>(55);
  const [rotZ, setRotZ] = useState<number>(-45);
  const [zoom, setZoom] = useState<number>(1.0);
  const [isAutoOrbit, setIsAutoOrbit] = useState<boolean>(false);
  const animRef = useRef<number | null>(null);

  // ── Smart Occupancy Simulation State ──
  const [roomOccupants, setRoomOccupants] = useState<Record<RoomId, number>>({
    drawing: 0,
    work1: 0,
    work2: 0
  });
  const [doorOpenStates, setDoorOpenStates] = useState<Record<RoomId, boolean>>({
    drawing: false,
    work1: false,
    work2: false
  });
  const [sensorPulses, setSensorPulses] = useState<Record<RoomId, boolean>>({
    drawing: false,
    work1: false,
    work2: false
  });
  const [isAutoDemo, setIsAutoDemo] = useState<boolean>(false);
  const [autoShutdownEvents, setAutoShutdownEvents] = useState<number>(0);
  const [energySavedAccumulated, setEnergySavedAccumulated] = useState<number>(0);
  const [simulationLogs, setSimulationLogs] = useState<Array<{
    id: string;
    time: string;
    text: string;
    room: string;
    type: 'enter' | 'exit' | 'shutdown';
  }>>([]);

  // Sync initial occupants representation with backend status
  useEffect(() => {
    const syncedOccupants = { drawing: 0, work1: 0, work2: 0 };
    if (occupancy.drawing) syncedOccupants.drawing = 1;
    if (occupancy.work1) syncedOccupants.work1 = 2;
    if (occupancy.work2) syncedOccupants.work2 = 2;
    setRoomOccupants(syncedOccupants);
  }, [occupancy]);

  const addLog = (text: string, room: string, type: 'enter' | 'exit' | 'shutdown') => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setSimulationLogs((prev) => [
      {
        id: Math.random().toString(),
        time: timeStr,
        text,
        room,
        type
      },
      ...prev.slice(0, 19)
    ]);
  };

  const handlePersonEnter = async (roomId: RoomId) => {
    const currentCount = roomOccupants[roomId] || 0;
    const newCount = currentCount + 1;
    
    setRoomOccupants((prev) => ({ ...prev, [roomId]: newCount }));
    setDoorOpenStates((prev) => ({ ...prev, [roomId]: true }));
    setSensorPulses((prev) => ({ ...prev, [roomId]: true }));
    
    addLog(`Person entered ${t(`room.${roomId}`)}. Motion Sensor Triggered.`, roomId, 'enter');
    
    setTimeout(() => {
      setDoorOpenStates((prev) => ({ ...prev, [roomId]: false }));
      setSensorPulses((prev) => ({ ...prev, [roomId]: false }));
    }, 1000);

    if (currentCount === 0) {
      await fetch(`${BACKEND_URL}/automation/occupancy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: roomId, occupied: true })
      });
      addLog(`Room status: Empty → Occupied. Lights ON, Fan ON.`, roomId, 'enter');
    }
  };

  const handlePersonExit = async (roomId: RoomId) => {
    const currentCount = roomOccupants[roomId] || 0;
    if (currentCount <= 0) return;
    
    const newCount = currentCount - 1;
    setRoomOccupants((prev) => ({ ...prev, [roomId]: newCount }));
    setDoorOpenStates((prev) => ({ ...prev, [roomId]: true }));
    setSensorPulses((prev) => ({ ...prev, [roomId]: true }));
    
    addLog(`Person exited ${t(`room.${roomId}`)}.`, roomId, 'exit');
    
    setTimeout(() => {
      setDoorOpenStates((prev) => ({ ...prev, [roomId]: false }));
      setSensorPulses((prev) => ({ ...prev, [roomId]: false }));
    }, 1000);

    if (newCount === 0) {
      addLog(`Room empty. Waiting 5 seconds...`, roomId, 'exit');
      
      setTimeout(async () => {
        setRoomOccupants((latest) => {
          if (latest[roomId] === 0) {
            fetch(`${BACKEND_URL}/automation/occupancy`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ room: roomId, occupied: false })
            }).then(() => {
              addLog(`Energy Saved: Devices automatically turned off in ${t(`room.${roomId}`)}.`, roomId, 'shutdown');
              setAutoShutdownEvents((prev) => prev + 1);
              setEnergySavedAccumulated((prev) => prev + 0.034);
            });
          }
          return latest;
        });
      }, 5000);
    }
  };

  const handleRandomActivity = () => {
    const rooms: RoomId[] = ['drawing', 'work1', 'work2'];
    const randomRoom = rooms[Math.floor(Math.random() * rooms.length)];
    const action = Math.random() > 0.45 ? 'enter' : 'exit';
    if (action === 'enter' || roomOccupants[randomRoom] === 0) {
      handlePersonEnter(randomRoom);
    } else {
      handlePersonExit(randomRoom);
    }
  };

  const handleResetSimulation = async () => {
    setIsAutoDemo(false);
    setRoomOccupants({ drawing: 0, work1: 0, work2: 0 });
    setDoorOpenStates({ drawing: false, work1: false, work2: false });
    setSensorPulses({ drawing: false, work1: false, work2: false });
    setSimulationLogs([]);
    setAutoShutdownEvents(0);
    setEnergySavedAccumulated(0);

    const rooms: RoomId[] = ['drawing', 'work1', 'work2'];
    for (const r of rooms) {
      await fetch(`${BACKEND_URL}/automation/occupancy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: r, occupied: false })
      });
    }
    addLog('Simulation reset. All rooms cleared and automated devices powered off.', 'all', 'shutdown');
  };

  // Automated demo simulation loop (Continuous movement between rooms)
  useEffect(() => {
    if (!isAutoDemo) return;
    const interval = setInterval(() => {
      const rooms: RoomId[] = ['drawing', 'work1', 'work2'];
      const action = Math.random() > 0.4 ? 'move' : (Math.random() > 0.5 ? 'enter' : 'exit');
      const randomRoom = rooms[Math.floor(Math.random() * rooms.length)];

      if (action === 'move') {
        const occupiedRooms = rooms.filter((r) => (roomOccupants[r] || 0) > 0);
        if (occupiedRooms.length > 0) {
          const fromRoom = occupiedRooms[Math.floor(Math.random() * occupiedRooms.length)];
          const toRoom = rooms.filter((r) => r !== fromRoom)[Math.floor(Math.random() * 2)];
          handlePersonExit(fromRoom);
          setTimeout(() => {
            handlePersonEnter(toRoom);
          }, 1200);
        } else {
          handlePersonEnter(randomRoom);
        }
      } else if (action === 'enter') {
        handlePersonEnter(randomRoom);
      } else {
        handlePersonExit(randomRoom);
      }
    }, 5500);
    return () => clearInterval(interval);
  }, [isAutoDemo, roomOccupants]);

  // Auto-orbit loop
  useEffect(() => {
    if (isAutoOrbit && viewMode === '3d') {
      const orbitStep = () => {
        setRotZ((prev) => (prev >= 180 ? -180 : prev + 0.4));
        animRef.current = requestAnimationFrame(orbitStep);
      };
      animRef.current = requestAnimationFrame(orbitStep);
    } else if (animRef.current) {
      cancelAnimationFrame(animRef.current);
    }
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isAutoOrbit, viewMode]);

  // Query occupancy status on load & listen to real-time events
  useEffect(() => {
    fetch(`${BACKEND_URL}/automation/status`)
      .then((res) => res.json())
      .then((data) => {
        if (data.occupancy) setOccupancy(data.occupancy);
      })
      .catch((err) => console.error('Failed to fetch occupancy:', err));

    if (!socket) return;
    const handleOccupancy = (occ: Record<string, boolean>) => {
      setOccupancy(occ);
    };
    socket.on('occupancyUpdated', handleOccupancy);
    return () => {
      socket.off('occupancyUpdated', handleOccupancy);
    };
  }, [socket]);

  const getRoomDevices = (room: RoomId) => {
    return devices.filter((d) => d.room === room);
  };

  const getRoomPower = (room: RoomId) => {
    const summary = powerState?.rooms.find((r) => r.room === room);
    return summary?.powerDraw || 0;
  };

  const toggleRoomOccupancy = async (roomId: RoomId, currentOccupancy: boolean) => {
    try {
      const res = await fetch(`${BACKEND_URL}/automation/occupancy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: roomId, occupied: !currentOccupancy })
      });
      if (!res.ok) {
        console.error('Failed to toggle occupancy');
      }
    } catch (err) {
      console.error('Error toggling occupancy:', err);
    }
  };

  const renderTopDownPerson = (pulseDelay = 0) => {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="absolute w-8 h-8 pointer-events-none z-10"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
          {/* Pulsing Aura Circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#6366f1"
            strokeWidth="3"
            className="animate-pulse"
            style={{ animationDelay: `${pulseDelay}s` }}
          />
          <circle
            cx="50"
            cy="50"
            r="30"
            fill="url(#personGradient)"
          />
          {/* Shoulders */}
          <path d="M 18,72 Q 50,55 82,72 L 82,90 Q 50,80 18,90 Z" fill="#4f46e5" />
          {/* Head */}
          <circle cx="50" cy="45" r="16" fill="#818cf8" stroke="#312e81" strokeWidth="2" />
          
          <defs>
            <radialGradient id="personGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.1" />
            </radialGradient>
          </defs>
        </svg>
      </motion.div>
    );
  };

  // Top-down 2D Ceiling Fan SVG Component (Realistic Mahogany & Brass Design)
  const renderTopDownFan = (device: Device) => {
    const isOn = device.status === 'ON';
    return (
      <button
        key={device.id}
        onClick={() => toggleDevice(device.id, device.status)}
        title={`Click to toggle ${device.name}`}
        className="relative group cursor-pointer p-1 rounded-full transition-all hover:scale-115 flex items-center justify-center focus:outline-none z-20"
      >
        {/* Air Circulation Ripple Ring when ON */}
        {isOn && (
          <>
            <span className="absolute -inset-4 rounded-full border-2 border-sky-400/40 animate-ping opacity-75 pointer-events-none" />
            <span className="absolute -inset-2 rounded-full bg-sky-400/15 blur-sm pointer-events-none" />
          </>
        )}

        {/* High-Resolution Top-Down Ceiling Fan SVG */}
        <div className="relative w-11 h-11 flex items-center justify-center">
          <svg
            viewBox="0 0 100 100"
            className={`w-full h-full drop-shadow-md transition-transform duration-300 ${isOn ? 'fan-spinning' : ''}`}
          >
            {/* Outer Mounting Ceiling Rose */}
            <circle cx="50" cy="50" r="16" fill="#3b2b24" stroke="#6b4c3b" strokeWidth="3" />
            
            {/* 3 Detailed Wood/Metallic Fan Blades with Root Brackets */}
            {/* Blade 1 (Top 0deg) */}
            <g>
              <rect x="46" y="8" width="8" height="34" rx="4" fill="#6d4c33" stroke="#4a3220" strokeWidth="1.5" />
              <path d="M 47 40 L 53 40 L 51 46 L 49 46 Z" fill="#2d1c12" />
            </g>
            {/* Blade 2 (120deg) */}
            <g transform="rotate(120 50 50)">
              <rect x="46" y="8" width="8" height="34" rx="4" fill="#6d4c33" stroke="#4a3220" strokeWidth="1.5" />
              <path d="M 47 40 L 53 40 L 51 46 L 49 46 Z" fill="#2d1c12" />
            </g>
            {/* Blade 3 (240deg) */}
            <g transform="rotate(240 50 50)">
              <rect x="46" y="8" width="8" height="34" rx="4" fill="#6d4c33" stroke="#4a3220" strokeWidth="1.5" />
              <path d="M 47 40 L 53 40 L 51 46 L 49 46 Z" fill="#2d1c12" />
            </g>

            {/* Central Motor Hub & Brass Cap */}
            <circle cx="50" cy="50" r="11" fill="#4a3528" stroke="#8c6549" strokeWidth="2" />
            <circle cx="50" cy="50" r="6" fill="#d97706" stroke="#b45309" strokeWidth="1" />
            <circle cx="50" cy="50" r="2.5" fill="#fef08a" />
          </svg>
        </div>
      </button>
    );
  };

  // Top-down 2D Ceiling Light Fixture SVG Component (Realistic Multi-Layer Radial Beam)
  const renderTopDownLight = (device: Device) => {
    const isOn = device.status === 'ON';
    return (
      <button
        key={device.id}
        onClick={() => toggleDevice(device.id, device.status)}
        title={`Click to toggle ${device.name}`}
        className="relative group cursor-pointer p-1 rounded-full transition-all hover:scale-120 flex items-center justify-center focus:outline-none z-20"
      >
        {/* Multi-Layered Radial Floor Illumination Light Pool when ON */}
        {isOn && (
          <>
            {/* Wide Floor Beam Shadow/Pool */}
            <span className="absolute -inset-8 rounded-full bg-gradient-to-r from-yellow-300/30 via-amber-400/25 to-yellow-300/30 blur-lg animate-pulse pointer-events-none" />
            {/* Concentric Aura Ring */}
            <span className="absolute -inset-4 rounded-full border border-yellow-300/50 animate-ping opacity-60 pointer-events-none" />
          </>
        )}

        {/* High-Resolution Ceiling Light Fixture SVG */}
        <div className="relative w-8 h-8 flex items-center justify-center">
          <svg viewBox="0 0 60 60" className="w-full h-full drop-shadow-lg">
            {/* Metallic Mounting Rim */}
            <circle cx="30" cy="30" r="26" fill={isOn ? '#fef9c3' : '#e2e8f0'} stroke={isOn ? '#eab308' : '#94a3b8'} strokeWidth="4" />
            
            {/* Glass Diffuser Ring */}
            <circle cx="30" cy="30" r="19" fill={isOn ? '#fef08a' : '#cbd5e1'} stroke={isOn ? '#f59e0b' : '#64748b'} strokeWidth="2" />
            
            {/* Center Glowing LED Spot */}
            <circle 
              cx="30" 
              cy="30" 
              r="10" 
              fill={isOn ? '#ffffff' : '#94a3b8'} 
              className={isOn ? 'drop-shadow-[0_0_8px_rgba(250,204,21,1)]' : ''} 
            />
          </svg>
        </div>
      </button>
    );
  };

  return (
    <div className="p-6 glass-panel rounded-3xl mb-6">
      {/* Integrated Header Bar & Simulation Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers size={18} className="text-indigo-400" />
            {t('office.mapTitle')}
          </h2>
          <p className="text-xs text-slate-400">
            2D top-down animated architectural schematic. Click any fan or light bulb directly on the floor plan to toggle power.
          </p>
        </div>

        {/* Action Controls Cluster: Simulation Bar + View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Integrated Simulation Controls */}
          <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-md border border-indigo-500/20">
              {simulationSpeed}x Speed
            </span>

            <button
              onClick={toggleSimulation}
              title={simulationRunning ? "Pause Simulation" : "Start Simulation"}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all border ${
                simulationRunning
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
              }`}
            >
              {simulationRunning ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Start</>}
            </button>

            <button
              onClick={resetSimulation}
              title="Reset All Devices"
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition-all"
            >
              <RotateCcw size={12} /> Reset
            </button>

            <button
              onClick={triggerDemoMode}
              title="30x Speed Demo Mode"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all border ${
                simulationSpeed === 30 && simulationRunning
                  ? 'bg-indigo-600 text-white border-indigo-400 animate-pulse'
                  : 'bg-indigo-950/40 text-indigo-300 border-indigo-500/20 hover:bg-indigo-900/60'
              }`}
            >
              <Zap size={12} /> Demo
            </button>
          </div>

          {/* View Mode Switcher (2D / 3D) */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setViewMode('2d')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === '2d'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers size={13} /> 2D
            </button>
            <button
              onClick={() => setViewMode('3d')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === '3d'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass size={13} /> 3D
            </button>
          </div>

        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* VIEW MODE 1: 2D TOP-DOWN ARCHITECTURAL DIAGRAM (MATCHING IMAGE) */}
      {/* ──────────────────────────────────────────────────────────── */}
      {viewMode === '2d' && (
        <div className="flex flex-col xl:flex-row gap-6">
          
          {/* Main 2D Building Blueprint Container */}
          <div className="flex-grow flex flex-col items-center">
            
            {/* Top Subheader Interactive Hint Banner */}
            <div className="text-center mb-3">
              <span className="text-xs font-bold text-sky-300 tracking-wide bg-sky-950/60 px-4 py-1.5 rounded-full border border-sky-500/30 shadow-sm flex items-center justify-center gap-2 w-max mx-auto">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                Click any fan or light bulb directly on the floor plan to toggle power
              </span>
            </div>

            {/* Building Outer Wall Frame */}
            <div className="relative w-full max-w-4xl bg-slate-800 p-2.5 rounded-xl shadow-2xl border-4 border-slate-700">
              
              {/* Top Windows */}
              <div className="absolute -top-1.5 left-1/4 w-12 h-2 bg-sky-200 border border-sky-400 rounded-sm shadow-xs" />
              <div className="absolute -top-1.5 left-1/2 w-12 h-2 bg-sky-200 border border-sky-400 rounded-sm shadow-xs" />
              <div className="absolute -top-1.5 left-3/4 w-12 h-2 bg-sky-200 border border-sky-400 rounded-sm shadow-xs" />

              {/* Side Windows */}
              <div className="absolute left-0 top-1/3 w-2 h-10 bg-sky-200 border border-sky-400 rounded-sm shadow-xs" />
              <div className="absolute right-0 top-1/2 w-2 h-10 bg-sky-200 border border-sky-400 rounded-sm shadow-xs" />

              {/* 3 Upper Rooms Container */}
              <div className="grid grid-cols-1 md:grid-cols-3 border-2 border-slate-700 bg-slate-900 rounded-t-lg">
                
                {/* ── DRAWING ROOM (Left) ── */}
                <div className="relative p-4 min-h-[300px] bg-[#d2beaa] text-slate-900 border-b-4 md:border-b-0 md:border-r-4 border-slate-700 flex flex-col justify-between overflow-hidden">
                  {/* Top Lights & Fan */}
                  <div className="flex justify-between items-center z-10">
                    {renderTopDownLight(getRoomDevices('drawing')[2] || { id: 'drawing-light-1', status: 'OFF' } as Device)}
                    {renderTopDownFan(getRoomDevices('drawing')[0] || { id: 'drawing-fan-1', status: 'OFF' } as Device)}
                    {renderTopDownLight(getRoomDevices('drawing')[3] || { id: 'drawing-light-2', status: 'OFF' } as Device)}
                  </div>

                  {/* Room Name Header & Occupancy Toggle */}
                  <div className="text-center flex flex-col items-center gap-1 z-10">
                    <div className="font-black text-xs uppercase tracking-widest text-slate-800">
                      {t('room.drawing')}
                    </div>
                    <button
                      onClick={() => toggleRoomOccupancy('drawing', occupancy.drawing || false)}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all duration-300 ${
                        occupancy.drawing
                          ? 'bg-indigo-600/90 text-white border-indigo-500/50 shadow-md shadow-indigo-500/20 hover:bg-indigo-600'
                          : 'bg-slate-200/90 text-slate-600 border-slate-300/50 hover:bg-slate-200'
                      }`}
                    >
                      {occupancy.drawing ? '👤 Occupied' : '🚫 Empty'}
                    </button>
                  </div>

                  {/* Furnishings: Sofa, Coffee Table, Rug, Armchair */}
                  <div className="relative my-2 flex items-center justify-between">
                    {/* Sofa Couch along left wall */}
                    <div className="relative w-7 h-28 bg-[#9c8978] border-2 border-[#736354] rounded-sm shadow-sm flex items-center justify-center p-0.5">
                      <div className="absolute inset-0 flex flex-col justify-between p-0.5 pointer-events-none">
                        <div className="w-full h-6 border-b border-[#736354]" />
                        <div className="w-full h-6 border-b border-[#736354]" />
                      </div>
                      {occupancy.drawing && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          {renderTopDownPerson(0)}
                        </div>
                      )}
                    </div>

                    {/* Rug & Coffee Table */}
                    <div className="w-16 h-20 bg-[#c2b09b] border border-[#a89783] rounded flex items-center justify-center p-2 shadow-xs">
                      <div className="w-10 h-12 bg-[#8c7a6b] border border-[#6b5b4e] rounded shadow-sm" />
                    </div>

                    {/* Armchair at bottom left */}
                    <div className="w-8 h-8 bg-[#9c8978] border-2 border-[#736354] rounded-sm shadow-sm" />
                  </div>

                  {/* Bottom Fan & Light */}
                  <div className="flex justify-between items-center z-10 mt-2">
                    <div className="w-6 h-6" /> {/* Spacer */}
                    {renderTopDownFan(getRoomDevices('drawing')[1] || { id: 'drawing-fan-2', status: 'OFF' } as Device)}
                    {renderTopDownLight(getRoomDevices('drawing')[4] || { id: 'drawing-light-3', status: 'OFF' } as Device)}
                  </div>

                  {/* Decorative Potted Plants */}
                  <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-emerald-700 border border-emerald-600 flex items-center justify-center text-[10px]">🌿</div>
                  <div className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-emerald-700 border border-emerald-600 flex items-center justify-center text-[10px]">🌿</div>

                  {/* Interior Door Swing Arc at bottom right */}
                  <div className="absolute bottom-0 right-4 w-8 h-8 border-r border-b border-dashed border-slate-600 rounded-br-full pointer-events-none" />
                  <div className="absolute bottom-0 right-4 w-8 h-1 bg-amber-800 border border-amber-900" />
                </div>


                {/* ── WORK ROOM 1 (Middle) ── */}
                <div className="relative p-4 min-h-[300px] bg-[#d5d8dc] text-slate-900 border-b-4 md:border-b-0 md:border-r-4 border-slate-700 flex flex-col justify-between overflow-hidden">
                  {/* Top Lights & Fan */}
                  <div className="flex justify-between items-center z-10">
                    {renderTopDownLight(getRoomDevices('work1')[2] || { id: 'work1-light-1', status: 'OFF' } as Device)}
                    {renderTopDownFan(getRoomDevices('work1')[0] || { id: 'work1-fan-1', status: 'OFF' } as Device)}
                    {renderTopDownLight(getRoomDevices('work1')[3] || { id: 'work1-light-2', status: 'OFF' } as Device)}
                  </div>

                  {/* Workstation Desks Grid (4 Employees) */}
                  <div className="grid grid-cols-2 gap-4 my-2 z-10">
                    {/* Desk 1 */}
                    <div className="relative bg-[#bda893] border border-[#968270] p-1.5 rounded shadow-sm flex flex-col items-center justify-center min-h-[48px]">
                      <div className="flex flex-col items-center">
                        <div className="w-5 h-3 bg-slate-900 rounded-xs border border-slate-700" />
                        <div className="w-4 h-3 bg-slate-800 rounded-full mt-1" />
                      </div>
                      {occupancy.work1 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          {renderTopDownPerson(0)}
                        </div>
                      )}
                    </div>
                    {/* Desk 2 */}
                    <div className="relative bg-[#bda893] border border-[#968270] p-1.5 rounded shadow-sm flex flex-col items-center justify-center min-h-[48px]">
                      <div className="flex flex-col items-center">
                        <div className="w-5 h-3 bg-slate-900 rounded-xs border border-slate-700" />
                        <div className="w-4 h-3 bg-slate-800 rounded-full mt-1" />
                      </div>
                    </div>
                  </div>

                  {/* Room Name Header & Occupancy Toggle */}
                  <div className="text-center flex flex-col items-center gap-1 z-10">
                    <div className="font-black text-xs uppercase tracking-widest text-slate-800">
                      {t('room.work1')}
                    </div>
                    <button
                      onClick={() => toggleRoomOccupancy('work1', occupancy.work1 || false)}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all duration-300 ${
                        occupancy.work1
                          ? 'bg-indigo-600/90 text-white border-indigo-500/50 shadow-md shadow-indigo-500/20 hover:bg-indigo-600'
                          : 'bg-slate-200/90 text-slate-600 border-slate-300/50 hover:bg-slate-200'
                      }`}
                    >
                      {occupancy.work1 ? '👤 Occupied' : '🚫 Empty'}
                    </button>
                  </div>

                  {/* Workstation Desks Bottom Grid */}
                  <div className="grid grid-cols-2 gap-4 my-2 z-10">
                    {/* Desk 3 */}
                    <div className="relative bg-[#bda893] border border-[#968270] p-1.5 rounded shadow-sm flex flex-col items-center justify-center min-h-[48px]">
                      <div className="flex flex-col items-center">
                        <div className="w-5 h-3 bg-slate-900 rounded-xs border border-slate-700" />
                        <div className="w-4 h-3 bg-slate-800 rounded-full mt-1" />
                      </div>
                      {occupancy.work1 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          {renderTopDownPerson(0.5)}
                        </div>
                      )}
                    </div>
                    {/* Desk 4 */}
                    <div className="relative bg-[#bda893] border border-[#968270] p-1.5 rounded shadow-sm flex flex-col items-center justify-center min-h-[48px]">
                      <div className="flex flex-col items-center">
                        <div className="w-5 h-3 bg-slate-900 rounded-xs border border-slate-700" />
                        <div className="w-4 h-3 bg-slate-800 rounded-full mt-1" />
                      </div>
                    </div>
                  </div>

                  {/* Bottom Fan & Light */}
                  <div className="flex justify-between items-center z-10 mt-2">
                    <div className="w-6 h-6" />
                    {renderTopDownFan(getRoomDevices('work1')[1] || { id: 'work1-fan-2', status: 'OFF' } as Device)}
                    {renderTopDownLight(getRoomDevices('work1')[4] || { id: 'work1-light-3', status: 'OFF' } as Device)}
                  </div>

                  {/* Door Swing Arc */}
                  <div className="absolute bottom-0 left-4 w-8 h-8 border-l border-b border-dashed border-slate-600 rounded-bl-full pointer-events-none" />
                  <div className="absolute bottom-0 left-4 w-8 h-1 bg-amber-800 border border-amber-900" />
                </div>


                {/* ── WORK ROOM 2 (Right) ── */}
                <div className="relative p-4 min-h-[300px] bg-[#cbb297] text-slate-900 flex flex-col justify-between overflow-hidden">
                  {/* Top Lights & Fan */}
                  <div className="flex justify-between items-center z-10">
                    {renderTopDownLight(getRoomDevices('work2')[2] || { id: 'work2-light-1', status: 'OFF' } as Device)}
                    {renderTopDownFan(getRoomDevices('work2')[0] || { id: 'work2-fan-1', status: 'OFF' } as Device)}
                    {renderTopDownLight(getRoomDevices('work2')[3] || { id: 'work2-light-2', status: 'OFF' } as Device)}
                  </div>

                  {/* Workstation Desks Top Grid (4 Employees) */}
                  <div className="grid grid-cols-2 gap-4 my-2 z-10">
                    {/* Desk 1 */}
                    <div className="relative bg-[#b09983] border border-[#8a7561] p-1.5 rounded shadow-sm flex flex-col items-center justify-center min-h-[48px]">
                      <div className="flex flex-col items-center">
                        <div className="w-5 h-3 bg-slate-900 rounded-xs border border-slate-700" />
                        <div className="w-4 h-3 bg-slate-800 rounded-full mt-1" />
                      </div>
                      {occupancy.work2 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          {renderTopDownPerson(0.2)}
                        </div>
                      )}
                    </div>
                    {/* Desk 2 */}
                    <div className="relative bg-[#b09983] border border-[#8a7561] p-1.5 rounded shadow-sm flex flex-col items-center justify-center min-h-[48px]">
                      <div className="flex flex-col items-center">
                        <div className="w-5 h-3 bg-slate-900 rounded-xs border border-slate-700" />
                        <div className="w-4 h-3 bg-slate-800 rounded-full mt-1" />
                      </div>
                    </div>
                  </div>

                  {/* Room Name Header & Occupancy Toggle */}
                  <div className="text-center flex flex-col items-center gap-1 z-10">
                    <div className="font-black text-xs uppercase tracking-widest text-slate-800">
                      {t('room.work2')}
                    </div>
                    <button
                      onClick={() => toggleRoomOccupancy('work2', occupancy.work2 || false)}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all duration-300 ${
                        occupancy.work2
                          ? 'bg-indigo-600/90 text-white border-indigo-500/50 shadow-md shadow-indigo-500/20 hover:bg-indigo-600'
                          : 'bg-slate-200/90 text-slate-600 border-slate-300/50 hover:bg-slate-200'
                      }`}
                    >
                      {occupancy.work2 ? '👤 Occupied' : '🚫 Empty'}
                    </button>
                  </div>

                  {/* Workstation Desks Bottom Grid */}
                  <div className="grid grid-cols-2 gap-4 my-2 z-10">
                    {/* Desk 3 */}
                    <div className="relative bg-[#b09983] border border-[#8a7561] p-1.5 rounded shadow-sm flex flex-col items-center justify-center min-h-[48px]">
                      <div className="flex flex-col items-center">
                        <div className="w-5 h-3 bg-slate-900 rounded-xs border border-slate-700" />
                        <div className="w-4 h-3 bg-slate-800 rounded-full mt-1" />
                      </div>
                      {occupancy.work2 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          {renderTopDownPerson(0.7)}
                        </div>
                      )}
                    </div>
                    {/* Desk 4 */}
                    <div className="relative bg-[#b09983] border border-[#8a7561] p-1.5 rounded shadow-sm flex flex-col items-center justify-center min-h-[48px]">
                      <div className="flex flex-col items-center">
                        <div className="w-5 h-3 bg-slate-900 rounded-xs border border-slate-700" />
                        <div className="w-4 h-3 bg-slate-800 rounded-full mt-1" />
                      </div>
                    </div>
                  </div>

                  {/* Bottom Fan & Light */}
                  <div className="flex justify-between items-center z-10 mt-2">
                    <div className="w-6 h-6" />
                    {renderTopDownFan(getRoomDevices('work2')[1] || { id: 'work2-fan-2', status: 'OFF' } as Device)}
                    {renderTopDownLight(getRoomDevices('work2')[4] || { id: 'work2-light-3', status: 'OFF' } as Device)}
                  </div>

                  {/* Door Swing Arc */}
                  <div className="absolute bottom-0 left-4 w-8 h-8 border-l border-b border-dashed border-slate-600 rounded-bl-full pointer-events-none" />
                  <div className="absolute bottom-0 left-4 w-8 h-1 bg-amber-800 border border-amber-900" />
                </div>

              </div>

              {/* ── BOTTOM CORRIDOR / HALLWAY ── */}
              <div className="relative h-20 bg-[#dfd2be] border-2 border-t-0 border-slate-700 rounded-b-lg flex items-center justify-between px-6">
                {/* Plants along hallway */}
                <div className="w-6 h-6 rounded-full bg-emerald-700 border border-emerald-600 flex items-center justify-center text-[10px]">🌿</div>

                {/* Main Entry Door Arc at Center */}
                <div className="flex flex-col items-center relative">
                  <div className="absolute -top-10 w-10 h-10 border-b border-r border-dashed border-slate-700 rounded-br-full pointer-events-none" />
                  <div className="w-10 h-1 bg-amber-900 border border-amber-950 mb-1" />
                  <div className="flex items-center gap-1 text-[11px] font-black uppercase text-slate-900 tracking-widest">
                    <ArrowUp size={12} className="animate-bounce" /> {t('map.entry')}
                  </div>
                </div>

                {/* Water Dispenser & Plant on right */}
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-700 border border-emerald-600 flex items-center justify-center text-[10px]">🌿</div>
                  {/* Water Dispenser */}
                  <div className="w-7 h-7 bg-slate-300 border border-slate-500 rounded p-0.5 flex flex-col items-center justify-center shadow-xs">
                    <div className="w-3.5 h-3.5 rounded-full bg-sky-400 border border-sky-500 shadow-xs" />
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Color-Coded Room Wise Devices Bar */}
            <div className="w-full max-w-4xl mt-4 p-3 bg-slate-900/80 rounded-2xl border border-slate-800">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                {t('map.roomWiseDevices')}
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2 bg-[#d2beaa]/20 border border-[#d2beaa]/40 rounded-xl text-slate-200">
                  <div className="text-xs font-bold text-[#d2beaa]">{t('room.drawing')}</div>
                  <div className="text-[10px] text-slate-400">2 Fans | 3 Lights</div>
                </div>
                <div className="p-2 bg-[#d5d8dc]/20 border border-[#d5d8dc]/40 rounded-xl text-slate-200">
                  <div className="text-xs font-bold text-[#d5d8dc]">{t('room.work1')}</div>
                  <div className="text-[10px] text-slate-400">2 Fans | 3 Lights</div>
                </div>
                <div className="p-2 bg-[#cbb297]/20 border border-[#cbb297]/40 rounded-xl text-slate-200">
                  <div className="text-xs font-bold text-[#cbb297]">{t('room.work2')}</div>
                  <div className="text-[10px] text-slate-400">2 Fans | 3 Lights</div>
                </div>
              </div>
            </div>

          </div>

          {/* ── RIGHT SIDE INFORMATION PANELS (MATCHING IMAGE) ── */}
          <div className="w-full xl:w-72 flex flex-col gap-4 flex-shrink-0">
            
            {/* 1. LEGEND PANEL */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-2 mb-3">
                {t('map.legend')}
              </h4>
              <div className="flex flex-col gap-3 text-xs text-slate-300">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-900/40 border border-amber-600 flex items-center justify-center">
                    <Fan size={12} className="text-amber-400" />
                  </div>
                  <span>{t('map.fanPerRoom')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-yellow-400/20 border border-yellow-400 flex items-center justify-center">
                    <Lightbulb size={12} className="text-yellow-300" />
                  </div>
                  <span>{t('map.lightPerRoom')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-b-2 border-r-2 border-dashed border-slate-400 rounded-br-full" />
                  <span>{t('map.door')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-2 bg-sky-200 border border-sky-400 rounded-xs" />
                  <span>{t('map.window')}</span>
                </div>
              </div>
            </div>

            {/* 2. DEVICES SUMMARY PANEL */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-2 mb-3">
                {t('map.devicesSummary')}
              </h4>
              <ul className="flex flex-col gap-2 text-xs text-slate-300 list-disc list-inside">
                <li>{t('map.roomCount')}</li>
                <li>{t('map.fanCount')}</li>
                <li>{t('map.lightCount')}</li>
                <li className="font-semibold text-indigo-400">{t('map.totalFans')}</li>
                <li className="font-semibold text-yellow-400">{t('map.totalLights')}</li>
                <li className="font-bold text-white pt-1 border-t border-slate-800/80">{t('map.totalDevices')}</li>
              </ul>
            </div>

            {/* 3. ROOM USAGE PANEL */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-2 mb-3">
                {t('map.roomUsage')}
              </h4>
              <ul className="flex flex-col gap-2 text-xs text-slate-300 list-disc list-inside">
                <li>{t('map.drawingUsage')}</li>
                <li>{t('map.work1Usage')}</li>
                <li>{t('map.work2Usage')}</li>
              </ul>
            </div>

          </div>

        </div>
      )}


      {/* ──────────────────────────────────────────────────────────── */}
      {/* VIEW MODE 2: 3D ISOMETRIC VIEW WITH PERSPECTIVE SLIDERS      */}
      {/* ──────────────────────────────────────────────────────────── */}
      {viewMode === '3d' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* COLUMN 1 & 2: 3D Perspective Map and controls */}
          <div className="xl:col-span-2 flex flex-col gap-6">
            
            {/* 3D Map Visualization Container */}
            <div className="relative flex flex-col p-6 rounded-3xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-md overflow-hidden select-none">
              
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Activity size={18} className="text-emerald-400 animate-pulse" />
                    <span>Smart Occupancy Map (3D)</span>
                  </h3>
                  <p className="text-xs text-slate-400">Drag sliders to adjust viewpoint. Toggling occupancy triggers smart rules.</p>
                </div>
                
                <button
                  onClick={() => setIsAutoOrbit(!isAutoOrbit)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    isAutoOrbit
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {isAutoOrbit ? '🔄 Orbit ON' : '⏹ Orbit OFF'}
                </button>
              </div>

              {/* 3D Render Canvas */}
              <div 
                className="relative flex items-center justify-center min-h-[380px] bg-slate-950/80 border border-slate-900/50 rounded-2xl overflow-hidden p-6 shadow-inner"
                style={{ perspective: '1200px' }}
              >
                <div 
                  className="relative w-full max-w-[650px] aspect-[2/1] transition-transform duration-200 ease-out"
                  style={{
                    transform: `rotateX(${rotX}deg) rotateZ(${rotZ}deg) scale(${zoom})`,
                    transformStyle: 'preserve-3d'
                  }}
                >
                  {/* Floor Base Plate */}
                  <div className="absolute inset-0 rounded-2xl bg-slate-900 border-4 border-slate-800/80 shadow-2xl" />

                  {/* 3D Rooms Floor Plan Plate */}
                  <div className="absolute inset-0 grid grid-cols-3 border border-slate-800/60 rounded-2xl overflow-hidden" style={{ transformStyle: 'preserve-3d' }}>
                    
                    {/* DRAWING ROOM (Left) */}
                    <div 
                      className={`relative transition-all duration-500 overflow-hidden ${
                        roomOccupants.drawing > 0 ? 'bg-[#d2beaa] border-r-2 border-slate-800' : 'bg-[#d2beaa]/40 border-r-2 border-slate-800'
                      }`}
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      {roomOccupants.drawing > 0 && (
                        <div className="absolute inset-0 bg-emerald-500/10 mix-blend-overlay animate-pulse pointer-events-none" />
                      )}

                      {/* Animated Door */}
                      <motion.div
                        animate={{ rotateY: doorOpenStates.drawing ? 90 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute right-0 bottom-6 w-1 h-12 bg-amber-800 origin-top shadow-md z-30"
                      />

                      {/* Dome Occupancy Sensor */}
                      <div className="absolute right-2 bottom-12 w-4 h-4 rounded-full bg-slate-950 border border-slate-700/80 flex items-center justify-center z-30 shadow-md">
                        <div className={`w-2 h-2 rounded-full ${roomOccupants.drawing > 0 ? 'bg-indigo-400' : 'bg-slate-600'} transition-all`} />
                        {sensorPulses.drawing && (
                          <span className="absolute inset-0 rounded-full border border-indigo-400 animate-ping pointer-events-none" />
                        )}
                      </div>

                      {/* Couch sofa and sitting workers */}
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6.5 h-24 bg-[#9c8978] border border-[#736354] rounded-xs shadow-md flex items-center justify-center p-0.5">
                        <div className="absolute inset-0 flex flex-col justify-between p-0.5 opacity-40 pointer-events-none">
                          <div className="w-full h-5 border-b border-[#736354]" />
                          <div className="w-full h-5 border-b border-[#736354]" />
                        </div>
                        {roomOccupants.drawing > 0 && (
                          <div className="relative w-full h-full flex items-center justify-center">
                            {renderTopDownPerson(0)}
                          </div>
                        )}
                      </div>

                      <div className="absolute left-11 top-1/2 -translate-y-1/2 w-8 h-12 bg-[#c2b09b] border border-[#a89783] rounded-xs shadow-sm flex items-center justify-center">
                        <span className="text-[9px] text-[#736354] font-black uppercase opacity-20">Table</span>
                      </div>

                      {/* Floating Devices */}
                      <div className="absolute right-3 top-3" style={{ transform: 'translateZ(38px)', transformStyle: 'preserve-3d' }}>
                        {renderTopDownLight(getRoomDevices('drawing')[2] || { id: 'drawing-light-1', status: 'OFF' } as Device)}
                      </div>
                      <div className="absolute left-1/2 top-4 -translate-x-1/2" style={{ transform: 'translateZ(38px)', transformStyle: 'preserve-3d' }}>
                        {renderTopDownFan(getRoomDevices('drawing')[0] || { id: 'drawing-fan-1', status: 'OFF' } as Device)}
                      </div>
                      <div className="absolute right-3 bottom-3" style={{ transform: 'translateZ(38px)', transformStyle: 'preserve-3d' }}>
                        {renderTopDownLight(getRoomDevices('drawing')[3] || { id: 'drawing-light-2', status: 'OFF' } as Device)}
                      </div>
                    </div>

                    {/* WORK ROOM 1 (Middle) */}
                    <div 
                      className={`relative transition-all duration-500 overflow-hidden ${
                        roomOccupants.work1 > 0 ? 'bg-[#d5d8dc] border-r-2 border-slate-800' : 'bg-[#d5d8dc]/40 border-r-2 border-slate-800'
                      }`}
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      {roomOccupants.work1 > 0 && (
                        <div className="absolute inset-0 bg-emerald-500/10 mix-blend-overlay animate-pulse pointer-events-none" />
                      )}

                      {/* Animated Door */}
                      <motion.div
                        animate={{ rotateX: doorOpenStates.work1 ? -90 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute bottom-0 left-6 w-12 h-1 bg-amber-800 origin-left shadow-md z-30"
                      />

                      {/* Dome Occupancy Sensor */}
                      <div className="absolute left-14 bottom-2 w-4 h-4 rounded-full bg-slate-950 border border-slate-700/80 flex items-center justify-center z-30 shadow-md">
                        <div className={`w-2 h-2 rounded-full ${roomOccupants.work1 > 0 ? 'bg-indigo-400' : 'bg-slate-600'} transition-all`} />
                        {sensorPulses.work1 && (
                          <span className="absolute inset-0 rounded-full border border-indigo-400 animate-ping pointer-events-none" />
                        )}
                      </div>

                      {/* Desks Grid */}
                      <div className="absolute inset-x-4 top-16 bottom-16 grid grid-cols-2 gap-4">
                        {/* Desk 1 */}
                        <div className="relative bg-[#bda893] border border-[#968270] rounded-xs shadow-sm flex items-center justify-center">
                          <div className="flex flex-col items-center pointer-events-none opacity-40">
                            <div className="w-5 h-2 bg-slate-900 rounded-xs" />
                            <div className="w-4 h-3 bg-slate-800 rounded-full mt-0.5" />
                          </div>
                          {roomOccupants.work1 >= 1 && renderTopDownPerson(0)}
                        </div>
                        {/* Desk 2 */}
                        <div className="relative bg-[#bda893] border border-[#968270] rounded-xs shadow-sm flex items-center justify-center">
                          <div className="flex flex-col items-center pointer-events-none opacity-40">
                            <div className="w-5 h-2 bg-slate-900 rounded-xs" />
                            <div className="w-4 h-3 bg-slate-800 rounded-full mt-0.5" />
                          </div>
                        </div>
                        {/* Desk 3 */}
                        <div className="relative bg-[#bda893] border border-[#968270] rounded-xs shadow-sm flex items-center justify-center">
                          <div className="flex flex-col items-center pointer-events-none opacity-40">
                            <div className="w-5 h-2 bg-slate-900 rounded-xs" />
                            <div className="w-4 h-3 bg-slate-800 rounded-full mt-0.5" />
                          </div>
                          {roomOccupants.work1 >= 2 && renderTopDownPerson(0.4)}
                        </div>
                        {/* Desk 4 */}
                        <div className="relative bg-[#bda893] border border-[#968270] rounded-xs shadow-sm flex items-center justify-center">
                          <div className="flex flex-col items-center pointer-events-none opacity-40">
                            <div className="w-5 h-2 bg-slate-900 rounded-xs" />
                            <div className="w-4 h-3 bg-slate-800 rounded-full mt-0.5" />
                          </div>
                          {roomOccupants.work1 >= 3 && renderTopDownPerson(0.8)}
                        </div>
                      </div>

                      {/* Floating Devices */}
                      <div className="absolute left-4 top-4" style={{ transform: 'translateZ(38px)', transformStyle: 'preserve-3d' }}>
                        {renderTopDownFan(getRoomDevices('work1')[0] || { id: 'work1-fan-1', status: 'OFF' } as Device)}
                      </div>
                      <div className="absolute right-4 top-4" style={{ transform: 'translateZ(38px)', transformStyle: 'preserve-3d' }}>
                        {renderTopDownLight(getRoomDevices('work1')[2] || { id: 'work1-light-1', status: 'OFF' } as Device)}
                      </div>
                      <div className="absolute left-4 bottom-4" style={{ transform: 'translateZ(38px)', transformStyle: 'preserve-3d' }}>
                        {renderTopDownLight(getRoomDevices('work1')[3] || { id: 'work1-light-2', status: 'OFF' } as Device)}
                      </div>
                      <div className="absolute right-4 bottom-4" style={{ transform: 'translateZ(38px)', transformStyle: 'preserve-3d' }}>
                        {renderTopDownFan(getRoomDevices('work1')[1] || { id: 'work1-fan-2', status: 'OFF' } as Device)}
                      </div>
                    </div>

                    {/* WORK ROOM 2 (Right) */}
                    <div 
                      className={`relative transition-all duration-500 overflow-hidden ${
                        roomOccupants.work2 > 0 ? 'bg-[#cbb297]' : 'bg-[#cbb297]/40'
                      }`}
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      {roomOccupants.work2 > 0 && (
                        <div className="absolute inset-0 bg-emerald-500/10 mix-blend-overlay animate-pulse pointer-events-none" />
                      )}

                      {/* Animated Door */}
                      <motion.div
                        animate={{ rotateX: doorOpenStates.work2 ? -90 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute bottom-0 left-6 w-12 h-1 bg-amber-800 origin-left shadow-md z-30"
                      />

                      {/* Dome Occupancy Sensor */}
                      <div className="absolute left-14 bottom-2 w-4 h-4 rounded-full bg-slate-950 border border-slate-700/80 flex items-center justify-center z-30 shadow-md">
                        <div className={`w-2 h-2 rounded-full ${roomOccupants.work2 > 0 ? 'bg-indigo-400' : 'bg-slate-600'} transition-all`} />
                        {sensorPulses.work2 && (
                          <span className="absolute inset-0 rounded-full border border-indigo-400 animate-ping pointer-events-none" />
                        )}
                      </div>

                      {/* Desks Grid */}
                      <div className="absolute inset-x-4 top-16 bottom-16 grid grid-cols-2 gap-4">
                        {/* Desk 1 */}
                        <div className="relative bg-[#b09983] border border-[#8a7561] rounded-xs shadow-sm flex items-center justify-center">
                          <div className="flex flex-col items-center pointer-events-none opacity-40">
                            <div className="w-5 h-2 bg-slate-900 rounded-xs" />
                            <div className="w-4 h-3 bg-slate-800 rounded-full mt-0.5" />
                          </div>
                          {roomOccupants.work2 >= 1 && renderTopDownPerson(0.1)}
                        </div>
                        {/* Desk 2 */}
                        <div className="relative bg-[#b09983] border border-[#8a7561] rounded-xs shadow-sm flex items-center justify-center">
                          <div className="flex flex-col items-center pointer-events-none opacity-40">
                            <div className="w-5 h-2 bg-slate-900 rounded-xs" />
                            <div className="w-4 h-3 bg-slate-800 rounded-full mt-0.5" />
                          </div>
                        </div>
                        {/* Desk 3 */}
                        <div className="relative bg-[#b09983] border border-[#8a7561] rounded-xs shadow-sm flex items-center justify-center">
                          <div className="flex flex-col items-center pointer-events-none opacity-40">
                            <div className="w-5 h-2 bg-slate-900 rounded-xs" />
                            <div className="w-4 h-3 bg-slate-800 rounded-full mt-0.5" />
                          </div>
                          {roomOccupants.work2 >= 2 && renderTopDownPerson(0.3)}
                        </div>
                        {/* Desk 4 */}
                        <div className="relative bg-[#b09983] border border-[#8a7561] rounded-xs shadow-sm flex items-center justify-center">
                          <div className="flex flex-col items-center pointer-events-none opacity-40">
                            <div className="w-5 h-2 bg-slate-900 rounded-xs" />
                            <div className="w-4 h-3 bg-slate-800 rounded-full mt-0.5" />
                          </div>
                          {roomOccupants.work2 >= 3 && renderTopDownPerson(0.7)}
                        </div>
                      </div>

                      {/* Floating Devices */}
                      <div className="absolute left-4 top-4" style={{ transform: 'translateZ(38px)', transformStyle: 'preserve-3d' }}>
                        {renderTopDownFan(getRoomDevices('work2')[0] || { id: 'work2-fan-1', status: 'OFF' } as Device)}
                      </div>
                      <div className="absolute right-4 top-4" style={{ transform: 'translateZ(38px)', transformStyle: 'preserve-3d' }}>
                        {renderTopDownLight(getRoomDevices('work2')[2] || { id: 'work2-light-1', status: 'OFF' } as Device)}
                      </div>
                      <div className="absolute left-4 bottom-4" style={{ transform: 'translateZ(38px)', transformStyle: 'preserve-3d' }}>
                        {renderTopDownLight(getRoomDevices('work2')[3] || { id: 'work2-light-2', status: 'OFF' } as Device)}
                      </div>
                      <div className="absolute right-4 bottom-4" style={{ transform: 'translateZ(38px)', transformStyle: 'preserve-3d' }}>
                        {renderTopDownFan(getRoomDevices('work2')[1] || { id: 'work2-fan-2', status: 'OFF' } as Device)}
                      </div>
                    </div>

                  </div>

                </div>
              </div>

            </div>

            {/* Sliders Control Box */}
            <div className="p-5 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md">
              <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-300">
                <SlidersHorizontal size={14} className="text-indigo-400" />
                <span>{t('map.viewControls')}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400">Rotation Angle</span>
                    <span className="text-indigo-400 font-mono">{Math.round(rotZ)}°</span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={rotZ}
                    onChange={(e) => {
                      setIsAutoOrbit(false);
                      setRotZ(Number(e.target.value));
                    }}
                    className="w-full accent-indigo-500 bg-slate-800 rounded-lg h-2 cursor-pointer"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400">Tilt Angle</span>
                    <span className="text-indigo-400 font-mono">{Math.round(rotX)}°</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="85"
                    value={rotX}
                    onChange={(e) => {
                      setIsAutoOrbit(false);
                      setRotX(Number(e.target.value));
                    }}
                    className="w-full accent-indigo-500 bg-slate-800 rounded-lg h-2 cursor-pointer"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400">Zoom Level</span>
                    <span className="text-indigo-400 font-mono">{zoom.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.7"
                    max="1.3"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full accent-indigo-500 bg-slate-800 rounded-lg h-2 cursor-pointer"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* COLUMN 3: Analytics, Interactive Controls, and Live logs */}
          <div className="flex flex-col gap-6">

            {/* Simulation Controls Panel */}
            <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md flex flex-col gap-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Zap size={15} className="text-indigo-400" />
                <span>Simulation Panel</span>
              </h3>
              
              <div className="flex flex-col gap-3">
                {(['drawing', 'work1', 'work2'] as RoomId[]).map((roomId) => (
                  <div key={roomId} className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800/50 flex justify-between items-center">
                    <div>
                      <div className="text-xs font-bold text-white capitalize">{t(`room.${roomId}`)}</div>
                      <div className="text-[10px] text-slate-500 font-semibold">Occupants: {roomOccupants[roomId]} | Power: {getRoomPower(roomId)}W</div>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handlePersonExit(roomId)}
                        disabled={roomOccupants[roomId] <= 0}
                        className="p-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-rose-500/20"
                        title="Remove Person"
                      >
                        <UserMinus size={14} />
                      </button>
                      <button
                        onClick={() => handlePersonEnter(roomId)}
                        className="p-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg hover:bg-emerald-500/20"
                        title="Add Person"
                      >
                        <UserPlus size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-1">
                <button
                  onClick={handleRandomActivity}
                  className="py-2.5 px-3 bg-slate-800 border border-slate-700 text-slate-300 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 hover:bg-slate-700 hover:text-white"
                >
                  <Activity size={13} />
                  <span>Random Action</span>
                </button>
                <button
                  onClick={() => setIsAutoDemo(!isAutoDemo)}
                  className={`py-2.5 px-3 border font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all ${
                    isAutoDemo 
                      ? 'bg-emerald-600 border-emerald-500 text-white animate-pulse'
                      : 'bg-indigo-600/20 border-indigo-500/30 text-indigo-400 hover:bg-indigo-600/30'
                  }`}
                >
                  {isAutoDemo ? <Pause size={13} /> : <Play size={13} />}
                  <span>{isAutoDemo ? 'Auto Demo ON' : 'Start Auto Demo'}</span>
                </button>
              </div>

              <button
                onClick={handleResetSimulation}
                className="w-full py-2 bg-slate-800/40 border border-slate-800 text-slate-400 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 hover:bg-slate-800 hover:text-white"
              >
                <RotateCcw size={12} />
                <span>Reset Simulation</span>
              </button>
            </div>

            {/* Live Analytics Panel */}
            <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md flex flex-col gap-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp size={15} className="text-emerald-400" />
                <span>Live Metrics</span>
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-900/80">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Occupied Rooms</div>
                  <div className="text-xl font-black text-indigo-400 mt-1">
                    {Object.values(roomOccupants).filter(c => c > 0).length} <span className="text-[10px] text-slate-500 font-normal">/ 3</span>
                  </div>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-900/80">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Empty Rooms</div>
                  <div className="text-xl font-black text-slate-400 mt-1">
                    {Object.values(roomOccupants).filter(c => c === 0).length} <span className="text-[10px] text-slate-500 font-normal">/ 3</span>
                  </div>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-900/80">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Active Devices</div>
                  <div className="text-sm font-black text-white mt-1">
                    💡 {devices.filter(d => d.type === 'light' && d.status === 'ON').length} | 🌀 {devices.filter(d => d.type === 'fan' && d.status === 'ON').length}
                  </div>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-900/80">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Power Usage</div>
                  <div className="text-sm font-black text-white mt-1">
                    {powerState?.totalPowerDraw || 0} W
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <div className="text-[9px] text-emerald-500/80 font-bold uppercase tracking-wider">Energy Saved Today</div>
                  <div className="text-lg font-black text-emerald-400 mt-0.5">{energySavedAccumulated.toFixed(3)} kWh</div>
                  <div className="text-[9px] text-emerald-500/60 font-semibold mt-0.5">Est. Cost Saved: ${(energySavedAccumulated * 0.12).toFixed(2)}</div>
                </div>
                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <Coins size={18} />
                </div>
              </div>

              <div className="px-3 py-2 bg-indigo-500/5 rounded-xl border border-indigo-500/10 flex justify-between items-center text-[10px] font-semibold text-slate-400">
                <span>Auto-Shutdown Trigger Events</span>
                <span className="font-mono text-indigo-400 text-xs font-black">{autoShutdownEvents}</span>
              </div>
            </div>

            {/* Event Timeline Logs */}
            <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md flex flex-col gap-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Clock size={15} className="text-indigo-400" />
                <span>Event Timeline</span>
              </h3>
              
              <div className="h-[180px] overflow-y-auto pr-1 flex flex-col gap-2.5 select-none custom-scrollbar">
                {simulationLogs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-600 gap-1 my-6">
                    <Clock size={20} className="opacity-45" />
                    <span className="text-[10px] font-bold">No simulation logs yet</span>
                  </div>
                ) : (
                  simulationLogs.map((log) => (
                    <div key={log.id} className="text-[10px] leading-relaxed border-b border-slate-900 pb-2 last:border-0 last:pb-0">
                      <div className="flex justify-between font-bold text-slate-500 mb-0.5">
                        <span className="font-mono">{log.time}</span>
                        <span className="uppercase text-[9px] text-indigo-500">{t(`room.${log.room}`) || log.room}</span>
                      </div>
                      <p className={`font-semibold ${
                        log.type === 'shutdown' ? 'text-emerald-400' : log.type === 'enter' ? 'text-indigo-300' : 'text-slate-300'
                      }`}>
                        {log.text}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
