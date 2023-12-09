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
    // Startet das Intervall, um die Funktion alle 1000 Millisekunden (1 Sekunde) aufzurufen
    this.unSubInterval = interval(1000).subscribe(() => {
      if (this.currentChat != undefined)
        this.setReadDM();
      this.yourChannels.forEach(channel => {
        this.updateUnreadMsg(channel);
      });
    });
  }

  ngOnDestroy(): void {
    this.unSubInterval;
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
    this.chatservice.openChat = channel;
    this.chatservice.chatWindow = 'channel';
  }

  async setLastTimeViewed(channelToSet: Channel) {
    const channelDocRef = doc(collection(this.firestore, 'channels'), channelToSet.id);
    const channel = (await getDoc(channelDocRef)).data();
    let channelLTV = channel?.['lastTimeViewed'] ?? [];
    const lastTimeViewedIndex = channelLTV.findIndex((obj: { userId: string | undefined; }) => obj.userId == this.currentUser.id);
    if (lastTimeViewedIndex != -1) {
      channelLTV[lastTimeViewedIndex].timestamp = new Date().getTime();
    } else {
      channelLTV.push({
        userId: this.currentUser.id,
        timestamp: new Date().getTime()
      })
    }
    channelToSet.lastTimeViewed = channelLTV;
    this.updateFirestoreLTV(channelToSet);
  }

  async setReadDM() {
    if (!('creator' in this.currentChat)) {
      this.currentChat.unread = false;
      // const channelDocRef = doc(collection(this.firestore, 'direct messages'), this.currentChat.id);
    }
  }

  openChat(chat: Chat) {
    this.chatservice.renderDirectMessage(chat);
    this.currentChat = chat;
  }

  async updateFirestoreLTV(channelToUpdate: Channel) {
    const channelDocRef = doc(collection(this.firestore, 'channels'), channelToUpdate.id);
    await updateDoc(channelDocRef, {
      lastTimeViewed: channelToUpdate.lastTimeViewed
    })
  }

  getLastMsgTimestamp(channel: Channel) {
    const messageCollection = collection(this.firestore, `channels/${channel.id}/messages`);
    const q = query(messageCollection, orderBy('timeInMs', 'desc'), limit(1));
    return new Promise<number>((resolve) => {
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const documents = snapshot.docs;
          const firstDocumentData = documents[0].data();
          const timeInMs = firstDocumentData['timeInMs'];
          unsubscribe();
          resolve(timeInMs);
        } else {
          unsubscribe();
          resolve(0);
        }
      });
    });
  }

  async updateUnreadMsg(channel: Channel) {

    if (this.currentChat && 'creator' in this.currentChat) {
      await this.setLastTimeViewed(this.currentChat);
    }
    const lastMsgTimeStamp = await this.getLastMsgTimestamp(channel);
    const lastTimeViewed = await this.getLastTimeViewed(channel)

    if (lastMsgTimeStamp > lastTimeViewed) {
      this.currentUser.unreadChats = [];
      this.currentUser.unreadChats.push(channel.id);
      this.userService.updateUser(this.currentUser);
    }

    if (this.currentUser.unreadChats != undefined && this.currentChat != undefined) {

      const index = this.currentUser.unreadChats.findIndex((obj: String) => obj == this.currentChat.id)
      if (index != -1) {
        this.currentUser.unreadChats.splice(index, 1);
      }
    }
  }

  getLastTimeViewed(channel: Channel) {
    let channelLTV = channel['lastTimeViewed'] ?? [];
    const lastTimeViewedIndex = channelLTV.findIndex((obj: { userId: string | undefined; }) => obj.userId == this.currentUser.id);
    if (lastTimeViewedIndex != -1) {
      return channelLTV[lastTimeViewedIndex].timestamp;
    } else {
      return 0;
    }
  }

  removeUnreadChats(channel: Channel, user: User) {
    const channelIndex = user.unreadChats.findIndex((obj: string | undefined) => obj == channel.id);
    user.unreadChats.splice(channelIndex, 1);
  }

  unreadMsg(channel: Channel) {
    this.currentUser.unreadChats = this.currentUser.unreadChats ?? [];
    return this.currentUser.unreadChats.includes(channel.id);
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

  unreadDM(directMessage: any) {
    // console.log(directMessage);

    return directMessage.unread == true;
  }
}