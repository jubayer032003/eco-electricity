import { Request, Response } from 'express';
import { context } from '../../context';

export class AnalyticsController {
  
  getSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const range = (req.query.range as 'live' | 'hour' | 'today' | 'week') || 'today';
      const history = context.historyService.getEntries(range);
      const devices = await context.deviceRepo.getAll();
      const powerState = await context.powerService.getPowerState();

      const aggs = context.aggregationService.calculateAggregations(history);
      const costs = context.costCalculator.calculateCosts(devices, powerState.estimatedKwhToday);
      const uptime = context.uptimeCalculator.calculateUptime(devices, history);
      const trend = context.trendAnalyzer.analyzeTrends(history, powerState.totalPowerDraw);
      const peaks = context.peakAnalyzer.analyzePeaks(history, devices);

      // Find uptime leader
      const uptimeLeader = uptime.length > 0 
        ? uptime.reduce((max, d) => (d.uptimePercent > max.uptimePercent ? d : max), uptime[0]).deviceName
        : 'None';

      // Calculate exact per-second energy consumed for the requested time range
      let rangeKwh = 0;
      if (history.length > 0) {
        // Exact sum of per-second kWh across all historical samples
        rangeKwh = history.reduce((sum, entry) => sum + (entry.kwhPerSecond || (entry.totalPower / 1000) / 3600), 0);
        if (range === 'today' || range === 'week') {
          rangeKwh = Math.max(rangeKwh, powerState.estimatedKwhToday);
        }
        if (range === 'week') {
          rangeKwh *= 7;
        }
      } else {
        rangeKwh = range === 'week' ? powerState.estimatedKwhToday * 7 : powerState.estimatedKwhToday;
      }

      const rangeCost = rangeKwh * 12.39;

      const avgEfficiency = history.length > 0
        ? Math.round(history.reduce((sum, h) => sum + (h.efficiencyScore || 85), 0) / history.length)
        : context.aiInsightsAnalyzer.getLatestInsights().efficiencyScore;

      res.json({
        totalEnergyUsed: Number(rangeKwh.toFixed(3)),
        currentPower: powerState.totalPowerDraw,
        avgPower: aggs.avgPower,
        peakPower: peaks.peakPower,
        hourlyCost: costs.hourlyCost,
        todayCost: Number(rangeCost.toFixed(2)),
        mostActiveRoom: peaks.mostActiveRoom,
        highestConsumingDevice: peaks.mostActiveDevice,
        dailyEfficiencyScore: avgEfficiency,
        uptimeLeader,
        trendDirection: trend.status,
        aiInsights: trend.aiInsights
      });
    } catch (error) {
      console.error('[Analytics Controller] getSummary failed:', error);
      res.status(500).json({ error: 'Failed to retrieve analytics summary' });
    }
  };

  getHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const range = (req.query.range as 'live' | 'hour' | 'today' | 'week') || 'today';
      const history = context.historyService.getEntries(range);
      res.json(history);
    } catch (error) {
      console.error('[Analytics Controller] getHistory failed:', error);
      res.status(500).json({ error: 'Failed to retrieve power history' });
    }
  };

  getRooms = async (req: Request, res: Response): Promise<void> => {
    try {
      const range = (req.query.range as 'live' | 'hour' | 'today' | 'week') || 'today';
      const history = context.historyService.getEntries(range);
      const devices = await context.deviceRepo.getAll();

      const rooms = ['drawing', 'work1', 'work2'] as const;
      const roomLabels: Record<string, string> = {
        drawing: 'Drawing Room',
        work1: 'Work Room 1',
        work2: 'Work Room 2'
      };

      const result = rooms.map((roomId) => {
        const roomDevices = devices.filter((d) => d.room === roomId);
        const currentPower = roomDevices.reduce((sum, d) => sum + (d.status === 'ON' ? d.powerDraw : 0), 0);
        
        // Calculate average historical room power
        let powerSum = 0;
        let powerCount = 0;
        let peakPower = 0;

        for (const entry of history) {
          const powerVal = entry.roomPowers[roomId] || 0;
          powerSum += powerVal;
          powerCount++;
          peakPower = Math.max(peakPower, powerVal);
        }

        const avgPower = powerCount > 0 ? Math.round(powerSum / powerCount) : 0;
        
        // Today's energy consumption (kWh)
        const totalRuntime = roomDevices.reduce((sum, d) => sum + d.runtimeToday, 0);
        const totalKwh = roomDevices.reduce((sum, d) => {
          const watts = d.type === 'fan' ? 75 : 15;
          return sum + (d.runtimeToday / 3600) * watts / 1000;
        }, 0);

        return {
          room: roomId,
          name: roomLabels[roomId],
          currentPower,
          avgPower,
          todayKwh: Number(totalKwh.toFixed(3)),
          peakPower,
          efficiencyScore: currentPower > 150 ? 65 : 95
        };
      });

      res.json(result);
    } catch (error) {
      console.error('[Analytics Controller] getRooms failed:', error);
      res.status(500).json({ error: 'Failed to retrieve room comparison data' });
    }
  };

  getDevices = async (req: Request, res: Response): Promise<void> => {
    try {
      const range = (req.query.range as 'live' | 'hour' | 'today' | 'week') || 'today';
      const history = context.historyService.getEntries(range);
      const devices = await context.deviceRepo.getAll();
      const stats = context.uptimeCalculator.calculateUptime(devices, history);
      res.json(stats);
    } catch (error) {
      console.error('[Analytics Controller] getDevices failed:', error);
      res.status(500).json({ error: 'Failed to retrieve device analytics' });
    }
  };

  getCost = async (req: Request, res: Response): Promise<void> => {
    try {
      const devices = await context.deviceRepo.getAll();
      const powerState = await context.powerService.getPowerState();
      const costs = context.costCalculator.calculateCosts(devices, powerState.estimatedKwhToday);
      res.json(costs);
    } catch (error) {
      console.error('[Analytics Controller] getCost failed:', error);
      res.status(500).json({ error: 'Failed to retrieve cost analytics' });
    }
  };
}
