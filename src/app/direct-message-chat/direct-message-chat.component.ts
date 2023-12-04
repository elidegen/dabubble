import { Component, ElementRef, HostListener, OnInit, QueryList, ViewChild, ViewChildren, inject } from '@angular/core';
import { DocumentData, DocumentReference, Firestore, addDoc, collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, updateDoc } from '@angular/fire/firestore';
import { ChatService } from '../chat.service';
import { UserService } from '../user.service';
import { Message } from 'src/models/message.class';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../auth.service';
import { EmojiService } from '../emoji.service';
import { Chat } from 'src/models/chat.class';


@Component({
  selector: 'app-direct-message-chat',
  templateUrl: './direct-message-chat.component.html',
  styleUrls: ['./direct-message-chat.component.scss']
})
export class DirectMessageChatComponent implements OnInit{
  @ViewChildren('userContainer') userContainers!: QueryList<any>;
  @ViewChild('messageContainer') messageContainer!: ElementRef;
  firestore: Firestore = inject(Firestore);
  currentChat!: Chat | undefined;
  currentUser;
  message: Message = new Message();
  organizedMessages: { date: string, messages: Message[] }[] = []
  messagesByDate: { [date: string]: Message[] } = {};
  messageIsExisting!: boolean;
  allMessages: Message[] = [];
  // ------------- for editing of message ----------------
  edit: boolean = false;
  editingMessage: string | undefined;
  @ViewChild('editor') editor!: ElementRef;
  unSubMessages: any;

  constructor(public dialog: MatDialog, public chatService: ChatService, public userService: UserService, public authService: AuthService, public emojiService: EmojiService) {
    userService.getCurrentUserFromLocalStorage();
    this.currentUser = this.userService.currentUser;

  }


  ngOnInit() {
    this.chatService.openDirectMessage$.subscribe((openDirectMessage) => {
      if (openDirectMessage) {
        const newChat = openDirectMessage as Chat;
        if (!this.currentChat || this.currentChat.id !== newChat.id) {
          this.currentChat = newChat;
          if (this.unSubMessages) {
            this.unSubMessages();
          }
          this.loadMessages();
          // this.getAllChannelMembers();
        }
      } else {
        this.currentChat = undefined;
      }
  
    });
  }

  ngOnDestroy() {
    if (this.unSubMessages) {
      this.unSubMessages();
    }
  }

  loadMessages() {
    if (this.currentChat?.id) {
      const messageCollection = collection(this.firestore, `direct messages/${this.currentChat.id}/messages`);
      const q = query(messageCollection, orderBy('timeInMs', 'asc'));
      this.unSubMessages = onSnapshot(q, async (snapshot) => {
        this.allMessages = await Promise.all(snapshot.docs.map(async doc => {
          const message = doc.data() as Message;
          message.reactionCount = this.setEmojiCount(message.reaction);
          message.id = doc.id;
          return message;
        }));
        console.log('chat',this.currentChat);
        
        this.organizeMessagesByDate();
        this.checkMessageNumbers()
      });
    }
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

  checkMessageNumbers() {
    if(this.allMessages.length > 0){
      this.messageIsExisting = true;
    } else {
      this.messageIsExisting = false
    }
    console.log(this.messageIsExisting);
    
  }


  async sendMessage() {
    if (this.currentChat?.id && this.message.content?.trim() !== '') {
      this.getSentMessageTime();
      this.getSentMessageDate();
      this.message.creator = this.userService.currentUser.id;
      this.message.channel = this.currentChat.name;
      this.message.channelID = this.currentChat.id;
      const subColRef = collection(this.firestore, `direct messages/${this.currentChat.id}/messages`);
      await addDoc(subColRef, this.message.toJSON())
        .catch((err) => {
          console.log(err);
        })
        .then((docRef: void | DocumentReference<DocumentData, DocumentData>) => {
          if (docRef && docRef instanceof DocumentReference) {
            if (this.currentChat?.id) {
              this.updateMessageId(`direct messages/${this.currentChat.id}/messages`, this.message, docRef.id);
            }
          }
          this.message.content = '';
        });
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


  async updateMessageContent(message: Message) {
    let messageId = message.id
    const messageColRef = doc(collection(this.firestore, `direct messages/${this.currentChat?.id}/messages/`), messageId);
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
      const subReactionColRef = doc(collection(this.firestore, `direct messages/${this.currentChat.id}/messages`), messageId);
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

  openEmojiPicker(messageId: any) {
    setTimeout(() => {
      this.emojiService.showMainChatEmojiPicker = true;
    }, 1);

    this.emojiService.messageId = messageId;
  }


  openEmojiPickerChat() {
    setTimeout(() => {
      this.emojiService.showTextChatEmojiPicker = true;
    }, 1);
  }


  editMessage(message: Message) {
    console.log('Nachricht', message);
    if (this.currentChat) {
      if (message.creator == this.currentUser.name) {
        this.edit = true;
        this.editingMessage = message.id; // Speichern Sie die ID der bearbeiteten Nachricht
      }
    }
  } 

 





  scrollToBottom(): void {
    this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
  }

  updateMessage(message: any) {
    return {
      reaction: message.reaction
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

  addEmoji(event: any) {
    if (this.emojiService.messageId != "") {
      this.emojiService.addEmojiMainChat(event);
      this.addReaction(this.emojiService.emojiString, this.emojiService.messageId)
      this.emojiService.showMainChatEmojiPicker = false;
    }
  }


  addEmojiTextField($event: any) {
    this.emojiService.addEmojiTextChat($event);
    console.log("das ist das Emoji für die Textnachricht",this.emojiService.emojiString);
     this.message.content += this.emojiService.emojiString;
  }

}