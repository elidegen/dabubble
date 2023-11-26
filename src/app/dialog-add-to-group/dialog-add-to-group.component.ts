import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-add-to-group',
  templateUrl: './dialog-add-to-group.component.html',
  styleUrls: ['./dialog-add-to-group.component.scss']
})
export class DialogAddToGroupComponent {
  constructor(public dialogRef: MatDialogRef<DialogAddToGroupComponent>) { }

}
