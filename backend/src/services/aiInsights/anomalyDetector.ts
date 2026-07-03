import { Device } from '../../types';

export interface Anomaly {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

export class AnomalyDetector {
  private loadHistory: number[] = [];
  private maxHistorySize = 15;

  detectAnomalies(devices: Device[], totalPowerDraw: number): Anomaly[] {
    const list: Anomaly[] = [];
    const nowStr = new Date().toISOString();

    // Add current power draw to history
    this.loadHistory.push(totalPowerDraw);
    if (this.loadHistory.length > this.maxHistorySize) {
      this.loadHistory.shift();
    }

    // 1. Spike detection: current load is 50% greater than historical average of previous ticks (min 5 points)
    if (this.loadHistory.length >= 5) {
      const prevLoads = this.loadHistory.slice(0, -1);
      const avgLoad = prevLoads.reduce((sum, v) => sum + v, 0) / prevLoads.length;
      if (totalPowerDraw > avgLoad * 1.5 && totalPowerDraw > 200) {
        list.push({
          id: `spike-${Date.now()}`,
          type: 'Load Spike',
          description: `Sudden load increase detected! Power jumped to ${totalPowerDraw}W (historical average is ${avgLoad.toFixed(0)}W).`,
          timestamp: nowStr
        });
      }
    }

    // 2. All-ON anomaly: 12 or more out of the 15 devices are ON simultaneously
    const activeCount = devices.filter((d) => d.status === 'ON').length;
    if (activeCount >= 12) {
      list.push({
        id: `all-on-${Date.now()}`,
        type: 'Peak Saturation',
        description: `High load saturation! ${activeCount} out of 15 devices are running simultaneously, risking grid trip.`,
        timestamp: nowStr
      });
    }

    // 3. Room Consumption Imbalance: One room's power is 2x higher than the average of other rooms
    const rooms = ['drawing', 'work1', 'work2'] as const;
    const roomPowers = rooms.map((roomId) => {
      const roomDevices = devices.filter((d) => d.room === roomId);
      const power = roomDevices.reduce((sum, d) => sum + (d.status === 'ON' ? d.powerDraw : 0), 0);
      return { roomId, power };
    });

    for (let i = 0; i < roomPowers.length; i++) {
      const current = roomPowers[i];
      const others = roomPowers.filter((_, idx) => idx !== i);
      const othersAvg = others.reduce((sum, r) => sum + r.power, 0) / others.length;

      const roomLabels: Record<string, string> = {
        drawing: 'Drawing Room',
        work1: 'Work Room 1',
        work2: 'Work Room 2'
      };

      if (current.power > othersAvg * 2.5 && current.power > 150) {
        list.push({
          id: `imbalance-${current.roomId}-${Date.now()}`,
          type: 'Imbalanced Load',
          description: `${roomLabels[current.roomId]} power draw (${current.power}W) is 2.5x greater than other rooms average (${othersAvg.toFixed(0)}W).`,
          timestamp: nowStr
        });
      }
    }

    // 4. Stuck Device detection: device active > 1.5 hours (5400s) while other devices in that room are OFF
    for (const roomId of rooms) {
      const roomDevices = devices.filter((d) => d.room === roomId);
      const activeDevices = roomDevices.filter((d) => d.status === 'ON');

      if (activeDevices.length === 1) {
        const singleDevice = activeDevices[0];
        const oneAndHalfHours = 5400; // seconds
        if (singleDevice.runtimeCurrentSession > oneAndHalfHours) {
          list.push({
            id: `stuck-${singleDevice.id}-${Date.now()}`,
            type: 'Stuck Appliance',
            description: `${singleDevice.name} left ON continuously for ${(singleDevice.runtimeCurrentSession / 3600).toFixed(1)} hours with zero surrounding room activity.`,
            timestamp: nowStr
          });
        }
      }
    }

    return list;
  }
}
