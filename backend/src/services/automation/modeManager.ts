export type AutomationMode = 'NORMAL' | 'ECO' | 'NIGHT' | 'VACATION';

export class ModeManager {
  private currentMode: AutomationMode = 'NORMAL';

  getMode(): AutomationMode {
    return this.currentMode;
  }

  setMode(mode: AutomationMode): void {
    this.currentMode = mode;
  }
}
