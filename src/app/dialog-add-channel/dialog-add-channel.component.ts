import { Component, HostListener, Inject, Optional, QueryList, ViewChildren, inject } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { MatDialogRef } from '@angular/material/dialog';
import { Channel } from 'src/models/channel.class';
import { ChatService } from '../chat.service';
import { UserService } from '../user.service';
import { User } from 'src/models/user.class';
import { FirestoreService } from '../firestore.service';

@Component({
  selector: 'app-dialog-add-channel',
  templateUrl: './dialog-add-channel.component.html',
  styleUrls: ['./dialog-add-channel.component.scss', './dialog-add-channel.mediaquery.component.scss']
})
export class DialogAddChannelComponent {
  @ViewChildren('userContainer') userContainers!: QueryList<any>;
  channel: Channel = new Channel();
  firestore: Firestore = inject(Firestore);
  addMembers: boolean = false;
  allMembers: boolean = true;
  searchInput: string = '';
  isInputFocused: boolean = false;
  touched: boolean = false;
  selectedUsers: any[] = [];
  currentUser;

  constructor(@Optional() @Inject(MatDialogRef) public dialogRef: MatDialogRef<DialogAddChannelComponent> | undefined, public chatService: ChatService, public userService: UserService, public firestoreService: FirestoreService) {
    firestoreService.loadUsers()
    this.currentUser = this.userService.currentUser;
    if (chatService.isMobile) {
      this.dialogRef = undefined
    }
  }

  @HostListener('document:click', ['$event'])
  checkClick(event: Event) {
    const clickedElement = event.target as HTMLElement;
    if (!clickedElement.classList.contains('user-search-container') && !clickedElement.classList.contains('user-container') && this.isInputFocused && !clickedElement.classList.contains('input-members')) {
      this.isInputFocused = false;
    }
  }

  filterUsers(): void {
    this.isInputFocused = true;
    this.firestoreService.filterAllUsers()
  }

  async createChannel() {
    this.getMembers();
    this.channel.creator = this.userService.currentUser.name;
    this.channel.lastTimeViewed = [];
    await this.firestoreService.addChannel(this.channel);
    this.dialogRef?.close();
  }

  getMembers() {
    if (this.allMembers) {
      this.addSelectedUsersToChannel(this.firestoreService.allUsers)
    } else {
      this.addCurrentUser();
      this.addSelectedUsersToChannel(this.selectedUsers)
    }
  }

  addSelectedUsersToChannel(selectedUsers: any[]) {
    const formattedUsers = selectedUsers.map(user => {
      return {
        name: user.name,
        email: user.email,
        password: user.password,
        id: user.id,
        picture: user.picture,
        online: user.online
      };
    });
    this.channel.members.push(...formattedUsers);
  }

  userSelected(event: Event) {
    event.stopPropagation();
  }

  addCurrentUser() {
    const userAlreadySelected = this.selectedUsers.some(user => user.id === this.currentUser.id);
    if (!userAlreadySelected) {
      this.selectedUsers.push(this.currentUser);
    }
  }

  removeUser(user: User) {
    let index = this.selectedUsers.findIndex(obj => obj.id === user.id);

    if (index !== -1) {
      this.selectedUsers.splice(index, 1);
    }
  }

  selectUser(user: any, i: number) {
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