import { Component, ViewChild, ElementRef, HostListener } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogViewProfileComponent } from '../dialog-view-profile/dialog-view-profile.component';
import { UserService } from '../user.service';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { User } from 'src/models/user.class';
import { ChatService } from '../chat.service';
import { Chat } from 'src/models/chat.class';
import { Message } from 'src/models/message.class';
import { FirestoreService } from '../firestore.service';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
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
  isInputFocused: boolean = false;
  filteredUsers: User[] = [];
  filteredChannelMessages: Message[] = [];
  filteredDirectMessages: Message[] = [];
  constructor(public dialog: MatDialog, public auth: AuthService, public router: Router, public userService: UserService, public chatService: ChatService, public firestoreService: FirestoreService) {
    this.userService.getCurrentUserFromLocalStorage();
    this.currentUser = this.userService.currentUser;
    this.firestoreService.setUsersToOffline();
  }


  ngOnInit() {

  }


  filterEverything(): void {
    this.isInputFocused = true;
    this.filterUsers();
    this.filterChannels();
    this.filterDirectMessages();
  }

  filterUsers() {
    this.filteredUsers = [];
    this.filteredUsers = this.userService.users.filter(user =>
      user.name?.toLowerCase().includes(this.searchInput.toLowerCase())
    );
  }

  filterChannels() {
    this.filteredChannelMessages = [];
    this.filteredChannelMessages = this.chatService.allMessagesOfChannel.filter(message => message.content?.toLowerCase().includes(this.searchInput.toLowerCase()));
  }

  filterDirectMessages() {
    console.log(this.chatService.allMessagesOfDM);
    
    this.filteredDirectMessages = [];
    this.filteredDirectMessages = this.chatService.allMessagesOfDM.filter(message => message.content?.toLowerCase().includes(this.searchInput.toLowerCase()));
  }

  
  selectUser(user: any) {
    this.chatService.createDirectMessage(user);
    this.chatService.chatWindow = 'direct';
    console.log("User wurde in der Suchfunktion ausgewählt für einen direct Chat", user);
    this.search.nativeElement.value = '';
  }

  selectChannel(message: any) {
    console.log("Bei der Suchfunktion ausgewählte Nachricht", message)
    this.chatService.getChannelByMessage(message);
  }


  selectDirectMessage(message: any) {
    console.log("Bei der Suchfunktion ausgewählte Nachricht", message)
    this.chatService.getChannelByMessage(message);
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

}