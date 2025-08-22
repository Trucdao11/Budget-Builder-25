import {
  Component,
  computed,
  ElementRef,
  inject,
  QueryList,
  signal,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { CategoryNode } from '../../interfaces/categories-node';
import { BudgetService } from '../../services/budget.service';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { Dialog } from '../dialog/dialog/dialog';
@Component({
  selector: 'app-budget-table',
  templateUrl: './budget-table.html',
  styleUrl: './budget-table.scss',
})
export class BudgetTable {
  budgetService = inject(BudgetService);
  incomeTotal;
  expenseTotal;
  startMonth = signal<string>('2025-01');
  endMonth = signal<string>('2025-12');
  categories = signal<CategoryNode[]>([
    { id: '1', name: 'General Income', parentId: null, type: 'income' },
    { id: '2', name: 'Sales', parentId: '1', type: 'income' },
    { id: '3', name: 'Commission', parentId: '1', type: 'income' },
    { id: '4', name: 'Other Income', parentId: null, type: 'income' },
    { id: '5', name: 'Training', parentId: '4', type: 'income' },
    { id: '6', name: 'Consulting', parentId: '4', type: 'income' },
    { id: '7', name: 'Operational Expense', parentId: null, type: 'expense' },
    { id: '8', name: 'Management Fees', parentId: '7', type: 'expense' },
    { id: '9', name: 'Cloud Hosting', parentId: '7', type: 'expense' },
    { id: '10', name: 'Salaries & Wages', parentId: null, type: 'expense' },
    { id: '11', name: 'Full-time Dev Salaries', parentId: '10', type: 'expense' },
    { id: '12', name: 'Part-time Dev Salaries', parentId: '10', type: 'expense' },
    { id: '13', name: 'Remote Salaries', parentId: '10', type: 'expense' },
  ]);
  months = signal([
    'Jan 2025',
    'Feb 2025',
    'Mar 2025',
    'Apr 2025',
    'May 2025',
    'Jun 2025',
    'Jul 2025',
    'Aug 2025',
    'Sep 2025',
    'Oct 2025',
    'Nov 2025',
    'Dec 2025',
  ]);
  selectedCategoryId: string | null = null;
  selectedMonth: string | null = null;

  values = signal<{ [key: string]: { [month: string]: number } }>({});
  readonly dialog = inject(MatDialog);
  @ViewChildren('firstCell') firstCells?: QueryList<ElementRef<HTMLInputElement>>;
  constructor() {
    this.incomeTotal = this.budgetService.calcIncomeTotal(
      this.incomes(),
      this.filteredMonths(),
      this.values()
    );
    this.expenseTotal = this.budgetService.calcExpenseTotal(
      this.expenses(),
      this.filteredMonths(),
      this.values()
    );
  }

  ngAfterViewInit() {
    setTimeout(() => {
      const firstInput = this.firstCells?.first;
      firstInput?.nativeElement.focus();
    });
  }

  incomes = computed(() =>
    this.budgetService.buildTree(this.categories().filter((c) => c.type === 'income'))
  );

  expenses = computed(() =>
    this.budgetService.buildTree(this.categories().filter((c) => c.type === 'expense'))
  );

  updateValue(categoryId: string, month: string, value: number) {
    this.values.update((prev) => {
      if (!prev[categoryId]) {
        prev[categoryId] = {};
      }
      prev[categoryId][month] = value;
      return { ...prev };
    });
  }

  updateCategoryName(categoryId: string, newName: string) {
    this.categories.update((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, name: newName, isEditable: false } : c))
    );
  }

  monthToIndex(dateStr: string): number {
    const [year, month] = dateStr.split('-').map(Number);
    return month - 1; // 0-based index
  }

  filteredMonths = computed(() => {
    const allMonths = this.months();
    const startIdx = this.monthToIndex(this.startMonth());
    const endIdx = this.monthToIndex(this.endMonth());
    const countMonths = allMonths.slice(startIdx, endIdx + 1);
    return countMonths;
  });

  columInTable = computed(() => {
    return this.filteredMonths().length + 1;
  });

  incomeSubTotals = computed(() => {
    const months = this.filteredMonths();
    const values = this.values();

    return this.incomes().reduce((acc, category) => {
      const children = this.categories().filter((c) => c.parentId === category.id);

      acc[category.id] = this.budgetService.subtotalByMonths(
        children.map((c) => c.id),
        months,
        values
      );
      return acc;
    }, {} as { [key: string]: number[] });
  });

  expensesSubTotals = computed(() => {
    const months = this.filteredMonths();
    const values = this.values();

    return this.expenses().reduce((acc, category) => {
      const children = this.categories().filter((c) => c.parentId === category.id);

      acc[category.id] = this.budgetService.subtotalByMonths(
        children.map((c) => c.id),
        months,
        values
      );
      return acc;
    }, {} as { [key: string]: number[] });
  });

  incomeTotals = computed(() => {
    const months = this.filteredMonths();
    const values = this.values();

    const incomeChildren = this.incomes();

    return months.map((month) =>
      incomeChildren.reduce(
        (sum, child) => sum + this.budgetService.sumRecursive(child, month, values),
        0
      )
    );
  });

  expensesTotals = computed(() => {
    const months = this.filteredMonths();
    const values = this.values();

    const incomeChildren = this.expenses();

    return months.map((month) =>
      incomeChildren.reduce(
        (sum, child) => sum + this.budgetService.sumRecursive(child, month, values),
        0
      )
    );
  });

  profitOrLoss = computed(() =>
    this.budgetService.profitOrLoss(this.incomeTotals(), this.expensesTotals())
  );

  openingBalance = computed(() => {});

  openingBalances = computed(() => {
    const months = this.filteredMonths();
    const incomeTotals = this.incomeTotals();
    const expenseTotals = this.expensesTotals();

    const openings: number[] = [];
    let running = 0; // tháng đầu tiên mở bằng 0

    months.forEach((_, index) => {
      openings.push(running);
      running += (incomeTotals[index] ?? 0) - (expenseTotals[index] ?? 0);
    });

    return openings;
  });

  closingBalances = computed(() => {
    const months = this.filteredMonths();
    const incomeTotals = this.incomeTotals();
    const expenseTotals = this.expensesTotals();

    const closings: number[] = [];
    let running = 0;

    months.forEach((_, index) => {
      running += (incomeTotals[index] ?? 0) - (expenseTotals[index] ?? 0);
      closings.push(running);
    });

    return closings;
  });

  handleKeyDown(
    event: KeyboardEvent,
    cell: HTMLInputElement,
    parentId: string,
    childCategory: CategoryNode
  ) {
    const table = document.getElementById('simpleTable1');
    if (!table) return;

    const allInputs = Array.from(table.querySelectorAll<HTMLInputElement>('input[type=number]'));
    const currentIndexGlobal = allInputs.indexOf(cell);

    const groupSelector = `input[type=number][data-parent-id="${parentId}"]`;
    const groupInputs = Array.from(table.querySelectorAll<HTMLInputElement>(groupSelector));
    const currentIndexInGroup = groupInputs.indexOf(cell);

    switch (event.key) {
      case 'Tab': {
        event.preventDefault();

        if (event.shiftKey) {
          if (currentIndexGlobal > 0) allInputs[currentIndexGlobal - 1].focus();
        } else {
          if (currentIndexGlobal + 1 < allInputs.length) allInputs[currentIndexGlobal + 1].focus();
        }

        if (!event.shiftKey && currentIndexInGroup === groupInputs.length - 1) {
          this.addChildCategory(parentId, childCategory.type);

          setTimeout(() => {
            const refreshedGroup = Array.from(
              table.querySelectorAll<HTMLInputElement>(groupSelector)
            );
            const cols = this.filteredMonths().length;
            const firstCellOfNewRow = refreshedGroup[refreshedGroup.length - cols];
            firstCellOfNewRow?.focus();
          });
        }
        break;
      }

      case 'ArrowRight':
        if (currentIndexGlobal + 1 < allInputs.length) allInputs[currentIndexGlobal + 1].focus();
        break;

      case 'ArrowLeft':
        if (currentIndexGlobal > 0) allInputs[currentIndexGlobal - 1].focus();
        break;

      case 'ArrowUp': {
        const cols = this.filteredMonths().length;
        if (currentIndexGlobal - cols >= 0) allInputs[currentIndexGlobal - cols].focus();
        break;
      }

      case 'ArrowDown': {
        const cols = this.filteredMonths().length;
        if (currentIndexGlobal + cols < allInputs.length)
          allInputs[currentIndexGlobal + cols].focus();
        break;
      }

      case 'Enter': {
        event.preventDefault();
        this.addChildCategory(parentId, childCategory.type);
        setTimeout(() => {
          const refreshedGroup = Array.from(
            table.querySelectorAll<HTMLInputElement>(groupSelector)
          );
          const cols = this.filteredMonths().length;
          const firstCellOfNewRow = refreshedGroup[refreshedGroup.length - cols];
          firstCellOfNewRow?.focus();
        });
        break;
      }

      case 'Delete':
        event.preventDefault();
        this.removeChildCategory(childCategory.id);
        setTimeout(() => {
          const updatedInputs = Array.from(
            table!.querySelectorAll<HTMLInputElement>('input[type=number]')
          );
          const nextIndex =
            currentIndexGlobal < updatedInputs.length
              ? currentIndexGlobal
              : updatedInputs.length - 1;
          updatedInputs[nextIndex]?.focus();
        });
        break;
    }
  }

  handleKeyEnter(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      const input = event.target as HTMLInputElement;
      const value = input.value.trim();
      if (value) {
        this.addChildCategory(this.categories()[0].id, 'income', value);
        input.value = '';
      }
    }
  }

  addParentCategory(type: 'income' | 'expense', name = 'New Category') {
    const newId = Date.now().toString();

    this.categories.update((old) => [
      ...old,
      {
        id: newId,
        parentId: null,
        type,
        name,
        children: [],
      },
    ]);
  }

  addChildCategory(parentId: string, type: 'income' | 'expense', name = 'New Sub Category') {
    const newId = Date.now().toString();

    this.categories.update((old) => [
      ...old,
      {
        id: newId,
        parentId,
        type,
        name,
        children: [],
        isEditable: true,
      },
    ]);
  }

  editNameCategory(categoryId: string, newName: string) {
    this.categories.update((old) => {
      const category = old.find((c) => c.id === categoryId);
      if (category) {
        category.name = newName;
      }
      return [...old];
    });
  }

  removeChildCategory(childId: string) {
    this.categories.update((prev) => prev.filter((c) => c.id !== childId));
  }

  openDialog(event: MouseEvent, categoryId: string, month: string): void {
    event.preventDefault();

    const dialogRef = this.dialog.open(Dialog, {
      data: { categoryId, month },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.applyToAll(categoryId, month);
      }
    });
  }

  applyToAll(categoryId: string, month: string) {
    const value = this.values()[categoryId]?.[month] || 0;

    this.categories().forEach((cat) => {
      if (cat.id !== categoryId) {
        this.filteredMonths().forEach((m) => {
          this.updateValue(cat.id, m, value);
        });
      }
    });
  }
}
