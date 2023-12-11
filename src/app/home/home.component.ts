import { Component, ViewChild, ElementRef, HostListener } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogViewProfileComponent } from '../dialog-view-profile/dialog-view-profile.component';
import { UserService } from '../user.service';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { User } from 'src/models/user.class';
import { ChatService } from '../chat.service';
import { Message } from 'src/models/message.class';
import { FirestoreService } from '../firestore.service';


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
  filteredChannelMessages: Message[] = [];
  filteredDirectMessages: Message[] = [];

  constructor(public dialog: MatDialog, public auth: AuthService, public router: Router, public userService: UserService, public chatService: ChatService, public firestoreService: FirestoreService) {
    this.userService.getCurrentUserFromLocalStorage();
    this.currentUser = this.userService.currentUser;
    this.firestoreService.setUsersToOffline();
    this.checkScreenWidth();
  }


  ngOnInit() {
  }

  
  openProfileDialog(id: any): void {
    this.dialog.open(DialogViewProfileComponent, {
      panelClass: 'dialog-container',
      data: { userID: id },
    });
  }


  logOutUser() {
    this.auth.signOutUser();
    this.router.navigate(['']);
  }


  @HostListener('document:click', ['$event'])
  checkClick(event: Event) {
    const clickedElement = event.target as HTMLElement;
    if (!clickedElement.classList.contains('user-search-container') && !clickedElement.classList.contains('user-container') && this.isInputFocused && !clickedElement.classList.contains('input-members')) {
      this.isInputFocused = false;
    }
  }


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
    console.log('directs', this.filteredDirectMessages);
  }


  filterUsers() {
    this.filteredUsers = this.userService.users.filter(user =>
      user.name?.toLowerCase().includes(this.searchInput.toLowerCase())
    );
  }


  async filterChannels() {
    await this.chatService.getAllChannelMessages();
    this.filteredChannelMessages = [];
    this.chatService.allMessagesOfChannel.forEach(message => {
        if (message.content?.toLowerCase().includes(this.searchInput.toLowerCase())) {
            this.filteredChannelMessages.push(message);
        }
    });
  }


  async filterDirectMessages() {
    await this.chatService.getDMMessages();
    this.filteredDirectMessages = [];
    this.chatService.allMessagesOfDM.forEach(message => {
      if (message.content?.toLowerCase().includes(this.searchInput.toLowerCase())) {
        this.filteredDirectMessages.push(message);
      }
    });
  }

  
  selectUser(user: any) {
    this.chatService.createDirectMessage(user);
    this.chatService.chatWindow = 'direct';
    this.search.nativeElement.value = '';
    if (this.chatService.isMobile) {
      this.router.navigate(['main']);
    }
  }


  selectChannel(message: any) {
    this.chatService.getChannelByMessage(message);
  }


  selectDirectMessage(message: any) {
    this.chatService.getDirectMessageByMessage(message);
  }


  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.checkScreenWidth();
  }


  checkScreenWidth(): void {
    this.chatService.isMobile = window.innerWidth < 800;
  }
}