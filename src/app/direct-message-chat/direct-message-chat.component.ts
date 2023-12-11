import { Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren, inject } from '@angular/core';
import { Firestore, collection, doc, updateDoc } from '@angular/fire/firestore';
import { ChatService } from '../chat.service';
import { UserService } from '../user.service';
import { Message } from 'src/models/message.class';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../auth.service';
import { EmojiService } from '../emoji.service';
import { Chat } from 'src/models/chat.class';
import { User } from 'src/models/user.class';
import { DialogViewProfileComponent } from '../dialog-view-profile/dialog-view-profile.component';
import { FirestoreService } from '../firestore.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-direct-message-chat',
  templateUrl: './direct-message-chat.component.html',
  styleUrls: ['./direct-message-chat.component.scss', './direct-message.mediaquery.component.scss']
})
export class DirectMessageChatComponent implements OnInit {
  @ViewChildren('userContainer') userContainers!: QueryList<any>;
  @ViewChild('messageContainer') messageContainer!: ElementRef;
  firestore: Firestore = inject(Firestore);
  currentChat!: Chat | undefined;
  currentUser;
  message: Message = new Message();
  allMessages: Message[] = [];
  interlocutor: User = new User();
  taggedNames = "";
  showUploadedFile = false;
  // ------------- for editing of message ----------------
  edit: boolean = false;
  editingMessage: string | undefined;
  @ViewChild('editor') editor!: ElementRef;

  constructor(public dialog: MatDialog, public chatService: ChatService, public userService: UserService, 
    public authService: AuthService, public emojiService: EmojiService, public firestoreService: FirestoreService, public router: Router) {
    userService.getCurrentUserFromLocalStorage();
    this.currentUser = this.userService.currentUser;
  }

  ngOnInit() {
    this.chatService.openDirectMessage$.subscribe((openDirectMessage) => {
      if (openDirectMessage) {
        const newChat = openDirectMessage as Chat;
        if (!this.currentChat || this.currentChat.id !== newChat.id) {
          this.currentChat = newChat;
          if (this.firestoreService.unSubDirectMessages) {
            this.firestoreService.unSubDirectMessages();
          }
          this.loadMessages();
        }
      } else {
        this.currentChat = undefined;
      }
    });
  }

  ngOnDestroy() {
    if (this.firestoreService.unSubDirectMessages) {
      this.firestoreService.unSubDirectMessages;
    }
  }

  getUserNameString(user: any) {
    let taggedName: any;
    taggedName = `@${user.name}`;
    this.taggedNames += `@${user.name}`;
    this.message.content += taggedName!;
    this.message.mentions.push(user);
    this.userService.openUserContainerTextfield.next(false);
  }

  async loadMessages() {
    if (this.currentChat?.id) {
      await this.firestoreService.loadDirectMessages(this.currentChat.id);
    }
    this.interlocutor = this.chatService.getOtherUser(this.currentChat?.members);
  }

  openProfileDialog(id: any): void {
    this.dialog.open(DialogViewProfileComponent, {
      panelClass: 'dialog-container',
      data: { userID: id },
    });
  }

  onFileSelected(event: any): void {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      this.authService.uploadProfileImage(file);
      if (file.size > 500000) {
        alert("Max file size 500kb !");
      } else {
      this.firestoreService.showSpinner = true;
    }
    setTimeout(() => {
      this.message.files.push(this.authService.customPic);
      this.firestoreService.showSpinner = false;
    }, 1500);
    this.showUploadedFile = true;
  }
  }

  async sendMessage() {
    if (this.currentChat?.id && this.message.content?.trim() !== '') {
      this.message.content = this.message.content!.replace(this.taggedNames, '');
      this.getSentMessageTime();
      this.getSentMessageDate();
      this.message.creator = this.userService.currentUser.name;
      this.message.creatorId = this.userService.currentUser.id,
        this.message.channel = this.currentChat.name;
      this.message.channelID = this.currentChat.id;
      this.message.profilePic = this.userService.currentUser.picture,
        this.message.channel = this.currentChat.name;
      await this.firestoreService.sendMessageInDirectMessage(this.currentChat.id, this.message)
      this.setUnreadDM(this.currentChat.id);
      this.message = new Message();
    }
  }

  setUnreadDM(chatId: String) {
    const subColRef = doc(collection(this.firestore, `direct messages/${chatId}/`));
    updateDoc(subColRef, {
      unread: true
    })
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
    await updateDoc(messageColRef, this.setMessageValues()).catch((error) => {
      console.error('Error updating document:', error);
    });
    this.edit = false;
  }

  setMessageValues() {
    return {
      content: this.editor.nativeElement.value,
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

  addEmoji(event: any) {
    if (this.emojiService.messageId != "") {
      this.emojiService.addEmojiMainChat(event);
      this.firestoreService.addReaction(this.emojiService.emojiString, this.emojiService.messageId, this.currentChat?.id, 'direct messages')
      this.emojiService.showMainChatEmojiPicker = false;
    }
  }

  addEmojiTextField($event: any) {
    this.emojiService.addEmojiTextChat($event);
    this.message.content += this.emojiService.emojiString;
  }

  logOutUser() {
    this.authService.signOutUser();
    this.router.navigate(['']);
  }
}