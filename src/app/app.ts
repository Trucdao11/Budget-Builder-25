import { Component, signal } from '@angular/core';
import { BudgetTable } from "./components/budget-table/budget-table";

@Component({
  selector: 'app-root',
  imports: [ BudgetTable],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('budget-builder');
}
