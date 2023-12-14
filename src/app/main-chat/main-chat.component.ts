import { Component, ElementRef, OnInit, ViewChild, inject, HostListener, Input, Directive } from '@angular/core';
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

export class MainChatComponent implements OnInit {
  firestore: Firestore = inject(Firestore);
  currentChat!: Channel | undefined;
  message: Message = new Message();
  reaction: Reaction = new Reaction;
  newThread = new Thread();
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
  isInputFocused: boolean = false;
  showUploadedFile: boolean = false;
  @Input() monitoredVariable: any;
  @ViewChild('search') search!: ElementRef;
  @ViewChild('editor') editor!: ElementRef;
  @ViewChild('thread') threadDrawer!: MatDrawer;
  @ViewChild('emojiPicker') emojiPickerElementRef!: ElementRef;
  @ViewChild('messageContainer') messageContainer!: ElementRef;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;

  constructor(public dialog: MatDialog, public chatService: ChatService, public userService: UserService, public threadService: ThreadService, public authService: AuthService, public emojiService: EmojiService, public firestoreService: FirestoreService, public router: Router) {
    userService.getCurrentUserFromLocalStorage();
    this.currentUser = this.userService.currentUser as User;
    firestoreService.loadUsers();
  }

  async ngOnInit() {
    this.chatService.openChat$.subscribe((openChat) => {
      if (openChat) {
        const newChat = openChat as Channel;
        this.userService.setCurrentChatToLocalStorage(newChat);
        console.log("openChat ist vorhanden", newChat)
        if (!this.currentChat || this.currentChat.id !== newChat.id) {
          this.getCurrentChatFromLocalStorage();
          this.currentChat = newChat;

          console.log("currentchat = newChat", newChat)
          this.threadService.currentChat = newChat;
          if (this.firestoreService.unSubChannelMessages) {
            this.firestoreService.unSubChannelMessages();
          }
        }
        this.firestoreService.loadChannelMessages(this.currentChat);
        this.firestoreService.getAllChannelMembers(this.currentChat.id);
      } else {
        this.currentChat = this.currentChat;
        console.log("currentchat ist vorhanden", this.currentChat)
      }
    });
    this.checkEventEmitters();
  }


  getCurrentChatFromLocalStorage(): void {
    const chatJson = localStorage.getItem('currentChat');
    if (chatJson) {
      this.currentChat = JSON.parse(chatJson) as Channel;
    } else {
      console.log('Kein currentChat im LocalStorage gefunden');
      return
    }
  }

  /**
   * This functions is used for the eventemitters of the thread behavior and scroll behavior of messages
   */
  checkEventEmitters() {
    this.threadService.openThread.subscribe(() => {
      this.threadDrawer.open();
      this.threadService.isThreadInDM = false;
    })
    this.threadService.changeChat.subscribe(() => {
      this.threadDrawer.close();
      this.threadService.isThreadInDM = false;
    })
    this.firestoreService.messageAdded.subscribe(() => {
      this.scrollToBottom();
    });
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
    console.log('Before sendMessage - allMessagesOfChannel:', this.chatService.allMessagesOfChannel);
    if (this.currentChat?.id && this.message.content?.trim() !== '') {
      this.showUploadedFile = false;
      this.message.content = this.message.content!.replace(this.taggedNames, '');
      this.getSentMessageTimeAndDate();
      this.setMessageValuesForSentMessage();
      this.message.messageSelected = false;
      await this.firestoreService.sendMessageInChannel(this.currentChat, this.message);
      this.taggedNames = "";
      this.message = new Message();
      this.scrollToBottom();
    }
  }


