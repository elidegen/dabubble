import { Component, EventEmitter, Output, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { ThreadService } from '../thread.service';
import { Thread } from 'src/models/thread.class';
import { UserService } from '../user.service';
import { AuthService } from '../auth.service';
import { UserData } from '../interfaces/user-interface';
import { ChatService } from '../chat.service';
import { Firestore, addDoc, arrayUnion, collection, doc, updateDoc } from '@angular/fire/firestore';
import { DocumentData, DocumentReference, getDoc, onSnapshot, orderBy, query} from 'firebase/firestore';
import { Channel } from 'src/models/channel.class';
import { Reaction } from 'src/models/reaction.class';
import { Message } from 'src/models/message.class';

@Component({
  selector: 'app-thread',
  templateUrl: './thread.component.html',
  styleUrls: ['./thread.component.scss']
})

export class ThreadComponent implements OnInit {
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
  currentThread: [] = [];
  toggled: boolean = false;
  @ViewChild('editorThread') editorThread!: ElementRef;

  @Output() closeThread: EventEmitter<void> = new EventEmitter<void>();
  edit: boolean = false;
  editingThreadMessage: string | undefined;

  constructor(public threadService: ThreadService, public userService: UserService, public authService: AuthService, public chatService: ChatService) {
    userService.getCurrentUserFromLocalStorage();
    this.currentUser = this.userService.currentUser;
  }

  ngOnInit() {   
    this.threadService.openMessage$.subscribe((openMessage) => {
      console.log('open', openMessage);
      if (openMessage) {
        const message = openMessage as Message;
        if (!this.currentMessage || this.currentMessage.id !== message.id) {
          this.currentMessage = message;
          this.threadService.currentMessage = message;
          console.log('Welche Message', this.currentMessage.id);
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


  async addMessageToThread() {
    if (this.currentMessage.id && this.message.content?.trim() !== '') {
      this.getSentMessageTime();
      this.getSentMessageDate();
      this.getSentMessageCreator();
      this.message.profilePic = this.userService.currentUser.picture;
      this.message.creatorId = this.userService.currentUser.id;
      const subColRef = collection(this.firestore, `threads/${this.currentMessage.id}/threadMessages`);
      await addDoc(subColRef, this.message.toJSON())
        .catch((err) => {
          console.log(err);
        })
        .then(() => {
          this.message.content = '';
          console.log('Message sent to thread');
        });  
    }
  this.threadService.updateThreadCount(this.threadService.currentMessage, this.message.time);
  }



  
  addEmoji($event:any) {
    console.log($event);
    this.toggled = false;
  }



  async addReaction(emoji: string, messageId: any) {
    if (this.currentMessage?.id) {
      const subReactionColRef = doc(collection(this.firestore, `threads/${this.currentMessage.id}/threadMessages/`), messageId);
      let messageIndex = this.allThreadMessages.findIndex(message => message.id === messageId);
      let currentMessage = this.allThreadMessages[messageIndex];
      const reactionItem = { emoji, creatorId: this.currentUser.id };
      if (currentMessage.reaction.some((emojiArray: { emoji: string; creatorId: string; }) => emojiArray.emoji === emoji && emojiArray.creatorId === this.currentUser.id)) {
        currentMessage.reaction = currentMessage.reaction.filter((emojiArray: { emoji: string; creatorId: string; }) => !(emojiArray.emoji === emoji && emojiArray.creatorId === this.currentUser.id));
      } else {
        currentMessage.reaction.push(reactionItem);
      }
      updateDoc(subReactionColRef, this.updateMessage(this.allThreadMessages[messageIndex]));
    }
  }

  updateMessage(message: any) {
    return {
      reaction: message.reaction
    }
  }


  getSentMessageDate() {
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString();
    this.message.date = formattedDate;
  }

  getSentMessageTime() {
    const currentTime = new Date();
    this.message.timeInMs = currentTime.getTime();

    const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.message.time = formattedTime;
  }

  getSentMessageCreator() {
    this.message.creator = this.userService.currentUser.name;
  }


  async updateMessageId(colId: string, message: Message, newId: string) {
    message.id = newId;
    await this.updateChannel(colId, message);
  }

  async updateChannel(colId: string, message: Message) {
    const docRef = doc(collection(this.firestore, colId), message.id);
    await updateDoc(docRef, this.getUpdateData(message)).catch(
      (error) => { console.log(error); }
    );
  }

  getUpdateData(message: Message) {
    return {
      creator: this.userService.currentUser.name,
      creatorId: this.userService.currentUser.id,
      content: message.content,
      time: message.time,
      date: message.date,
      id: message.id,
      profilePic: this.userService.currentUser.picture,
      reaction: [],
      reactionCount: message.reactionCount,
      thread: [],

    };
  }

  loadThread() {
    if (this.currentMessage.id) {
      console.log('wird ausgeführt', this.currentMessage);
      const threadCollection = collection(this.firestore, `threads/${this.currentMessage.id}/threadMessages`);
      console.log('message', threadCollection);
      const q = query(threadCollection, orderBy('timeInMs', 'asc'));
      this.unSubThread = onSnapshot(q, (snapshot) => {
        this.allThreadMessages = snapshot.docs.map(doc => {
          const message = doc.data() as Message;
          message.id = doc.id;
          message.reactionCount = this.setEmojiCount(message.reaction);
          console.log('show me', message);
          return message;
        });
      });
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



  onCloseClick() {
    this.closeThread.emit();
  }

  editThreadMessage(message: Message) {
    console.log('Nachricht', message);
    console.log('channel is', this.currentChat);
    
    if (this.currentMessage) {
      if (message.creator == this.currentUser.name) {
        this.edit = true;
        this.editingThreadMessage = message.id;
        console.log('bearbeitet', this.editingThreadMessage);
        
      }
    }
  }

  async updateMessageContent(message: Message) {
    let messageId = message.id
    const messageColRef = doc(collection(this.firestore, `threads/${this.currentMessage?.id}/threadMessages/`), messageId);
    this.setMessageValues(message);
    await updateDoc(messageColRef, this.message.toJSON()).catch((error) => {
      console.error('Error updating document:', error);
    });
    this.edit = false;
  }


  setMessageValues(message: Message) {
    this.message.id = message.id;
    this.message.creator = message.creator
    this.message.creatorId = message.creatorId;
    this.message.date = message.date;
    this.message.lastThreadTime = message.lastThreadTime;
    this.message.profilePic = message.profilePic;
    this.message.reaction = message.reaction;
    this.message.reactionCount = message.reactionCount;
    this.message.time = message.time;
    this.message.threadCount = message.threadCount;
    this.message.timeInMs = message.timeInMs;
    this.message.content = this.editorThread.nativeElement.value;
  }


}
