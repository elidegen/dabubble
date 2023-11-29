import { Component, ElementRef, HostListener, QueryList, ViewChild, ViewChildren, inject } from '@angular/core';
import { DocumentData, DocumentReference, Firestore, addDoc, collection, doc, getDocs, updateDoc } from '@angular/fire/firestore';
import { MatDialogRef } from '@angular/material/dialog';
import { Channel } from 'src/models/channel.class';
import { ChatService } from '../chat.service';
import { UserService } from '../user.service';
import { User } from 'src/models/user.class';




@Component({
  selector: 'app-dialog-add-channel',
  templateUrl: './dialog-add-channel.component.html',
  styleUrls: ['./dialog-add-channel.component.scss']
})
export class DialogAddChannelComponent {
  @ViewChildren('userContainer') userContainers!: QueryList<any>;

  channel: Channel = new Channel();
  firestore: Firestore = inject(Firestore);
  switch_expression: string = 'channel';
  selectedOption: string = 'allMembers';
  searchInput: string = '';
  users: User[] = []; 
  filteredUsers: User[] = []; 
  isInputFocused: boolean = false;
  constructor(public dialogRef: MatDialogRef<DialogAddChannelComponent>, public chatService: ChatService, public userService: UserService) {
    this.loadUsers();
  }



  async loadUsers() {
    try {
      const querySnapshot = await getDocs(collection(this.firestore, 'users'));
      this.users = querySnapshot.docs.map((doc: { data: () => any; }) => new User(doc.data()));
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }

  filterUsers(): void {
    if (this.isInputFocused) {
      this.filteredUsers = this.users.filter(user =>
        user.name?.toLowerCase().startsWith(this.searchInput.toLowerCase())
      );
    } else {
      this.filteredUsers = [];
    }
  }

  async createChannel() {
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

  changeSwitchCase(newSwitchCase: string) {
    this.switch_expression = newSwitchCase;
  }

  
  userSelected(event: Event) {
    event.stopPropagation();
  }


  highlightButton(index: number) {
    const userContainer = this.userContainers.toArray()[index];
    if (userContainer) {
      userContainer.nativeElement.classList.toggle('user-container-highlighted');
    }
  }



}