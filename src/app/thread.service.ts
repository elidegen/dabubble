import { EventEmitter, Injectable } from '@angular/core';
import { inject } from '@angular/core';
import { Firestore, collection, doc, addDoc,getDocs,updateDoc, getDoc, setDoc, DocumentReference, DocumentData} from '@angular/fire/firestore';
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


  /**
   * This functions creates a thread
   * @param messageId - id of message
   * @param thread - new thread model
   */
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

  
  /**
   * This function sends a message within a thread
   * @param thread - document reference
   * @param message - new message
   */
  async sendMessageInThread(thread: any, message: Message) {
    let threadId = thread.id
    const subColRef = collection(this.firestore, `threads/${threadId}/messages`);
    await addDoc(subColRef, message.toJSON())
    .catch((err) => {
      console.log(err);
    })
  
  }


  /**
   * This function updates the amount of thread messages of a message
   */
  async updateThreadCount(message: Message,time: any) {
    message.threadCount = await this.countThreadMessages(message.id);
    if (this.isThreadInDM) {
      const subReactionColRef = doc(collection(this.firestore, `direct messages/${message.channelID}/messages/`), message.id);
      updateDoc(subReactionColRef, this.updateMessage(message, time));
    } else {
      const subReactionColRef = doc(collection(this.firestore, `channels/${message.channelID}/messages/`), message.id);
      updateDoc(subReactionColRef, this.updateMessage(message, time));
    }
  }


  /**
   * This function updates message values
   * @param message - new message
   * @param time - sent time
   * @returns - values
   */
  updateMessage(message:any,time: any) {
    return {
      threadCount: message.threadCount,
      lastThreadTime: time,
    }
  }

  
  /**
   * This function counts all messages inside of a thread
   * @param messageId - document reference
   * @returns threadCount value
   */
  async countThreadMessages(messageId: any) {
    const threadCollection = collection(this.firestore, `threads/${messageId}/messages`);
    return getDocs(threadCollection)
    .then(snapshot => {
      let threadCount = snapshot.size;
      return threadCount;
    });
  }

}




