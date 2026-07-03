import { InMemoryDeviceRepository } from './services/device.repository';
import { PowerService } from './services/power.service';
import { AlertService } from './services/alert.service';
import { SimulationService } from './simulation/simulation.service';
import { SocketService } from './socket/socket.service';
import { DiscordService } from './discord/discord.service';
import { AlertEngine } from './alerts/alert.engine';
import { config } from './config';
import http from 'http';

async function testAlertEngine() {
  console.log('--- STARTING ALERT ENGINE TEST ---');

  // Override config threshold for testing
  config.powerThreshold = 300; // 300W threshold

  const repo = new InMemoryDeviceRepository();
  const power = new PowerService(repo);
  const alerts = new AlertService();
  const sim = new SimulationService(repo, power);
  
  // Dummy HTTP server to initialize Socket.IO
  const dummyServer = http.createServer();
  const socketService = new SocketService(sim, power, alerts);
  socketService.initialize(dummyServer);

  const discord = new DiscordService(repo, power, alerts);

  // Initialize engine
  const engine = new AlertEngine(sim, alerts, socketService, discord, power);

  const delay = () => new Promise((resolve) => setTimeout(resolve, 100));

  // Test 1: After Hours Alert
  console.log('\n--- Test 1: Turning on drawing-fan-1 (expected AFTER_HOURS warning since it is after 5 PM) ---');
  await sim.forceToggleDevice('drawing-fan-1', 'ON');
  await delay();

  let activeAlerts = await alerts.getAlerts();
  console.log(`Active alerts: ${activeAlerts.length}`);
  activeAlerts.forEach((a) => console.log(` - [${a.severity}] ${a.message} (Resolved: ${a.resolved})`));

  // Test 2: High Power Alert (turning ON multiple fans to exceed 300W threshold)
  console.log('\n--- Test 2: Exceeding 300W Threshold (Turning ON all 6 fans = 450W) ---');
  const devices = await repo.getAll();
  const fans = devices.filter((d) => d.type === 'fan');
  for (const fan of fans) {
    await repo.update(fan.id, { status: 'ON', powerDraw: 75 });
  }

  // Trigger tick to evaluate threshold rules
  sim.emit('tick', await power.getPowerState());
  await delay();

  activeAlerts = await alerts.getAlerts();
  console.log(`Active alerts: ${activeAlerts.length}`);
  activeAlerts.forEach((a) => console.log(` - [${a.severity}] ${a.message} (Resolved: ${a.resolved})`));

  // Test 3: Overtime Alert (Setting all drawing room devices to ON and setting runtimes > 2 hours)
  console.log('\n--- Test 3: Overtime Alert (Drawing Room all devices ON for > 2 hours) ---');
  const updatedDevices = await repo.getAll();
  const drawingDevices = updatedDevices.filter((d) => d.room === 'drawing');
  for (const device of drawingDevices) {
    await repo.update(device.id, {
      status: 'ON',
      powerDraw: device.type === 'fan' ? 75 : 15,
      runtimeCurrentSession: 7300 // 7300 seconds > 2 hours
    });
  }

  // Trigger tick to evaluate rules
  sim.emit('tick', await power.getPowerState());
  await delay();

  activeAlerts = await alerts.getAlerts();
  console.log(`Active alerts: ${activeAlerts.length}`);
  activeAlerts.forEach((a) => console.log(` - [${a.severity}] ${a.message} (Resolved: ${a.resolved})`));

  // Test 4: Resolution of After Hours Alert (Turning drawing-fan-1 OFF)
  console.log('\n--- Test 4: Turning OFF drawing-fan-1 (should resolve after-hours alert) ---');
  await sim.forceToggleDevice('drawing-fan-1', 'OFF');
  await delay();

  activeAlerts = await alerts.getAlerts();
  console.log(`Total alerts in service: ${activeAlerts.length}`);
  activeAlerts.forEach((a) => console.log(` - [${a.severity}] ${a.message} (Resolved: ${a.resolved})`));

  console.log('\n--- ALERT ENGINE TEST FINISHED ---');
  dummyServer.close();
}

testAlertEngine().catch(console.error);
