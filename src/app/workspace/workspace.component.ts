import { Component, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogAddChannelComponent } from '../dialog-add-channel/dialog-add-channel.component';
import { Firestore, collection, doc, getDocs, onSnapshot, orderBy, query } from '@angular/fire/firestore';
import { Channel } from 'src/models/channel.class';
import { ChatService } from '../chat.service';
import { ThreadService } from '../thread.service';
import { UserService } from '../user.service';
import { Chat } from 'src/models/chat.class';
import { User } from 'src/models/user.class';
import { deleteDoc } from 'firebase/firestore';

@Component({
  selector: 'app-workspace',
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.scss', './workspace.component.mediaquery.scss']
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
    // this.chatservice.chatWindow = 'empty';
  }

  openDialog() {
    this.dialog.open(DialogAddChannelComponent, { panelClass: 'dialog-container' });
  }

  renderChannel(channel: Channel) {
    if (this.currentChat != undefined)
      this.chatservice.setViewedByMe(this.currentChat, this.userService.currentUser);
    console.log(this.currentChat);

    this.chatservice.openChat = channel;
    this.chatservice.chatWindow = 'channel';
    this.chatservice.setViewedByMe(this.currentChat, this.currentUser as User)
  }

  unreadMsg(channel: Channel) {
    if (channel.viewedBy.includes(this.currentUser.id) || this.currentChat?.id == channel.id) {
      return false;
    } else {
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

  async deleteDirectMessageChat(chatId: any) {
    const directDocRef = doc(collection(this.firestore, 'direct messages'), chatId);
    const directSubColRef = collection(this.firestore, `direct messages/${chatId}/messages`);
    const messagesQuerySnapshot = await getDocs(directSubColRef);
    messagesQuerySnapshot.forEach(async (doc) => {
      await deleteDoc(doc.ref);
    });
    // Lösche das Hauptdokument
    await deleteDoc(directDocRef);
    this.chatservice.chatWindow = 'empty';
  }


}