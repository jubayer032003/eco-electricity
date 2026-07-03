import { Device } from '../../types';

export interface CostBreakdowns {
  hourlyCost: number;
  todayCost: number;
  weeklyCost: number;
  monthlyCost: number;
  potentialSavings: number;
  byRoom: Record<string, number>;
  byType: Record<string, number>;
}

export class CostCalculator {
  calculateCosts(devices: Device[], kwhToday: number, rate = 12.39): CostBreakdowns {
    const activeDevices = devices.filter((d) => d.status === 'ON');

    // 1. Current hourly cost based on active load draw
    const currentPowerDraw = activeDevices.reduce((sum, d) => sum + d.powerDraw, 0);
    const hourlyCost = (currentPowerDraw / 1000) * rate;

    // 2. Today's cost based on cumulative kWh
    const todayCost = kwhToday * rate;

    // 3. Projected weekly and monthly costs (scaled logically)
    const weeklyCost = todayCost * 7;
    const monthlyCost = todayCost * 30;

    // 4. Room cost breakdown
    const byRoom: Record<string, number> = { drawing: 0, work1: 0, work2: 0 };
    for (const d of devices) {
      const kwhDevice = (d.runtimeToday / 3600) * (d.type === 'fan' ? 75 : 15) / 1000;
      byRoom[d.room] = (byRoom[d.room] || 0) + kwhDevice * rate;
    }

    // 5. Device Type cost breakdown
    const byType: Record<string, number> = { fan: 0, light: 0 };
    for (const d of devices) {
      const kwhDevice = (d.runtimeToday / 3600) * (d.type === 'fan' ? 75 : 15) / 1000;
      byType[d.type] = (byType[d.type] || 0) + kwhDevice * rate;
    }

    // 6. Potential savings: assume turning off 2 fans and 3 lights after office hours
    // Saving 2 fans (150W) and 3 lights (45W) * 8 hours = 1.56 kWh * rate = $0.23/day
    const potentialSavings = todayCost > 0 ? todayCost * 0.25 : 0; // 25% waste reduction savings projection

    return {
      hourlyCost,
      todayCost,
      weeklyCost,
      monthlyCost,
      potentialSavings,
      byRoom,
      byType
    };
  }
}
