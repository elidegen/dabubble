import { Injectable, OnInit, inject } from '@angular/core';
import { Firestore, getDoc, onSnapshot, orderBy, query, setDoc } from '@angular/fire/firestore';
import { DocumentData, DocumentReference, collection, doc } from 'firebase/firestore';
import { Channel } from 'src/models/channel.class';
import { Chat } from 'src/models/chat.class';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from 'src/models/user.class';
import { UserService } from './user.service';
import { Message } from 'src/models/message.class';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private _openChatSubject: BehaviorSubject<Channel | Chat | null> = new BehaviorSubject<Channel | Chat | null>(null);
  firestore: Firestore = inject(Firestore)
  chatWindow = 'empty';
  chat: Chat = new Chat();
  unSubChannels: any;
  unSubMessages: any;
  allChannels: any[] = [];
  yourChannels: any[] = [];
  allMessagesOfChannel: any[] = [];

  constructor( public userService: UserService) { 
    this.getallChannels();
  }

  get openChat$(): Observable<Channel | Chat | null> {
    return this._openChatSubject.asObservable();
  }

  set openChat(value: Channel | Chat | null) {
    this._openChatSubject.next(value);
  }

// -------------- channel -----------------------






// Create direct Messages ------------------------------
  async createDirectMessage(user: User) {
    if (user.id !== this.userService.currentUser.id) {
      let sortedUserIds = [user.id, this.userService.currentUser.id].sort(); // ich lasse zunächst die beiden Ids sortieren und danach zusammenfügen. Dadurch entsteht eine individuelle ID, selbst wenn user und CurrentUser vertauscht sind. Somit werden keine zwei Chats mit denselben Membern erstellen
      let userId = sortedUserIds.join('');
      let userData = this.convertUser(user);
      let currentUserData = this.convertUser(this.userService.currentUser);
      this.chat.members.push(userData, currentUserData);
      const directMessageRef = collection(this.firestore, 'direct messages');
      const specificDocRef: DocumentReference<DocumentData> = doc(directMessageRef, userId);
      const docSnapshot = await getDoc(specificDocRef);
      if (!docSnapshot.exists()) {
        await setDoc(specificDocRef, {
          ...this.chat.toJSON(),
        })
        .catch((err) => {
          console.log(err);
        });
      }
    }
    this.chatWindow = 'empty';
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

  //-----------------------------------------



  // ---------------- Search function ---------------
  getallChannels() {
    this.unSubChannels= onSnapshot(
      query(collection(this.firestore, "channels"), orderBy("name")),
      (snapshot) => {
        this.allChannels = snapshot.docs.map((doc) => {
          const channel = doc.data() as Channel;
          channel.id = doc.id;
          return channel;
        });
       console.log('all Channels', this.allChannels);
        this.getPersonalChannels();
      }
    );
  }

  getPersonalChannels() {
    this.yourChannels = [];
    this.allChannels.forEach(channel => {
      if (channel.members.some((member: { id: string; }) => member.id === this.userService.currentUser.id)) {
        console.log(channel);
        this.yourChannels.push(channel);
      }
    });
    this.getAllMessages();
  }

  ngOnDestroy() {

  }

  getAllMessages() {
    this.yourChannels.forEach(channel => {
      console.log('id', channel.id); 
      const messageCol = collection(this.firestore, `channels/${channel.id}/messages`);
      this.unSubMessages = onSnapshot( messageCol,
        (list) => {
          list.forEach(message => {
            this.allMessagesOfChannel.push(message.data());
          });
        }     
      );
    });
    console.log('check', this.allMessagesOfChannel);
    
  }
}
