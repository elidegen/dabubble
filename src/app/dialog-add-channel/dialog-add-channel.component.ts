import { Component, inject } from '@angular/core';
import { Firestore, addDoc, collection } from '@angular/fire/firestore';
import { MatDialogRef } from '@angular/material/dialog';
import { Channel } from 'src/models/channel.class';
import { ChatService } from '../chat.service';

@Component({
  selector: 'app-dialog-add-channel',
  templateUrl: './dialog-add-channel.component.html',
  styleUrls: ['./dialog-add-channel.component.scss']
})
export class DialogAddChannelComponent {
  channel: Channel = new Channel();
  firestore: Firestore = inject(Firestore);

  constructor(public dialogRef: MatDialogRef<DialogAddChannelComponent>, public chatService: ChatService) { }

  async createChannel() {
    console.log(this.channel);

    // creator zu channel hinzufügen
    await addDoc(collection(this.firestore, 'channels'), this.channel.toJSON())
      .catch((err) => {
        console.log(err);
      })
      .then((result: any) => {
        this.dialogRef.close();
        console.log('Added Channel', result);
      });
  }
}