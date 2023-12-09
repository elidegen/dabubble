import { Injectable, OnInit, inject } from '@angular/core';
import { Firestore, getDoc, limit, onSnapshot, orderBy, query, setDoc, updateDoc } from '@angular/fire/firestore';
import { DocumentData, DocumentReference, collection, doc } from 'firebase/firestore';
import { Channel } from 'src/models/channel.class';
import { Chat } from 'src/models/chat.class';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from 'src/models/user.class';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private _openChatSubject: BehaviorSubject<Channel | Chat | null> = new BehaviorSubject<Channel | Chat | null>(null);
  private _openDirectMessageSubject: BehaviorSubject<Chat | null> = new BehaviorSubject<Chat | null>(null);
  firestore: Firestore = inject(Firestore)
  chatWindow = 'empty';
  chat: Chat = new Chat();
  unSubChannels: any;
  unSubMessages: any;
  allChannels: any[] = [];
  allDirectMessages: any[] = [];
  allLoadedDirectMessages: any[] = [];
  yourChannels: any[] = [];
  yourDirectMessages: any[] = [];
  allMessagesOfChannel: any[] = [];
  unSubUsers: any;
  unSubDirectMessages: any;
  allUsers: any[] = [];
  allMessagesOfDM: any[] = [];

  constructor(public userService: UserService) {
    this.getallChannels();
    this.getAllUsers();
    this.loadAllDirectMessages();
  }

  ngOnDestroy() {
    this.unSubDirectMessages();
  }

  // -------------- channel -----------------------
  get openChat$(): Observable<Channel | Chat | null> {
    return this._openChatSubject.asObservable();
  }

  set openChat(value: Channel | Chat | null) {
    this._openChatSubject.next(value);
  }

  // ----------------- Direct Message --------------------------
  get openDirectMessage$(): Observable<Chat | null> {
    return this._openDirectMessageSubject.asObservable();
  }

  set openDirectMessage(value: Chat | null) {
    this._openDirectMessageSubject.next(value);
  }

  // Create direct messages ------------------------------
  async createDirectMessage(user: User) {
    this.checkUserForDirectMessageName(user);
    const directMessageRef = collection(this.firestore, 'direct messages');
    const specificDocRef: DocumentReference<DocumentData> = doc(directMessageRef, this.checkUserForId(user));
    const docSnapshot = await getDoc(specificDocRef);
    if (!docSnapshot.exists()) {
      await setDoc(specificDocRef, {
        ...this.chat.toJSON(),
      })
        .catch((err) => {
          console.log('error', err);
        });
    }
    this.compareNewDirectMessageWithExisting(user);
    this.compareNewDirectMessageWithExisting(user);
  }

  compareNewDirectMessageWithExisting(user: User) {
    this.getAllDirectMessages()
      .then(() => {
        this.findDirectMessage(user);
      });
  }

  getAllDirectMessages(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.allDirectMessages = [];
      const directMessageCol = collection(this.firestore, 'direct messages');
      this.unSubDirectMessages = onSnapshot(directMessageCol,
        (list) => {
          list.forEach(chat => {
            this.allDirectMessages.push(chat.data());
          });
          resolve();
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

  findDirectMessage(user: User) {
    let directId: any;
    if (user.id !== this.userService.currentUser.id) {
      let sortedUserIds = [user.id, this.userService.currentUser.id].sort();
      directId = sortedUserIds.join('');
    } else {
      directId = this.userService.currentUser.id;
    }
    const foundDirectMessage = this.allDirectMessages.find(message => message.id === directId);
    console.log('all directs', this.allDirectMessages);
    this.renderDirectMessage(foundDirectMessage);
  }

  renderDirectMessage(chat: Chat) {
    this.openDirectMessage = chat;
    this.chatWindow = 'direct';
  }

  //------------------------------------------------------------------------------------
  checkUserForId(user: User) {
    this.chat.members = []
    if (user.id !== this.userService.currentUser.id) {
      let sortedUserIds = [user.id, this.userService.currentUser.id].sort();
      let userId = sortedUserIds.join('');
      let userData = this.convertUser(user);
      let currentUserData = this.convertUser(this.userService.currentUser);
      this.chat.members.push(userData, currentUserData);
      this.chat.id = userId;
      return userId
    } else {
      let userId = this.userService.currentUser.id;
      let currentUserData = this.convertUser(this.userService.currentUser);
      this.chat.members.push(currentUserData);
      this.chat.id = userId;
      return userId
    }
  }

  checkUserForDirectMessageName(user: User) {
    if (user.id !== this.userService.currentUser.id) {
      let sortedUserNames = [user.name, this.userService.currentUser.name].sort();
      let userChatName = sortedUserNames.join(' ');
      this.chat.name = userChatName;
    } else {
      this.chat.name = this.userService.currentUser.name;
    }
  }

  convertUser(user: any): any {
    return {
      name: user.name,
      email: user.email,
      password: user.password,
      id: user.id,
      picture: user.picture,
    };
  }

  // ---------------- Search function ----------------------------------------------
  getallChannels() {
    this.unSubChannels = onSnapshot(
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

  getPersonalChannels() {
    this.yourChannels = [];
    this.allChannels.forEach(channel => {
      if (channel.members.some((member: { id: string; }) => member.id === this.userService.currentUser.id)) {
        // console.log(channel);
        this.yourChannels.push(channel);
      }
    });
    this.getAllChannelMessages();
  }

  getAllChannelMessages() {
    this.yourChannels.forEach(channel => {
      const messageCol = collection(this.firestore, `channels/${channel.id}/messages`);
      this.unSubMessages = onSnapshot(messageCol,
        (list) => {
          list.forEach(message => {
            this.allMessagesOfChannel.push(message.data());
          });
        }
      );
    });
  }

  loadAllDirectMessages() {
    this.unSubDirectMessages = onSnapshot(
      query(collection(this.firestore, "direct messages"), orderBy("name")),
      (snapshot) => {
        this.allLoadedDirectMessages = snapshot.docs.map((doc) => {
          const channel = doc.data() as Channel;
          channel.id = doc.id;
          return channel;
        });
        this.getPersonalDirectMessages();
      }
    );
  }

  getPersonalDirectMessages() {
    this.yourDirectMessages = [];
    this.allLoadedDirectMessages.forEach(dm => {
      if (dm.members.some((member: { id: string; }) => member.id === this.userService.currentUser.id)) {
        // console.log(channel);
        this.yourDirectMessages.push(dm);
      }
    });
    this.getDMMessages();
  }

  getDMMessages() {
    this.yourDirectMessages.forEach(dm => {
      const messageCol = collection(this.firestore, `direct messages/${dm.id}/messages`);
      this.unSubMessages = onSnapshot(messageCol,
        (list) => {
          list.forEach(message => {
            this.allMessagesOfDM.push(message.data());
          });
        }
      );
    });
  }

  getAllUsers() {
    const userCol = collection(this.firestore, 'users');
    this.unSubUsers = onSnapshot(userCol,
      (list) => {
        list.forEach(user => {
          this.allUsers.push(user.data());
        });
      }
    );
  }

  getChannelByMessage(message: any) {
    let channel = this.allChannels.find(channel => channel.id = message.channelID);
    this.openChat = channel;
    this.chatWindow = 'channel';
  }

  getDirectMessageByMessage(message: any) {
    let direct = this.allDirectMessages.find(dm => dm.id = message.channelID);
    this.openDirectMessage = direct;
    this.chatWindow = 'direct';
  }

  getOtherUser(members: any[]) {
    let otherUser = members.find(member => member.id !== this.userService.currentUser.id);
    let interlocutor = this.allUsers.find(user => user.id == otherUser.id);
    return interlocutor as User;
  }
}