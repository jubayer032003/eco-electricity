import { Device } from '../../types';
import { HistoryEntry } from './historyService';

export interface DeviceUptimeStats {
  deviceId: string;
  deviceName: string;
  room: string;
  type: string;
  uptimePercent: number;
  totalOnTime: number; // Seconds
  totalOffTime: number; // Seconds
  longestOnDuration: number; // Seconds
  stateChangesCount: number;
  avgDailyRuntime: number; // Seconds
}

export class UptimeCalculator {
  calculateUptime(devices: Device[], history: HistoryEntry[]): DeviceUptimeStats[] {
    const list: DeviceUptimeStats[] = [];

    // Map to track state changes from history transitions
    const stateChangesMap: Record<string, number> = {};
    const longestOnMap: Record<string, number> = {};
    const currentOnStartMap: Record<string, number> = {};

    // 1. Scan history transitions in chronological order to calculate flips & runtimes
    for (let i = 0; i < history.length; i++) {
      const entry = history[i];
      const prevEntry = i > 0 ? history[i - 1] : null;

      for (const devId in entry.deviceStates) {
        const state = entry.deviceStates[devId];
        const prev = prevEntry ? prevEntry.deviceStates[devId] : null;

        // Count toggles
        if (prev && prev !== state) {
          stateChangesMap[devId] = (stateChangesMap[devId] || 0) + 1;
        }

        // Track longest continuous ON sessions
        const entryTime = new Date(entry.timestamp).getTime();
        if (state === 'ON') {
          if (!currentOnStartMap[devId]) {
            currentOnStartMap[devId] = entryTime;
          }
          const duration = Math.round((entryTime - currentOnStartMap[devId]) / 1000);
          longestOnMap[devId] = Math.max(longestOnMap[devId] || 0, duration);
        } else {
          currentOnStartMap[devId] = 0;
        }
      }
    }

    // 2. Build final statistics per device
    for (const d of devices) {
      const totalOnTime = d.runtimeToday;
      // Assume a 24-hour baseline (or time elapsed since simulation start)
      // Capping uptime % at 100%
      const totalOffTime = Math.max(0, 86400 - totalOnTime);
      const uptimePercent = Math.min(100, Number(((totalOnTime / 86400) * 100).toFixed(1)));

      list.push({
        deviceId: d.id,
        deviceName: d.name,
        room: d.room,
        type: d.type,
        uptimePercent,
        totalOnTime,
        totalOffTime,
        longestOnDuration: Math.max(longestOnMap[d.id] || 0, d.runtimeCurrentSession),
        stateChangesCount: stateChangesMap[d.id] || 0,
        avgDailyRuntime: totalOnTime
      });
    }

    return list;
  }
}
