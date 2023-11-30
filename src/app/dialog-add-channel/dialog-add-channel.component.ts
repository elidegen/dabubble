import { Component, HostListener, QueryList, ViewChildren, inject } from '@angular/core';
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
  addMembers: boolean = false;
  allMembers: boolean = true;
  searchInput: string = '';
  users: User[] = [];
  filteredUsers: User[] = [];
  isInputFocused: boolean = false;
  touched: boolean = false;
  selectedUsers: any[] = [];
  currentUser;


  constructor(public dialogRef: MatDialogRef<DialogAddChannelComponent>, public chatService: ChatService, public userService: UserService) {
    this.loadUsers();
    this.currentUser = this.userService.currentUser;
  }

  @HostListener('document:click', ['$event'])
  checkClick(event: Event) {
    const clickedElement = event.target as HTMLElement;
    if (!clickedElement.classList.contains('user-search-container') && !clickedElement.classList.contains('user-container') && this.isInputFocused && !clickedElement.classList.contains('input-members')) {
      this.isInputFocused = false;
    }
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
    this.isInputFocused = true;
    this.filteredUsers = this.users.filter(user =>
      user.name?.toLowerCase().includes(this.searchInput.toLowerCase())
    );
  }

  async createChannel() {
    this.getMembers();
    this.channel.creator = this.userService.currentUser.name;
    console.log('channel', this.channel);

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

  getMembers() {
    if (this.allMembers) {
      this.channel.members = this.users;
    } else {
      this.addCurrentUser();
      this.channel.members = this.selectedUsers;
    }
  }

  addCurrentUser() {
    if (this.selectedUsers.some(user => user.id != this.currentUser.id)) {
      this.selectedUsers.push(this.currentUser);
    }
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

  userSelected(event: Event) {
    event.stopPropagation();
  }

  removeUser(user: User) {
    let index = this.selectedUsers.findIndex(obj => obj.id === user.id);

    if (index !== -1) {
      this.selectedUsers.splice(index, 1);
    }
  }

  selectUser(user: User, i: number) {
    this.highlightButton(i);
    let index = this.selectedUsers.findIndex(obj => obj.id === user.id);

    if (index == -1) {
      this.selectedUsers.push(user);
    } else {
      this.removeUser(user)
    }
  }

  highlightButton(index: number) {
    const userContainer = this.userContainers.toArray()[index];
    if (userContainer) {
      userContainer.nativeElement.classList.toggle('user-container-highlighted');
    }
  }
}