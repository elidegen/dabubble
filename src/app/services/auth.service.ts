import { Injectable } from '@angular/core';
import { inject } from '@angular/core';
import { Firestore, doc, } from '@angular/fire/firestore';
import { getAuth, updateEmail, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, sendPasswordResetEmail, signInAnonymously, } from "firebase/auth";
import { Router } from '@angular/router';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { UserService } from './user.service';
import { User } from 'src/models/user.class';
import { ChatService } from './chat.service';
import { collection, getDoc } from 'firebase/firestore';
import { Chat } from 'src/models/chat.class';
import { Channel } from 'src/models/channel.class';


@Injectable({
  providedIn: 'root'
})

export class AuthService {
  firestore: Firestore = inject(Firestore);
  private auth = getAuth();
  public storage = getStorage();
  provider = new GoogleAuthProvider();
  customPic: string = "";
  newGuest: User = new User;
  uploadFile: any;
  signInSuccess: any;
  chat: Chat = new Chat();

  constructor(public router: Router, public userService: UserService, public chatService: ChatService) {
    this.newGuest.name = 'Guest';
    this.newGuest.picture = 'assets/img/avatars/profile.svg';
    this.newGuest.online = true;
  }

  /**
  * Creates a new user using email and password.
  * On success, sets a flag indicating availability.
  */
  createUser() {
    createUserWithEmailAndPassword(this.auth, this.userService.currentEmail, this.userService.currentPassword)
      .then((userCredential) => {
        const user = userCredential.user;
        this.userService.userIsAvailable = true;
      })
  }

  /**
    * Signs in a user with given email and password.
    * Updates user's online status and login time.
    * Navigates to the home route on successful sign-in.
    * 
    */
  async signInUser(email: string, password: string) {
    try {
      await signInWithEmailAndPassword(this.auth, email, password);
      const activeUserIndex = this.findUserIndexWithEmail(email);
      if (activeUserIndex !== -1) {
        this.prepareUser(activeUserIndex);
        await this.checkLocalStorage(this.userService.currentUser);
        setTimeout(() => {
          this.router.navigate(['home']);
          this.signInSuccess = false;
        }, 1500);
      }
    } catch (error) {
      this.signInSuccess = false;
    }
  }

  /**
    *Prepares user data such as online status and login time and updates the user
    * 
    */
  prepareUser(activeUserIndex: any) {
    this.userService.users[activeUserIndex].online = true;
    this.userService.users[activeUserIndex].loginTime = this.getLoginTime();
    this.signInSuccess = true;
    this.userService.updateUser(this.userService.users[activeUserIndex]);
    this.userService.currentUser = this.userService.users[activeUserIndex];
    this.userService.setCurrentUserToLocalStorage();
  }

  /**
   * Asynchronously checks the local storage for the current chat, adds a personal chat if not found and logs a message if the user is already a member in the chat.
   * @param {User} user - The user to check for membership in the current chat.
   * @returns {Promise<void>} A promise that resolves when the check is complete.
   */
  async checkLocalStorage(user: User): Promise<void> {
    const chatJson = localStorage.getItem('currentChat');
    if (!chatJson) {
     await this.addPersonalChatToLocalStorage(user.id);
    } else {
      let existingChat: Chat | Channel;
      existingChat = JSON.parse(chatJson);
      const isUserMember = existingChat.members.some((member: any) => member.id === user.id);
      if (!isUserMember) {
        this.addPersonalChatToLocalStorage(user.id);
      }
    }
  }

  /**
   * Asynchronously adds a personal chat to local storage based on the user's ID.
   * @param {any} userId - The ID of the user for whom to add the personal chat.
   * @returns {Promise<void>} A promise that resolves when the personal chat is added to local storage.
   */
  async addPersonalChatToLocalStorage(userId: any) {
    const docRef = doc(collection(this.firestore, 'direct messages'), userId);
    const directMessage = await getDoc(docRef);
    if (directMessage.exists()) {
      const dmData = directMessage.data();
      const chat = new Chat({
        name: dmData['name'],
        members: dmData['members'],
        id: dmData['id'],
        type: 'direct',
      });
      const directJson = JSON.stringify(chat);
      localStorage.setItem('currentChat', directJson);
    }
  }

  /**
    * Returns the current time as a timestamp.
    * 
    */
  getLoginTime() {
    const currentTime = new Date();
    return currentTime.getTime();
  }


