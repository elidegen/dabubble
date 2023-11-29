import { Component, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogAddChannelComponent } from '../dialog-add-channel/dialog-add-channel.component';
import { Firestore, collection, doc, onSnapshot, orderBy, query } from '@angular/fire/firestore';
import { Channel } from 'src/models/channel.class';
import { ChatService } from '../chat.service';
import { ThreadService } from '../thread.service';

@Component({
  selector: 'app-workspace',
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.scss']
})
export class WorkspaceComponent implements OnInit {
  firestore: Firestore = inject(Firestore);
  panelOpenState: boolean = true;
  allChannels: Channel[] = [];
  unsubscribeChannels: any;

  constructor(public dialog: MatDialog, private chatservice: ChatService, public threadService: ThreadService) {

  }

  ngOnInit(): void {
    this.unsubscribeChannels = onSnapshot(
      query(collection(this.firestore, "channels"), orderBy("name")),
      (snapshot) => {
        this.allChannels = snapshot.docs.map((doc) => {
          const channel = doc.data() as Channel;
          channel.id = doc.id;
          return channel;
        });
  
        console.log('workspace allchannels: ', this.allChannels);
      }
    );
  }

  openDialog() {
    this.dialog.open(DialogAddChannelComponent, { panelClass: 'dialog-container' });
  }

  renderChat(channel: Channel) {
    this.chatservice.openChat = channel;
    this.threadService.currentChat = channel;
  }

  ngOnDestroy(): void {
    this.unsubscribeChannels;
  }
}