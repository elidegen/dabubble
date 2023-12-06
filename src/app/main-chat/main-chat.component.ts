import { Component, ElementRef, OnInit, ViewChild, inject, HostListener } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogEditChannelComponent } from '../dialog-edit-channel/dialog-edit-channel.component';
import { DialogAddToGroupComponent } from '../dialog-add-to-group/dialog-add-to-group.component';
import { DialogShowGroupMemberComponent } from '../dialog-show-group-member/dialog-show-group-member.component';
import { MatDrawer } from '@angular/material/sidenav';
import { Firestore, collection, doc, updateDoc } from '@angular/fire/firestore';
import { ChatService } from '../chat.service';
import { Channel } from 'src/models/channel.class';
import { Message } from 'src/models/message.class';
import { UserService } from '../user.service';
import { Reaction } from 'src/models/reaction.class';
import { ThreadService } from '../thread.service';
import { Thread } from 'src/models/thread.class';
import { AuthService } from '../auth.service';
import { EmojiService } from '../emoji.service';
import { User } from 'src/models/user.class';
import { FirestoreService } from '../firestore.service';

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
  currentUser: User;
  allReactionsByMessage: [] = [];
  threadCount: any = 0;
  showEmojiPick: boolean = false;
  toggled: boolean = false;
  edit: boolean = false;
  @ViewChild('editor') editor!: ElementRef;
  @ViewChild('emojiPicker') emojiPickerElementRef!: ElementRef;
  editingMessage: string | undefined;
  newThread = new Thread();
  taggedName: any;
  dataSrc: any;

  // ------------------ search Input ---------------
  isInputFocused: boolean = false;
  @ViewChild('search') search!: ElementRef;
  // ----------------------------------------------------

  constructor(public dialog: MatDialog, public chatService: ChatService, public userService: UserService, public threadService: ThreadService, public authService: AuthService, public emojiService: EmojiService, public firestoreService: FirestoreService) {
    userService.getCurrentUserFromLocalStorage();
    this.currentUser = this.userService.currentUser as User;
    firestoreService.loadUsers();
  }

  ngOnInit() {
    this.chatService.openChat$.subscribe((openChat) => {
      if (openChat) {
        const newChat = openChat as Channel;
        if (!this.currentChat || this.currentChat.id !== newChat.id) {
          this.currentChat = newChat;
          this.threadService.currentChat = newChat;
          if (this.firestoreService.unSubChannelMessages) {
            this.firestoreService.unSubChannelMessages();
          }
          this.firestoreService.loadChannelMessages(this.currentChat)
          this.firestoreService.getAllChannelMembers(this.currentChat.id);
        }
      } else {
        this.currentChat = undefined;
      }
    });
  }

  ngOnDestroy() {
    if (this.firestoreService.unSubChannelMessages) {
      this.firestoreService.unSubChannelMessages();
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
      this.message.creator = this.userService.currentUser.name;
      this.message.creatorId = this.userService.currentUser.id,
        this.message.channel = this.currentChat.name;
      this.message.channelID = this.currentChat.id;
      this.message.profilePic = this.userService.currentUser.picture,
        this.message.channel = this.currentChat.name;
      this.message.messageSelected = false;
      await this.firestoreService.sendMessageInChannel(this.currentChat, this.message)
      this.message.content = '',
        this.chatService.setViewedByZero(this.currentChat);
      this.chatService.setViewedByMe(this.currentChat, this.currentUser as User);
      console.log("Nachricht mit der Datei", this.message);
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


  closeEmojiPicker() {
    if (this.emojiService.showMainChatEmojiPicker == true || this.emojiService.showTextChatEmojiPicker == true && this.emojiService.emojiString == "") {
      this.emojiService.showMainChatEmojiPicker = false;
      this.emojiService.showTextChatEmojiPicker = false;
    }
    this.userService.openUserContainerTextfield.next(false);
  }

  addEmoji(event: any) {
    if (this.emojiService.messageId != "") {
      this.emojiService.addEmojiMainChat(event);
      this.firestoreService.addReaction(this.emojiService.emojiString, this.emojiService.messageId, this.currentChat?.id, 'channels')
      this.emojiService.showMainChatEmojiPicker = false;
      this.emojiService.emojiString = "";
    }
  }

  addEmojiTextField($event: any) {
    this.emojiService.addEmojiTextChat($event);
    this.message.content += this.emojiService.emojiString;
    this.emojiService.emojiString = "";
  }

  async openThread(message: Message) {
    let messageId = message.id;
    await this.firestoreService.createThread(messageId, this.newThread);
    this.threadDrawer.open();
    this.threadService.openMessage = message;
  }

  editMessage(message: Message) {
    if (this.currentChat) {
      if (message.creator == this.currentUser.name) {
        this.edit = true;
        this.editingMessage = message.id;
      }
    }
  }

  async updateMessageContent(message: Message) {
    let messageId = message.id
    const messageColRef = doc(collection(this.firestore, `channels/${this.currentChat?.id}/messages/`), messageId);
    await updateDoc(messageColRef, this.setMessageValues())
      .catch((error) => {
        console.error('Error updating document:', error);
      });
    this.edit = false;
  }

  setMessageValues() {
    return {
      content: this.editor.nativeElement.value
    }
  }

  // ---------------- search Input -------------------------
  filterUsers(): void {
    this.isInputFocused = true;
    this.firestoreService.filterAllUsers()
  }

  userSelected(event: Event) {
    event.stopPropagation();
  }

  selectUser(user: any) {
    this.chatService.createDirectMessage(user);
    this.search.nativeElement.value = '';
  }

  getUserNameString(user: any) {
    this.taggedName = `@${user.name}`;
    this.message.content += this.taggedName;
    this.message.mentions.push(this.taggedName);
    this.userService.openUserContainerTextfield.next(false);
  }

  @HostListener('document:click', ['$event'])
  checkClick(event: Event) {
    const clickedElement = event.target as HTMLElement;
    if (!clickedElement.classList.contains('user-search-container') && !clickedElement.classList.contains('user-container') && this.isInputFocused && !clickedElement.classList.contains('input-members')) {
      this.isInputFocused = false;
    }
  }

  onFileSelected(event: any): void {
    console.log("Übergebene Datei:", event)
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      this.authService.uploadProfileImage(file);
    }
    setTimeout(() => {
      this.message.file = this.authService.customPic;
      console.log(this.message);
    }, 1500);
  }
}