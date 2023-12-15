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

  /**
   * Initializes the component, loading channels, direct messages, and users.
   */
  ngOnInit(): void {
    this.loadChannels();
    this.loadDirectMessages();
    this.loadUsers();
  }

  /**
   * Cleans up subscriptions when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.unsubscribeChannels;
    this.unsubscribeChats;
    this.unsubscribeUsers;
    if (this.unSubMessages) {
      this.unSubMessages();
    }
  }

  /**
   * Loads all channels from the Firestore and sets up a subscription.
   */
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

  /**
   * Loads all direct messages from the Firestore and sets up a subscription.
   */
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

  /**
   * Loads all users from the Firestore and sets up a subscription.
   */
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

  /**
   * Filters the channels to show only those relevant to the current user.
   */
  getPersonalChannels() {
    this.yourChannels = [];
    if (this.userService.currentUser.name == "Guest") {
      this.yourChannels = this.chatservice.allChannels;
    } else {
      this.yourChannels = this.chatservice.yourChannels;
    }
  }

  /**
   * Filters the direct messages to show only those relevant to the current user.
   */
  getPersonalDirectMessages() {
    this.personalDirectMessages = [];
    this.allDirectMessages.forEach(chat => {
      if (chat.members.find((member: { id: string; }) => member.id === this.currentUser.id)) {
        this.personalDirectMessages.push(chat);
      }
    });
  }

  /**
   * Opens a dialog to add a new channel or navigates to the add channel page on mobile.
   */
  openDialog() {
    if (this.chatservice.isMobile) {
      this.router.navigate(['add-channel'])
    } else {
      this.dialog.open(DialogAddChannelComponent, { panelClass: 'dialog-container' });
    }
  }

  /**
   * Opens a specific channel in the chat service.
   * @param {Channel} channel - The channel to be opened.
   */
  renderChannel(channel: Channel) {
    this.chatservice.openChat = channel;
    this.chatservice.chatWindow = 'channel';
    this.threadService.changeChat.emit();
    if (this.chatservice.isMobile) {
      this.router.navigate(['main']);
    }
  }

  /**
   * Opens a specific chat in the chat service.
   * @param {Chat} chat - The chat to be opened.
   */
  openChat(chat: Chat) {
    this.chatservice.renderDirectMessage(chat);
    if (!this.chatservice.isMobile) {
      this.threadService.changeChat.emit();
    }
  }

  /**
   * Sets the chat window to start a new message.
   */
  startNewMessage() {
    this.chatservice.chatWindow = 'newMessage';
  }

  
  /**
   * Deletes a specific direct message chat from the Firestore database.
   * @param {any} chatId - The ID of the chat to be deleted.
   */
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


  /**
   * Renders a new main chat window.
   */
  renderNewMainChat() {
    this.chatservice.chatWindow = 'newMessage';
    if (this.chatservice.isMobile) {
      this.router.navigate(['newMessage']);
    }
  }

  getOtherUser(members: any[]) {
    let otherUser = members.find(member => member.id !== this.userService.currentUser.id);
    let interlocutor = this.allUsers.find(user => user.id == otherUser.id);
    return interlocutor;
  }
}