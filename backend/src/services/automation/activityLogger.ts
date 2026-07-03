import { ActionImpact } from './actionExecutor';

export interface AutomationLog {
  id: string;
  timestamp: string;
  room: string;
  device: string;
  deviceId?: string;
  ruleName: string;
  previousState: 'ON' | 'OFF';
  newState: 'ON' | 'OFF';
  powerSaved: number;
  aiExplanation: string;
}

export class ActivityLogger {
  private logs: AutomationLog[] = [];
  private maxLogsSize = 100;

  addLog(impact: ActionImpact, ruleName: string): AutomationLog {
    const timestamp = new Date().toISOString();
    const displayTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Generate explainable AI summaries
    let aiExplanation = '';
    const roomLabels: Record<string, string> = {
      drawing: 'Drawing Room',
      work1: 'Work Room 1',
      work2: 'Work Room 2'
    };

    const roomLabel = roomLabels[impact.room] || impact.room;

    if (ruleName.includes('Hours')) {
      aiExplanation = `${ruleName} automatically switched off the ${impact.deviceName} in the ${roomLabel} because the office hours window closed at 5:00 PM.`;
    } else if (ruleName.includes('Idle')) {
      aiExplanation = `Idle Device Rule automatically turned off the ${impact.deviceName} in ${roomLabel} because it exceeded continuous usage thresholds without occupancy.`;
    } else if (ruleName.includes('Occupancy')) {
      aiExplanation = `Sensor automation turned off the ${impact.deviceName} in ${roomLabel} due to zero detected room occupancy.`;
    } else if (ruleName.includes('Vacation')) {
      aiExplanation = `Vacation Mode automatically forced ${impact.deviceName} OFF because building shutdown is enabled.`;
    } else {
      aiExplanation = `Eco Automation triggered state changes on ${impact.deviceName} to conserve building energy.`;
    }

    const log: AutomationLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp,
      room: impact.room,
      device: impact.deviceName,
      deviceId: impact.deviceId,
      ruleName,
      previousState: impact.previousState,
      newState: impact.newState,
      powerSaved: impact.powerSaved,
      aiExplanation
    };

    this.logs.unshift(log);
    if (this.logs.length > this.maxLogsSize) {
      this.logs.pop();
    }

    return log;
  }

  getLogs(): AutomationLog[] {
    return this.logs;
  }

  clearLogs(): void {
    this.logs = [];
  }
}
