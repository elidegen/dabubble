import { Component, HostListener, QueryList, ViewChildren, inject } from '@angular/core';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { User } from 'src/models/user.class';
import { ChatService } from '../chat.service';
import { UserService } from '../user.service';
import { Channel } from 'src/models/channel.class';

@Component({
  selector: 'app-dialog-add-channel-members',
  templateUrl: './dialog-add-channel-members.component.html',
  styleUrls: ['./dialog-add-channel-members.component.scss']
})
export class DialogAddChannelMembersComponent {
  @ViewChildren('userContainer') userContainers!: QueryList<any>;
  firestore: Firestore = inject(Firestore);
  channel: Channel = new Channel();
  selectedUsers: any[] = [];
  filteredUsers: User[] = [];
  isInputFocused: boolean = false;
  users: User[] = [];
  searchInput: string = '';
  currentUser;
  addMembers: boolean = false;
  allMembers: boolean = true;

  constructor(public chatService: ChatService, public userService: UserService) {
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
}