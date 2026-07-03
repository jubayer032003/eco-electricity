import { IDeviceRepository } from './device.repository';
import { PowerState, RoomId, RoomPowerSummary } from '../types';

export class PowerService {
  private accumulatedKwhToday = 0;

  constructor(private deviceRepo: IDeviceRepository) {}

  // Calculate live power draw and room summaries
  async getPowerState(): Promise<PowerState> {
    const devices = await this.deviceRepo.getAll();
    
    // Seed initial baseline accumulated energy if 0
    if (this.accumulatedKwhToday === 0 && devices.length > 0) {
      let baselineKwh = 0;
      devices.forEach((d) => {
        const wattage = d.type === 'fan' ? 75 : 15;
        baselineKwh += (d.runtimeToday / 3600) * (wattage / 1000);
      });
      this.accumulatedKwhToday = Math.max(1.85, baselineKwh);
    }
    
    let totalPowerDraw = 0;
    const roomSummaries: Record<RoomId, { active: number; total: number; power: number }> = {
      drawing: { active: 0, total: 0, power: 0 },
      work1: { active: 0, total: 0, power: 0 },
      work2: { active: 0, total: 0, power: 0 }
    };

    devices.forEach((device) => {
      const room = device.room;
      roomSummaries[room].total++;
      if (device.status === 'ON') {
        roomSummaries[room].active++;
        roomSummaries[room].power += device.powerDraw;
        totalPowerDraw += device.powerDraw;
      }
    });

    const rooms: RoomPowerSummary[] = (Object.keys(roomSummaries) as RoomId[]).map((roomId) => ({
      room: roomId,
      activeDevicesCount: roomSummaries[roomId].active,
      totalDevicesCount: roomSummaries[roomId].total,
      powerDraw: roomSummaries[roomId].power
    }));

    return {
      totalPowerDraw,
      estimatedKwhToday: this.accumulatedKwhToday,
      rooms,
      timestamp: new Date().toISOString()
    };
  }

  // Add power usage incrementally (to be called every second)
  async tickAccumulator(secondsElapsed = 1): Promise<number> {
    const state = await this.getPowerState();
    // kWh = (Watts / 1000) * (hours)
    // hours = seconds / 3600
    const deltaKwh = (state.totalPowerDraw / 1000) * (secondsElapsed / 3600);
    this.accumulatedKwhToday += deltaKwh;
    return this.accumulatedKwhToday;
  }

  resetAccumulatedEnergy() {
    this.accumulatedKwhToday = 0;
  }

  getAccumulatedEnergy(): number {
    return this.accumulatedKwhToday;
  }
}
