import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogEditChannelComponent } from '../dialog-edit-channel/dialog-edit-channel.component';
import { DialogAddToGroupComponent } from '../dialog-add-to-group/dialog-add-to-group.component';

@Component({
  selector: 'app-main-chat',
  templateUrl: './main-chat.component.html',
  styleUrls: ['./main-chat.component.scss']
})
export class MainChatComponent {

  constructor(public dialog: MatDialog) { }

  openEditChannelDialog() {
    this.dialog.open(DialogEditChannelComponent, {
      panelClass: 'dialog-edit-channel'
    });
  }

  openDialog() {
    const dialogRef = this.dialog.open(DialogAddToGroupComponent, {
      panelClass: 'dialog-container'
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
  }

}
