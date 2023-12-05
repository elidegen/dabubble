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
  filteredMessages: Message[] = [];
  constructor(public dialog: MatDialog, public auth: AuthService, public router: Router, public userService: UserService, public chatService: ChatService) {
    this.userService.getCurrentUserFromLocalStorage();
    this.currentUser = this.userService.currentUser;
  }


  ngOnInit() {

  }

  // userSelected(event: Event) {
  //   event.stopPropagation();
  // }


  filterEverything(): void {
    this.isInputFocused = true;
    this.filterUsers();
    this.filterMessages();
  }

  filterUsers() {
    this.filteredUsers = [];
    this.filteredUsers = this.userService.users.filter(user =>
      user.name?.toLowerCase().includes(this.searchInput.toLowerCase())
    );
  }

  filterMessages() {
    this.filteredMessages = [];
    this.filteredMessages = this.chatService.allMessagesOfChannel.filter(message =>
      message.content?.toLowerCase().includes(this.searchInput.toLowerCase()) ||
      message.creator?.toLowerCase().includes(this.searchInput.toLowerCase())
    );
  }

  selectUser(user: any) {
    this.chatService.createDirectMessage(user);
    this.chatService.chatWindow = 'direct';
    console.log("User wurde in der Suchfunktion ausgewählt für einen direct Chat", user);
    this.search.nativeElement.value = '';
  }

  selectMessage(message: any) {
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