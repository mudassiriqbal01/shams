import { BadRequestException } from '@nestjs/common';
import { FormulaNode } from './formula.parser';

export class FormulaEvaluator {
  evaluate(
    ast: FormulaNode,
    context: Record<string, unknown>,
  ): unknown {
    return this.evaluateNode(ast, context);
  }

  private evaluateNode(
    node: FormulaNode,
    context: Record<string, unknown>,
  ): unknown {
    switch (node.type) {
      case 'Literal':
        return node.value;

      case 'FieldRef':
        if (!node.field) {
          throw new BadRequestException('Field reference without field name');
        }
        if (!(node.field in context)) {
          throw new BadRequestException(
            `Field "${node.field}" not found in context`,
          );
        }
        return context[node.field];

      case 'BinaryOp':
        return this.evaluateBinaryOp(node, context);

      case 'UnaryOp':
        return this.evaluateUnaryOp(node, context);

      case 'FunctionCall':
        return this.evaluateFunctionCall(node, context);

      default:
        throw new BadRequestException(`Unknown node type: ${(node as any).type}`);
    }
  }

  private evaluateBinaryOp(
    node: FormulaNode,
    context: Record<string, unknown>,
  ): unknown {
    const left = this.evaluateNode(node.left!, context);
    const right = this.evaluateNode(node.right!, context);

    switch (node.operator) {
      case '+':
        return (left as any) + (right as any);
      case '-':
        return (left as any) - (right as any);
      case '*':
        return (left as any) * (right as any);
      case '/':
        if (right === 0) {
          throw new BadRequestException('Division by zero');
        }
        return (left as any) / (right as any);
      case '%':
        return (left as any) % (right as any);
      case '==':
        return left === right;
      case '!=':
        return left !== right;
      case '<':
        return (left as any) < (right as any);
      case '>':
        return (left as any) > (right as any);
      case '<=':
        return (left as any) <= (right as any);
      case '>=':
        return (left as any) >= (right as any);
      case 'AND':
        return this.isTruthy(left) && this.isTruthy(right);
      case 'OR':
        return this.isTruthy(left) || this.isTruthy(right);
      default:
        throw new BadRequestException(
          `Unknown binary operator: ${node.operator}`,
        );
    }
  }

  private evaluateUnaryOp(
    node: FormulaNode,
    context: Record<string, unknown>,
  ): unknown {
    const operand = this.evaluateNode(node.operand!, context);

    switch (node.operator) {
      case '-':
        return -(operand as any);
      case 'NOT':
        return !this.isTruthy(operand);
      default:
        throw new BadRequestException(
          `Unknown unary operator: ${node.operator}`,
        );
    }
  }

  private evaluateFunctionCall(
    node: FormulaNode,
    context: Record<string, unknown>,
  ): unknown {
    if (!node.function) {
      throw new BadRequestException('Function call without function name');
    }

    const args = (node.args || []).map((arg) =>
      this.evaluateNode(arg, context),
    );

    switch (node.function.toUpperCase()) {
      case 'IF':
        if (args.length !== 3) {
          throw new BadRequestException('IF function requires 3 arguments');
        }
        return this.isTruthy(args[0]) ? args[1] : args[2];

      case 'LEN':
      case 'LENGTH':
        if (args.length !== 1) {
          throw new BadRequestException('LEN function requires 1 argument');
        }
        return String(args[0]).length;

      case 'UPPER':
        if (args.length !== 1) {
          throw new BadRequestException('UPPER function requires 1 argument');
        }
        return String(args[0]).toUpperCase();

      case 'LOWER':
        if (args.length !== 1) {
          throw new BadRequestException('LOWER function requires 1 argument');
        }
        return String(args[0]).toLowerCase();

      case 'TRIM':
        if (args.length !== 1) {
          throw new BadRequestException('TRIM function requires 1 argument');
        }
        return String(args[0]).trim();

      case 'ABS':
        if (args.length !== 1) {
          throw new BadRequestException('ABS function requires 1 argument');
        }
        return Math.abs(args[0] as any);

      case 'ROUND':
        if (args.length < 1 || args.length > 2) {
          throw new BadRequestException('ROUND function requires 1-2 arguments');
        }
        const decimals = args.length === 2 ? (args[1] as number) : 0;
        return Math.round((args[0] as number) * Math.pow(10, decimals)) / Math.pow(10, decimals);

      case 'SQRT':
        if (args.length !== 1) {
          throw new BadRequestException('SQRT function requires 1 argument');
        }
        return Math.sqrt(args[0] as any);

      case 'MAX':
        if (args.length < 1) {
          throw new BadRequestException('MAX function requires at least 1 argument');
        }
        return Math.max(...(args as number[]));

      case 'MIN':
        if (args.length < 1) {
          throw new BadRequestException('MIN function requires at least 1 argument');
        }
        return Math.min(...(args as number[]));

      case 'CONCAT':
        return args.map((a) => String(a)).join('');

      case 'NOW':
        return new Date().toISOString();

      case 'TODAY':
        return new Date().toISOString().split('T')[0];

      default:
        throw new BadRequestException(`Unknown function: ${node.function}`);
    }
  }

  private isTruthy(value: unknown): boolean {
    if (value === false || value === 0 || value === '' || value === null || value === undefined) {
      return false;
    }
    return true;
  }
}
