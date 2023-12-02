import { Injectable } from '@angular/core';


@Injectable({
  providedIn: 'root'
})
export class EmojiService {
  showMainChatEmojiPicker: boolean = false;
  showThreadEmojiPicker: boolean = false;
  emojiString: any = "";
  messageId: any = "";
  constructor() { }



  addEmojiMainChat(event: any) {
    let emojiString = event["emoji"].native;
    this.emojiString = emojiString;
    this.showMainChatEmojiPicker == false;
  }


  addEmojiThread($event: any) {
    let emojiString = $event["emoji"].native;
    this.emojiString = emojiString;
    this.showThreadEmojiPicker == false;
  }




}



