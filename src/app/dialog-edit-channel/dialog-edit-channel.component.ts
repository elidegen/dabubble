import { Component, OnInit, inject } from '@angular/core';
import { Channel } from 'src/models/channel.class';
import { ChatService } from '../chat.service';
import { MatDialogRef } from '@angular/material/dialog';
import { UserService } from '../user.service';
import { Firestore, collection, doc, getDoc, updateDoc } from '@angular/fire/firestore';


@Component({
  selector: 'app-dialog-edit-channel',
  templateUrl: './dialog-edit-channel.component.html',
  styleUrls: ['./dialog-edit-channel.component.scss']
})
export class DialogEditChannelComponent implements OnInit {
  editName: boolean = false;
  editDescription: boolean = false;
  currentChat!: Channel | undefined;
  allChannelMembers: any[] = [];
  channel: Channel = new Channel();
  firestore: Firestore = inject(Firestore);
  currentUser;
  newChannelMembers: any[] = [];

  constructor(private chatService: ChatService, public dialogRef: MatDialogRef<DialogEditChannelComponent>, public userService: UserService) {
    this.currentUser = this.userService.currentUser;
   }

  ngOnInit() {
    this.chatService.openChat$.subscribe((openChat) => {
      if (openChat) {
        this.currentChat = openChat as Channel;
        this.getAllChannelMembers();
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
          const channelMembersJson = channelData?.['members'] || [];
          const channelMembers = JSON.parse(channelMembersJson);
          console.log('Channel Members:', channelMembers);
          this.allChannelMembers = channelMembers;
        } else {
          console.log('Channel document does not exist.');
        }
      } catch (error) {
        console.error('Error getting channel document:', error);
      }
    }
  }

  async deleteCurrentUserFromChannel() {
    this.deleteCurrentUser();

    if (this.currentChat) {
      const channelDocRef = doc(collection(this.firestore, 'channels'), this.currentChat.id);
      this.channel.members = this.newChannelMembers;
      this.channel.name = this.currentChat.name;
      this.channel.id = this.currentChat.id;
      this.channel.description = this.currentChat.description;
      await updateDoc(channelDocRef, this.channel.toJSON()).catch((error) => {
        console.error('Error updating document:', error);
      });
    }
    this.dialogRef.close();
  }


  deleteCurrentUser() {
    const currentUserisMember = this.allChannelMembers.some(user => user.id === this.currentUser.id);
    if (currentUserisMember) {
      this.allChannelMembers = this.allChannelMembers.filter(user => user.id !== this.currentUser.id);
      this.newChannelMembers = this.allChannelMembers;
      console.log('no currentUser', this.newChannelMembers );
      
    }
  }

}