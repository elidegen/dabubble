import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogAddChannelComponent } from '../dialog-add-channel/dialog-add-channel.component';

@Component({
  selector: 'app-main-chat',
  templateUrl: './main-chat.component.html',
  styleUrls: ['./main-chat.component.scss']
})
export class MainChatComponent {

  constructor(public dialog: MatDialog) {}

openEditChannelDialog() {
  this.dialog.open(DialogAddChannelComponent, {
    panelClass: 'dialog-edit-channel'});

}

}
