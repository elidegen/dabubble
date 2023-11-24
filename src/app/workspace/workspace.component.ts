import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogAddChannelComponent } from '../dialog-add-channel/dialog-add-channel.component';

@Component({
  selector: 'app-workspace',
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.scss']
})
export class WorkspaceComponent {
  panelOpenState: boolean = true;
  constructor(public dialog: MatDialog) {}

  openDialog() {
    this.dialog.open(DialogAddChannelComponent,  {panelClass: 'dialog-container'});
  }
  

}
