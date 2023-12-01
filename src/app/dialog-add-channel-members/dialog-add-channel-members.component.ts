import { Component, HostListener, OnInit, QueryList, ViewChildren, inject } from '@angular/core';
import { Firestore, collection, doc, getDoc, getDocs, updateDoc } from '@angular/fire/firestore';
import { User } from 'src/models/user.class';
import { ChatService } from '../chat.service';
import { UserService } from '../user.service';
import { Channel } from 'src/models/channel.class';

@Component({
  selector: 'app-dialog-add-channel-members',
  templateUrl: './dialog-add-channel-members.component.html',
  styleUrls: ['./dialog-add-channel-members.component.scss']
})
export class DialogAddChannelMembersComponent implements OnInit{
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


  constructor(public chatService: ChatService, public userService: UserService) {
    this.loadUsers();
    this.currentUser = this.userService.currentUser;
  }


  ngOnInit() {
    this.chatService.openChat$.subscribe((openChat) => {
      if (openChat) {
        const newChat = openChat as Channel;
        if (!this.currentChat || this.currentChat.id !== newChat.id) {
          this.currentChat = newChat;
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
  

  // async updateChannel() {
  //   if (this.currentChat) {
  //     const channelDocRef = doc(this.firestore, `channels/${this.currentChat.id}`);
  //     await updateDoc(channelDocRef, this.updateMembers()).catch(
  //       (error) => { console.log(error); }
  //     );
  //   }
  // }

  // updateMembers() {
  //   this.channel.members = this.selectedUsers;
  // }

 

 



  // async updateChannelId(colId: string, channel: Channel, newId: string) {
  //   channel.id = newId;
  //   await this.updateChannel(colId, channel);
  // }

  // async updateChannel(colId: string, channel: Channel) {
  //   const docRef = doc(collection(this.firestore, colId), channel.id);
    
  // }

  // getMembers() {
  //   if (this.allChannelMembers) {
  //     this.channel.members = this.users;
  //   } else {
  //     this.addCurrentUser();
  //     this.channel.members = this.selectedUsers;
  //   }
  // }
}