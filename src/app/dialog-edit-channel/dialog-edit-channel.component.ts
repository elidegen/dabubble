import { Component, OnInit } from '@angular/core';
import { Channel } from 'src/models/channel.class';
import { ChatService } from '../chat.service';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-edit-channel',
  templateUrl: './dialog-edit-channel.component.html',
  styleUrls: ['./dialog-edit-channel.component.scss']
})
export class DialogEditChannelComponent implements OnInit {
  editName: boolean = false;
  editDescription: boolean = false;
  currentChat!: Channel | undefined;

  constructor(private chatService: ChatService, public dialogRef: MatDialogRef<DialogEditChannelComponent>) { }

  ngOnInit() {
    this.chatService.openChat$.subscribe((openChat) => {
      if (openChat) {
        this.currentChat = openChat as Channel;
      }
    });
  }
  
}