import { Component, ElementRef, HostListener, OnInit, QueryList, ViewChild, ViewChildren, inject } from '@angular/core';
import { Firestore, collection, doc, onSnapshot, orderBy, query, updateDoc } from '@angular/fire/firestore';
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
import { ThreadService } from '../thread.service';
import { Thread } from 'src/models/thread.class';

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
  allUsers: User[] = [];
  taggedNames = "";
  showUploadedFile = false;
  newThread = new Thread();
  unsubscribeUsers: any;
  // ------------- for editing of message ----------------
  edit: boolean = false;
  editingMessage: string | undefined;
  @ViewChild('editor') editor!: ElementRef;
  scrollPosition: any;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;

  constructor(public dialog: MatDialog, public chatService: ChatService, public userService: UserService,
    public authService: AuthService, public emojiService: EmojiService, public firestoreService: FirestoreService,
    public router: Router, public threadService: ThreadService) {
    userService.getCurrentUserFromLocalStorage();
    this.currentUser = this.userService.currentUser;
    chatService.checkScreenWidth();
  }

  /**
 * Initializes the component by subscribing to openDirectMessage$ to handle direct message chat changes.
 */
  ngOnInit() {
    this.chatService.openDirectMessage$.subscribe((openDirectMessage) => {
      if (openDirectMessage) {
        const newChat = openDirectMessage as Chat;
        this.userService.setCurrentChatToLocalStorage(newChat);
        if (!this.currentChat || this.currentChat.id !== newChat.id) {
          this.currentChat = newChat;
          this.loadUsers();
          if (this.firestoreService.unSubDirectMessages) {
            this.firestoreService.unSubDirectMessages();
          }
        }
        this.loadMessages();
      } else {
        this.loadUsers();
        this.chatService.chatWindow = 'direct';
      this.currentChat =  this.userService.getCurrentChatFromLocalStorage()
        this.loadMessages();
      }
    });
    this.firestoreService.messageAddedInDirect.subscribe(() => {
      this.scrollToBottom();
    });
  }

 

  /**
   * Lifecycle hook that is called when a directive, pipe, or service is destroyed.
   * Unsubscribes from the Firestore direct messages subscription.
   */
  ngOnDestroy() {
    if (this.firestoreService.unSubDirectMessages) {
      this.firestoreService.unSubDirectMessages;
    }
    this.unsubscribeUsers;
  }

  /**
   * Retrieves and formats the user's name for tagging in messages.
   * @param {any} user - The user object to retrieve the name from.
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
   * Loads messages from the Firestore database for the current chat.
   */
  async loadMessages() {
    if (this.currentChat?.id) {
      await this.firestoreService.loadDirectMessages(this.currentChat.id);
    }
  }

  /**
   * Opens a profile dialog for the given user ID.
   * @param {any} id - The ID of the user whose profile is to be displayed.
   */
  openProfileDialog(id: any): void {
    this.dialog.open(DialogViewProfileComponent, {
      panelClass: 'dialog-container',
      data: { userID: id },
    });
  }

  /**
   * Handles the file selection event for uploading files in chat.
   * Validates the file size and uploads the selected file.
   * @param {Event} event - The event object containing the selected file.
   */
  onFileSelected(event: any): void {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      this.authService.uploadProfileImage(file);
      if (file.size > 500000) {
        alert("Max file size 500kb !");
      } else {
        this.firestoreService.showSpinner = true;
      }
      this.resetStatusAndSpinner()
    }
  }

  /**
   * Resets spinner and file status
   */
  resetStatusAndSpinner() {
    setTimeout(() => {
      this.message.files.push(this.authService.customPic);
      this.firestoreService.showSpinner = false;
    }, 1500);
    this.showUploadedFile = true;
  }

  /**
   * Sends a message in the direct message chat.
   * Formats and saves the message content and metadata before sending.
   */
  async sendMessage() {
    if (this.currentChat?.id && this.message.content?.trim() !== '') {
      this.message.content = this.message.content!.replace(this.taggedNames, '');
      this.determineMessageValues();
      await this.firestoreService.sendMessageInDirectMessage(this.currentChat.id, this.message);
      this.message = new Message();
      setTimeout(() => {
        this.scrollToBottom();
      }, 100);
    }
  }

  /**
   * Sets values for sent message
   */
  determineMessageValues() {
    if (this.currentChat) {
      this.getSentMessageTime();
      this.getSentMessageDate();
      this.message.creator = this.userService.currentUser.name;
      this.message.creatorId = this.userService.currentUser.id,
        this.message.channel = this.currentChat.name;
      this.message.channelID = this.currentChat.id;
      this.message.profilePic = this.userService.currentUser.picture,
        this.message.channel = this.currentChat.name;
    }
  }

  //-------------- Additional helper functions like getSentMessageDate, getSentMessageTime, etc. ------------------

  /**
   * Updates the content of a message in the Firestore database.
   * @param {Message} message - The message object to update.
   */
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

  //----------------------------------------------------------------------------------------------------------------

  /**
   * Toggles the display of the emoji picker for a specific message.
   * @param {any} messageId - The ID of the message to show the emoji picker for.
   */
  openEmojiPicker(messageId: any) {
    setTimeout(() => {
      this.emojiService.showMainChatEmojiPicker = true;
    }, 1);
    this.emojiService.messageId = messageId;
  }

  /**
   * Toggles the display of the emoji picker for the text input field in the chat.
   */
  openEmojiPickerChat() {
    setTimeout(() => {
      this.emojiService.showTextChatEmojiPicker = true;
    }, 1);
  }

  /**
   * Initiates the editing of a message by the current user.
   * @param {Message} message - The message object to edit.
   */
  editMessage(message: Message) {
    if (this.currentChat) {
      if (message.creator == this.currentUser.name) {
        this.edit = true;
        this.editingMessage = message.id; // Speichern Sie die ID der bearbeiteten Nachricht
      }
    }
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
   * Adds an emoji to the main chat message. Triggers the addition of the emoji to the message and records the reaction in the database.
   * @param {any} event - The event object containing the emoji data.
   */
  addEmoji(event: any) {
    if (this.emojiService.messageId != "") {
      this.emojiService.addEmojiMainChat(event);
      this.firestoreService.addReaction(this.emojiService.emojiString, this.emojiService.messageId, this.currentChat?.id, 'direct messages')
      this.emojiService.showMainChatEmojiPicker = false;
    }
  }

  /**
   * Adds an emoji to the text input field in the chat. Appends the selected emoji to the message content.
   * @param {any} $event - The event object containing the emoji data.
   */
  addEmojiTextField($event: any) {
    this.emojiService.addEmojiTextChat($event);
    this.message.content += this.emojiService.emojiString;
  }

  /**
   * Logs out the current user and navigates to the login screen.
   */
  logOutUser() {
    this.authService.signOutUser();
    this.router.navigate(['']);
  }

  /**
   * Opens a thread related to a direct message. Creates a new thread for the selected message and navigates to the thread view.
   * @param {Message} message - The message object for which the thread is to be opened.
   */
  async openThreadInDirect(message: Message) {
    let messageId = message.id;
    await this.threadService.createThread(messageId, this.newThread);
    this.threadService.openMessage = message;
    if (this.chatService.isMobile) {
      this.router.navigate(['thread']);
    } else {
      this.threadService.openThread.emit();
      this.threadService.isThreadInDM = true;
    }
  }

    /**
   * Responds to window resize events to check and update the screen width status in the chat service.
   * @param {any} event - The window resize event object.
   */
    @HostListener('window:resize', ['$event'])
    onResize(event: any): void {
      this.chatService.checkScreenWidth();
    }

    loadUsers() {
      this.unsubscribeUsers = onSnapshot(
        query(collection(this.firestore, "users"), orderBy("name")),
        (snapshot) => {
          this.allUsers = snapshot.docs.map((doc) => {
            const user = doc.data() as User;
            return user;
          });
        }
      );
    }

    getOtherUser(members: any[]) {
      if (members[0].id === this.currentUser.id) {
        return this.currentUser;
      } else {
        let otherUser = members.find(member => member.id !== this.userService.currentUser.id);
        let interlocutor = this.allUsers.find(user => user.id == otherUser.id);
        return interlocutor;
      }
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
}