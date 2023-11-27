import { Component, inject } from '@angular/core';
import { DocumentData, DocumentReference, Firestore, addDoc, collection, doc, updateDoc } from '@angular/fire/firestore';
import { MatDialogRef } from '@angular/material/dialog';
import { Channel } from 'src/models/channel.class';
import { ChatService } from '../chat.service';
import { UserService } from '../user.service';

@Component({
  selector: 'app-dialog-add-channel',
  templateUrl: './dialog-add-channel.component.html',
  styleUrls: ['./dialog-add-channel.component.scss']
})
export class DialogAddChannelComponent {
  channel: Channel = new Channel();
  firestore: Firestore = inject(Firestore);

  constructor(public dialogRef: MatDialogRef<DialogAddChannelComponent>, public chatService: ChatService, public userService: UserService) { }

  async createChannel() {
    console.log(this.channel);
    this.channel.creator = this.userService.currentUser.name;
    await addDoc(collection(this.firestore, 'channels'), this.channel.toJSON())
      .catch((err) => {
        console.log(err);
      })
      .then((docRef: void | DocumentReference<DocumentData, DocumentData>) => {
        if (docRef && docRef instanceof DocumentReference) {
          this.updateChannelId('channels', this.channel, docRef.id);
          this.dialogRef.close();
          console.log('Added Channel', docRef);
        }
      });
  }
  
  async updateChannelId(colId: string, channel: Channel, newId: string) {
    channel.id = newId;
    await this.updateChannel(colId, channel);
  }
  
  async updateChannel(colId: string, channel: Channel) {
    const docRef = doc(collection(this.firestore, colId), channel.id);
    await updateDoc(docRef, this.getUpdateData(channel)).catch(
      (error) => { console.log(error); }
    );
  }
  
  getUpdateData(channel: Channel) {
    return {
      name: channel.name,
      description: channel.description,
      creator: channel.creator,
      id: channel.id,
    };
  }
  

}