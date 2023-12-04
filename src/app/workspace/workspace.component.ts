import { Component, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogAddChannelComponent } from '../dialog-add-channel/dialog-add-channel.component';
import { Firestore, collection, doc, onSnapshot, orderBy, query } from '@angular/fire/firestore';
import { Channel } from 'src/models/channel.class';
import { ChatService } from '../chat.service';
import { ThreadService } from '../thread.service';
import { UserService } from '../user.service';
import { Chat } from 'src/models/chat.class';
import { User } from 'src/models/user.class';
import { updateDoc } from 'firebase/firestore';

@Component({
  selector: 'app-workspace',
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.scss']
})
export class WorkspaceComponent implements OnInit {
  firestore: Firestore = inject(Firestore);
  panelOpenState: boolean = true;
  allChannels: Channel[] = [];
  yourChannels: Channel[] = [];
  unsubscribeChannels: any;
  currentUser;
  unsubscribeChats: any;
  allDirectMessages: Chat[] = [];
  personalDirectMessages: Chat[] = [];
  unsubscribeUsers: any;
  allUsers: User[] = [];
  usersOfDirectMessage: User[] = [];
  currentChat: any;
  unSubMessages: any;

  constructor(public dialog: MatDialog, public chatservice: ChatService, public threadService: ThreadService, public userService: UserService) {
    this.currentUser = userService.currentUser;
  }

  ngOnInit(): void {
    this.loadChannels();
    this.loadDirectMessages();
    this.loadUsers();
    
    this.chatservice.openChat$.subscribe((openChat) => {
      if (openChat) {
        const newChat = openChat as Channel;
        if (!this.currentChat || this.currentChat.id !== newChat.id) {
          this.currentChat = newChat;
          this.threadService.currentChat = newChat;
          if (this.unSubMessages) {
            this.unSubMessages();
          }
        }
      } else {
        this.currentChat = undefined;
      }
    });
  }

  loadChannels() {
    this.unsubscribeChannels = onSnapshot(
      query(collection(this.firestore, "channels"), orderBy("name")),
      (snapshot) => {
        this.allChannels = snapshot.docs.map((doc) => {
          const channel = doc.data() as Channel;
          channel.id = doc.id;
          return channel;
        });
        this.getPersonalChannels();
      }
    );
  }


  loadDirectMessages() {
    this.unsubscribeChats = onSnapshot(
      query(collection(this.firestore, "direct messages"), orderBy("name")),
      (snapshot) => {
        this.allDirectMessages = snapshot.docs.map((doc) => {
          const chat = doc.data() as Chat;
          return chat;
        });
        this.getPersonalDirectMessages();
      }
    );
  }

  loadUsers() {
    this.unsubscribeUsers = onSnapshot(
      query(collection(this.firestore, "users"), orderBy("name")),
      (snapshot) => {
        this.allUsers = snapshot.docs.map((doc) => {
          const user = doc.data() as User;
          return user;
        });
      }
    );
  }


  getPersonalChannels() {
    this.yourChannels = [];
    this.allChannels.forEach(channel => {
      if (channel.members.some((member: { id: string; }) => member.id === this.currentUser.id)) {
        // console.log(channel);
        this.yourChannels.push(channel);
      }
    });
  }

  getPersonalDirectMessages() {
    this.personalDirectMessages = [];
    this.allDirectMessages.forEach(chat => {
      if (chat.members.find((member: { id: string; }) => member.id === this.currentUser.id)) {
        this.personalDirectMessages.push(chat);
      }
    });
  }

  openDialog() {
    this.dialog.open(DialogAddChannelComponent, { panelClass: 'dialog-container' });
  }

  renderChannel(channel: Channel) {
    this.chatservice.openChat = channel;
    this.chatservice.chatWindow = 'channel';
  }


  unreadMsg(channel: Channel) {
    // console.log('chatserv', this.currentChat?.id);
    // console.log('chanel unreadmsg', channel.id);
    if (channel.viewedBy?.length > 0 && channel.viewedBy.includes(this.currentUser.id) || this.currentChat?.id == channel.id) {
      // console.log('includes crnt usr', channel.name, channel.viewedBy);
      return false;
    } else {
      // console.log('not crnt usr', channel.name, channel.viewedBy);
      return true;
    }
  }


  ngOnDestroy(): void {
    this.unsubscribeChannels;
    this.unsubscribeChats;
    this.unsubscribeUsers;

    if (this.unSubMessages) {
      this.unSubMessages();
    }
  }

  startNewMessage() {
    this.chatservice.chatWindow = 'newMessage';
  }
}