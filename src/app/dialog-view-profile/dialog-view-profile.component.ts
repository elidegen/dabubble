import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UserService } from '../user.service';
import { AuthService } from '../auth.service';
import { User } from 'src/models/user.class';

@Component({
  selector: 'app-dialog-view-profile',
  templateUrl: './dialog-view-profile.component.html',
  styleUrls: ['./dialog-view-profile.component.scss']
})
export class DialogViewProfileComponent {
  editState: boolean = false;
  currentUser: User;
  user: User = new User();


  constructor(
    public dialogRef: MatDialogRef<DialogViewProfileComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { userID: string },
    private userService: UserService,
    private authService: AuthService
  ) {
    userService.getCurrentUserFromLocalStorage();
    this.currentUser = this.userService.currentUser;
    this.setUser();
  }

  setUser() {
    const users = this.userService.users;
    const index = users.findIndex(user => user.id == this.data.userID);
    this.user = users[index] as User;
  }


  editUser() {
    this.userService.currentUser = this.currentUser;
    this.userService.setCurrentUserToLocalStorage();
    this.userService.updateUser(this.currentUser);
    this.authService.updateUserEmail(this.currentUser.email!);
    this.dialogRef.close();
  }
}