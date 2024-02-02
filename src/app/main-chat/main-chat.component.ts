
import { User } from 'src/models/user.class';
import { Router } from '@angular/router';
import { Thread } from 'src/models/thread.class';
import { emojis } from '@ctrl/ngx-emoji-mart/ngx-emoji';
import { Channel } from 'src/models/channel.class';
import { Message } from 'src/models/message.class';
import { Reaction } from 'src/models/reaction.class';
import { MatDrawer } from '@angular/material/sidenav';
import { MatDialog } from '@angular/material/dialog';
import { ChatService } from '../services/chat.service';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { EmojiService } from '../services/emoji.service';
import { ThreadService } from '../services/thread.service';
import { FirestoreService } from '../services/firestore.service';
import { DialogAddToGroupComponent } from '../dialog-add-to-group/dialog-add-to-group.component';
import { DialogEditChannelComponent } from '../dialog-edit-channel/dialog-edit-channel.component';
import { DialogViewProfileComponent } from '../dialog-view-profile/dialog-view-profile.component';
import { DialogShowGroupMemberComponent } from '../dialog-show-group-member/dialog-show-group-member.component';
import { Firestore, collection, doc, updateDoc } from '@angular/fire/firestore';
import { Component, ElementRef, OnInit, ViewChild, inject, Input } from '@angular/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-main-chat',
  templateUrl: './main-chat.component.html',
  styleUrls: ['./main-chat2.component.scss', './main-chat.component.scss', './main-chat.mediaquery.component.scss']
})

export class MainChatComponent implements OnInit {
  firestore: Firestore = inject(Firestore);
  currentChannel!: Channel | undefined;
  message: Message = new Message;
  reaction: Reaction = new Reaction;
  newThread = new Thread;
  currentUser: User;
  allReactionsByMessage: [] = [];
  editingMessage: string | undefined;
  taggedNames: string = "";
  threadCount: any = 0;
  dataSrc: any;
  scrollPosition: any;
  edit: boolean = false;
  toggled: boolean = false;
  showEmojiPick: boolean = false;
  showUploadedFile: boolean = false;
  @Input() monitoredVariable: any;
  @ViewChild('editor') editor!: ElementRef;
  @ViewChild('thread') threadDrawer!: MatDrawer;
  @ViewChild('emojiPicker') emojiPickerElementRef!: ElementRef;
  @ViewChild('messageContainer') messageContainer!: ElementRef;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;
  emojiSubscription: Subscription;


  constructor(public dialog: MatDialog,
    public chatService: ChatService,
    public userService: UserService,
    public threadService: ThreadService,
    public authService: AuthService,
    public emojiService: EmojiService,
    public firestoreService: FirestoreService,
    public router: Router) {
    userService.getCurrentUserFromLocalStorage();
    this.currentUser = this.userService.currentUser as User;
    firestoreService.loadUsers();
    chatService.checkScreenWidth();
    this.emojiSubscription = this.emojiService.emojiMain$.subscribe((emojiObj: any) => {
      if (emojiObj.textarea == 'channels') {
        this.message.content += emojiObj.emoji;
      }
    })
  }

  async ngOnInit() {
    this.chatService.openChat$.subscribe((openChat) => {
      if (openChat) {
        this.setCurrentChannel(openChat);
      } else {
        this.loadChannelFromLocalStorage();
        this.chatService.chatWindow = this.currentChannel!.type;
      }
    });
    this.checkEventEmitter();
  }

  /**
   * Loads selected channel as currentChannel
   * @param openChat 
   */
  setCurrentChannel(openChat: Channel) {
    const newChat = openChat;
    this.userService.setCurrentChatToLocalStorage(newChat);
    if (!this.currentChannel || this.currentChannel.id !== newChat.id) {
      this.currentChannel = newChat;
      this.threadService.currentChat = newChat;
      if (this.firestoreService.unSubChannelMessages) {
        this.firestoreService.unSubChannelMessages();
      }
    }
    this.firestoreService.loadChannelMessages(this.currentChannel);
    this.firestoreService.getAllChannelMembers(this.currentChannel.id);
  }

  /**
   * Loads channel from LocalStorage
   */
  loadChannelFromLocalStorage() {
    this.currentChannel = this.userService.getCurrentChatFromLocalStorage();
    if (this.currentChannel?.type == 'channel') {
      this.chatService.chatWindow = 'channel';
      this.firestoreService.loadChannelMessages(this.currentChannel);
      this.firestoreService.getAllChannelMembers(this.currentChannel?.id);
    } else if (this.currentChannel?.type == 'direct') {
      this.chatService.chatWindow = 'direct';
    } else {
      this.chatService.chatWindow = 'newMessage';
    }
  }

  /**
   * This functions is used for the eventemitters of the thread behavior and scroll behavior of messages
   */
  checkEventEmitter() {
    this.firestoreService.messageAdded.subscribe(() => {
      this.scrollToBottom();
    });
    this.userService.channelEdited.subscribe(() => {
      this.firestoreService.getAllChannelMembers(this.currentChannel?.id);
    })
  }

  ngOnDestroy() {
    if (this.firestoreService.unSubChannelMessages) {
      this.firestoreService.unSubChannelMessages();
    }
  }

  /**
   * Opens a dialog to edit the current channel's settings.
   */
  openEditChannelDialog() {
    if (!this.chatService.isMobile) {
      this.dialog.open(DialogEditChannelComponent, {
        panelClass: 'dialog-container'
      });
    } else {
      this.router.navigate(['editChannel']);
    }
  }

