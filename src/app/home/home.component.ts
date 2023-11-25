import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogViewProfileComponent } from '../dialog-view-profile/dialog-view-profile.component';
import { UserService } from '../user.service';
import { Router } from '@angular/router';
import { UserData } from '../interfaces/user-interface';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  showFiller: any;
  currentUser: UserData = {
    name: "",
    email: "",
    password: "",
    id: "",
    picture:"",
  }

  constructor(public dialog: MatDialog, public userService: UserService, public router: Router) { }


  ngOnInit() {
  this.currentUser.name = this.userService.currentUser.name!;
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
    this.userService.signOutUser();
    this.router.navigate(['']);
  }

}