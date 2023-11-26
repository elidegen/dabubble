import { Component } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DialogAddToGroupComponent } from '../dialog-add-to-group/dialog-add-to-group.component';

@Component({
  selector: 'app-dialog-show-group-member',
  templateUrl: './dialog-show-group-member.component.html',
  styleUrls: ['./dialog-show-group-member.component.scss']
})
export class DialogShowGroupMemberComponent {

  constructor(public dialog: MatDialog, public dialogRef: MatDialogRef<DialogAddToGroupComponent>) { }

  openDialog() {
    this.dialog.open(DialogAddToGroupComponent, {
      panelClass: 'dialog-container'
    });
  }
}
