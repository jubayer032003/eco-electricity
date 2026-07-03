import { SimulationService } from '../simulation/simulation.service';
import { AlertService } from '../services/alert.service';
import { SocketService } from '../socket/socket.service';
import { DiscordService } from '../discord/discord.service';
import { PowerService } from '../services/power.service';
import { Device, RoomId, Alert } from '../types';
import { config } from '../config';

export class AlertEngine {
  // Keep track of active alert keys to prevent duplicate spamming
  // Format of key: "TYPE:DEVICE_ID" or "TYPE:ROOM_ID"
  private activeAlertKeys: Set<string> = new Set();

  constructor(
    private simulationService: SimulationService,
    private alertService: AlertService,
    private socketService: SocketService,
    private discordService: DiscordService,
    private powerService: PowerService
  ) {
    this.setupListeners();
  }

  private setupListeners() {
    // 1. Check after hours when a device turns ON
    this.simulationService.on('deviceUpdated', async (device: Device) => {
      if (device.status === 'ON') {
        await this.checkAfterHours(device);
      } else {
        // If device turns OFF, resolve any after hours alert for it
        await this.resolveDeviceAlerts(device.id);
      }
    });

    // 2. Check overtime and high power draw on every simulation tick
    this.simulationService.on('tick', async () => {
      await this.checkHighPower();
      await this.checkOvertime();
    });

    // 3. Handle simulation resets
    this.simulationService.on('simulationReset', async () => {
      this.activeAlertKeys.clear();
      await this.alertService.resetAlerts();
    });
  }

  // Check After Hours: Device ON between 5 PM and 9 AM (local server hour)
  private async checkAfterHours(device: Device) {
    const currentHour = new Date().getHours();
    const isAfterHours = currentHour < config.officeHours.start || currentHour >= config.officeHours.end;

    if (isAfterHours) {
      const alertKey = `AFTER_HOURS:${device.id}`;
      if (this.activeAlertKeys.has(alertKey)) return;

      const message = `⚠ Alert: ${device.name} was turned ON after office hours (${config.officeHours.end}:00 - 0${config.officeHours.start}:00).`;
      
      const alert = await this.alertService.addAlert({
        deviceId: device.id,
        roomId: device.room,
        type: 'AFTER_HOURS',
        severity: 'WARNING',
        message
      });

      this.activeAlertKeys.add(alertKey);
      this.triggerNotifications(alert);
    }
  }

  // Check High Power: Total power exceeds safe threshold
  private async checkHighPower() {
    const powerState = await this.powerService.getPowerState();
    const threshold = config.powerThreshold;
    const alertKey = `HIGH_POWER:OFFICE`;

    if (powerState.totalPowerDraw > threshold) {
      if (this.activeAlertKeys.has(alertKey)) return;

      const message = `🚨 Critical: Total office power draw is ${powerState.totalPowerDraw}W, which exceeds the threshold of ${threshold}W!`;
      
      const alert = await this.alertService.addAlert({
        type: 'HIGH_POWER',
        severity: 'CRITICAL',
        message
      });

      this.activeAlertKeys.add(alertKey);
      this.triggerNotifications(alert);
    } else {
      // Resolve if it fell below threshold
      if (this.activeAlertKeys.has(alertKey)) {
        this.activeAlertKeys.delete(alertKey);
        // Find the active high power alert and resolve it
        const activeAlerts = await this.alertService.getAlerts();
        const highPowerAlert = activeAlerts.find((a) => a.type === 'HIGH_POWER' && !a.resolved);
        if (highPowerAlert) {
          await this.alertService.resolveAlert(highPowerAlert.id);
          const resolvedMsg = `✅ Restored: Office power draw has returned to normal (${powerState.totalPowerDraw}W).`;
          this.socketService.broadcast('alertResolved', { ...highPowerAlert, resolved: true });
          this.discordService.sendAlert(resolvedMsg);
        }
      }
    }
  }

  // Check Overtime: Entire room ON for over 2 hours of simulated time
  private async checkOvertime() {
    const rooms: RoomId[] = ['drawing', 'work1', 'work2'];
    const devices = await this.simulationService['deviceRepo'].getAll();

    for (const roomId of rooms) {
      const roomDevices = devices.filter((d) => d.room === roomId);
      const allOn = roomDevices.every((d) => d.status === 'ON');
      const alertKey = `OVERTIME:${roomId}`;

      if (allOn) {
        // Find the shortest active session runtime in the room
        const minSessionRuntime = Math.min(...roomDevices.map((d) => d.runtimeCurrentSession));
        const twoHoursInSeconds = 7200; // 2 hours

        if (minSessionRuntime >= twoHoursInSeconds) {
          if (this.activeAlertKeys.has(alertKey)) continue;

          const roomLabel = this.getRoomLabel(roomId);
          const message = `🚨 Critical: Entire ${roomLabel} has been left ON continuously for over 2 hours!`;
          
          const alert = await this.alertService.addAlert({
            roomId,
            type: 'OVERTIME',
            severity: 'CRITICAL',
            message
          });

          this.activeAlertKeys.add(alertKey);
          this.triggerNotifications(alert);
        }
      } else {
        // If not all ON, resolve overtime alert if it was active
        if (this.activeAlertKeys.has(alertKey)) {
          this.activeAlertKeys.delete(alertKey);
          const activeAlerts = await this.alertService.getAlerts();
          const overtimeAlert = activeAlerts.find((a) => a.type === 'OVERTIME' && a.roomId === roomId && !a.resolved);
          if (overtimeAlert) {
            await this.alertService.resolveAlert(overtimeAlert.id);
            const roomLabel = this.getRoomLabel(roomId);
            const resolvedMsg = `✅ Restored: Overtime condition cleared for ${roomLabel}.`;
            this.socketService.broadcast('alertResolved', { ...overtimeAlert, resolved: true });
            this.discordService.sendAlert(resolvedMsg);
          }
        }
      }
    }
  }

  // Trigger WebSocket and Discord actions when alert is created
  private triggerNotifications(alert: Alert) {
    this.socketService.broadcast('alertCreated', alert);
    this.discordService.sendAlert(alert.message);
  }

  // Helper to resolve any active alerts associated with a specific device ID (e.g. when turned OFF)
  private async resolveDeviceAlerts(deviceId: string) {
    const alertKey = `AFTER_HOURS:${deviceId}`;
    if (this.activeAlertKeys.has(alertKey)) {
      this.activeAlertKeys.delete(alertKey);
      const activeAlerts = await this.alertService.getAlerts();
      const alert = activeAlerts.find((a) => a.deviceId === deviceId && !a.resolved);
      if (alert) {
        await this.alertService.resolveAlert(alert.id);
        this.socketService.broadcast('alertResolved', { ...alert, resolved: true });
        
        // Also inform Discord channel
        const device = await this.simulationService['deviceRepo'].getById(deviceId);
        if (device) {
          this.discordService.sendAlert(`✅ Cleared: ${device.name} has been turned OFF. after-hours alert resolved.`);
        }
      }
    }
  }

  private getRoomLabel(room: RoomId): string {
    switch (room) {
      case 'drawing': return 'Drawing Room';
      case 'work1': return 'Work Room 1';
      case 'work2': return 'Work Room 2';
    }
  }
}
