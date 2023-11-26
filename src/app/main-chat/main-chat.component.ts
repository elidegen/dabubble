import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogEditChannelComponent } from '../dialog-edit-channel/dialog-edit-channel.component';
import { DialogAddToGroupComponent } from '../dialog-add-to-group/dialog-add-to-group.component';
import { DialogShowGroupMemberComponent } from '../dialog-show-group-member/dialog-show-group-member.component';
import { MatDrawer } from '@angular/material/sidenav';
import { DocumentReference, FieldValue, Firestore, addDoc, arrayUnion, collection, doc, updateDoc } from '@angular/fire/firestore';
import { ChatService } from '../chat.service';
import { Channel } from 'src/models/channel.class';
import { Message } from 'src/models/message.class';
import { getDocs, onSnapshot, orderBy, query } from 'firebase/firestore';
import { UserService } from '../user.service';

@Component({
  selector: 'app-main-chat',
  templateUrl: './main-chat.component.html',
  styleUrls: ['./main-chat.component.scss']
})
export class MainChatComponent implements OnInit {
  firestore: Firestore = inject(Firestore);
  currentChat!: Channel | undefined;
  @ViewChild('thread') threadDrawer!: MatDrawer;
  message: Message = new Message();
  allMessages: Message[] = [];
  unSubMessages: any;

  constructor(public dialog: MatDialog, private chatService: ChatService, private userService: UserService) {
    
  }

  ngOnInit() {
    this.chatService.openChat$.subscribe((openChat) => {
      if (openChat) {
        this.currentChat = openChat as Channel;
        this.loadMessages();
        console.log('currentChat updated: ', this.currentChat);
      }
    });

    
  }

  ngOnDestroy() {
    this.unSubMessages;
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

  

  onCloseThread() {
    this.threadDrawer.close();
  }

  async sendMessage() {
    if (this.currentChat?.id) {
      this.getSentMessageTime();
      this.getSentMessageDate();
      this.getSentMessageCreator();
      const subColRef = collection(this.firestore, `channels/${this.currentChat.id}/messages`);
      await addDoc(subColRef, this.message.toJSON())
      .catch((err) => {
        console.log(err);
      })
      .then((result: any) => {
        this.message.content = '';
        console.log('Message sent', result);
      });
    }
  }

  async loadMessages() {
    if (this.currentChat?.id) {
      const messageCollection = collection(this.firestore, `channels/${this.currentChat.id}/messages`);
      this.unSubMessages = onSnapshot(messageCollection, (snapshot) => {
        this.allMessages = snapshot.docs.map(doc => {
          const message = doc.data() as Message;
          message.id = doc.id;
          console.log('check Message', message);
          
          return message;
          });
      });
    }
  }

  getSentMessageDate() {
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString();
    this.message.date = formattedDate;
  }



  getSentMessageTime() {
    const currentTime = new Date();
    const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.message.time = formattedTime;
  }

  getSentMessageCreator() {
    const name = this.userService.currentUser.name;
    const profilePic = this.userService.currentUser.picture;

    this.message.creator = name;
    this.message.profilePic = profilePic;

  }



  getSingleDocRef(colId: string, docId: string) {
    return doc(collection(this.firestore, colId), docId);
  }
  
  getChannelsRef() {
    return collection(this.firestore, 'channels');
  }
}