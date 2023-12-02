import { Component, ElementRef, OnInit, ViewChild, inject, HostListener } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogEditChannelComponent } from '../dialog-edit-channel/dialog-edit-channel.component';
import { DialogAddToGroupComponent } from '../dialog-add-to-group/dialog-add-to-group.component';
import { DialogShowGroupMemberComponent } from '../dialog-show-group-member/dialog-show-group-member.component';
import { MatDrawer } from '@angular/material/sidenav';
import { Firestore, addDoc, collection, doc, updateDoc } from '@angular/fire/firestore';
import { ChatService } from '../chat.service';
import { Channel } from 'src/models/channel.class';
import { Message } from 'src/models/message.class';
import { DocumentData, DocumentReference, getDoc, onSnapshot, orderBy, query, setDoc } from 'firebase/firestore';
import { UserService } from '../user.service';
import { UserData } from '../interfaces/user-interface';
import { Reaction } from 'src/models/reaction.class';
import { ThreadService } from '../thread.service';
import { Thread } from 'src/models/thread.class';

@Component({
  selector: 'app-main-chat',
  templateUrl: './main-chat.component.html',
  styleUrls: ['./main-chat.component.scss']
})
export class MainChatComponent implements OnInit {
  @ViewChild('messageContainer') messageContainer!: ElementRef;
  firestore: Firestore = inject(Firestore);
  currentChat!: Channel | undefined;
  @ViewChild('thread') threadDrawer!: MatDrawer;
  message: Message = new Message();
  reaction: Reaction = new Reaction;
  allMessages: Message[] = [];
  unSubMessages: any;
  unSubReactions: any;
  currentUser: UserData;
  messagesByDate: { [date: string]: Message[] } = {};
  organizedMessages: { date: string, messages: Message[] }[] = []
  allReactionsByMessage: [] = [];
  newThread = new Thread();
  threadCount: any = 0;
  allChannelMembers: any[] = [];
  firstThreeItems: any[] = [];
  showEmojiPick: boolean = false;
  toggled: boolean = false;
  placeholder: any;
  edit: boolean = false;
  @ViewChild('editor') editor!: ElementRef;


  constructor(public dialog: MatDialog, public chatService: ChatService, public userService: UserService, public threadService: ThreadService,) {
    userService.getCurrentUserFromLocalStorage();
    this.currentUser = this.userService.currentUser;
  }

  ngOnInit() {
    this.chatService.openChat$.subscribe((openChat) => {
      if (openChat) {
        const newChat = openChat as Channel;
        if (!this.currentChat || this.currentChat.id !== newChat.id) {
          this.currentChat = newChat;
          console.log('currentChat', this.currentChat);
          this.threadService.currentChat = newChat;
          if (this.unSubMessages) {
            this.unSubMessages();
          }
          this.loadMessages();
          this.getAllChannelMembers();
        }
      } else {
        this.currentChat = undefined;
      }
  
    });

    
  }

  // @HostListener('document:click', ['$event'])
  // checkClick(event: Event) {
  //   const clickedElement = event.target as HTMLElement;
  //   if (!clickedElement.classList.contains('reaction') && !clickedElement.classList.contains('hostlistener-dont-trigger') && !clickedElement.classList.contains('emojiPicker') && this.toggled) {
  //     this.toggled = false;
  //   }
  // }
  
  ngOnDestroy() {
    if (this.unSubMessages) {
      this.unSubMessages();
    }
    if (this.unSubReactions) {
      this.unSubReactions();
    }
  }

  openEditChannelDialog() {
    this.dialog.open(DialogEditChannelComponent, {
      panelClass: 'dialog-container'
    });
  }

  openDialog() {
    this.dialog.open(DialogAddToGroupComponent, {
      panelClass: 'dialog-container'
    });
  }

  openMemberDialog() {
    this.dialog.open(DialogShowGroupMemberComponent, {
      panelClass: 'dialog-container'
    });
  }

  onCloseThread() {
    this.threadDrawer.close();
  }

