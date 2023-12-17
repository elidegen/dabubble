import { Component, HostListener, QueryList, ViewChildren, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ChatService } from '../services/chat.service';
import { UserService } from '../services/user.service';
import { Firestore, collection, doc, getDoc, getDocs } from '@angular/fire/firestore';
import { Channel } from 'src/models/channel.class';
import { User } from 'src/models/user.class';
import { updateDoc } from 'firebase/firestore';
import { FirestoreService } from '../services/firestore.service';

@Component({
  selector: 'app-dialog-add-to-group',
  templateUrl: './dialog-add-to-group.component.html',
  styleUrls: ['./dialog-add-to-group.component.scss']
})
export class DialogAddToGroupComponent {
  
  constructor(public dialogRef: MatDialogRef<DialogAddToGroupComponent>, public chatService: ChatService, 
    public userService: UserService, public firestoreService: FirestoreService) {
    this.currentChat = this.userService.getCurrentChatFromLocalStorage();
    this.loadUsers();
    this.getAllChannelMembers();
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


  /**
   * Listens for clicks on the document to determine if the click occurred outside the user search container.
   * If so, it blurs the search input.
   * @param {Event} event - The click event on the document.
   */
  @HostListener('document:click', ['$event'])
  checkClick(event: Event) {
    const clickedElement = event.target as HTMLElement;
    if (!clickedElement.classList.contains('user-search-container') && !clickedElement.classList.contains('user-container') && this.isInputFocused && !clickedElement.classList.contains('input-members')) {
      this.isInputFocused = false;
    }
  }


  /**
   * Loads all users from Firestore and initializes them as User instances.
   */
  async loadUsers() {
    try {
      const querySnapshot = await getDocs(collection(this.firestore, 'users'));
      this.users = querySnapshot.docs.map((doc: { data: () => any; }) => new User(doc.data()));
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }


  /**
   * Filters the list of users based on the user's input in the search field.
   */
  filterUsers(): void {
    this.isInputFocused = true;
    this.filteredUsers = this.users.filter(user =>
      user.name?.toLowerCase().includes(this.searchInput.toLowerCase())
    );
  }


  /**
   * Prevents event propagation when a user is selected from the list.
   * @param {Event} event - The event associated with user selection.
   */
  userSelected(event: Event) {
    event.stopPropagation();
  }


  /**
   * Removes a selected user from the list of selected members.
   * @param {User} user - The user to remove.
   */
  removeUser(user: User) {
    let index = this.selectedUsers.findIndex((obj: { id: string | undefined; }) => obj.id === user.id);
    if (index !== -1) {
      this.selectedUsers.splice(index, 1);
    }
  }


  /**
   * Toggles the selection state of a user when clicked, adding or removing them from the list of selected members.
   * @param {any} user - The user object to be selected or deselected.
   * @param {number} i - The index of the user in the list to highlight the corresponding button.
   */
  selectUser(user: any, i: number) {
    this.highlightButtons();
    let index = this.selectedUsers.findIndex((obj: { id: string | undefined; }) => obj.id === user.id);
    if (index == -1) {
      this.selectedUsers.push(user);
    } else {
      this.removeUser(user)
    }
  }


  /**
   * Adds or removes highlight from user buttons based on whether they are selected.
   */
  highlightButtons() {
    this.filteredUsers.forEach(user => {
      if (this.selectedUsers.includes(user)) {
        this.addHighlight(user);
      } else {
        this.removeHightlight(user);
      }
    });
  }


  /**
   * Removes highlight from the button associated with a user.
   * @param {User} user - The user whose button should be unhighlighted.
   */
  removeHightlight(user: User) {
    let index = this.filteredUsers.findIndex((obj => obj === user));
    const userContainer = this.userContainers.toArray()[index];
    if (userContainer) {
      userContainer.nativeElement.classList.remove('user-container-highlighted');
    }
  }


  /**
   * Adds highlight to the button associated with a user.
   * @param {User} user - The user whose button should be highlighted.
   */
  addHighlight(user: User) {
    let index = this.filteredUsers.findIndex((obj => obj === user));
    const userContainer = this.userContainers.toArray()[index];
    if (userContainer) {
      userContainer.nativeElement.classList.add('user-container-highlighted');
    }
  }


  /**
   * Fetches all existing members of the current channel from Firestore.
   */
  async getAllChannelMembers() {
    if (this.currentChat?.id) {
      const channelDocRef = doc(this.firestore, `channels/${this.currentChat.id}`);
      const channelDocSnap = await getDoc(channelDocRef);
      if (channelDocSnap.exists()) {
        const channelData = channelDocSnap.data();
        this.allChannelMembers = channelData?.['members'];
      } else {
      }
      this.showExistingMembers();
    }
  }


  /**
   * Shows the existing members of the channel as selected by default.
   */
  showExistingMembers() {
    this.selectedUsers = this.allChannelMembers;
  }


  /**
   * Adds the selected members to the current channel in Firestore.
   */
  async addChannelMember() {
    if (this.currentChat) {
      const channelDocRef = doc(collection(this.firestore, 'channels'), this.currentChat.id);
      this.channel.members = this.formatMembers(this.selectedUsers);
      this.channel.name = this.currentChat.name;
      this.channel.id = this.currentChat.id;
      this.channel.description = this.currentChat.description;
      await updateDoc(channelDocRef, this.channel.toJSON()).catch((error) => {
        console.error('Error updating document:', error);
      });
    }
    this.dialogRef.close();
  }

  /**
   * Formats the selected users into a structure suitable for storing in Firestore.
   * @param {any[]} usersToFormat - The users to format for Firestore.
   * @returns {Object[]} An array of user objects formatted for Firestore.
   */
  formatMembers(usersToFormat: any[]){
    const formattedUsers = usersToFormat.map(user => {
      return {
        name: user.name,
        email: user.email,
        password: user.password,
        id: user.id,
        picture: user.picture,
        online: user.online
      };
    });
    return formattedUsers;
  }


  /**
   * Adds the selected users to the channel members array, preparing them to be added to Firestore.
   * @param {any[]} selectedUsers - The selected users to be added to the channel.
   */
  getMembers() {
    if (this.allChannelMembers) {
      this.addSelectedUsersToChannel(this.users);
    } else {
      this.addCurrentUser();
      this.addSelectedUsersToChannel(this.selectedUsers);
    }
  }


  /**
   * Adds the selected users to the channel members array, preparing them to be added to Firestore.
   * @param {any[]} selectedUsers - The selected users to be added to the channel.
   */
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


  /**
   * Adds the current user to the list of selected members if they are not already included.
   */
  addCurrentUser() {
    const userAlreadySelected = this.selectedUsers.some(user => user.id === this.currentUser.id);
    if (!userAlreadySelected) {
      this.selectedUsers.push(this.currentUser);
    }
  }
}