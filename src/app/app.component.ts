import { AfterViewInit, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { ChatService } from './services/chat.service';
import { Router } from '@angular/router';
import { EmojiService } from './services/emoji.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'dabubble';
  isMobile = true;
  // @ViewChild('emojiPicker') emojiPicker!: ElementRef;

  constructor(private chatService: ChatService, public emojiService: EmojiService, public router: Router) { }

  /**
   * Event listener for the 'window:resize' event, which triggers actions when the window is resized.
   * @param {any} event - The window resize event object.
   */
  @HostListener('window:resize', ['$event'])
  onResize(): void {
    if (this.router.url !== '/') {
      this.chatService.checkScreenWidth();
      if (this.chatService.workspaceDrawerStateSubject.value == true && window.innerWidth >= 800 && window.innerWidth < 1350) { }
      this.chatService.closeThread();
    }
  }

  stopP(event: Event) {
    event.stopPropagation();
  }
}