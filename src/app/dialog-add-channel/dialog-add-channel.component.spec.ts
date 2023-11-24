import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogAddChannelComponent } from './dialog-add-channel.component';

describe('DialogAddChannelComponent', () => {
  let component: DialogAddChannelComponent;
  let fixture: ComponentFixture<DialogAddChannelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DialogAddChannelComponent]
    });
    fixture = TestBed.createComponent(DialogAddChannelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