  /**
   * Opens a dialog to add new members to the current group.
   */
  openDialog() {
    this.dialog.open(DialogAddToGroupComponent, {
      panelClass: 'dialog-container'
    });
  }

  /**
   * Opens a dialog to display group members.
   */
  openMemberDialog() {
    this.dialog.open(DialogShowGroupMemberComponent, {
      panelClass: 'dialog-container'
    });
  }

  /**
   * Closes the thread drawer in the UI.
   */
  onCloseThread() {
    this.threadDrawer.close();
    this.threadService.isThreadInDM = false;
  }

  /**
  * Sends a chat message in the current channel.
  */
  async sendMessage() {
    if (this.currentChannel?.id && this.message.content?.trim() !== '' || this.showUploadedFile) {
      this.showUploadedFile = false;
      this.message.content = this.message.content!.replace(this.taggedNames, '');
      this.getSentMessageTimeAndDate();
      this.setMessageValuesForSentMessage();
      this.message.messageSelected = false;
      await this.firestoreService.sendMessageInChannel(this.currentChannel!, this.message);
      this.taggedNames = "";
      this.message = new Message();
      this.scrollToBottom();
    }
  }

  /**
   * Sets values for sent Message
   */
  setMessageValuesForSentMessage() {
    if (this.currentChannel) {
      this.message.creator = this.userService.currentUser.name;
      this.message.creatorId = this.userService.currentUser.id,
        this.message.channel = this.currentChannel.name;
      this.message.channelId = this.currentChannel.id;
      this.message.profilePic = this.userService.currentUser.picture,
        this.message.channel = this.currentChannel.name;
      this.message.channel = this.currentChannel.name;
    }
  }

  /**
   * Formats and sets the time and date for the sent message.
   */
  getSentMessageTimeAndDate() {
    const currentTime = new Date();
    this.message.timeInMs = currentTime.getTime();
    const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.message.time = formattedTime;
    const currentDate = this.getCurrentDate();
    const formattedDate = this.formatDate(currentDate);
    this.message.date = formattedDate;
    this.message.creator = this.userService.currentUser.id;
  }

  /**
   * Scrolls the chat window to the bottom, showing the most recent messages.
   */
  scrollToBottom(): void {
    if (this.scrollContainer) {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    }
  }

  /**
   * Determines if the given date is the current date. ------------------------------------------------
   * @param {string} date - The date to check.
   * @returns {boolean} - True if the date is today, false otherwise.
   */
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

  /**
   * Adds an emoji to a message.
   * @param {any} event - The emoji select event.
   */
  addEmoji(event: any) {
    if (this.emojiService.messageId != "") {
      this.emojiService.addEmoji(event);
      this.firestoreService.addReaction(this.emojiService.emojiString, this.emojiService.messageId, this.currentChannel?.id, 'channels')
      this.emojiService.showEmojiPicker = false;
      this.emojiService.emojiString = "";
    }
  }

  /**
   * Opens a thread based on a specific message.
   * @param {Message} message - The message to create a thread for.
   */
  async openThread(message: Message) {
    await this.threadService.createThread(message);
    this.threadService.openMessage = message;
    this.threadService.isThreadInDM = false;
    if (this.chatService.isMobile) {
      this.router.navigate(['thread']);
    } else {
      this.chatService.openThread();
      if (window.innerWidth >= 800 && window.innerWidth < 1350)
        this.chatService.closeWorkspace();
    }
  }

  screenSizeBelow1010() {
    return window.innerWidth > 1010;
  }

  /**
   * Enables editing mode for a specific message.
   * @param {Message} message - The message to be edited.
   */
  editMessage(message: Message) {
    if (this.currentChannel) {
      if (message.creator == this.currentUser.name) {
        this.edit = true;
        this.editingMessage = message.id;
      }
    }
  }

  /**
   * Updates the content of a message.
   * @param {Message} message - The message to be updated.
   */
  async updateMessageContent(message: Message) {
    let messageId = message.id;
    const messageColRef = doc(collection(this.firestore, `channels/${this.currentChannel?.id}/messages/`), messageId);
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

  /**
  * Opens the profile view dialog for a specific user.
  * @param {any} id - The ID of the user.
  */
  openProfileDialog(id: any): void {
    this.dialog.open(DialogViewProfileComponent, {
      panelClass: 'dialog-container',
      data: { userID: id },
    });
  }

  /**
   * Generates and appends a tagged username string to the message content, updates the taggedNames property, and adds the user to the mentions list.
   * @param {any} user - The user for whom the tagged username string is generated.
   */
  getUserNameString(user: any) {
    let taggedName: any;
    taggedName = `@${user.name}`;
    this.taggedNames += `@${user.name}`;
    this.message.content += taggedName!;
    this.message.mentions.push(user);
    this.userService.openUserContainerTextfield.next(false);
  }

  /**
   * Handles file selection for uploading images or other files.
   * @param {any} event - The file input event.
   */
  onFileSelected(event: any): void {
    if (event.target.files) {
      const file = event.target.files[0];
      if (file.size > 500000) {
        alert("Max file size 500kb !");
      } else {
        this.authService.uploadProfileImage(file);
        this.firestoreService.showSpinner = true;
      }
      this.resetStatus();
      event.target.value = '';
    }
  }

  /**
   * Resets status of spinner and uploaded files
   */
  resetStatus() {
    setTimeout(() => {
      this.message.files.push(this.authService.customPic);
      this.firestoreService.showSpinner = false;
    }, 2000);
    this.showUploadedFile = true;
  }
}