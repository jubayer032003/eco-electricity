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
