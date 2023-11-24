import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogViewProfileComponent } from '../dialog-view-profile/dialog-view-profile.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  showFiller: any;

  constructor(public dialog: MatDialog) { }

  openProfileDialog(): void {
    const dialogRef = this.dialog.open(DialogViewProfileComponent, {
      panelClass: 'br-32',
      data: { userID: 'as8d5asd16a' },
    });

    dialogRef.afterClosed().subscribe(result => {
        console.log('The dialog was closed');
      // this.animal = result;
    });
  }

}