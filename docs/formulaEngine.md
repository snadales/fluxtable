# 🧮 Motor de Fórmulas Ligeras (`formula-lite`)

Este documento especifica el diseño, gramática formal, tokenizador, árbol de sintaxis abstracta (AST) y evaluador seguro para el campo de tipo `formula` en **BaserowLite**.

---

## 1. Principios de Seguridad y Rendimiento

1. **Sin `eval()` ni `new Function()`:** El evaluador es una máquina virtual de árbol puro escrita en TypeScript estándar, sin acceso al objeto global `window`, `process` o memoria del sistema.
2. **Determinista y Pura:** La función de evaluación recibe `(ast, rowContext, fieldsContext)` y devuelve un valor primitivo (`number | string | boolean | Date | null`).
3. **Detección de Dependencias Circulares:** Al guardar o modificar una fórmula, se construye un grafo dirigido de dependencias (DAG). Si se detecta un ciclo ($A \rightarrow B \rightarrow A$), se rechaza la fórmula con error `CIRCULAR_DEPENDENCY`.

---

## 2. Gramática Formal (EBNF)

```ebnf
Expression   ::= LogicalOr
LogicalOr    ::= LogicalAnd ( "OR" LogicalAnd )*
LogicalAnd   ::= Equality ( "AND" Equality )*
Equality     ::= Relational ( ( "=" | "!=" | "<>" ) Relational )*
Relational   ::= Additive ( ( "<" | "<=" | ">" | ">=" ) Additive )*
Additive     ::= Multiplicative ( ( "+" | "-" ) Multiplicative )*
Multiplicative ::= Unary ( ( "*" | "/" | "%" | "^" ) Unary )*
Unary        ::= ( "+" | "-" | "NOT" )? Primary
Primary      ::= NumberLiteral
               | StringLiteral
               | BooleanLiteral
               | FieldReference
               | FunctionCall
               | "(" Expression ")"

FieldReference ::= "{" [a-zA-Z0-9_\- ]+ "}"
FunctionCall   ::= Identifier "(" ( Expression ( "," Expression )* )? ")"
```

---

## 3. Catálogo de Funciones Soportadas

| Categoría | Función | Sintaxis | Ejemplo |
|---|---|---|---|
| **Lógica** | `IF` | `IF(condicion, valor_si_verdadero, valor_si_falso)` | `IF({Precio} > 1000, "Caro", "Normal")` |
| **Lógica** | `AND` | `AND(cond1, cond2, ...)` | `AND({Stock} > 0, {Activo} = TRUE)` |
| **Lógica** | `OR` | `OR(cond1, cond2, ...)` | `OR({Prioridad} = "Alta", {Vip} = TRUE)` |
| **Lógica** | `NOT` | `NOT(cond)` | `NOT({Revisado})` |
| **Matemática** | `SUM` | `SUM(a, b, ...)` | `SUM({Subtotal}, {Iva})` |
| **Matemática** | `ROUND` | `ROUND(numero, decimales)` | `ROUND({Total} * 1.19, 0)` |
| **Matemática** | `ABS` | `ABS(numero)` | `ABS({Saldo})` |
| **Texto** | `CONCAT` | `CONCAT(str1, str2, ...)` | `CONCAT("SKU-", {Codigo})` |
| **Texto** | `LOWER` | `LOWER(texto)` | `LOWER({Email})` |
| **Texto** | `UPPER` | `UPPER(texto)` | `UPPER({Estado})` |
| **Texto** | `TRIM` | `TRIM(texto)` | `TRIM({Nombre})` |
| **Texto** | `LEN` | `LEN(texto)` | `LEN({Rut})` |
| **Fecha** | `TODAY` | `TODAY()` | Devuelve la fecha actual en ISO |
| **Fecha** | `DATE_ADD` | `DATE_ADD(fecha, cantidad, "day"|"month"|"year")` | `DATE_ADD({FechaCreacion}, 30, "day")` |
| **Fecha** | `DATE_DIFF` | `DATE_DIFF(fecha1, fecha2, "day")` | `DATE_DIFF(TODAY(), {FechaVencimiento}, "day")` |

