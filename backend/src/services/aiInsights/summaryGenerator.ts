import { Device } from '../../types';
import { config } from '../../config';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class SummaryGenerator {
  private lastAISummary = '';
  private lastSummaryTime = 0;
  private throttleInterval = 60000; // Throttle LLM requests to once every 60 seconds (1 minute)

  async generateSummary(devices: Device[], totalPowerDraw: number): Promise<string> {
    const activeCount = devices.filter((d) => d.status === 'ON').length;
    const totalCount = devices.length;

    // Get room totals
    const rooms = ['drawing', 'work1', 'work2'] as const;
    const roomPowers = rooms.map((roomId) => {
      const roomDevices = devices.filter((d) => d.room === roomId);
      const power = roomDevices.reduce((sum, d) => sum + (d.status === 'ON' ? d.powerDraw : 0), 0);
      return { roomId, power };
    });
    const maxRoom = roomPowers.reduce((max, r) => (r.power > max.power ? r : max), roomPowers[0]);

    const roomLabels: Record<string, string> = {
      drawing: 'Drawing Room',
      work1: 'Work Room 1',
      work2: 'Work Room 2'
    };

    const currentHour = new Date().getHours();
    const isAfterHours = currentHour < 9 || currentHour >= 17;

    // 2. Fallback rule-based natural language generator
    let fallbackText = 'The office is operating normally.';
    if (totalPowerDraw === 0) {
      fallbackText = 'All systems are offline, and zero power is being drawn.';
    } else if (isAfterHours) {
      fallbackText = `The office is currently drawing ${totalPowerDraw}W during after-hours, mainly due to active loads in the ${roomLabels[maxRoom.roomId]}.`;
    } else {
      fallbackText = `Currently, ${activeCount} of ${totalCount} devices are active. We are drawing a total of ${totalPowerDraw}W, with the ${roomLabels[maxRoom.roomId]} representing the highest load at ${maxRoom.power}W.`;
    }

    // 1. Try Gemini LLM if key is configured (with throttling)
    if (config.geminiApiKey && config.geminiApiKey !== 'your_gemini_api_key_here') {
      const now = Date.now();
      if (now - this.lastSummaryTime < this.throttleInterval) {
        return this.lastAISummary || fallbackText;
      }

      // Update throttling timestamp immediately to prevent concurrent retries on subsequent ticks
      this.lastSummaryTime = now;

      try {
        const ai = new GoogleGenerativeAI(config.geminiApiKey);
        const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `
You are EBot, the AI energy analyzer for an office building.
Generate a conversational, warm, and natural status summary of the building's current telemetry.

Telemetry:
- Active Devices: ${activeCount} of ${totalCount}
- Active load: ${totalPowerDraw}W
- Office Hours: ${isAfterHours ? 'After Hours (Empty building)' : 'Standard Hours (Active office)'}
- Highest consuming room: ${roomLabels[maxRoom.roomId]} consuming ${maxRoom.power}W

Instructions:
1. Explain where the power is going in plain English. Keep it under 2 sentences.
2. The boss hates robotic data dumps; make the summary friendly and conversational.
3. Preserve the exact active count, total load, and room details. Do NOT invent data.
4. Do not prefix with labels or markdown headers.
`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        if (text) {
          this.lastAISummary = text;
          return text;
        }
      } catch (err) {
        console.warn(`[Summary AI] Failed to generate AI summary: ${(err as Error).message}. Using rule-based fallback.`);
      }
    }

    return fallbackText;
  }
}
