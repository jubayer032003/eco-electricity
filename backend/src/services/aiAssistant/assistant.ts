import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../config';
import { AnalyticsConnector } from './analyticsConnector';
import { PromptBuilder } from './promptBuilder';
import { QueryInterpreter } from './queryInterpreter';

export interface ChatMessage {
  role: 'user' | 'model';
  parts: string;
}

export class AIAssistantService {
  private analyticsConnector = new AnalyticsConnector();
  private promptBuilder = new PromptBuilder();
  private queryInterpreter = new QueryInterpreter();

  async processChat(message: string, history: ChatMessage[]): Promise<string> {
    // 1. Gather latest building contexts
    const telemetryContext = await this.analyticsConnector.getTelemetryContext();

    // 2. Injects live telemetry into prompt template
    const systemPrompt = this.promptBuilder.buildSystemPrompt(telemetryContext);

    // 3. Try Gemini LLM if configured and valid
    const hasValidKey = config.geminiApiKey && config.geminiApiKey !== 'your_gemini_api_key_here';
    if (hasValidKey) {
      try {
        const ai = new GoogleGenerativeAI(config.geminiApiKey);
        const model = ai.getGenerativeModel({
          model: 'gemini-2.5-flash',
          systemInstruction: systemPrompt
        });

        // Convert incoming generic history array to Gemini structure and ensure it starts with a 'user' message
        const cleanHistory = history.map((h) => ({
          role: h.role,
          parts: [{ text: h.parts }]
        }));

        while (cleanHistory.length > 0 && cleanHistory[0].role !== 'user') {
          cleanHistory.shift();
        }

        const chat = model.startChat({
          history: cleanHistory
        });

        const result = await chat.sendMessage(message);
        const text = result.response.text().trim();
        if (text) {
          return text;
        }
      } catch (error) {
        console.error('[AI Assistant] Gemini execution error, using local fallback:', error);
      }
    }

    // 4. Graceful local fallback engine
    return this.queryInterpreter.interpretQuery(message, telemetryContext);
  }
}
