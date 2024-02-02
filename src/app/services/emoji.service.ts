import { Injectable } from '@angular/core';
import { UserService } from './user.service';
import { FirestoreService } from './firestore.service';
import { ChatService } from './chat.service';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EmojiService {
  showEmojiPicker: boolean = false;
  private emojiContentSubject: Subject<any> = new Subject<any>();
  emojiMain$ = this.emojiContentSubject.asObservable();

  emojiString: any = "";
  messageId: any = "";
  emoji: any;

  currentChatType: string = '';

  constructor(public chatService: ChatService, public userService: UserService, public firestoreService: FirestoreService) { }

  updateTextarea(emoji: string) {
    let emojiObj = {
      emoji: emoji,
      textarea: this.currentChatType
    }
    this.emojiContentSubject.next(emojiObj);
  }

  /**
   * Adds an emoji to the main chat.
   * Updates the emojiString with the selected emoji and hides the picker.
   */
  async addEmoji(event: any) {
    console.log('emojiii', event["emoji"]);    
    let emojiString = event["emoji"].native;
    this.emojiString = emojiString;
    console.log('msgid', this.messageId, 'chatwindow', this.chatService.chatWindow);

    if (this.messageId) {
      let currentChat = this.userService.getCurrentChatFromLocalStorage();
      await this.firestoreService.addReaction(this.emojiString, this.messageId, currentChat!.id, this.currentChatType);
    } else {
      this.updateTextarea(emojiString);
    }
    this.emojiString = "";
  }

  /**
   * Opens the emoji picker for a specific message.
   * @param {any} messageId - The ID of the message to add an emoji to.
   */
  openEmojiPicker(messageId: any, msgType: string) {
    this.showEmojiPicker = !this.showEmojiPicker;
    this.messageId = messageId;
    this.currentChatType = msgType;
    console.log('crt', this.currentChatType);    
  }
}