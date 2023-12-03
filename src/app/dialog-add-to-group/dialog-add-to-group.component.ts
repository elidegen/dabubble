import { Component, HostListener, QueryList, ViewChildren, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ChatService } from '../chat.service';
import { UserService } from '../user.service';
import { Firestore, collection, doc, getDoc, getDocs } from '@angular/fire/firestore';
import { Channel } from 'src/models/channel.class';

import { User } from 'src/models/user.class';
import { updateDoc } from 'firebase/firestore';


@Component({
  selector: 'app-dialog-add-to-group',
  templateUrl: './dialog-add-to-group.component.html',
  styleUrls: ['./dialog-add-to-group.component.scss']
})
export class DialogAddToGroupComponent {
  constructor(public dialogRef: MatDialogRef<DialogAddToGroupComponent>, public chatService: ChatService, public userService: UserService) { 
    this.loadUsers();
    this.currentUser = this.userService.currentUser;
  }

  @ViewChildren('userContainer') userContainers!: QueryList<any>;
  firestore: Firestore = inject(Firestore);
  currentChat!: Channel | undefined;
  selectedUsers: any[] = [];
  filteredUsers: User[] = [];
  isInputFocused: boolean = false;
  users: User[] = [];
  searchInput: string = '';
  currentUser;
  addMembers: boolean = false;
  allMembers: boolean = true;
  channel: Channel = new Channel();
  allChannelMembers: any[] = [];

  ngOnInit() {
    this.chatService.openChat$.subscribe((openChat) => {
      if (openChat) {
        const newChat = openChat as Channel;
        if (!this.currentChat || this.currentChat.id !== newChat.id) {
          this.currentChat = newChat;
          this.getAllChannelMembers();
        }
      }
    });
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

  userSelected(event: Event) {
    event.stopPropagation();
  }

  removeUser(user: User) {
    console.log('selUs', this.selectedUsers);
    let index = this.selectedUsers.findIndex((obj: { id: string | undefined; }) => obj.id === user.id);
    if (index !== -1) {
      this.selectedUsers.splice(index, 1);
    }
  }

  selectUser(user: User, i: number) {
    console.log('selUs', this.selectedUsers);
    this.highlightButtons();
    let index = this.selectedUsers.findIndex((obj: { id: string | undefined; }) => obj.id === user.id);
    if (index == -1) {
      this.selectedUsers.push(user);
    } else {
      this.removeUser(user)
    }
  }

  highlightButtons() {
    this.filteredUsers.forEach(user => {
      if(this.selectedUsers.includes(user)){
        this.addHighlight(user);
      } else {
        this.removeHightlight(user);
      }
    });
  }

  removeHightlight(user: User) {
    let index = this.filteredUsers.findIndex((obj => obj === user));
    const userContainer = this.userContainers.toArray()[index];
    if (userContainer) {
      userContainer.nativeElement.classList.remove('user-container-highlighted');
    }
  }


  addHighlight(user: User) {    
    let index = this.filteredUsers.findIndex((obj => obj === user));
    const userContainer = this.userContainers.toArray()[index];
    if (userContainer) {
      userContainer.nativeElement.classList.add('user-container-highlighted');
    }
  }


  async getAllChannelMembers() {
    if (this.currentChat?.id) {
      const channelDocRef = doc(this.firestore, `channels/${this.currentChat.id}`);
      try {
        const channelDocSnap = await getDoc(channelDocRef);
        if (channelDocSnap.exists()) {
          const channelData = channelDocSnap.data();
          this.allChannelMembers = channelData?.['members'];
        } else {
          console.log('Channel document does not exist.');
        }
      } catch (error) {
        console.error('Error getting channel document:', error);
      }
      this.showExistingMembers();
    }
  }

  showExistingMembers() {
    this.selectedUsers = this.allChannelMembers;
  }

  async addChannelMember() {
    if (this.currentChat) {
      const channelDocRef = doc(collection(this.firestore, 'channels'), this.currentChat.id);
      this.channel.members = this.selectedUsers;
      this.channel.name = this.currentChat.name;
      this.channel.id = this.currentChat.id;
      this.channel.description = this.currentChat.description;
      await updateDoc(channelDocRef, this.channel.toJSON()).catch((error) => {
        console.error('Error updating document:', error);
      });
    }
    this.dialogRef.close();
  }
  
  
  getMembers() {
    if (this.allChannelMembers) {
      this.addSelectedUsersToChannel(this.users);
    } else {
      this.addCurrentUser();
      this.addSelectedUsersToChannel(this.selectedUsers);
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
  
  addCurrentUser() {
    const userAlreadySelected = this.selectedUsers.some(user => user.id === this.currentUser.id);
    if (!userAlreadySelected) {
      this.selectedUsers.push(this.currentUser);
    }
  }

}


