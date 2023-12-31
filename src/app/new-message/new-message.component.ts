import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { FirestoreService } from '../services/firestore.service';
import { ChatService } from '../services/chat.service';
import { UserService } from '../services/user.service';
import { User } from 'src/models/user.class';

@Component({
  selector: 'app-new-message',
  templateUrl: './new-message.component.html',
  styleUrls: ['./new-message.component.scss']
})
export class NewMessageComponent {
  newMsgInputFocused: boolean = false;
  @ViewChild('search') search!: ElementRef;
  currentUser: User;
  searchInput: string = '';

  /**
   * Checks click events on the document to manage input focus.
   * @param {Event} event - The click event.
   */
  @HostListener('document:click', ['$event'])
  checkClick(event: Event) {
    const clickedElement = event.target as HTMLElement;
    if (!clickedElement.classList.contains('user-search-container') && !clickedElement.classList.contains('user-container') && this.newMsgInputFocused && !clickedElement.classList.contains('input-members')) {
      this.newMsgInputFocused = false;
    }
  }

  constructor(public firestoreService: FirestoreService, public chatService: ChatService, public userService: UserService) {
    userService.getCurrentUserFromLocalStorage();
    this.currentUser = this.userService.currentUser as User;
    chatService.checkScreenWidth();
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
   * Stops propagation of a user selection event.
   * @param {Event} event - The DOM event.
   */
  userSelected(event: Event) {
    event.stopPropagation();
  }
}