import { Request, Response } from 'express';
import { PowerService } from '../../services/power.service';

export class PowerController {
  constructor(private powerService: PowerService) {}

  getPowerState = async (req: Request, res: Response): Promise<void> => {
    try {
      const state = await this.powerService.getPowerState();
      res.json(state);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve power state' });
    }
  };

  getUsageToday = async (req: Request, res: Response): Promise<void> => {
    try {
      const state = await this.powerService.getPowerState();
      res.json({
        kwhToday: state.estimatedKwhToday,
        timestamp: state.timestamp
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve usage data' });
    }
  };

  getRooms = async (req: Request, res: Response): Promise<void> => {
    try {
      const state = await this.powerService.getPowerState();
      res.json(state.rooms);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve rooms data' });
    }
  };
}
