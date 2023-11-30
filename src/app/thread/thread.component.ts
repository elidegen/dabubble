import { Component, EventEmitter, Output, OnInit, inject } from '@angular/core';
import { ThreadService } from '../thread.service';
import { Thread } from 'src/models/thread.class';
import { UserService } from '../user.service';
import { AuthService } from '../auth.service';
import { UserData } from '../interfaces/user-interface';
import { ChatService } from '../chat.service';
import { Firestore, addDoc, arrayUnion, collection, doc, updateDoc } from '@angular/fire/firestore';
import { DocumentData, DocumentReference, onSnapshot, orderBy, query } from 'firebase/firestore';
import { Channel } from 'src/models/channel.class';
import { Reaction } from 'src/models/reaction.class';
import { Message } from 'src/models/message.class';

@Component({
  selector: 'app-thread',
  templateUrl: './thread.component.html',
  styleUrls: ['./thread.component.scss']
})

export class ThreadComponent implements OnInit {
  newThread = new Thread();
  threadContent = "";
  firestore: Firestore = inject(Firestore);
  currentChat!: Channel | undefined;
  message: Message = new Message();
  reaction: Reaction = new Reaction;
  allThreadMessages: Message[] = [];
  threadMessagesByDate: { [date: string]: Message[] } = {};
  sortedThreadMessages: { date: string, messages: Message[] }[] = []
  allReactionsByMessage: [] = [];
  currentMessage: any = [];
  unSubThread: any;
  unSubReactions: any;
  currentUser: UserData;

  @Output() closeThread: EventEmitter<void> = new EventEmitter<void>();

  constructor(public threadService: ThreadService, public userService: UserService, public authService: AuthService, public chatService: ChatService) {
    userService.getCurrentUserFromLocalStorage();
    this.currentUser = this.userService.currentUser;
  }

  ngOnInit() {    
    this.threadService.openMessage$.subscribe((openMessage) => {
      console.log('open', openMessage);
      
      if (openMessage) {
        console.log('openmsg',openMessage);
        
        const message = openMessage as Message;
        if (!this.currentMessage || this.currentMessage.id !== message.id) {
          this.currentMessage = message;
          this.threadService.currentMessage = message;
          if (this.unSubThread) {
            this.unSubThread();
          }
          
          this.loadThread();
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.unSubThread) {
      this.unSubThread(); // Bestehendes Abonnement kündigen
    }
    if (this.unSubReactions) {
      this.unSubReactions(); // Bestehendes Abonnement kündigen
    }
  }

  addMessageToThread(messageId: any) {
    console.log("thread msg id", messageId)
    this.newThread.creator = this.userService.currentUser.name;
    this.newThread.creatorId = this.userService.currentUser.id;
    this.newThread.content = this.threadContent;
    this.getSentMessageDate();
    this.getSentMessageTime();
    this.newThread.timeInMs
    this.newThread.id = this.authService.createId(10);
    this.newThread.profilePic = this.userService.currentUser.picture;
    this.newThread.reaction = [];
    this.newThread.reactionCount = 0;
    console.log("New Thread", this.newThread);
    this.pushMessageToThread(messageId);
  }

  loadThread() {
    console.log('ct',this.currentChat);
    
    if (this.currentChat?.id) {
      console.log('wird ausgeführt', this.currentChat);
      
      const messageCollection = collection(this.firestore, `channels/${this.currentChat.id}/messages`);
      const q = query(messageCollection, orderBy('timeInMs', 'asc'));
      this.unSubThread = onSnapshot(q, (snapshot) => {
        this.allThreadMessages = snapshot.docs.map(doc => {
          const message = doc.data() as Message;
          message.id = doc.id;
          console.log('message load thread', message);
          

          message.thread = this.getThread(message);
          message.reactionCount = this.setEmojiCount(message.reaction);

          return message;
        });
        this.organizeMessagesByDate();
      });
    }
  }

  getThread(msg: Message) {
    let parsedThread: any[] = [];
    msg.thread.forEach((threadMsg: string) => {
      parsedThread.push(JSON.parse(threadMsg));
    });
    return parsedThread;
  }

  organizeMessagesByDate() {
    this.threadMessagesByDate = {};

    for (const thread of this.allThreadMessages) {
      const threadMessageDate = thread.date;

      if (threadMessageDate) {
        if (!this.threadMessagesByDate[threadMessageDate]) {
          this.threadMessagesByDate[threadMessageDate] = [];
        }
        this.threadMessagesByDate[threadMessageDate].push(thread);
      }

    }
    this.sortedThreadMessages = Object.entries(this.threadMessagesByDate).map(([date, messages]) => ({ date, messages }));
    this.sortedThreadMessages = this.sortedThreadMessages;
    console.log('srtthrdmsg', this.sortedThreadMessages);

  }

  pushMessageToThread(messageId: string) {
    const subReactionColRef = doc(collection(this.firestore, `channels/${this.threadService.currentChat.id}/messages/`), messageId);
    let messageIndex = this.getIndexFromMessageId(messageId);

    const threadString = JSON.stringify(this.newThread);

    this.allThreadMessages[messageIndex].thread.push(threadString);
    updateDoc(subReactionColRef, this.updateMessage(this.allThreadMessages[messageIndex]));
  }

  updateMessage(message: any) {
    return {
      thread: message.thread,
    }
  }

  setEmojiCount(reactions: any[]) {
    let counter: { [key: string]: number } = {};
    reactions.forEach(react => {
      let key = JSON.stringify(react.emoji);
      if (key) {
        key = key.substring(1);
        key = key.substring(0, key.length - 1);
      }
      if (counter[key]) {
        counter[key]++;
      } else {
        if (key != undefined)
          counter[key] = 1;
      }
    });
    return counter;
  }

  getSentMessageDate() {
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString();
    this.newThread.date = formattedDate;
  }

  getSentMessageTime() {
    const currentTime = new Date();
    this.newThread.timeInMs = currentTime.getTime();

    const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.newThread.time = formattedTime;
  }

  getIndexFromMessageId(messageId: string) {
    let messageIndex = this.allThreadMessages.findIndex(message => message.id === messageId)
    return messageIndex;
  }

  onCloseClick() {
    this.closeThread.emit();
  }
}
