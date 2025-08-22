export interface Category {
  id: string;
  name: string;
  parentId?: string;   // null nếu là parent category
  type: 'income' | 'expense';
}

export interface BudgetCell {
  categoryId: string;
  month: string;   // '2025-01'
  amount: number;
}
