import { Token, TokenType } from './types';

export class Lexer {
  private input: string;
  private pos: number = 0;

  constructor(input: string) {
    this.input = input.trim();
  }

  public tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.pos < this.input.length) {
      const char = this.input[this.pos];

      // Ignorar espacios en blanco
      if (/\s/.test(char)) {
        this.pos++;
        continue;
      }

      // Paréntesis y separadores
      if (char === '(') {
        tokens.push({ type: 'LPAREN', value: '(', position: this.pos++ });
        continue;
      }
      if (char === ')') {
        tokens.push({ type: 'RPAREN', value: ')', position: this.pos++ });
        continue;
      }
      if (char === ',') {
        tokens.push({ type: 'COMMA', value: ',', position: this.pos++ });
        continue;
      }

      // Referencias a campos: {Nombre del Campo}
      if (char === '{') {
        const start = this.pos;
        this.pos++; // saltar '{'
        let fieldName = '';
        while (this.pos < this.input.length && this.input[this.pos] !== '}') {
          fieldName += this.input[this.pos++];
        }
        if (this.pos < this.input.length && this.input[this.pos] === '}') {
          this.pos++; // saltar '}'
        }
        tokens.push({ type: 'FIELD_REF', value: fieldName.trim(), position: start });
        continue;
      }

      // Cadenas de texto: "texto" o 'texto'
      if (char === '"' || char === "'") {
        const quote = char;
        const start = this.pos;
        this.pos++;
        let strVal = '';
        while (this.pos < this.input.length && this.input[this.pos] !== quote) {
          if (this.input[this.pos] === '\\' && this.pos + 1 < this.input.length) {
            this.pos++;
            strVal += this.input[this.pos++];
          } else {
            strVal += this.input[this.pos++];
          }
        }
        if (this.pos < this.input.length && this.input[this.pos] === quote) {
          this.pos++;
        }
        tokens.push({ type: 'STRING', value: strVal, position: start });
        continue;
      }

      // Números (enteros o decimales)
      if (/\d/.test(char) || (char === '.' && /\d/.test(this.input[this.pos + 1] || ''))) {
        const start = this.pos;
        let numStr = '';
        let hasDecimal = false;
        while (this.pos < this.input.length && (/[\d.]/.test(this.input[this.pos]))) {
          if (this.input[this.pos] === '.') {
            if (hasDecimal) break;
            hasDecimal = true;
          }
          numStr += this.input[this.pos++];
        }
        tokens.push({ type: 'NUMBER', value: numStr, position: start });
        continue;
      }

      // Operadores de comparación y aritméticos
      if (['+', '-', '*', '/', '%', '^', '=', '!', '<', '>'].includes(char)) {
        const start = this.pos;
        const nextChar = this.input[this.pos + 1] || '';

        // != o <>
        if ((char === '!' && nextChar === '=') || (char === '<' && nextChar === '>')) {
          this.pos += 2;
          tokens.push({ type: 'OPERATOR', value: '!=', position: start });
          continue;
        }
        // <= o >=
        if ((char === '<' || char === '>') && nextChar === '=') {
          this.pos += 2;
          tokens.push({ type: 'OPERATOR', value: `${char}=`, position: start });
          continue;
        }

        // Operadores simples
        this.pos++;
        tokens.push({ type: 'OPERATOR', value: char, position: start });
        continue;
      }

      // Identificadores (nombres de funciones o booleanos)
      if (/[a-zA-Z_]/.test(char)) {
        const start = this.pos;
        let ident = '';
        while (this.pos < this.input.length && /[a-zA-Z0-9_]/.test(this.input[this.pos])) {
          ident += this.input[this.pos++];
        }

        const upper = ident.toUpperCase();
        if (upper === 'TRUE' || upper === 'FALSE') {
          tokens.push({ type: 'BOOLEAN', value: upper, position: start });
        } else if (upper === 'AND' || upper === 'OR' || upper === 'NOT') {
          // Si el siguiente carácter no-espacio es '(', es una función: AND(...)
          let peekIndex = this.pos;
          while (peekIndex < this.input.length && /\s/.test(this.input[peekIndex])) {
            peekIndex++;
          }
          if (this.input[peekIndex] === '(') {
            tokens.push({ type: 'IDENTIFIER', value: ident, position: start });
          } else {
            tokens.push({ type: 'OPERATOR', value: upper, position: start });
          }
        } else {
          tokens.push({ type: 'IDENTIFIER', value: ident, position: start });
        }
        continue;
      }

      // Carácter desconocido
      this.pos++;
    }

    tokens.push({ type: 'EOF', value: '', position: this.pos });
    return tokens;
  }
}
