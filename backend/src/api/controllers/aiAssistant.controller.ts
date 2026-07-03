import { Request, Response } from 'express';
import { context } from '../../context';

export class AIAssistantController {
  chat = async (req: Request, res: Response): Promise<void> => {
    try {
      const { message, history } = req.body;

      if (!message) {
        res.status(400).json({ error: 'Message payload is required' });
        return;
      }

      const response = await context.aiAssistantService.processChat(message, history || []);
      res.json({ response });
    } catch (error) {
      console.error('[AI Chat Controller] chat endpoint failed:', error);
      res.status(500).json({ error: 'Failed to process AI chat query' });
    }
  };
}
