import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogEditChannelComponent } from '../dialog-edit-channel/dialog-edit-channel.component';
import { DialogAddToGroupComponent } from '../dialog-add-to-group/dialog-add-to-group.component';
import { DialogShowGroupMemberComponent } from '../dialog-show-group-member/dialog-show-group-member.component';
import { MatDrawer } from '@angular/material/sidenav';
import { Firestore, addDoc, arrayUnion, collection, doc, updateDoc } from '@angular/fire/firestore';
import { ChatService } from '../chat.service';
import { Channel } from 'src/models/channel.class';
import { Message } from 'src/models/message.class';
import { DocumentData, DocumentReference, onSnapshot, orderBy, query } from 'firebase/firestore';
import { UserService } from '../user.service';
import { UserData } from '../interfaces/user-interface';
import { Reaction } from 'src/models/reaction.class';

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


  constructor(public dialog: MatDialog, private chatService: ChatService, private userService: UserService) {
    userService.getCurrentUserFromLocalStorage();
    this.currentUser = this.userService.currentUser;
    // console.log('currentuser: ', this.currentUser);
  }

  ngOnInit() {
    this.chatService.openChat$.subscribe((openChat) => {
      if (openChat) {
        const newChat = openChat as Channel;

        if (!this.currentChat || this.currentChat.id !== newChat.id) {
          this.currentChat = newChat;
          this.loadMessages();
        }
      }
    });
  }

  ngOnDestroy() {
    this.unSubMessages;
    this.unSubReactions;
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
    if (this.currentChat?.id) {
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

  getUpdateData(message: any) {
    return {
      creator: this.userService.currentUser.name,
      creatorId: this.userService.currentUser.id,
      content: message.content,
      time: message.time,
      date: message.date,
      id: message.id,
      profilePic: this.userService.currentUser.picture,
      reaction: []
    };
  }

  loadMessages() {
    if (this.currentChat?.id) {
      const messageCollection = collection(this.firestore, `channels/${this.currentChat.id}/messages`);
      const q = query(messageCollection, orderBy('timeInMs', 'asc'));
      console.log(q)
      this.unSubMessages = onSnapshot(q, (snapshot) => {
        this.allMessages = snapshot.docs.map(doc => {
          const message = doc.data() as Message;
          message.id = doc.id;
          return message;
        });
        console.log('all Messages:', this.allMessages);

        this.organizeMessagesByDate();
      });
    }
  }

  // loadAllReactions() {
  //   if (this.currentChat?.id && this.message?.id) {
  //     this.allReactionsByMessage = {};
  //     const reactionsCollection = collection(
  //       this.firestore,
  //       `channels/${this.currentChat.id}/messages/${this.message.id}/reactions`
  //     );

  //     this.unSubReactions = onSnapshot(reactionsCollection, (snapshot) => {
  //       snapshot.docChanges().forEach((change) => {
  //         const reaction = change.doc.data() as Reaction;
  //         reaction.id = change.doc.id;

  //         // Stelle die Beziehung zwischen Reaktionen und Nachrichten her
  //         const messageId = this.message.id;
  //         if (messageId) {
  //           this.allReactionsByMessage[messageId] = this.allReactionsByMessage[messageId] || [];
  //           this.allReactionsByMessage[messageId].push(reaction);
  //         }
  //       });
  //     });
  //   }
  // }


  async addReaction(emoji: string, messageId: any) {
    if (this.currentChat?.id) {
      console.log('welche naxhricht ist das?', messageId);
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
    const name = this.userService.currentUser.name;
    const profilePic = this.userService.currentUser.picture;

    this.message.creator = name;
    this.message.profilePic = profilePic;
  }

  getSingleDocRef(colId: string, docId: string) {
    return doc(collection(this.firestore, colId), docId);
  }

  getChannelsRef() {
    return collection(this.firestore, 'channels');
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
    // console.log('Check organized messages', this.messagesByDate);
  }
}