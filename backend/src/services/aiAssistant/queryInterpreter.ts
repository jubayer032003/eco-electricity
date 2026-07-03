import { TelemetryContext } from './analyticsConnector';

export class QueryInterpreter {
  interpretQuery(query: string, context: TelemetryContext): string {
    const q = query.toLowerCase().trim();

    const activeDevices = context.devices.filter((d) => d.status === 'ON');
    const activeFans = activeDevices.filter((d) => d.type === 'fan');
    const activeLights = activeDevices.filter((d) => d.type === 'light');
    const unresolvedAlerts = context.alerts.filter((a) => !a.resolved);

    // 1. Room specific query check
    if (q.includes('room') && (q.includes('most') || q.includes('highest') || q.includes('power') || q.includes('energy'))) {
      const roomPowers = context.powerState.rooms;
      const maxRoom = roomPowers.reduce((max, r) => (r.powerDraw > max.powerDraw ? r : max), roomPowers[0]);
      
      const roomLabels: Record<string, string> = {
        drawing: 'Drawing Room',
        work1: 'Work Room 1',
        work2: 'Work Room 2'
      };

      if (maxRoom.powerDraw === 0) {
        return 'No rooms are currently consuming power; the office is idle.';
      }
      return `The highest power consumption is currently in the ${roomLabels[maxRoom.room]} drawing ${maxRoom.powerDraw}W, with ${maxRoom.activeDevicesCount} devices active.`;
    }

    // 2. Alert check
    if (q.includes('alert') || q.includes('warning') || q.includes('critical')) {
      if (unresolvedAlerts.length === 0) {
        return 'All clear! There are currently no active alerts in the office.';
      }
      return `There are currently ${unresolvedAlerts.length} unresolved alerts: ${unresolvedAlerts.map((a) => a.message).join('; ')}.`;
    }

    // 3. Lights count check
    if (q.includes('light')) {
      if (activeLights.length === 0) {
        return 'All office lights are currently turned off.';
      }
      return `There are currently ${activeLights.length} lights turned ON: ${activeLights.map((d) => d.name).join(', ')}.`;
    }

    // 4. Fans count check
    if (q.includes('fan')) {
      if (activeFans.length === 0) {
        return 'All fans are currently switched off.';
      }
      return `There are currently ${activeFans.length} fans active: ${activeFans.map((d) => d.name).join(', ')}.`;
    }

    // 5. Cost query check
    if (q.includes('cost') || q.includes('price') || q.includes('money') || q.includes('expense') || q.includes('taka') || q.includes('bdt')) {
      return `Today's accumulated energy cost is ৳${context.estimatedDailyCost.toFixed(2)} (Tk ${context.estimatedDailyCost.toFixed(2)}) based on ${context.powerState.estimatedKwhToday.toFixed(3)} kWh consumed (at Bangladesh commercial rate Tk 12.39/kWh), with a current hourly draw cost of ৳${((context.powerState.totalPowerDraw / 1000) * 12.39).toFixed(2)}/hour.`;
    }

    // 6. Efficiency score check
    if (q.includes('efficient') || q.includes('score') || q.includes('grade') || q.includes('rating')) {
      return `The office's current Energy Efficiency rating is ${context.efficiencyScore}/100, which qualifies for a "${context.efficiencyGrade}" grade.`;
    }

    // 7. General summary check
    if (q.includes('summary') || q.includes('status') || q.includes('how is') || q.includes('operating')) {
      return `The office is drawing a total of ${context.powerState.totalPowerDraw}W right now. We have ${activeDevices.length} active devices running (${activeFans.length} fans, ${activeLights.length} lights) with an energy efficiency score of ${context.efficiencyScore}/100.`;
    }

    // 8. Recommendation check
    if (q.includes('save') || q.includes('reduce') || q.includes('recommend') || q.includes('eco')) {
      const activeFansCount = activeDevices.filter((d) => d.type === 'fan').length;
      return `Here are some recommendations: 
1. Dim auxiliary office lighting (saves 15W per light).
2. Ensure all ${activeFansCount} active fans are turned OFF when employees depart.
3. Keep the office in standard Eco mode to lock in baseline draw metrics.`;
    }

    // 9. Standard default reply
    return `The office is currently drawing a total of ${context.powerState.totalPowerDraw}W with ${activeDevices.length} out of 15 devices active. Feel free to ask about room usages, device runtimes, costs, or active alert notifications!`;
  }
}
