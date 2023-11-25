import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-thread',
  templateUrl: './thread.component.html',
  styleUrls: ['./thread.component.scss']
})
export class ThreadComponent {
  @Output() closeThread: EventEmitter<void> = new EventEmitter<void>();

  onCloseClick() {
    this.closeThread.emit();
  }
}
