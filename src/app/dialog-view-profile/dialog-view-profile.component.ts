import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { UserService } from '../user.service';
import { UserData } from '../interfaces/user-interface';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-dialog-view-profile',
  templateUrl: './dialog-view-profile.component.html',
  styleUrls: ['./dialog-view-profile.component.scss']
})
export class DialogViewProfileComponent {
  editState: boolean = false;
  currentUser: UserData;


  constructor(public dialogRef: MatDialogRef<DialogViewProfileComponent>, private userService: UserService, private authService: AuthService) {
    userService.getCurrentUserFromLocalStorage();
    this.currentUser = this.userService.currentUser;
    console.log('currentuser: ', this.currentUser);
  }


  editUser() {
    this.userService.currentUser = this.currentUser;
    this.userService.setCurrentUserToLocalStorage();
    this.userService.updateUser("users", this.currentUser);
    this.authService.updateUserEmail(this.currentUser.email);
    this.dialogRef.close();
  }
}