import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UserService } from '../user.service';
import { AuthService } from '../auth.service';
import { User } from 'src/models/user.class';
import { FirestoreService } from '../firestore.service';


@Component({
  selector: 'app-dialog-view-profile',
  templateUrl: './dialog-view-profile.component.html',
  styleUrls: ['./dialog-view-profile.component.scss', './dialog-view-profile.mediaquery.component.scss']
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
    public firestoreService: FirestoreService,) {
      userService.getCurrentUserFromLocalStorage();
      this.currentUser = this.userService.currentUser;
      this.setUser();
  }

  /**
   * Sets the user profile to be viewed.
   */
  setUser() {
    const users = this.userService.users;
    const index = users.findIndex(user => user.id == this.data.userID);
    this.user = users[index] as User;
  }

  /**
   * Allows the current user to edit their profile. It saves the updated user data
   * to local storage and updates the user information in the database.
   */
  editUser() {
    this.userService.currentUser = this.currentUser;
    this.userService.setCurrentUserToLocalStorage();
    this.userService.updateUser(this.currentUser);
    this.authService.updateUserEmail(this.currentUser.email!);
    this.dialogRef.close();
  }

  /**
   * Handles the selection of a new profile image file.
   * Validates the file size and uploads the image to the server, updating the user profile.
   *
   * @param {Event} event - The file input change event containing the selected file.
   */
  onFileSelected(event: any): void {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > 500000) {
        alert("Max file size 500kb !");
      } else {
      this.authService.uploadProfileImage(file);
      this.firestoreService.showSpinner = true;
      }
      this.updateUserView();
    }
  }

  /**
   * Updates values of user view
   */
  updateUserView() {
    setTimeout(() => {
      this.user.picture = this.authService.customPic;
      this.userService.currentUser.picture =  this.user.picture;
      this.userService.updateUser(this.user);
      this.firestoreService.showSpinner = false;
    }, 1500);
  }
}