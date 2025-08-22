import { Injectable, signal, Signal } from '@angular/core';
import { BudgetCell, Category } from '../models/budget.model';
import { CategoryNode } from '../interfaces/categories-node';

@Injectable({
  providedIn: 'root',
})
export class BudgetService {
  constructor() {}
  values = signal<{ [key: string]: { [month: string]: number } }>({});
  months: Signal<string[]> = signal([]);
  categories: Signal<Category[]> = signal([]);
  budget: Signal<BudgetCell[]> = signal([]);

  buildTree(categories: CategoryNode[]): CategoryNode[] {
    const map = new Map<string, CategoryNode>();
    const roots: CategoryNode[] = [];

    categories.forEach((cat) => map.set(cat.id, { ...cat, children: [] }));

    map.forEach((cat) => {
      if (cat.parentId) {
        const parent = map.get(cat.parentId);
        parent?.children?.push(cat);
      } else {
        roots.push(cat);
      }
    });

    return roots;
  }

  subtotalByMonths(
    categoryIds: string[],
    months: string[],
    values: Record<string, Record<string, number>>
  ): number[] {
    return months.map((month) =>
      categoryIds.reduce((sum, id) => sum + Number(values[id]?.[month] ?? 0), 0)
    );
  }

  calcIncomeTotal(
    incomes: any[],
    months: string[],
    values: Record<string, Record<string, number>>
  ) {
    return months.map((month) =>
      incomes.reduce((sum, category) => sum + (values[category.id]?.[month] ?? 0), 0)
    );
  }

  calcExpenseTotal(
    expenses: any[],
    months: string[],
    values: Record<string, Record<string, number>>
  ) {
    return months.map((month) =>
      expenses.reduce((sum, category) => sum + (values[category.id]?.[month] ?? 0), 0)
    );
  }
  sumRecursive(node: any, month: string, values: Record<string, Record<string, number>>): number {
    // giá trị của node hiện tại
    let total = Number(values[node.id]?.[month] ?? 0);

    // cộng giá trị các con (nếu có)
    if (node.children && node.children.length > 0) {
      total += node.children.reduce(
        (sum: number, child: any) => sum + this.sumRecursive(child, month, values),
        0
      );
    }

    return total;
  }

  profitOrLoss(incomeTotals: number[], expenseTotals: number[]): number[] {
    return incomeTotals.map((income, index) => income - (expenseTotals[index] || 0));
  }
}
