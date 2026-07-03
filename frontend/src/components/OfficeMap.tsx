import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useLanguage } from '../context/LanguageContext';
import { Fan, Lightbulb, Power, Layers, ArrowUp, Compass, SlidersHorizontal, Play, Pause, RotateCcw, Zap } from 'lucide-react';
import type { RoomId, Device } from '../types';
import { motion } from 'framer-motion';

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
    fetch('http://localhost:5000/automation/status')
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
                    {renderTopDownLight(getRoomDevices('drawing')[1] || { id: 'drawing-light-1', status: 'OFF' } as Device)}
                    {renderTopDownFan(getRoomDevices('drawing')[0] || { id: 'drawing-fan-1', status: 'OFF' } as Device)}
                    {renderTopDownLight(getRoomDevices('drawing')[2] || { id: 'drawing-light-2', status: 'OFF' } as Device)}
                  </div>

                  {/* Room Name Header */}
                  <div className="text-center font-black text-xs uppercase tracking-widest my-2 text-slate-800 z-10">
                    {t('room.drawing')}
                  </div>

                  {/* Furnishings: Sofa, Coffee Table, Rug, Armchair */}
                  <div className="relative my-2 flex items-center justify-between">
                    {/* Sofa Couch along left wall */}
                    <div className="w-7 h-28 bg-[#9c8978] border-2 border-[#736354] rounded-sm shadow-sm flex flex-col justify-between p-0.5">
                      <div className="w-full h-6 border-b border-[#736354]" />
                      <div className="w-full h-6 border-b border-[#736354]" />
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
                    {renderTopDownLight(getRoomDevices('drawing')[3] || { id: 'drawing-light-3', status: 'OFF' } as Device)}
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
                    {renderTopDownLight(getRoomDevices('work1')[1] || { id: 'work1-light-1', status: 'OFF' } as Device)}
                    {renderTopDownFan(getRoomDevices('work1')[0] || { id: 'work1-fan-1', status: 'OFF' } as Device)}
                    {renderTopDownLight(getRoomDevices('work1')[2] || { id: 'work1-light-2', status: 'OFF' } as Device)}
                  </div>

                  {/* Workstation Desks Grid (4 Employees) */}
                  <div className="grid grid-cols-2 gap-4 my-2 z-10">
                    {/* Desk 1 */}
                    <div className="bg-[#bda893] border border-[#968270] p-1.5 rounded shadow-sm flex flex-col items-center">
                      <div className="w-5 h-3 bg-slate-900 rounded-xs border border-slate-700" />
                      <div className="w-4 h-3 bg-slate-800 rounded-full mt-1" />
                    </div>
                    {/* Desk 2 */}
                    <div className="bg-[#bda893] border border-[#968270] p-1.5 rounded shadow-sm flex flex-col items-center">
                      <div className="w-5 h-3 bg-slate-900 rounded-xs border border-slate-700" />
                      <div className="w-4 h-3 bg-slate-800 rounded-full mt-1" />
                    </div>
                  </div>

                  {/* Room Name Header */}
                  <div className="text-center font-black text-xs uppercase tracking-widest my-1 text-slate-800 z-10">
                    {t('room.work1')}
                  </div>

                  {/* Workstation Desks Bottom Grid */}
                  <div className="grid grid-cols-2 gap-4 my-2 z-10">
                    {/* Desk 3 */}
                    <div className="bg-[#bda893] border border-[#968270] p-1.5 rounded shadow-sm flex flex-col items-center">
                      <div className="w-5 h-3 bg-slate-900 rounded-xs border border-slate-700" />
                      <div className="w-4 h-3 bg-slate-800 rounded-full mt-1" />
                    </div>
                    {/* Desk 4 */}
                    <div className="bg-[#bda893] border border-[#968270] p-1.5 rounded shadow-sm flex flex-col items-center">
                      <div className="w-5 h-3 bg-slate-900 rounded-xs border border-slate-700" />
                      <div className="w-4 h-3 bg-slate-800 rounded-full mt-1" />
                    </div>
                  </div>

                  {/* Bottom Fan & Light */}
                  <div className="flex justify-between items-center z-10 mt-2">
                    <div className="w-6 h-6" />
                    {renderTopDownFan(getRoomDevices('work1')[1] || { id: 'work1-fan-2', status: 'OFF' } as Device)}
                    {renderTopDownLight(getRoomDevices('work1')[3] || { id: 'work1-light-3', status: 'OFF' } as Device)}
                  </div>

                  {/* Door Swing Arc */}
                  <div className="absolute bottom-0 left-4 w-8 h-8 border-l border-b border-dashed border-slate-600 rounded-bl-full pointer-events-none" />
                  <div className="absolute bottom-0 left-4 w-8 h-1 bg-amber-800 border border-amber-900" />
                </div>


                {/* ── WORK ROOM 2 (Right) ── */}
                <div className="relative p-4 min-h-[300px] bg-[#cbb297] text-slate-900 flex flex-col justify-between overflow-hidden">
                  {/* Top Lights & Fan */}
                  <div className="flex justify-between items-center z-10">
                    {renderTopDownLight(getRoomDevices('work2')[1] || { id: 'work2-light-1', status: 'OFF' } as Device)}
                    {renderTopDownFan(getRoomDevices('work2')[0] || { id: 'work2-fan-1', status: 'OFF' } as Device)}
                    {renderTopDownLight(getRoomDevices('work2')[2] || { id: 'work2-light-2', status: 'OFF' } as Device)}
                  </div>

                  {/* Workstation Desks Top Grid (4 Employees) */}
                  <div className="grid grid-cols-2 gap-4 my-2 z-10">
                    {/* Desk 1 */}
                    <div className="bg-[#b09983] border border-[#8a7561] p-1.5 rounded shadow-sm flex flex-col items-center">
                      <div className="w-5 h-3 bg-slate-900 rounded-xs border border-slate-700" />
                      <div className="w-4 h-3 bg-slate-800 rounded-full mt-1" />
                    </div>
                    {/* Desk 2 */}
                    <div className="bg-[#b09983] border border-[#8a7561] p-1.5 rounded shadow-sm flex flex-col items-center">
                      <div className="w-5 h-3 bg-slate-900 rounded-xs border border-slate-700" />
                      <div className="w-4 h-3 bg-slate-800 rounded-full mt-1" />
                    </div>
                  </div>

                  {/* Room Name Header */}
                  <div className="text-center font-black text-xs uppercase tracking-widest my-1 text-slate-800 z-10">
                    {t('room.work2')}
                  </div>

                  {/* Workstation Desks Bottom Grid */}
                  <div className="grid grid-cols-2 gap-4 my-2 z-10">
                    {/* Desk 3 */}
                    <div className="bg-[#b09983] border border-[#8a7561] p-1.5 rounded shadow-sm flex flex-col items-center">
                      <div className="w-5 h-3 bg-slate-900 rounded-xs border border-slate-700" />
                      <div className="w-4 h-3 bg-slate-800 rounded-full mt-1" />
                    </div>
                    {/* Desk 4 */}
                    <div className="bg-[#b09983] border border-[#8a7561] p-1.5 rounded shadow-sm flex flex-col items-center">
                      <div className="w-5 h-3 bg-slate-900 rounded-xs border border-slate-700" />
                      <div className="w-4 h-3 bg-slate-800 rounded-full mt-1" />
                    </div>
                  </div>

                  {/* Bottom Fan & Light */}
                  <div className="flex justify-between items-center z-10 mt-2">
                    <div className="w-6 h-6" />
                    {renderTopDownFan(getRoomDevices('work2')[1] || { id: 'work2-fan-2', status: 'OFF' } as Device)}
                    {renderTopDownLight(getRoomDevices('work2')[3] || { id: 'work2-light-3', status: 'OFF' } as Device)}
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
        <>
          {/* 3D Perspective Sliders Toolbar */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 mb-6 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-300">
              <SlidersHorizontal size={14} className="text-indigo-400" />
              <span>{t('map.viewControls')}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Rotation Z Slider */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[11px] font-semibold">
                  <span className="text-slate-400">{t('map.rotation')}</span>
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
                  className="w-full accent-indigo-500 bg-slate-800 rounded-lg h-1.5 cursor-pointer"
                />
              </div>

              {/* Tilt X Slider */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[11px] font-semibold">
                  <span className="text-slate-400">{t('map.tilt')}</span>
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
                  className="w-full accent-indigo-500 bg-slate-800 rounded-lg h-1.5 cursor-pointer"
                />
              </div>

              {/* Zoom Slider */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[11px] font-semibold">
                  <span className="text-slate-400">{t('map.zoom')}</span>
                  <span className="text-indigo-400 font-mono">{zoom.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="1.3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-indigo-500 bg-slate-800 rounded-lg h-1.5 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* 3D Rooms Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {(['drawing', 'work1', 'work2'] as RoomId[]).map((roomId) => {
              const roomDevices = getRoomDevices(roomId);
              const roomPower = getRoomPower(roomId);
              const activeCount = roomDevices.filter((d) => d.status === 'ON').length;
              const totalCount = roomDevices.length;
              const isAnyActive = activeCount > 0;
              const isOccupied = occupancy[roomId] || false;
              const fans = roomDevices.filter((d) => d.type === 'fan');
              const lights = roomDevices.filter((d) => d.type === 'light');

              return (
                <motion.div
                  key={roomId}
                  whileHover={{ y: -6 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className={`relative flex flex-col p-6 rounded-3xl border transition-all duration-500 overflow-hidden ${
                    isAnyActive
                      ? 'bg-slate-900/85 border-indigo-500/40 shadow-2xl shadow-indigo-500/10'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                  }`}
                  style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
                >
                  <div className="flex justify-between items-start mb-5 relative z-10">
                    <div>
                      <h4 className="text-sm font-bold text-white tracking-wide">{t(`room.${roomId}`)}</h4>
                      <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">
                        {activeCount} / {totalCount} {t('office.devicesOn')} • {isOccupied ? '👤 Occupied' : '🚫 Empty'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 border px-2.5 py-1 rounded-lg text-xs font-black text-indigo-400 bg-indigo-950/60 border-indigo-500/40">
                      <Power size={11} className={isAnyActive ? 'animate-pulse' : ''} />
                      <span>{roomPower}{t('common.watts')}</span>
                    </div>
                  </div>

                  <div 
                    className="relative flex items-center justify-center min-h-[270px] bg-slate-950/80 border border-slate-900 rounded-2xl overflow-hidden p-4 select-none"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <div 
                      className="relative w-full max-w-[210px] aspect-square transition-transform duration-200 ease-out"
                      style={{
                        transform: `rotateX(${rotX}deg) rotateZ(${rotZ}deg) scale(${zoom})`,
                        transformStyle: 'preserve-3d'
                      }}
                    >
                      <div className={`absolute inset-0 rounded-2xl border ${isAnyActive ? 'bg-indigo-600/10 border-indigo-500/40' : 'bg-slate-800/10 border-slate-800'}`} />
                      
                      {/* Floating Fans */}
                      <div className="absolute left-4 top-4 flex flex-col gap-4" style={{ transform: 'translateZ(38px)', transformStyle: 'preserve-3d' }}>
                        {fans.map((fan) => (
                          <button
                            key={fan.id}
                            onClick={() => toggleDevice(fan.id, fan.status)}
                            className={`p-2.5 rounded-xl border transition-all ${fan.status === 'ON' ? 'bg-sky-500/25 text-sky-400 border-sky-400' : 'bg-slate-900 text-slate-500 border-slate-800'}`}
                          >
                            <Fan size={16} className={fan.status === 'ON' ? 'fan-spinning text-sky-400' : ''} />
                          </button>
                        ))}
                      </div>

                      {/* Floating Lights */}
                      <div className="absolute right-4 top-4 flex flex-col gap-4" style={{ transform: 'translateZ(38px)', transformStyle: 'preserve-3d' }}>
                        {lights.map((light) => (
                          <button
                            key={light.id}
                            onClick={() => toggleDevice(light.id, light.status)}
                            className={`p-2.5 rounded-xl border transition-all ${light.status === 'ON' ? 'bg-yellow-500/25 text-yellow-400 border-yellow-400 light-glowing' : 'bg-slate-900 text-slate-500 border-slate-800'}`}
                          >
                            <Lightbulb size={16} className={light.status === 'ON' ? 'text-yellow-300' : ''} />
                          </button>
                        ))}
                      </div>

                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

    </div>
  );
};
