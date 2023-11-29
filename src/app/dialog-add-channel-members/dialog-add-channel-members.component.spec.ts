import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogAddChannelMembersComponent } from './dialog-add-channel-members.component';

describe('DialogAddChannelMembersComponent', () => {
  let component: DialogAddChannelMembersComponent;
  let fixture: ComponentFixture<DialogAddChannelMembersComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DialogAddChannelMembersComponent]
    });
    fixture = TestBed.createComponent(DialogAddChannelMembersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
