import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
@Component({
  selector: 'app-dialog',
  imports: [MatDialogModule, MatButtonModule, CommonModule],
  templateUrl: './dialog.html',
  styleUrl: './dialog.scss'
})
export class Dialog {
constructor(
    public dialogRef: MatDialogRef<Dialog>,
    @Inject(MAT_DIALOG_DATA) public data: { categoryId: string; month: string }
  ) {}

  onApply() {
    this.dialogRef.close(true);
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
