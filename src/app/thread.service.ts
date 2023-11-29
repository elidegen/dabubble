import { Injectable } from '@angular/core';
import { UserData } from './interfaces/user-interface';
import { inject } from '@angular/core';
import { Firestore, collection, doc, collectionData, onSnapshot, addDoc, deleteDoc, updateDoc, } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Thread } from 'src/models/thread.class';
import { Channel } from 'src/models/channel.class';
import { UserService } from './user.service';
import { ChatService } from './chat.service';
import { Message } from 'src/models/message.class';


@Injectable({
  providedIn: 'root'
})

export class ThreadService {
  firestore: Firestore = inject(Firestore);
  threads: Thread[] = [];

  currentChat = new Channel();
  currentMessage = new Message();
  unsubList;

  constructor(public router: Router, public userService: UserService, public chatService: ChatService) {
    this.unsubList = this.subThreadList();
  }

  ngOnInit() {
  
    console.log("der currentchat ist:::", this.currentChat);
    console.log("die currentmessage ist ", this.currentMessage);
  }



  ngOnDestroy() {
if (this.unsubList) {
  this.unsubList();
}
      
    
    
  }


 

  async addThread(item: Thread) {
    if (this.currentMessage.id) {
    await addDoc(this.getThreadRef(this.currentMessage.id), item.toJSON()).catch(
      (err) => { console.log(err) }
    ).then(
      (docRef) => {
        console.log()
     
        console.log("Neuer Thread für die Message Id", this.currentMessage.id);
        console.log(item);
      }
    )
  }
  }



  subThreadList() {
    if (this.currentChat.id && this.currentMessage.id) {
      return onSnapshot(this.getThreadRef(this.currentMessage.id), (list) => {
        this.threads = [];
        list.forEach(element => {
          const threadData = element.data() as Thread; 
          const thread = new Thread(threadData); 
          this.threads.push(thread);
          console.log("threads sind vorhanden für  currentChat und currentMesage", this.currentChat.id,this.currentMessage);
          console.log("Thread", thread);
        });
      });
    } else {
      console.log('Current chat or message is not defined');
      return;
    }
  }
  


  setObjectData(obj: any,) {

    return {
      name: obj.name || "",
      email: obj.email || "",
      password: obj.password || "",
      id: obj.id,
      picture: obj.picture || "",
      online: obj.online || false,
    }
  }
 

  // async updateThread(colId: string, thread: Thread) {
  //   let docRef = this.getSingleDocRef(colId, thread);
  //   await updateDoc(docRef, this.getThreadData(thread)).catch(
  //     (error) => { console.log(error); }

  //   );
  //   console.log("User updated", thread);
  // }

  getThreadData(thread: Thread) {
    // Erstellen Sie eine neue Instanz von Thread, falls erforderlich
    const threadInstance = new Thread(thread);
  
    // Aktualisieren Sie die Eigenschaften des Thread-Objekts
    threadInstance.creator = thread.creator || "";
    threadInstance.creatorId = thread.creatorId || "";
    threadInstance.content = thread.content || "";
    threadInstance.time = thread.time || "";
    threadInstance.date = thread.date || "";
    threadInstance.timeInMs = thread.timeInMs || 0;
    threadInstance.profilePic = thread.profilePic || "";
    threadInstance.id = thread.id || "";
    threadInstance.reactionCount = thread.reactionCount || "";
    threadInstance.reaction = thread.reaction || [];
  
    return threadInstance;
  }

  // async updateThreadId(colId: string, thread: Thread, newId: string,) {
  //   thread.id = newId;
  //   await this.updateThread(colId, thread);
  // }

  // async deleteUser(colId: string, docId: string) {
  //   await deleteDoc(this.getSingleDocRef(colId, docId)).catch(

  //     (err) => { console.log(err); }
  //   )
  // }





 

  getThreadRef(messageId: string) {
    if (!this.currentChat || !this.currentChat.id) {
      throw new Error('Current chat is not defined');
    }
    if (!messageId) {
      throw new Error('Message ID is not defined');
    }
    return collection(this.firestore, `channels/${this.currentChat.id}/messages/${messageId}/threads`);
  }
  
 
  getSingleDocRef(messageId: string, docId: string) {
    if (!this.currentChat || !this.currentChat.id) {
      throw new Error('Current chat is not defined');
    }
    if (!messageId) {
      throw new Error('Message ID is not defined');
    }
      return doc(collection(this.firestore, `channels/${this.currentChat.id}/messages/${messageId}/threads`), docId);
    }
  
  }




