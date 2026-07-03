import { InMemoryDeviceRepository } from './services/device.repository';
import { PowerService } from './services/power.service';
import { AlertService } from './services/alert.service';
import { DiscordService } from './discord/discord.service';

async function testDiscordFormatting() {
  console.log('--- STARTING DISCORD BOT FORMATTING TEST ---');

  const repo = new InMemoryDeviceRepository();
  const power = new PowerService(repo);
  const alerts = new AlertService();
  const discord = new DiscordService(repo, power, alerts);

  // Set some devices to ON to make the status mock interesting
  await repo.update('drawing-fan-1', { status: 'ON', powerDraw: 75 });
  await repo.update('drawing-light-1', { status: 'ON', powerDraw: 15 });
  await repo.update('work1-light-2', { status: 'ON', powerDraw: 15 });

  // Add a mock alert
  await alerts.addAlert({
    deviceId: 'work1-light-2',
    roomId: 'work1',
    type: 'AFTER_HOURS',
    severity: 'WARNING',
    message: 'Work Room 1 Light 2 turned ON after hours'
  });

  // Verify !help
  console.log('\n--- TESTING !help ---');
  const resHelp = await discord.handleCommand('!help');
  console.log(resHelp);

  // Verify !status
  console.log('\n--- TESTING !status ---');
  const resStatus = await discord.handleCommand('!status');
  console.log(resStatus);

  // Verify !room drawing
  console.log('\n--- TESTING !room drawing ---');
  const resRoomDrawing = await discord.handleCommand('!room drawing');
  console.log(resRoomDrawing);

  // Verify !room work1
  console.log('\n--- TESTING !room work1 ---');
  const resRoomWork1 = await discord.handleCommand('!room work1');
  console.log(resRoomWork1);

  // Verify !usage
  console.log('\n--- TESTING !usage ---');
  const resUsage = await discord.handleCommand('!usage');
  console.log(resUsage);

  // Verify !alerts
  console.log('\n--- TESTING !alerts ---');
  const resAlerts = await discord.handleCommand('!alerts');
  console.log(resAlerts);

  // Verify alert propagation
  console.log('\n--- TESTING alert propagation ---');
  await discord.sendAlert('⚠ WARNING: drawing-fan-1 has been left ON after office hours!');

  console.log('\n--- DISCORD BOT FORMATTING TEST FINISHED ---');
}

testDiscordFormatting().catch(console.error);
