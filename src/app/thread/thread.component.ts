import { Component, EventEmitter, Output, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { ThreadService } from '../thread.service';
import { Thread } from 'src/models/thread.class';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from '../user.service';
import { AuthService } from '../auth.service';
import { ChatService } from '../chat.service';
import { Firestore, collection, doc, updateDoc } from '@angular/fire/firestore';
import { Channel } from 'src/models/channel.class';
import { Reaction } from 'src/models/reaction.class';
import { Message } from 'src/models/message.class';
import { EmojiService } from '../emoji.service';
import { FirestoreService } from '../firestore.service';
import { User } from 'src/models/user.class';
import { DialogViewProfileComponent } from '../dialog-view-profile/dialog-view-profile.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-thread',
  templateUrl: './thread.component.html',
  styleUrls: ['./thread.component.scss', './thread.component.mediaquery.scss']
})

export class ThreadComponent implements OnInit {
  threadContent = "";
  firestore: Firestore = inject(Firestore);
  currentChat!: Channel | undefined;
  message: Message = new Message();
  reaction: Reaction = new Reaction;
  threadMessagesByDate: { [date: string]: Message[] } = {};
  sortedThreadMessages: { date: string, messages: Message[] }[] = []
  allReactionsByMessage: [] = [];
  currentMessage: any = [];
  showUploadedFile = false;
  taggedNames = "";
  unSubReactions: any;
  currentUser: User;
  currentThread: [] = [];
  toggled: boolean = false;
  @ViewChild('editorThread') editorThread!: ElementRef;
  @Output() closeThread: EventEmitter<void> = new EventEmitter<void>();
  edit: boolean = false;
  editingThreadMessage: string | undefined;

  constructor(public threadService: ThreadService, public dialog: MatDialog, public userService: UserService,
    public authService: AuthService, public chatService: ChatService, public emojiService: EmojiService, 
    public firestoreService: FirestoreService, public router: Router) {
    userService.getCurrentUserFromLocalStorage();
    this.currentUser = this.userService.currentUser;
  }

  ngOnInit() {
    this.threadService.openMessage$.subscribe((openMessage) => {
      if (openMessage) {
        const message = openMessage as Message;
        if (!this.currentMessage || this.currentMessage.id !== message.id) {
          this.currentMessage = message;
          this.threadService.currentMessage = message;
          if (this.firestoreService.unSubThread) {
            this.firestoreService.unSubThread();
          }
          this.firestoreService.loadThread(this.currentMessage.id);
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.firestoreService.unSubThread) {
      this.firestoreService.unSubThread(); // Bestehendes Abonnement kündigen
    }
  }


  async addMessageToThread() {
    if (this.currentMessage.id && this.message.content?.trim() !== '') {
      this.message.content = this.message.content!.replace(this.taggedNames, '');
      this.getSentMessageTime();
      this.getSentMessageDate();
      this.message.creator = this.userService.currentUser.name;
      this.message.profilePic = this.userService.currentUser.picture;
      this.message.creatorId = this.userService.currentUser.id;
      await this.firestoreService.sendMessageInThread(this.currentMessage.id, this.message);
      this.message = new Message();
    }
    this.threadService.updateThreadCount(this.threadService.currentMessage, this.message.time);
  }


  openEmojiPicker(messageId: any) {
    setTimeout(() => {
      this.emojiService.showThreadEmojiPicker = true;
    }, 1);
    this.emojiService.messageId = messageId;
  }

  getUserNameString(user: any) {
    let taggedName: any;
    taggedName = `@${user.name}`;
    this.taggedNames +=  `@${user.name}`;
    console.log(this.taggedNames);
    this.message.content += taggedName!;
    this.message.mentions.push(user);
    this.userService.openUserContainerTextfield.next(false);
  }

  openEmojiPickerChat() {
    setTimeout(() => {
      this.emojiService.showThreadTextChatEmojiPicker = true;
    }, 1);
  }



  closeEmojiPicker() {
    if (this.emojiService.showThreadEmojiPicker == true  || this.emojiService.showThreadTextChatEmojiPicker == true &&  this.emojiService.emojiString == "") {
      this.emojiService.showThreadEmojiPicker = false;
      this.emojiService.showThreadTextChatEmojiPicker = false;
    }
    this.userService.openUserContainerThreadTextfield.next(false);
  }


 addEmoji($event: any) {
  this.emojiService.addEmojiThread($event);
  this.firestoreService.addReaction(this.emojiService.emojiString, this.emojiService.messageId, this.currentMessage.id, 'threads');
  console.log(this.emojiService.emojiString, this.emojiService.messageId);
  this.emojiService.showThreadEmojiPicker = false;
  this.emojiService.emojiString = "";
 }



 addEmojiTextField($event: any) {
    this.emojiService.addEmojiTextChat($event);
    console.log("das ist das Emoji für die Textnachricht",this.emojiService.emojiString);
    this.message.content += this.emojiService.emojiString;
    this.emojiService.showThreadTextChatEmojiPicker = false;
    this.emojiService.emojiString = "";
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


  openProfileDialog(id: any): void {
    this.dialog.open(DialogViewProfileComponent, {
      panelClass: 'dialog-container',
      data: { userID: id },
    });
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
    };
  }


  onCloseClick() {
    if (this.chatService.isMobile) {
      this.router.navigate(['main'])
    } else {
      this.closeThread.emit();
    }
  }


  editThreadMessage(message: Message) {
    if (this.currentMessage) {
      if (message.creator == this.currentUser.name) {
        this.edit = true;
        this.editingThreadMessage = message.id;
        this.firestoreService.toggleMoreMenu(message);
      }
    }
  }


   
  onFileSelected(event: any): void {
    console.log("Übergebene Datei:", event)
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      this.authService.uploadProfileImage(file);
      this.firestoreService.showSpinner = true;
    }
    setTimeout(() => {
      this.message.files.push(this.authService.customPic);
      console.log(this.message);
      this.firestoreService.showSpinner = false;
    }, 1500);
    this.showUploadedFile = true;
  }

  async updateMessageContent(message: Message) {
    let messageId = message.id
    const messageColRef = doc(collection(this.firestore, `threads/${this.currentMessage?.id}/messages/`), messageId);
    await updateDoc(messageColRef, this.setMessageValues()).catch((error) => {
      console.error('Error updating document:', error);
    });
    this.edit = false;
  }


  setMessageValues() {
    return {
      content: this.editorThread.nativeElement.value
    }
  }

  logOutUser() {
    this.authService.signOutUser();
    this.router.navigate(['']);
  }
}
