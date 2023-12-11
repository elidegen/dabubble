import { Component, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogAddChannelComponent } from '../dialog-add-channel/dialog-add-channel.component';
import { Firestore, collection, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, updateDoc } from '@angular/fire/firestore';
import { Channel } from 'src/models/channel.class';
import { ChatService } from '../chat.service';
import { ThreadService } from '../thread.service';
import { UserService } from '../user.service';
import { Chat } from 'src/models/chat.class';
import { User } from 'src/models/user.class';
import { deleteDoc } from 'firebase/firestore';
import { first, interval } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-workspace',
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.scss', './workspace.component.mediaquery.scss']
})
export class WorkspaceComponent implements OnInit {
  firestore: Firestore = inject(Firestore);
  panelOpenState: boolean = true;
  channel: Channel = new Channel;
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
  unSubInterval: any;
  currentDM: any;

  constructor(public dialog: MatDialog, public chatservice: ChatService,
    public threadService: ThreadService, public userService: UserService, public router: Router) {
    this.currentUser = userService.currentUser;
  }

  ngOnInit(): void {
    this.loadChannels();
    this.loadDirectMessages();
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.unsubscribeChannels;
    this.unsubscribeChats;
    this.unsubscribeUsers;

    if (this.unSubMessages) {
      this.unSubMessages();
    }
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
  if (this.userService.currentUser.name == "Guest") {
    this.yourChannels = this.chatservice.allChannels;
  } else {
    this.yourChannels = this.chatservice.yourChannels;
  }
 
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
    if (this.chatservice.isMobile) {
      this.router.navigate(['add-channel'])
    } else {
      this.dialog.open(DialogAddChannelComponent, { panelClass: 'dialog-container' });
    }
  }

  renderChannel(channel: Channel) {
    this.chatservice.openChat = channel;
    this.chatservice.chatWindow = 'channel';
    this.threadService.changeChat.emit();
    if (this.chatservice.isMobile) {
      this.router.navigate(['main']);
    }
  }

  openChat(chat: Chat) {
    this.chatservice.renderDirectMessage(chat);
    if (!this.chatservice.isMobile) {
      this.threadService.changeChat.emit();
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
    await deleteDoc(directDocRef);
    this.chatservice.chatWindow = 'empty';
  }

  renderNewMainChat() {
    this.chatservice.chatWindow = 'newMessage';
    this.router.navigate(['main']);
  }
}