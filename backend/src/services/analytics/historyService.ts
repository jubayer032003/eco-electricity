export interface HistoryEntry {
  timestamp: string;      // ISO string
  totalPower: number;     // Watts
  roomPowers: Record<string, number>; // room -> Watts
  deviceStates: Record<string, 'ON' | 'OFF'>; // device -> status
  activeAlertsCount: number;
  efficiencyScore: number;
  kwhPerSecond: number;   // kWh consumed in this specific 1-second tick
}

export class HistoryService {
  private history: HistoryEntry[] = [];
  private maxHistorySize = 7200; // Store up to 2 hours of per-second data points

  addEntry(entry: HistoryEntry): void {
    this.history.push(entry);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  getEntries(range: 'live' | 'hour' | 'today' | 'week'): HistoryEntry[] {
    const totalCount = this.history.length;
    if (totalCount === 0) return [];

    switch (range) {
      case 'live':
        // Return last 25 points for real-time live view
        return this.history.slice(-25);
      case 'hour':
        // Return last 60 points representing last simulated hour
        return this.history.slice(-60);
      case 'today':
        // Return last 240 points
        return this.history.slice(-240);
      case 'week':
      default:
        // Return full history up to 1000 points
        return this.history;
    }
  }

  resetHistory(): void {
    this.history = [];
  }
}
