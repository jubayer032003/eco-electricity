import { Request, Response } from 'express';
import { AlertService } from '../../services/alert.service';

export class AlertController {
  constructor(private alertService: AlertService) {}

  getAllAlerts = async (req: Request, res: Response): Promise<void> => {
    try {
      const alerts = await this.alertService.getAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve alerts' });
    }
  };

  resolveAlert = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const resolved = await this.alertService.resolveAlert(id);
      if (!resolved) {
        res.status(404).json({ error: `Alert with ID ${id} not found` });
        return;
      }
      res.json(resolved);
    } catch (error) {
      res.status(500).json({ error: 'Failed to resolve alert' });
    }
  };
}
