import { Injectable } from '@angular/core';
import { inject } from '@angular/core';
import { Firestore, collection, doc, onSnapshot, addDoc, deleteDoc, updateDoc, } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { User } from 'src/models/user.class';




@Injectable({
  providedIn: 'root'
})

export class UserService {
  firestore: Firestore = inject(Firestore);
  users: User[] = [];
  currentUser: User = new User;
  currentEmail: string = "";
  currentPassword: string = "";
  customPic: any = "";
  userIsAvailable: boolean = false;
  resetEmailFound: boolean = false;
  openUserContainerTextfield = new BehaviorSubject<boolean>(false);
  nameStringForTextfield: any;
  openUserContainerThreadTextfield= new BehaviorSubject<boolean>(false);
 
  unsubList;


 

  ngOnInit() {
    this.getCurrentUserFromLocalStorage();
   
  }

  constructor(public router: Router ) {
    this.unsubList = this.subUserList();
    console.log("Alle Nutzer",this.users);
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

  async addUser(item: User) {
    await addDoc(this.getUsersRef(), item.toJSON()).catch(
      (err) => { console.log(err) }
    ).then(
      (docRef) => {
        console.log()
        this.updateUserId(item, docRef!.id);
      }
    )
  }

  subUserList() {
  
    return onSnapshot(this.getUsersRef(), (list) => {
      this.users = [];
      list.forEach(element => {
        this.users.push(element.data() as User);
      })
    })
   
  }

  async deleteUser(colId: string, docId: string) {
    await deleteDoc(this.getSingleDocRef(colId, docId)).catch(

      (err) => { console.log(err); }
    )
  }

  async updateUserId(user: User, newId: string,) {
    user.id = newId;
    await this.updateUser(user);
  }

  async updateUser(user: User) {
    let docRef = this.getSingleDocRef('users', user.id || '');
    await updateDoc(docRef, this.getUpdateData(user)).catch(
      (error) => { console.log(error); }
    );
  }




  getUpdateData(user: User) {
    return {
      name: user.name,
      email: user.email,
      password: user.password,
      id: user.id,
      picture: user.picture,
      online: user.online,
      loginTime: user.loginTime,
    }
  }


  openUserContainerTextField() {
    setTimeout(() => {
      this.openUserContainerTextfield.next(true);
    }, 10);
  }

  openUserContainerThreadTextField() {
    setTimeout(() => {
      this.openUserContainerThreadTextfield.next(true);
    }, 10);
  }

  // createEmptyUser(): User {
  //   return {
  //     name: "Guest",
  //     email: "",
  //     password: "",
  //     id: "",
  //     picture: "assets/img/avatars/profile.svg",
  //     online: false,
  //   }
  // }

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
      this.currentUser = JSON.parse(userJson) as User;
    } else {
      console.log('Kein currentUser im LocalStorage gefunden');
      this.currentUser = new User;
    }
   
  }

  /**This is for getting the collection "customers" from firebase */
  getUsersRef() {
    return collection(this.firestore, 'users');
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