  async sendMessage() {
    if (this.currentChat?.id && this.message.content?.trim() !== '') {
      this.getSentMessageTime();
      this.getSentMessageDate();
      this.getSentMessageCreator();
      const subColRef = collection(this.firestore, `channels/${this.currentChat.id}/messages`);
      await addDoc(subColRef, this.message.toJSON())
        .catch((err) => {
          console.log(err);
        })
        .then((docRef: void | DocumentReference<DocumentData, DocumentData>) => {
          if (docRef && docRef instanceof DocumentReference) {
            if (this.currentChat?.id) {
              this.updateMessageId(`channels/${this.currentChat.id}/messages`, this.message, docRef.id);
            }
          }
          this.message.content = '';
        });

    }
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
      threadCount: message.threadCount,

    };
  }


  loadMessages() {
    if (this.currentChat?.id) {
      const messageCollection = collection(this.firestore, `channels/${this.currentChat.id}/messages`);
      const q = query(messageCollection, orderBy('timeInMs', 'asc'));
      this.unSubMessages = onSnapshot(q, async (snapshot) => {
        this.allMessages = await Promise.all(snapshot.docs.map(async doc => {
          const message = doc.data() as Message;
          message.id = doc.id;
          message.threadCount = await this.threadService.countThreadMessages(message.id);
          console.log("Anzahl der Nachrichten im Thread", message.threadCount);
          console.log("Das ist die Nachricht mit dem Threadcount", message);
          message.reactionCount = this.setEmojiCount(message.reaction);
          return message;
        }));
        this.organizeMessagesByDate();
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

  async addReaction(emoji: any, messageId: any) {
    if (this.currentChat?.id) {
      const subReactionColRef = doc(collection(this.firestore, `channels/${this.currentChat.id}/messages/`), messageId);
      let messageIndex = this.allMessages.findIndex(message => message.id === messageId);
      let currentMessage = this.allMessages[messageIndex];
      const reactionItem = { emoji, creatorId: this.currentUser.id };
      if (currentMessage.reaction.some((emojiArray: { emoji: string; creatorId: string; }) => emojiArray.emoji === emoji && emojiArray.creatorId === this.currentUser.id)) {
        currentMessage.reaction = currentMessage.reaction.filter((emojiArray: { emoji: string; creatorId: string; }) => !(emojiArray.emoji === emoji && emojiArray.creatorId === this.currentUser.id));
      } else {
        currentMessage.reaction.push(reactionItem);
      }
      updateDoc(subReactionColRef, this.updateMessage(this.allMessages[messageIndex]));
    }
  }


  updateMessage(message: any) {
    return {
      reaction: message.reaction
    }
  }

  getSentMessageDate() {
    const currentDate = this.getCurrentDate();
    const formattedDate = this.formatDate(currentDate);
    this.message.date = formattedDate;
  }

  getSentMessageTime() {
    const currentTime = new Date();
    this.message.timeInMs = currentTime.getTime();
    const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.message.time = formattedTime;
  }


  getSentMessageCreator() {
    this.message.creator = this.userService.currentUser.id;
  }


  scrollToBottom(): void {
    this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
  }


  isToday(date: string): boolean {
    const currentDate = this.getCurrentDate();
    const formattedDate = this.formatDate(currentDate);
    return date === formattedDate;
  }


  getCurrentDate(): string {
    const currentDate = new Date();
    return currentDate.toDateString();
  }


  formatDate(date: string): string {
    const parts = date.split(' ');
    return `${parts[2]}.${this.getMonthNumber(parts[1])}.${parts[3]}`;
  }


  getMonthNumber(month: string): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return (months.indexOf(month) + 1).toString().padStart(2, '0');
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
    console.log('Show', this.organizedMessages)
  }


  showEmojiPicker() {
    this.showEmojiPick = true;
  }


  addEmoji(event: any, messageId: any) {
    let emojiString = event["emoji"].native;
    this.toggled = false;
    this.addReaction(emojiString, messageId)
  }


  async openThread(message: Message) {
    let messageId = message.id;
    await this.createThread(messageId)
    this.threadDrawer.open();
    this.threadService.openMessage = message;
  }


  async createThread(messageId: any) {
    const threadCollectionRef = collection(this.firestore, 'threads');
    const specificDocRef: DocumentReference<DocumentData> = doc(threadCollectionRef, messageId);
    try {
      const docSnapshot = await getDoc(specificDocRef)
      if (!docSnapshot.exists()) {
        await setDoc(specificDocRef, {
          ...this.newThread.toJSON(),
        });
      }
    } catch (err) {
      console.error('Fehler beim Hinzufügen oder Aktualisieren des Threads:', err);
    }
  }


  async getAllChannelMembers() {
    if (this.currentChat?.id) {
      const channelDocRef = doc(this.firestore, `channels/${this.currentChat.id}`);
      try {
        const channelDocSnap = await getDoc(channelDocRef);
        if (channelDocSnap.exists()) {
          const channelData = channelDocSnap.data();
          const channelMembersJson = channelData?.['members'] || [];
          const channelMembers = JSON.parse(channelMembersJson);
          this.allChannelMembers = channelMembers;
          this.firstThreeItems = this.allChannelMembers.slice(0, 3);
        }
      } catch (error) {
        console.error('Error getting channel document:', error);
      }
    }
  }

  editMessage(message: Message) {
    console.log('Nachricht', message);
    if (this.currentChat) {
      if (message.creator == this.currentUser.name) {
        this.edit = true;
      }
    }
  }

  async updateMessageContent(message: Message) {
    let messageId = message.id
    const messageColRef = doc(collection(this.firestore, `channels/${this.currentChat?.id}/messages/`), messageId);
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
    this.message.content = this.editor.nativeElement.value;
  }
}