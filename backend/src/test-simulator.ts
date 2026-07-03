import { InMemoryDeviceRepository } from './services/device.repository';
import { PowerService } from './services/power.service';
import { SimulationService } from './simulation/simulation.service';

async function testSimulator() {
  console.log('--- STARTING SIMULATION ENGINE TEST ---');
  const repo = new InMemoryDeviceRepository();
  const power = new PowerService(repo);
  const sim = new SimulationService(repo, power);

  // Set high speed for fast testing
  sim.setSpeed(10); // 10x speed

  sim.on('deviceUpdated', (device) => {
    console.log(`[TEST EVENT] deviceUpdated: ${device.id} -> ${device.status} (${device.powerDraw}W)`);
  });

  sim.on('tick', (state) => {
    console.log(
      `[TEST EVENT] tick: Total Power = ${state.totalPowerDraw}W, Daily Usage = ${state.estimatedKwhToday.toFixed(6)} kWh`
    );
  });

  console.log('Starting simulator...');
  sim.start();

  // Let it run for 5 seconds real-time (represents 50 seconds of simulation time)
  await new Promise((resolve) => setTimeout(resolve, 5000));

  console.log('Stopping simulator...');
  sim.stop();

  console.log('Resetting simulator...');
  await sim.reset();

  const finalState = await power.getPowerState();
  console.log(`Final State Power: ${finalState.totalPowerDraw}W`);
  console.log('--- SIMULATION ENGINE TEST FINISHED ---');
}

testSimulator().catch(console.error);
