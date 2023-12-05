import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DirectMessageChatComponent } from './direct-message-chat.component';

describe('DialogAddChannelMembersComponent', () => {
  let component: DirectMessageChatComponent;
  let fixture: ComponentFixture<DirectMessageChatComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DirectMessageChatComponent]
    });
    fixture = TestBed.createComponent(DirectMessageChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