---

## 4. Tipos del Árbol de Sintaxis Abstracta (AST)

```typescript
export type ASTNode =
  | { type: 'Literal'; value: number | string | boolean | null }
  | { type: 'Field'; fieldIdOrName: string }
  | { type: 'BinaryOp'; operator: '+' | '-' | '*' | '/' | '%' | '^' | '=' | '!=' | '<' | '<=' | '>' | '>=' | 'AND' | 'OR'; left: ASTNode; right: ASTNode }
  | { type: 'UnaryOp'; operator: '+' | '-' | 'NOT'; argument: ASTNode }
  | { type: 'FunctionCall'; name: string; args: ASTNode[] };
```

---

## 5. Implementación del Evaluador Seguro (TypeScript)

```typescript
export function evaluateAST(
  node: ASTNode,
  row: Record<string, any>,
  fieldIdMap: Record<string, string> // Mapea nombres de campos o slugs a UUIDs reales
): any {
  switch (node.type) {
    case 'Literal':
      return node.value;

    case 'Field': {
      const fieldId = fieldIdMap[node.fieldIdOrName] ?? node.fieldIdOrName;
      return row[fieldId] ?? null;
    }

    case 'UnaryOp': {
      const val = evaluateAST(node.argument, row, fieldIdMap);
      if (node.operator === '-') return -Number(val || 0);
      if (node.operator === '+') return Number(val || 0);
      if (node.operator === 'NOT') return !Boolean(val);
      return val;
    }

    case 'BinaryOp': {
      const left = evaluateAST(node.left, row, fieldIdMap);
      const right = evaluateAST(node.right, row, fieldIdMap);

      switch (node.operator) {
        case '+': return (typeof left === 'string' || typeof right === 'string') ? `${left ?? ''}${right ?? ''}` : Number(left || 0) + Number(right || 0);
        case '-': return Number(left || 0) - Number(right || 0);
        case '*': return Number(left || 0) * Number(right || 0);
        case '/': {
          const divisor = Number(right || 0);
          return divisor === 0 ? null : Number(left || 0) / divisor;
        }
        case '%': return Number(left || 0) % Number(right || 0);
        case '^': return Math.pow(Number(left || 0), Number(right || 0));
        case '=': return left === right;
        case '!=': return left !== right;
        case '<': return left < right;
        case '<=': return left <= right;
        case '>': return left > right;
        case '>=': return left >= right;
        case 'AND': return Boolean(left) && Boolean(right);
        case 'OR': return Boolean(left) || Boolean(right);
      }
      return null;
    }

    case 'FunctionCall': {
      const fnName = node.name.toUpperCase();
      const evaluatedArgs = node.args.map(arg => evaluateAST(arg, row, fieldIdMap));

      switch (fnName) {
        case 'IF':
          return evaluatedArgs[0] ? evaluatedArgs[1] : evaluatedArgs[2];
        case 'CONCAT':
          return evaluatedArgs.map(a => a ?? '').join('');
        case 'ROUND':
          return Number(Number(evaluatedArgs[0] || 0).toFixed(Number(evaluatedArgs[1] || 0)));
        case 'UPPER':
          return String(evaluatedArgs[0] ?? '').toUpperCase();
        case 'LOWER':
          return String(evaluatedArgs[0] ?? '').toLowerCase();
        case 'TODAY':
          return new Date().toISOString().split('T')[0];
        case 'DATE_ADD': {
          const baseDate = new Date(evaluatedArgs[0]);
          const amount = Number(evaluatedArgs[1] || 0);
          baseDate.setDate(baseDate.getDate() + amount);
          return baseDate.toISOString().split('T')[0];
        }
        default:
          throw new Error(`Función desconocida: ${fnName}`);
      }
    }
  }
}
```
