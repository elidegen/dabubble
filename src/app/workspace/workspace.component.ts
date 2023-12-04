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
  allDirectMessages : Chat[] = [];
  personalDirectMessages: Chat[] = [];
  unsubscribeUsers: any;
  allUsers: User[] = [];
  usersOfDirectMessage: User[] = [];

  constructor(public dialog: MatDialog, public chatservice: ChatService, public threadService: ThreadService, public userService: UserService) {
    this.currentUser = userService.currentUser;
  }

  ngOnInit(): void {
    this.loadChannels();
    this.loadDirectMessages();
    this.loadUsers();
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
        console.log(channel);
        this.yourChannels.push(channel);
      }
    });
  }
  

  getPersonalDirectMessages() {
    this.personalDirectMessages = [];
    this.allDirectMessages.forEach(chat => {
      if(chat.members.some((member: {id: string; }) => member.id === this.currentUser.id)) {
        this.personalDirectMessages.push(chat);
      }
    });
    console.log('own', this.personalDirectMessages);
  }


  getOtherUserName(members: any[]) {
    let otherUser = members.find(member => member.email !== this.currentUser.email);
    return otherUser ? otherUser.name : '';
  }


  getUserProfileForDirectMessage(members: any[]) {
    let otherUser = members.find(member => member.email !== this.currentUser.email);
    let userProfile = this.allUsers.find(user => user.email == otherUser.email);
    return userProfile ? userProfile.picture : '';
  }


  // onlineStatus für später -----------------------------------------------------

  getUserStatusForDirectMessage(otherUser: any) {
    let userProfile = this.allUsers.find(user => user.email == otherUser.email);
    return userProfile ? userProfile.online : '';
  }
  // -----------------------------------------------------------------------------


  openDialog() {
    this.dialog.open(DialogAddChannelComponent, { panelClass: 'dialog-container' });
  }

  renderChannel(channel: Channel) {
    this.chatservice.openChat = channel;
    this.threadService.currentChat = channel;
    this.chatservice.chatWindow = 'channel'
  }



  renderDirectMessage(chat: Chat) {
    this.chatservice.openDirectMessage = chat;
    this.chatservice.chatWindow = 'direct';
  }
  

  ngOnDestroy(): void {
    this.unsubscribeChannels;
    this.unsubscribeChats;
    this.unsubscribeUsers;
  }


  startNewMessage() {
    this.chatservice.chatWindow = 'newMessage';
  }
}