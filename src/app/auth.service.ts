import { Injectable } from '@angular/core';
import { inject } from '@angular/core';
import { Firestore,} from '@angular/fire/firestore';
import { getAuth, updateEmail,  createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, sendPasswordResetEmail, signInAnonymously, } from "firebase/auth";
import { Router } from '@angular/router';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  firestore: Firestore = inject(Firestore);
  private auth = getAuth();
  provider = new GoogleAuthProvider();
  customPic: string ="";

  ngOnInit() {
 
  }

  constructor(public router: Router, public userService: UserService) {

  }

  ngOnDestroy() {
  }


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

  async signInUser(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      console.log("User signed in:", userCredential.user);
      
      const activeUserIndex = this.findUserIndexWithEmail(email);
      if (activeUserIndex !== -1) {
        this.userService.users[activeUserIndex].online = true;
        this.userService.signInSuccess = true;
        this.userService.currentUser = this.userService.users[activeUserIndex];
        this.userService.setCurrentUserToLocalStorage();
        console.log("Current User:", this.userService.currentUser);
        await this.router.navigate(['home']);
      }
    } catch (error) {
      this.userService.signInSuccess = false;
      console.log("Anmeldung Fehlgeschlagen");
    }
  }


  async signInWithGoogle() {
    await signInWithPopup(this.auth, this.provider)
      .then((result) => {
        const user = result.user;
        console.log('Google Benutzer angemeldet:', user);
        this.userService.currentUser = {
          name: user.displayName || "",
          email: user.email || "",
          password: "",
          id: user.uid,
          picture: user.photoURL || "",
          online: true,
        };
        this.addGoogleUser();
      })
      .catch((error) => {
        console.error('Fehler bei Google-Anmeldung:', error);
      });

  }


  signInGuest() {
    const auth = getAuth();
signInAnonymously(auth)
  .then(() => {
console.log("Guest logged in");
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.log(error.code);
    console.log(error.message);
    // ...
  });
  }

  async signOutUser() {
    await signOut(this.auth).then(() => {
      console.log('Benutzer erfolgreich abgemeldet');
    }).catch((error) => {
      console.error('Fehler beim Abmelden:', error);
    });
    let userIndexToLogout = this.findUserIndexWithEmail(this.userService.currentUser.email);
    if (userIndexToLogout != -1) {
    console.log("Index to Logout", userIndexToLogout);
    this.userService.users[userIndexToLogout].online = false;
    await this.userService.updateUser('users', this.userService.users[userIndexToLogout]);
    console.log(this.userService.users[userIndexToLogout]);
    this.userService.currentUser = this.userService.createEmptyUser();
    await this.userService.removeCurrentUserFromLocalStorage();
  }
  }


  async addGoogleUser() {
    if (!this.userService.userExists(this.userService.currentUser.email)) {
    await this.userService.addUser('users', this.userService.currentUser);
  }
    await this.userService.setCurrentUserToLocalStorage();
    await this.userService.getCurrentUserFromLocalStorage();
    await this.router.navigate(['home']);
  }

async updateUserEmail(newEmail:string):Promise<void> {
  const auth = getAuth();
  updateEmail(auth.currentUser!, newEmail).then(() => {
console.log("User email updatet")
    // ...
  }).catch((error) => {
 console.log(error)
    // ...
  });
  }



  


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

 
  findUserIndexWithEmail(email: string) {
    return this.userService.users.findIndex(user => user.email === email);
  }


  async uploadProfileImage(file: File,) {
    const storage = getStorage();
    const storageReference = storageRef(storage, `profileImages/${file.name}`);
    const uploadTask = uploadBytesResumable(storageReference, file);
    uploadTask.on('state_changed',
      (onSnapshot) => {
        const progress = (onSnapshot.bytesTransferred / onSnapshot.totalBytes) * 100;
        console.log('Upload is ' + progress + '% done');
        switch (onSnapshot.state) {
          case 'paused':
            console.log('Upload is paused');
            break;
          case 'running':
            console.log('Upload is running');
            break;
        }
      },
      (error) => {
        console.error('Upload error:', error);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          console.log('File available at', downloadURL);
          this.customPic = downloadURL;
        
        });
      }
    );
  }
}


