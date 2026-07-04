import { InMemoryDeviceRepository } from './services/device.repository';
import { PowerService } from './services/power.service';
import { SimulationService } from './simulation/simulation.service';
import { AlertService } from './services/alert.service';
import { SocketService } from './socket/socket.service';
import { DiscordService } from './discord/discord.service';
import { AlertEngine } from './alerts/alert.engine';
import { AIInsightsAnalyzer } from './services/aiInsights/analyzer';
import { AIAssistantService } from './services/aiAssistant/assistant';
import { AutomationEngine } from './services/automation/automationEngine';
import { MqttService } from './services/mqtt/mqtt.service';
import {
  HistoryService,
  AggregationService,
  CostCalculator,
  UptimeCalculator,
  TrendAnalyzer,
  PeakAnalyzer
} from './services/analytics';

// Central Dependency Injection Container / Context
const deviceRepo = new InMemoryDeviceRepository();
const powerService = new PowerService(deviceRepo);
const simulationService = new SimulationService(deviceRepo, powerService);
const alertService = new AlertService();
const socketService = new SocketService(simulationService, powerService, alertService);
const discordService = new DiscordService(deviceRepo, powerService, alertService);
const alertEngine = new AlertEngine(
  simulationService,
  alertService,
  socketService,
  discordService,
  powerService
);
const aiInsightsAnalyzer = new AIInsightsAnalyzer(deviceRepo, powerService, alertService);

const historyService = new HistoryService();
const aggregationService = new AggregationService();
const costCalculator = new CostCalculator();
const uptimeCalculator = new UptimeCalculator();
const trendAnalyzer = new TrendAnalyzer();
const peakAnalyzer = new PeakAnalyzer();

const aiAssistantService = new AIAssistantService();
const automationEngine = new AutomationEngine();
const mqttService = new MqttService(simulationService, automationEngine);

export const context = {
  deviceRepo,
  powerService,
  simulationService,
  alertService,
  socketService,
  discordService,
  alertEngine,
  aiInsightsAnalyzer,
  historyService,
  aggregationService,
  costCalculator,
  uptimeCalculator,
  trendAnalyzer,
  peakAnalyzer,
  aiAssistantService,
  automationEngine,
  mqttService
};
