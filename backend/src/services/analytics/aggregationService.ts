import { HistoryEntry } from './historyService';

export interface PowerAggregations {
  avgPower: number;
  minPower: number;
  maxPower: number;
}

export class AggregationService {
  calculateAggregations(entries: HistoryEntry[]): PowerAggregations {
    if (entries.length === 0) {
      return { avgPower: 0, minPower: 0, maxPower: 0 };
    }

    const loads = entries.map((e) => e.totalPower);
    const sum = loads.reduce((acc, v) => acc + v, 0);
    const avgPower = Math.round(sum / loads.length);
    const minPower = Math.min(...loads);
    const maxPower = Math.max(...loads);

    return { avgPower, minPower, maxPower };
  }
}
