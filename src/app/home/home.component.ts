import { Component, ViewChild, ElementRef, HostListener } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogViewProfileComponent } from '../dialog-view-profile/dialog-view-profile.component';
import { UserService } from '../user.service';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { User } from 'src/models/user.class';
import { Message } from 'src/models/message.class';
import { FirestoreService } from '../firestore.service';
import { Channel } from 'src/models/channel.class';
import { ChatService } from '../chat.service';
import { ThreadService } from '../thread.service';
import { MatBottomSheet, MatBottomSheetRef } from '@angular/material/bottom-sheet';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss', './home.mediaquery.component.scss']
})
export class HomeComponent {
  showFiller: any;
  currentUser: any = {
    name: "Guest",
    email: "",
    password: "",
    id: "",
    picture: "assets/img/avatars/profile.svg",
    online: false,
  }

  @ViewChild('search') search!: ElementRef;
  searchInput: string = '';
  lastSearchInput: string = '';
  isInputFocused: boolean = false;
  filteredUsers: User[] = [];
  filteredChannels: Channel[] = [];
  filteredChannelMessages: Message[] = [];
  filteredDirectMessages: Message[] = [];

  constructor(private _bottomSheet: MatBottomSheet, public dialog: MatDialog, public auth: AuthService, public router: Router, public userService: UserService, public chatService: ChatService, public firestoreService: FirestoreService, public threadService: ThreadService) {
    this.userService.getCurrentUserFromLocalStorage();
    this.currentUser = this.userService.currentUser;
    this.firestoreService.setUsersToOffline();
    this.checkScreenWidth();
  }

  openBottomSheet(): void {
    this._bottomSheet.open(BottomSheetOverviewExampleSheet);
  }
  /**
  * Opens a profile dialog for viewing a user's profile based on the provided user ID.
  * @param {any} id - The ID of the user for whom the profile is to be viewed.
  */
  openProfileDialog(id: any): void {
    this.dialog.open(DialogViewProfileComponent, {
      panelClass: 'dialog-container',
      data: { userID: id },
    });
  }

  /**
   * Logs out the current user and navigates to the login screen.
   */
  logOutUser() {
    this.auth.signOutUser();
    this.router.navigate(['']);
  }

  /**
   * Listens for document click events and checks if the click is outside user search and member inputs to update focus state.
   * @param {Event} event - The DOM event object.
   */
  @HostListener('document:click', ['$event'])
  checkClick(event: Event) {
    const clickedElement = event.target as HTMLElement;
    if (!clickedElement.classList.contains('user-search-container') && !clickedElement.classList.contains('user-container') && this.isInputFocused && !clickedElement.classList.contains('input-members')) {
      this.isInputFocused = false;
    }
  }

  /**
   * Filters users, channels, and direct messages based on the search input. Updates filtered results.
   */
  filterEverything(): void {
    this.isInputFocused = true;
    if (this.searchInput !== this.lastSearchInput) {
      this.filterUsers();
      this.filterChannels();
      this.filterDirectMessages();
      this.lastSearchInput = this.searchInput;
    }
    if (this.searchInput.trim() === '') {
      this.filteredUsers = [];
      this.filteredDirectMessages = [];
      this.filteredChannelMessages = [];
    }
  }

  /**
  * Shows only channels that belong to the current user when '#' is entered in the search input.
  */
  showOnlyYourChannels() {
    if (this.searchInput == "#") {
      this.filteredChannels = this.chatService.yourChannels;
    }

  }

  /**
   * Filters users based on the search input.
   */
  filterUsers() {
    this.filteredUsers = this.userService.users.filter(user =>
      user.name?.toLowerCase().includes(this.searchInput.toLowerCase())
    );
  }

  /**
   * Filters channel messages based on the search input.
   */
  async filterChannels() {
    await this.chatService.getAllChannelMessages();
    this.filteredChannelMessages = [];
    this.chatService.allMessagesOfChannel.forEach(message => {
      if (message.content?.toLowerCase().includes(this.searchInput.toLowerCase())) {
        this.filteredChannelMessages.push(message);
      }
    });
  }

  /**
   * Filters direct messages based on the search input.
   */
  async filterDirectMessages() {
    await this.chatService.getDMMessages();
    console.log('filterallDm Ms', this.chatService.allMessagesOfDM);
    this.filteredDirectMessages = [];
    this.chatService.allMessagesOfDM.forEach(message => {
      if (message.content?.toLowerCase().includes(this.searchInput.toLowerCase())) {
        this.filteredDirectMessages.push(message);
      }
    });
    console.log('filter after', this.filteredDirectMessages);

  }

  /**
   * Navigates to the channel chat window and emits a chat change event.
   * @param {Channel} channel - The channel to be rendered.
   */
  renderChannel(channel: Channel) {
    this.chatService.openChat = channel;
    this.chatService.chatWindow = 'channel';
    this.threadService.changeChat.emit();
    if (this.chatService.isMobile) {
      this.router.navigate(['main']);
    }
  }


  /**
  * Creates a direct message chat with the selected user and navigates to the direct message chat window.
  * @param {any} user - The user selected for direct messaging.
  */
  selectUser(user: any) {
    this.chatService.createDirectMessage(user);
    this.chatService.chatWindow = 'direct';
    this.search.nativeElement.value = '';
    if (this.chatService.isMobile) {
      this.router.navigate(['main']);
    }
  }

  /**
   * Retrieves and displays the channel associated with a specific message.
   * @param {any} message - The message used to identify the channel.
   */
  selectChannel(message: any) {
    this.chatService.getChannelByMessage(message);
  }

  /**
   * Retrieves and displays the direct message chat associated with a specific message.
   * @param {any} message - The message used to identify the direct message chat.
   */
  selectDirectMessage(message: any) {
    this.chatService.getDirectMessageByMessage(message);
  }

  /**
   * Responds to window resize events to check and update the screen width status in the chat service.
   * @param {any} event - The window resize event object.
   */
  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.checkScreenWidth();
  }

  /**
   * Checks the screen width to determine if the current device is a mobile device.
   */
  checkScreenWidth(): void {
    this.chatService.isMobile = window.innerWidth < 800;
  }
}
export class BottomSheetOverviewExampleSheet {
  constructor(private _bottomSheetRef: MatBottomSheetRef<BottomSheetOverviewExampleSheet>) { }

  openLink(event: MouseEvent): void {
    this._bottomSheetRef.dismiss();
    event.preventDefault();
  }
}