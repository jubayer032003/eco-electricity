import { Router } from 'express';
import { AIInsightsController } from '../controllers/aiInsights.controller';
import { context } from '../../context';

const router = Router();
const controller = new AIInsightsController(context.aiInsightsAnalyzer);

router.get('/', controller.getInsights);

export default router;
