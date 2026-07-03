import { Request, Response } from 'express';
import { IDeviceRepository } from '../../services/device.repository';
import { SimulationService } from '../../simulation/simulation.service';

export class DeviceController {
  constructor(
    private deviceRepo: IDeviceRepository,
    private simulationService: SimulationService
  ) {}

  getAllDevices = async (req: Request, res: Response): Promise<void> => {
    try {
      const devices = await this.deviceRepo.getAll();
      res.json(devices);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve devices' });
    }
  };

  getDeviceById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const device = await this.deviceRepo.getById(id);
      if (!device) {
        res.status(404).json({ error: `Device with ID ${id} not found` });
        return;
      }
      res.json(device);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve device' });
    }
  };

  toggleDevice = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (status !== 'ON' && status !== 'OFF') {
        res.status(400).json({ error: 'Invalid status. Must be ON or OFF' });
        return;
      }

      const updated = await this.simulationService.forceToggleDevice(id, status);
      if (!updated) {
        res.status(404).json({ error: `Device with ID ${id} not found` });
        return;
      }

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Failed to toggle device state' });
    }
  };
}
