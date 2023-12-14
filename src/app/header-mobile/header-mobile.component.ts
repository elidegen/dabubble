import { Component } from '@angular/core';
import { ChatService } from '../chat.service';
import { BottomSheet } from '../bottom-sheet/bottom-sheet.component';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatDialog } from '@angular/material/dialog';
import { DialogViewProfileComponent } from '../dialog-view-profile/dialog-view-profile.component';
import { User } from 'src/models/user.class';
import { UserService } from '../user.service';

@Component({
  selector: 'app-header-mobile',
  templateUrl: './header-mobile.component.html',
  styleUrls: ['./header-mobile.component.scss']
})
export class HeaderMobileComponent {
  currentUser: User;
  constructor(public userService: UserService, public dialog: MatDialog, private _bottomSheet: MatBottomSheet, public chatService: ChatService, public authService: AuthService, public router: Router) {
    this.currentUser = this.userService.currentUser as User;
  }

  /**
   * will open the bottom sheet
   */
  openBottomSheet(): void {
    this._bottomSheet.open(BottomSheet);
  }

  /**
   * Logs out the current user and navigates to the login screen.
   */
  logOutUser() {
    this.authService.signOutUser();
    this.router.navigate(['']);
  }

  /**
  * Opens the profile view dialog for a specific user.
  * @param {any} id - The ID of the user.
  */
  openProfileDialog(): void {
    this.dialog.open(DialogViewProfileComponent, {
      panelClass: 'dialog-container',
      data: { userID: this.currentUser.id },
    });
  }
}