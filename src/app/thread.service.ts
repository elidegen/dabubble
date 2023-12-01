import { Injectable } from '@angular/core';
import { inject } from '@angular/core';
import { Firestore, collection, doc, onSnapshot, addDoc,getDocs,updateDoc} from '@angular/fire/firestore';
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

  unsubList;

  constructor(public router: Router, public userService: UserService, public chatService: ChatService) {
    this.unsubList = this.subThreadList();
  }

  public _openMessageSubject: BehaviorSubject<Message | null> = new BehaviorSubject<Message | null>(null);
  

  get openMessage$(): Observable<Message | null> {
    return this._openMessageSubject.asObservable();
  }

  set openMessage(value: Message | null) {
    this._openMessageSubject.next(value);
  }

  // private currentMessageSubject = new BehaviorSubject<Message | null>(null);
  // currentMessage$ = this.currentMessageSubject.asObservable();

  // setCurrentMessage(message: Message): void {
  //   this.currentMessageSubject.next(message);
  // }

  ngOnInit() {
    console.log("der currentchat ist:", this.currentChat);
    console.log("die currentmessage ist ", this.currentMessage);
  }

  ngOnDestroy() {
    if (this.unsubList) {
      this.unsubList();
    }
  }

  async addThread(item: Thread) {
    if (this.currentMessage.id) {
      await addDoc(this.getThreadRef(this.currentMessage.id), item.toJSON()).catch(
        (err) => { console.log(err) }
      ).then(
        (docRef) => {
          console.log()

          console.log("Neuer Thread für die Message Id", this.currentMessage.id);
          console.log(item);
        }
      )
    }
  }



  updateThreadCount(message: Message,time: any) {
    const subReactionColRef = doc(collection(this.firestore, `channels/${this.currentChat.id}/messages/`), message.id);
    updateDoc(subReactionColRef, this.updateMessage(message, time));
    console.log("MessageCount wird geupdated",message);
    console.log("MessageCount wird geupdated mit der Zeit",time);

  }



  


updateMessage(message:any,time: any) {
return {
  threadCount: message.threadCount,
  lastThreadTime: time
}
}


  subThreadList() {
    if (this.currentChat.id && this.currentMessage.id) {
      return onSnapshot(this.getThreadRef(this.currentMessage.id), (list) => {
        this.threads = [];
        list.forEach(element => {
          const threadData = element.data() as Thread;
          const thread = new Thread(threadData);
          this.threads.push(thread);
          console.log("threads sind vorhanden für  currentChat und currentMesage", this.currentChat.id, this.currentMessage);
          console.log("Thread", thread);
        });
      });
    } else {
      console.log('Current chat or message is not defined');
      return;
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
    const threadCollection = collection(this.firestore, `threads/${messageId}/threadMessages`);
    return getDocs(threadCollection)
      .then(snapshot => {
        let threadCount = snapshot.size;
        return threadCount;
      });
  }

  getThreadData(thread: Thread) {
    // Erstellen Sie eine neue Instanz von Thread, falls erforderlich
    const threadInstance = new Thread(thread);
    
    // Aktualisieren Sie die Eigenschaften des Thread-Objekts
    // threadInstance.creator = thread.creator || "";
    // threadInstance.creatorId = thread.creatorId || "";
    // threadInstance.content = thread.content || "";
    // threadInstance.time = thread.time || "";
    // threadInstance.date = thread.date || "";
    // threadInstance.timeInMs = thread.timeInMs || 0;
    // threadInstance.profilePic = thread.profilePic || "";
    // threadInstance.id = thread.id || "";
    // threadInstance.reactionCount = thread.reactionCount || "";
    // threadInstance.reaction = thread.reaction || [];

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




