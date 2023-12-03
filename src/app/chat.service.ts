import { Injectable, inject } from '@angular/core';
import { Firestore, getDoc, setDoc } from '@angular/fire/firestore';
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
  firestore: Firestore = inject(Firestore)
  chatWindow = 'empty';
  chat: Chat = new Chat();

  constructor( public userService: UserService) { }

  get openChat$(): Observable<Channel | Chat | null> {
    return this._openChatSubject.asObservable();
  }

  set openChat(value: Channel | Chat | null) {
    this._openChatSubject.next(value);
  }



  getChannelsRef() {
    return collection(this.firestore, 'channels');
  }

  getChatsRef() {
    return collection(this.firestore, 'chats');
  }
  
  getSingleDocRef(colId: string, docId: string) {
    return doc(collection(this.firestore, colId), docId);
  }

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
    this.chatWindow = 'direct';
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

}
