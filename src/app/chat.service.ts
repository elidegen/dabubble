import { Inject, Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { collection, doc } from 'firebase/firestore';
import { Channel } from 'src/models/channel.class';
import { Chat } from 'src/models/chat.class';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  firestore: Firestore = Inject(Firestore)
  openChat!: Channel | Chat;
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

  subCustomerList() {
    // return onSnapshot(this.getUsersRef(), (list) => {
    //   this.users = [];
    //   list.forEach(element => {
    //     this.users.push(this.setUserData(element.data()));
    //     console.log("Available users", element.data());
    //   })
    // })
  }
}
