import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BudgetTable } from './budget-table';

describe('BudgetTable', () => {
  let component: BudgetTable;
  let fixture: ComponentFixture<BudgetTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BudgetTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BudgetTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
