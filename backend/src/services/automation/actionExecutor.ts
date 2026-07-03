import { context } from '../../context';
import { Device } from '../../types';

export interface ActionImpact {
  deviceId: string;
  deviceName: string;
  room: string;
  previousState: 'ON' | 'OFF';
  newState: 'ON' | 'OFF';
  powerSaved: number;
}

export class ActionExecutor {
  // Stack to store executed actions for UNDO capability
  private undoStack: ActionImpact[][] = [];

  async executeToggle(deviceId: string, value: 'ON' | 'OFF'): Promise<ActionImpact | null> {
    const devices = await context.deviceRepo.getAll();
    const target = devices.find((d) => d.id === deviceId);
    if (!target) return null;

    const previousState = target.status;
    if (previousState === value) return null; // No state change needed

    // Update status in repo using the existing update() method
    await context.deviceRepo.update(deviceId, { status: value });
    
    // Broadcast device update via WebSocket
    const updated = await context.deviceRepo.getById(deviceId);
    if (updated) {
      context.socketService.broadcast('deviceUpdated', updated);
    }

    const powerSaved = value === 'OFF' ? (target.type === 'fan' ? 75 : 15) : 0;

    return {
      deviceId,
      deviceName: target.name,
      room: target.room,
      previousState,
      newState: value,
      powerSaved
    };
  }

  pushToUndo(actions: ActionImpact[]): void {
    this.undoStack.push(actions);
    if (this.undoStack.length > 50) {
      this.undoStack.shift();
    }
  }

  async undoLastAction(): Promise<ActionImpact[] | null> {
    const last = this.undoStack.pop();
    if (!last || last.length === 0) return null;

    const reverted: ActionImpact[] = [];
    for (const impact of last) {
      // Revert status using the existing update() method
      await context.deviceRepo.update(impact.deviceId, { status: impact.previousState });
      
      const updated = await context.deviceRepo.getById(impact.deviceId);
      if (updated) {
        context.socketService.broadcast('deviceUpdated', updated);
      }

      reverted.push({
        ...impact,
        previousState: impact.newState,
        newState: impact.previousState,
        powerSaved: -impact.powerSaved
      });
    }

    return reverted;
  }
}
