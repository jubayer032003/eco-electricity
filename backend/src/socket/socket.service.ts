import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { SimulationService } from '../simulation/simulation.service';
import { PowerService } from '../services/power.service';
import { AlertService } from '../services/alert.service';

export class SocketService {
  private io: SocketIOServer | null = null;

  constructor(
    private simulationService: SimulationService,
    private powerService: PowerService,
    private alertService: AlertService
  ) {}

  initialize(server: HttpServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: '*', // Allow all origins for dev simplicity
        methods: ['GET', 'POST']
      }
    });

    this.io.on('connection', (socket: Socket) => {
      console.log(`[Socket] Client connected: ${socket.id}`);

      // Send initial data to client on connect
      this.sendInitialState(socket);

      socket.on('disconnect', () => {
        console.log(`[Socket] Client disconnected: ${socket.id}`);
      });
    });

    // Subscribe to internal simulator events
    this.simulationService.on('deviceUpdated', (device) => {
      this.broadcast('deviceUpdated', device);
      // When device updates, room and power values change, so emit updates for them too
      this.broadcastPowerAndRoomState();
    });

    this.simulationService.on('tick', (powerState) => {
      this.broadcast('powerUpdated', powerState);
      this.broadcast('roomUpdated', powerState.rooms);
    });

    this.simulationService.on('simulationStarted', () => {
      this.broadcast('simulationStarted', { running: true });
    });

    this.simulationService.on('simulationStopped', () => {
      this.broadcast('simulationStopped', { running: false });
    });

    this.simulationService.on('simulationReset', (devices) => {
      this.broadcast('simulationReset', devices);
      this.broadcastPowerAndRoomState();
    });

    console.log('[Socket] Socket.IO service initialized and bound to simulator events.');
  }

  private async sendInitialState(socket: Socket) {
    try {
      const devices = await this.simulationService['deviceRepo'].getAll();
      const powerState = await this.powerService.getPowerState();
      const alerts = await this.alertService.getAlerts();

      socket.emit('initialState', {
        devices,
        powerState,
        alerts,
        simulation: {
          running: this.simulationService.isSimulationRunning(),
          speedMultiplier: this.simulationService.getSpeed()
        }
      });
    } catch (error) {
      console.error('[Socket] Failed to send initial state to client:', error);
    }
  }

  private async broadcastPowerAndRoomState() {
    try {
      const powerState = await this.powerService.getPowerState();
      this.broadcast('powerUpdated', powerState);
      this.broadcast('roomUpdated', powerState.rooms);
    } catch (error) {
      console.error('[Socket] Failed to broadcast power/room state:', error);
    }
  }

  // Helper to broadcast event to all clients
  broadcast(event: string, data: any) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }
}
