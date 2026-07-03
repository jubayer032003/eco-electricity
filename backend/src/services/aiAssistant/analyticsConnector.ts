import { Device, Alert, PowerState } from '../../types';

export interface TelemetryContext {
  devices: Device[];
  powerState: PowerState;
  alerts: Alert[];
  efficiencyScore: number;
  efficiencyGrade: string;
  estimatedDailyCost: number;
}

export class AnalyticsConnector {
  async getTelemetryContext(): Promise<TelemetryContext> {
    const { context } = require('../../context');
    const devices = await context.deviceRepo.getAll();
    const alerts = await context.alertService.getAlerts();
    const powerState = await context.powerService.getPowerState();
    const latestInsights = context.aiInsightsAnalyzer.getLatestInsights();

    const estimatedDailyCost = powerState.estimatedKwhToday * 12.39;

    return {
      devices,
      powerState,
      alerts,
      efficiencyScore: latestInsights.efficiencyScore,
      efficiencyGrade: latestInsights.efficiencyGrade,
      estimatedDailyCost
    };
  }
}
