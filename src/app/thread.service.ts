import { EventEmitter, Injectable } from '@angular/core';
import { inject } from '@angular/core';
import { Firestore, collection, doc, onSnapshot, addDoc,getDocs,updateDoc, getDoc, setDoc, DocumentReference, DocumentData} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Thread } from 'src/models/thread.class';
import { Channel } from 'src/models/channel.class';
import { UserService } from './user.service';
import { ChatService } from './chat.service';
import { Message } from 'src/models/message.class';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class ThreadService {
  firestore: Firestore = inject(Firestore);
  threads: Thread[] = [];
  allMessages: Message[] = [];
  currentChat = new Channel();
  currentMessage = new Message();
  threadMessage: any = [];
  messagesByDate: { [date: string]: Message[] } = {};
  organizedMessages: { date: string, messages: Message[] }[] = [];
  openThread = new EventEmitter<void>();
  changeChat = new EventEmitter<void>();
  isThreadInDM: boolean = false;
  allThreadMessages: Message[] = [];
  unSubThread: any;
  constructor(public router: Router, public userService: UserService, public chatService: ChatService) {

  }

  public _openMessageSubject: BehaviorSubject<Message | null> = new BehaviorSubject<Message | null>(null);
  

  get openMessage$(): Observable<Message | null> {
    return this._openMessageSubject.asObservable();
  }

  set openMessage(value: Message | null) {
    this._openMessageSubject.next(value);
  }

  ngOnInit() {
  }

  async createThread(messageId: any, thread: Thread) {
    const threadCollectionRef = collection(this.firestore, 'threads');
    const specificDocRef: DocumentReference<DocumentData> = doc(threadCollectionRef, messageId);
    const docSnapshot = await getDoc(specificDocRef)
    if (!docSnapshot.exists()) {
      await setDoc(specificDocRef, {
        ...thread.toJSON(),
      });
    }
  }

  async sendMessageInThread(threadId: any, message: Message) {
    const subColRef = collection(this.firestore, `threads/${threadId}/messages`);
    await addDoc(subColRef, message.toJSON())
    .catch((err) => {
      console.log(err);
    })
  }


  async addThread(item: Thread) {
    if (this.currentMessage.id) {
      await addDoc(this.getThreadRef(this.currentMessage.id), item.toJSON()).catch(
        (err) => { console.log(err) }
      )
    }
  }

  updateThreadCount(message: Message,time: any) {
    if (this.isThreadInDM) {
      const subReactionColRef = doc(collection(this.firestore, `direct messages/${message.channelID}/messages/`), message.id);
      updateDoc(subReactionColRef, this.updateMessage(message, time));
    } else {
      const subReactionColRef = doc(collection(this.firestore, `channels/${this.currentChat.id}/messages/`), message.id);
      updateDoc(subReactionColRef, this.updateMessage(message, time));
    }
  }

  updateMessage(message:any,time: any) {
    return {
      threadCount: message.threadCount,
      lastThreadTime: time,
    }
  }

  setObjectData(obj: any,) {
    return {
      name: obj.name || "",
      email: obj.email || "",
      password: obj.password || "",
      id: obj.id,
      picture: obj.picture || "",
      online: obj.online || false,
    }
  }

  async countThreadMessages(messageId: string) {
    const threadCollection = collection(this.firestore, `threads/${messageId}/messages`);
    return getDocs(threadCollection)
    .then(snapshot => {
      let threadCount = snapshot.size;
      return threadCount;
    });
  }

  getThreadData(thread: Thread) {
    const threadInstance = new Thread(thread);
    return threadInstance;
  }

  getAllThreadsRef(messageId: string) {
    if (!this.currentChat || !this.currentChat.id) {
      throw new Error('Current chat is not defined');
    }
    if (!messageId) {
      throw new Error('Message ID is not defined');
    }
    return collection(this.firestore, `channels/${this.currentChat.id}/messages/${messageId}/threads`);
  }

  getThreadRef(messageId: string) {
    if (!this.currentChat || !this.currentChat.id) {
      throw new Error('Current chat is not defined');
    }
    if (!messageId) {
      throw new Error('Message ID is not defined');
    }
    return collection(this.firestore, `channels/${this.currentChat.id}/messages/${messageId}/threads`);
  }

  getSingleDocRef(messageId: string, docId: string) {
    if (!this.currentChat || !this.currentChat.id) {
      throw new Error('Current chat is not defined');
    }
    if (!messageId) {
      throw new Error('Message ID is not defined');
    }
    return doc(collection(this.firestore, `channels/${this.currentChat.id}/messages/${messageId}/threads`), docId);
  }
}




