import { Router } from 'express';
import { DeviceController } from '../controllers/device.controller';
import { context } from '../../context';

const router = Router();
const controller = new DeviceController(context.deviceRepo, context.simulationService);

router.get('/', controller.getAllDevices);
router.get('/:id', controller.getDeviceById);
router.post('/:id/toggle', controller.toggleDevice);

export default router;
