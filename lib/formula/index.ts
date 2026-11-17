import { Lexer } from './lexer';
import { Parser } from './parser';
import { Evaluator } from './evaluator';
import { DependencyGraph } from './dag';
import { ASTNode, EvaluationResult } from './types';

export function parseFormula(expression: string): ASTNode {
  const lexer = new Lexer(expression);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  return parser.parse();
}

export function evaluateFormula(
  expression: string,
  row: Record<string, any>,
  fieldMap: Record<string, string> = {}
): EvaluationResult {
  try {
    const ast = parseFormula(expression);
    const evaluator = new Evaluator(row, fieldMap);
    return evaluator.evaluate(ast);
  } catch (err: any) {
    return {
      value: null,
      error: '#ERROR!',
    };
  }
}

export { DependencyGraph };
export * from './types';
