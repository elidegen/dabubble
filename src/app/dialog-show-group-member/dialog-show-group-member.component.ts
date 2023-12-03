import { Component, OnInit, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DialogAddToGroupComponent } from '../dialog-add-to-group/dialog-add-to-group.component';
import { ChatService } from '../chat.service';
import { Channel } from 'src/models/channel.class';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { AuthService } from '../auth.service';
import { UserService } from '../user.service';


@Component({
  selector: 'app-dialog-show-group-member',
  templateUrl: './dialog-show-group-member.component.html',
  styleUrls: ['./dialog-show-group-member.component.scss']
})
export class DialogShowGroupMemberComponent implements OnInit {
  currentChat!: Channel | undefined;
  allChannelMembers: any[] = [];
  firestore: Firestore = inject(Firestore);

  constructor(public dialog: MatDialog, public dialogRef: MatDialogRef<DialogAddToGroupComponent>, public chatService: ChatService, public authService: AuthService, public userService: UserService) { }

  openDialog() {
    this.dialog.open(DialogAddToGroupComponent, {
      panelClass: 'dialog-container'
    });
  }

  ngOnInit() {
    this.chatService.openChat$.subscribe((openChat) => {
      if (openChat) {
        const newChat = openChat as Channel;
        if (!this.currentChat || this.currentChat.id !== newChat.id) {
          this.currentChat = newChat;
          this.getAllChannelMembers();
        }
      }
    });
  }


  async getAllChannelMembers() {
    if (this.currentChat?.id) {
      const channelDocRef = doc(this.firestore, `channels/${this.currentChat.id}`);
      try {
        const channelDocSnap = await getDoc(channelDocRef);
        if (channelDocSnap.exists()) {
          const channelData = channelDocSnap.data();
          this.allChannelMembers =  channelData?.['members'];
          this.updateOnlineStatus();
        } else {
          console.log('Channel document does not exist.');
        }
      } catch (error) {
        console.error('Error getting channel document:', error);
      }
    }
  }


  updateOnlineStatus() {
    this.allChannelMembers.forEach(member => {
     let userIndex = this.authService.findUserIndexWithEmail(member.email);
    member.online = this.userService.users[userIndex].online;
    console.log("Online Status geupdated", member.online);
    });
  }
}
