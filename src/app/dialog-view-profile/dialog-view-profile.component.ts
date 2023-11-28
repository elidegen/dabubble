import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { UserService } from '../user.service';
import { UserData } from '../interfaces/user-interface';

@Component({
  selector: 'app-dialog-view-profile',
  templateUrl: './dialog-view-profile.component.html',
  styleUrls: ['./dialog-view-profile.component.scss']
})
export class DialogViewProfileComponent {
  editState: boolean = false;
  currentUser: UserData;
  newUserName = ""
  newEmail = "";

  constructor(public dialogRef: MatDialogRef<DialogViewProfileComponent>, private userService: UserService) {
    userService.getCurrentUserFromLocalStorage();
    this.currentUser = this.userService.currentUser;
    console.log('currentuser: ', this.currentUser);
  }


  changeUser() {

  }
}