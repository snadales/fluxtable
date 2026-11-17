import { ASTNode, EvaluationResult } from './types';

export class Evaluator {
  private row: Record<string, any>;
  private fieldMap: Record<string, string>; // Maps name to fieldId

  constructor(row: Record<string, any>, fieldMap: Record<string, string> = {}) {
    this.row = row;
    this.fieldMap = fieldMap;
  }

  public evaluate(node: ASTNode): EvaluationResult {
    try {
      const val = this.evalNode(node);
      return { value: val };
    } catch (err: any) {
      if (err.message?.startsWith('#')) {
        return { value: null, error: err.message };
      }
      return { value: null, error: '#ERROR!' };
    }
  }

  private evalNode(node: ASTNode): any {
    switch (node.type) {
      case 'Literal':
        return node.value;

      case 'FieldRef': {
        const key = this.fieldMap[node.name] || node.name;
        const val = this.row[key];
        if (val === undefined) {
          // Si el campo no existe en el mapa ni en la fila, reportar #REF!
          if (Object.keys(this.fieldMap).length > 0 && !this.fieldMap[node.name] && !(node.name in this.row)) {
            throw new Error('#REF!');
          }
          return null;
        }
        return val;
      }

      case 'UnaryOp': {
        const arg = this.evalNode(node.argument);
        if (node.operator === '-') {
          const num = this.toNumber(arg);
          return -num;
        }
        if (node.operator === '+') {
          return this.toNumber(arg);
        }
        if (node.operator === 'NOT') {
          return !Boolean(arg);
        }
        return arg;
      }

      case 'BinaryOp': {
        const left = this.evalNode(node.left);
        const right = this.evalNode(node.right);

        switch (node.operator) {
          case '+': {
            if (typeof left === 'string' || typeof right === 'string') {
              return `${left ?? ''}${right ?? ''}`;
            }
            return this.toNumber(left) + this.toNumber(right);
          }
          case '-':
            return this.toNumber(left) - this.toNumber(right);
          case '*':
            return this.toNumber(left) * this.toNumber(right);
          case '/': {
            const divisor = this.toNumber(right);
            if (divisor === 0) {
              throw new Error('#DIV/0!');
            }
            return this.toNumber(left) / divisor;
          }
          case '%': {
            const divisor = this.toNumber(right);
            if (divisor === 0) throw new Error('#DIV/0!');
            return this.toNumber(left) % divisor;
          }
          case '^':
            return Math.pow(this.toNumber(left), this.toNumber(right));

          // Comparaciones
          case '=':
            return left == right;
          case '!=':
            return left != right;
          case '<':
            return this.toNumber(left) < this.toNumber(right);
          case '<=':
            return this.toNumber(left) <= this.toNumber(right);
          case '>':
            return this.toNumber(left) > this.toNumber(right);
          case '>=':
            return this.toNumber(left) >= this.toNumber(right);

          // Lógicos
          case 'AND':
            return Boolean(left) && Boolean(right);
          case 'OR':
            return Boolean(left) || Boolean(right);

          default:
            throw new Error('#ERROR!');
        }
      }

      case 'FunctionCall': {
        const fnName = node.name.toUpperCase();
        return this.evalFunction(fnName, node.args);
      }
    }
  }

  private evalFunction(name: string, args: ASTNode[]): any {
    switch (name) {
      case 'IF': {
        if (args.length < 2 || args.length > 3) throw new Error('#ERROR!');
        const condition = Boolean(this.evalNode(args[0]));
        if (condition) {
          return this.evalNode(args[1]);
        }
        return args[2] ? this.evalNode(args[2]) : null;
      }

      case 'AND': {
        if (args.length === 0) return true;
        return args.every(arg => Boolean(this.evalNode(arg)));
      }

      case 'OR': {
        if (args.length === 0) return false;
        return args.some(arg => Boolean(this.evalNode(arg)));
      }

      case 'NOT': {
        if (args.length !== 1) throw new Error('#ERROR!');
        return !Boolean(this.evalNode(args[0]));
      }

      case 'SUM': {
        let total = 0;
        for (const arg of args) {
          total += this.toNumber(this.evalNode(arg));
        }
        return total;
      }

      case 'ROUND': {
        if (args.length < 1 || args.length > 2) throw new Error('#ERROR!');
        const val = this.toNumber(this.evalNode(args[0]));
        const decimals = args[1] ? Math.floor(this.toNumber(this.evalNode(args[1]))) : 0;
        const factor = Math.pow(10, decimals);
        return Math.round(val * factor) / factor;
      }

      case 'ABS': {
        if (args.length !== 1) throw new Error('#ERROR!');
        return Math.abs(this.toNumber(this.evalNode(args[0])));
      }

      case 'CONCAT': {
        return args.map(arg => {
          const val = this.evalNode(arg);
          return val === null || val === undefined ? '' : String(val);
        }).join('');
      }

      case 'UPPER': {
        if (args.length !== 1) throw new Error('#ERROR!');
        const val = this.evalNode(args[0]);
        return val ? String(val).toUpperCase() : '';
      }

      case 'LOWER': {
        if (args.length !== 1) throw new Error('#ERROR!');
        const val = this.evalNode(args[0]);
        return val ? String(val).toLowerCase() : '';
      }

      case 'TRIM': {
        if (args.length !== 1) throw new Error('#ERROR!');
        const val = this.evalNode(args[0]);
        return val ? String(val).trim() : '';
      }

      case 'LEN': {
        if (args.length !== 1) throw new Error('#ERROR!');
        const val = this.evalNode(args[0]);
        return val ? String(val).length : 0;
      }

      case 'TODAY': {
        return new Date().toISOString().split('T')[0];
      }

      case 'DATE_ADD': {
        if (args.length < 2) throw new Error('#ERROR!');
        const dateStr = this.evalNode(args[0]);
        const amount = this.toNumber(this.evalNode(args[1]));
        const unit = args[2] ? String(this.evalNode(args[2])).toLowerCase() : 'day';

        const d = new Date(dateStr);
        if (isNaN(d.getTime())) throw new Error('#VALUE!');

        if (unit === 'day' || unit === 'days') {
          d.setDate(d.getDate() + amount);
        } else if (unit === 'month' || unit === 'months') {
          d.setMonth(d.getMonth() + amount);
        } else if (unit === 'year' || unit === 'years') {
          d.setFullYear(d.getFullYear() + amount);
        }

        return d.toISOString().split('T')[0];
      }

      case 'DATE_DIFF': {
        if (args.length < 2) throw new Error('#ERROR!');
        const d1 = new Date(this.evalNode(args[0]));
        const d2 = new Date(this.evalNode(args[1]));
        if (isNaN(d1.getTime()) || isNaN(d2.getTime())) throw new Error('#VALUE!');

        const diffTime = d1.getTime() - d2.getTime();
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }

      default:
        throw new Error('#ERROR!');
    }
  }

  private toNumber(val: any): number {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (typeof val === 'boolean') return val ? 1 : 0;
    const num = Number(val);
    if (isNaN(num)) throw new Error('#VALUE!');
    return num;
  }
}
