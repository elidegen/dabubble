import { Component, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogAddChannelComponent } from '../dialog-add-channel/dialog-add-channel.component';
import { Firestore, collection, doc, onSnapshot } from '@angular/fire/firestore';
import { Channel } from 'src/models/channel.class';
import { ChatService } from '../chat.service';

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

  constructor(public dialog: MatDialog, private chatservice: ChatService) {

  }

  ngOnInit(): void {
    this.unsubscribeChannels = onSnapshot(collection(this.firestore, "channels"), (snapshot) => {
      this.allChannels = snapshot.docs.map(doc => {
        const channel = doc.data() as Channel;
        channel.id = doc.id;
        return channel;
      });
      console.log('workspace allchannels: ', this.allChannels);
    });
  }

  openDialog() {
    this.dialog.open(DialogAddChannelComponent, { panelClass: 'dialog-container' });
  }

  renderChat(channel: Channel) {
    console.log('renderChat Channel: ', channel);
    this.chatservice.openChat = channel;
  }

  ngOnDestroy(): void {
    this.unsubscribeChannels;
  }
}