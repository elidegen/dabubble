import { Component, HostListener } from '@angular/core';
import { ChatService } from './chat.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'dabubble';
  isMobile = true;

  constructor(private chatService: ChatService) { }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    console.log('lirum');
    
    this.chatService.checkScreenWidth();
    if (this.chatService.workspaceDrawerStateSubject.value == true && window.innerWidth >= 800 && window.innerWidth < 1350)
      this.chatService.closeThread();
  }
}
