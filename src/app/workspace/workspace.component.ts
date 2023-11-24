import { Component } from '@angular/core';

@Component({
  selector: 'app-workspace',
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.scss']
})
export class WorkspaceComponent {
  openDialog() {
    throw new Error('Method not implemented.');
  }
  panelOpenState: boolean = true;

}
