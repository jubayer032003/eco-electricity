import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Device, PowerState, Alert, InitialState, AIInsights } from '../types';

interface SocketContextProps {
  socket: Socket | null;
  devices: Device[];
  powerState: PowerState | null;
  alerts: Alert[];
  simulationRunning: boolean;
  simulationSpeed: number;
  loading: boolean;
  error: string | null;
  toggleDevice: (id: string, currentStatus: 'ON' | 'OFF') => Promise<void>;
  toggleSimulation: () => Promise<void>;
  resetSimulation: () => Promise<void>;
  resolveAlert: (id: string) => Promise<void>;
  triggerDemoMode: () => Promise<void>;
  aiInsights: AIInsights | null;
}

const SocketContext = createContext<SocketContextProps | undefined>(undefined);

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [powerState, setPowerState] = useState<PowerState | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [simulationRunning, setSimulationRunning] = useState<boolean>(false);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);

  useEffect(() => {
    const newSocket = io(BACKEND_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setError(null);
      
      // Fetch initial AI insights
      fetch(`${BACKEND_URL}/ai-insights`)
        .then((res) => res.json())
        .then((data) => setAiInsights(data))
        .catch((err) => console.error('Failed to fetch initial AI insights:', err));
    });

    newSocket.on('connect_error', () => {
      setError('Connection failed. Is the backend running?');
      setLoading(false);
    });

    newSocket.on('initialState', (state: InitialState) => {
      setDevices(state.devices);
      setPowerState(state.powerState);
      setAlerts(state.alerts);
      setSimulationRunning(state.simulation.running);
      setSimulationSpeed(state.simulation.speedMultiplier);
      setLoading(false);
    });

    newSocket.on('aiInsightsUpdated', (insights: AIInsights) => {
      setAiInsights(insights);
    });

    newSocket.on('deviceUpdated', (updatedDevice: Device) => {
      setDevices((prev) =>
        prev.map((d) => (d.id === updatedDevice.id ? updatedDevice : d))
      );
    });

    newSocket.on('powerUpdated', (updatedPower: PowerState) => {
      setPowerState(updatedPower);
    });

    newSocket.on('roomUpdated', (updatedRooms) => {
      setPowerState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          rooms: updatedRooms
        };
      });
    });

    newSocket.on('alertCreated', (newAlert: Alert) => {
      setAlerts((prev) => [newAlert, ...prev]);
    });

    newSocket.on('simulationStarted', (data) => {
      setSimulationRunning(data.running);
    });

    newSocket.on('simulationStopped', (data) => {
      setSimulationRunning(data.running);
    });

    newSocket.on('simulationReset', (resetDevices: Device[]) => {
      setDevices(resetDevices);
      setAlerts([]);
      setAiInsights(null);
      setPowerState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          totalPowerDraw: 0,
          estimatedKwhToday: 0,
          rooms: prev.rooms.map((r) => ({ ...r, activeDevicesCount: 0, powerDraw: 0 }))
        };
      });
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const toggleDevice = async (id: string, currentStatus: 'ON' | 'OFF') => {
    const targetStatus = currentStatus === 'ON' ? 'OFF' : 'ON';
    try {
      await fetch(`${BACKEND_URL}/devices/${id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus })
      });
    } catch (err) {
      console.error('Failed to toggle device:', err);
    }
  };

  const toggleSimulation = async () => {
    const endpoint = simulationRunning ? 'stop' : 'start';
    try {
      await fetch(`${BACKEND_URL}/simulation/${endpoint}`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to toggle simulation:', err);
    }
  };

  const resetSimulation = async () => {
    try {
      await fetch(`${BACKEND_URL}/simulation/reset`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to reset simulation:', err);
    }
  };

  const triggerDemoMode = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/simulation/demo`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setSimulationRunning(data.running);
        setSimulationSpeed(data.speedMultiplier);
      }
    } catch (err) {
      console.error('Failed to trigger demo: ', err);
    }
  };

  const resolveAlert = async (id: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/alerts/${id}/resolve`, { method: 'POST' });
      if (res.ok) {
        const resolvedAlert = await res.json();
        setAlerts((prev) =>
          prev.map((a) => (a.id === id ? resolvedAlert : a))
        );
      }
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        devices,
        powerState,
        alerts,
        simulationRunning,
        simulationSpeed,
        loading,
        error,
        toggleDevice,
        toggleSimulation,
        resetSimulation,
        resolveAlert,
        triggerDemoMode,
        aiInsights
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
