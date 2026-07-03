import { io } from 'socket.io-client';

async function testWebSocket() {
  console.log('--- STARTING WEBSOCKET TEST ---');
  
  const socket = io('http://localhost:5000');

  socket.on('connect', () => {
    console.log(`[CLIENT] Connected to server, ID: ${socket.id}`);
  });

  socket.on('initialState', (state) => {
    console.log('[CLIENT] Received initialState:');
    console.log(` - Devices count: ${state.devices.length}`);
    console.log(` - Total Power: ${state.powerState.totalPowerDraw}W`);
    console.log(` - Active Alerts: ${state.alerts.length}`);
  });

  socket.on('deviceUpdated', (device) => {
    console.log(`[CLIENT] deviceUpdated: ${device.id} is now ${device.status}`);
  });

  socket.on('powerUpdated', (powerState) => {
    console.log(`[CLIENT] powerUpdated: Total Power = ${powerState.totalPowerDraw}W`);
  });

  socket.on('roomUpdated', (rooms) => {
    console.log('[CLIENT] roomUpdated state received');
  });

  socket.on('simulationStarted', (data) => {
    console.log(`[CLIENT] simulationStarted: ${data.running}`);
  });

  socket.on('simulationStopped', (data) => {
    console.log(`[CLIENT] simulationStopped: ${data.running}`);
  });

  // Start the simulation via HTTP fetch (Node.js 18+ has fetch)
  console.log('[CLIENT] Triggering simulation start via REST API...');
  try {
    const res = await fetch('http://localhost:5000/simulation/start', {
      method: 'POST'
    });
    const result = await res.json();
    console.log('[CLIENT] REST API Start response:', result);
  } catch (err) {
    console.error('[CLIENT] Failed to call REST API:', err);
  }

  // Let it run for 6 seconds
  await new Promise((resolve) => setTimeout(resolve, 6000));

  // Stop the simulation via REST API
  console.log('[CLIENT] Triggering simulation stop via REST API...');
  try {
    const res = await fetch('http://localhost:5000/simulation/stop', {
      method: 'POST'
    });
    const result = await res.json();
    console.log('[CLIENT] REST API Stop response:', result);
  } catch (err) {
    console.error('[CLIENT] Failed to call REST API:', err);
  }

  // Disconnect
  console.log('Disconnecting client socket...');
  socket.disconnect();
  console.log('--- WEBSOCKET TEST FINISHED ---');
}

testWebSocket().catch(console.error);
