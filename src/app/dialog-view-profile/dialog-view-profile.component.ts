import { Component, ElementRef, Inject, OnInit, ViewChild, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { User } from 'src/models/user.class';
import { FirestoreService } from '../services/firestore.service';
import { ChatService } from '../services/chat.service';
import { Router } from '@angular/router';
import { DocumentData, collection, doc } from 'firebase/firestore';
import { Firestore, getDoc, getDocs, query, updateDoc, where } from '@angular/fire/firestore';
import { Channel } from 'src/models/channel.class';
import { Chat } from 'src/models/chat.class';

@Component({
  selector: 'app-dialog-view-profile',
  templateUrl: './dialog-view-profile.component.html',
  styleUrls: ['./dialog-view-profile.component.scss', './dialog-view-profile.mediaquery.component.scss']
})

export class DialogViewProfileComponent {
  firestore: Firestore = inject(Firestore);
  editState: boolean = false;
  currentUser: User;
  user: User = new User();
  editedUser: User = new User();
  currentChat!: Channel | undefined;
  currentDM!: Chat | undefined;
  channel: Channel = new Channel;
  dm: Chat = new Chat
  channelMembers!: any[];
  directMessageMembers!: any[];

  constructor(
    public dialogRef: MatDialogRef<DialogViewProfileComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { userID: string },
    public userService: UserService,
    public authService: AuthService,
    public firestoreService: FirestoreService, public chatService: ChatService, public router: Router) {
    this.currentUser = this.userService.currentUser;
    this.setUser();
  }

  ngOnInit() {
    this.chatService.openChat$.subscribe((openChat) => {
      if (openChat) {
        this.loadSelectedChannel(openChat);
      } else {
        this.loadChannelFromLocalStorage();
      }
    });
    this.chatService.openDirectMessage$.subscribe((openDirectMessage) => {
      if (openDirectMessage) {
        this.loadSelectedDirectMessage(openDirectMessage);
      } else {
       this.loadDirectMessageFromLocalStorage();
      }
    });
  }


  loadSelectedChannel(openChat: Channel) {
    const newChat = openChat as Channel;
    if (!this.currentChat || this.currentChat.id !== newChat.id) {
      this.currentChat = newChat;
    }
  }


  loadChannelFromLocalStorage() {
    let channel = this.userService.getCurrentChatFromLocalStorage();
    if (channel?.type == 'channel') {
      this.currentChat = channel
    }
  }


  loadSelectedDirectMessage(openDirectMessage: Chat) {
    const newChat = openDirectMessage as Chat;
    if (!this.currentChat || this.currentChat.id !== newChat.id) {
      this.currentDM = newChat;
    } 
  }


  loadDirectMessageFromLocalStorage() {
    let directMessage = this.userService.getCurrentChatFromLocalStorage();
    if (directMessage?.type == 'direct') {
      this.currentDM = directMessage;
    }
  }

 

  /**
   * Sets the user profile to be viewed.
   */
  setUser() {
    const users = this.userService.users;
    const index = users.findIndex(user => user.id == this.data.userID);
    this.user = users[index] as User;
    this.editedUser = { ...this.user } as User;
  }

  /**
   * Allows the current user to edit their profile. It saves the updated user data
   * to local storage and updates the user information in the database.
   */
  async editUser() {
    this.user = this.editedUser;
    this.userService.currentUser = this.user;
    this.userService.setCurrentUserToLocalStorage();
    // await this.userService.updateUser(this.user);
    // this.authService.updateUserEmail(this.user.email!);  
    // await this.updateCurrentUserInChannel(this.user);
    await this.updateChannelMessages(this.user);  
    // await this.updateCurrentUserInDirect(this.user);
    // await this.updateDMMessages(this.user)
    this.userService.profileEdited.emit();
    this.dialogRef.close();
  }

  

  /**
   * Handles the selection of a new profile image file.
   * Validates the file size and uploads the image to the server, updating the user profile.
   *
   * @param {Event} event - The file input change event containing the selected file.
   */
  onFileSelected(event: any): void {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > 500000) {
        alert("Max file size 500kb !");
      } else {
        this.authService.uploadProfileImage(file);
        this.firestoreService.showSpinner = true;
      }
      this.updateUserView();
      event.target.value = '';
    }
  }

  /**
   * Updates values of user view
   */
  updateUserView() {
    setTimeout(() => {
      this.user.picture = this.authService.customPic;
      this.userService.currentUser.picture = this.user.picture;
      this.userService.updateUser(this.user);
      this.firestoreService.showSpinner = false;
    }, 1500);
  }

  /**
   * Opens a direct Chat with selected User.
   */
  selectUser(user: any) {
    this.chatService.createDirectMessage(user);
    this.chatService.chatWindow = 'direct';
    if (this.chatService.isMobile) {
      this.router.navigate(['main']);
    }
    this.dialogRef.close();
  }


  async updateCurrentUserInChannel(user: User) {
    if (this.currentChat) { 
      const channelDocRef = doc(collection(this.firestore, 'channels'), this.currentChat?.id);
      this.channelMembers = this.currentChat.members;
      let currentUserIndex = this.channelMembers.findIndex((user) => user.id === this.userService.currentUser.id);
      this.channelMembers[currentUserIndex].name = user.name;
      this.channelMembers[currentUserIndex].email = user.email;
      if (this.currentChat.creatorId == user.id) {
        this.currentChat.creator = user.name;
        await updateDoc(channelDocRef, {
          members: this.channelMembers,
          creator: user.name,
        });
      } else {
        await updateDoc(channelDocRef, {
          members: this.channelMembers,
        });
      }
      this.userService.setCurrentChatToLocalStorage(this.currentChat);
    }
  }

  async updateCurrentUserInDirect(user: User) {
    if (this.currentDM) {
      const dmDocRef = doc(collection(this.firestore, 'direct messages'), this.currentDM?.id);
      this.directMessageMembers = this.currentDM.members;
      let currentUserIndex = this.directMessageMembers.findIndex((user) => user.id === this.userService.currentUser.id);
      this.directMessageMembers[currentUserIndex].name = user.name;
      this.directMessageMembers[currentUserIndex].email = user.email;
      await updateDoc(dmDocRef, {
        members: this.directMessageMembers,
      });
      this.userService.setCurrentChatToLocalStorage(this.currentDM);
    }
  }

  async updateChannelMessages(user: User) {
    let channelMessages: any[];
    await this.chatService.getallChannels();
    await this.chatService.getAllChannelMessages();
    channelMessages = this.chatService.allMessagesOfChannel;
    console.log('Message', this.chatService.allMessagesOfChannel);
    channelMessages.forEach((message) => {
      if (message.creatorId === user.id) {
        let messageDocRef = doc(collection(this.firestore, `channels/${message.channelID}/messages`), message.id);
        updateDoc(messageDocRef, {
          creator: user.name
        })
      }
    })
  }

  async updateDMMessages(user: User) {
    let dmMessages: any[];
    await this.chatService.loadAllDirectMessages();
    await this.chatService.getDMMessages();
    dmMessages = this.chatService.allMessagesOfDM;
    dmMessages.forEach((message) => {
      if (message.creatorId === user.id) {
        let messageDocRef = doc(collection(this.firestore, `direct messages/${message.channelID}/messages`), message.id);
        updateDoc(messageDocRef, {
          creator: user.name
        })
      }
    })
  }
}