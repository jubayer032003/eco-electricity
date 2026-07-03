import { Router } from 'express';
import { PowerController } from '../controllers/power.controller';
import { context } from '../../context';

const router = Router();
const controller = new PowerController(context.powerService);

router.get('/', controller.getUsageToday);

export default router;
