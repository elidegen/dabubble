import { inject, Injectable } from '@angular/core';
import { Firestore, collection, doc, collectionData, onSnapshot, addDoc, deleteDoc, updateDoc, } from '@angular/fire/firestore';
import { Channel } from 'src/models/channel.class';
import { Chat } from 'src/models/chat.class';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  firestore: Firestore = inject(Firestore);
  allChannels: Channel[] = [];
  unsubList;
  private _openChatSubject: BehaviorSubject<Channel | Chat | null> = new BehaviorSubject<Channel | Chat | null>(null);
 
  constructor() {
    this.unsubList = this.subChannelList();
  }

  get openChat$(): Observable<Channel | Chat | null> {
    return this._openChatSubject.asObservable();
  }

  set openChat(value: Channel | Chat | null) {
    this._openChatSubject.next(value);
  }


  ngOnInit() {
   
  }

ngOnDestroy() {
this.unsubList();
}




subChannelList() {
  return onSnapshot(this.getChannelsRef(), (list) => {
    this.allChannels = [];
    list.forEach(element  => {
      this.allChannels.push(element.data() as Channel);
    })
  })
}





getChannelRef(colId: string) {
  return collection(this.firestore, colId);
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
