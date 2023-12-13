import { Injectable } from '@angular/core';
import { inject } from '@angular/core';
import { Firestore, } from '@angular/fire/firestore';
import { getAuth, updateEmail, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, sendPasswordResetEmail, signInAnonymously, } from "firebase/auth";
import { Router } from '@angular/router';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { UserService } from './user.service';
import { User } from 'src/models/user.class';
import { ChatService } from './chat.service';


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
        console.log(this.userService.currentEmail, this.userService.currentPassword);
        const user = userCredential.user;
        console.log("created User:", user)
        this.userService.userIsAvailable = true;
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(`Error Code: ${errorCode}`);
        // ..
      });
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
     Prepares user data such as online status and login time and updates the user
     * 
     */
  prepareUser(activeUserIndex: any) {
    this.userService.users[activeUserIndex].online = true;
    this.userService.users[activeUserIndex].loginTime = this.getLoginTime();
    this.signInSuccess = true;
    this.userService.updateUser(this.userService.users[activeUserIndex]);
    console.log("Login Time von User", this.userService.users[activeUserIndex]);
    this.userService.currentUser = this.userService.users[activeUserIndex];
    this.userService.setCurrentUserToLocalStorage();
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
    console.log("das ist der google user der geupadeted wurde", this.userService.currentUser)
    await this.userService.updateUser(this.userService.currentUser);
    console.log("alle user", this.userService.users);
    await this.userService.setCurrentUserToLocalStorage();
  }


  /**
 * Prepares user data before signing in with google.
 */
  prepareGoogleUser(user: any) {
    console.log('Google Benutzer angemeldet:', user);
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
    console.log("Guest logged in");
    this.userService.currentUser = this.newGuest;
    this.userService.currentUser.loginTime = this.getLoginTime();
    await this.userService.addUser(this.userService.currentUser);
    await this.userService.updateUser(this.userService.currentUser);
    await this.userService.setCurrentUserToLocalStorage();
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
      console.log("Index to Logout", userIndexToLogout);
      this.userService.users[userIndexToLogout].online = false;
      this.userService.updateUser(this.userService.users[userIndexToLogout]);
    }
    this.userService.currentUser = new User;
    await signOut(this.auth).then(() => {
      console.log('Benutzer erfolgreich abgemeldet');
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
    console.log("googleUser", this.userService.currentUser);
    await this.userService.setCurrentUserToLocalStorage();
    console.log("currentUser", this.userService.currentUser);
    await this.router.navigate(['home']);
  }


  /**
   * Updates the current user's email.
   * 
   */
  async updateUserEmail(newEmail: string): Promise<void> {
    const auth = getAuth();
    updateEmail(auth.currentUser!, newEmail).then(() => {
      console.log("User email updatet")
    }).catch((error) => {
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
        console.log('Passwort-Reset-E-Mail gesendet.');
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
    uploadTask.on('state_changed',
   () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          this.customPic = downloadURL;
        });
      }
    );
  }


  /**
   * Outsource data log function to save space in uploadProfileImage function.
   * 
   */
  dataLogUpload(state: any) {
    switch (state.state) {
      case 'paused':
        console.log('Upload is paused');
        break;
      case 'running':
        console.log('Upload is running');
        break;
    }
  }

/**
   * Creates a random alphanumeric string of a specified length.
   * 
   */
  createId(length: number) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
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