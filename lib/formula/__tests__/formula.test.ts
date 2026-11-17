import { describe, it, expect } from 'vitest';
import { evaluateFormula, parseFormula, DependencyGraph } from '../index';

describe('Formula Engine (formula-lite)', () => {
  describe('Aritmética básica y precedencia', () => {
    it('evalúa suma y resta', () => {
      const res = evaluateFormula('10 + 5 - 3', {});
      expect(res.value).toBe(12);
      expect(res.error).toBeUndefined();
    });

    it('respeta la precedencia de multiplicación y división', () => {
      const res = evaluateFormula('2 + 3 * 4', {});
      expect(res.value).toBe(14);
    });

    it('soporta paréntesis agrupadores', () => {
      const res = evaluateFormula('(2 + 3) * 4', {});
      expect(res.value).toBe(20);
    });

    it('soporta potencia (^)', () => {
      const res = evaluateFormula('2 ^ 3', {});
      expect(res.value).toBe(8);
    });

    it('captura división por cero y devuelve #DIV/0!', () => {
      const res = evaluateFormula('100 / 0', {});
      expect(res.error).toBe('#DIV/0!');
    });
  });

  describe('Referencias a campos', () => {
    const row = {
      fld_precio: 1500,
      fld_cantidad: 4,
      fld_descuento: 200,
    };
    const fieldMap = {
      'Precio': 'fld_precio',
      'Cantidad': 'fld_cantidad',
      'Descuento': 'fld_descuento',
    };

    it('resuelve referencias con llaves {Campo}', () => {
      const res = evaluateFormula('{Precio} * {Cantidad}', row, fieldMap);
      expect(res.value).toBe(6000);
    });

    it('combina campos y literales con resta', () => {
      const res = evaluateFormula('({Precio} * {Cantidad}) - {Descuento}', row, fieldMap);
      expect(res.value).toBe(5800);
    });

    it('devuelve #REF! si el campo no existe', () => {
      const res = evaluateFormula('{CampoInexistente} + 10', row, fieldMap);
      expect(res.error).toBe('#REF!');
    });
  });

  describe('Funciones Lógicas (IF, AND, OR, NOT)', () => {
    it('evalúa IF con condición verdadera', () => {
      const res = evaluateFormula('IF(10 > 5, "Mayor", "Menor")', {});
      expect(res.value).toBe('Mayor');
    });

    it('evalúa IF con condición falsa', () => {
      const res = evaluateFormula('IF(10 < 5, "Mayor", "Menor")', {});
      expect(res.value).toBe('Menor');
    });

    it('evalúa AND lógico', () => {
      const resTrue = evaluateFormula('AND(10 > 5, 2 = 2)', {});
      expect(resTrue.value).toBe(true);

      const resFalse = evaluateFormula('AND(10 > 5, 2 = 3)', {});
      expect(resFalse.value).toBe(false);
    });

    it('evalúa OR lógico', () => {
      const res = evaluateFormula('OR(10 < 5, 2 = 2)', {});
      expect(res.value).toBe(true);
    });

    it('evalúa NOT', () => {
      const res = evaluateFormula('NOT(5 > 2)', {});
      expect(res.value).toBe(false);
    });
  });

  describe('Funciones de Texto y Concatenación', () => {
    it('concatena cadenas con operador +', () => {
      const res = evaluateFormula('"SKU-" + 1024', {});
      expect(res.value).toBe('SKU-1024');
    });

    it('evalúa función CONCAT', () => {
      const res = evaluateFormula('CONCAT("CL-", "STGO-", 99)', {});
      expect(res.value).toBe('CL-STGO-99');
    });

    it('evalúa UPPER, LOWER, TRIM, LEN', () => {
      expect(evaluateFormula('UPPER("hola")', {}).value).toBe('HOLA');
      expect(evaluateFormula('LOWER("MUNDO")', {}).value).toBe('mundo');
      expect(evaluateFormula('TRIM("  test  ")', {}).value).toBe('test');
      expect(evaluateFormula('LEN("12345")', {}).value).toBe(5);
    });
  });

  describe('Funciones Matemáticas Avanzadas', () => {
    it('evalúa ROUND con decimales configurables', () => {
      expect(evaluateFormula('ROUND(125.456, 2)', {}).value).toBe(125.46);
      expect(evaluateFormula('ROUND(125.456, 0)', {}).value).toBe(125);
    });

    it('evalúa SUM con múltiples argumentos', () => {
      expect(evaluateFormula('SUM(10, 20, 30, 40)', {}).value).toBe(100);
    });
  });

  describe('Funciones de Fechas', () => {
    it('evalúa DATE_ADD sumando días a una fecha ISO', () => {
      const res = evaluateFormula('DATE_ADD("2026-11-01", 10, "day")', {});
      expect(res.value).toBe('2026-11-11');
    });

    it('evalúa DATE_DIFF calculando diferencia entre dos fechas', () => {
      const res = evaluateFormula('DATE_DIFF("2026-11-20", "2026-11-10")', {});
      expect(res.value).toBe(10);
    });

    it('devuelve #VALUE! si la fecha es inválida', () => {
      const res = evaluateFormula('DATE_ADD("fecha-invalida", 5)', {});
      expect(res.error).toBe('#VALUE!');
    });
  });

  describe('Detección de Ciclos (DAG)', () => {
    it('detecta ciclos directos (A -> B -> A)', () => {
      const graph = new DependencyGraph();
      graph.addDependency('campoA', 'campoB');
      graph.addDependency('campoB', 'campoA');
      expect(graph.hasCycle()).toBe(true);
    });

    it('detecta ciclos transitivos (A -> B -> C -> A)', () => {
      const graph = new DependencyGraph();
      graph.addDependency('campoA', 'campoB');
      graph.addDependency('campoB', 'campoC');
      graph.addDependency('campoC', 'campoA');
      expect(graph.hasCycle()).toBe(true);
    });

    it('retorna false si el grafo es acíclico (A -> B, A -> C)', () => {
      const graph = new DependencyGraph();
      graph.addDependency('campoA', 'campoB');
      graph.addDependency('campoA', 'campoC');
      expect(graph.hasCycle()).toBe(false);
    });

    it('extrae correctamente las referencias a campos de un AST', () => {
      const ast = parseFormula('IF({Precio} > 100, {Total} * {Tasa}, {Descuento})');
      const refs = DependencyGraph.extractFieldReferences(ast);
      expect(refs.sort()).toEqual(['Descuento', 'Precio', 'Tasa', 'Total'].sort());
    });
  });
});
