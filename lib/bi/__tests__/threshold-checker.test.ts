import { describe, it, expect } from 'vitest';
import { ThresholdChecker, ThresholdRule } from '../alerts/threshold-checker';

describe('BI Threshold Checker & Semáforos', () => {
  it('debe evaluar correctamente dirección "above" (valores que crecen)', () => {
    const rule: ThresholdRule = {
      metricKey: 'costo_total',
      warningValue: 50000,
      criticalValue: 100000,
      direction: 'above',
    };

    expect(ThresholdChecker.evaluate(30000, rule).status).toBe('normal');
    expect(ThresholdChecker.evaluate(50000, rule).status).toBe('warning');
    expect(ThresholdChecker.evaluate(75000, rule).status).toBe('warning');
    expect(ThresholdChecker.evaluate(100000, rule).status).toBe('critical');
    expect(ThresholdChecker.evaluate(150000, rule).status).toBe('critical');
  });

  it('debe evaluar correctamente dirección "below" (valores que caen, ej. margen o stock)', () => {
    const rule: ThresholdRule = {
      metricKey: 'margen_pct',
      warningValue: 20,
      criticalValue: 10,
      direction: 'below',
    };

    expect(ThresholdChecker.evaluate(35, rule).status).toBe('normal');
    expect(ThresholdChecker.evaluate(20, rule).status).toBe('warning');
    expect(ThresholdChecker.evaluate(15, rule).status).toBe('warning');
    expect(ThresholdChecker.evaluate(10, rule).status).toBe('critical');
    expect(ThresholdChecker.evaluate(5, rule).status).toBe('critical');
  });
});
