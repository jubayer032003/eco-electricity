export type RoomId = 'drawing' | 'work1' | 'work2';
export type DeviceType = 'fan' | 'light';
export type DeviceStatus = 'ON' | 'OFF';

export interface Device {
  id: string;
  name: string;
  room: RoomId;
  type: DeviceType;
  status: DeviceStatus;
  powerDraw: number; // Watts
  lastChanged: string; // ISO string
  runtimeToday: number; // Seconds
  runtimeCurrentSession: number; // Seconds
}

export interface RoomPowerSummary {
  room: RoomId;
  activeDevicesCount: number;
  totalDevicesCount: number;
  powerDraw: number; // Watts
}

export interface PowerState {
  totalPowerDraw: number; // Watts
  estimatedKwhToday: number; // kWh
  rooms: RoomPowerSummary[];
  timestamp: string;
}

export interface Alert {
  id: string;
  deviceId?: string;
  roomId?: RoomId;
  type: 'AFTER_HOURS' | 'OVERTIME' | 'HIGH_POWER';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  timestamp: string;
  resolved: boolean;
}

export interface InitialState {
  devices: Device[];
  powerState: PowerState;
  alerts: Alert[];
  simulation: {
    running: boolean;
    speedMultiplier: number;
  };
}

export interface Recommendation {
  id: string;
  title: string;
  savings: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
}

export interface Anomaly {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

export interface AIInsights {
  summary: string;
  efficiencyScore: number;
  efficiencyGrade: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  efficiencyColor: string;
  recommendations: Recommendation[];
  anomalies: Anomaly[];
  cards: {
    officeHealth: string;
    mostActiveRoom: string;
    highestPowerDevice: string;
    estimatedDailyCost: number;
  };
  trendAnalysis: {
    status: 'INCREASING' | 'DECREASING' | 'STABLE';
    peakUsageTime: string;
    averageHourlyUsage: number;
    highestConsumingRoom: string;
  };
}
