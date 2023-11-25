import { Inject, Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { collection, doc } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  firestore: Firestore = Inject(Firestore)

  constructor() { }

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
