import { Injectable, BadRequestException } from '@nestjs/common';
import { FormulaParser, ParsedFormula } from './formula.parser';
import { FormulaEvaluator } from './formula.evaluator';

@Injectable()
export class FormulaEngine {
  private parser = new FormulaParser();
  private evaluator = new FormulaEvaluator();

  parseFormula(formula: string): ParsedFormula {
    return this.parser.parse(formula);
  }

  evaluateFormula(
    formula: string,
    context: Record<string, unknown>,
  ): unknown {
    const parsed = this.parser.parse(formula);
    return this.evaluator.evaluate(parsed.ast, context);
  }

  evaluateFormulaWithParsed(
    parsed: ParsedFormula,
    context: Record<string, unknown>,
  ): unknown {
    return this.evaluator.evaluate(parsed.ast, context);
  }

  validateFormula(formula: string): void {
    try {
      this.parser.parse(formula);
    } catch (error: any) {
      throw new BadRequestException(`Invalid formula: ${error.message}`);
    }
  }

  getFormulaDetails(formula: string) {
    const parsed = this.parser.parse(formula);
    return {
      isValid: true,
      dependencies: parsed.dependencies,
      preview: `Formula with ${parsed.dependencies.length} dependencies: [${parsed.dependencies.join(', ')}]`,
    };
  }

  resolveFormulaOrder(
    formulas: Map<string, { formula: string; columnId: string }>,
  ): string[] {
    const graph = new Map<string, Set<string>>();
    const inDegree = new Map<string, number>();

    formulas.forEach((def, columnId) => {
      if (!graph.has(columnId)) {
        graph.set(columnId, new Set());
      }
      inDegree.set(columnId, 0);
    });

    formulas.forEach((def, columnId) => {
      const parsed = this.parser.parse(def.formula);
      parsed.dependencies.forEach((dep) => {
        if (formulas.has(dep)) {
          if (!graph.has(dep)) {
            graph.set(dep, new Set());
          }
          if (!graph.get(dep)!.has(columnId)) {
            graph.get(dep)!.add(columnId);
            inDegree.set(columnId, (inDegree.get(columnId) || 0) + 1);
          }
        }
      });
    });

    const queue: string[] = [];
    inDegree.forEach((degree, columnId) => {
      if (degree === 0) {
        queue.push(columnId);
      }
    });

    const order: string[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      order.push(current);

      graph.get(current)?.forEach((dependent) => {
        const newDegree = (inDegree.get(dependent) || 0) - 1;
        inDegree.set(dependent, newDegree);
        if (newDegree === 0) {
          queue.push(dependent);
        }
      });
    }

    if (order.length !== formulas.size) {
      throw new BadRequestException(
        'Circular dependency detected in formulas',
      );
    }

    return order;
  }
}
