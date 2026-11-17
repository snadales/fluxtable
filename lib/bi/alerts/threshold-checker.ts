export type ThresholdStatus = 'normal' | 'warning' | 'critical';

export interface ThresholdRule {
  metricKey: string;
  warningValue: number;
  criticalValue: number;
  direction?: 'above' | 'below';
  colorScheme?: string;
}

export interface ThresholdEvaluation {
  status: ThresholdStatus;
  currentValue: number;
  rule: ThresholdRule;
  message: string;
  badgeClass: string;
}

export class ThresholdChecker {
  /**
   * Evalúa un valor numérico contra una regla de umbral
   */
  public static evaluate(val: number, rule: ThresholdRule): ThresholdEvaluation {
    const direction = rule.direction || 'above';
    let status: ThresholdStatus = 'normal';

    if (direction === 'above') {
      if (val >= rule.criticalValue) {
        status = 'critical';
      } else if (val >= rule.warningValue) {
        status = 'warning';
      } else {
        status = 'normal';
      }
    } else {
      // direction === 'below'
      if (val <= rule.criticalValue) {
        status = 'critical';
      } else if (val <= rule.warningValue) {
        status = 'warning';
      } else {
        status = 'normal';
      }
    }

    let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    let message = `Normal (${val.toLocaleString()})`;

    if (status === 'warning') {
      badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
      message = `Advertencia: ${val.toLocaleString()} superó umbral (${rule.warningValue.toLocaleString()})`;
    } else if (status === 'critical') {
      badgeClass = 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse';
      message = `Crítico: ${val.toLocaleString()} superó umbral crítico (${rule.criticalValue.toLocaleString()})`;
    }

    return {
      status,
      currentValue: val,
      rule,
      message,
      badgeClass,
    };
  }
}
