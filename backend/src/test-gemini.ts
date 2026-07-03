import { AIAssistantService } from './services/aiAssistant/assistant';
import { context } from './context';

async function run() {
  const assistant = new AIAssistantService();
  try {
    const response = await assistant.processChat('How much power is the drawing room using?', []);
    console.log('Chatbot Response:', response);
  } catch (error) {
    console.error('Chatbot error:', error);
  }
}

run();
