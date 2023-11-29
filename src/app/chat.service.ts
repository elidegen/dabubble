import { Inject, Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { collection, doc } from 'firebase/firestore';
import { Channel } from 'src/models/channel.class';
import { Chat } from 'src/models/chat.class';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private _openChatSubject: BehaviorSubject<Channel | Chat | null> = new BehaviorSubject<Channel | Chat | null>(null);
  firestore: Firestore = Inject(Firestore)
  constructor() { }

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

}
