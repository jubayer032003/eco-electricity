import React from 'react';
import { useSocket } from '../context/SocketContext';
import { Play, Pause, RotateCcw, Zap } from 'lucide-react';

export const SimulationControl: React.FC = () => {
  const { simulationRunning, simulationSpeed, toggleSimulation, resetSimulation, triggerDemoMode } = useSocket();

  const isDemoActive = simulationSpeed === 30 && simulationRunning;

  return (
    <div className="p-5 glass-panel rounded-2xl mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div>
        <h3 className="text-md font-bold text-white flex items-center gap-2">
          <span>Simulation Console</span>
          <span className="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-400 rounded-md font-semibold border border-slate-700">
            {simulationSpeed}x Speed
          </span>
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Toggles device states randomly every 10–30s of simulated time
        </p>
      </div>

      <div className="flex gap-2 w-full sm:w-auto">
        <button
          onClick={toggleSimulation}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border transition-all duration-300 ${
            simulationRunning
              ? 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border-amber-500/30 hover:border-amber-500/50'
              : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/30 hover:border-emerald-500/50'
          }`}
        >
          {simulationRunning ? (
            <>
              <Pause size={14} /> Pause
            </>
          ) : (
            <>
              <Play size={14} /> Start
            </>
          )}
        </button>

        <button
          onClick={resetSimulation}
          className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 hover:border-rose-500/50 transition-all duration-300"
        >
          <RotateCcw size={14} /> Reset
        </button>

        <button
          onClick={triggerDemoMode}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-lg border transition-all duration-500 relative overflow-hidden ${
            isDemoActive
              ? 'bg-indigo-600/30 text-indigo-200 border-indigo-400/50 shadow-lg shadow-indigo-500/25 scale-[1.03]'
              : 'bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 border-indigo-500/20 hover:border-indigo-500/50'
          }`}
        >
          {isDemoActive && (
            <span className="absolute inset-0 bg-indigo-500/10 animate-pulse pointer-events-none" />
          )}
          <Zap size={14} className={isDemoActive ? 'animate-bounce text-indigo-400' : ''} />
          <span>Demo Mode</span>
        </button>
      </div>
    </div>
  );
};