  /**
   * Signs in a user with Google authentication.
   * If the user does not exist, it adds a new user.
   */
  async signInWithGoogle() {
    await signInWithPopup(this.auth, this.provider)
      .then((result) => {
        const user = result.user;
        this.prepareGoogleUser(user)
      })
      .catch((error) => {
        console.error('Fehler bei Google-Anmeldung:', error);
        alert('Fehler bei Google-Anmeldung');
      });
    await this.addGoogleUser();
    await this.userService.updateUser(this.userService.currentUser);
    this.userService.setCurrentUserToLocalStorage();
  }

  /**
   * Prepares user data before signing in with google.
   */
  prepareGoogleUser(user: any) {
    this.userService.currentUser.name = user.displayName || ""
    this.userService.currentUser.email = user.email || "";
    this.userService.currentUser.picture = 'assets/img/icons/google.png' || "";
    this.userService.currentUser.online = true;
    this.userService.currentUser.loginTime = this.getLoginTime();
  }

  /**
   * Signs in a guest user and updates their login time.
   */
  async signInGuest() {
    this.userService.currentUser = this.newGuest;
    this.userService.currentUser.loginTime = this.getLoginTime();
    await this.userService.addUser(this.userService.currentUser);
    await this.userService.updateUser(this.userService.currentUser);
    this.userService.setCurrentUserToLocalStorage();
    const auth = getAuth();
    signInAnonymously(auth)
      .then(() => {
      })
      .catch((error) => {
      });
  }


  /**
   * Signs out the current user and updates their online status.
   */
  async signOutUser() {
    this.userService.removeCurrentUserFromLocalStorage();
    let userIndexToLogout = this.findUserIndexWithEmail(this.userService.currentUser.email);
    if (userIndexToLogout != -1) {
      this.userService.users[userIndexToLogout].online = false;
      this.userService.updateUser(this.userService.users[userIndexToLogout]);
    }
    this.userService.currentUser = new User;
    await signOut(this.auth).then(() => {
    }).catch((error) => {
      console.error('Fehler beim Abmelden:', error);
    });
  }

  /**
    * Adds a Google user if they don't already exist in the system.
    */
  async addGoogleUser() {
    if (!this.userService.userExists(this.userService.currentUser.email || '')) {
      await this.userService.addUser(this.userService.currentUser);
    }
    this.userService.setCurrentUserToLocalStorage();
    await this.router.navigate(['home']);
  }


  /**
   * Updates the current user's email.
   * 
   */
  async updateUserEmail(newEmail: string): Promise<void> {
    const auth = getAuth();
    updateEmail(auth.currentUser!, newEmail)
    .catch((error) => {
      console.log(error)
    });
  }


  /**
   * Sends a password reset email to the given address.
   * 
   */
  sendResetEmail(emailAddress: string) {
    sendPasswordResetEmail(this.auth, emailAddress)
      .then(() => {
        this.userService.resetEmailFound = true;
      })
      .catch((error) => {
        console.error('Fehler beim Senden der Passwort-Reset-E-Mail:', error);
      });
  }


  findUserIndexWithEmail(email: any) {
    return this.userService.users.findIndex(user => user.email === email);
  }


  findUserIndexWithId(Id: string) {
    return this.userService.users.findIndex(user => user.id === Id);
  }


  /**
   * Uploads a profile image to Firebase storage and updates the customPic URL.
   * 
   */
  async uploadProfileImage(file: any) {
    const storageReference = storageRef(this.storage, `profileImages/${file.name}`);
    const uploadTask = uploadBytesResumable(storageReference, file);
    uploadTask.on('state_changed', () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          this.customPic = downloadURL;
        });
      }
    );
  }

 /**
   * Determines the file type based on the file URL.
   * 
   */
  getFileType(fileUrl?: any): any | null {
    if (fileUrl) {
      const extension = fileUrl.split('.').pop()?.split('?')[0];
      return extension || null;
    }
    return null; // Oder werfen Sie einen Fehler oder geben Sie einen Standardwert zurück
  }


   /**
     * Checks if the file URL points to an image based on common image file extensions.
     * 
     */
  isImage(fileUrl: any): any {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif'];
    const extension = this.getFileType(fileUrl);
    if (extension) {
      return imageExtensions.includes(extension.toLowerCase()) || null;
    }
  }


   /**
     * Checks if the file URL points to a PDF file.
     * 
     */
  isPDF(fileUrl: any): any {
    const extension = this.getFileType(fileUrl);
    if (extension) {
      return extension.toLowerCase() === 'pdf';
    }
  }
}