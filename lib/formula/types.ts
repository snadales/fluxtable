export type TokenType =
  | 'NUMBER'
  | 'STRING'
  | 'BOOLEAN'
  | 'FIELD_REF'
  | 'IDENTIFIER'
  | 'OPERATOR'
  | 'LPAREN'
  | 'RPAREN'
  | 'COMMA'
  | 'EOF';

export interface Token {
  type: TokenType;
  value: string;
  position: number;
}

export type ASTNode =
  | { type: 'Literal'; value: number | string | boolean | null }
  | { type: 'FieldRef'; name: string }
  | { 
      type: 'BinaryOp'; 
      operator: '+' | '-' | '*' | '/' | '%' | '^' | '=' | '!=' | '<' | '<=' | '>' | '>=' | 'AND' | 'OR'; 
      left: ASTNode; 
      right: ASTNode;
    }
  | { type: 'UnaryOp'; operator: '+' | '-' | 'NOT'; argument: ASTNode }
  | { type: 'FunctionCall'; name: string; args: ASTNode[] };

export type FormulaErrorCode = 
  | '#DIV/0!' 
  | '#REF!' 
  | '#VALUE!' 
  | '#ERROR!' 
  | '#CIRCULAR!';

export interface EvaluationResult {
  value: number | string | boolean | null;
  error?: FormulaErrorCode;
}
