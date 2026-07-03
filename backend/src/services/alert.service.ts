import { Alert } from '../types';

export class AlertService {
  private alerts: Alert[] = [];

  async getAlerts(): Promise<Alert[]> {
    return [...this.alerts];
  }

  async addAlert(alert: Omit<Alert, 'id' | 'timestamp' | 'resolved'>): Promise<Alert> {
    const newAlert: Alert = {
      ...alert,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      resolved: false
    };
    this.alerts.unshift(newAlert);
    
    // Keep list size reasonable (e.g. 50 alerts max)
    if (this.alerts.length > 50) {
      this.alerts.pop();
    }

    return newAlert;
  }

  async resolveAlert(id: string): Promise<Alert | undefined> {
    const alert = this.alerts.find((a) => a.id === id);
    if (alert) {
      alert.resolved = true;
    }
    return alert;
  }

  async resetAlerts() {
    this.alerts = [];
  }
}
