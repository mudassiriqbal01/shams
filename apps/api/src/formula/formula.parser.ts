import { BadRequestException } from '@nestjs/common';

export interface FormulaNode {
  type: 'BinaryOp' | 'UnaryOp' | 'FieldRef' | 'Literal' | 'FunctionCall';
  operator?: string;
  left?: FormulaNode;
  right?: FormulaNode;
  operand?: FormulaNode;
  value?: unknown;
  field?: string;
  function?: string;
  args?: FormulaNode[];
}

export interface ParsedFormula {
  ast: FormulaNode;
  dependencies: string[];
}

export class FormulaParser {
  private tokens: Array<{ type: string; value: string }> = [];
  private current = 0;

  parse(formula: string): ParsedFormula {
    this.tokens = this.tokenize(formula);
    this.current = 0;
    const ast = this.parseExpression();
    const dependencies = this.extractDependencies(ast);
    return { ast, dependencies };
  }

  private tokenize(formula: string): Array<{ type: string; value: string }> {
    const tokens: Array<{ type: string; value: string }> = [];
    let i = 0;

    while (i < formula.length) {
      const char = formula[i];

      if (/\s/.test(char)) {
        i++;
        continue;
      }

      if (char === '{') {
        const endIndex = formula.indexOf('}', i);
        if (endIndex === -1) {
          throw new BadRequestException('Unclosed field reference in formula');
        }
        tokens.push({
          type: 'FIELD',
          value: formula.slice(i + 1, endIndex),
        });
        i = endIndex + 1;
        continue;
      }

      if (/[0-9]/.test(char)) {
        let numStr = '';
        while (i < formula.length && /[0-9.]/.test(formula[i])) {
          numStr += formula[i];
          i++;
        }
        tokens.push({ type: 'NUMBER', value: numStr });
        continue;
      }

      if (/[a-zA-Z_]/.test(char)) {
        let ident = '';
        while (i < formula.length && /[a-zA-Z0-9_]/.test(formula[i])) {
          ident += formula[i];
          i++;
        }
        tokens.push({ type: 'IDENT', value: ident });
        continue;
      }

      if (char === '"' || char === "'") {
        const quote = char;
        let str = '';
        i++;
        while (i < formula.length && formula[i] !== quote) {
          if (formula[i] === '\\') {
            i++;
            str += formula[i];
          } else {
            str += formula[i];
          }
          i++;
        }
        if (i >= formula.length) {
          throw new BadRequestException('Unclosed string literal in formula');
        }
        tokens.push({ type: 'STRING', value: str });
        i++;
        continue;
      }

      if (char === '=' && formula[i + 1] === '=') {
        tokens.push({ type: 'EQ', value: '==' });
        i += 2;
        continue;
      }

      if (char === '!' && formula[i + 1] === '=') {
        tokens.push({ type: 'NE', value: '!=' });
        i += 2;
        continue;
      }

      if (char === '<' && formula[i + 1] === '=') {
        tokens.push({ type: 'LE', value: '<=' });
        i += 2;
        continue;
      }

      if (char === '>' && formula[i + 1] === '=') {
        tokens.push({ type: 'GE', value: '>=' });
        i += 2;
        continue;
      }

      if (char === '<') {
        tokens.push({ type: 'LT', value: '<' });
        i++;
        continue;
      }

      if (char === '>') {
        tokens.push({ type: 'GT', value: '>' });
        i++;
        continue;
      }

      if (char === '+') {
        tokens.push({ type: 'PLUS', value: '+' });
        i++;
        continue;
      }

      if (char === '-') {
        tokens.push({ type: 'MINUS', value: '-' });
        i++;
        continue;
      }

      if (char === '*') {
        tokens.push({ type: 'MUL', value: '*' });
        i++;
        continue;
      }

      if (char === '/') {
        tokens.push({ type: 'DIV', value: '/' });
        i++;
        continue;
      }

      if (char === '%') {
        tokens.push({ type: 'MOD', value: '%' });
        i++;
        continue;
      }

      if (char === '(') {
        tokens.push({ type: 'LPAREN', value: '(' });
        i++;
        continue;
      }

      if (char === ')') {
        tokens.push({ type: 'RPAREN', value: ')' });
        i++;
        continue;
      }

      if (char === ',') {
        tokens.push({ type: 'COMMA', value: ',' });
        i++;
        continue;
      }

      throw new BadRequestException(`Unexpected character in formula: ${char}`);
    }

    tokens.push({ type: 'EOF', value: '' });
    return tokens;
  }

  private peek(): { type: string; value: string } {
    return this.tokens[this.current];
  }

