import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogEditChannelComponent } from '../dialog-edit-channel/dialog-edit-channel.component';
import { DialogAddToGroupComponent } from '../dialog-add-to-group/dialog-add-to-group.component';
import { DialogShowGroupMemberComponent } from '../dialog-show-group-member/dialog-show-group-member.component';
import { MatDrawer } from '@angular/material/sidenav';
import { Firestore } from '@angular/fire/firestore';
import { ChatService } from '../chat.service';

@Component({
  selector: 'app-main-chat',
  templateUrl: './main-chat.component.html',
  styleUrls: ['./main-chat.component.scss']
})
export class MainChatComponent {
  firestore: Firestore = inject(Firestore);
  currentChat: any;

  constructor(public dialog: MatDialog, private chatService: ChatService) {
    if (this.chatService.openChat)
      this.currentChat = chatService.openChat;
    console.log('currentChat: ', this.currentChat);
  }

  openEditChannelDialog() {
    this.dialog.open(DialogEditChannelComponent, {
      panelClass: 'dialog-container'
    });
  }

  openDialog() {
    this.dialog.open(DialogAddToGroupComponent, {
      panelClass: 'dialog-container'
    });
  }

  openMemberDialog() {
    this.dialog.open(DialogShowGroupMemberComponent, {
      panelClass: 'dialog-container'
    });
  }

  @ViewChild('thread') threadDrawer!: MatDrawer;

  onCloseThread() {
    this.threadDrawer.close();
  }
}