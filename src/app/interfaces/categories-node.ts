export interface CategoryNode {
  id: string;
  name: string;
  type: 'income' | 'expense';
  parentId?: string | null;
  children?: CategoryNode[];
  isEditable?: boolean;
}
