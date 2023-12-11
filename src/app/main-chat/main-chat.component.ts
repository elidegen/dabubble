import { Component, ElementRef, OnInit, ViewChild, inject, HostListener, AfterViewInit, OnChanges, SimpleChanges, Input } from '@angular/core';
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
import { DialogViewProfileComponent } from '../dialog-view-profile/dialog-view-profile.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-main-chat',
  templateUrl: './main-chat.component.html',
  styleUrls: ['./main-chat.component.scss', './main-chat.mediaquery.component.scss']
})
export class MainChatComponent implements OnInit, AfterViewInit, OnChanges {
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
  taggedNames = "";
  dataSrc: any;
  showUploadedFile = false;
  scrollPosition: any;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;
  @Input() monitoredVariable: any;

  // ------------------ search Input ---------------
  isInputFocused: boolean = false;
  @ViewChild('search') search!: ElementRef;
  // ----------------------------------------------------

  constructor(public dialog: MatDialog, public chatService: ChatService, public userService: UserService,
    public threadService: ThreadService, public authService: AuthService, public emojiService: EmojiService,
    public firestoreService: FirestoreService, public router: Router) {
    userService.getCurrentUserFromLocalStorage();
    this.currentUser = this.userService.currentUser as User;
    firestoreService.loadUsers();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // if(changes.chatService.chatWindow)
  }

  ngAfterViewInit(): void {
    this.scrollToBottom();
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
        }
        this.firestoreService.loadChannelMessages(this.currentChat);
        this.firestoreService.getAllChannelMembers(this.currentChat.id);
      } else {
        this.currentChat = this.currentChat;
      }
    
    });

    this.threadService.openThread.subscribe(() => {
      this.threadDrawer.open();
      this.threadService.isThreadInDM = false;
    })

    this.threadService.changeChat.subscribe(() => {
      this.threadDrawer.close();
      this.threadService.isThreadInDM = false;
    })
    
  }

  ngOnDestroy() {
    if (this.firestoreService.unSubChannelMessages) {
      this.firestoreService.unSubChannelMessages();
    }
  }

  openEditChannelDialog() {
    if (!this.chatService.isMobile) {
      this.dialog.open(DialogEditChannelComponent, {
        panelClass: 'dialog-container'
      });
    } else {
      this.router.navigate(['editChannel']);
    }
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
    this.threadService.isThreadInDM = false;
  }

  async sendMessage() {
    console.log('Before sendMessage - allMessagesOfChannel:', this.chatService.allMessagesOfChannel);
    if (this.currentChat?.id && this.message.content?.trim() !== '') {
      this.showUploadedFile = false;
      this.message.content = this.message.content!.replace(this.taggedNames, '');
      this.getSentMessageTime();
      this.getSentMessageDate();
      this.message.creator = this.userService.currentUser.name;
      this.message.creatorId = this.userService.currentUser.id,
        this.message.channel = this.currentChat.name;
      this.message.channelID = this.currentChat.id;
      this.message.profilePic = this.userService.currentUser.picture,
        this.message.channel = this.currentChat.name;
      this.message.channel = this.currentChat.name;
      this.message.messageSelected = false;
      await this.firestoreService.sendMessageInChannel(this.currentChat, this.message);
      this.taggedNames = "";
      this.message = new Message();
    }
    this.scrollToBottom();
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
    if (this.scrollContainer) {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    }
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
    this.threadService.openMessage = message;
    if (this.chatService.isMobile) {
      this.router.navigate(['thread']);
    } else {
      this.threadDrawer.open();
    }
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
    let taggedName: any;
    taggedName = `@${user.name}`;
    this.taggedNames += `@${user.name}`;
    console.log(this.taggedNames);
    this.message.content += taggedName!;
    this.message.mentions.push(user);
    this.userService.openUserContainerTextfield.next(false);
  }

  openProfileDialog(id: any): void {
    this.dialog.open(DialogViewProfileComponent, {
      panelClass: 'dialog-container',
      data: { userID: id },
    });
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
      if (file.size > 500000) {
        alert("Max file size 500kb !");
      } else {
      this.authService.uploadProfileImage(file);
      this.firestoreService.showSpinner = true;
    }
    setTimeout(() => {
      this.message.files.push(this.authService.customPic);
      console.log(this.message);
      this.firestoreService.showSpinner = false;
    }, 2000);
    this.showUploadedFile = true;
  }
  }

  logOutUser() {
    this.authService.signOutUser();
    this.router.navigate(['']);
  }
}