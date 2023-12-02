import { Component, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogAddChannelComponent } from '../dialog-add-channel/dialog-add-channel.component';
import { Firestore, collection, doc, onSnapshot, orderBy, query } from '@angular/fire/firestore';
import { Channel } from 'src/models/channel.class';
import { ChatService } from '../chat.service';
import { ThreadService } from '../thread.service';
import { UserService } from '../user.service';

@Component({
  selector: 'app-workspace',
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.scss']
})
export class WorkspaceComponent implements OnInit {
  firestore: Firestore = inject(Firestore);
  panelOpenState: boolean = true;
  allChannels: Channel[] = [];
  yourChannels: Channel[] = [];
  unsubscribeChannels: any;
  currentUser;

  constructor(public dialog: MatDialog, public chatservice: ChatService, public threadService: ThreadService, public userService: UserService) {
    this.currentUser = userService.currentUser;
  }

  ngOnInit(): void {
    this.unsubscribeChannels = onSnapshot(
      query(collection(this.firestore, "channels"), orderBy("name")),
      (snapshot) => {
        this.allChannels = snapshot.docs.map((doc) => {
          const channel = doc.data() as Channel;
          channel.id = doc.id;
          channel.members = JSON.parse(channel.members);
          return channel;
        });
        this.getPersonalChannels();
      }
    );
  }

  getPersonalChannels() {
    console.log('allch', this.allChannels);
    console.log('curentuser', this.currentUser);
    
    this.yourChannels = [];
    this.allChannels.forEach(channel => {
      if (channel.members.some((member: { id: string; }) => member.id === this.currentUser.id)) {
        console.log(channel);
        
        this.yourChannels.push(channel);
      }
    });
    console.log('yourchannels', this.yourChannels);
  }

  openDialog() {
    this.dialog.open(DialogAddChannelComponent, { panelClass: 'dialog-container' });
  }

  renderChat(channel: Channel) {
    this.chatservice.openChat = channel;
    this.threadService.currentChat = channel;
    this.chatservice.chatWindow = 'channel'
  }

  ngOnDestroy(): void {
    this.unsubscribeChannels;
  }
}