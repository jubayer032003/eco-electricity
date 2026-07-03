import { Router } from 'express';
import { AlertController } from '../controllers/alert.controller';
import { context } from '../../context';

const router = Router();
const controller = new AlertController(context.alertService);

router.get('/', controller.getAllAlerts);
router.post('/:id/resolve', controller.resolveAlert);

export default router;
