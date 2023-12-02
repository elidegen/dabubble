import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EmojiService {
showMainChatEmojiPicker: boolean = false;
emojiString: any = "";
messageId: any = "";
  constructor() { }



  addEmojiMainChat(event: any) {
    let emojiString = event["emoji"].native;
    this.showMainChatEmojiPicker == false;
    this.emojiString = emojiString;
  }
  




}