  private advance(): { type: string; value: string } {
    return this.tokens[this.current++];
  }

  private parseExpression(): FormulaNode {
    return this.parseOr();
  }

  private parseOr(): FormulaNode {
    let left = this.parseAnd();

    while (this.peek().type === 'IDENT' && this.peek().value === 'OR') {
      this.advance();
      const right = this.parseAnd();
      left = {
        type: 'BinaryOp',
        operator: 'OR',
        left,
        right,
      };
    }

    return left;
  }

  private parseAnd(): FormulaNode {
    let left = this.parseComparison();

    while (this.peek().type === 'IDENT' && this.peek().value === 'AND') {
      this.advance();
      const right = this.parseComparison();
      left = {
        type: 'BinaryOp',
        operator: 'AND',
        left,
        right,
      };
    }

    return left;
  }

  private parseComparison(): FormulaNode {
    let left = this.parseAdditive();

    while (
      ['EQ', 'NE', 'LT', 'GT', 'LE', 'GE'].includes(this.peek().type)
    ) {
      const op = this.advance();
      const right = this.parseAdditive();
      left = {
        type: 'BinaryOp',
        operator: op.value,
        left,
        right,
      };
    }

    return left;
  }

  private parseAdditive(): FormulaNode {
    let left = this.parseMultiplicative();

    while (['PLUS', 'MINUS'].includes(this.peek().type)) {
      const op = this.advance();
      const right = this.parseMultiplicative();
      left = {
        type: 'BinaryOp',
        operator: op.value,
        left,
        right,
      };
    }

    return left;
  }

  private parseMultiplicative(): FormulaNode {
    let left = this.parseUnary();

    while (['MUL', 'DIV', 'MOD'].includes(this.peek().type)) {
      const op = this.advance();
      const right = this.parseUnary();
      left = {
        type: 'BinaryOp',
        operator: op.value,
        left,
        right,
      };
    }

    return left;
  }

  private parseUnary(): FormulaNode {
    if (this.peek().type === 'MINUS') {
      this.advance();
      return {
        type: 'UnaryOp',
        operator: '-',
        operand: this.parseUnary(),
      };
    }

    if (this.peek().type === 'IDENT' && this.peek().value === 'NOT') {
      this.advance();
      return {
        type: 'UnaryOp',
        operator: 'NOT',
        operand: this.parseUnary(),
      };
    }

    return this.parsePrimary();
  }

  private parsePrimary(): FormulaNode {
    if (this.peek().type === 'FIELD') {
      const field = this.advance().value;
      return {
        type: 'FieldRef',
        field,
      };
    }

    if (this.peek().type === 'NUMBER') {
      const value = parseFloat(this.advance().value);
      return {
        type: 'Literal',
        value,
      };
    }

    if (this.peek().type === 'STRING') {
      const value = this.advance().value;
      return {
        type: 'Literal',
        value,
      };
    }

    if (this.peek().type === 'IDENT') {
      const ident = this.advance().value;

      if (this.peek().type === 'LPAREN') {
        this.advance();
        const args: FormulaNode[] = [];

        if (this.peek().type !== 'RPAREN') {
          args.push(this.parseExpression());
          while (this.peek().type === 'COMMA') {
            this.advance();
            args.push(this.parseExpression());
          }
        }

        if (this.peek().type !== 'RPAREN') {
          throw new BadRequestException('Expected ) in function call');
        }
        this.advance();

        return {
          type: 'FunctionCall',
          function: ident,
          args,
        };
      }

      throw new BadRequestException(`Unexpected identifier: ${ident}`);
    }

    if (this.peek().type === 'LPAREN') {
      this.advance();
      const expr = this.parseExpression();
      if (this.peek().type !== 'RPAREN') {
        throw new BadRequestException('Expected ) in expression');
      }
      this.advance();
      return expr;
    }

    throw new BadRequestException(
      `Unexpected token in formula: ${this.peek().value}`,
    );
  }

  private extractDependencies(node: FormulaNode): string[] {
    const deps: Set<string> = new Set();

    const visit = (n: FormulaNode) => {
      if (n.type === 'FieldRef' && n.field) {
        deps.add(n.field);
      } else if (n.type === 'BinaryOp') {
        if (n.left) visit(n.left);
        if (n.right) visit(n.right);
      } else if (n.type === 'UnaryOp' && n.operand) {
        visit(n.operand);
      } else if (n.type === 'FunctionCall' && n.args) {
        n.args.forEach(visit);
      }
    };

    visit(node);
    return Array.from(deps);
  }
}
