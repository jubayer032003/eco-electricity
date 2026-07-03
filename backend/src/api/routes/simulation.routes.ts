import { Router } from 'express';
import { SimulationController } from '../controllers/simulation.controller';
import { context } from '../../context';

const router = Router();
const controller = new SimulationController(context.simulationService);

router.get('/status', controller.getStatus);
router.post('/start', controller.start);
router.post('/stop', controller.stop);
router.post('/reset', controller.reset);
router.post('/demo', controller.demo);

export default router;