  /**
   * Sets values for sent Message
   */
  setMessageValuesForSentMessage() {
    if (this.currentChat) {
      this.message.creator = this.userService.currentUser.name;
      this.message.creatorId = this.userService.currentUser.id,
        this.message.channel = this.currentChat.name;
      this.message.channelID = this.currentChat.id;
      this.message.profilePic = this.userService.currentUser.picture,
        this.message.channel = this.currentChat.name;
      this.message.channel = this.currentChat.name;
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
  //----------------------------------------------------------------------------------------------------

  /**
   * Opens the emoji picker for a specific message.
   * @param {any} messageId - The ID of the message to add an emoji to.
   */
  openEmojiPicker(messageId: any) {
    setTimeout(() => {
      this.emojiService.showMainChatEmojiPicker = true;
    }, 1);
    this.emojiService.messageId = messageId;
  }

  /**
   * Opens the emoji picker for the chat input field.
   */
  openEmojiPickerChat() {
    setTimeout(() => {
      this.emojiService.showTextChatEmojiPicker = true;
    }, 1);
  }

  /**
   * Closes the emoji picker.
   */
  closeEmojiPicker() {
    if (this.emojiService.showMainChatEmojiPicker == true || this.emojiService.showTextChatEmojiPicker == true && this.emojiService.emojiString == "") {
      this.emojiService.showMainChatEmojiPicker = false;
      this.emojiService.showTextChatEmojiPicker = false;
    }
    this.userService.openUserContainerTextfield.next(false);
  }

  /**
   * Adds an emoji to a message.
   * @param {any} event - The emoji select event.
   */
  addEmoji(event: any) {
    if (this.emojiService.messageId != "") {
      this.emojiService.addEmojiMainChat(event);
      this.firestoreService.addReaction(this.emojiService.emojiString, this.emojiService.messageId, this.currentChat?.id, 'channels')
      this.emojiService.showMainChatEmojiPicker = false;
      this.emojiService.emojiString = "";
    }
  }

  /**
   * Adds an emoji to the chat input field.
   * @param {any} $event - The emoji select event.
   */
  addEmojiTextField($event: any) {
    this.emojiService.addEmojiTextChat($event);
    this.message.content += this.emojiService.emojiString;
    this.emojiService.emojiString = "";
  }

  /**
   * Opens a thread based on a specific message.
   * @param {Message} message - The message to create a thread for.
   */
  async openThread(message: Message) {
    let messageId = message.id;
    await this.threadService.createThread(messageId, this.newThread);
    this.threadService.openMessage = message;
    if (this.chatService.isMobile) {
      this.router.navigate(['thread']);
    } else {
      this.threadDrawer.open();
    }
  }

  /**
   * Enables editing mode for a specific message.
   * @param {Message} message - The message to be edited.
   */
  editMessage(message: Message) {
    if (this.currentChat) {
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
  /**
   * Filters users based on search input.
   */
  filterUsers(): void {
    this.isInputFocused = true;
    this.firestoreService.filterAllUsers()
  }

  /**
   * Stops propagation of a user selection event.
   * @param {Event} event - The DOM event.
   */
  userSelected(event: Event) {
    event.stopPropagation();
  }

  /**
   * Selects a user to start a direct message chat.
   * @param {any} user - The selected user.
   */
  selectUser(user: any) {
    this.chatService.createDirectMessage(user);
    this.search.nativeElement.value = '';
  }

  /**
   * 
   * @param user 
   */
  getUserNameString(user: any) {
    let taggedName: any;
    taggedName = `@${user.name}`;
    this.taggedNames += `@${user.name}`;
    console.log(this.taggedNames);
    this.message.content += taggedName!;
    this.message.mentions.push(user);
    this.userService.openUserContainerTextfield.next(false);
  }

  /**
   * Checks click events on the document to manage input focus.
   * @param {Event} event - The click event.
   */
  @HostListener('document:click', ['$event'])
  checkClick(event: Event) {
    const clickedElement = event.target as HTMLElement;
    if (!clickedElement.classList.contains('user-search-container') && !clickedElement.classList.contains('user-container') && this.isInputFocused && !clickedElement.classList.contains('input-members')) {
      this.isInputFocused = false;
    }
  }

  /**
   * Handles file selection for uploading images or other files.
   * @param {any} event - The file input event.
   */
  onFileSelected(event: any): void {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > 500000) {
        alert("Max file size 500kb !");
      } else {
        this.authService.uploadProfileImage(file);
        this.firestoreService.showSpinner = true;
      }
      this.resetStatus();
    }
  }

  /**
   * Resets status of spinner and uploaded files
   */
  resetStatus() {
    setTimeout(() => {
      this.message.files.push(this.authService.customPic);
      console.log(this.message);
      this.firestoreService.showSpinner = false;
    }, 2000);
    this.showUploadedFile = true;
  }
}