import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { ThreadService } from '../thread.service';
import { Thread } from 'src/models/thread.class';
import { Message } from 'src/models/message.class';
import { UserService } from '../user.service';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-thread',
  templateUrl: './thread.component.html',
  styleUrls: ['./thread.component.scss']
})

export class ThreadComponent implements OnInit {
 newThread = new Thread();
 threadContent = "";
  @Output() closeThread: EventEmitter<void> = new EventEmitter<void>();
  constructor(public threadService : ThreadService, public userService: UserService, public authService: AuthService) { 
    
   }


ngOnInit() {

}

addThread() {
  this.newThread.messageId = this.threadService.currentMessage.id;
  this.newThread.creator = this.userService.currentUser.name;
  this.newThread.creatorId = this.userService.currentUser.id;
  this.newThread.content = this.threadContent;
  this.newThread.id = this.authService.createId(10);
  this.newThread.profilePic = this.userService.currentUser.picture;
  this.newThread.reaction = [];
  this.newThread.reactionCount = 0;
  this.threadService.addThread(this.newThread);
  console.log("New Thread ", this.newThread);
  this.threadService.subThreadList();
}


getSentMessageDate() {
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString();
  this.newThread.date = formattedDate;
}

getSentMessageTime() {
  const currentTime = new Date();
  this.newThread.timeInMs = currentTime.getTime();

  const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  this.newThread.time = formattedTime;
}

  onCloseClick() {
    this.closeThread.emit();
  }
}
