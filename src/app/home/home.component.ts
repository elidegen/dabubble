import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogViewProfileComponent } from '../dialog-view-profile/dialog-view-profile.component';
import { UserService } from '../user.service';
import { Router } from '@angular/router';
import { UserData } from '../interfaces/user-interface';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  showFiller: any;
  currentUser: UserData = {
    name: "Guest",
    email: "",
    password: "",
    id: "",
    picture: "assets/img/avatars/profile.svg",
    online: false,
  }

  constructor(public dialog: MatDialog, public auth: AuthService, public router: Router, public userService: UserService) { 
    this.userService.getCurrentUserFromLocalStorage();
    this.currentUser = this.userService.currentUser;
  }


  ngOnInit() {

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