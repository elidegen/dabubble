import { Injectable } from '@angular/core';
import { UserData } from './interfaces/user-interface';
import { inject } from '@angular/core';
import { Firestore, collection, doc, collectionData, onSnapshot, addDoc, deleteDoc, updateDoc, } from '@angular/fire/firestore';
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
  signInSuccess = false;
  customPic: string ="";
  userIsAvailable: boolean = false;
  resetEmailFound: boolean = false;
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
        // console.log("Available users", element.data());
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
    console.log("User updated", user);
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


