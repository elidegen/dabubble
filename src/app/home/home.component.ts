import { Component,ViewChild, ElementRef} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogViewProfileComponent } from '../dialog-view-profile/dialog-view-profile.component';
import { UserService } from '../user.service';
import { Router } from '@angular/router';
import { UserData } from '../interfaces/user-interface';
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
  filteredUsers: UserData[] = [];
  filteredMessages: Message[] =[];
  constructor(public dialog: MatDialog, public auth: AuthService, public router: Router, public userService: UserService, public chatService: ChatService) { 
    this.userService.getCurrentUserFromLocalStorage();
    this.currentUser = this.userService.currentUser;
  }


  ngOnInit() {

  }
  
  userSelected(event: Event) {
    event.stopPropagation();
  }


  filterEverything(): void {
    this.isInputFocused = true;
    this.filteredUsers = this.userService.users.filter(user =>
      user.name?.toLowerCase().includes(this.searchInput.toLowerCase())
    );
  }


  selectUser(user: any) {
    this.chatService.createDirectMessage(user);
    this.search.nativeElement.value = '';
}

  openProfileDialog(): void {
    const dialogRef = this.dialog.open(DialogViewProfileComponent, {
      panelClass: 'dialog-container',
      data: { userID: 'as8d5asd16a' },
    });

    dialogRef.afterClosed().subscribe(result => {
        console.log('The dialog was closed');
      // this.animal = result;
    });
  }

  logOutUser() {
    this.auth.signOutUser();
    this.router.navigate(['']);
  }

}