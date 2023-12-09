import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UserService } from '../user.service';
import { AuthService } from '../auth.service';
import { User } from 'src/models/user.class';
import { FirestoreService } from '../firestore.service';


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
    public userService: UserService,
    public authService: AuthService,
    public firestoreService: FirestoreService,
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


  onFileSelected(event: any): void {
    console.log("Übergebene Datei:", event)
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      this.authService.uploadProfileImage(file);
      this.firestoreService.showSpinner = true;
    }
    setTimeout(() => {
      this.user.picture = this.authService.customPic;
      this.userService.currentUser.picture =  this.user.picture;
      this.userService.updateUser(this.user);
   
      this.firestoreService.showSpinner = false;
    }, 1500);
  
  }
}