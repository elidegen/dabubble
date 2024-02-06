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
    let emojiString = event["emoji"].native;
    this.emojiString = emojiString;
    let currentChat: any = this.userService.getCurrentChatFromLocalStorage();
    let messageID = this.messageId;
    
    
    if (this.messageId) {
      if (typeof this.messageId != 'string') {
        currentChat = this.messageId.channelID;
        messageID = this.messageId.id;
      } else {
        currentChat = currentChat!.id
      }
      console.log('addemoji', this.emojiString, messageID, currentChat, this.currentChatType);
      await this.firestoreService.addReaction(this.emojiString, messageID, currentChat, this.currentChatType);
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
    console.log('openpicker msgid', messageId, 'curcht', this.currentChatType);    
  }
}