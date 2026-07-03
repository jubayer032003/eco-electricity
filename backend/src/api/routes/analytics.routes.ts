import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';

const router = Router();
const controller = new AnalyticsController();

router.get('/summary', controller.getSummary);
router.get('/history', controller.getHistory);
router.get('/rooms', controller.getRooms);
router.get('/devices', controller.getDevices);
router.get('/cost', controller.getCost);

export default router;
