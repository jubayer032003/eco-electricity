import { HistoryEntry } from './historyService';
import { Device } from '../../types';

export interface PeakAnalysisDetails {
  peakHour: string;
  peakPower: number;
  mostActiveRoom: string;
  mostActiveDevice: string;
  longestOnDurationDevice: string;
}

export class PeakAnalyzer {
  analyzePeaks(entries: HistoryEntry[], devices: Device[]): PeakAnalysisDetails {
    let peakPower = 0;
    let peakHour = '12:00 PM';
    let mostActiveRoom = 'None';
    let mostActiveDevice = 'None';
    let longestOnDurationDevice = 'None';

    // 1. Scan history for peak loads and hours
    if (entries.length > 0) {
      const peakEntry = entries.reduce((max, e) => (e.totalPower > max.totalPower ? e : max), entries[0]);
      peakPower = peakEntry.totalPower;

      // Extract hours from timestamp
      const date = new Date(peakEntry.timestamp);
      const hours = date.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHour = hours % 12 || 12;
      peakHour = `${displayHour}:00 ${ampm}`;

      // 2. Identify busiest room for this time range entries
      const roomTotals: Record<string, number> = { drawing: 0, work1: 0, work2: 0 };
      const roomLabels: Record<string, string> = {
        drawing: 'Drawing Room',
        work1: 'Work Room 1',
        work2: 'Work Room 2'
      };

      for (const e of entries) {
        if (e.roomPowers) {
          for (const [r, p] of Object.entries(e.roomPowers)) {
            roomTotals[r] = (roomTotals[r] || 0) + p;
          }
        }
      }

      const busiestRoomId = Object.keys(roomTotals).reduce((max, r) => (roomTotals[r] > roomTotals[max] ? r : max), 'drawing');
      mostActiveRoom = roomLabels[busiestRoomId] || 'Drawing Room';

      // 3. Identify highest consuming device for this time range entries
      const deviceOnCounts: Record<string, number> = {};
      for (const e of entries) {
        if (e.deviceStates) {
          for (const [id, status] of Object.entries(e.deviceStates)) {
            if (status === 'ON') {
              deviceOnCounts[id] = (deviceOnCounts[id] || 0) + 1;
            }
          }
        }
      }

      const topDeviceId = Object.keys(deviceOnCounts).reduce((max, id) => (deviceOnCounts[id] > (deviceOnCounts[max] || 0) ? id : max), '');
      const topDevice = devices.find((d) => d.id === topDeviceId);
      if (topDevice) {
        mostActiveDevice = topDevice.name;
      }
    }

    return {
      peakHour,
      peakPower,
      mostActiveRoom,
      mostActiveDevice,
      longestOnDurationDevice
    };
  }
}
