import { Device } from '../../types';

export interface Recommendation {
  id: string;
  title: string;
  savings: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
}

export class RecommendationEngine {
  generateRecommendations(devices: Device[], totalPowerDraw: number): Recommendation[] {
    const list: Recommendation[] = [];
    const currentHour = new Date().getHours();
    const isAfterHours = currentHour < 9 || currentHour >= 17;

    const activeDevices = devices.filter((d) => d.status === 'ON');

    // 1. Eco Mode Recommendation
    if (totalPowerDraw > 500) {
      list.push({
        id: 'eco-mode',
        title: 'Consider enabling building Eco Mode',
        savings: '0.65 kWh / day',
        priority: 'HIGH',
        reason: `Total office load is high (${totalPowerDraw}W). Enabling Eco Mode dims auxiliary lights and optimizes fan runtimes.`
      });
    }

    // 2. Room specific after-hours cooling / lighting recommendations
    const rooms = ['drawing', 'work1', 'work2'] as const;
    const roomLabels: Record<string, string> = {
      drawing: 'Drawing Room',
      work1: 'Work Room 1',
      work2: 'Work Room 2'
    };

    for (const roomId of rooms) {
      const roomDevices = activeDevices.filter((d) => d.room === roomId);
      const activeFans = roomDevices.filter((d) => d.type === 'fan');
      const activeLights = roomDevices.filter((d) => d.type === 'light');

      if (isAfterHours) {
        if (activeLights.length > 0) {
          const estSavings = (activeLights.length * 15 * 8) / 1000; // 15W * 8 after-hours hours
          list.push({
            id: `light-off-${roomId}`,
            title: `Turn off lights in empty ${roomLabels[roomId]}`,
            savings: `${estSavings.toFixed(2)} kWh / night`,
            priority: 'HIGH',
            reason: `${activeLights.length} lights are active after 5 PM in an empty ${roomLabels[roomId]}.`
          });
        }
        if (activeFans.length > 0) {
          const estSavings = (activeFans.length * 75 * 8) / 1000; // 75W * 8 after-hours hours
          list.push({
            id: `fan-off-${roomId}`,
            title: `Turn off fans in empty ${roomLabels[roomId]}`,
            savings: `${estSavings.toFixed(2)} kWh / night`,
            priority: 'HIGH',
            reason: `${activeFans.length} fans are left running after office hours in ${roomLabels[roomId]}.`
          });
        }
      } else {
        // Daytime checks
        // Suggest fan check if running continuously > 2 hours
        const longRunningFans = activeFans.filter((d) => d.runtimeCurrentSession > 7200);
        if (longRunningFans.length > 0) {
          list.push({
            id: `fan-runtime-${roomId}`,
            title: `Check fans runtime in ${roomLabels[roomId]}`,
            savings: '0.45 kWh / day',
            priority: 'MEDIUM',
            reason: `${longRunningFans.length} fans have been running continuously for over 2 hours during office hours.`
          });
        }
      }
    }

    // 3. Fallback standard recommendations if list is empty
    if (list.length === 0) {
      list.push({
        id: 'standard-eco',
        title: 'Optimal building setup active',
        savings: '0.00 kWh / day',
        priority: 'LOW',
        reason: 'All rooms are behaving within safe load limits and office hour guidelines.'
      });
      list.push({
        id: 'standard-led',
        title: 'Retrofit standard bulbs to LEDs',
        savings: '1.20 kWh / day',
        priority: 'LOW',
        reason: 'Upgrading older high-voltage lighting grids to smart low-power LEDs can decrease baseline draw by 40%.'
      });
    }

    // Sort: HIGH priority first, then MEDIUM, then LOW
    const priorityWeights = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    return list.sort((a, b) => priorityWeights[b.priority] - priorityWeights[a.priority]);
  }
}
