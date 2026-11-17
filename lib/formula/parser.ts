import { Lexer } from './lexer';
import { ASTNode, Token, TokenType } from './types';

export class Parser {
  private tokens: Token[];
  private current: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  public parse(): ASTNode {
    if (this.tokens.length === 0 || this.peek().type === 'EOF') {
      return { type: 'Literal', value: null };
    }
    const node = this.parseExpression();
    if (this.peek().type !== 'EOF') {
      throw new Error(`Sintaxis inválida cerca de '${this.peek().value}'`);
    }
    return node;
  }

  private parseExpression(): ASTNode {
    return this.parseLogicalOr();
  }

  private parseLogicalOr(): ASTNode {
    let left = this.parseLogicalAnd();

    while (this.matchOperator('OR')) {
      const op = 'OR';
      const right = this.parseLogicalAnd();
      left = { type: 'BinaryOp', operator: op, left, right };
    }

    return left;
  }

  private parseLogicalAnd(): ASTNode {
    let left = this.parseEquality();

    while (this.matchOperator('AND')) {
      const op = 'AND';
      const right = this.parseEquality();
      left = { type: 'BinaryOp', operator: op, left, right };
    }

    return left;
  }

  private parseEquality(): ASTNode {
    let left = this.parseRelational();

    while (this.matchOperator('=', '!=', '<>')) {
      const op = this.previous().value === '<>' ? '!=' : (this.previous().value as '=' | '!=');
      const right = this.parseRelational();
      left = { type: 'BinaryOp', operator: op, left, right };
    }

    return left;
  }

  private parseRelational(): ASTNode {
    let left = this.parseAdditive();

    while (this.matchOperator('<', '<=', '>', '>=')) {
      const op = this.previous().value as '<' | '<=' | '>' | '>=';
      const right = this.parseAdditive();
      left = { type: 'BinaryOp', operator: op, left, right };
    }

    return left;
  }

  private parseAdditive(): ASTNode {
    let left = this.parseMultiplicative();

    while (this.matchOperator('+', '-')) {
      const op = this.previous().value as '+' | '-';
      const right = this.parseMultiplicative();
      left = { type: 'BinaryOp', operator: op, left, right };
    }

    return left;
  }

  private parseMultiplicative(): ASTNode {
    let left = this.parsePower();

    while (this.matchOperator('*', '/', '%')) {
      const op = this.previous().value as '*' | '/' | '%';
      const right = this.parsePower();
      left = { type: 'BinaryOp', operator: op, left, right };
    }

    return left;
  }

  private parsePower(): ASTNode {
    let left = this.parseUnary();

    while (this.matchOperator('^')) {
      const op = '^';
      const right = this.parseUnary();
      left = { type: 'BinaryOp', operator: op, left, right };
    }

    return left;
  }

  private parseUnary(): ASTNode {
    if (this.matchOperator('+', '-', 'NOT')) {
      const op = this.previous().value as '+' | '-' | 'NOT';
      const argument = this.parseUnary();
      return { type: 'UnaryOp', operator: op, argument };
    }

    return this.parsePrimary();
  }

  private parsePrimary(): ASTNode {
    const token = this.peek();

    if (token.type === 'NUMBER') {
      this.advance();
      return { type: 'Literal', value: parseFloat(token.value) };
    }

    if (token.type === 'STRING') {
      this.advance();
      return { type: 'Literal', value: token.value };
    }

    if (token.type === 'BOOLEAN') {
      this.advance();
      return { type: 'Literal', value: token.value === 'TRUE' };
    }

    if (token.type === 'FIELD_REF') {
      this.advance();
      return { type: 'FieldRef', name: token.value };
    }

    if (token.type === 'IDENTIFIER') {
      const name = token.value;
      this.advance();

      // Llamada a función: IDENTIFIER '(' args ')'
      if (this.peek().type === 'LPAREN') {
        this.advance(); // saltar '('
        const args: ASTNode[] = [];

        if (this.peek().type !== 'RPAREN') {
          do {
            args.push(this.parseExpression());
          } while (this.match('COMMA'));
        }

        if (!this.match('RPAREN')) {
          throw new Error(`Se esperaba ')' después de los argumentos de '${name}'`);
        }

        return { type: 'FunctionCall', name, args };
      }

      // Si no tiene paréntesis, asumimos que es una referencia a campo directa sin llaves
      return { type: 'FieldRef', name };
    }

    if (this.match('LPAREN')) {
      const node = this.parseExpression();
      if (!this.match('RPAREN')) {
        throw new Error("Se esperaba ')' de cierre");
      }
      return node;
    }

    throw new Error(`Token inesperado: '${token.value}' (${token.type})`);
  }

  // Helpers
  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private matchOperator(...ops: string[]): boolean {
    if (this.peek().type === 'OPERATOR' && ops.includes(this.peek().value)) {
      this.advance();
      return true;
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === 'EOF';
  }

  private peek(): Token {
    return this.tokens[this.current] || { type: 'EOF', value: '', position: 0 };
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }
}
