import { Component, EventEmitter, Output, OnInit, inject } from '@angular/core';
import { ThreadService } from '../thread.service';
import { Thread } from 'src/models/thread.class';
import { UserService } from '../user.service';
import { AuthService } from '../auth.service';
import { UserData } from '../interfaces/user-interface';
import { ChatService } from '../chat.service';
import { Firestore, addDoc, arrayUnion, collection, doc,updateDoc } from '@angular/fire/firestore';
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
  allMessages: Message[] = [];
  messagesByDate: { [date: string]: Message[] } = {};
  organizedMessages: { date: string, messages: Message[] }[] = []
  allReactionsByMessage: [] = [];
  currentMessage: any = [];

  unSubMessages: any;
  unSubReactions: any;
  currentUser: UserData;


  @Output() closeThread: EventEmitter<void> = new EventEmitter<void>();
  constructor(public threadService: ThreadService, public userService: UserService, public authService: AuthService, public chatService: ChatService) {
    userService.getCurrentUserFromLocalStorage();
    this.currentUser = this.userService.currentUser;
  
  }


  ngOnInit() {

    this.chatService.openChat$.subscribe((openChat) => {
      if (openChat) {
        const newChat = openChat as Channel;
        if (!this.currentChat || this.currentChat.id !== newChat.id) {
          this.currentChat = newChat;
          this.threadService.currentChat = newChat;
          if (this.unSubMessages) {
            this.unSubMessages(); // Bestehendes Abonnement kündigen
          }
          this.loadMessages(); // Nachrichten für den neuen Channel laden
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.unSubMessages) {
      this.unSubMessages(); // Bestehendes Abonnement kündigen
    }
    if (this.unSubReactions) {
      this.unSubReactions(); // Bestehendes Abonnement kündigen
    }
  }

  addMessageToThread(messageId: any ) {
    console.log("das ist die id von der Message die in den Thread gepusht werden soll", messageId)
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
    console.log("New Thread ", this.newThread);
    this.pushMessageToThread(messageId);
  }


  loadMessages() {
    console.log('loadmessages anfang currentChat', this.currentChat);
    if (this.currentChat?.id) {
      const messageCollection = collection(this.firestore, `channels/${this.currentChat.id}/messages`);
      const q = query(messageCollection, orderBy('timeInMs', 'asc'));
      this.unSubMessages = onSnapshot(q, (snapshot) => {
        this.allMessages = snapshot.docs.map(doc => {
          const message = doc.data() as Message;
          message.id = doc.id;
          message.reactionCount = this.setEmojiCount(message.reaction);
          console.log('Testconsole log load Messages', this.currentChat);

          return message;
        });
        this.organizeMessagesByDate();
        console.log('organizedmsg', this.organizedMessages);
      });
    }
    console.log('loadmessages ende currentChat', this.currentChat);
  
  }


  organizeMessagesByDate() {
    this.messagesByDate = {};
    for (const message of this.allMessages) {
      const messageDate = message.date;
      if (messageDate) {
        if (!this.messagesByDate[messageDate]) {
          this.messagesByDate[messageDate] = [];
        }
        this.messagesByDate[messageDate].push(message);
        
      }
    }
    this.organizedMessages = Object.entries(this.messagesByDate).map(([date, messages]) => ({ date, messages }));
    this.organizedMessages = this.organizedMessages;
  }


  pushMessageToThread(messageId: string) {
    const subReactionColRef = doc(collection(this.firestore, `channels/${this.threadService.currentChat.id}/messages/`), messageId);
    let messageIndex = this.getIndexFromMessageId(messageId);
    console.log("das ist die id von der Message die in den Thread gepusht werden soll", messageId);
    this.allMessages[messageIndex].thread.push(this.newThread);
    console.log("das ist die id von der Message die in den Thread gepusht werden soll",   this.allMessages[messageIndex]);
    updateDoc(subReactionColRef, this.updateMessage(this.allMessages[messageIndex]));

  
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

    let messageIndex = this.allMessages.findIndex(message => message.id === messageId)
    return messageIndex;
  }

  onCloseClick() {
    this.closeThread.emit();
  }
}
