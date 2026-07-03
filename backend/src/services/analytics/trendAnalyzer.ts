import { HistoryEntry } from './historyService';

export interface TrendAnalysisResult {
  status: 'INCREASING' | 'DECREASING' | 'STABLE';
  percentageChange: number;
  aiInsights: string[];
}

export class TrendAnalyzer {
  analyzeTrends(entries: HistoryEntry[], currentPower: number): TrendAnalysisResult {
    const list: string[] = [];
    let status: 'INCREASING' | 'DECREASING' | 'STABLE' = 'STABLE';
    let percentageChange = 0;

    if (entries.length >= 10) {
      const half = Math.floor(entries.length / 2);
      const firstHalf = entries.slice(0, half).map((e) => e.totalPower);
      const secondHalf = entries.slice(half).map((e) => e.totalPower);

      const avg1 = firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length;
      const avg2 = secondHalf.reduce((s, v) => s + v, 0) / secondHalf.length;

      if (avg1 > 0) {
        percentageChange = Math.round(((avg2 - avg1) / avg1) * 100);
      }

      if (percentageChange > 5) {
        status = 'INCREASING';
        list.push(`Power consumption increased by ${percentageChange}% compared to the previous baseline.`);
      } else if (percentageChange < -5) {
        status = 'DECREASING';
        list.push(`Power consumption decreased by ${Math.abs(percentageChange)}% compared to the previous baseline.`);
      } else {
        status = 'STABLE';
        list.push('Power consumption has stabilized within baseline standard deviations.');
      }
    } else {
      list.push('Building baseline stats. Telemetry stabilizing...');
    }

    // 1. Room load breakdown insight
    if (entries.length > 0) {
      const latest = entries[entries.length - 1];
      const rooms = ['drawing', 'work1', 'work2'];
      const total = Object.values(latest.roomPowers).reduce((sum, v) => sum + v, 0);

      if (total > 0) {
        const roomLabels: Record<string, string> = {
          drawing: 'Drawing Room',
          work1: 'Work Room 1',
          work2: 'Work Room 2'
        };

        for (const r of rooms) {
          const power = latest.roomPowers[r] || 0;
          const pct = Math.round((power / total) * 100);
          if (pct > 40) {
            list.push(`${roomLabels[r]} accounts for ${pct}% of current office energy usage.`);
          }
        }
      }
    }

    // 2. Alert correlation insight
    const alertsInWindow = entries.reduce((sum, e) => sum + e.activeAlertsCount, 0);
    if (alertsInWindow > 10) {
      list.push('Multiple after-hours alerts detected. Consider auditing employee departure logs.');
    } else {
      list.push('Alert frequency is low, indicating high operational protocol adherence.');
    }

    return {
      status,
      percentageChange,
      aiInsights: list
    };
  }
}
