import { Injectable } from '@angular/core';
import { inject } from '@angular/core';
import { Firestore, } from '@angular/fire/firestore';
import { getAuth, updateEmail, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, sendPasswordResetEmail, signInAnonymously, } from "firebase/auth";
import { Router } from '@angular/router';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { UserService } from './user.service';
import { User } from 'src/models/user.class';


@Injectable({
  providedIn: 'root'
})

export class AuthService {
  firestore: Firestore = inject(Firestore);
  private auth = getAuth();
  provider = new GoogleAuthProvider();
  customPic: string = "";
  newGuest: User = new User;
  uploadFile: any;
  signInSuccess: any;


  ngOnInit() { }

  constructor(public router: Router, public userService: UserService) {
    this.newGuest.name = 'Guest';
    this.newGuest.picture = 'assets/img/avatars/profile.svg';
    this.newGuest.online = true;
  }

  ngOnDestroy() { }

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
      await signInWithEmailAndPassword(this.auth, email, password);

      const activeUserIndex = this.findUserIndexWithEmail(email);
      if (activeUserIndex !== -1) {
        this.userService.users[activeUserIndex].online = true;
        this.userService.users[activeUserIndex].loginTime = this.getLoginTime();
        this.signInSuccess = true;
        this.userService.updateUser(this.userService.users[activeUserIndex]);
        console.log("Login Time von User", this.userService.users[activeUserIndex]);
        this.userService.currentUser = this.userService.users[activeUserIndex];
        this.userService.setCurrentUserToLocalStorage();
        setTimeout(() => {
           this.router.navigate(['home']);
           this.signInSuccess = false;
        }, 1500);
     
      }
    } catch (error) {
      this.signInSuccess = false;
      // console.log("Anmeldung Fehlgeschlagen");
    }
  }


  getLoginTime() {
    const currentTime = new Date();
     return currentTime.getTime();
  }


  async signInWithGoogle() {
    await signInWithPopup(this.auth, this.provider)
      .then((result) => {
        const user = result.user;
        console.log('Google Benutzer angemeldet:', user);
        this.userService.currentUser.name = user.displayName || ""
        this.userService.currentUser.email = user.email || "";
        this.userService.currentUser.password = "";
        this.userService.currentUser.picture = user.photoURL || "";
        this.userService.currentUser.online = true;
        this.userService.currentUser.loginTime = this.getLoginTime();
        this.addGoogleUser(user.uid);
      })
      .catch((error) => {
        console.error('Fehler bei Google-Anmeldung:', error);
      });
  }

  //  signInWithApple() {
  //     const appleAuthRequestResponse = await appleAuth.performRequest({
  //       requestedOperation: appleAuth.Operation.LOGIN,
  //       requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
  //     });

  //     // Erstellt eine Firebase-Anmeldeinformation
  //     const credential = auth.AppleAuthProvider.credential(
  //       appleAuthRequestResponse.identityToken
  //     );

  //     // Anmeldung bei Firebase
  //     return auth().signInWithCredential(credential);
  //   }

  signInGuest() {
    const auth = getAuth();
    signInAnonymously(auth)
      .then(() => {
        console.log("Guest logged in");
        this.userService.currentUser = this.newGuest;
        this.userService.currentUser.id = this.createId(10);
        this.userService.setCurrentUserToLocalStorage();
        console.log("Guest ist eingeloggt", this.userService.currentUser);
     
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


  async addGoogleUser(id:any) {
    if (!this.userService.userExists(this.userService.currentUser.email || '')) {
      this.userService.currentUser.id = id;
      await this.userService.addUser(this.userService.currentUser);
    }
    console.log("googleUser", this.userService.currentUser);
    await this.userService.setCurrentUserToLocalStorage();
    console.log("currentUser",this.userService.currentUser);
    await this.router.navigate(['home']);
  }

  async updateUserEmail(newEmail: string): Promise<void> {
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

  findUserIndexWithEmail(email: any) {
    return this.userService.users.findIndex(user => user.email === email);
  }

  findUserIndexWithId(Id: string) {
    return this.userService.users.findIndex(user => user.id === Id);
  }

  async uploadProfileImage(file: any) {
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


  getFileType(fileUrl?: any): any | null {

    if (fileUrl) {
      const extension = fileUrl.split('.').pop()?.split('?')[0];
      return extension || null;
    }
    return null; // Oder werfen Sie einen Fehler oder geben Sie einen Standardwert zurück
  }

  isImage(fileUrl: any): any {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif'];
    const extension = this.getFileType(fileUrl);
    if (extension) {
      return imageExtensions.includes(extension.toLowerCase()) || null;
    }

  }

  isPDF(fileUrl: any): any {
    const extension = this.getFileType(fileUrl);
    if (extension) {
      return extension.toLowerCase() === 'pdf';
    }
  }




}