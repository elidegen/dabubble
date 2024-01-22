import { Injectable } from '@angular/core';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class EmojiService {
  showEmojiPicker: boolean = false;
  
  emojiString: any = "";
  messageId: any = "";
  constructor(public userService: UserService) { }

  /**
   * Adds an emoji to the main chat.
   * Updates the emojiString with the selected emoji and hides the picker.
   *
   */
  addEmoji(event: any) {
    let emojiString = event["emoji"].native;
    this.emojiString = emojiString;
    this.showEmojiPicker == false;
  }

  /**
   * Opens the emoji picker for a specific message.
   * @param {any} messageId - The ID of the message to add an emoji to.
   */
  openEmojiPicker(messageId: any) {
    setTimeout(() => {
      this.showEmojiPicker = true;
    }, 10);
    this.messageId = messageId;
  }

  /**
   * Closes the emoji picker.
   */
  closeEmojiPicker() {
    if (this.showEmojiPicker == true && this.emojiString == "") {
      this.showEmojiPicker = false;
    }
    this.userService.openUserContainerTextfield.next(false);
  }
}