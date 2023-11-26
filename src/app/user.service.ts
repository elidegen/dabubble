import { Injectable } from '@angular/core';
import { UserData } from './interfaces/user-interface';
import { inject } from '@angular/core';
import { Firestore, collection, doc, collectionData, onSnapshot, addDoc, deleteDoc, updateDoc } from '@angular/fire/firestore';
import { getAuth, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, User, sendPasswordResetEmail } from "firebase/auth";
import { Timestamp } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})

export class UserService {

  firestore: Firestore = inject(Firestore);
  users: UserData[] = [];
  currentUser = this.createEmptyUser();
  currentEmail: string = "";
  currentPassword: string = "";
  private auth = getAuth();
  provider = new GoogleAuthProvider();
  signInSuccess = false;
  unsubList;

  ngOnInit() {
    this.getCurrentUserFromLocalStorage();

  }

  constructor(public router: Router) {
    this.unsubList = this.subUserList('users');

    // this.unsubSingle = onSnapshot(this.getSingleDocRef("users", "adsfasdf"), (element) => {
    // });
    // this.unsubSingle();



  }

  ngOnDestroy() {
    this.unsubList();
  }



  createUser() {
    createUserWithEmailAndPassword(this.auth, this.currentEmail, this.currentPassword)
      .then((userCredential) => {
        console.log(this.currentEmail, this.currentPassword);
        const user = userCredential.user;
        console.log("created User:", user)
        this.signInUser(this.currentEmail, this.currentPassword);
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(`Error Code: ${errorCode}`);
        console.log(`Error Message: ${errorMessage}`);
        // ..
      });

  }


  async signInUser(email: string, password: string) {
    await signInWithEmailAndPassword(this.auth, email, password)
      .then((userCredential) => {
        this.signInSuccess = true;
        let activeUser = this.findUserIndexWithEmail(email);
        console.log(activeUser);
        this.users[activeUser].online = true;
        this.currentUser = this.users[activeUser];
        this.setCurrentUserToLocalStorage();

        if (this.signInSuccess) {
          this.router.navigate(['home']);
          console.log("CurrentUser", this.currentUser);
        }
      })
      .catch((error) => {
        console.error('Anmeldefehler:', error);
      });

  }


  async signInWithGoogle() {
    await signInWithPopup(this.auth, this.provider)
      .then((result) => {
        const user = result.user;
        console.log('Google Benutzer angemeldet:', user);
        this.currentUser = {
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


  async signOutUser() {
    await signOut(this.auth).then(() => {
      console.log('Benutzer erfolgreich abgemeldet');

    }).catch((error) => {
      console.error('Fehler beim Abmelden:', error);
    });
    let userIndexToLogout = this.findUserIndexWithEmail(this.currentUser.email);
    console.log("Index to Logout", userIndexToLogout);
    this.users[userIndexToLogout].online = false;
    await this.updateUser('users', this.users[userIndexToLogout]);
    console.log(this.users[userIndexToLogout]);
    this.currentUser = this.createEmptyUser();
    await this.removeCurrentUserFromLocalStorage();
  }


  async addGoogleUser() {
    if (!this.userExists(this.currentUser.email)) {
    await this.addUser('users', this.currentUser);
  }
    await this.setCurrentUserToLocalStorage();
    await this.getCurrentUserFromLocalStorage();
    await this.router.navigate(['home']);
  }



  findUserIndexWithEmail(email: string) {
    return this.users.findIndex(user => user.email === email);
  }

  sendResetEmail(emailAddress: string) {
    sendPasswordResetEmail(this.auth, emailAddress)
      .then(() => {
        console.log('Passwort-Reset-E-Mail gesendet.');
      })
      .catch((error) => {
        console.error('Fehler beim Senden der Passwort-Reset-E-Mail:', error);
      });
  }






  setUserData(obj: any,) {

    return {
      name: obj.name || "",
      email: obj.email || "",
      password: obj.password || "",
      id: obj.id,
      picture: obj.picture || "",
      online: obj.online || false,
    }
  }

  async addUser(colId: string, item: UserData) {
    await addDoc(this.getUsersRef(colId), item).catch(
      (err) => { console.log(err) }
    ).then(
      (docRef) => {
        console.log()
        this.updateUserId(colId, item, docRef!.id);
        console.log("New user with id", docRef!.id)
      }
    )
  }

  subUserList(coldId: string) {
    return onSnapshot(this.getUsersRef(coldId), (list) => {
      this.users = [];
      list.forEach(element => {
        this.users.push(this.setUserData(element.data()));
        console.log("Available users", element.data());
      })
    })
  }



  async deleteUser(colId: string, docId: string) {
    await deleteDoc(this.getSingleDocRef(colId, docId)).catch(

      (err) => { console.log(err); }
    )
  }

  async updateUserId(colId: string, user: UserData, newId: string,) {
    user.id = newId;
    await this.updateUser(colId, user);
  }


  async updateUser(colId: string, user: UserData) {
    let docRef = this.getSingleDocRef(colId, user.id);
    await updateDoc(docRef, this.getUpdateData(user)).catch(

      (error) => { console.log(error); }

    );
  }

  getUpdateData(user: UserData) {
    return {
      name: user.name,
      email: user.email,
      password: user.password,
      id: user.id,
      picture: user.picture,
      online: user.online,
    }
  }

  createEmptyUser(): UserData {
    return {
      name: "Guest",
      email: "",
      password: "",
      id: "",
      picture: "assets/img/avatars/profile.svg",
      online: false,
    }
  }


  setCurrentUserToLocalStorage() {
    let userJson = JSON.stringify(this.currentUser);
    localStorage.setItem('currentUser', userJson);
    console.log('currentUser im LocalStorage gespeichert');
  }

  removeCurrentUserFromLocalStorage() {
    localStorage.removeItem('currentUser');
    console.log('currentUser aus LocalStorage entfernt');
  }

  getCurrentUserFromLocalStorage(): void {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      this.currentUser = JSON.parse(userJson) as UserData;
    } else {
      console.log('Kein currentUser im LocalStorage gefunden');
      this.currentUser = this.createEmptyUser();
    }
  }

  /**This is for getting the collection "customers" from firebase */
  getUsersRef(colId: string) {
    return collection(this.firestore, colId);
  }

  /**Here i get the Infos about a single customer, 
  
  * colId = the id from the collection, in this case probably "customers,"
  * doc id = the specific id from a customer.
  */
  getSingleDocRef(colId: string, docId: string) {
    return doc(collection(this.firestore, colId), docId);
  }

  userExists(email: string): boolean {
    return this.users.some(user => user.email === email);
  }

}

