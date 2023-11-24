import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-view-profile',
  templateUrl: './dialog-view-profile.component.html',
  styleUrls: ['./dialog-view-profile.component.scss']
})
export class DialogViewProfileComponent {
  editState: boolean = true;
  constructor(public dialogRef: MatDialogRef<DialogViewProfileComponent>) { }


  closeDialog() {
    this.dialogRef.close();
  }
}