import { Device, Alert } from '../../types';

export interface ScoreDetails {
  score: number;
  grade: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  color: string;
}

export class ScoringEngine {
  calculateScore(devices: Device[], alerts: Alert[], totalPowerDraw: number): ScoreDetails {
    let score = 100;

    // 1. active devices count deduction (2 points per active device)
    const activeCount = devices.filter((d) => d.status === 'ON').length;
    score -= activeCount * 2;

    // 2. device left ON after hours deduction (6 points per device)
    const currentHour = new Date().getHours();
    const isAfterHours = currentHour < 9 || currentHour >= 17; // 5 PM - 9 AM
    if (isAfterHours) {
      score -= activeCount * 6;
    }

    // 3. alert severity deductions
    const activeAlerts = alerts.filter((a) => !a.resolved);
    for (const alert of activeAlerts) {
      if (alert.severity === 'CRITICAL') {
        score -= 20;
      } else {
        score -= 10;
      }
    }

    // 4. power draw threshold check (deduct 15 points if exceeding 600W guideline)
    if (totalPowerDraw > 600) {
      score -= 15;
    }

    // clamp between 0 and 100
    score = Math.max(0, Math.min(100, score));

    let grade: 'Excellent' | 'Good' | 'Fair' | 'Poor' = 'Excellent';
    let color = 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10';

    if (score >= 90) {
      grade = 'Excellent';
      color = 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10';
    } else if (score >= 75) {
      grade = 'Good';
      color = 'text-sky-400 border-sky-500/20 bg-sky-500/10';
    } else if (score >= 60) {
      grade = 'Fair';
      color = 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10';
    } else {
      grade = 'Poor';
      color = 'text-rose-400 border-rose-500/20 bg-rose-500/10';
    }

    return { score, grade, color };
  }
}
