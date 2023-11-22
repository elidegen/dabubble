import { Injectable } from '@angular/core';
import { UserData } from './interfaces/user-interface';
import { inject } from '@angular/core';
import { Firestore, collection, doc, collectionData, onSnapshot,addDoc,deleteDoc,updateDoc} from '@angular/fire/firestore';
import { Timestamp } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})



export class UserService {

  firestore: Firestore = inject(Firestore);
  users: UserData[] = [];
 unsubList;
  ngOnInit() {
   
  }

  constructor() {
    this.unsubList = this.subCustomerList();
    // this.unsubSingle = onSnapshot(this.getSingleDocRef("users", "adsfasdf"), (element) => {
    // });

    // this.unsubSingle();

  
  }

  ngOnDestroy() {
    this.unsubList();
  }

  createCustomerDummys() {

  
}



  setUserData(obj:any, userid:string) {
     // Check if 'birthdate' is a Timestamp and convert to Date object
 
    return {
      name:  obj.name  || "",
      email: obj.email || "",
      id: obj.id || "",
      picture: obj.picture || "",
  }

}

  async addUser(item: UserData) {
    console.log("New Customer Added");
    await addDoc(this.getCustomersRef(),item).catch(
      (err) => {console.error}
    ).then (
      (docRef)=> {console.log("Document written with Id", docRef?.id)}
    )
  }


  subCustomerList() {
    return onSnapshot(this.getCustomersRef(), (list) => {
     this.users = [];
       list.forEach(element => {
         this.users.push(this.setUserData(element.data(),element.id));
         console.log("subCustomerList is triggered");
       })
     })
   }


 
    async deleteCustomer(colId: "customers", docId: string) {
    await  deleteDoc(this.getSingleDocRef(colId, docId)).catch (

      (err) => {console.log(err);}
    )

   }


   async updateUser(user: UserData) {
    if (user.id) {
      let docRef = this.getSingleDocRef('customers',user.id);
      await updateDoc(docRef, this.getUpdateData(user)).catch(
       
        (error) => { console.log(error); }
        
      );
     
    }
    console.log("Customer wurde geupdated mit ",user);
  }

  getUpdateData(user:UserData) {
    return {
      name:  user.name,
      email: user.email,
    
  }

}
  
  
  
  // getCleanJson(note: Note) {
  //    return {
  //     type: note.type,
  //     titel: note.titel,
  //     content: note.content,
  //     marked: note.marked,
  //    }
  // }
  // getColIdFromNote(customer: CustomerData) {
  //   if (note.type == 'note') {
  //     return 'Notes'
  //   } else {
  //     return 'Trash'
  //   }
  // }
  



  /**This is for getting the collection "customers" from firebase */
  getCustomersRef() {
    return collection(this.firestore, 'customers');

  }
  /**Here i get the Infos about a single customer, 
  
  * colId = the id from the collection, in this case probably "customers,"
  * doc id = the specific id from a customer.
  */
  getSingleDocRef(colId: string, docId: string) {
    return doc(collection(this.firestore, colId), docId);
  }

timestampToDate(timestamp:Timestamp): Date {
    return timestamp.toDate();
  }
}