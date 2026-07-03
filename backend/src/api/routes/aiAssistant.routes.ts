import { Router } from 'express';
import { AIAssistantController } from '../controllers/aiAssistant.controller';

const router = Router();
const controller = new AIAssistantController();

router.post('/chat', controller.chat);

export default router;
