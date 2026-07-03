import { Request, Response } from 'express';
import { SimulationService } from '../../simulation/simulation.service';

export class SimulationController {
  constructor(private simulationService: SimulationService) {}

  start = async (req: Request, res: Response): Promise<void> => {
    try {
      this.simulationService.start();
      res.json({ message: 'Simulation started', running: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to start simulation' });
    }
  };

  stop = async (req: Request, res: Response): Promise<void> => {
    try {
      this.simulationService.stop();
      res.json({ message: 'Simulation stopped', running: false });
    } catch (error) {
      res.status(500).json({ error: 'Failed to stop simulation' });
    }
  };

  reset = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.simulationService.reset();
      res.json({ message: 'Simulation and runtimes reset' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to reset simulation' });
    }
  };

  demo = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.simulationService.triggerDemoMode();
      res.json({ message: 'Demo mode activated', running: true, speedMultiplier: 30 });
    } catch (error) {
      res.status(500).json({ error: 'Failed to activate demo mode' });
    }
  };

  getStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      res.json({
        running: this.simulationService.isSimulationRunning(),
        speedMultiplier: this.simulationService.getSpeed()
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get simulation status' });
    }
  };
}
